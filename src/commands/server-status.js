import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('server-status')
    .setDescription('Check EvoMC Minecraft server status (play.evo-mc.fun)'),

  async execute(interaction) {
    await interaction.deferReply();

    const MC_HOST = 'play.evo-mc.fun';

    try {
      const res = await fetch(`https://api.mcsrvstat.us/3/${MC_HOST}`, {
        headers: { 'User-Agent': 'EvoMC-Discord-Bot/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();

      if (data.online) {
        const players = data.players || {};
        const motd = data.motd?.clean?.join('\n') || 'EvoMC Minecraft Server';
        const version = data.version || 'Unknown';
        const playerCount = players.online ?? 0;
        const maxPlayers = players.max ?? 0;
        const playerList = players.list?.slice(0, 10).map(p => `• \`${p.name || p}\``).join('\n') || '';

        const bar = buildBar(playerCount, maxPlayers);

        const embed = new EmbedBuilder()
          .setTitle('<a:online:1> 🟢 EvoMC Server — ONLINE')
          .setColor(0x00FF7F)
          .setThumbnail(`https://api.mcsrvstat.us/icon/${MC_HOST}`)
          .addFields(
            { name: '🌐 IP Address', value: `\`${MC_HOST}\``, inline: true },
            { name: '📦 Version', value: `\`${version}\``, inline: true },
            { name: '👥 Players', value: `\`${playerCount}/${maxPlayers}\``, inline: true },
            { name: '📊 Server Load', value: bar, inline: false },
            { name: '📋 MOTD', value: motd, inline: false },
          )
          .setFooter({ text: 'EvoMC Bot • play.evo-mc.fun', iconURL: 'https://i.imgur.com/kzFDVGk.png' })
          .setTimestamp();

        if (playerList) {
          embed.addFields({ name: `🎮 Online Players (${playerCount})`, value: playerList });
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setTitle('🔴 EvoMC Server — OFFLINE')
          .setColor(0xFF4444)
          .setDescription('The server appears to be offline or unreachable.\nTry again in a few minutes or contact an admin.')
          .addFields({ name: '🌐 IP Address', value: `\`${MC_HOST}\`` })
          .setFooter({ text: 'EvoMC Bot • play.evo-mc.fun' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Status Check Failed')
        .setColor(0xFFAA00)
        .setDescription('Could not fetch server status. The status API may be down.\nPlease try again in a moment.')
        .addFields({ name: '🌐 Server IP', value: `\`${MC_HOST}\`` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};

function buildBar(current, max) {
  if (!max) return '`No data`';
  const filled = Math.round((current / max) * 20);
  const empty = 20 - filled;
  return `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\` ${current}/${max}`;
}
