"use strict";
/**
 * Auto-Mod Handler
 * Integrates auto-mod with message events
 * @module handlers/moderation/AutoModHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
exports.handleMessageUpdate = handleMessageUpdate;
exports.buildSettingsEmbed = buildSettingsEmbed;
exports.formatAction = formatAction;
const discord_js_1 = require("discord.js");
const Logger_js_1 = require("../../core/Logger.js");
const getDefault = (mod) => mod.default || mod;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AutoModService = getDefault(require('../../services/moderation/AutoModService'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const moderationConfig = getDefault(require('../../config/features/moderation'));
/**
 * Action type display mapping
 */
const ACTION_DISPLAYS = {
    'delete': '🗑️ Delete',
    'delete_warn': '🗑️⚠️ Delete + Warn',
    'warn': '⚠️ Warn',
    'mute': '🔇 Mute',
    'kick': '👢 Kick',
    'ban': '🔨 Ban'
};
/**
 * Handle message create event
 * @param client - Discord client (unused but passed by event)
 * @param message - Discord message
 * @returns Whether message was handled (deleted)
 */
async function handleMessage(client, message) {
    // Skip DMs and system messages
    if (!message.guild)
        return false;
    if (message.system)
        return false;
    if (message.author.bot)
        return false;
    try {
        // Process through auto-mod
        const violation = await AutoModService.processMessage(message);
        if (violation) {
            // Execute action
            const result = await AutoModService.executeAction(message, violation);
            // Send notification to channel (optional)
            if (result.warned && !result.deleted) {
                await sendViolationNotice(message, violation);
            }
            // Log violation
            Logger_js_1.logger.info('AutoMod', `${violation.type} | ${message.author.tag} | ${message.guild.name}: ${violation.trigger}`);
            return result.deleted;
        }
        return false;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger_js_1.logger.error('[AutoMod] Handler error:', errorMessage);
        return false;
    }
}
/**
 * Send a violation notice to the channel
 * @param message - Original message
 * @param violation - Violation details
 */
async function sendViolationNotice(message, violation) {
    try {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(moderationConfig.COLORS?.AUTOMOD || '#FFD700')
            .setDescription(`${moderationConfig.EMOJIS?.AUTOMOD || '🤖'} <@${message.author.id}>, your message was flagged: **${violation.trigger}**`)
            .setFooter({ text: 'Auto-Mod' })
            .setTimestamp();
        const channel = message.channel;
        const notice = await channel.send({ embeds: [embed] });
        // Auto-delete notice after 10 seconds
        setTimeout(() => {
            notice.delete().catch(() => { });
        }, 10000);
    }
    catch {
        // Channel might not allow sending
    }
}
/**
 * Handle message update event (edited messages)
 * @param oldMessage - Old message
 * @param newMessage - New message
 * @returns Whether message was handled
 */
async function handleMessageUpdate(oldMessage, newMessage) {
    // Only check if content changed
    if (oldMessage.content === newMessage.content)
        return false;
    // Re-check the edited message
    return handleMessage(null, newMessage);
}
/**
 * Build auto-mod settings embed
 * @param settings - Auto-mod settings
 * @param guild - Discord guild
 * @returns Settings embed
 */
function buildSettingsEmbed(settings, guild) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(settings.enabled ? 0x00FF00 : 0xFF0000)
        .setTitle(`${moderationConfig.EMOJIS?.AUTOMOD || '🤖'} Auto-Mod Settings`)
        .setDescription(settings.enabled
        ? '✅ Auto-Mod is **enabled**'
        : '❌ Auto-Mod is **disabled**')
        .setTimestamp();
    // Features status
    const features = [
        ['Spam Detection', settings.spam_enabled, `${settings.spam_threshold} msgs/${(settings.spam_window_ms || 5000) / 1000}s`],
        ['Duplicate Messages', settings.duplicate_enabled, `${settings.duplicate_threshold} duplicates`],
        ['Link Filter', settings.links_enabled, settings.links_action || 'delete'],
        ['Invite Filter', settings.invites_enabled, settings.invites_action || 'delete'],
        ['Mention Spam', settings.mention_enabled, `Max ${settings.mention_limit} mentions`],
        ['Caps Lock', settings.caps_enabled, `${settings.caps_percent}% threshold`]
    ];
    let featuresText = '';
    for (const [name, enabled, detail] of features) {
        const status = enabled ? '✅' : '❌';
        featuresText += `${status} **${name}**${enabled ? ` - ${detail}` : ''}\n`;
    }
    embed.addFields({ name: '🔧 Features', value: featuresText, inline: false });
    // Ignored channels
    if (settings.ignored_channels && settings.ignored_channels.length > 0) {
        const channels = settings.ignored_channels.slice(0, 5).map(id => `<#${id}>`).join(', ');
        const more = settings.ignored_channels.length > 5 ? ` +${settings.ignored_channels.length - 5} more` : '';
        embed.addFields({ name: '📍 Ignored Channels', value: channels + more, inline: true });
    }
    // Ignored roles
    if (settings.ignored_roles && settings.ignored_roles.length > 0) {
        const roles = settings.ignored_roles.slice(0, 5).map(id => `<@&${id}>`).join(', ');
        const more = settings.ignored_roles.length > 5 ? ` +${settings.ignored_roles.length - 5} more` : '';
        embed.addFields({ name: '👥 Ignored Roles', value: roles + more, inline: true });
    }
    // Log channel
    if (settings.log_channel_id) {
        embed.addFields({ name: '📝 Log Channel', value: `<#${settings.log_channel_id}>`, inline: true });
    }
    return embed;
}
/**
 * Format action type for display
 * @param action - Action type
 * @returns Formatted action string
 */
function formatAction(action) {
    return ACTION_DISPLAYS[action] || action;
}
// Default export for backward compatibility
exports.default = {
    handleMessage,
    handleMessageUpdate,
    buildSettingsEmbed,
    formatAction
};
//# sourceMappingURL=AutoModHandler.js.map