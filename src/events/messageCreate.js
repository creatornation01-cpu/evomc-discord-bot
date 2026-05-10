export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    const guildId = message.guild?.id;

    // Auto-reactions
    const reactions = client.autoReactions.get(guildId) || [];
    for (const ar of reactions) {
      if (!ar.keyword || message.content.toLowerCase().includes(ar.keyword.toLowerCase())) {
        for (const emoji of ar.emojis) {
          try {
            await message.react(emoji);
          } catch {}
        }
      }
    }

    // Minecraft bridge: relay messages from MC bridge channel to MC server (webhook placeholder)
    const mcConfig = client.mcConfigs?.get(guildId);
    if (mcConfig && message.channel.id === mcConfig.discordChannelId && !message.webhookId) {
      // In a real setup you'd send this to your MC server RCON/WebSocket
      console.log(`[MC Bridge] ${message.author.username}: ${message.content}`);
    }

    // Prefix commands
    const prefix = client.prefixes.get(guildId) || '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
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
