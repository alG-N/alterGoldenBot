"use strict";
/**
 * Anime Command - Presentation Layer
 * Search anime/manga on AniList and MyAnimeList
 * @module presentation/commands/api/anime
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const constants_js_1 = require("../../constants.js");
const index_js_1 = require("../../services/index.js");
// SERVICE IMPORTS
let anilistService;
let myAnimeListService;
let animeHandler;
let animeRepository;
const getDefault = (mod) => mod.default || mod;
try {
    anilistService = getDefault(require('../../services/api/anilistService'));
    myAnimeListService = getDefault(require('../../services/api/myAnimeListService'));
    animeHandler = getDefault(require('../../handlers/api/animeHandler'));
    animeRepository = getDefault(require('../../repositories/api/animeRepository'));
}
catch (e) {
    console.warn('[Anime] Could not load services:', e.message);
}
// CACHE
const autocompleteCache = new Map();
const searchResultCache = new Map();
const AUTOCOMPLETE_CACHE_DURATION = 60000;
const SEARCH_CACHE_DURATION = 600000;
// Cleanup
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of autocompleteCache) {
        if (now - value.timestamp > AUTOCOMPLETE_CACHE_DURATION) {
            autocompleteCache.delete(key);
        }
    }
    for (const [key, value] of searchResultCache) {
        if (now - value.timestamp > SEARCH_CACHE_DURATION) {
            searchResultCache.delete(key);
        }
    }
}, 120000);
// MAL media types
const MAL_TYPES = {
    anime: { emoji: '📺', label: 'Anime', endpoint: 'anime' },
    manga: { emoji: '📚', label: 'Manga', endpoint: 'manga' },
    lightnovel: { emoji: '📖', label: 'Light Novel', endpoint: 'manga' },
    webnovel: { emoji: '💻', label: 'Web Novel', endpoint: 'manga' },
    oneshot: { emoji: '📄', label: 'One-shot', endpoint: 'manga' }
};
// COMMAND
class AnimeCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.API,
            cooldown: 3,
            deferReply: true
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('anime')
            .setDescription('Search for anime and manga')
            .addSubcommand(sub => sub
            .setName('search')
            .setDescription('Search for anime on AniList')
            .addStringOption(opt => opt
            .setName('name')
            .setDescription('Anime name to search')
            .setRequired(true)
            .setAutocomplete(true)))
            .addSubcommand(sub => sub
            .setName('mal')
            .setDescription('Search on MyAnimeList')
            .addStringOption(opt => opt
            .setName('name')
            .setDescription('Title to search')
            .setRequired(true)
            .setAutocomplete(true))
            .addStringOption(opt => opt
            .setName('type')
            .setDescription('Media type')
            .setRequired(false)
            .addChoices({ name: '📺 Anime', value: 'anime' }, { name: '📚 Manga', value: 'manga' }, { name: '📖 Light Novel', value: 'lightnovel' }, { name: '💻 Web Novel', value: 'webnovel' }, { name: '📄 One-shot', value: 'oneshot' })))
            .addSubcommand(sub => sub
            .setName('favourites')
            .setDescription('View your favourite anime/manga'));
    }
    async run(interaction) {
        // Access control
        const access = await (0, index_js_1.checkAccess)(interaction, index_js_1.AccessType.SUB);
        if (access.blocked) {
            await interaction.reply({ embeds: [access.embed], ephemeral: true });
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case 'search':
                await this._searchAniList(interaction);
                break;
            case 'mal':
                await this._searchMAL(interaction);
                break;
            case 'favourites':
                await this._showFavourites(interaction);
                break;
        }
    }
    async _searchAniList(interaction) {
        const animeName = interaction.options.getString('name', true);
        try {
            const result = await anilistService.searchAnime(animeName);
            if (!result) {
                await this.errorReply(interaction, `Could not find anime: **${animeName}**`);
                return;
            }
            const embed = await animeHandler.createMediaEmbed(result, 'anilist', 'anime');
            const row = await this._createActionRow(result, 'anilist', 'anime', interaction.user.id);
            searchResultCache.set(interaction.user.id, {
                anime: result,
                source: 'anilist',
                mediaType: 'anime',
                timestamp: Date.now()
            });
            await this.safeReply(interaction, { embeds: [embed], components: [row] });
        }
        catch (error) {
            console.error('[Anime Search]', error);
            await this.errorReply(interaction, `Could not find anime: **${animeName}**`);
        }
    }
    async _searchMAL(interaction) {
        const name = interaction.options.getString('name', true);
        const mediaType = interaction.options.getString('type') || 'anime';
        try {
            const result = await myAnimeListService.searchMedia(name, mediaType);
            if (!result) {
                const typeLabel = MAL_TYPES[mediaType]?.label || 'anime';
                await this.errorReply(interaction, `Could not find ${typeLabel}: **${name}** on MyAnimeList`);
                return;
            }
            const embed = await animeHandler.createMediaEmbed(result, 'mal', mediaType);
            const row = await this._createActionRow(result, 'mal', mediaType, interaction.user.id);
            searchResultCache.set(interaction.user.id, {
                anime: result,
                source: 'mal',
                mediaType,
                timestamp: Date.now()
            });
            await this.safeReply(interaction, { embeds: [embed], components: [row] });
        }
        catch (error) {
            console.error('[MAL Search]', error);
            const typeLabel = MAL_TYPES[mediaType]?.label || 'anime';
            await this.errorReply(interaction, `Could not find ${typeLabel}: **${name}** on MyAnimeList`);
        }
    }
    async _showFavourites(interaction) {
        try {
            const favourites = await animeRepository.getUserFavourites(interaction.user.id);
            if (!favourites || favourites.length === 0) {
                await this.infoReply(interaction, 'You have no favourite anime/manga yet. Use the ⭐ button on search results to add some!');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(constants_js_1.COLORS.PRIMARY)
                .setTitle('⭐ Your Favourites')
                .setDescription(favourites.slice(0, 20).map((f, i) => `${i + 1}. **${f.title}** (${f.source})`).join('\n'))
                .setFooter({ text: `Total: ${favourites.length} favourites` });
            await this.safeReply(interaction, { embeds: [embed] });
        }
        catch (error) {
            console.error('[Anime Favourites]', error);
            await this.errorReply(interaction, 'Failed to fetch favourites.');
        }
    }
    async _createActionRow(anime, source, mediaType, userId) {
        const typeInfo = MAL_TYPES[mediaType] || MAL_TYPES.anime;
        const animeId = anime.id || anime.idMal;
        let buttonLabel;
        let buttonEmoji;
        let url;
        if (source === 'mal') {
            buttonLabel = `View on MyAnimeList`;
            buttonEmoji = '📗';
            url = anime.url || `https://myanimelist.net/${typeInfo.endpoint}/${animeId}`;
        }
        else {
            buttonLabel = 'View on AniList';
            buttonEmoji = '📘';
            url = anime.siteUrl || `https://anilist.co/anime/${animeId}`;
        }
        let isFavourited = false;
        try {
            isFavourited = await animeRepository.isFavourited(userId, animeId);
        }
        catch (e) { /* ignore */ }
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel(buttonLabel)
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setEmoji(buttonEmoji)
            .setURL(url), new discord_js_1.ButtonBuilder()
            .setCustomId(`anime_fav_${animeId}`)
            .setLabel(isFavourited ? 'Remove from Favourites' : 'Add to Favourites')
            .setStyle(isFavourited ? discord_js_1.ButtonStyle.Secondary : discord_js_1.ButtonStyle.Primary)
            .setEmoji(isFavourited ? '💔' : '⭐'));
    }
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const subcommand = interaction.options.getSubcommand();
        if (focusedValue.length < 2) {
            await interaction.respond([]);
            return;
        }
        const cacheKey = `${subcommand}_${focusedValue.toLowerCase()}`;
        const cached = autocompleteCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < AUTOCOMPLETE_CACHE_DURATION) {
            await interaction.respond(cached.results);
            return;
        }
        try {
            let results = [];
            if (subcommand === 'search') {
                const suggestions = await anilistService.searchAnimeAutocomplete(focusedValue);
                results = suggestions.slice(0, 25).map(s => {
                    const titleObj = s.title;
                    const title = titleObj?.english || titleObj?.romaji || titleObj?.native || 'Unknown';
                    return {
                        name: title.length > 100 ? title.slice(0, 97) + '...' : title,
                        value: title.slice(0, 100)
                    };
                });
            }
            else if (subcommand === 'mal') {
                const mediaType = interaction.options.getString('type') || 'anime';
                const suggestions = await myAnimeListService.searchMediaAutocomplete(focusedValue, mediaType);
                results = suggestions.slice(0, 25).map(s => {
                    const titleObj = s.title;
                    const title = typeof titleObj === 'string'
                        ? titleObj
                        : (titleObj?.english || titleObj?.romaji || titleObj?.default || s.name || 'Unknown');
                    return {
                        name: title.length > 100 ? title.slice(0, 97) + '...' : title,
                        value: title.slice(0, 100)
                    };
                });
            }
            autocompleteCache.set(cacheKey, { results, timestamp: Date.now() });
            await interaction.respond(results);
        }
        catch (error) {
            console.error('[Anime Autocomplete]', error);
            await interaction.respond([]);
        }
    }
    async handleButton(interaction) {
        const parts = interaction.customId.split('_');
        const action = parts[1]; // 'fav'
        const animeId = parts[2];
        const userId = interaction.user.id;
        if (action === 'fav') {
            try {
                await interaction.deferUpdate();
                const cached = searchResultCache.get(userId);
                let animeTitle = 'Unknown';
                let source = 'anilist';
                if (cached && cached.anime) {
                    const anime = cached.anime;
                    source = cached.source;
                    const titleObj = anime.title;
                    animeTitle = typeof titleObj === 'string'
                        ? titleObj
                        : (titleObj?.english || titleObj?.romaji || titleObj?.native || 'Unknown');
                }
                const isFav = await animeRepository.isFavourited(userId, animeId);
                if (isFav) {
                    await animeRepository.removeFavourite(userId, animeId);
                    const row = await this._createActionRow(cached?.anime || { id: parseInt(animeId) }, source, cached?.mediaType || 'anime', userId);
                    await interaction.editReply({ components: [row] });
                    await interaction.followUp({
                        content: `💔 Removed **${animeTitle}** from favourites`,
                        ephemeral: true
                    });
                }
                else {
                    await animeRepository.addFavourite(userId, animeId, animeTitle, source);
                    const row = await this._createActionRow(cached?.anime || { id: parseInt(animeId) }, source, cached?.mediaType || 'anime', userId);
                    await interaction.editReply({ components: [row] });
                    await interaction.followUp({
                        content: `⭐ Added **${animeTitle}** to favourites!`,
                        ephemeral: true
                    });
                }
            }
            catch (error) {
                console.error('[Anime Favourite]', error);
                await interaction.followUp({
                    content: '❌ Failed to update favourites. Please try again.',
                    ephemeral: true
                }).catch(() => { });
            }
        }
    }
}
exports.default = new AnimeCommand();
//# sourceMappingURL=anime.js.map