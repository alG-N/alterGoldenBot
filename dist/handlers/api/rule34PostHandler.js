"use strict";
/**
 * Rule34 Post Handler
 * Handles embed creation and UI components for Rule34 posts
 * @module handlers/api/rule34PostHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SORT_DISPLAY = exports.CONTENT_EMOJIS = exports.RATING_EMOJIS = exports.RATING_COLORS = void 0;
exports.createPostEmbed = createPostEmbed;
exports.createPostButtons = createPostButtons;
exports.createVideoEmbed = createVideoEmbed;
exports.createSearchSummaryEmbed = createSearchSummaryEmbed;
exports.createNoResultsEmbed = createNoResultsEmbed;
exports.createErrorEmbed = createErrorEmbed;
exports.createBlacklistEmbed = createBlacklistEmbed;
exports.createFavoritesEmbed = createFavoritesEmbed;
exports.createSettingsEmbed = createSettingsEmbed;
exports.createSettingsComponents = createSettingsComponents;
exports.createRelatedTagsEmbed = createRelatedTagsEmbed;
exports.createHistoryEmbed = createHistoryEmbed;
exports.createAutoPlayEmbed = createAutoPlayEmbed;
const discord_js_1 = require("discord.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getDefault = (mod) => mod.default || mod;
const rule34Service = getDefault(require('../../services/api/rule34Service'));
const rule34Cache_1 = require("../../repositories/api/rule34Cache");
const embed_1 = require("../../utils/common/embed");
/**
 * Rating colors
 */
exports.RATING_COLORS = {
    safe: '#00FF00',
    questionable: '#FFD700',
    explicit: '#FF0000',
    default: '#9400D3'
};
/**
 * Rating emojis
 */
exports.RATING_EMOJIS = {
    safe: '🟢',
    questionable: '🟡',
    explicit: '🔴'
};
/**
 * Content type emojis
 */
exports.CONTENT_EMOJIS = {
    video: '🎬',
    gif: '🎞️',
    animated: '✨',
    comic: '📖',
    image: '🖼️'
};
/**
 * Sort mode display labels
 */
exports.SORT_DISPLAY = {
    'score:desc': '⬆️ Score (High to Low)',
    'score:asc': '⬇️ Score (Low to High)',
    'id:desc': '🆕 Newest First',
    'id:asc': '📅 Oldest First',
    'updated:desc': '🔄 Recently Updated',
    'random': '🎲 Random'
};
/**
 * Get time ago string from timestamp
 */
function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60)
        return 'just now';
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
/**
 * Create the main post embed
 */
async function createPostEmbed(post, options = {}) {
    const { resultIndex = 0, totalResults = 1, searchPage = 1, query = '', userId = '', showTags = false, compactMode = false } = options;
    const ratingColor = exports.RATING_COLORS[post.rating] || exports.RATING_COLORS.default;
    const ratingEmoji = exports.RATING_EMOJIS[post.rating] || '❓';
    const contentEmoji = exports.CONTENT_EMOJIS[post.contentType] || '🖼️';
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(ratingColor)
        .setTitle(`${contentEmoji} Post #${post.id}`)
        .setURL(post.pageUrl);
    // Build description
    let description = '';
    // Rating and basic info
    description += `${ratingEmoji} **Rating:** ${post.rating?.toUpperCase() || 'Unknown'}\n`;
    description += `⭐ **Score:** ${(0, embed_1.formatNumber)(post.score)}\n`;
    description += `📐 **Dimensions:** ${post.width} × ${post.height}`;
    if (post.isHighRes)
        description += ' 🔷';
    description += '\n';
    // Indicators
    const indicators = [];
    if (post.isAiGenerated)
        indicators.push('🤖 AI');
    if (post.isAnimated)
        indicators.push('✨ Animated');
    if (post.hasSound)
        indicators.push('🔊 Sound');
    if (post.hasVideo)
        indicators.push('🎬 Video');
    if (post.isHighQuality)
        indicators.push('💎 HQ');
    if (indicators.length > 0) {
        description += indicators.join(' • ') + '\n';
    }
    // Owner/uploader
    if (post.owner) {
        description += `👤 **Uploader:** ${post.owner}\n`;
    }
    // Source
    if (post.source && post.source.length > 0) {
        const sourceUrl = post.source.startsWith('http') ? post.source : 'https://' + post.source;
        description += `🔗 **Source:** [Link](${sourceUrl})\n`;
    }
    embed.setDescription(description);
    // Tags field (optional, for expanded view)
    if (showTags && post.tags) {
        const formattedTags = rule34Service.formatTagsForDisplay?.(post.tags, 1000) || post.tags.slice(0, 20).join(', ');
        embed.addFields({ name: '🏷️ Tags', value: formattedTags || 'No tags', inline: false });
    }
    // Set image (use sample for large files)
    const imageUrl = post.hasVideo ? post.previewUrl : (post.sampleUrl || post.fileUrl);
    if (imageUrl && !post.hasVideo) {
        embed.setImage(imageUrl);
    }
    else if (post.previewUrl) {
        embed.setThumbnail(post.previewUrl);
    }
    // Footer with navigation info
    const footerParts = [];
    footerParts.push(`Result ${resultIndex + 1}/${totalResults}`);
    if (searchPage > 1)
        footerParts.push(`Page ${searchPage}`);
    footerParts.push(`File: .${post.fileExtension}`);
    embed.setFooter({ text: footerParts.join(' • ') });
    embed.setTimestamp(post.createdAt ? new Date(post.createdAt) : new Date());
    // Create buttons
    const rows = createPostButtons(post, { resultIndex, totalResults, userId, searchPage });
    return { embed, rows };
}
/**
 * Create navigation and action buttons
 */
function createPostButtons(post, options = {}) {
    const { resultIndex = 0, totalResults = 1, userId = '', searchPage = 1 } = options;
    const rows = [];
    // Row 1: Navigation buttons
    const navRow = new discord_js_1.ActionRowBuilder();
    navRow.addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_prev_${userId}`)
        .setLabel('◀')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(resultIndex === 0 && searchPage === 1), new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_counter_${userId}`)
        .setLabel(`${resultIndex + 1}/${totalResults}`)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(true), new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_next_${userId}`)
        .setLabel('▶')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(resultIndex >= totalResults - 1), new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_random_${userId}`)
        .setLabel('🎲 Random')
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    rows.push(navRow);
    // Row 2: Action buttons
    const actionRow = new discord_js_1.ActionRowBuilder();
    // Full image link
    actionRow.addComponents(new discord_js_1.ButtonBuilder()
        .setLabel('Full Image')
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(post.fileUrl));
    // View on site
    actionRow.addComponents(new discord_js_1.ButtonBuilder()
        .setLabel('View on Site')
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(post.pageUrl));
    // Favorite button
    const isFavorited = rule34Cache_1.rule34Cache.isFavorited(userId, post.id);
    actionRow.addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_fav_${post.id}_${userId}`)
        .setLabel(isFavorited ? '💔' : '❤️')
        .setStyle(isFavorited ? discord_js_1.ButtonStyle.Danger : discord_js_1.ButtonStyle.Secondary));
    // Tags toggle
    actionRow.addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_tags_${userId}`)
        .setLabel('🏷️')
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    rows.push(actionRow);
    // Row 3: Page navigation (if needed)
    const pageRow = new discord_js_1.ActionRowBuilder();
    pageRow.addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_prevpage_${userId}`)
        .setLabel('⏮ Prev Page')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(searchPage <= 1), new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_pageinfo_${userId}`)
        .setLabel(`Page ${searchPage}`)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(true), new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_nextpage_${userId}`)
        .setLabel('Next Page ⏭')
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_related_${userId}`)
        .setLabel('🔗 Related')
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    rows.push(pageRow);
    return rows;
}
/**
 * Create video embed (for .mp4/.webm content)
 */
function createVideoEmbed(post, options = {}) {
    const { resultIndex = 0, totalResults = 1, userId = '' } = options;
    const ratingEmoji = exports.RATING_EMOJIS[post.rating] || '❓';
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(exports.RATING_COLORS[post.rating] || exports.RATING_COLORS.default)
        .setTitle(`🎬 Video Post #${post.id}`)
        .setURL(post.pageUrl)
        .setDescription(`${ratingEmoji} **Rating:** ${post.rating?.toUpperCase()}\n` +
        `⭐ **Score:** ${(0, embed_1.formatNumber)(post.score)}\n` +
        `📐 **Dimensions:** ${post.width} × ${post.height}\n` +
        `${post.hasSound ? '🔊 Has Sound' : '🔇 No Sound'}\n\n` +
        `📹 **Videos cannot be embedded directly.**\n` +
        `Click the button below to watch.`);
    if (post.previewUrl) {
        embed.setImage(post.previewUrl);
    }
    embed.setFooter({ text: `Result ${resultIndex + 1}/${totalResults} • File: .${post.fileExtension}` });
    // Create buttons with video-specific options
    const rows = createPostButtons(post, options);
    // Add video button to first action row
    const videoButton = new discord_js_1.ButtonBuilder()
        .setLabel('▶️ Watch Video')
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(post.fileUrl);
    // Insert at the beginning of action row
    if (rows[1]) {
        rows[1].components.unshift(videoButton);
        // Keep only 5 buttons max per row
        if (rows[1].components.length > 5) {
            rows[1].components.pop();
        }
    }
    return { embed, rows };
}
/**
 * Create search results summary embed
 */
function createSearchSummaryEmbed(results, query, options = {}) {
    const { page = 1, filters = {} } = options;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('#9400D3')
        .setTitle('🔍 Rule34 Search Results')
        .setDescription(`**Query:** \`${query || 'all'}\`\n` +
        `**Results Found:** ${results.posts.length}${results.hasMore ? '+' : ''}\n` +
        `**Page:** ${page}`);
    // Active filters
    const activeFilters = [];
    if (filters.excludeAi)
        activeFilters.push('🤖 AI Excluded');
    if (filters.rating)
        activeFilters.push(`${exports.RATING_EMOJIS[filters.rating]} ${filters.rating} only`);
    if (filters.minScore && filters.minScore > 0)
        activeFilters.push(`⭐ Score ≥${filters.minScore}`);
    if (filters.highQualityOnly)
        activeFilters.push('💎 HQ Only');
    if (filters.contentType)
        activeFilters.push(`📁 ${filters.contentType} only`);
    if (activeFilters.length > 0) {
        embed.addFields({ name: '⚙️ Active Filters', value: activeFilters.join(' • '), inline: false });
    }
    // Stats
    const stats = [];
    const aiCount = results.posts.filter(p => p.isAiGenerated).length;
    const videoCount = results.posts.filter(p => p.hasVideo).length;
    const animatedCount = results.posts.filter(p => p.isAnimated).length;
    if (aiCount > 0)
        stats.push(`🤖 ${aiCount} AI`);
    if (videoCount > 0)
        stats.push(`🎬 ${videoCount} Videos`);
    if (animatedCount > 0)
        stats.push(`✨ ${animatedCount} Animated`);
    if (stats.length > 0) {
        embed.addFields({ name: '📊 Content Stats', value: stats.join(' • '), inline: false });
    }
    return embed;
}
/**
 * Create no results embed
 */
function createNoResultsEmbed(query, suggestions = []) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('❌ No Results Found')
        .setDescription(`No posts found for: \`${query || 'your search'}\`\n\n` +
        '**Tips:**\n' +
        '• Check spelling and try alternative tags\n' +
        '• Use underscores instead of spaces (e.g., `blue_eyes`)\n' +
        '• Try broader or fewer tags\n' +
        '• Use the wildcard `*` for partial matches');
    if (suggestions.length > 0) {
        embed.addFields({
            name: '💡 Did you mean?',
            value: suggestions.slice(0, 5).map(s => `\`${s}\``).join(', '),
            inline: false
        });
    }
    return embed;
}
/**
 * Create error embed
 */
function createErrorEmbed(error, details = '') {
    return new discord_js_1.EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription(`An error occurred: ${error.message || 'Unknown error'}\n` +
        (details ? `\n${details}` : '') +
        '\n\nPlease try again later.')
        .setTimestamp();
}
/**
 * Create blacklist management embed
 */
function createBlacklistEmbed(userId, blacklist) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('#2F3136')
        .setTitle('🚫 Your Blacklist')
        .setDescription(blacklist.length > 0
        ? `You have **${blacklist.length}** blacklisted tag${blacklist.length > 1 ? 's' : ''}:`
        : '📭 Your blacklist is empty.\n\nUse `/rule34 blacklist add <tags>` to add tags you want to filter out.');
    if (blacklist.length > 0) {
        // Split tags into chunks for better display
        const tagDisplay = blacklist.map(t => `\`${t}\``).join(' ');
        embed.addFields({
            name: '🏷️ Blocked Tags',
            value: tagDisplay.length > 1024 ? tagDisplay.slice(0, 1020) + '...' : tagDisplay,
            inline: false
        });
        embed.addFields({
            name: '📝 Commands',
            value: '• `/rule34 blacklist add <tags>` - Add more tags\n' +
                '• `/rule34 blacklist remove <tags>` - Remove tags\n' +
                '• `/rule34 blacklist clear` - Clear all tags',
            inline: false
        });
    }
    // Suggested tags
    const suggestions = rule34Service.getBlacklistSuggestions?.()?.slice(0, 10) || [];
    if (suggestions.length > 0) {
        embed.addFields({
            name: '💡 Suggested Tags to Blacklist',
            value: suggestions.map((t) => `\`${t}\``).join(' '),
            inline: false
        });
    }
    embed.setFooter({ text: '💡 Blacklisted tags are automatically filtered from all searches' });
    return embed;
}
/**
 * Create favorites embed
 */
function createFavoritesEmbed(userId, favorites, page = 0) {
    const perPage = 10;
    const totalPages = Math.ceil(favorites.length / perPage);
    const start = page * perPage;
    const pageFavorites = favorites.slice(start, start + perPage);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle('💖 Your Favorites')
        .setDescription(favorites.length > 0
        ? `You have **${favorites.length}** favorited posts.`
        : '📭 No favorites yet.\n\nClick the ❤️ button on any post to add it to your favorites!');
    if (pageFavorites.length > 0) {
        const list = pageFavorites.map((fav, i) => `**${start + i + 1}.** [Post #${fav.id}](https://rule34.xxx/index.php?page=post&s=view&id=${fav.id})` +
            (fav.score ? ` ⭐${fav.score}` : '')).join('\n');
        embed.addFields({ name: `Page ${page + 1}/${totalPages}`, value: list, inline: false });
    }
    embed.setFooter({ text: `Page ${page + 1} of ${totalPages || 1}` });
    return embed;
}
/**
 * Create settings embed
 */
function createSettingsEmbed(userId) {
    const prefs = rule34Cache_1.rule34Cache.getPreferences(userId) || {};
    const blacklist = rule34Cache_1.rule34Cache.getBlacklist(userId) || [];
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⚙️ Rule34 Settings')
        .setDescription('Configure your search preferences using the menus below.\nSettings are saved automatically.');
    // Current settings display
    const aiStatus = prefs.aiFilter ? '✅ Hidden' : '❌ Shown';
    const qualityStatus = prefs.highQualityOnly
        ? '🔷 High Only'
        : (prefs.excludeLowQuality ? '🔶 No Low' : '⚪ All');
    const sortDisplay = exports.SORT_DISPLAY[prefs.sortMode] || prefs.sortMode || 'score:desc';
    const settingsText = [
        `🤖 **AI Content:** ${aiStatus}`,
        `⭐ **Min Score:** ${prefs.minScore || 0}`,
        `📊 **Quality:** ${qualityStatus}`,
        `📑 **Sort:** ${sortDisplay}`,
        `🚫 **Blacklist:** ${blacklist.length} tags`
    ].join('\n');
    embed.addFields({ name: '📋 Current Settings', value: settingsText, inline: false });
    // Tips
    embed.setFooter({ text: '💡 Tip: Use /rule34 blacklist to manage blocked tags' });
    return embed;
}
/**
 * Create settings select menu
 */
function createSettingsComponents(userId) {
    const prefs = rule34Cache_1.rule34Cache.getPreferences(userId) || {};
    const rows = [];
    // AI Filter toggle
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`rule34_setting_aifilter_${userId}`)
        .setPlaceholder('🤖 AI Content Filter')
        .addOptions([
        {
            label: 'Hide AI Content',
            description: 'Filter out AI-generated posts',
            value: 'true',
            emoji: '🚫',
            default: !!prefs.aiFilter
        },
        {
            label: 'Show AI Content',
            description: 'Include AI-generated posts',
            value: 'false',
            emoji: '✅',
            default: !prefs.aiFilter
        }
    ]));
    rows.push(row1);
    // Sort mode
    const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`rule34_setting_sort_${userId}`)
        .setPlaceholder('📑 Default Sort Order')
        .addOptions([
        {
            label: 'Score (High to Low)',
            description: 'Best rated posts first',
            value: 'score:desc',
            emoji: '⬆️',
            default: prefs.sortMode === 'score:desc'
        },
        {
            label: 'Score (Low to High)',
            description: 'Lowest rated posts first',
            value: 'score:asc',
            emoji: '⬇️',
            default: prefs.sortMode === 'score:asc'
        },
        {
            label: 'Newest First',
            description: 'Most recent posts first',
            value: 'id:desc',
            emoji: '🆕',
            default: prefs.sortMode === 'id:desc'
        },
        {
            label: 'Oldest First',
            description: 'Oldest posts first',
            value: 'id:asc',
            emoji: '📅',
            default: prefs.sortMode === 'id:asc'
        },
        {
            label: 'Random',
            description: 'Randomize results',
            value: 'random',
            emoji: '🎲',
            default: prefs.sortMode === 'random'
        }
    ]));
    rows.push(row2);
    // Quality settings
    const row3 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`rule34_setting_quality_${userId}`)
        .setPlaceholder('📊 Quality Filter')
        .addOptions([
        {
            label: 'Show All Quality',
            description: 'No quality filtering',
            value: 'all',
            emoji: '⚪',
            default: !prefs.excludeLowQuality && !prefs.highQualityOnly
        },
        {
            label: 'Exclude Low Quality',
            description: 'Hide low resolution posts',
            value: 'exclude_low',
            emoji: '🔶',
            default: !!prefs.excludeLowQuality
        },
        {
            label: 'High Quality Only',
            description: 'Only show HD posts',
            value: 'high_only',
            emoji: '🔷',
            default: !!prefs.highQualityOnly
        }
    ]));
    rows.push(row3);
    // Min score
    const row4 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`rule34_setting_minscore_${userId}`)
        .setPlaceholder('⭐ Minimum Score')
        .addOptions([
        { label: 'No Minimum', description: 'Show all posts regardless of score', value: '0', emoji: '0️⃣', default: prefs.minScore === 0 || !prefs.minScore },
        { label: 'Score ≥ 10', description: 'Filter very low scored posts', value: '10', emoji: '🔟', default: prefs.minScore === 10 },
        { label: 'Score ≥ 50', description: 'Only decent posts', value: '50', default: prefs.minScore === 50 },
        { label: 'Score ≥ 100', description: 'Only good posts', value: '100', emoji: '💯', default: prefs.minScore === 100 },
        { label: 'Score ≥ 500', description: 'Only popular posts', value: '500', emoji: '🔥', default: prefs.minScore === 500 },
        { label: 'Score ≥ 1000', description: 'Only top posts', value: '1000', emoji: '⭐', default: prefs.minScore === 1000 }
    ]));
    rows.push(row4);
    // Buttons row
    const row5 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_settings_reset_${userId}`)
        .setLabel('Reset All')
        .setStyle(discord_js_1.ButtonStyle.Danger)
        .setEmoji('🔄'), new discord_js_1.ButtonBuilder()
        .setCustomId(`rule34_settings_close_${userId}`)
        .setLabel('Done')
        .setStyle(discord_js_1.ButtonStyle.Success)
        .setEmoji('✅'));
    rows.push(row5);
    return rows;
}
/**
 * Create related tags embed
 */
function createRelatedTagsEmbed(originalTag, relatedTags) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`🔗 Tags Related to "${originalTag}"`)
        .setDescription(relatedTags.length > 0
        ? relatedTags.map(({ tag, count }) => `\`${tag}\` (${count} posts)`).join('\n')
        : 'No related tags found.');
    return embed;
}
/**
 * Create history embed
 */
function createHistoryEmbed(userId, history) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('📜 Your View History')
        .setDescription(history.length > 0
        ? `Your last **${history.length}** viewed posts:`
        : '📭 No view history yet.');
    if (history.length > 0) {
        const list = history.slice(0, 15).map((item, i) => {
            const timeAgo = getTimeAgo(item.viewedAt);
            return `**${i + 1}.** [Post #${item.id}](https://rule34.xxx/index.php?page=post&s=view&id=${item.id}) - ${timeAgo}`;
        }).join('\n');
        embed.addFields({ name: 'Recent Views', value: list, inline: false });
    }
    return embed;
}
/**
 * Create auto-play notification embed (utility function from original)
 */
function createAutoPlayEmbed(track) {
    return new discord_js_1.EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔄 Auto-Play')
        .setDescription(`Now playing: **${track?.info?.title || track?.title || 'Unknown'}**`)
        .setFooter({ text: 'Auto-play found a similar track' });
}
// Default export for backward compatibility
exports.default = {
    createPostEmbed,
    createVideoEmbed,
    createPostButtons,
    createSearchSummaryEmbed,
    createNoResultsEmbed,
    createErrorEmbed,
    createBlacklistEmbed,
    createFavoritesEmbed,
    createSettingsEmbed,
    createSettingsComponents,
    createRelatedTagsEmbed,
    createHistoryEmbed,
    createAutoPlayEmbed,
    RATING_COLORS: exports.RATING_COLORS,
    RATING_EMOJIS: exports.RATING_EMOJIS,
    CONTENT_EMOJIS: exports.CONTENT_EMOJIS,
    SORT_DISPLAY: exports.SORT_DISPLAY
};
//# sourceMappingURL=rule34PostHandler.js.map