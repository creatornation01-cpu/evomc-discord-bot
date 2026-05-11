import { EmbedBuilder } from 'discord.js';

export default {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const guildId = newState.guild.id;
    const logs = client.logChannels?.get(guildId);
    if (!logs?.voice) return;

    const logChannel = newState.guild.channels.cache.get(logs.voice);
    if (!logChannel) return;

    const member = newState.member;
    let embed;

    if (!oldState.channel && newState.channel) {
      // Joined voice
      embed = new EmbedBuilder()
        .setTitle('🔊 Member Joined Voice')
        .setColor(0x00FF7F)
        .addFields(
          { name: '👤 Member', value: `${member.user} (${member.user.tag})`, inline: true },
          { name: '🔊 Channel', value: `\`${newState.channel.name}\``, inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Voice Logs • EvoMC Bot' })
        .setTimestamp();
    } else if (oldState.channel && !newState.channel) {
      // Left voice
      embed = new EmbedBuilder()
        .setTitle('🔇 Member Left Voice')
        .setColor(0xFF4444)
        .addFields(
          { name: '👤 Member', value: `${member.user} (${member.user.tag})`, inline: true },
          { name: '🔊 Channel', value: `\`${oldState.channel.name}\``, inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Voice Logs • EvoMC Bot' })
        .setTimestamp();
    } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      // Moved between channels
      embed = new EmbedBuilder()
        .setTitle('🔀 Member Moved Voice Channel')
        .setColor(0xFFAA00)
        .addFields(
          { name: '👤 Member', value: `${member.user} (${member.user.tag})`, inline: true },
          { name: '🔊 From', value: `\`${oldState.channel.name}\``, inline: true },
          { name: '🔊 To', value: `\`${newState.channel.name}\``, inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Voice Logs • EvoMC Bot' })
        .setTimestamp();
    } else {
      return; // Mute/deafen changes — skip
    }

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
