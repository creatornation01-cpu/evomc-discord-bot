import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error('Command error:', err?.message || err);
        try {
          const msg = { content: '❌ There was an error executing that command.', ephemeral: true };
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(msg);
          } else {
            await interaction.reply(msg);
          }
        } catch {}
      }
      return;
    }

    // Button interactions
    if (interaction.isButton()) {
      const customId = interaction.customId;
      try {
        // Embed buttons — ephemeral response
        if (customId.startsWith('embed_btn_')) {
          const responseText = client.embedButtonResponses?.get(customId);
          await interaction.reply({ content: responseText || '✅ Button clicked!', ephemeral: true });
          return;
        }

        // Ticket create button
        if (customId.startsWith('ticket_create_')) {
          const categoryId = customId.replace('ticket_create_', '');
          const ticketCmd = client.commands.get('ticket');
          if (ticketCmd?.handleTicketCreate) {
            await ticketCmd.handleTicketCreate(interaction, client, categoryId);
          }
          return;
        }

        // Ticket close button
        if (customId === 'ticket_close') {
          const ticketCmd = client.commands.get('ticket');
          if (ticketCmd?.handleTicketClose) {
            await ticketCmd.handleTicketClose(interaction, client);
          }
          return;
        }

        // Giveaway enter button
        if (customId.startsWith('giveaway_enter_')) {
          const giveawayId = customId.replace('giveaway_enter_', '');
          const giveaway = client.giveaways.get(giveawayId);
          if (!giveaway) {
            await interaction.reply({ content: '❌ This giveaway has ended.', ephemeral: true });
            return;
          }
          if (giveaway.entries.has(interaction.user.id)) {
            await interaction.reply({ content: '⚠️ You have already entered this giveaway!', ephemeral: true });
            return;
          }
          giveaway.entries.add(interaction.user.id);
          await interaction.reply({ content: `🎉 You have entered the giveaway for **${giveaway.prize}**! Good luck!`, ephemeral: true });
          return;
        }
      } catch (err) {
        console.error('Button handler error:', err?.message || err);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
          }
        } catch {}
      }
      return;
    }

    // Modal submissions (ticket questions)
    if (interaction.isModalSubmit()) {
      try {
        if (interaction.customId.startsWith('ticket_modal_')) {
          const ticketCmd = client.commands.get('ticket');
          if (ticketCmd?.handleTicketModal) {
            await ticketCmd.handleTicketModal(interaction, client);
          }
        }
      } catch (err) {
        console.error('Modal handler error:', err?.message || err);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Something went wrong creating your ticket.', ephemeral: true });
          }
        } catch {}
      }
    }
  },
};
