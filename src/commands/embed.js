import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create a rich embed message with optional buttons')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create an embed')
        .addStringOption(opt => opt.setName('title').setDescription('Embed title').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Embed description').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Hex color (e.g. #FF5733)'))
        .addStringOption(opt => opt.setName('footer').setDescription('Footer text'))
        .addStringOption(opt => opt.setName('thumbnail').setDescription('Thumbnail image URL'))
        .addStringOption(opt => opt.setName('image').setDescription('Main image URL'))
        .addChannelOption(opt => opt.setName('channel').setDescription('Where to send the embed'))
        .addStringOption(opt => opt.setName('button1_label').setDescription('Button 1 label'))
        .addStringOption(opt => opt.setName('button1_response').setDescription('Button 1 ephemeral response (only visible to clicker)'))
        .addStringOption(opt => opt.setName('button2_label').setDescription('Button 2 label'))
        .addStringOption(opt => opt.setName('button2_response').setDescription('Button 2 ephemeral response'))
        .addStringOption(opt => opt.setName('button3_label').setDescription('Button 3 label'))
        .addStringOption(opt => opt.setName('button3_response').setDescription('Button 3 ephemeral response'))),

  async execute(interaction, client) {
    if (interaction.options.getSubcommand() === 'create') {
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const colorStr = interaction.options.getString('color') || '#5865F2';
      const footer = interaction.options.getString('footer');
      const thumbnail = interaction.options.getString('thumbnail');
      const image = interaction.options.getString('image');
      const channel = interaction.options.getChannel('channel') || interaction.channel;

      const color = parseInt(colorStr.replace('#', ''), 16) || 0x5865F2;

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

      if (footer) embed.setFooter({ text: footer });
      if (thumbnail) embed.setThumbnail(thumbnail);
      if (image) embed.setImage(image);

      // Build buttons
      const buttons = [];
      if (!client.embedButtonResponses) client.embedButtonResponses = new Map();

      for (let i = 1; i <= 3; i++) {
        const label = interaction.options.getString(`button${i}_label`);
        const response = interaction.options.getString(`button${i}_response`);
        if (label) {
          const btnId = `embed_btn_${Date.now()}_${i}`;
          client.embedButtonResponses.set(btnId, response || `You clicked **${label}**!`);
          const styles = [ButtonStyle.Primary, ButtonStyle.Success, ButtonStyle.Secondary];
          buttons.push(
            new ButtonBuilder()
              .setCustomId(btnId)
              .setLabel(label)
              .setStyle(styles[i - 1])
          );
        }
      }

      const components = [];
      if (buttons.length > 0) {
        components.push(new ActionRowBuilder().addComponents(...buttons));
      }

      try {
        await channel.send({ embeds: [embed], components });
        await interaction.reply({ content: `✅ Embed sent to ${channel}!`, ephemeral: true });
      } catch {
        await interaction.reply({ content: '❌ Failed to send embed. Check permissions.', ephemeral: true });
      }
    }
  },
};
