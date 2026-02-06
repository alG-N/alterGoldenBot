"use strict";
/**
 * NHentai Handler
 * Creates embeds and buttons for nhentai command
 * @module handlers/api/nhentaiHandler
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NHentaiHandler = void 0;
const discord_js_1 = require("discord.js");
const nhentaiRepository_1 = __importDefault(require("../../repositories/api/nhentaiRepository"));
const CacheService_js_1 = __importDefault(require("../../cache/CacheService.js"));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getDefault = (mod) => mod.default || mod;
const nhentaiService = getDefault(require('../../services/api/nhentaiService'));
// CONSTANTS
const COLORS = {
    NHENTAI: 0xED2553,
    ERROR: 0xFF0000,
    SUCCESS: 0x00FF00,
    FAVOURITE: 0xFFD700
};
// NHENTAI HANDLER CLASS
class NHentaiHandler {
    CACHE_NS = 'api';
    SESSION_TTL = 600; // 10 minutes in seconds
    _cleanupInterval = null;
    constructor() {
        // Sessions are now managed by CacheService with Redis TTL — no local cleanup needed
    }
    /**
     * Create gallery info embed
     */
    createGalleryEmbed(gallery, options = {}) {
        const { isRandom = false, isPopular = false } = options;
        const { id, media_id, title, tags, num_pages, upload_date, images } = gallery;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(COLORS.NHENTAI)
            .setTitle(this._getTitle(title))
            .setURL(`https://nhentai.net/g/${id}/`)
            .setFooter({ text: `ID: ${id} • ${num_pages} pages • Uploaded: ${this._formatDate(upload_date)}` });
        // Set thumbnail (cover image)
        const coverType = images?.cover?.t || 'j';
        embed.setThumbnail(this._getThumbnailUrl(media_id, coverType));
        // Add author badge
        if (isRandom) {
            embed.setAuthor({ name: '🎲 Random Gallery' });
        }
        else if (isPopular) {
            embed.setAuthor({ name: '🔥 Popular Gallery' });
        }
        // Parse and add tags
        const parsedTags = this._parseTags(tags);
        const fields = [];
        if (parsedTags.artists.length > 0) {
            fields.push({ name: '🎨 Artist', value: this._formatTagList(parsedTags.artists), inline: true });
        }
        if (parsedTags.parodies.length > 0) {
            fields.push({ name: '📚 Parody', value: this._formatTagList(parsedTags.parodies), inline: true });
        }
        if (parsedTags.characters.length > 0) {
            fields.push({ name: '👤 Characters', value: this._formatTagList(parsedTags.characters), inline: true });
        }
        if (parsedTags.groups.length > 0) {
            fields.push({ name: '👥 Group', value: this._formatTagList(parsedTags.groups), inline: true });
        }
        if (parsedTags.languages.length > 0) {
            fields.push({ name: '🌐 Language', value: this._formatTagList(parsedTags.languages), inline: true });
        }
        if (parsedTags.categories.length > 0) {
            fields.push({ name: '📂 Category', value: this._formatTagList(parsedTags.categories), inline: true });
        }
        if (parsedTags.tags.length > 0) {
            fields.push({ name: '🏷️ Tags', value: this._formatTagList(parsedTags.tags, 500), inline: false });
        }
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        // Add Japanese title if different
        if (title.japanese && title.japanese !== title.english) {
            embed.setDescription(`*${title.japanese}*`);
        }
        return embed;
    }
    /**
     * Create page reader embed
     */
    createPageEmbed(gallery, pageNum) {
        const { id, media_id, title, num_pages, images } = gallery;
        const pages = images?.pages || [];
        if (pageNum < 1 || pageNum > pages.length) {
            return this.createErrorEmbed('Invalid page number.');
        }
        const page = pages[pageNum - 1];
        const imageUrl = this._getPageImageUrl(media_id, pageNum, page.t);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(COLORS.NHENTAI)
            .setAuthor({
            name: this._truncate(this._getTitle(title), 100),
            url: `https://nhentai.net/g/${id}/`
        })
            .setImage(imageUrl)
            .setFooter({ text: `Page ${pageNum}/${num_pages} • ID: ${id}` });
        return embed;
    }
    /**
     * Create main action buttons
     */
    async createMainButtons(galleryId, userId, numPages, _gallery = null) {
        // Check if user has favourited this gallery
        let isFavourited = false;
        try {
            isFavourited = await nhentaiRepository_1.default.isFavourited(userId, galleryId);
        }
        catch {
            // ignore
        }
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel('View on nhentai')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(`https://nhentai.net/g/${galleryId}/`)
            .setEmoji('🔗'), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_read_${galleryId}_${userId}`)
            .setLabel(`Read (${numPages} pages)`)
            .setStyle(discord_js_1.ButtonStyle.Success)
            .setEmoji('📖'), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_fav_${galleryId}_${userId}`)
            .setLabel(isFavourited ? 'Unfavourite' : 'Favourite')
            .setStyle(isFavourited ? discord_js_1.ButtonStyle.Danger : discord_js_1.ButtonStyle.Secondary)
            .setEmoji(isFavourited ? '💔' : '❤️'), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_random_${userId}`)
            .setLabel('Random')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('🎲'));
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_popular_${userId}`)
            .setLabel('Popular')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('🔥'), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_myfavs_${userId}`)
            .setLabel('My Favourites')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('📚'));
        return [row1, row2];
    }
    /**
     * Handle favourite toggle
     */
    async handleFavouriteToggle(userId, galleryId, gallery) {
        try {
            const result = await nhentaiRepository_1.default.toggleFavourite(userId, gallery);
            return result;
        }
        catch (error) {
            console.error('[NHentai] Error toggling favourite:', error);
            return { added: false, removed: false, error: error.message };
        }
    }
    /**
     * Create favourites list embed
     */
    async createFavouritesEmbed(userId, page = 1, perPage = 10) {
        const offset = (page - 1) * perPage;
        const favourites = await nhentaiRepository_1.default.getUserFavourites(userId, perPage, offset);
        const totalCount = await nhentaiRepository_1.default.getFavouritesCount(userId);
        const totalPages = Math.ceil(totalCount / perPage) || 1;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(COLORS.FAVOURITE)
            .setTitle('❤️ Your NHentai Favourites')
            .setFooter({ text: `Page ${page}/${totalPages} • Total: ${totalCount} favourites` });
        if (favourites.length === 0) {
            embed.setDescription('You have no favourites yet!\nClick the ❤️ button on any gallery to add it.');
        }
        else {
            let description = '';
            favourites.forEach((fav, index) => {
                const num = offset + index + 1;
                const favTitle = this._truncate(fav.gallery_title, 40);
                description += `**${num}.** \`${fav.gallery_id}\` - ${favTitle} (${fav.num_pages}p)\n`;
            });
            embed.setDescription(description);
        }
        return { embed, totalPages, totalCount };
    }
    /**
     * Create favourites navigation buttons
     */
    createFavouritesButtons(userId, currentPage, totalPages, favourites) {
        const rows = [];
        // Row 1: Quick view buttons (up to 5)
        if (favourites.length > 0) {
            const row1 = new discord_js_1.ActionRowBuilder();
            const firstFive = favourites.slice(0, 5);
            firstFive.forEach((fav, index) => {
                row1.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`nhentai_view_${fav.gallery_id}_${userId}`)
                    .setLabel(`${index + 1}`)
                    .setStyle(discord_js_1.ButtonStyle.Secondary));
            });
            rows.push(row1);
        }
        // Row 2: Navigation
        const navRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_favpage_prev_${userId}`)
            .setLabel('Prev')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('◀️')
            .setDisabled(currentPage <= 1), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_favpage_num_${userId}`)
            .setLabel(`${currentPage}/${totalPages}`)
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(true), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_favpage_next_${userId}`)
            .setLabel('Next')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('▶️')
            .setDisabled(currentPage >= totalPages), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_random_${userId}`)
            .setLabel('Random')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('🎲'));
        rows.push(navRow);
        return rows;
    }
    /**
     * Create page navigation buttons
     */
    createPageButtons(galleryId, userId, currentPage, totalPages) {
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_first_${galleryId}_${userId}`)
            .setLabel('First')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('⏮️')
            .setDisabled(currentPage <= 1), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_prev_${galleryId}_${userId}`)
            .setLabel('Prev')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('◀️')
            .setDisabled(currentPage <= 1), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_page_${galleryId}_${userId}`)
            .setLabel(`${currentPage}/${totalPages}`)
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(true), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_next_${galleryId}_${userId}`)
            .setLabel('Next')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('▶️')
            .setDisabled(currentPage >= totalPages), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_last_${galleryId}_${userId}`)
            .setLabel('Last')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('⏭️')
            .setDisabled(currentPage >= totalPages));
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_jump_${galleryId}_${userId}`)
            .setLabel('Jump to Page')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('🔢'), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_info_${galleryId}_${userId}`)
            .setLabel('Gallery Info')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('ℹ️'), new discord_js_1.ButtonBuilder()
            .setLabel('Open Page')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(`https://nhentai.net/g/${galleryId}/${currentPage}/`)
            .setEmoji('🔗'));
        return [row, row2];
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
    /**
     * Cache management for page reading sessions (shard-safe via CacheService)
     */
    async setPageSession(userId, gallery, currentPage = 1) {
        await CacheService_js_1.default.set(this.CACHE_NS, `nhentai:page:${userId}`, {
            galleryId: gallery.id,
            gallery,
            currentPage,
            totalPages: gallery.num_pages,
            expiresAt: Date.now() + this.SESSION_TTL * 1000
        }, this.SESSION_TTL);
    }
    async getPageSession(userId) {
        return CacheService_js_1.default.get(this.CACHE_NS, `nhentai:page:${userId}`);
    }
    async updatePageSession(userId, currentPage) {
        const session = await this.getPageSession(userId);
        if (session) {
            session.currentPage = currentPage;
            session.expiresAt = Date.now() + this.SESSION_TTL * 1000;
            await CacheService_js_1.default.set(this.CACHE_NS, `nhentai:page:${userId}`, session, this.SESSION_TTL);
        }
    }
    async clearPageSession(userId) {
        await CacheService_js_1.default.delete(this.CACHE_NS, `nhentai:page:${userId}`);
    }
    // Search session management (shard-safe via CacheService)
    async setSearchSession(userId, data) {
        await CacheService_js_1.default.set(this.CACHE_NS, `nhentai:search:${userId}`, {
            ...data,
            expiresAt: Date.now() + this.SESSION_TTL * 1000
        }, this.SESSION_TTL);
    }
    async getSearchSession(userId) {
        return CacheService_js_1.default.get(this.CACHE_NS, `nhentai:search:${userId}`);
    }
    /**
     * Create search results embed
     */
    createSearchResultsEmbed(query, data, page, sort) {
        const { results, numPages, totalResults } = data;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(COLORS.NHENTAI)
            .setTitle(`🔍 Search Results: "${query}"`)
            .setDescription(`Found **${totalResults}+** results • Page **${page}** of **${numPages}** • Sorted by **${sort === 'recent' ? 'Recent' : 'Popular'}**`)
            .setFooter({ text: 'Select a gallery to view more details' });
        // Show first 10 results
        const displayResults = results.slice(0, 10);
        let resultsList = '';
        displayResults.forEach((gallery, index) => {
            const galleryTitle = this._truncate(this._getTitle(gallery.title), 50);
            const pages = gallery.num_pages || '?';
            const galleryId = gallery.id;
            resultsList += `**${index + 1}.** \`${galleryId}\` - ${galleryTitle} (${pages}p)\n`;
        });
        if (resultsList) {
            embed.addFields({ name: '📚 Results', value: resultsList, inline: false });
        }
        return embed;
    }
    /**
     * Create search navigation buttons
     */
    createSearchButtons(query, data, page, userId) {
        const { results, numPages } = data;
        const row1 = new discord_js_1.ActionRowBuilder();
        // Add buttons for first 5 results
        const firstFive = results.slice(0, 5);
        firstFive.forEach((gallery, index) => {
            row1.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`nhentai_view_${gallery.id}_${userId}`)
                .setLabel(`${index + 1}`)
                .setStyle(discord_js_1.ButtonStyle.Secondary));
        });
        const row2 = new discord_js_1.ActionRowBuilder();
        // Add buttons for results 6-10
        const secondFive = results.slice(5, 10);
        if (secondFive.length > 0) {
            secondFive.forEach((gallery, index) => {
                row2.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`nhentai_view_${gallery.id}_${userId}`)
                    .setLabel(`${index + 6}`)
                    .setStyle(discord_js_1.ButtonStyle.Secondary));
            });
        }
        const row3 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_sprev_${userId}`)
            .setLabel('Prev Page')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('◀️')
            .setDisabled(page <= 1), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_spage_${userId}`)
            .setLabel(`${page}/${numPages}`)
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(true), new discord_js_1.ButtonBuilder()
            .setCustomId(`nhentai_snext_${userId}`)
            .setLabel('Next Page')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('▶️')
            .setDisabled(page >= numPages));
        const rows = [row1];
        if (secondFive.length > 0)
            rows.push(row2);
        rows.push(row3);
        return rows;
    }
    // Private helper methods
    _getTitle(title) {
        return title.english || title.japanese || title.pretty || 'Unknown Title';
    }
    _formatDate(timestamp) {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    /**
     * Get thumbnail URL using multiple CDN mirrors
     */
    _getThumbnailUrl(mediaId, coverType) {
        const ext = { 'j': 'jpg', 'p': 'png', 'g': 'gif' };
        const extension = ext[coverType] || 'jpg';
        return `https://t3.nhentai.net/galleries/${mediaId}/cover.${extension}`;
    }
    /**
     * Get page image URL using multiple CDN mirrors
     */
    _getPageImageUrl(mediaId, pageNum, pageType) {
        const ext = { 'j': 'jpg', 'p': 'png', 'g': 'gif' };
        const extension = ext[pageType] || 'jpg';
        return `https://i3.nhentai.net/galleries/${mediaId}/${pageNum}.${extension}`;
    }
    _parseTags(tags) {
        const result = {
            artists: [], characters: [], parodies: [],
            groups: [], tags: [], languages: [], categories: []
        };
        if (!tags || !Array.isArray(tags))
            return result;
        for (const tag of tags) {
            const type = tag.type;
            const key = (type + 's');
            if (key in result) {
                result[key].push(tag.name);
            }
            else if (type === 'tag') {
                result.tags.push(tag.name);
            }
        }
        // Limit each category
        for (const key in result) {
            result[key] = result[key].slice(0, 15);
        }
        return result;
    }
    _formatTagList(tags, maxLength = 300) {
        if (!tags || tags.length === 0)
            return 'None';
        let result = tags.join(', ');
        if (result.length > maxLength) {
            result = result.substring(0, maxLength - 3) + '...';
        }
        return result;
    }
    _truncate(text, maxLength) {
        if (!text)
            return '';
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    }
    /**
     * Handle button interactions for nhentai
     */
    async handleButton(interaction) {
        const parts = interaction.customId.split('_');
        const action = parts[1];
        const userId = parts[parts.length - 1];
        // Verify button owner
        if (userId !== interaction.user.id) {
            await interaction.reply({
                content: '❌ This button is not for you!',
                ephemeral: true
            });
            return;
        }
        try {
            await interaction.deferUpdate();
            switch (action) {
                case 'view': {
                    const galleryId = parts[2];
                    const result = await nhentaiService.fetchGallery(galleryId);
                    if (!result.success || !result.data) {
                        await interaction.editReply({
                            embeds: [this.createErrorEmbed('Gallery not found')],
                            components: []
                        });
                        return;
                    }
                    const gallery = result.data;
                    const embed = this.createGalleryEmbed(gallery);
                    const rows = await this.createMainButtons(gallery.id, userId, gallery.num_pages, gallery);
                    await interaction.editReply({ embeds: [embed], components: rows });
                    break;
                }
                case 'read': {
                    const galleryId = parts[2];
                    const session = await this.getPageSession(userId);
                    let gallery = session?.gallery;
                    if (!gallery || gallery.id !== parseInt(galleryId)) {
                        const result = await nhentaiService.fetchGallery(galleryId);
                        if (!result.success || !result.data) {
                            await interaction.editReply({
                                embeds: [this.createErrorEmbed('Gallery not found')],
                                components: []
                            });
                            return;
                        }
                        gallery = result.data;
                        await this.setPageSession(userId, gallery, 1);
                    }
                    const pageEmbed = this.createPageEmbed(gallery, 1);
                    const pageRows = this.createPageButtons(parseInt(galleryId), userId, 1, gallery.num_pages);
                    await interaction.editReply({ embeds: [pageEmbed], components: pageRows });
                    break;
                }
                case 'prev':
                case 'next':
                case 'first':
                case 'last': {
                    const session = await this.getPageSession(userId);
                    if (!session) {
                        await interaction.editReply({
                            embeds: [this.createErrorEmbed('Session expired. Please start again.')],
                            components: []
                        });
                        return;
                    }
                    let newPage = session.currentPage;
                    if (action === 'prev')
                        newPage = Math.max(1, newPage - 1);
                    else if (action === 'next')
                        newPage = Math.min(session.totalPages, newPage + 1);
                    else if (action === 'first')
                        newPage = 1;
                    else if (action === 'last')
                        newPage = session.totalPages;
                    await this.updatePageSession(userId, newPage);
                    const pageEmbed = this.createPageEmbed(session.gallery, newPage);
                    const pageRows = this.createPageButtons(session.galleryId, userId, newPage, session.totalPages);
                    await interaction.editReply({ embeds: [pageEmbed], components: pageRows });
                    break;
                }
                case 'info': {
                    const galleryId = parts[2];
                    const result = await nhentaiService.fetchGallery(galleryId);
                    if (!result.success || !result.data) {
                        await interaction.editReply({
                            embeds: [this.createErrorEmbed('Gallery not found')],
                            components: []
                        });
                        return;
                    }
                    const gallery = result.data;
                    const embed = this.createGalleryEmbed(gallery);
                    const rows = await this.createMainButtons(parseInt(galleryId), userId, gallery.num_pages, gallery);
                    await interaction.editReply({ embeds: [embed], components: rows });
                    break;
                }
                case 'fav': {
                    const galleryId = parts[2];
                    const session = await this.getPageSession(userId);
                    let gallery = session?.gallery;
                    if (!gallery || gallery.id !== parseInt(galleryId)) {
                        const result = await nhentaiService.fetchGallery(galleryId);
                        if (!result.success || !result.data) {
                            await interaction.followUp({ content: '❌ Gallery not found', ephemeral: true });
                            return;
                        }
                        gallery = result.data;
                    }
                    const isFav = await nhentaiRepository_1.default.isFavourited(userId, parseInt(galleryId));
                    if (isFav) {
                        await nhentaiRepository_1.default.removeFavourite(userId, parseInt(galleryId));
                        await interaction.followUp({ content: '💔 Removed from favourites', ephemeral: true });
                    }
                    else {
                        if (!gallery) {
                            await interaction.followUp({ content: '❌ Cannot add to favourites - gallery data unavailable', ephemeral: true });
                            return;
                        }
                        await nhentaiRepository_1.default.addFavourite(userId, gallery);
                        await interaction.followUp({ content: '❤️ Added to favourites!', ephemeral: true });
                    }
                    break;
                }
                case 'sprev':
                case 'snext': {
                    const searchSession = await this.getSearchSession(userId);
                    if (!searchSession) {
                        await interaction.editReply({
                            embeds: [this.createErrorEmbed('Search session expired. Please search again.')],
                            components: []
                        });
                        return;
                    }
                    const newPage = action === 'sprev'
                        ? Math.max(1, (searchSession.currentPage || 1) - 1)
                        : Math.min(searchSession.numPages || 1, (searchSession.currentPage || 1) + 1);
                    const searchResult = await nhentaiService.search(searchSession.query || '', newPage, searchSession.sort || 'popular');
                    if (!searchResult.success || !searchResult.data || searchResult.data.results.length === 0) {
                        await interaction.editReply({
                            embeds: [this.createErrorEmbed('No results found')],
                            components: []
                        });
                        return;
                    }
                    await this.setSearchSession(userId, { ...searchSession, currentPage: newPage, results: searchResult.data.results });
                    const embed = this.createSearchResultsEmbed(searchSession.query || '', searchResult.data, newPage, searchSession.sort || 'popular');
                    const rows = this.createSearchButtons(searchSession.query || '', searchResult.data, newPage, userId);
                    await interaction.editReply({ embeds: [embed], components: rows });
                    break;
                }
                case 'favpage': {
                    const direction = parts[2];
                    const searchSession = await this.getSearchSession(userId);
                    const currentPage = searchSession?.favPage || 1;
                    const newPage = direction === 'prev'
                        ? Math.max(1, currentPage - 1)
                        : currentPage + 1;
                    const { embed, totalPages } = await this.createFavouritesEmbed(userId, newPage);
                    if (newPage > totalPages) {
                        await interaction.followUp({ content: '❌ No more pages', ephemeral: true });
                        return;
                    }
                    const favourites = await nhentaiRepository_1.default.getUserFavourites(userId, 10, (newPage - 1) * 10);
                    const rows = this.createFavouritesButtons(userId, newPage, totalPages, favourites);
                    await this.setSearchSession(userId, { ...searchSession, favPage: newPage });
                    await interaction.editReply({ embeds: [embed], components: rows });
                    break;
                }
                case 'random': {
                    const result = await nhentaiService.fetchRandomGallery();
                    if (!result.success || !result.data) {
                        await interaction.editReply({
                            embeds: [this.createErrorEmbed('Could not fetch random gallery')],
                            components: []
                        });
                        return;
                    }
                    const gallery = result.data;
                    const embed = this.createGalleryEmbed(gallery, { isRandom: true });
                    const rows = await this.createMainButtons(gallery.id, userId, gallery.num_pages, gallery);
                    await interaction.editReply({ embeds: [embed], components: rows });
                    break;
                }
                case 'popular': {
                    const result = await nhentaiService.fetchPopularGallery();
                    if (!result.success || !result.data) {
                        await interaction.editReply({
                            embeds: [this.createErrorEmbed('Could not fetch popular gallery')],
                            components: []
                        });
                        return;
                    }
                    const gallery = result.data;
                    const embed = this.createGalleryEmbed(gallery, { isPopular: true });
                    const rows = await this.createMainButtons(gallery.id, userId, gallery.num_pages, gallery);
                    await interaction.editReply({ embeds: [embed], components: rows });
                    break;
                }
                case 'myfavs': {
                    const { embed, totalPages, totalCount } = await this.createFavouritesEmbed(userId, 1);
                    if (totalCount === 0) {
                        await interaction.editReply({ embeds: [embed], components: [] });
                        return;
                    }
                    const favourites = await nhentaiRepository_1.default.getUserFavourites(userId, 10, 0);
                    const rows = this.createFavouritesButtons(userId, 1, totalPages, favourites);
                    await this.setSearchSession(userId, { favPage: 1, expiresAt: Date.now() + this.SESSION_TTL * 1000 });
                    await interaction.editReply({ embeds: [embed], components: rows });
                    break;
                }
                case 'jump': {
                    const galleryId = parts[2];
                    const session = await this.getPageSession(userId);
                    const totalPages = session?.totalPages || 1;
                    const modal = new discord_js_1.ModalBuilder()
                        .setCustomId(`nhentai_jumpmodal_${galleryId}_${userId}`)
                        .setTitle('Jump to Page');
                    const pageInput = new discord_js_1.TextInputBuilder()
                        .setCustomId('page_number')
                        .setLabel(`Enter page number (1-${totalPages})`)
                        .setStyle(discord_js_1.TextInputStyle.Short)
                        .setPlaceholder('e.g., 10')
                        .setRequired(true)
                        .setMinLength(1)
                        .setMaxLength(5);
                    const actionRow = new discord_js_1.ActionRowBuilder().addComponents(pageInput);
                    modal.addComponents(actionRow);
                    // Show the modal instead of text message
                    await interaction.showModal(modal);
                    break;
                }
                case 'randfav': {
                    const favourites = await nhentaiRepository_1.default.getUserFavourites(userId, 100, 0);
                    if (favourites.length === 0) {
                        await interaction.followUp({ content: '❌ You have no favourites yet!', ephemeral: true });
                        return;
                    }
                    const randomFav = favourites[Math.floor(Math.random() * favourites.length)];
                    const result = await nhentaiService.fetchGallery(randomFav.gallery_id);
                    if (!result.success || !result.data) {
                        await interaction.editReply({
                            embeds: [this.createErrorEmbed('Gallery not found')],
                            components: []
                        });
                        return;
                    }
                    const gallery = result.data;
                    const embed = this.createGalleryEmbed(gallery);
                    const rows = await this.createMainButtons(gallery.id, userId, gallery.num_pages, gallery);
                    await interaction.editReply({ embeds: [embed], components: rows });
                    break;
                }
                default:
                    await interaction.followUp({ content: '❌ Unknown action', ephemeral: true });
            }
        }
        catch (error) {
            console.error('[NHentai Button Error]', error);
            await interaction.followUp?.({
                content: '❌ An error occurred. Please try again.',
                ephemeral: true
            }).catch(() => { });
        }
    }
    /**
     * Handle modal submissions (jump to page)
     */
    async handleModal(interaction) {
        // Parse: nhentai_jumpmodal_${galleryId}_${userId}
        const parts = interaction.customId.split('_');
        if (parts[1] !== 'jumpmodal')
            return;
        const galleryId = parseInt(parts[2]);
        const userId = parts[3];
        if (interaction.user.id !== userId) {
            await interaction.reply({
                content: '❌ This is not your gallery view.',
                ephemeral: true
            });
            return;
        }
        const pageInput = interaction.fields.getTextInputValue('page_number');
        const targetPage = parseInt(pageInput);
        if (isNaN(targetPage) || targetPage < 1) {
            await interaction.reply({
                content: '❌ Please enter a valid page number.',
                ephemeral: true
            });
            return;
        }
        await interaction.deferUpdate();
        try {
            // Fetch gallery to get total pages
            const result = await nhentaiService.fetchGallery(galleryId);
            if (!result.success || !result.data) {
                await interaction.followUp({
                    content: '❌ Gallery not found.',
                    ephemeral: true
                });
                return;
            }
            const gallery = result.data;
            const totalPages = gallery.num_pages || 1;
            const clampedPage = Math.max(1, Math.min(targetPage, totalPages));
            // Create page embed
            const embed = this.createPageEmbed(gallery, clampedPage);
            const buttons = this.createPageButtons(galleryId, userId, clampedPage, totalPages);
            await interaction.editReply({ embeds: [embed], components: buttons });
        }
        catch (error) {
            console.error('[NHentai Modal Error]', error);
            await interaction.followUp?.({
                content: '❌ Failed to jump to page. Please try again.',
                ephemeral: true
            }).catch(() => { });
        }
    }
    /**
     * Destroy handler - clear intervals for clean shutdown
     */
    destroy() {
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
        }
        // Sessions are managed by CacheService — no local state to clear
    }
}
exports.NHentaiHandler = NHentaiHandler;
// EXPORTS
const nhentaiHandler = new NHentaiHandler();
exports.default = nhentaiHandler;
//# sourceMappingURL=nhentaiHandler.js.map