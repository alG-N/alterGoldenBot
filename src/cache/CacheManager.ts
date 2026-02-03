/**
 * Cache Manager
 * Centralized cache management and monitoring
 * @module cache/CacheManager
 */

import { BaseCache, CacheConfig, CacheStats } from './BaseCache';
// TYPES & INTERFACES
/**
 * Memory statistics for all caches
 */
export interface MemoryStats {
    cacheCount: number;
    totalEntries: number;
    totalMaxSize: number;
    utilization: string;
}

/**
 * Statistics for all caches
 */
export type AllCacheStats = Record<string, CacheStats>;
// CACHE MANAGER CLASS
/**
 * Cache Manager - creates and tracks all caches
 */
export class CacheManager {
    /** Registry of all caches */
    private caches: Map<string, BaseCache>;

    constructor() {
        this.caches = new Map();
    }

    /**
     * Create or get a cache
     * @param name - Cache name
     * @param config - Cache configuration
     * @returns The cache instance
     */
    getCache<T = unknown>(name: string, config: CacheConfig = {}): BaseCache<T> {
        if (this.caches.has(name)) {
            return this.caches.get(name) as BaseCache<T>;
        }
        
        const cache = new BaseCache<T>(name, config);
        this.caches.set(name, cache as BaseCache);
        return cache;
    }

    /**
     * Create a cache with specific settings
     * @param name - Cache name
     * @param config - Cache config
     * @returns The new cache instance
     * @throws Error if cache already exists
     */
    createCache<T = unknown>(name: string, config: CacheConfig = {}): BaseCache<T> {
        if (this.caches.has(name)) {
            throw new Error(`Cache "${name}" already exists`);
        }
        
        const cache = new BaseCache<T>(name, config);
        this.caches.set(name, cache as BaseCache);
        return cache;
    }

    /**
     * Check if cache exists
     * @param name - Cache name
     * @returns True if cache exists
     */
    hasCache(name: string): boolean {
        return this.caches.has(name);
    }

    /**
     * Delete a cache
     * @param name - Cache name
     * @returns True if cache was deleted
     */
    deleteCache(name: string): boolean {
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
    clearAll(): void {
        for (const cache of this.caches.values()) {
            cache.clear();
        }
    }

    /**
     * Get stats for all caches
     * @returns Statistics for each cache
     */
    getAllStats(): AllCacheStats {
        const stats: AllCacheStats = {};
        for (const [name, cache] of this.caches) {
            stats[name] = cache.getStats();
        }
        return stats;
    }

    /**
     * Get total memory estimate
     * @returns Memory statistics
     */
    getMemoryStats(): MemoryStats {
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
    get size(): number {
        return this.caches.size;
    }

    /**
     * Destroy all caches
     */
    destroy(): void {
        for (const cache of this.caches.values()) {
            cache.destroy();
        }
        this.caches.clear();
    }
}
// SINGLETON & PRE-CREATED CACHES
/**
 * Global cache manager instance
 */
export const globalCacheManager = new CacheManager();

/**
 * Pre-created API cache (10 minutes TTL, 1000 entries)
 */
export const apiCache = globalCacheManager.getCache('api', {
    defaultTTL: 600000,  // 10 minutes
    maxSize: 1000
});

/**
 * Pre-created user cache (5 minutes TTL, 5000 entries)
 */
export const userCache = globalCacheManager.getCache('user', {
    defaultTTL: 300000,  // 5 minutes
    maxSize: 5000
});

/**
 * Pre-created guild cache (5 minutes TTL, 2000 entries)
 */
export const guildCache = globalCacheManager.getCache('guild', {
    defaultTTL: 300000,  // 5 minutes
    maxSize: 2000
});
// CommonJS COMPATIBILITY
module.exports = {
    CacheManager,
    globalCacheManager,
    apiCache,
    userCache,
    guildCache
};
