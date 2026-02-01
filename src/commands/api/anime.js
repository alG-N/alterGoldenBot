/**
 * Anime Command - Presentation Layer
 * Search anime/manga on AniList and MyAnimeList
 * @module presentation/commands/api/anime
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { BaseCommand, CommandCategory } = require('../BaseCommand');
const { COLORS } = require('../../utils/constants');
const { checkAccess, AccessType } = require('../../services');

// Import services
let anilistService, myAnimeListService, animeHandler, animeRepository;
try {
    anilistService = require('../../modules/api/services/anilistService');
    myAnimeListService = require('../../modules/api/services/myAnimeListService');
    animeHandler = require('../../modules/api/handlers/animeHandler');
    animeRepository = require('../../modules/api/repositories/animeRepository');
} catch (e) {
    console.warn('[Anime] Could not load services:', e.message);
}

// Cache
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

class AnimeCommand extends BaseCommand {
    constructor() {
        super({
            category: CommandCategory.API,
            cooldown: 3,
            deferReply: true
        });
    }

    get data() {
        return new SlashCommandBuilder()
            .setName('anime')
            .setDescription('Search for anime and manga')
            .addSubcommand(sub => sub
                .setName('search')
                .setDescription('Search for anime on AniList')
                .addStringOption(opt => opt
                    .setName('name')
                    .setDescription('Anime name to search')
                    .setRequired(true)
                    .setAutocomplete(true)
                )
            )
            .addSubcommand(sub => sub
                .setName('mal')
                .setDescription('Search on MyAnimeList')
                .addStringOption(opt => opt
                    .setName('name')
                    .setDescription('Title to search')
                    .setRequired(true)
                    .setAutocomplete(true)
                )
                .addStringOption(opt => opt
                    .setName('type')
                    .setDescription('Media type')
                    .setRequired(false)
                    .addChoices(
                        { name: '📺 Anime', value: 'anime' },
                        { name: '📚 Manga', value: 'manga' },
                        { name: '📖 Light Novel', value: 'lightnovel' },
                        { name: '💻 Web Novel', value: 'webnovel' },
                        { name: '📄 One-shot', value: 'oneshot' }
                    )
                )
            )
            .addSubcommand(sub => sub
                .setName('favourites')
                .setDescription('View your favourite anime/manga')
            );
    }

    async run(interaction) {
        // Access control
        const access = await checkAccess(interaction, AccessType.SUB);
        if (access.blocked) {
            return interaction.reply({ embeds: [access.embed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'search':
                return this._searchAniList(interaction);
            case 'mal':
                return this._searchMAL(interaction);
            case 'favourites':
                return this._showFavourites(interaction);
        }
    }

    async _searchAniList(interaction) {
        const animeName = interaction.options.getString('name');

        try {
            const result = await anilistService.searchAnime(animeName);
            if (!result) {
                return this.errorReply(interaction, `Could not find anime: **${animeName}**`);
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
        } catch (error) {
            console.error('[Anime Search]', error);
            return this.errorReply(interaction, `Could not find anime: **${animeName}**`);
        }
    }

    async _searchMAL(interaction) {
        const name = interaction.options.getString('name');
        const mediaType = interaction.options.getString('type') || 'anime';

        try {
            const result = await myAnimeListService.searchMedia(name, mediaType);
            if (!result) {
                const typeLabel = MAL_TYPES[mediaType]?.label || 'anime';
                return this.errorReply(interaction, `Could not find ${typeLabel}: **${name}** on MyAnimeList`);
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
        } catch (error) {
            console.error('[MAL Search]', error);
            const typeLabel = MAL_TYPES[mediaType]?.label || 'anime';
            return this.errorReply(interaction, `Could not find ${typeLabel}: **${name}** on MyAnimeList`);
        }
    }

    async _showFavourites(interaction) {
        try {
            const favourites = await animeRepository.getUserFavourites(interaction.user.id);
            
            if (!favourites || favourites.length === 0) {
                return this.infoReply(interaction, 'You have no favourite anime/manga yet. Use the ⭐ button on search results to add some!');
            }

            const embed = new EmbedBuilder()
                .setColor(COLORS.PRIMARY)
                .setTitle('⭐ Your Favourites')
                .setDescription(favourites.slice(0, 20).map((f, i) => 
                    `${i + 1}. **${f.title}** (${f.source})`
                ).join('\n'))
                .setFooter({ text: `Total: ${favourites.length} favourites` });

            await this.safeReply(interaction, { embeds: [embed] });
        } catch (error) {
            console.error('[Anime Favourites]', error);
            return this.errorReply(interaction, 'Failed to fetch favourites.');
        }
    }

    async _createActionRow(anime, source, mediaType, userId) {
        const typeInfo = MAL_TYPES[mediaType] || MAL_TYPES.anime;
        const animeId = anime.id || anime.idMal;
        
        let buttonLabel, buttonEmoji, url;
        if (source === 'mal') {
            buttonLabel = `View on MyAnimeList`;
            buttonEmoji = '📗';
            url = anime.url || `https://myanimelist.net/${typeInfo.endpoint}/${animeId}`;
        } else {
            buttonLabel = 'View on AniList';
            buttonEmoji = '📘';
            url = anime.siteUrl || `https://anilist.co/anime/${animeId}`;
        }

        let isFavourited = false;
        try {
            isFavourited = await animeRepository.isFavourited(userId, animeId);
        } catch (e) { /* ignore */ }
        
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(buttonLabel)
                .setStyle(ButtonStyle.Link)
                .setEmoji(buttonEmoji)
                .setURL(url),
            new ButtonBuilder()
                .setCustomId(`anime_fav_${animeId}`)
                .setLabel(isFavourited ? 'Remove from Favourites' : 'Add to Favourites')
                .setStyle(isFavourited ? ButtonStyle.Secondary : ButtonStyle.Primary)
                .setEmoji(isFavourited ? '💔' : '⭐')
        );
    }

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const subcommand = interaction.options.getSubcommand();

        if (focusedValue.length < 2) {
            return interaction.respond([]);
        }

        const cacheKey = `${subcommand}_${focusedValue.toLowerCase()}`;
        const cached = autocompleteCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < AUTOCOMPLETE_CACHE_DURATION) {
            return interaction.respond(cached.results);
        }

        try {
            let results = [];
            
            if (subcommand === 'search') {
                const suggestions = await anilistService.searchAnimeAutocomplete(focusedValue);
                results = suggestions.slice(0, 25).map(s => {
                    const title = s.title?.english || s.title?.romaji || s.title?.native || 'Unknown';
                    return {
                        name: title.length > 100 ? title.slice(0, 97) + '...' : title,
                        value: title.slice(0, 100)
                    };
                });
            } else if (subcommand === 'mal') {
                const mediaType = interaction.options.getString('type') || 'anime';
                const suggestions = await myAnimeListService.searchMediaAutocomplete(focusedValue, mediaType);
                results = suggestions.slice(0, 25).map(s => {
                    // Handle both string title and object title formats
                    const title = typeof s.title === 'string' 
                        ? s.title 
                        : (s.title?.english || s.title?.romaji || s.title?.default || s.name || 'Unknown');
                    return {
                        name: title.length > 100 ? title.slice(0, 97) + '...' : title,
                        value: title.slice(0, 100)
                    };
                });
            }

            autocompleteCache.set(cacheKey, { results, timestamp: Date.now() });
            await interaction.respond(results);
        } catch (error) {
            console.error('[Anime Autocomplete]', error);
            await interaction.respond([]);
        }
    }
}

module.exports = new AnimeCommand();



