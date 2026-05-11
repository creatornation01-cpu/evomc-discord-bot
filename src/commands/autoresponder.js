import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('autoresponder')
    .setDescription('Auto-respond to keywords with embeds')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add an auto-response')
        .addStringOption(opt => opt.setName('trigger').setDescription('Trigger keyword/phrase').setRequired(true))
        .addStringOption(opt => opt.setName('response').setDescription('Response message').setRequired(true))
        .addStringOption(opt => opt.setName('title').setDescription('Embed title').setRequired(false))
        .addStringOption(opt => opt.setName('color').setDescription('Embed color (e.g. #FF0000)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove an auto-response')
        .addStringOption(opt => opt.setName('trigger').setDescription('Trigger keyword to remove').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all auto-responses')
    ),

  async execute(interaction, client) {
    if (!client.autoResponders) client.autoResponders = new Map();
    const guildId = interaction.guildId;
    const sub = interaction.options.getSubcommand();
    const responders = client.autoResponders.get(guildId) || [];

    if (sub === 'add') {
      const trigger = interaction.options.getString('trigger').toLowerCase();
      const response = interaction.options.getString('response');
      const title = interaction.options.getString('title') || null;
      const colorHex = interaction.options.getString('color') || '#5865F2';
      const color = parseInt(colorHex.replace('#', ''), 16) || 0x5865F2;

      const existing = responders.findIndex(r => r.trigger === trigger);
      if (existing !== -1) responders.splice(existing, 1);

      responders.push({ trigger, response, title, color });
      client.autoResponders.set(guildId, responders);

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle('✅ Auto-Responder Added')
          .setColor(0x00FF7F)
          .addFields(
            { name: '🔑 Trigger', value: `\`${trigger}\``, inline: true },
            { name: '💬 Response', value: response.slice(0, 200), inline: false },
          )
          .setTimestamp()],
        ephemeral: true,
      });
    } else if (sub === 'remove') {
      const trigger = interaction.options.getString('trigger').toLowerCase();
      const idx = responders.findIndex(r => r.trigger === trigger);
      if (idx === -1) {
        return interaction.reply({ content: `❌ No auto-responder found for \`${trigger}\``, ephemeral: true });
      }
      responders.splice(idx, 1);
      client.autoResponders.set(guildId, responders);
      await interaction.reply({ content: `✅ Auto-responder for \`${trigger}\` removed.`, ephemeral: true });
    } else if (sub === 'list') {
      if (!responders.length) {
        return interaction.reply({ content: '❌ No auto-responders set up yet.', ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setTitle('📋 Auto-Responders')
        .setColor(0x5865F2)
        .setDescription(responders.map((r, i) =>
          `**${i + 1}.** \`${r.trigger}\` → ${r.response.slice(0, 60)}${r.response.length > 60 ? '...' : ''}`
        ).join('\n'))
        .setFooter({ text: `${responders.length} auto-responder(s)` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
