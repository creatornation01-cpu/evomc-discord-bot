import { EmbedBuilder } from 'discord.js';

export default {
  name: 'roleUpdate',
  async execute(oldRole, newRole, client) {
    const guildId = newRole.guild.id;
    const logs = client.logChannels?.get(guildId);
    if (!logs?.role) return;

    const channel = newRole.guild.channels.cache.get(logs.role);
    if (!channel) return;

    const changes = [];
    if (oldRole.name !== newRole.name) changes.push(`**Name:** \`${oldRole.name}\` → \`${newRole.name}\``);
    if (oldRole.hexColor !== newRole.hexColor) changes.push(`**Color:** \`${oldRole.hexColor}\` → \`${newRole.hexColor}\``);
    if (oldRole.hoist !== newRole.hoist) changes.push(`**Hoisted:** \`${oldRole.hoist}\` → \`${newRole.hoist}\``);
    if (oldRole.mentionable !== newRole.mentionable) changes.push(`**Mentionable:** \`${oldRole.mentionable}\` → \`${newRole.mentionable}\``);

    if (!changes.length) return;

    const embed = new EmbedBuilder()
      .setTitle('✏️ Role Updated')
      .setColor(newRole.color || 0xFFAA00)
      .addFields(
        { name: '🏷️ Role', value: `${newRole} (\`${newRole.name}\`)`, inline: true },
        { name: '🆔 Role ID', value: `\`${newRole.id}\``, inline: true },
        { name: '📝 Changes', value: changes.join('\n'), inline: false },
      )
      .setFooter({ text: 'Role Logs • EvoMC Bot' })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
