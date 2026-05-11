import { EmbedBuilder } from 'discord.js';

export default {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel, client) {
    const guildId = newChannel.guild?.id;
    if (!guildId) return;

    const logs = client.logChannels?.get(guildId);
    if (!logs?.channel) return;

    const logCh = newChannel.guild.channels.cache.get(logs.channel);
    if (!logCh) return;

    const changes = [];
    if (oldChannel.name !== newChannel.name) changes.push(`**Name:** \`${oldChannel.name}\` → \`${newChannel.name}\``);
    if (oldChannel.topic !== newChannel.topic) changes.push(`**Topic:** ${oldChannel.topic || '*None*'} → ${newChannel.topic || '*None*'}`);
    if (oldChannel.nsfw !== newChannel.nsfw) changes.push(`**NSFW:** \`${oldChannel.nsfw}\` → \`${newChannel.nsfw}\``);
    if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) changes.push(`**Slowmode:** \`${oldChannel.rateLimitPerUser}s\` → \`${newChannel.rateLimitPerUser}s\``);

    if (!changes.length) return;

    const embed = new EmbedBuilder()
      .setTitle('✏️ Channel Updated')
      .setColor(0xFFAA00)
      .addFields(
        { name: '📢 Channel', value: `${newChannel} (\`${newChannel.name}\`)`, inline: true },
        { name: '🆔 Channel ID', value: `\`${newChannel.id}\``, inline: true },
        { name: '📝 Changes', value: changes.join('\n').slice(0, 1000), inline: false },
      )
      .setFooter({ text: 'Channel Logs • EvoMC Bot' })
      .setTimestamp();

    await logCh.send({ embeds: [embed] }).catch(() => {});
  },
};
