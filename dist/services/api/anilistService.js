"use strict";
/**
 * AniList Service
 * GraphQL-based anime information service with circuit breaker and graceful degradation
 * @module services/api/anilistService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnilistService = exports.anilistService = void 0;
const graphql_request_1 = require("graphql-request");
const CircuitBreakerRegistry_1 = require("../../core/CircuitBreakerRegistry");
const CacheService_1 = __importDefault(require("../../cache/CacheService"));
const GracefulDegradation_1 = __importDefault(require("../../core/GracefulDegradation"));
// ANILIST SERVICE CLASS
class AnilistService {
    client;
    circuitBreaker = null;
    cacheTTL = 3600; // 1 hour
    constructor() {
        this.client = new graphql_request_1.GraphQLClient('https://graphql.anilist.co');
    }
    /**
     * Get or initialize circuit breaker
     */
    _getCircuitBreaker() {
        if (!this.circuitBreaker) {
            CircuitBreakerRegistry_1.circuitBreakerRegistry.initialize();
            this.circuitBreaker = CircuitBreakerRegistry_1.circuitBreakerRegistry.get('anime');
            // Register with graceful degradation
            GracefulDegradation_1.default.initialize();
            GracefulDegradation_1.default.registerFallback('anilist', async (_error, options) => {
                const context = options;
                if (context?.cachedResult) {
                    return {
                        ...context.cachedResult,
                        _stale: true,
                        _cachedAt: context.cachedAt
                    };
                }
                return null;
            });
        }
        return this.circuitBreaker;
    }
    /**
     * Get cache key for anime search
     */
    _getCacheKey(searchTerm) {
        return `anime:${searchTerm.toLowerCase().trim()}`;
    }
    /**
     * Execute with circuit breaker, caching, and graceful degradation
     */
    async _executeWithResilience(cacheKey, queryFn) {
        const breaker = this._getCircuitBreaker();
        // Try cache first
        const cachedResult = await CacheService_1.default.get('api', cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        try {
            // Try live request with circuit breaker
            const result = await breaker.execute(queryFn);
            if (result) {
                // Cache successful result
                await CacheService_1.default.set('api', cacheKey, result, this.cacheTTL);
                GracefulDegradation_1.default.markHealthy('anilist');
            }
            return result;
        }
        catch (error) {
            const err = error;
            // Check if we have stale cached data to return
            const staleResult = await this._getStaleCache(cacheKey);
            if (staleResult) {
                console.log(`[AniList] Returning stale cache for: ${cacheKey}`);
                GracefulDegradation_1.default.markDegraded('anilist', err.message);
                return {
                    ...staleResult,
                    _stale: true,
                    _error: err.message
                };
            }
            GracefulDegradation_1.default.markDegraded('anilist', err.message);
            throw error;
        }
    }
    /**
     * Get stale cache (cache that may have expired but we can still use)
     */
    async _getStaleCache(cacheKey) {
        const staleKey = `stale:${cacheKey}`;
        return await CacheService_1.default.get('temp', staleKey);
    }
    /**
     * Store stale cache backup (longer TTL for fallback)
     */
    async _setStaleCache(cacheKey, data) {
        const staleKey = `stale:${cacheKey}`;
        // Keep stale cache for 24 hours as fallback
        await CacheService_1.default.set('temp', staleKey, data, 86400);
    }
    /**
     * Search for anime by name
     */
    async searchAnime(searchTerm) {
        const cacheKey = this._getCacheKey(searchTerm);
        return this._executeWithResilience(cacheKey, async () => {
            const result = await this._searchAnimeInternal(searchTerm);
            // Store stale backup for fallback
            if (result) {
                await this._setStaleCache(cacheKey, result);
            }
            return result;
        });
    }
    /**
     * Internal anime search implementation
     */
    async _searchAnimeInternal(searchTerm) {
        const query = (0, graphql_request_1.gql) `
            query ($search: String) {
                Media(search: $search, type: ANIME) {
                    id
                    title { romaji english native }
                    coverImage { large color }
                    description(asHtml: false)
                    episodes
                    averageScore
                    popularity
                    format
                    season
                    seasonYear
                    status
                    source
                    genres
                    duration
                    startDate { year month day }
                    endDate { year month day }
                    rankings { rank allTime type context }
                    characters(sort: [ROLE, RELEVANCE], perPage: 5) {
                        edges { node { name { full } } }
                    }
                    relations {
                        edges {
                            relationType
                            node {
                                id
                                title { romaji english }
                                type
                                status
                                averageScore
                            }
                        }
                    }
                    studios { nodes { name } }
                    trailer { id site }
                    siteUrl
                    nextAiringEpisode { episode airingAt timeUntilAiring }
                }
            }
        `;
        try {
            const data = await this.client.request(query, { search: searchTerm });
            return data.Media;
        }
        catch (error) {
            console.error('[AniList Search Error]', error.message);
            return null;
        }
    }
    /**
     * Search anime for autocomplete suggestions
     */
    async searchAnimeAutocomplete(searchTerm, limit = 10) {
        const query = (0, graphql_request_1.gql) `
            query ($search: String, $perPage: Int) {
                Page(page: 1, perPage: $perPage) {
                    media(search: $search, type: ANIME, sort: [POPULARITY_DESC]) {
                        id
                        title { romaji english native }
                        format
                        status
                        seasonYear
                        averageScore
                    }
                }
            }
        `;
        try {
            const data = await this.client.request(query, {
                search: searchTerm,
                perPage: limit
            });
            return data.Page?.media || [];
        }
        catch (error) {
            console.error('[AniList Autocomplete Error]', error.message);
            return [];
        }
    }
    /**
     * Get anime by AniList ID
     */
    async getAnimeById(id) {
        const query = (0, graphql_request_1.gql) `
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    id
                    title { romaji english native }
                    coverImage { large color }
                    status
                    nextAiringEpisode { episode airingAt timeUntilAiring }
                    episodes
                    relations {
                        edges {
                            relationType
                            node {
                                id
                                title { romaji english }
                                status
                            }
                        }
                    }
                }
            }
        `;
        try {
            const data = await this.client.request(query, { id });
            return data.Media;
        }
        catch (error) {
            console.error('[AniList GetById Error]', error.message);
            return null;
        }
    }
    /**
     * Find the next ongoing season for an anime (follows sequel chain)
     */
    async findNextOngoingSeason(animeId) {
        let currentId = animeId;
        const maxIterations = 10;
        let iterations = 0;
        while (iterations < maxIterations) {
            iterations++;
            const media = await this.getAnimeById(currentId);
            if (!media)
                return null;
            if (media.status === 'RELEASING')
                return media;
            const sequel = media.relations?.edges?.find(e => e.relationType === 'SEQUEL');
            if (!sequel)
                return null;
            currentId = sequel.node.id;
        }
        return null;
    }
    /**
     * Format duration in minutes to human readable string
     */
    formatDuration(minutes) {
        if (!minutes)
            return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
    /**
     * Get recommendation based on score
     */
    getRecommendation(score) {
        if (!score)
            return '😬 Skip or Unknown';
        if (score >= 85)
            return '🔥 Must Watch';
        if (score >= 70)
            return '👍 Good';
        if (score >= 55)
            return '👌 Decent';
        return '😬 Skip or Unknown';
    }
    /**
     * Truncate string to max length
     */
    truncate(str, max = 1000) {
        if (!str)
            return '';
        return str.length > max ? str.slice(0, max) + '...' : str;
    }
    /**
     * Format fuzzy date to string
     */
    formatDate(dateObj) {
        if (!dateObj?.year)
            return 'Unknown';
        const day = dateObj.day || '?';
        const month = dateObj.month || '?';
        return `${day}/${month}/${dateObj.year}`;
    }
    /**
     * Format countdown seconds to human readable string
     */
    formatCountdown(seconds) {
        if (seconds <= 0)
            return 'Airing now';
        const days = Math.floor(seconds / (60 * 60 * 24));
        const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
        const mins = Math.floor((seconds % (60 * 60)) / 60);
        return `${days}d ${hours}h ${mins}m`;
    }
    /**
     * Get trailer URL from trailer object
     */
    getTrailerUrl(trailer) {
        if (!trailer?.site || !trailer?.id)
            return 'None';
        const site = trailer.site.toLowerCase();
        if (site === 'youtube') {
            return `[Watch Trailer](https://www.youtube.com/watch?v=${trailer.id})`;
        }
        else if (site === 'dailymotion') {
            return `[Watch Trailer](https://www.dailymotion.com/video/${trailer.id})`;
        }
        return 'None';
    }
    /**
     * Format related entries for display
     */
    formatRelatedEntries(edges) {
        if (!edges || edges.length === 0)
            return 'No other seasons or movies available.';
        const seen = new Set();
        const list = [];
        for (const rel of edges) {
            if (!['ANIME', 'MOVIE'].includes(rel.node?.type))
                continue;
            const key = rel.node.title?.romaji;
            if (!key || seen.has(key))
                continue;
            seen.add(key);
            const typeLabel = rel.node.type === 'ANIME' ? '[TV]' : `[${rel.node.type}]`;
            const score = rel.node.averageScore || '?';
            const recommendation = this.getRecommendation(rel.node.averageScore);
            list.push(`${typeLabel} ${key} - Score: ${score} - ${recommendation}`);
        }
        return list.length > 0 ? list.join('\n') : 'No other seasons or movies available.';
    }
}
exports.AnilistService = AnilistService;
// Export singleton instance
const anilistService = new AnilistService();
exports.anilistService = anilistService;
exports.default = anilistService;
// CommonJS compatibility
module.exports = anilistService;
module.exports.anilistService = anilistService;
module.exports.AnilistService = AnilistService;
//# sourceMappingURL=anilistService.js.map