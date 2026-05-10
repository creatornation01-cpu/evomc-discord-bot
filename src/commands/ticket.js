import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket panel management')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Set up a ticket panel')
        .addStringOption(opt => opt.setName('title').setDescription('Panel title').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Panel description').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post the panel').setRequired(true))
        .addChannelOption(opt => opt.setName('category').setDescription('Category for ticket channels').setRequired(true))
        .addRoleOption(opt => opt.setName('support_role').setDescription('Role that can see tickets').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Panel embed color (e.g. #00AAFF)'))
        .addStringOption(opt =>
          opt.setName('categories')
            .setDescription('Ticket categories (comma-separated, e.g. "Support,Billing,Appeals")')
        )
        .addStringOption(opt =>
          opt.setName('questions')
            .setDescription('Questions to ask on open (comma-separated, max 3)')
        )),

  async execute(interaction, client) {
    if (interaction.options.getSubcommand() === 'setup') {
      await interaction.deferReply({ ephemeral: true });

      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const panelChannel = interaction.options.getChannel('channel');
      const ticketCategory = interaction.options.getChannel('category');
      const supportRole = interaction.options.getRole('support_role');
      const colorStr = interaction.options.getString('color') || '#00AAFF';
      const categoriesRaw = interaction.options.getString('categories') || 'General Support';
      const questionsRaw = interaction.options.getString('questions') || '';

      const color = parseInt(colorStr.replace('#', ''), 16) || 0x00AAFF;
      const categories = categoriesRaw.split(',').map(c => c.trim()).filter(Boolean);
      const questions = questionsRaw.split(',').map(q => q.trim()).filter(Boolean).slice(0, 3);

      const guildId = interaction.guild.id;
      client.ticketConfigs.set(guildId, {
        categoryChannelId: ticketCategory.id,
        supportRoleId: supportRole.id,
        questions,
        ticketCounter: 0,
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎫 ${title}`)
        .setDescription(description)
        .setColor(color)
        .setFooter({ text: 'Click a button below to open a ticket' })
        .setTimestamp();

      const rows = [];
      const buttonsPerRow = 5;
      for (let i = 0; i < categories.length; i += buttonsPerRow) {
        const rowButtons = categories.slice(i, i + buttonsPerRow).map(cat =>
          new ButtonBuilder()
            .setCustomId(`ticket_create_${cat.replace(/ /g, '_')}`)
            .setLabel(cat)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
        );
        rows.push(new ActionRowBuilder().addComponents(...rowButtons));
      }

      try {
        await panelChannel.send({ embeds: [embed], components: rows });
        await interaction.editReply({ content: `✅ Ticket panel created in ${panelChannel}!` });
      } catch (err) {
        await interaction.editReply({ content: `❌ Failed: ${err.message}` });
      }
    }
  },

  async handleTicketCreate(interaction, client, categoryId) {
    const guildId = interaction.guild.id;
    const config = client.ticketConfigs.get(guildId);

    if (!config) {
      return interaction.reply({ content: '❌ Ticket system not configured.', ephemeral: true });
    }

    if (config.questions && config.questions.length > 0) {
      const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${categoryId}`)
        .setTitle('Open a Ticket');

      for (let i = 0; i < config.questions.length && i < 5; i++) {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`q${i}`)
              .setLabel(config.questions[i])
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      }
      await interaction.showModal(modal);
    } else {
      await this._createTicketChannel(interaction, client, categoryId, []);
    }
  },

  async handleTicketModal(interaction, client) {
    const categoryId = interaction.customId.replace('ticket_modal_', '');
    const answers = [];
    for (let i = 0; i < 5; i++) {
      try {
        const val = interaction.fields.getTextInputValue(`q${i}`);
        if (val) answers.push(val);
      } catch {}
    }
    await this._createTicketChannel(interaction, client, categoryId, answers);
  },

  async _createTicketChannel(interaction, client, categoryId, answers) {
    const guildId = interaction.guild.id;
    const config = client.ticketConfigs.get(guildId);
    if (!config) return;

    config.ticketCounter = (config.ticketCounter || 0) + 1;
    const ticketNum = String(config.ticketCounter).padStart(4, '0');
    const channelName = `ticket-${ticketNum}`;

    try {
      const category = interaction.guild.channels.cache.get(config.categoryChannelId);
      const supportRole = interaction.guild.roles.cache.get(config.supportRoleId);

      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category || null,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ...(supportRole ? [{ id: supportRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticketNum} — ${categoryId.replace(/_/g, ' ')}`)
        .setDescription(`Opened by ${interaction.user}\n\nSupport will be with you shortly.`)
        .setColor(0x00AAFF)
        .setTimestamp();

      if (answers.length > 0 && config.questions) {
        const fields = answers.map((ans, i) => ({
          name: config.questions[i] || `Question ${i + 1}`,
          value: ans,
        }));
        embed.addFields(fields);
      }

      const closeBtn = new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒');

      const row = new ActionRowBuilder().addComponents(closeBtn);
      await ticketChannel.send({
        content: `${interaction.user} ${supportRole ? supportRole : ''}`,
        embeds: [embed],
        components: [row],
      });

      client.tickets.set(ticketChannel.id, { userId: interaction.user.id, category: categoryId });

      await interaction.reply({
        content: `✅ Your ticket has been created: ${ticketChannel}`,
        ephemeral: true,
      });
    } catch (err) {
      const reply = { content: `❌ Failed to create ticket: ${err.message}`, ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  },

  async handleTicketClose(interaction, client) {
    const ticket = client.tickets.get(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });
    }

    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch {}
    }, 5000);
  },
};
