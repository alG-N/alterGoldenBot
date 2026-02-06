"use strict";
/**
 * Wikipedia Service
 * Handles Wikipedia API requests with circuit breaker protection
 * @module services/api/wikipediaService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WikipediaService = exports.wikipediaService = void 0;
const axios_1 = __importDefault(require("axios"));
const CircuitBreakerRegistry_1 = require("../../core/CircuitBreakerRegistry");
const CacheService_js_1 = __importDefault(require("../../cache/CacheService.js"));
// CONFIGURATION
const LANGUAGE_ENDPOINTS = {
    en: { api: 'https://en.wikipedia.org/w/api.php', rest: 'https://en.wikipedia.org/api/rest_v1' },
    ja: { api: 'https://ja.wikipedia.org/w/api.php', rest: 'https://ja.wikipedia.org/api/rest_v1' },
    de: { api: 'https://de.wikipedia.org/w/api.php', rest: 'https://de.wikipedia.org/api/rest_v1' },
    fr: { api: 'https://fr.wikipedia.org/w/api.php', rest: 'https://fr.wikipedia.org/api/rest_v1' },
    es: { api: 'https://es.wikipedia.org/w/api.php', rest: 'https://es.wikipedia.org/api/rest_v1' }
};
const REQUEST_CONFIG = {
    timeout: 10000,
    headers: {
        'User-Agent': 'FumoBOT/2.0 (Discord Bot; https://github.com/fumobot)',
        'Accept': 'application/json'
    }
};
// WIKIPEDIA SERVICE CLASS
class WikipediaService {
    CACHE_NS = 'api';
    CACHE_TTL = 600; // 10 minutes in seconds
    defaultLanguage;
    constructor() {
        this.defaultLanguage = 'en';
    }
    _getEndpoints(language) {
        return LANGUAGE_ENDPOINTS[language] || LANGUAGE_ENDPOINTS.en;
    }
    /**
     * Search Wikipedia for articles
     */
    async search(query, options = {}) {
        const { language = this.defaultLanguage, limit = 5 } = options;
        const endpoints = this._getEndpoints(language);
        // Check cache
        const cacheKey = `wiki:search_${language}_${query}`;
        const cached = await CacheService_js_1.default.get(this.CACHE_NS, cacheKey);
        if (cached)
            return { ...cached, fromCache: true };
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('wikipedia', async () => {
            try {
                const response = await axios_1.default.get(endpoints.api, {
                    ...REQUEST_CONFIG,
                    params: {
                        action: 'opensearch',
                        search: query,
                        limit: Math.min(limit, 10),
                        namespace: 0,
                        format: 'json'
                    }
                });
                const [searchTerm, titles, descriptions, urls] = response.data;
                if (!titles || titles.length === 0) {
                    return { success: true, results: [], query: searchTerm };
                }
                const results = titles.map((title, i) => ({
                    title,
                    description: descriptions[i] || 'No description available.',
                    url: urls[i] || ''
                }));
                const result = { success: true, results, query: searchTerm };
                await CacheService_js_1.default.set(this.CACHE_NS, cacheKey, result, this.CACHE_TTL);
                return result;
            }
            catch (error) {
                console.error('[Wikipedia Search Error]', error.message);
                return { success: false, error: 'Failed to search Wikipedia. Please try again.' };
            }
        });
    }
    /**
     * Get article summary
     */
    async getArticleSummary(title, language = 'en') {
        const endpoints = this._getEndpoints(language);
        // Check cache
        const cacheKey = `wiki:article_${language}_${title}`;
        const cached = await CacheService_js_1.default.get(this.CACHE_NS, cacheKey);
        if (cached)
            return { ...cached, fromCache: true };
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('wikipedia', async () => {
            try {
                const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
                const response = await axios_1.default.get(`${endpoints.rest}/page/summary/${encodedTitle}`, REQUEST_CONFIG);
                const data = response.data;
                const article = {
                    title: data.title,
                    displayTitle: data.displaytitle || data.title,
                    description: data.description || null,
                    extract: data.extract || 'No summary available.',
                    extractHtml: data.extract_html || null,
                    url: data.content_urls?.desktop?.page || `https://${language}.wikipedia.org/wiki/${encodedTitle}`,
                    mobileUrl: data.content_urls?.mobile?.page || null,
                    thumbnail: data.thumbnail?.source || null,
                    originalImage: data.originalimage?.source || null,
                    type: data.type,
                    timestamp: data.timestamp,
                    language,
                    coordinates: data.coordinates || null
                };
                const result = { success: true, article };
                await CacheService_js_1.default.set(this.CACHE_NS, cacheKey, result, this.CACHE_TTL);
                return result;
            }
            catch (error) {
                const axiosError = error;
                if (axiosError.response?.status === 404) {
                    return { success: false, error: 'Article not found.', code: 'NOT_FOUND' };
                }
                console.error('[Wikipedia Article Error]', error.message);
                return { success: false, error: 'Failed to fetch article. Please try again.' };
            }
        });
    }
    /**
     * Get random article
     */
    async getRandomArticle(language = 'en') {
        const endpoints = this._getEndpoints(language);
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('wikipedia', async () => {
            try {
                const response = await axios_1.default.get(`${endpoints.rest}/page/random/summary`, REQUEST_CONFIG);
                const data = response.data;
                return {
                    success: true,
                    article: {
                        title: data.title,
                        displayTitle: data.displaytitle || data.title,
                        description: data.description || null,
                        extract: data.extract || 'No summary available.',
                        url: data.content_urls?.desktop?.page,
                        thumbnail: data.thumbnail?.source || null,
                        originalImage: data.originalimage?.source || null,
                        type: data.type,
                        language
                    }
                };
            }
            catch (error) {
                console.error('[Wikipedia Random Error]', error.message);
                return { success: false, error: 'Failed to fetch random article. Please try again.' };
            }
        });
    }
    /**
     * Get "On This Day" events
     */
    async getOnThisDay(month, day, language = 'en') {
        const endpoints = this._getEndpoints(language);
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('wikipedia', async () => {
            try {
                const response = await axios_1.default.get(`${endpoints.rest}/feed/onthisday/events/${month}/${day}`, REQUEST_CONFIG);
                const events = response.data.events?.slice(0, 5).map((event) => ({
                    year: event.year,
                    text: event.text,
                    pages: event.pages?.slice(0, 3).map(p => ({
                        title: p.title,
                        url: p.content_urls?.desktop?.page
                    }))
                })) || [];
                return { success: true, events, date: { month, day } };
            }
            catch (error) {
                console.error('[Wikipedia OnThisDay Error]', error.message);
                return { success: false, error: 'Failed to fetch events. Please try again.' };
            }
        });
    }
    /**
     * Get featured article of the day
     */
    async getFeaturedArticle(date = new Date(), language = 'en') {
        const endpoints = this._getEndpoints(language);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('wikipedia', async () => {
            try {
                const response = await axios_1.default.get(`${endpoints.rest}/feed/featured/${year}/${month}/${day}`, REQUEST_CONFIG);
                const tfa = response.data.tfa;
                if (!tfa) {
                    return { success: false, error: 'No featured article available for this date.' };
                }
                return {
                    success: true,
                    article: {
                        title: tfa.title,
                        displayTitle: tfa.displaytitle || tfa.title,
                        description: null,
                        extract: tfa.extract,
                        url: tfa.content_urls?.desktop?.page,
                        thumbnail: tfa.thumbnail?.source || null,
                        originalImage: null,
                        language
                    }
                };
            }
            catch (error) {
                console.error('[Wikipedia Featured Error]', error.message);
                return { success: false, error: 'Failed to fetch featured article.' };
            }
        });
    }
    /**
     * Cleanup on shutdown
     */
    shutdown() {
        // No local resources to clean up
    }
}
exports.WikipediaService = WikipediaService;
// Export singleton and class
const wikipediaService = new WikipediaService();
exports.wikipediaService = wikipediaService;
exports.default = wikipediaService;
// CommonJS compatibility
module.exports = wikipediaService;
module.exports.wikipediaService = wikipediaService;
module.exports.WikipediaService = WikipediaService;
//# sourceMappingURL=wikipediaService.js.map