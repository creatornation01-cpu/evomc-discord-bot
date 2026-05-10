import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('Set the bot prefix for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set a custom prefix')
        .addStringOption(opt =>
          opt.setName('prefix')
            .setDescription('New prefix (e.g. ! or $ or mc!)')
            .setRequired(true)
            .setMaxLength(5)))
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('Reset prefix to default (!)'))
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View current prefix')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'set') {
      const newPrefix = interaction.options.getString('prefix');
      client.prefixes.set(guildId, newPrefix);
      await interaction.reply({
        content: `✅ Prefix set to \`${newPrefix}\`! Use \`${newPrefix}help\` to try it.`,
        ephemeral: true,
      });

    } else if (sub === 'reset') {
      client.prefixes.set(guildId, '!');
      await interaction.reply({ content: '✅ Prefix reset to `!`.', ephemeral: true });

    } else if (sub === 'view') {
      const prefix = client.prefixes.get(guildId) || '!';
      await interaction.reply({ content: `📌 Current prefix: \`${prefix}\``, ephemeral: true });
    }
  },
};
