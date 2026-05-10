import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { randomUUID } from 'crypto';

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const n = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * multipliers[unit];
}

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Giveaway management')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Start a giveaway')
        .addStringOption(opt => opt.setName('prize').setDescription('What are you giving away?').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 10m, 2h, 1d)').setRequired(true))
        .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1).setMaxValue(20))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel for the giveaway'))
        .addRoleOption(opt => opt.setName('required_role').setDescription('Role required to enter'))
        .addStringOption(opt => opt.setName('description').setDescription('Extra description')))
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('End a giveaway early')
        .addStringOption(opt => opt.setName('message_id').setDescription('The giveaway message ID').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('reroll')
        .setDescription('Reroll winners for a giveaway')
        .addStringOption(opt => opt.setName('message_id').setDescription('The giveaway message ID').setRequired(true))),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const durationStr = interaction.options.getString('duration');
      const winnersCount = interaction.options.getInteger('winners');
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      const requiredRole = interaction.options.getRole('required_role');
      const description = interaction.options.getString('description') || '';

      const duration = parseDuration(durationStr);
      if (!duration) {
        return interaction.reply({ content: '❌ Invalid duration. Use format like `10m`, `2h`, `1d`.', ephemeral: true });
      }

      const endsAt = new Date(Date.now() + duration);
      const giveawayId = randomUUID();

      const embed = new EmbedBuilder()
        .setTitle(`🎉 GIVEAWAY — ${prize}`)
        .setColor(0xFF6B6B)
        .setDescription(
          `${description ? description + '\n\n' : ''}` +
          `**Winners:** ${winnersCount}\n` +
          `**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R> (<t:${Math.floor(endsAt.getTime() / 1000)}:f>)\n` +
          `**Hosted by:** ${interaction.user}\n` +
          (requiredRole ? `**Required Role:** ${requiredRole}\n` : '') +
          `\nClick the button below to enter! 🎟️`
        )
        .setFooter({ text: `${winnersCount} winner(s) • Ends at` })
        .setTimestamp(endsAt);

      const enterBtn = new ButtonBuilder()
        .setCustomId(`giveaway_enter_${giveawayId}`)
        .setLabel('Enter Giveaway')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎉');

      const row = new ActionRowBuilder().addComponents(enterBtn);

      let giveawayMsg;
      try {
        giveawayMsg = await channel.send({ embeds: [embed], components: [row] });
      } catch {
        return interaction.reply({ content: '❌ Could not send giveaway to that channel.', ephemeral: true });
      }

      client.giveaways.set(giveawayId, {
        messageId: giveawayMsg.id,
        channelId: channel.id,
        prize,
        winnersCount,
        entries: new Set(),
        requiredRoleId: requiredRole?.id || null,
        endsAt,
        guildId: interaction.guild.id,
      });

      await interaction.reply({ content: `🎉 Giveaway started in ${channel}!`, ephemeral: true });

      // Auto-end
      setTimeout(() => endGiveaway(giveawayId, client), duration);

    } else if (sub === 'end') {
      const messageId = interaction.options.getString('message_id');
      let found = null;
      for (const [id, g] of client.giveaways.entries()) {
        if (g.messageId === messageId) { found = id; break; }
      }
      if (!found) return interaction.reply({ content: '❌ Giveaway not found.', ephemeral: true });
      await endGiveaway(found, client);
      await interaction.reply({ content: '✅ Giveaway ended!', ephemeral: true });

    } else if (sub === 'reroll') {
      const messageId = interaction.options.getString('message_id');
      let giveaway = null;
      for (const [, g] of client.giveaways.entries()) {
        if (g.messageId === messageId) { giveaway = g; break; }
      }
      if (!giveaway || !giveaway.ended) return interaction.reply({ content: '❌ Giveaway not found or not ended.', ephemeral: true });

      const entries = Array.from(giveaway.entries);
      if (entries.length === 0) return interaction.reply({ content: '❌ No entries to reroll.', ephemeral: true });
      const newWinner = entries[Math.floor(Math.random() * entries.length)];
      const ch = interaction.guild.channels.cache.get(giveaway.channelId);
      if (ch) await ch.send(`🎉 Reroll! New winner: <@${newWinner}>! Congratulations!`);
      await interaction.reply({ content: '✅ Rerolled!', ephemeral: true });
    }
  },
};

async function endGiveaway(giveawayId, client) {
  const giveaway = client.giveaways.get(giveawayId);
  if (!giveaway || giveaway.ended) return;
  giveaway.ended = true;

  const guild = client.guilds.cache.get(giveaway.guildId);
  const channel = guild?.channels.cache.get(giveaway.channelId);
  if (!channel) return;

  const entries = Array.from(giveaway.entries);

  if (entries.length === 0) {
    await channel.send(`🎉 The giveaway for **${giveaway.prize}** has ended! No one entered. 😢`);
    return;
  }

  const shuffled = entries.sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, Math.min(giveaway.winnersCount, entries.length));
  const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

  const embed = new EmbedBuilder()
    .setTitle(`🎊 GIVEAWAY ENDED — ${giveaway.prize}`)
    .setColor(0x57F287)
    .setDescription(`**Winner(s):** ${winnerMentions}\n**Prize:** ${giveaway.prize}\n**Total Entries:** ${entries.length}`)
    .setTimestamp();

  try {
    const msg = await channel.messages.fetch(giveaway.messageId);
    await msg.edit({ embeds: [embed], components: [] });
  } catch {}

  await channel.send(`🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
}
