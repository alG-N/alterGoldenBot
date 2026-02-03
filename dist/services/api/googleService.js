"use strict";
/**
 * Google/Search Service
 * Handles Google Custom Search API and DuckDuckGo fallback
 * @module services/api/googleService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleService = exports.googleService = void 0;
const axios_1 = __importDefault(require("axios"));
const CircuitBreakerRegistry_1 = require("../../core/CircuitBreakerRegistry");
// CONFIGURATION
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;
const USE_DUCKDUCKGO = !GOOGLE_API_KEY || !GOOGLE_CX;
const REQUEST_TIMEOUT = 10000;
// GOOGLE SERVICE CLASS
/**
 * Google Search Service with DuckDuckGo fallback
 */
class GoogleService {
    cache;
    cacheExpiry;
    maxCacheSize;
    useDuckDuckGo;
    cleanupInterval;
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 300000; // 5 minutes
        this.maxCacheSize = 50;
        this.useDuckDuckGo = USE_DUCKDUCKGO;
        this.cleanupInterval = null;
        // Auto-cleanup every 10 minutes
        this.cleanupInterval = setInterval(() => this._cleanupCache(), 600000);
    }
    /**
     * Cleanup expired cache entries
     */
    _cleanupCache() {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Main search method with circuit breaker protection
     */
    async search(query, options = {}) {
        const { safeSearch = true, maxResults = 5 } = options;
        // Check cache
        const cacheKey = `search_${query}_${safeSearch}_${maxResults}`;
        const cached = this._getFromCache(cacheKey);
        if (cached)
            return { ...cached, fromCache: true };
        // Execute with circuit breaker
        const result = await CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('google', async () => {
            if (this.useDuckDuckGo) {
                return this.searchDuckDuckGo(query);
            }
            else {
                return this.searchGoogle(query, safeSearch, maxResults);
            }
        });
        if (result.success) {
            this._setCache(cacheKey, result);
        }
        return result;
    }
    /**
     * Search using Google Custom Search API
     */
    async searchGoogle(query, safeSearch = true, maxResults = 5) {
        try {
            const params = {
                key: GOOGLE_API_KEY,
                cx: GOOGLE_CX,
                q: query,
                num: Math.min(maxResults, 10),
                safe: safeSearch ? 'active' : 'off'
            };
            const response = await axios_1.default.get('https://www.googleapis.com/customsearch/v1', { params, timeout: REQUEST_TIMEOUT });
            if (!response.data.items || response.data.items.length === 0) {
                return {
                    success: true,
                    results: [],
                    totalResults: 0,
                    searchEngine: 'Google'
                };
            }
            const results = response.data.items.map(item => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet || 'No description available.',
                displayLink: item.displayLink || '',
                thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || null
            }));
            return {
                success: true,
                results,
                totalResults: parseInt(response.data.searchInformation?.totalResults || String(results.length)),
                searchEngine: 'Google'
            };
        }
        catch (error) {
            const axiosError = error;
            console.error('[Google Search Error]', axiosError.message);
            // Fallback to DuckDuckGo on error
            if (axiosError.response?.status === 429 || axiosError.response?.status === 403) {
                console.log('[Google] Falling back to DuckDuckGo');
                return this.searchDuckDuckGo(query);
            }
            return {
                success: false,
                error: 'Search failed. Please try again.',
                searchEngine: 'Google'
            };
        }
    }
    /**
     * Search using DuckDuckGo Instant Answer API
     */
    async searchDuckDuckGo(query) {
        try {
            const response = await axios_1.default.get('https://api.duckduckgo.com/', {
                params: {
                    q: query,
                    format: 'json',
                    no_html: 1,
                    skip_disambig: 1
                },
                timeout: REQUEST_TIMEOUT
            });
            const data = response.data;
            const results = [];
            // Add abstract if available
            if (data.Abstract) {
                results.push({
                    title: data.Heading || query,
                    link: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                    snippet: data.Abstract,
                    displayLink: data.AbstractSource || 'DuckDuckGo',
                    thumbnail: data.Image || null
                });
            }
            // Add related topics
            if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
                for (const topic of data.RelatedTopics.slice(0, 4)) {
                    if (topic.FirstURL && topic.Text) {
                        try {
                            results.push({
                                title: topic.Text.split(' - ')[0]?.substring(0, 100) || topic.Text.substring(0, 100),
                                link: topic.FirstURL,
                                snippet: topic.Text,
                                displayLink: new URL(topic.FirstURL).hostname,
                                thumbnail: topic.Icon?.URL || null
                            });
                        }
                        catch {
                            // Skip malformed URLs
                        }
                    }
                }
            }
            // Provide search link if no results
            if (results.length === 0) {
                results.push({
                    title: `Search "${query}" on DuckDuckGo`,
                    link: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                    snippet: 'Click to view search results on DuckDuckGo',
                    displayLink: 'duckduckgo.com',
                    thumbnail: null
                });
            }
            return {
                success: true,
                results,
                totalResults: results.length,
                searchEngine: 'DuckDuckGo'
            };
        }
        catch (error) {
            console.error('[DuckDuckGo Search Error]', error.message);
            return {
                success: false,
                error: 'Search failed. Please try again.',
                searchEngine: 'DuckDuckGo'
            };
        }
    }
    /**
     * Get current search engine being used
     */
    getSearchEngine() {
        return this.useDuckDuckGo ? 'DuckDuckGo' : 'Google';
    }
    /**
     * Cache management - get
     */
    _getFromCache(key) {
        const entry = this.cache.get(key);
        if (!entry || Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    /**
     * Cache management - set
     */
    _setCache(key, data) {
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey)
                this.cache.delete(oldestKey);
        }
        this.cache.set(key, { data, expiresAt: Date.now() + this.cacheExpiry });
    }
    /**
     * Cleanup on shutdown
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cache.clear();
    }
}
exports.GoogleService = GoogleService;
// Export singleton and class
const googleService = new GoogleService();
exports.googleService = googleService;
exports.default = googleService;
// CommonJS compatibility
module.exports = googleService;
module.exports.googleService = googleService;
module.exports.GoogleService = GoogleService;
//# sourceMappingURL=googleService.js.map