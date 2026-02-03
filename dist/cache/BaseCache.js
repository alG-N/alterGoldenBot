"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCache = void 0;
// BASE CACHE CLASS
/**
 * Base cache with LRU eviction and TTL support
 */
class BaseCache {
    /** Cache name for logging/debugging */
    cacheName;
    /** Default TTL in milliseconds */
    defaultTTL;
    /** Maximum entries */
    maxSize;
    /** Internal cache storage */
    cache;
    /** Statistics tracker */
    stats;
    /** Cleanup interval reference */
    cleanupInterval;
    /**
     * Create a new cache
     * @param cacheName - Name for logging/debugging
     * @param config - Cache configuration
     */
    constructor(cacheName, config = {}) {
        this.cacheName = cacheName;
        this.defaultTTL = config.defaultTTL || 300000; // 5 minutes
        this.maxSize = config.maxSize || 500;
        this.cache = new Map();
        // Stats for monitoring
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
        // Auto cleanup
        this.cleanupInterval = setInterval(() => this._cleanup(), config.cleanupInterval || 60000);
    }
    /**
     * Get value from cache
     * @param key - Cache key
     * @returns Cached value or null if not found/expired
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        // Update LRU tracking
        entry.lastAccessed = Date.now();
        this.stats.hits++;
        return entry.value;
    }
    /**
     * Set value in cache
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - TTL in milliseconds (uses default if not provided)
     */
    set(key, value, ttl = this.defaultTTL) {
        // Evict if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this._evictLRU();
        }
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttl,
            lastAccessed: Date.now()
        });
    }
    /**
     * Check if key exists (and is valid)
     * @param key - Cache key
     * @returns True if key exists and is not expired
     */
    has(key) {
        return this.get(key) !== null;
    }
    /**
     * Delete a key
     * @param key - Cache key
     * @returns Whether key was deleted
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Clear all entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get or set pattern (cache-aside)
     * @param key - Cache key
     * @param fetcher - Async function to fetch value if not cached
     * @param ttl - TTL for new entries
     * @returns Cached or fetched value
     */
    async getOrSet(key, fetcher, ttl = this.defaultTTL) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        const value = await fetcher();
        this.set(key, value, ttl);
        return value;
    }
    /**
     * Get multiple keys
     * @param keys - Cache keys
     * @returns Map of found values
     */
    getMany(keys) {
        const results = new Map();
        for (const key of keys) {
            const value = this.get(key);
            if (value !== null) {
                results.set(key, value);
            }
        }
        return results;
    }
    /**
     * Set multiple key-value pairs
     * @param entries - Object of key-value pairs
     * @param ttl - TTL for all entries
     */
    setMany(entries, ttl = this.defaultTTL) {
        for (const [key, value] of Object.entries(entries)) {
            this.set(key, value, ttl);
        }
    }
    /**
     * Evict least recently used entry
     */
    _evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }
    }
    /**
     * Cleanup expired entries
     */
    _cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Get cache statistics
     * @returns Cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : '0';
        return {
            name: this.cacheName,
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: `${hitRate}%`,
            evictions: this.stats.evictions
        };
    }
    /**
     * Reset stats
     */
    resetStats() {
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }
    /**
     * Get all keys
     * @returns Array of cache keys
     */
    keys() {
        return Array.from(this.cache.keys());
    }
    /**
     * Get current size
     */
    get size() {
        return this.cache.size;
    }
    /**
     * Destroy cache and cleanup
     */
    destroy() {
        clearInterval(this.cleanupInterval);
        this.cache.clear();
    }
}
exports.BaseCache = BaseCache;
// CommonJS COMPATIBILITY
module.exports = { BaseCache };
//# sourceMappingURL=BaseCache.js.map