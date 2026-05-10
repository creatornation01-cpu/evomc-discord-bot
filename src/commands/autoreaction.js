import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('autoreaction')
    .setDescription('Automatically react to messages with emojis')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add an auto-reaction rule')
        .addStringOption(opt =>
          opt.setName('emojis')
            .setDescription('Emojis to react with (space-separated, e.g. "👍 🔥 ✨")')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('keyword')
            .setDescription('Only react when message contains this word (leave blank for all messages)')))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove an auto-reaction rule')
        .addIntegerOption(opt =>
          opt.setName('index')
            .setDescription('Rule number to remove (use /autoreaction list to see numbers)')
            .setRequired(true)
            .setMinValue(1)))
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all auto-reaction rules'))
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Remove all auto-reaction rules')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (!client.autoReactions.has(guildId)) {
      client.autoReactions.set(guildId, []);
    }
    const reactions = client.autoReactions.get(guildId);

    if (sub === 'add') {
      const emojisRaw = interaction.options.getString('emojis');
      const keyword = interaction.options.getString('keyword') || null;
      const emojis = emojisRaw.trim().split(/\s+/).filter(Boolean).slice(0, 5);

      reactions.push({ emojis, keyword });
      await interaction.reply({
        content: `✅ Auto-reaction added!\n**Emojis:** ${emojis.join(' ')}\n**Trigger:** ${keyword ? `"${keyword}"` : 'All messages'}`,
        ephemeral: true,
      });

    } else if (sub === 'remove') {
      const index = interaction.options.getInteger('index') - 1;
      if (index < 0 || index >= reactions.length) {
        return interaction.reply({ content: `❌ Rule #${index + 1} does not exist.`, ephemeral: true });
      }
      const removed = reactions.splice(index, 1)[0];
      await interaction.reply({
        content: `✅ Removed rule: ${removed.emojis.join(' ')}${removed.keyword ? ` (trigger: "${removed.keyword}")` : ''}`,
        ephemeral: true,
      });

    } else if (sub === 'list') {
      if (reactions.length === 0) {
        return interaction.reply({ content: '📋 No auto-reactions set up.', ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setTitle('⚡ Auto-Reaction Rules')
        .setColor(0x5865F2)
        .setDescription(
          reactions.map((r, i) =>
            `**${i + 1}.** ${r.emojis.join(' ')} — Trigger: ${r.keyword ? `\`${r.keyword}\`` : 'All messages'}`
          ).join('\n')
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === 'clear') {
      reactions.splice(0, reactions.length);
      await interaction.reply({ content: '✅ All auto-reaction rules cleared.', ephemeral: true });
    }
  },
};
