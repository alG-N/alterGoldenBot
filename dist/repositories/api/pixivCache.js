"use strict";
/**
 * Pixiv Cache - Extends BaseCache with search-specific functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixivCache = exports.pixivCache = void 0;
const BaseCache_1 = require("../../cache/BaseCache");
// PixivCache Class
class PixivCache {
    searchCache;
    resultCache;
    constructor() {
        // Use BaseCache for both caches
        this.searchCache = new BaseCache_1.BaseCache('pixiv-search', {
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            maxSize: 200
        });
        this.resultCache = new BaseCache_1.BaseCache('pixiv-results', {
            defaultTTL: 30 * 60 * 1000, // 30 minutes
            maxSize: 100
        });
    }
    // Search autocomplete cache
    getSearchSuggestions(query) {
        const key = query.toLowerCase();
        return this.searchCache.get(key) || null;
    }
    setSearchSuggestions(query, results) {
        const key = query.toLowerCase();
        this.searchCache.set(key, results);
    }
    // Result cache for pagination
    getResults(cacheKey) {
        return this.resultCache.get(cacheKey) || null;
    }
    setResults(cacheKey, data) {
        this.resultCache.set(cacheKey, data);
    }
    deleteResults(cacheKey) {
        this.resultCache.delete(cacheKey);
    }
    // Alias methods for button handler compatibility
    getSearchResults(cacheKey) {
        return this.getResults(cacheKey);
    }
    setSearchResults(cacheKey, data) {
        this.setResults(cacheKey, {
            ...data,
            currentIndex: data.currentIndex || 0,
            mangaPageIndex: data.mangaPageIndex || 0,
            results: data.results
        });
    }
    updateSearchResults(cacheKey, updates) {
        const existing = this.getResults(cacheKey);
        if (existing) {
            this.setResults(cacheKey, { ...existing, ...updates });
        }
    }
}
exports.PixivCache = PixivCache;
// Export singleton instance
const pixivCache = new PixivCache();
exports.pixivCache = pixivCache;
exports.default = pixivCache;
//# sourceMappingURL=pixivCache.js.map