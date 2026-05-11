import { EmbedBuilder } from 'discord.js';

export default {
  name: 'messageDelete',
  async execute(message, client) {
    if (message.author?.bot) return;

    const guildId = message.guild?.id;
    if (!guildId) return;

    const logs = client.logChannels?.get(guildId);
    if (!logs?.message) return;

    const channel = message.guild.channels.cache.get(logs.message);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Message Deleted')
      .setColor(0xFF4444)
      .addFields(
        { name: '👤 Author', value: message.author ? `${message.author} (${message.author.tag})` : 'Unknown', inline: true },
        { name: '📍 Channel', value: `${message.channel}`, inline: true },
        { name: '📝 Content', value: (message.content || '*No text content*').slice(0, 1000), inline: false },
      )
      .setFooter({ text: `Message ID: ${message.id} • Message Logs` })
      .setTimestamp();

    if (message.attachments?.size > 0) {
      const files = message.attachments.map(a => a.url).join('\n');
      embed.addFields({ name: '📎 Attachments', value: files.slice(0, 500) });
    }

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
