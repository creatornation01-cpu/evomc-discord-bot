import { EmbedBuilder } from 'discord.js';

export default {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const guildId = member.guild.id;
    const logs = client.logChannels?.get(guildId);
    if (!logs?.member) return;

    const channel = member.guild.channels.cache.get(logs.member);
    if (!channel) return;

    const roles = member.roles?.cache
      .filter(r => r.id !== member.guild.id)
      .map(r => `<@&${r.id}>`)
      .join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setTitle('📤 Member Left')
      .setColor(0xFF4444)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 User', value: `${member.user.tag}`, inline: true },
        { name: '🆔 User ID', value: `\`${member.user.id}\``, inline: true },
        { name: '📅 Joined', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
        { name: '👥 Total Members', value: `\`${member.guild.memberCount}\``, inline: true },
        { name: '🏷️ Roles', value: roles.slice(0, 1000), inline: false },
      )
      .setFooter({ text: 'Member Logs • EvoMC Bot' })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
