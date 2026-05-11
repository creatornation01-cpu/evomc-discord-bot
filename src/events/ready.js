export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ EvoMC Bot is online as ${client.user.tag}`);
    client.user.setActivity('EvoMC Server 🎮', { type: 0 });

    const { REST, Routes } = await import('discord.js');
    const { readdirSync } = await import('fs');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const commands = [];
    const commandsPath = join(__dirname, '..', 'commands');
    const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const command = await import(filePath);
      if ('data' in command.default) {
        commands.push(command.default.data.toJSON());
      }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    const clientId = process.env.DISCORD_CLIENT_ID;

    try {
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );
      console.log(`✅ Registered ${commands.length} slash commands globally.`);
    } catch (err) {
      console.error('Failed to register commands:', err);
    }
  },
};
