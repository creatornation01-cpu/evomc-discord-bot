export default {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guildId = member.guild.id;
    const roleIds = client.autoRoles.get(guildId) || [];
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
