import { EmbedBuilder } from 'discord.js';

const AI_BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
const AI_API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

// Animated emojis for autoresponder
const ANIMATED_EMOJIS = ['✨', '🌟', '⚡', '🎯', '🔥', '💫', '🎮', '🏆', '💎', '🚀'];

async function askGemini(question) {
  const systemPrompt = `You are EvoMC Bot, the official AI assistant for EvoMC — a popular Minecraft Java & Bedrock community server with IP: play.evo-mc.fun. 

You help players with:
- EvoMC server information (IP: play.evo-mc.fun, game modes, events, rules)
- General Minecraft questions (crafting, redstone, commands, survival tips, mods)
- Global general knowledge questions

Keep answers concise, friendly, and use Minecraft-themed language when appropriate. Use emojis occasionally. Max 400 words.`;

  const body = JSON.stringify({
    contents: [
      { role: 'user', parts: [{ text: systemPrompt + '\n\nUser question: ' + question }] }
    ],
    generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
  });

  const baseUrl = AI_BASE_URL?.replace(/\/$/, '');
  const url = `${baseUrl}/v1beta/models/gemini-2.5-flash:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': AI_API_KEY,
    },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
}

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    const guildId = message.guild?.id;
    const content = message.content;

    // ── AI Chat: $(question) ─────────────────────────────────────────────────
    if (content.startsWith('$(') && content.endsWith(')')) {
      const question = content.slice(2, -1).trim();
      if (!question) return;

      try {
        // Show typing indicator
        await message.channel.sendTyping();

        const answer = await askGemini(question);

        const embed = new EmbedBuilder()
          .setAuthor({ name: '🤖 EvoMC AI Assistant', iconURL: message.client.user.displayAvatarURL() })
          .setColor(0x5865F2)
          .addFields(
            { name: '❓ Question', value: question.slice(0, 500), inline: false },
            { name: '💡 Answer', value: answer.slice(0, 1000), inline: false },
          )
          .setFooter({ text: `Asked by ${message.author.tag} • Powered by Gemini AI`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      } catch (err) {
        console.error('AI error:', err.message);
        await message.reply({ content: '❌ AI is temporarily unavailable. Try again in a moment!', ephemeral: false });
      }
      return;
    }

    // ── Counting Bot ──────────────────────────────────────────────────────────
    if (client.countingConfigs) {
      const countConfig = client.countingConfigs.get(guildId);
      if (countConfig && message.channel.id === countConfig.channelId) {
        const num = parseInt(content.trim(), 10);
        const expected = countConfig.current + 1;

        if (isNaN(num) || num !== expected) {
          // Wrong number or not a number
          const prev = countConfig.current;
          countConfig.current = 0;
          countConfig.lastUserId = null;
          await message.react('❌').catch(() => {});
          await message.reply({
            embeds: [new EmbedBuilder()
              .setTitle('💥 Count Reset!')
              .setColor(0xFF4444)
              .setDescription(`${message.author} broke the count at **${prev}**!\nNext number is **1** — start again!`)
              .setFooter({ text: `🏆 High Score: ${countConfig.highScore}` })
              .setTimestamp()]
          });
          return;
        }

        if (countConfig.lastUserId === message.author.id) {
          // Same person counted twice
          countConfig.current = 0;
          countConfig.lastUserId = null;
          await message.react('❌').catch(() => {});
          await message.reply({
            embeds: [new EmbedBuilder()
              .setTitle('🚫 Count Reset!')
              .setColor(0xFF4444)
              .setDescription(`${message.author} counted twice in a row!\nNext number is **1** — start again!`)
              .setFooter({ text: '💡 Tip: Same person cannot count twice in a row!' })
              .setTimestamp()]
          });
          return;
        }

        // Correct count!
        countConfig.current = num;
        countConfig.lastUserId = message.author.id;
        if (num > countConfig.highScore) countConfig.highScore = num;

        await message.react('✅').catch(() => {});

        // Milestone messages
        if (num % 100 === 0) {
          await message.reply({
            embeds: [new EmbedBuilder()
              .setTitle(`🎉 Milestone: ${num}!`)
              .setColor(0xFFD700)
              .setDescription(`🏆 Amazing! The server has counted to **${num}**!\nKeep going!`)
              .setTimestamp()]
          });
        }
        return;
      }
    }

    // ── Auto-Reactions ────────────────────────────────────────────────────────
    const reactions = client.autoReactions?.get(guildId) || [];
    for (const ar of reactions) {
      if (!ar.keyword || content.toLowerCase().includes(ar.keyword.toLowerCase())) {
        for (const emoji of ar.emojis) {
          try { await message.react(emoji); } catch {}
        }
      }
    }

    // ── Auto-Responder ────────────────────────────────────────────────────────
    const responders = client.autoResponders?.get(guildId) || [];
    for (const r of responders) {
      if (content.toLowerCase().includes(r.trigger)) {
        const randomEmoji = ANIMATED_EMOJIS[Math.floor(Math.random() * ANIMATED_EMOJIS.length)];
        const embed = new EmbedBuilder()
          .setColor(r.color || 0x5865F2)
          .setDescription(`${randomEmoji} ${r.response}`)
          .setFooter({ text: 'EvoMC Auto-Responder' })
          .setTimestamp();

        if (r.title) embed.setTitle(r.title);

        await message.reply({ embeds: [embed] }).catch(() => {});
        break;
      }
    }

    // ── Minecraft bridge ──────────────────────────────────────────────────────
    const mcConfig = client.mcConfigs?.get(guildId);
    if (mcConfig && message.channel.id === mcConfig.discordChannelId && !message.webhookId) {
      console.log(`[MC Bridge] ${message.author.username}: ${content}`);
    }

    // ── Prefix commands ───────────────────────────────────────────────────────
    const prefix = client.prefixes?.get(guildId) || '!';
    if (!content.startsWith(prefix)) return;

    const args = content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
      await command.executePrefix(message, args, client);
    } catch (err) {
      console.error(err);
      await message.reply('❌ An error occurred running that command.');
    }
  },
};
