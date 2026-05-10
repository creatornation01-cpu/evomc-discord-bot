import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Automatically assign roles when members join')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a role to auto-assign on member join')
        .addRoleOption(opt =>
          opt.setName('role')
            .setDescription('Role to auto-assign')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a role from auto-assign')
        .addRoleOption(opt =>
          opt.setName('role')
            .setDescription('Role to remove from auto-assign')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all auto-assigned roles'))
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Remove all auto-roles')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (!client.autoRoles.has(guildId)) {
      client.autoRoles.set(guildId, []);
    }
    const roles = client.autoRoles.get(guildId);

    if (sub === 'add') {
      const role = interaction.options.getRole('role');

      if (role.managed) {
        return interaction.reply({ content: '❌ Cannot auto-assign bot/integration roles.', ephemeral: true });
      }
      if (role.id === interaction.guild.id) {
        return interaction.reply({ content: '❌ Cannot use @everyone.', ephemeral: true });
      }
      if (roles.includes(role.id)) {
        return interaction.reply({ content: `⚠️ ${role} is already in the auto-role list.`, ephemeral: true });
      }

      const botMember = interaction.guild.members.me;
      if (botMember.roles.highest.comparePositionTo(role) <= 0) {
        return interaction.reply({
          content: `❌ My highest role must be above ${role} in the role hierarchy to assign it.`,
          ephemeral: true,
        });
      }

      roles.push(role.id);
      await interaction.reply({ content: `✅ ${role} will now be assigned to new members.`, ephemeral: true });

    } else if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      const idx = roles.indexOf(role.id);
      if (idx === -1) {
        return interaction.reply({ content: `❌ ${role} is not in the auto-role list.`, ephemeral: true });
      }
      roles.splice(idx, 1);
      await interaction.reply({ content: `✅ ${role} removed from auto-roles.`, ephemeral: true });

    } else if (sub === 'list') {
      if (roles.length === 0) {
        return interaction.reply({ content: '📋 No auto-roles configured.', ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setTitle('🎭 Auto-Roles')
        .setColor(0x5865F2)
        .setDescription(
          roles.map((id, i) => {
            const role = interaction.guild.roles.cache.get(id);
            return `**${i + 1}.** ${role ? role : `Unknown role (${id})`}`;
          }).join('\n')
        )
        .setFooter({ text: 'These roles are assigned to members when they join' });
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === 'clear') {
      roles.splice(0, roles.length);
      await interaction.reply({ content: '✅ All auto-roles cleared.', ephemeral: true });
    }
  },
};
