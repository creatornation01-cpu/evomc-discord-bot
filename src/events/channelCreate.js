import { EmbedBuilder } from 'discord.js';

export default {
  name: 'channelCreate',
  async execute(channel, client) {
    const guildId = channel.guild?.id;
    if (!guildId) return;

    const logs = client.logChannels?.get(guildId);
    if (!logs?.channel) return;

    const logCh = channel.guild.channels.cache.get(logs.channel);
    if (!logCh) return;

    const embed = new EmbedBuilder()
      .setTitle('🆕 Channel Created')
      .setColor(0x00FF7F)
      .addFields(
        { name: '📢 Channel', value: `${channel} (\`${channel.name}\`)`, inline: true },
        { name: '🆔 Channel ID', value: `\`${channel.id}\``, inline: true },
        { name: '📁 Type', value: `\`${channel.type}\``, inline: true },
        { name: '📂 Category', value: channel.parent ? `\`${channel.parent.name}\`` : 'None', inline: true },
      )
      .setFooter({ text: 'Channel Logs • EvoMC Bot' })
      .setTimestamp();

    await logCh.send({ embeds: [embed] }).catch(() => {});
  },
};
