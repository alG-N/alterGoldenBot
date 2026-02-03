/**
 * Embed Utilities
 * Shared embed creation helpers
 * @module utils/common/embed
 */

import { EmbedBuilder, ColorResolvable } from 'discord.js';
// CONSTANTS
/**
 * Default colors for embeds
 */
export const EMBED_COLORS = {
    SUCCESS: '#00FF00' as ColorResolvable,
    ERROR: '#FF0000' as ColorResolvable,
    WARNING: '#FFA500' as ColorResolvable,
    INFO: '#00BFFF' as ColorResolvable,
    PRIMARY: '#5865F2' as ColorResolvable,
    LOADING: '#FFAA00' as ColorResolvable
} as const;
// EMBED CREATION FUNCTIONS
/**
 * Create an error embed
 * @param title - Error title
 * @param description - Error description
 * @param footerText - Optional footer
 */
export function createErrorEmbed(title: string, description: string, footerText: string | null = null): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
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
export function createSuccessEmbed(
    title: string, 
    description: string, 
    color: ColorResolvable = EMBED_COLORS.SUCCESS
): EmbedBuilder {
    return new EmbedBuilder()
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
export function createWarningEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(EMBED_COLORS.WARNING)
        .setTitle(`⚠️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Create an info embed
 * @param title - Info title
 * @param description - Info description
 */
export function createInfoEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(EMBED_COLORS.INFO)
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
export function createLoadingEmbed(
    title: string, 
    description: string, 
    thumbnailUrl: string | null = null
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.LOADING)
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
export function truncateText(text: string | null | undefined, maxLength: number = 4000): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format a number with K/M suffixes
 * @param num - Number to format
 */
export function formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

/**
 * Strip HTML tags from text
 * @param html - HTML string
 */
export function stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, '');
}

/**
 * Format a field value ensuring it fits Discord limits
 * @param value - Field value
 * @param maxLength - Max length (default 1024)
 */
export function formatFieldValue(value: unknown, maxLength: number = 1024): string {
    if (!value) return 'N/A';
    const str = String(value);
    return truncateText(str, maxLength) || 'N/A';
}

/**
 * Create a progress bar string
 * @param current - Current value
 * @param total - Total value
 * @param length - Bar length
 */
export function createProgressBar(current: number, total: number, length: number = 20): string {
    const percentage = Math.min(current / total, 1);
    const filled = Math.round(length * percentage);
    const empty = length - filled;
    
    return '▓'.repeat(filled) + '░'.repeat(empty);
}
