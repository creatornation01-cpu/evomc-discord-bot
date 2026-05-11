import { EmbedBuilder } from 'discord.js';

export default {
  name: 'roleDelete',
  async execute(role, client) {
    const guildId = role.guild.id;
    const logs = client.logChannels?.get(guildId);
    if (!logs?.role) return;

    const channel = role.guild.channels.cache.get(logs.role);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Role Deleted')
      .setColor(0xFF4444)
      .addFields(
        { name: '🏷️ Role Name', value: `\`${role.name}\``, inline: true },
        { name: '🆔 Role ID', value: `\`${role.id}\``, inline: true },
        { name: '🎨 Color', value: `\`${role.hexColor}\``, inline: true },
      )
      .setFooter({ text: 'Role Logs • EvoMC Bot' })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
