import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const LOG_TYPES = ['message', 'member', 'role', 'channel', 'voice', 'mod'];

export default {
  data: new SlashCommandBuilder()
    .setName('setlogs')
    .setDescription('Configure server logging channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('message')
        .setDescription('Set channel for message logs (edit/delete)')
        .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('member')
        .setDescription('Set channel for member logs (join/leave/ban/kick)')
        .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('role')
        .setDescription('Set channel for role logs (create/update/delete)')
        .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('channel')
        .setDescription('Set channel for channel logs (create/update/delete)')
        .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('voice')
        .setDescription('Set channel for voice logs (join/leave/move)')
        .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('mod')
        .setDescription('Set channel for mod logs (ban/kick/mute/warn)')
        .addChannelOption(opt => opt.setName('channel').setDescription('Log channel').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View current log channel settings')
    )
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Disable a specific log type')
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Log type to disable')
            .setRequired(true)
            .addChoices(...LOG_TYPES.map(t => ({ name: t, value: t })))
        )
    ),

  async execute(interaction, client) {
    const guildId = interaction.guildId;
    if (!client.logChannels) client.logChannels = new Map();
    const guildLogs = client.logChannels.get(guildId) || {};

    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const embed = new EmbedBuilder()
        .setTitle('📋 Log Channel Configuration')
        .setColor(0x5865F2)
        .setDescription(LOG_TYPES.map(type => {
          const ch = guildLogs[type];
          return `**${type.charAt(0).toUpperCase() + type.slice(1)} Logs:** ${ch ? `<#${ch}>` : '❌ Not set'}`;
        }).join('\n'))
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'disable') {
      const type = interaction.options.getString('type');
      delete guildLogs[type];
      client.logChannels.set(guildId, guildLogs);
      return interaction.reply({ content: `✅ **${type}** logs disabled.`, ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    guildLogs[sub] = channel.id;
    client.logChannels.set(guildId, guildLogs);

    const embed = new EmbedBuilder()
      .setTitle('✅ Log Channel Set')
      .setColor(0x00FF7F)
      .setDescription(`**${sub.charAt(0).toUpperCase() + sub.slice(1)} logs** will now be sent to ${channel}`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
