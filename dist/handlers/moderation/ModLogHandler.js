"use strict";
/**
 * Mod Log Handler
 * Formats and sends mod log messages
 * @module handlers/moderation/ModLogHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPE_EMOJIS = exports.TYPE_COLORS = void 0;
exports.handleMessageDelete = handleMessageDelete;
exports.handleMessageUpdate = handleMessageUpdate;
exports.handleMemberJoin = handleMemberJoin;
exports.handleMemberLeave = handleMemberLeave;
exports.buildQuickEmbed = buildQuickEmbed;
exports.sendConfirmation = sendConfirmation;
const discord_js_1 = require("discord.js");
const Logger_js_1 = require("../../core/Logger.js");
const time_js_1 = require("../../utils/common/time.js");
const getDefault = (mod) => mod.default || mod;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ModLogService = getDefault(require('../../services/moderation/ModLogService'));
/**
 * Type colors mapping
 */
exports.TYPE_COLORS = {
    warn: 0xFFCC00,
    mute: 0xFF9900,
    kick: 0xFF6600,
    ban: 0xFF0000,
    unmute: 0x00CC00,
    unban: 0x00FF00
};
/**
 * Type emojis mapping
 */
exports.TYPE_EMOJIS = {
    warn: '⚠️',
    mute: '🔇',
    kick: '👢',
    ban: '🔨',
    unmute: '🔊',
    unban: '🔓'
};
/**
 * Handle message delete event for logging
 * @param message - Deleted message
 */
async function handleMessageDelete(message) {
    if (!message.guild)
        return;
    if (message.partial)
        return; // Can't log partial messages
    if (message.author?.bot)
        return;
    try {
        // Try to get executor from audit log
        let executor = null;
        const auditLogs = await message.guild.fetchAuditLogs({
            type: discord_js_1.AuditLogEvent.MessageDelete,
            limit: 1
        }).catch(() => null);
        if (auditLogs?.entries.first()) {
            const entry = auditLogs.entries.first();
            // Check if this is the right message (within 5 seconds)
            if (Date.now() - entry.createdTimestamp < 5000 &&
                entry.target?.id === message.author.id) {
                executor = entry.executor;
            }
        }
        await ModLogService.logMessageDelete(message.guild, message, executor);
    }
    catch (error) {
        Logger_js_1.logger.error('[ModLogHandler] Error handling message delete:', String(error));
    }
}
/**
 * Handle message update event for logging
 * @param oldMessage - Old message
 * @param newMessage - New message
 */
async function handleMessageUpdate(oldMessage, newMessage) {
    if (!newMessage.guild)
        return;
    if (oldMessage.partial || newMessage.partial)
        return;
    if (newMessage.author?.bot)
        return;
    if (oldMessage.content === newMessage.content)
        return;
    try {
        await ModLogService.logMessageEdit(newMessage.guild, oldMessage, newMessage);
    }
    catch (error) {
        Logger_js_1.logger.error('[ModLogHandler] Error handling message update:', String(error));
    }
}
/**
 * Handle member join event for logging
 * @param member - Guild member
 */
async function handleMemberJoin(member) {
    try {
        await ModLogService.logMemberJoin(member);
    }
    catch (error) {
        Logger_js_1.logger.error('[ModLogHandler] Error handling member join:', String(error));
    }
}
/**
 * Handle member leave event for logging
 * @param member - Guild member
 */
async function handleMemberLeave(member) {
    try {
        await ModLogService.logMemberLeave(member);
    }
    catch (error) {
        Logger_js_1.logger.error('[ModLogHandler] Error handling member leave:', String(error));
    }
}
// formatDuration imported from utils/common/time.ts (canonical source)
/**
 * Build a quick mod action embed
 * @param options - Embed options
 * @returns Embed builder
 */
function buildQuickEmbed(options) {
    const { type, user, moderator, reason, duration, caseId, color } = options;
    const typeColor = exports.TYPE_COLORS[type] || 0x5865F2;
    const typeEmoji = exports.TYPE_EMOJIS[type] || '📋';
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    const authorName = `${typeEmoji} ${capitalizedType}${caseId ? ` | Case #${caseId}` : ''}`;
    const avatarUrl = 'displayAvatarURL' in user && typeof user.displayAvatarURL === 'function'
        ? user.displayAvatarURL()
        : undefined;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(color || typeColor)
        .setAuthor({
        name: authorName,
        iconURL: avatarUrl
    })
        .addFields({ name: 'User', value: `<@${user.id}>`, inline: true }, { name: 'Moderator', value: `<@${moderator.id}>`, inline: true })
        .setTimestamp();
    if (duration) {
        embed.addFields({ name: 'Duration', value: (0, time_js_1.formatDuration)(duration), inline: true });
    }
    if (reason) {
        embed.addFields({ name: 'Reason', value: reason, inline: false });
    }
    return embed;
}
/**
 * Send a confirmation embed to a channel
 * @param channel - Text channel
 * @param options - Embed options
 * @returns Sent message
 */
async function sendConfirmation(channel, options) {
    const embed = buildQuickEmbed(options);
    return channel.send({ embeds: [embed] });
}
// Default export for backward compatibility
exports.default = {
    handleMessageDelete,
    handleMessageUpdate,
    handleMemberJoin,
    handleMemberLeave,
    buildQuickEmbed,
    sendConfirmation,
    formatDuration: time_js_1.formatDuration
};
//# sourceMappingURL=ModLogHandler.js.map