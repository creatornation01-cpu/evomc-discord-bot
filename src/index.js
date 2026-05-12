import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('✅ EvoMC Bot is alive!');
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Keep-alive server running on port ${PORT}`);
});

const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
setInterval(() => {
  import('https').then(({ default: https }) => {
    import('http').then(({ default: http }) => {
      const lib = SELF_URL.startsWith('https') ? https : http;
      lib.get(SELF_URL, (res) => {
        console.log(`🔄 Self-ping OK (${res.statusCode}) — bot stays awake`);
      }).on('error', () => {});
    });
  });
}, 10 * 60 * 1000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands        = new Collection();
client.prefixCommands  = new Collection();
client.prefixes        = new Map();
client.autoReactions   = new Map();
client.autoRoles       = new Map();
client.giveaways       = new Map();
client.tickets         = new Map();
client.ticketConfigs   = new Map();
client.logChannels     = new Map();
client.countingConfigs = new Map();
client.autoResponders  = new Map();

const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  try {
    const command = await import(filePath);
    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);
    }
    if ('prefix' in command.default && 'executePrefix' in command.default) {
      client.prefixCommands.set(command.default.prefix, command.default);
    }
    console.log(`✅ Loaded command: ${file}`);
  } catch (err) {
    console.error(`❌ Failed to load command ${file}:`, err.message);
  }
}

const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  try {
    const event = await import(filePath);
    if (event.default.once) {
      client.once(event.default.name, (...args) => event.default.execute(...args, client));
    } else {
      client.on(event.default.name, (...args) => event.default.execute(...args, client));
    }
    console.log(`✅ Loaded event: ${file}`);
  } catch (err) {
    console.error(`❌ Failed to load event ${file}:`, err.message);
  }
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err?.message || err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err?.message || err);
});

console.log('🔐 Attempting Discord login...');
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('❌ Discord login FAILED:', err.message);
  process.exit(1);
});
