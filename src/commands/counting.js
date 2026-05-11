import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('counting')
    .setDescription('Counting game setup')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Setup counting in a channel')
        .addChannelOption(opt => opt.setName('channel').setDescription('Counting channel').setRequired(true))
        .addIntegerOption(opt => opt.setName('start').setDescription('Starting number (default: 0)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Disable counting in this server')
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('View current counting status')
    ),

  async execute(interaction, client) {
    if (!client.countingConfigs) client.countingConfigs = new Map();
    const guildId = interaction.guildId;
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const start = interaction.options.getInteger('start') ?? 0;

      client.countingConfigs.set(guildId, {
        channelId: channel.id,
        current: start,
        lastUserId: null,
        highScore: 0,
      });

      const embed = new EmbedBuilder()
        .setTitle('🔢 Counting Setup Complete!')
        .setColor(0x00FF7F)
        .setDescription(`Counting game is now active in ${channel}!\n\nType **${start + 1}** to start counting!`)
        .addFields(
          { name: '📍 Channel', value: `${channel}`, inline: true },
          { name: '🔢 Starting From', value: `\`${start}\``, inline: true },
        )
        .setFooter({ text: 'Rules: Correct count = ✅ | Wrong = ❌ reset | Same person twice in a row = ❌' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const startEmbed = new EmbedBuilder()
        .setTitle('🔢 Counting Game Started!')
        .setColor(0x5865F2)
        .setDescription(`The counting game has been setup here!\n\nNext number: **${start + 1}**\n\n> Don't break the count! Same person cannot count twice in a row.`)
        .setTimestamp();

      await channel.send({ embeds: [startEmbed] });
    } else if (sub === 'disable') {
      client.countingConfigs.delete(guildId);
      await interaction.reply({ content: '✅ Counting game disabled.', ephemeral: true });
    } else if (sub === 'status') {
      const config = client.countingConfigs.get(guildId);
      if (!config) {
        return interaction.reply({ content: '❌ Counting is not setup in this server. Use `/counting setup`', ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setTitle('🔢 Counting Status')
        .setColor(0x5865F2)
        .addFields(
          { name: '📍 Channel', value: `<#${config.channelId}>`, inline: true },
          { name: '🔢 Current Count', value: `\`${config.current}\``, inline: true },
          { name: '🏆 High Score', value: `\`${config.highScore}\``, inline: true },
          { name: '➡️ Next Number', value: `\`${config.current + 1}\``, inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
