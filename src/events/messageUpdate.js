import { EmbedBuilder } from 'discord.js';

export default {
  name: 'messageUpdate',
  async execute(oldMsg, newMsg, client) {
    if (newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;

    const guildId = newMsg.guild?.id;
    if (!guildId) return;

    const logs = client.logChannels?.get(guildId);
    if (!logs?.message) return;

    const channel = newMsg.guild.channels.cache.get(logs.message);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('✏️ Message Edited')
      .setColor(0xFFAA00)
      .addFields(
        { name: '👤 Author', value: `${newMsg.author} (${newMsg.author.tag})`, inline: true },
        { name: '📍 Channel', value: `${newMsg.channel}`, inline: true },
        { name: '🔗 Jump', value: `[Click to view](${newMsg.url})`, inline: true },
        { name: '📝 Before', value: (oldMsg.content || '*No content*').slice(0, 1000), inline: false },
        { name: '📝 After', value: (newMsg.content || '*No content*').slice(0, 1000), inline: false },
      )
      .setFooter({ text: `Message ID: ${newMsg.id} • Message Logs` })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
