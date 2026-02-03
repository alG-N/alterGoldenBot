"use strict";
/**
 * Slowmode Command
 * Set channel slowmode
 * @module commands/admin/slowmode
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const getDefault = (mod) => mod.default || mod;
let lockdownService;
let moderationConfig;
try {
    lockdownService = getDefault(require('../../services/moderation/LockdownService'));
    moderationConfig = getDefault(require('../../config/features/moderation'));
}
catch {
    // Service not available
}
class SlowmodeCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.ADMIN,
            cooldown: 3,
            deferReply: false,
            userPermissions: [discord_js_1.PermissionFlagsBits.ManageChannels]
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('slowmode')
            .setDescription('⏱️ Set slowmode for channels')
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageChannels)
            .addSubcommand(sub => sub.setName('set')
            .setDescription('Set slowmode on a channel')
            .addIntegerOption(opt => opt.setName('duration')
            .setDescription('Slowmode duration in seconds (0 to disable)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(21600))
            .addChannelOption(opt => opt.setName('channel')
            .setDescription('Channel (current if not specified)')
            .addChannelTypes(discord_js_1.ChannelType.GuildText))
            .addStringOption(opt => opt.setName('reason')
            .setDescription('Reason for slowmode')
            .setMaxLength(500)))
            .addSubcommand(sub => sub.setName('off')
            .setDescription('Disable slowmode on a channel')
            .addChannelOption(opt => opt.setName('channel')
            .setDescription('Channel (current if not specified)')
            .addChannelTypes(discord_js_1.ChannelType.GuildText)))
            .addSubcommand(sub => sub.setName('server')
            .setDescription('⚠️ Set slowmode on ALL text channels')
            .addIntegerOption(opt => opt.setName('duration')
            .setDescription('Slowmode duration in seconds')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(21600)));
    }
    async run(interaction) {
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case 'set':
                await this._setSlowmode(interaction);
                break;
            case 'off':
                await this._disableSlowmode(interaction);
                break;
            case 'server':
                await this._serverSlowmode(interaction);
                break;
        }
    }
    /**
     * Set slowmode on a channel
     */
    async _setSlowmode(interaction) {
        const duration = interaction.options.getInteger('duration', true);
        const channel = (interaction.options.getChannel('channel') || interaction.channel);
        const reason = interaction.options.getString('reason') || 'Slowmode updated';
        await interaction.deferReply({ ephemeral: true });
        const result = await lockdownService?.setSlowmode?.(channel, duration, `${reason} | By: ${interaction.user.tag}`);
        if (result && !result.success) {
            await interaction.editReply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(moderationConfig?.COLORS?.ERROR || 0xFF0000)
                        .setDescription(`${moderationConfig?.EMOJIS?.ERROR || '❌'} ${result.error}`)
                ]
            });
            return;
        }
        const durationText = duration === 0
            ? 'disabled'
            : this._formatDuration(duration);
        await interaction.editReply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(duration === 0
                    ? (moderationConfig?.COLORS?.SUCCESS || 0x00FF00)
                    : (moderationConfig?.COLORS?.WARNING || 0xFFAA00))
                    .setDescription(duration === 0
                    ? `${moderationConfig?.EMOJIS?.SUCCESS || '✅'} Slowmode disabled in ${channel}`
                    : `⏱️ Slowmode set to **${durationText}** in ${channel}`)
            ]
        });
    }
    /**
     * Disable slowmode
     */
    async _disableSlowmode(interaction) {
        const channel = (interaction.options.getChannel('channel') || interaction.channel);
        await interaction.deferReply({ ephemeral: true });
        const result = await lockdownService?.setSlowmode?.(channel, 0, `Slowmode disabled by ${interaction.user.tag}`);
        if (result && !result.success) {
            await interaction.editReply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor(moderationConfig?.COLORS?.ERROR || 0xFF0000)
                        .setDescription(`${moderationConfig?.EMOJIS?.ERROR || '❌'} ${result.error}`)
                ]
            });
            return;
        }
        await interaction.editReply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(moderationConfig?.COLORS?.SUCCESS || 0x00FF00)
                    .setDescription(`${moderationConfig?.EMOJIS?.SUCCESS || '✅'} Slowmode disabled in ${channel}`)
            ]
        });
    }
    /**
     * Server-wide slowmode
     */
    async _serverSlowmode(interaction) {
        if (!interaction.guild) {
            await this.errorReply(interaction, 'This command can only be used in a server.');
            return;
        }
        const duration = interaction.options.getInteger('duration', true);
        await interaction.deferReply({ ephemeral: true });
        const results = await lockdownService?.setServerSlowmode?.(interaction.guild, duration, `Server slowmode by ${interaction.user.tag}`) || { success: [], failed: [] };
        const durationText = duration === 0
            ? 'disabled'
            : this._formatDuration(duration);
        await interaction.editReply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor(duration === 0
                    ? (moderationConfig?.COLORS?.SUCCESS || 0x00FF00)
                    : (moderationConfig?.COLORS?.WARNING || 0xFFAA00))
                    .setTitle(duration === 0
                    ? '✅ Server Slowmode Disabled'
                    : '⏱️ Server Slowmode Set')
                    .addFields({
                    name: 'Duration',
                    value: durationText,
                    inline: true
                }, {
                    name: 'Channels Updated',
                    value: `${results.success.length}`,
                    inline: true
                }, {
                    name: 'Failed',
                    value: `${results.failed.length}`,
                    inline: true
                })
                    .setTimestamp()
            ]
        });
    }
    /**
     * Format duration to human readable
     */
    _formatDuration(seconds) {
        if (seconds < 60)
            return `${seconds} seconds`;
        if (seconds < 3600)
            return `${Math.floor(seconds / 60)} minutes`;
        return `${Math.floor(seconds / 3600)} hours`;
    }
}
exports.default = new SlowmodeCommand();
//# sourceMappingURL=slowmode.js.map