import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('minecraft')
    .setDescription('Minecraft server chat bridge setup')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Link a Discord channel to receive Minecraft chat')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel to relay MC chat into')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('server_name')
            .setDescription('Your Minecraft server name/IP (for display)')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Show current Minecraft bridge configuration'))
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Disable the Minecraft chat bridge')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (!client.mcConfigs) client.mcConfigs = new Map();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const serverName = interaction.options.getString('server_name');

      client.mcConfigs.set(guildId, {
        discordChannelId: channel.id,
        serverName,
      });

      const embed = new EmbedBuilder()
        .setTitle('⛏️ Minecraft Bridge Configured!')
        .setColor(0x2D7D46)
        .addFields(
          { name: '📺 Discord Channel', value: `${channel}`, inline: true },
          { name: '🖥️ MC Server', value: serverName, inline: true },
        )
        .setDescription(
          `The bridge is now set up! To relay messages from your Minecraft server:\n\n` +
          `**Step 1:** Install a chat relay plugin on your MC server (e.g. **DiscordSRV** for Bukkit/Spigot/Paper)\n\n` +
          `**Step 2:** Configure DiscordSRV with your bot token and set the channel ID to: \`${channel.id}\`\n\n` +
          `**Step 3:** Messages sent in your MC server will appear in ${channel}, and messages in ${channel} will appear in-game.\n\n` +
          `💡 **Recommended plugin:** [DiscordSRV](https://www.spigotmc.org/resources/discordsrv.18494/) — free, feature-rich Minecraft↔Discord bridge.`
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'status') {
      const config = client.mcConfigs.get(guildId);
      if (!config) {
        return interaction.reply({ content: '❌ No Minecraft bridge configured. Use `/minecraft setup` first.', ephemeral: true });
      }
      const ch = interaction.guild.channels.cache.get(config.discordChannelId);
      const embed = new EmbedBuilder()
        .setTitle('⛏️ Minecraft Bridge Status')
        .setColor(0x2D7D46)
        .addFields(
          { name: '📺 Channel', value: ch ? `${ch}` : `ID: ${config.discordChannelId}`, inline: true },
          { name: '🖥️ Server', value: config.serverName, inline: true },
          { name: '🟢 Status', value: 'Active', inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'disable') {
      client.mcConfigs.delete(guildId);
      await interaction.reply({ content: '✅ Minecraft bridge has been disabled.', ephemeral: true });
    }
  },
};
