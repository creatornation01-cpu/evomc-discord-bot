import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt =>
      opt.setName('message')
        .setDescription('The message to send')
        .setRequired(true))
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to send in (defaults to current)')),

  async execute(interaction) {
    const text = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.send(text);
      await interaction.reply({ content: `✅ Message sent to ${channel}!`, ephemeral: true });
    } catch {
      await interaction.reply({ content: '❌ Could not send message to that channel.', ephemeral: true });
    }
  },
};
