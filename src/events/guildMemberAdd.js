import { EmbedBuilder } from 'discord.js';

export default {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guildId = member.guild.id;

    // Member join log
    const logs = client.logChannels?.get(guildId);
    if (logs?.member) {
      const channel = member.guild.channels.cache.get(logs.member);
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle('📥 Member Joined')
          .setColor(0x00FF7F)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '👤 User', value: `${member.user} (${member.user.tag})`, inline: true },
            { name: '🆔 User ID', value: `\`${member.user.id}\``, inline: true },
            { name: '📅 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '👥 Total Members', value: `\`${member.guild.memberCount}\``, inline: true },
          )
          .setFooter({ text: 'Member Logs • EvoMC Bot' })
          .setTimestamp();
        await channel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // Auto-roles
    const roleIds = client.autoRoles?.get(guildId) || [];
    for (const roleId of roleIds) {
      try {
        const role = member.guild.roles.cache.get(roleId);
        if (role) await member.roles.add(role);
      } catch (err) {
        console.error(`AutoRole error for ${roleId}:`, err.message);
      }
    }
  },
};
