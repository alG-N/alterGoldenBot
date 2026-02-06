"use strict";
/**
 * MyAnimeList Service
 * Handles all API interactions with MyAnimeList using Jikan API v4
 * @module services/api/myAnimeListService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyAnimeListService = exports.myAnimeListService = void 0;
const CircuitBreakerRegistry_1 = require("../../core/CircuitBreakerRegistry");
const CacheService_js_1 = __importDefault(require("../../cache/CacheService.js"));
// TYPES & INTERFACES
// Jikan API v4 (unofficial MAL API)
const JIKAN_BASE = 'https://api.jikan.moe/v4';
const MEDIA_TYPE_CONFIG = {
    anime: { endpoint: 'anime', typeFilter: null },
    manga: { endpoint: 'manga', typeFilter: 'manga' },
    lightnovel: { endpoint: 'manga', typeFilter: 'lightnovel' },
    webnovel: { endpoint: 'manga', typeFilter: 'webnovel' },
    oneshot: { endpoint: 'manga', typeFilter: 'oneshot' }
};
// MYANIMEIST SERVICE CLASS
class MyAnimeListService {
    CACHE_NS = 'api';
    CACHE_TTL = 300; // 5 minutes in seconds
    rateLimitDelay = 400; // Jikan has rate limiting
    RATE_LIMIT_KEY = 'mal_ratelimit:last_request';
    RATE_LIMIT_TTL = 2; // seconds — just long enough for cross-shard coordination
    lastRequest = 0; // Local fallback when Redis unavailable
    constructor() {
        // No local cache setup needed
    }
    /**
     * Get last request timestamp from Redis (shard-safe) with local fallback
     */
    async _getLastRequest() {
        try {
            const ts = await CacheService_js_1.default.get(this.CACHE_NS, this.RATE_LIMIT_KEY);
            if (ts !== null)
                return ts;
        }
        catch {
            // Redis unavailable — fall through to local
        }
        return this.lastRequest;
    }
    /**
     * Store last request timestamp in Redis (shard-safe) with local fallback
     */
    async _setLastRequest(timestamp) {
        this.lastRequest = timestamp; // Always update local as fallback
        try {
            await CacheService_js_1.default.set(this.CACHE_NS, this.RATE_LIMIT_KEY, timestamp, this.RATE_LIMIT_TTL);
        }
        catch {
            // Redis unavailable — local fallback already set
        }
    }
    /**
     * Rate-limited fetch with circuit breaker (shard-safe via Redis)
     */
    async _rateLimitedFetch(url) {
        const now = Date.now();
        const lastReq = await this._getLastRequest();
        const timeSinceLastRequest = now - lastReq;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(r => setTimeout(r, this.rateLimitDelay - timeSinceLastRequest));
        }
        await this._setLastRequest(Date.now());
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'FumoBOT Discord Bot',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    /**
     * Search media by name (anime, manga, lightnovel, etc.) with circuit breaker
     */
    async searchMedia(query, mediaType = 'anime') {
        const config = MEDIA_TYPE_CONFIG[mediaType] || MEDIA_TYPE_CONFIG.anime;
        const cacheKey = `mal:search_${mediaType}_${query.toLowerCase()}`;
        const cached = await CacheService_js_1.default.get(this.CACHE_NS, cacheKey);
        if (cached)
            return cached;
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('anime', async () => {
            try {
                let url = `${JIKAN_BASE}/${config.endpoint}?q=${encodeURIComponent(query)}&limit=1`;
                if (config.typeFilter) {
                    url += `&type=${config.typeFilter}`;
                }
                const response = await this._rateLimitedFetch(url);
                if (!response.ok) {
                    throw new Error(`MAL API error: ${response.status}`);
                }
                const data = await response.json();
                if (!data.data || data.data.length === 0) {
                    return null;
                }
                const media = config.endpoint === 'manga'
                    ? this._transformMangaData(data.data[0], mediaType)
                    : this._transformAnimeData(data.data[0]);
                await CacheService_js_1.default.set(this.CACHE_NS, cacheKey, media, this.CACHE_TTL);
                return media;
            }
            catch (error) {
                console.error('[MAL Search Error]', error.message);
                return null;
            }
        });
    }
    /**
     * Search anime by name (legacy support)
     */
    async searchAnime(query) {
        return this.searchMedia(query, 'anime');
    }
    /**
     * Search media for autocomplete (returns multiple results) with circuit breaker
     */
    async searchMediaAutocomplete(query, mediaType = 'anime', limit = 10) {
        const config = MEDIA_TYPE_CONFIG[mediaType] || MEDIA_TYPE_CONFIG.anime;
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('anime', async () => {
            try {
                let url = `${JIKAN_BASE}/${config.endpoint}?q=${encodeURIComponent(query)}&limit=${limit}&sfw=true`;
                if (config.typeFilter) {
                    url += `&type=${config.typeFilter}`;
                }
                const response = await this._rateLimitedFetch(url);
                if (!response.ok)
                    return [];
                const data = await response.json();
                return (data.data || []).map(item => {
                    const animeItem = item;
                    const mangaItem = item;
                    return {
                        id: item.mal_id,
                        title: {
                            romaji: item.title,
                            english: item.title_english || null,
                            japanese: item.title_japanese || null
                        },
                        format: item.type || null,
                        status: this._mapStatus(item.status || ''),
                        seasonYear: animeItem.year || (mangaItem.published?.from ? new Date(mangaItem.published.from).getFullYear() : null),
                        startYear: mangaItem.published?.from ? new Date(mangaItem.published.from).getFullYear() : animeItem.year || null,
                        averageScore: item.score ? Math.round(item.score * 10) : null
                    };
                });
            }
            catch (error) {
                console.error('[MAL Autocomplete Error]', error.message);
                return [];
            }
        });
    }
    /**
     * Search anime for autocomplete (legacy support)
     */
    async searchAnimeAutocomplete(query, limit = 10) {
        return this.searchMediaAutocomplete(query, 'anime', limit);
    }
    /**
     * Get anime by ID with circuit breaker
     */
    async getAnimeById(malId) {
        const cacheKey = `mal:anime_${malId}`;
        const cached = await CacheService_js_1.default.get(this.CACHE_NS, cacheKey);
        if (cached)
            return cached;
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('anime', async () => {
            try {
                const response = await this._rateLimitedFetch(`${JIKAN_BASE}/anime/${malId}/full`);
                if (!response.ok)
                    return null;
                const data = await response.json();
                const anime = this._transformAnimeData(data.data);
                await CacheService_js_1.default.set(this.CACHE_NS, cacheKey, anime, this.CACHE_TTL);
                return anime;
            }
            catch (error) {
                console.error('[MAL GetById Error]', error.message);
                return null;
            }
        });
    }
    /**
     * Transform Jikan data to match AniList format
     */
    _transformAnimeData(data) {
        return {
            id: data.mal_id,
            source: 'mal',
            title: {
                romaji: data.title,
                english: data.title_english || null,
                native: data.title_japanese || null
            },
            coverImage: {
                large: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || null,
                color: null
            },
            description: data.synopsis || null,
            episodes: data.episodes || null,
            averageScore: data.score ? Math.round(data.score * 10) : null,
            popularity: data.members || null,
            format: data.type || null,
            season: data.season?.toUpperCase() || null,
            seasonYear: data.year || null,
            status: this._mapStatus(data.status || ''),
            genres: data.genres?.map(g => g.name) || [],
            duration: data.duration ? parseInt(data.duration) : null,
            startDate: data.aired?.from ? this._parseDate(data.aired.from) : null,
            endDate: data.aired?.to ? this._parseDate(data.aired.to) : null,
            rankings: data.rank ? [{ rank: data.rank, type: 'RATED', allTime: true }] : [],
            characters: {
                edges: []
            },
            relations: {
                edges: (data.relations || []).flatMap(rel => rel.entry.map(e => ({
                    relationType: rel.relation.toUpperCase().replace(/ /g, '_'),
                    node: {
                        id: e.mal_id,
                        title: { romaji: e.name, english: null },
                        type: e.type?.toUpperCase() || ''
                    }
                })))
            },
            studios: {
                nodes: (data.studios || []).map(s => ({ name: s.name }))
            },
            trailer: data.trailer?.youtube_id ? {
                id: data.trailer.youtube_id,
                site: 'youtube'
            } : null,
            siteUrl: data.url || '',
            nextAiringEpisode: null,
            malId: data.mal_id,
            score: data.score || null,
            scoredBy: data.scored_by || null,
            rank: data.rank || null,
            popularity_rank: data.popularity || null,
            members: data.members || null,
            favorites: data.favorites || null,
            rating: data.rating || null,
            broadcast: data.broadcast?.string || null,
            mediaType: 'anime'
        };
    }
    /**
     * Transform Jikan manga data
     */
    _transformMangaData(data, mediaType = 'manga') {
        return {
            id: data.mal_id,
            source: 'mal',
            mediaType: mediaType,
            title: {
                romaji: data.title,
                english: data.title_english || null,
                native: data.title_japanese || null
            },
            coverImage: {
                large: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || null,
                color: null
            },
            description: data.synopsis || null,
            chapters: data.chapters || null,
            volumes: data.volumes || null,
            averageScore: data.score ? Math.round(data.score * 10) : null,
            popularity: data.members || null,
            format: data.type || null,
            status: this._mapMangaStatus(data.status || ''),
            genres: data.genres?.map(g => g.name) || [],
            themes: data.themes?.map(t => t.name) || [],
            demographics: data.demographics?.map(d => d.name) || [],
            startDate: data.published?.from ? this._parseDate(data.published.from) : null,
            endDate: data.published?.to ? this._parseDate(data.published.to) : null,
            authors: data.authors?.map(a => ({
                name: a.name,
                role: a.type
            })) || [],
            serialization: data.serializations?.map(s => s.name) || [],
            relations: {
                edges: (data.relations || []).flatMap(rel => rel.entry.map(e => ({
                    relationType: rel.relation.toUpperCase().replace(/ /g, '_'),
                    node: {
                        id: e.mal_id,
                        title: { romaji: e.name, english: null },
                        type: e.type?.toUpperCase() || ''
                    }
                })))
            },
            siteUrl: data.url || '',
            malId: data.mal_id,
            score: data.score || null,
            scoredBy: data.scored_by || null,
            rank: data.rank || null,
            popularity_rank: data.popularity || null,
            members: data.members || null,
            favorites: data.favorites || null
        };
    }
    /**
     * Map manga status to normalized format
     */
    _mapMangaStatus(status) {
        const statusMap = {
            'Finished': 'FINISHED',
            'Publishing': 'RELEASING',
            'On Hiatus': 'HIATUS',
            'Discontinued': 'CANCELLED',
            'Not yet published': 'NOT_YET_RELEASED'
        };
        return statusMap[status] || status;
    }
    /**
     * Map anime status to normalized format
     */
    _mapStatus(status) {
        const statusMap = {
            'Finished Airing': 'FINISHED',
            'Currently Airing': 'RELEASING',
            'Not yet aired': 'NOT_YET_RELEASED'
        };
        return statusMap[status] || status;
    }
    /**
     * Parse date string to date object
     */
    _parseDate(dateString) {
        if (!dateString)
            return null;
        const date = new Date(dateString);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        };
    }
}
exports.MyAnimeListService = MyAnimeListService;
// Export singleton instance
const myAnimeListService = new MyAnimeListService();
exports.myAnimeListService = myAnimeListService;
exports.default = myAnimeListService;
// CommonJS compatibility
module.exports = myAnimeListService;
module.exports.myAnimeListService = myAnimeListService;
module.exports.MyAnimeListService = MyAnimeListService;
//# sourceMappingURL=myAnimeListService.js.map