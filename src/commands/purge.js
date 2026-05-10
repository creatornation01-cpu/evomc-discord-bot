import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Only delete messages from this user'))
    .addBooleanOption(opt =>
      opt.setName('bots')
        .setDescription('Only delete bot messages'))
    .addStringOption(opt =>
      opt.setName('contains')
        .setDescription('Only delete messages containing this text')),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');
    const botsOnly = interaction.options.getBoolean('bots');
    const contains = interaction.options.getString('contains');

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });

      let toDelete = [...messages.values()];

      // Filter: only messages less than 14 days old (Discord limit)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      toDelete = toDelete.filter(m => m.createdTimestamp > twoWeeksAgo);

      if (targetUser) toDelete = toDelete.filter(m => m.author.id === targetUser.id);
      if (botsOnly) toDelete = toDelete.filter(m => m.author.bot);
      if (contains) toDelete = toDelete.filter(m => m.content.toLowerCase().includes(contains.toLowerCase()));

      toDelete = toDelete.slice(0, amount);

      if (toDelete.length === 0) {
        return interaction.editReply('❌ No messages found matching your criteria (messages must be less than 14 days old).');
      }

      const deleted = await interaction.channel.bulkDelete(toDelete, true);

      await interaction.editReply(
        `🗑️ Successfully deleted **${deleted.size}** message${deleted.size !== 1 ? 's' : ''}${targetUser ? ` from ${targetUser.username}` : ''}.`
      );

      // Auto-delete the confirmation after 5 seconds
      setTimeout(async () => {
        try { await interaction.deleteReply(); } catch {}
      }, 5000);

    } catch (err) {
      await interaction.editReply(`❌ Failed to delete messages: ${err.message}`);
    }
  },
};
