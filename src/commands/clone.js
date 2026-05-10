import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clone')
    .setDescription('Clone emojis from another server into this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
    .addSubcommand(sub =>
      sub.setName('emoji')
        .setDescription('Clone an emoji by its ID or custom emoji syntax')
        .addStringOption(opt =>
          opt.setName('emoji')
            .setDescription('The custom emoji (paste it here, e.g. <:name:id> or <a:name:id>)')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Name for the cloned emoji (leave blank to keep original name)')))
    .addSubcommand(sub =>
      sub.setName('bulk')
        .setDescription('Clone multiple emojis at once')
        .addStringOption(opt =>
          opt.setName('emojis')
            .setDescription('Paste multiple emojis separated by spaces')
            .setRequired(true))),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();

    const parseEmoji = (str) => {
      const match = str.match(/<(a?):([^:]+):(\d+)>/);
      if (!match) return null;
      return { animated: match[1] === 'a', name: match[2], id: match[3] };
    };

    if (sub === 'emoji') {
      const emojiStr = interaction.options.getString('emoji');
      const customName = interaction.options.getString('name');
      const parsed = parseEmoji(emojiStr);

      if (!parsed) {
        return interaction.editReply('❌ Invalid emoji format. Use a custom emoji like `<:name:id>`.');
      }

      const ext = parsed.animated ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/emojis/${parsed.id}.${ext}`;
      const name = customName || parsed.name;

      try {
        const emoji = await interaction.guild.emojis.create({ attachment: url, name });
        await interaction.editReply(`✅ Successfully cloned emoji: ${emoji} \`${emoji.name}\``);
      } catch (err) {
        await interaction.editReply(`❌ Failed to clone emoji: ${err.message}`);
      }

    } else if (sub === 'bulk') {
      const raw = interaction.options.getString('emojis');
      const emojiRegex = /<a?:[^:]+:\d+>/g;
      const matches = raw.match(emojiRegex) || [];

      if (matches.length === 0) {
        return interaction.editReply('❌ No valid custom emojis found in your input.');
      }

      const results = [];
      for (const emojiStr of matches.slice(0, 10)) {
        const parsed = parseEmoji(emojiStr);
        if (!parsed) continue;
        const ext = parsed.animated ? 'gif' : 'png';
        const url = `https://cdn.discordapp.com/emojis/${parsed.id}.${ext}`;
        try {
          const emoji = await interaction.guild.emojis.create({ attachment: url, name: parsed.name });
          results.push(`✅ ${emoji} \`${emoji.name}\``);
        } catch (err) {
          results.push(`❌ \`${parsed.name}\`: ${err.message}`);
        }
      }

      await interaction.editReply(
        `**Emoji Clone Results (${results.length}/${matches.length}):**\n${results.join('\n')}`
      );
    }
  },
};
