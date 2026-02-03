"use strict";
/**
 * Embed Utilities
 * Shared embed creation helpers
 * @module utils/common/embed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMBED_COLORS = void 0;
exports.createErrorEmbed = createErrorEmbed;
exports.createSuccessEmbed = createSuccessEmbed;
exports.createWarningEmbed = createWarningEmbed;
exports.createInfoEmbed = createInfoEmbed;
exports.createLoadingEmbed = createLoadingEmbed;
exports.truncateText = truncateText;
exports.formatNumber = formatNumber;
exports.stripHtml = stripHtml;
exports.formatFieldValue = formatFieldValue;
exports.createProgressBar = createProgressBar;
const discord_js_1 = require("discord.js");
// CONSTANTS
/**
 * Default colors for embeds
 */
exports.EMBED_COLORS = {
    SUCCESS: '#00FF00',
    ERROR: '#FF0000',
    WARNING: '#FFA500',
    INFO: '#00BFFF',
    PRIMARY: '#5865F2',
    LOADING: '#FFAA00'
};
// EMBED CREATION FUNCTIONS
/**
 * Create an error embed
 * @param title - Error title
 * @param description - Error description
 * @param footerText - Optional footer
 */
function createErrorEmbed(title, description, footerText = null) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(exports.EMBED_COLORS.ERROR)
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setTimestamp();
    if (footerText) {
        embed.setFooter({ text: footerText });
    }
    return embed;
}
/**
 * Create a success embed
 * @param title - Success title
 * @param description - Success description
 * @param color - Optional custom color
 */
function createSuccessEmbed(title, description, color = exports.EMBED_COLORS.SUCCESS) {
    return new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp();
}
/**
 * Create a warning embed
 * @param title - Warning title
 * @param description - Warning description
 */
function createWarningEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(exports.EMBED_COLORS.WARNING)
        .setTitle(`⚠️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}
/**
 * Create an info embed
 * @param title - Info title
 * @param description - Info description
 */
function createInfoEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(exports.EMBED_COLORS.INFO)
        .setTitle(`ℹ️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}
/**
 * Create a loading embed
 * @param title - Loading title
 * @param description - Loading description
 * @param thumbnailUrl - Optional thumbnail
 */
function createLoadingEmbed(title, description, thumbnailUrl = null) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(exports.EMBED_COLORS.LOADING)
        .setTitle(`⏳ ${title}`)
        .setDescription(description)
        .setTimestamp();
    if (thumbnailUrl) {
        embed.setThumbnail(thumbnailUrl);
    }
    return embed;
}
// TEXT FORMATTING UTILITIES
/**
 * Truncate text to max length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 */
function truncateText(text, maxLength = 4000) {
    if (!text)
        return '';
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength - 3) + '...';
}
/**
 * Format a number with K/M suffixes
 * @param num - Number to format
 */
function formatNumber(num) {
    if (num === null || num === undefined)
        return '0';
    if (num >= 1000000)
        return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000)
        return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}
/**
 * Strip HTML tags from text
 * @param html - HTML string
 */
function stripHtml(html) {
    if (!html)
        return '';
    return html.replace(/<\/?[^>]+(>|$)/g, '');
}
/**
 * Format a field value ensuring it fits Discord limits
 * @param value - Field value
 * @param maxLength - Max length (default 1024)
 */
function formatFieldValue(value, maxLength = 1024) {
    if (!value)
        return 'N/A';
    const str = String(value);
    return truncateText(str, maxLength) || 'N/A';
}
/**
 * Create a progress bar string
 * @param current - Current value
 * @param total - Total value
 * @param length - Bar length
 */
function createProgressBar(current, total, length = 20) {
    const percentage = Math.min(current / total, 1);
    const filled = Math.round(length * percentage);
    const empty = length - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
}
//# sourceMappingURL=embed.js.map