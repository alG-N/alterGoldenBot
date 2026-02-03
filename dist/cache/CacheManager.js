"use strict";
/**
 * Cache Manager
 * Centralized cache management and monitoring
 * @module cache/CacheManager
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.guildCache = exports.userCache = exports.apiCache = exports.globalCacheManager = exports.CacheManager = void 0;
const BaseCache_1 = require("./BaseCache");
// CACHE MANAGER CLASS
/**
 * Cache Manager - creates and tracks all caches
 */
class CacheManager {
    /** Registry of all caches */
    caches;
    constructor() {
        this.caches = new Map();
    }
    /**
     * Create or get a cache
     * @param name - Cache name
     * @param config - Cache configuration
     * @returns The cache instance
     */
    getCache(name, config = {}) {
        if (this.caches.has(name)) {
            return this.caches.get(name);
        }
        const cache = new BaseCache_1.BaseCache(name, config);
        this.caches.set(name, cache);
        return cache;
    }
    /**
     * Create a cache with specific settings
     * @param name - Cache name
     * @param config - Cache config
     * @returns The new cache instance
     * @throws Error if cache already exists
     */
    createCache(name, config = {}) {
        if (this.caches.has(name)) {
            throw new Error(`Cache "${name}" already exists`);
        }
        const cache = new BaseCache_1.BaseCache(name, config);
        this.caches.set(name, cache);
        return cache;
    }
    /**
     * Check if cache exists
     * @param name - Cache name
     * @returns True if cache exists
     */
    hasCache(name) {
        return this.caches.has(name);
    }
    /**
     * Delete a cache
     * @param name - Cache name
     * @returns True if cache was deleted
     */
    deleteCache(name) {
        const cache = this.caches.get(name);
        if (cache) {
            cache.destroy();
            return this.caches.delete(name);
        }
        return false;
    }
    /**
     * Clear all caches
     */
    clearAll() {
        for (const cache of this.caches.values()) {
            cache.clear();
        }
    }
    /**
     * Get stats for all caches
     * @returns Statistics for each cache
     */
    getAllStats() {
        const stats = {};
        for (const [name, cache] of this.caches) {
            stats[name] = cache.getStats();
        }
        return stats;
    }
    /**
     * Get total memory estimate
     * @returns Memory statistics
     */
    getMemoryStats() {
        let totalEntries = 0;
        let totalMaxSize = 0;
        for (const cache of this.caches.values()) {
            totalEntries += cache.size;
            totalMaxSize += cache.maxSize;
        }
        const utilization = totalMaxSize > 0
            ? ((totalEntries / totalMaxSize) * 100).toFixed(2)
            : '0';
        return {
            cacheCount: this.caches.size,
            totalEntries,
            totalMaxSize,
            utilization: `${utilization}%`
        };
    }
    /**
     * Get number of caches
     */
    get size() {
        return this.caches.size;
    }
    /**
     * Destroy all caches
     */
    destroy() {
        for (const cache of this.caches.values()) {
            cache.destroy();
        }
        this.caches.clear();
    }
}
exports.CacheManager = CacheManager;
// SINGLETON & PRE-CREATED CACHES
/**
 * Global cache manager instance
 */
exports.globalCacheManager = new CacheManager();
/**
 * Pre-created API cache (10 minutes TTL, 1000 entries)
 */
exports.apiCache = exports.globalCacheManager.getCache('api', {
    defaultTTL: 600000, // 10 minutes
    maxSize: 1000
});
/**
 * Pre-created user cache (5 minutes TTL, 5000 entries)
 */
exports.userCache = exports.globalCacheManager.getCache('user', {
    defaultTTL: 300000, // 5 minutes
    maxSize: 5000
});
/**
 * Pre-created guild cache (5 minutes TTL, 2000 entries)
 */
exports.guildCache = exports.globalCacheManager.getCache('guild', {
    defaultTTL: 300000, // 5 minutes
    maxSize: 2000
});
// CommonJS COMPATIBILITY
module.exports = {
    CacheManager,
    globalCacheManager: exports.globalCacheManager,
    apiCache: exports.apiCache,
    userCache: exports.userCache,
    guildCache: exports.guildCache
};
//# sourceMappingURL=CacheManager.js.map