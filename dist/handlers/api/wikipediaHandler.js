"use strict";
/**
 * Wikipedia Handler
 * Creates embeds and buttons for Wikipedia articles
 * @module handlers/api/wikipediaHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WikipediaHandler = exports.wikipediaHandler = void 0;
const discord_js_1 = require("discord.js");
// CONSTANTS
const COLORS = {
    WIKIPEDIA: 0xFFFFFF,
    ERROR: 0xFF0000,
    SUCCESS: 0x00FF00,
};
const WIKIPEDIA_ICON = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/103px-Wikipedia-logo-v2.svg.png';
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
// WIKIPEDIA HANDLER CLASS
/**
 * Handler for Wikipedia article embeds and components
 */
class WikipediaHandler {
    /**
     * Create article embed
     */
    createArticleEmbed(article) {
        // Handle missing article data
        if (!article) {
            return new discord_js_1.EmbedBuilder()
                .setColor(COLORS.ERROR)
                .setTitle('Article Not Found')
                .setDescription('Could not load this article. Please try again.');
        }
        const title = article.displayTitle || article.title || 'Unknown Article';
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(COLORS.WIKIPEDIA)
            .setAuthor({
            name: 'Wikipedia',
            iconURL: WIKIPEDIA_ICON,
            url: 'https://en.wikipedia.org',
        })
            .setTitle(title)
            .setTimestamp();
        // Only set URL if available
        if (article.url) {
            embed.setURL(article.url);
        }
        // Build description
        let description = '';
        if (article.description) {
            description = `*${article.description}*\n\n`;
        }
        description += this.truncate(article.extract, 1800 - description.length);
        embed.setDescription(description);
        // Add thumbnail
        if (article.thumbnail) {
            embed.setThumbnail(article.thumbnail);
        }
        // Add coordinates if available
        if (article.coordinates) {
            embed.addFields({
                name: '📍 Location',
                value: `[${article.coordinates.lat.toFixed(4)}, ${article.coordinates.lon.toFixed(4)}](https://www.google.com/maps?q=${article.coordinates.lat},${article.coordinates.lon})`,
                inline: true,
            });
        }
        // Footer with type indicator
        const typeLabel = article.type === 'disambiguation' ? '(Disambiguation Page)' : '';
        const langLabel = article.language ? `[${article.language.toUpperCase()}]` : '';
        embed.setFooter({ text: `Wikipedia ${langLabel} ${typeLabel}`.trim() });
        return embed;
    }
    /**
     * Create search results embed
     */
    createSearchResultsEmbed(query, results) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(COLORS.WIKIPEDIA)
            .setAuthor({
            name: 'Wikipedia Search',
            iconURL: WIKIPEDIA_ICON,
        })
            .setTitle(`🔍 Search: "${this.truncate(query, 50)}"`)
            .setTimestamp();
        if (results.length === 0) {
            embed.setDescription('No articles found. Try a different search term.');
            return embed;
        }
        const description = results.map((result, i) => {
            const desc = this.truncate(result.description, 100);
            return `**${i + 1}. [${result.title}](${result.url})**\n${desc}`;
        }).join('\n\n');
        embed.setDescription(description);
        embed.setFooter({ text: `Found ${results.length} articles` });
        return embed;
    }
    /**
     * Create random article embed (with special styling)
     */
    createRandomArticleEmbed(article) {
        const embed = this.createArticleEmbed(article);
        embed.setAuthor({
            name: '🎲 Random Wikipedia Article',
            iconURL: WIKIPEDIA_ICON,
            url: 'https://en.wikipedia.org/wiki/Special:Random',
        });
        return embed;
    }
    /**
     * Create "On This Day" embed
     */
    createOnThisDayEmbed(events, date) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(COLORS.WIKIPEDIA)
            .setAuthor({
            name: 'Wikipedia - On This Day',
            iconURL: WIKIPEDIA_ICON,
        })
            .setTitle(`📅 ${MONTH_NAMES[date.month - 1]} ${date.day}`)
            .setTimestamp();
        if (events.length === 0) {
            embed.setDescription('No events found for this date.');
            return embed;
        }
        const description = events.map(event => {
            const pageLinks = event.pages?.map(p => `[${p.title}](${p.url})`).join(', ') || '';
            return `**${event.year}** - ${this.truncate(event.text, 200)}${pageLinks ? `\n*Related: ${pageLinks}*` : ''}`;
        }).join('\n\n');
        embed.setDescription(description);
        return embed;
    }
    /**
     * Create article action buttons
     */
    createArticleButtons(article, userId) {
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel('Read on Wikipedia')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(article.url || 'https://en.wikipedia.org')
            .setEmoji('📖'), new discord_js_1.ButtonBuilder()
            .setCustomId(`wiki_random_${userId}`)
            .setLabel('Random Article')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('🎲'));
        // Add image button if original image exists
        if (article.originalImage) {
            row.addComponents(new discord_js_1.ButtonBuilder()
                .setLabel('View Image')
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(article.originalImage)
                .setEmoji('🖼️'));
        }
        return row;
    }
    /**
     * Create search result select menu
     */
    createSearchSelectMenu(results, userId) {
        if (results.length === 0)
            return null;
        const options = results.map((result, i) => ({
            label: this.truncate(result.title, 100),
            description: this.truncate(result.description, 100),
            value: `wiki_select_${i}_${userId}`,
            emoji: '📄',
        }));
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`wiki_search_${userId}`)
            .setPlaceholder('Select an article to view...')
            .addOptions(options));
    }
    /**
     * Create error embed
     */
    createErrorEmbed(message) {
        return new discord_js_1.EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setTitle('❌ Error')
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
            .setDescription(`Please wait **${remaining}s** before using this command again.`)
            .setTimestamp();
    }
    // PRIVATE HELPERS
    /**
     * Truncate text and clean HTML tags
     */
    truncate(text, maxLength) {
        if (!text)
            return '';
        // Clean HTML tags if any
        const clean = text.replace(/<[^>]*>/g, '');
        return clean.length > maxLength ? clean.substring(0, maxLength - 3) + '...' : clean;
    }
}
exports.WikipediaHandler = WikipediaHandler;
// Export singleton instance
const wikipediaHandler = new WikipediaHandler();
exports.wikipediaHandler = wikipediaHandler;
exports.default = wikipediaHandler;
//# sourceMappingURL=wikipediaHandler.js.map