"use strict";
/**
 * NHentai Service
 * Handles all API interactions with nhentai
 * @module services/api/nhentaiService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NHentaiService = exports.nhentaiService = void 0;
const axios_1 = __importDefault(require("axios"));
const CircuitBreakerRegistry_1 = require("../../core/CircuitBreakerRegistry");
// TYPES & INTERFACES
// API Configuration
const API_BASE = 'https://nhentai.net/api';
const GALLERY_ENDPOINT = '/gallery';
const THUMBNAIL_BASE = 'https://t.nhentai.net/galleries';
const IMAGE_BASE = 'https://i.nhentai.net/galleries';
// Image type mapping
const IMAGE_TYPES = {
    'j': 'jpg',
    'p': 'png',
    'g': 'gif'
};
// Known popular gallery IDs (curated fallback list)
const POPULAR_GALLERIES = [
    177013, 228922, 265918, 139808, 297974,
    331461, 255662, 324303, 271048, 317115,
    356399, 367270, 349115, 361710, 366028,
    386483, 393321, 393497, 396823, 400485
];
// Request configuration
const REQUEST_CONFIG = {
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
    }
};
// NHENTAI SERVICE CLASS
class NHentaiService {
    cache;
    cacheExpiry = 300000; // 5 minutes
    maxCacheSize = 100;
    _cleanupInterval = null;
    constructor() {
        this.cache = new Map();
        // Auto-cleanup every 10 minutes
        this._cleanupInterval = setInterval(() => this._cleanupCache(), 600000);
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
     * Fetch gallery data by code with circuit breaker
     */
    async fetchGallery(code) {
        // Check cache first
        const cached = this._getFromCache(`gallery_${code}`);
        if (cached)
            return { success: true, data: cached, fromCache: true };
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('nsfw', async () => {
            try {
                const response = await axios_1.default.get(`${API_BASE}${GALLERY_ENDPOINT}/${code}`, REQUEST_CONFIG);
                // Cache successful response
                this._setCache(`gallery_${code}`, response.data);
                return { success: true, data: response.data };
            }
            catch (error) {
                return this._handleError(error);
            }
        });
    }
    /**
     * Fetch random gallery with circuit breaker
     */
    async fetchRandomGallery() {
        const maxAttempts = 3;
        for (let i = 0; i < maxAttempts; i++) {
            // Generate random ID between 1 and current max (~500000)
            const randomCode = Math.floor(Math.random() * 500000) + 1;
            const result = await this.fetchGallery(randomCode);
            if (result.success) {
                return result;
            }
            // Proper delay between retries to avoid rate limiting (exponential backoff)
            await new Promise(r => setTimeout(r, 500 * (i + 1)));
        }
        // Fallback to known popular galleries
        return this.fetchPopularGallery();
    }
    /**
     * Fetch a popular gallery - tries actual popular API first, falls back to curated list
     */
    async fetchPopularGallery() {
        // First, try to fetch from actual popular/homepage API
        try {
            const response = await axios_1.default.get(`${API_BASE}/galleries/popular`, {
                ...REQUEST_CONFIG,
                timeout: 10000
            });
            if (response.data?.result && Array.isArray(response.data.result) && response.data.result.length > 0) {
                // Pick a random gallery from popular results
                const randomIndex = Math.floor(Math.random() * response.data.result.length);
                const gallery = response.data.result[randomIndex];
                if (gallery?.id) {
                    this._setCache(`gallery_${gallery.id}`, gallery);
                    return { success: true, data: gallery };
                }
            }
        }
        catch {
            // API failed, try homepage
        }
        // Try homepage galleries
        try {
            const response = await axios_1.default.get(`${API_BASE}/galleries/all`, {
                ...REQUEST_CONFIG,
                params: { page: 1 },
                timeout: 10000
            });
            if (response.data?.result && Array.isArray(response.data.result) && response.data.result.length > 0) {
                const randomIndex = Math.floor(Math.random() * Math.min(25, response.data.result.length));
                const gallery = response.data.result[randomIndex];
                if (gallery?.id) {
                    this._setCache(`gallery_${gallery.id}`, gallery);
                    return { success: true, data: gallery };
                }
            }
        }
        catch {
            // Homepage API also failed, fall back to curated list
        }
        // Fallback: try curated popular galleries list
        const shuffled = [...POPULAR_GALLERIES].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(5, shuffled.length); i++) {
            const galleryId = shuffled[i];
            if (galleryId === undefined)
                continue;
            try {
                const result = await this.fetchGallery(galleryId);
                if (result.success && result.data) {
                    return result;
                }
            }
            catch {
                // Try next gallery
            }
            // Small delay between attempts
            if (i < 4)
                await new Promise(r => setTimeout(r, 300));
        }
        return { success: false, error: 'Could not fetch any popular gallery. The service may be temporarily unavailable.' };
    }
    /**
     * Search galleries by query with circuit breaker
     */
    async searchGalleries(query, page = 1, sort = 'popular') {
        const cacheKey = `search_${query}_${page}_${sort}`;
        const cached = this._getFromCache(cacheKey);
        if (cached)
            return { success: true, data: cached, fromCache: true };
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('nsfw', async () => {
            try {
                const encodedQuery = encodeURIComponent(query);
                const sortParam = sort === 'recent' ? 'date' : 'popular';
                const response = await axios_1.default.get(`${API_BASE}/galleries/search?query=${encodedQuery}&page=${page}&sort=${sortParam}`, REQUEST_CONFIG);
                const data = {
                    results: response.data.result || [],
                    numPages: response.data.num_pages || 1,
                    perPage: response.data.per_page || 25,
                    totalResults: (response.data.num_pages || 1) * (response.data.per_page || 25)
                };
                this._setCache(cacheKey, data);
                return { success: true, data };
            }
            catch (error) {
                return this._handleError(error);
            }
        });
    }
    /**
     * Get autocomplete suggestions for search with circuit breaker
     */
    async getSearchSuggestions(query) {
        if (!query || query.length < 2)
            return [];
        const cacheKey = `suggest_${query.toLowerCase()}`;
        const cached = this._getFromCache(cacheKey);
        if (cached)
            return cached;
        return CircuitBreakerRegistry_1.circuitBreakerRegistry.execute('nsfw', async () => {
            try {
                const response = await axios_1.default.get(`${API_BASE}/galleries/search?query=${encodeURIComponent(query)}&page=1`, { ...REQUEST_CONFIG, timeout: 3000 });
                const results = response.data.result || [];
                // Extract unique tags from results
                const tagSet = new Set();
                results.forEach(gallery => {
                    gallery.tags?.forEach(tag => {
                        if (tag.type === 'tag' || tag.type === 'character' || tag.type === 'parody') {
                            if (tag.name.toLowerCase().includes(query.toLowerCase())) {
                                tagSet.add(tag.name);
                            }
                        }
                    });
                });
                // Also add titles that match
                const titleMatches = results
                    .filter(g => g.title?.english?.toLowerCase().includes(query.toLowerCase()) ||
                    g.title?.japanese?.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 5)
                    .map(g => g.title.english || g.title.japanese || '');
                const suggestions = [...new Set([...tagSet, ...titleMatches])].slice(0, 15);
                this._setCache(cacheKey, suggestions);
                return suggestions;
            }
            catch (error) {
                console.error('[NHentai Autocomplete Error]', error.message);
                return [];
            }
        });
    }
    /**
     * Get page image URLs for a gallery
     */
    getPageUrls(gallery, startPage = 1, endPage = null) {
        const { media_id, images } = gallery;
        const pages = images?.pages || [];
        if (pages.length === 0) {
            return [];
        }
        const end = endPage ? Math.min(endPage, pages.length) : pages.length;
        const urls = [];
        for (let i = startPage - 1; i < end; i++) {
            const page = pages[i];
            if (page) {
                const ext = IMAGE_TYPES[page.t] || 'jpg';
                urls.push({
                    pageNum: i + 1,
                    url: `${IMAGE_BASE}/${media_id}/${i + 1}.${ext}`,
                    width: page.w,
                    height: page.h
                });
            }
        }
        return urls;
    }
    /**
     * Get thumbnail URL for gallery cover
     */
    getThumbnailUrl(mediaId, coverType) {
        const ext = IMAGE_TYPES[coverType] || 'jpg';
        return `${THUMBNAIL_BASE}/${mediaId}/cover.${ext}`;
    }
    /**
     * Get page thumbnail URL (smaller size for preview)
     */
    getPageThumbnailUrl(mediaId, pageNum, pageType) {
        const ext = IMAGE_TYPES[pageType] || 'jpg';
        return `${THUMBNAIL_BASE}/${mediaId}/${pageNum}t.${ext}`;
    }
    /**
     * Parse tags by type
     */
    getTagsByType(tags, type) {
        if (!tags || !Array.isArray(tags))
            return [];
        return tags
            .filter(tag => tag.type === type)
            .map(tag => tag.name)
            .slice(0, 15);
    }
    /**
     * Get all tag types from gallery
     */
    parseAllTags(tags) {
        return {
            artists: this.getTagsByType(tags, 'artist'),
            characters: this.getTagsByType(tags, 'character'),
            parodies: this.getTagsByType(tags, 'parody'),
            groups: this.getTagsByType(tags, 'group'),
            tags: this.getTagsByType(tags, 'tag'),
            languages: this.getTagsByType(tags, 'language'),
            categories: this.getTagsByType(tags, 'category')
        };
    }
    /**
     * Handle API errors
     */
    _handleError(error) {
        const err = error;
        if (err.response?.status === 404) {
            return { success: false, error: 'Gallery not found. Please check the code.', code: 'NOT_FOUND' };
        }
        if (err.response?.status === 403) {
            return { success: false, error: 'Access denied. The gallery may be region-locked.', code: 'FORBIDDEN' };
        }
        if (err.response?.status === 429) {
            return { success: false, error: 'Rate limited. Please wait a moment.', code: 'RATE_LIMITED' };
        }
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
            return { success: false, error: 'Request timed out. Please try again.', code: 'TIMEOUT' };
        }
        console.error('[NHentai Service Error]', err.message);
        return { success: false, error: 'Failed to fetch gallery. Please try again later.', code: 'UNKNOWN' };
    }
    /**
     * Get from cache
     */
    _getFromCache(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    /**
     * Set to cache
     */
    _setCache(key, data) {
        // Evict oldest if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + this.cacheExpiry
        });
    }
    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
            this._cleanupInterval = null;
        }
        this.cache.clear();
    }
}
exports.NHentaiService = NHentaiService;
// Export singleton instance
const nhentaiService = new NHentaiService();
exports.nhentaiService = nhentaiService;
exports.default = nhentaiService;
// CommonJS compatibility
module.exports = nhentaiService;
module.exports.nhentaiService = nhentaiService;
module.exports.NHentaiService = NHentaiService;
//# sourceMappingURL=nhentaiService.js.map