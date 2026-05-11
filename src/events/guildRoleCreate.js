import { EmbedBuilder } from 'discord.js';

export default {
  name: 'roleCreate',
  async execute(role, client) {
    const guildId = role.guild.id;
    const logs = client.logChannels?.get(guildId);
    if (!logs?.role) return;

    const channel = role.guild.channels.cache.get(logs.role);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🆕 Role Created')
      .setColor(role.color || 0x5865F2)
      .addFields(
        { name: '🏷️ Role', value: `${role} (\`${role.name}\`)`, inline: true },
        { name: '🆔 Role ID', value: `\`${role.id}\``, inline: true },
        { name: '🎨 Color', value: `\`${role.hexColor}\``, inline: true },
        { name: '📌 Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: '💬 Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
      )
      .setFooter({ text: 'Role Logs • EvoMC Bot' })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
