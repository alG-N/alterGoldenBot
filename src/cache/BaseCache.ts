/**
 * Base Cache Class
 * LRU cache with TTL support
 * @module cache/BaseCache
 */
// TYPES & INTERFACES
/**
 * Cache entry structure
 */
export interface CacheEntry<T = unknown> {
    /** Cached value */
    value: T;
    /** Expiration timestamp */
    expiresAt: number;
    /** Last access timestamp */
    lastAccessed: number;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
    /** Default TTL in milliseconds */
    defaultTTL?: number;
    /** Maximum number of entries */
    maxSize?: number;
    /** Cleanup interval in milliseconds */
    cleanupInterval?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
    name: string;
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: string;
    evictions: number;
}

/**
 * Internal stats tracking
 */
interface StatsTracker {
    hits: number;
    misses: number;
    evictions: number;
}

/**
 * Async factory function type for getOrSet
 */
export type CacheFactory<T> = () => Promise<T>;
// BASE CACHE CLASS
/**
 * Base cache with LRU eviction and TTL support
 */
export class BaseCache<T = unknown> {
    /** Cache name for logging/debugging */
    readonly cacheName: string;
    
    /** Default TTL in milliseconds */
    readonly defaultTTL: number;
    
    /** Maximum entries */
    readonly maxSize: number;
    
    /** Internal cache storage */
    private cache: Map<string, CacheEntry<T>>;
    
    /** Statistics tracker */
    private stats: StatsTracker;
    
    /** Cleanup interval reference */
    private cleanupInterval: NodeJS.Timeout;

    /**
     * Create a new cache
     * @param cacheName - Name for logging/debugging
     * @param config - Cache configuration
     */
    constructor(cacheName: string, config: CacheConfig = {}) {
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
        this.cleanupInterval = setInterval(
            () => this._cleanup(),
            config.cleanupInterval || 60000
        );
    }

    /**
     * Get value from cache
     * @param key - Cache key
     * @returns Cached value or null if not found/expired
     */
    get(key: string): T | null {
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
    set(key: string, value: T, ttl: number = this.defaultTTL): void {
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
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Delete a key
     * @param key - Cache key
     * @returns Whether key was deleted
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get or set pattern (cache-aside)
     * @param key - Cache key
     * @param fetcher - Async function to fetch value if not cached
     * @param ttl - TTL for new entries
     * @returns Cached or fetched value
     */
    async getOrSet(key: string, fetcher: CacheFactory<T>, ttl: number = this.defaultTTL): Promise<T> {
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
    getMany(keys: string[]): Map<string, T> {
        const results = new Map<string, T>();
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
    setMany(entries: Record<string, T>, ttl: number = this.defaultTTL): void {
        for (const [key, value] of Object.entries(entries)) {
            this.set(key, value, ttl);
        }
    }

    /**
     * Evict least recently used entry
     */
    private _evictLRU(): void {
        let oldestKey: string | null = null;
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
    private _cleanup(): void {
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
    getStats(): CacheStats {
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
    resetStats(): void {
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }

    /**
     * Get all keys
     * @returns Array of cache keys
     */
    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    /**
     * Get current size
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * Destroy cache and cleanup
     */
    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.cache.clear();
    }
}
// CommonJS COMPATIBILITY
module.exports = { BaseCache };
