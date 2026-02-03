"use strict";
/**
 * Google Search Handler
 * Creates embeds and buttons for search results
 * @module handlers/api/googleHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleHandler = exports.googleHandler = void 0;
const discord_js_1 = require("discord.js");
// CONSTANTS
const COLORS = {
    GOOGLE: 0x4285F4,
    DUCKDUCKGO: 0xDE5833,
    ERROR: 0xFF0000,
};
const ICONS = {
    Google: 'https://www.google.com/favicon.ico',
    DuckDuckGo: 'https://duckduckgo.com/favicon.ico',
};
// GOOGLE HANDLER CLASS
/**
 * Handler for Google/DuckDuckGo search results
 */
class GoogleHandler {
    /**
     * Create search results embed
     */
    createResultsEmbed(query, results, options = {}) {
        const { totalResults = 0, searchEngine = 'Google' } = options;
        const color = searchEngine === 'Google' ? COLORS.GOOGLE : COLORS.DUCKDUCKGO;
        const icon = ICONS[searchEngine];
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(color)
            .setAuthor({
            name: `${searchEngine} Search`,
            iconURL: icon,
        })
            .setTitle(`🔍 "${this.truncate(query, 50)}"`)
            .setTimestamp();
        if (results.length === 0) {
            embed.setDescription('No results found for your query. Try different keywords.');
            embed.setFooter({ text: 'No results' });
            return embed;
        }
        // Format results
        const description = results.map((result, i) => {
            const title = this.truncate(result.title, 60);
            const snippet = this.truncate(result.snippet, 150);
            const domain = result.displayLink || this.extractDomain(result.link);
            return `**${i + 1}. [${title}](${result.link})**\n${snippet}\n\`${domain}\``;
        }).join('\n\n');
        embed.setDescription(description);
        embed.setFooter({ text: `About ${this.formatNumber(totalResults)} results` });
        return embed;
    }
    /**
     * Create search buttons
     */
    createSearchButtons(query, searchEngine) {
        const url = searchEngine === 'Google'
            ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
            : `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel(`View more on ${searchEngine}`)
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(url)
            .setEmoji('🔗'), new discord_js_1.ButtonBuilder()
            .setLabel('Image Search')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(searchEngine === 'Google'
            ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
            : `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`)
            .setEmoji('🖼️'));
    }
    /**
     * Create error embed
     */
    createErrorEmbed(message) {
        return new discord_js_1.EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setTitle('❌ Search Error')
            .setDescription(message)
            .setTimestamp();
    }
    /**
     * Create cooldown embed
     */
    createCooldownEmbed(remaining) {
        return new discord_js_1.EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setTitle('⏳ Cooldown')
            .setDescription(`Please wait **${remaining}s** before searching again.`)
            .setTimestamp();
    }
    // PRIVATE HELPERS
    /**
     * Truncate text to max length
     */
    truncate(text, maxLength) {
        if (!text)
            return '';
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    }
    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        }
        catch {
            return url;
        }
    }
    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (!num)
            return '0';
        if (num >= 1_000_000_000)
            return (num / 1_000_000_000).toFixed(1) + 'B';
        if (num >= 1_000_000)
            return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000)
            return (num / 1_000).toFixed(1) + 'K';
        return num.toLocaleString();
    }
}
exports.GoogleHandler = GoogleHandler;
// Export singleton instance
const googleHandler = new GoogleHandler();
exports.googleHandler = googleHandler;
exports.default = googleHandler;
//# sourceMappingURL=googleHandler.js.map