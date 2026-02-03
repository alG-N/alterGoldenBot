/**
 * Unified Cache Service
 * Single interface for all caching needs
 * Supports Redis (distributed) with in-memory fallback
 * Integrates with GracefulDegradation for automatic failover
 * @module cache/CacheService
 */

import type { Redis } from 'ioredis';

// Helper to get default export from require()
const getDefault = <T>(mod: { default?: T } | T): T => (mod as { default?: T }).default || mod as T;

// Use require for internal modules to avoid circular dependency issues
const logger = getDefault(require('../core/Logger'));

// Lazy-load to avoid circular dependency
let gracefulDegradation: ReturnType<typeof require> | null = null;
const getGracefulDegradation = () => {
    if (!gracefulDegradation) {
        gracefulDegradation = getDefault(require('../core/GracefulDegradation'));
    }
    return gracefulDegradation;
};
// TYPES & INTERFACES
/**
 * Cache namespace configuration
 */
export interface NamespaceConfig {
    /** Default TTL in seconds */
    ttl: number;
    /** Max entries (for in-memory) */
    maxSize: number;
    /** Whether to use Redis for this namespace */
    useRedis: boolean;
}

/**
 * Cache entry stored in memory
 */
interface MemoryCacheEntry<T = unknown> {
    value: T;
    expiresAt: number;
}

/**
 * Cache service metrics
 */
export interface CacheMetrics {
    hits: number;
    misses: number;
    writes: number;
    deletes: number;
    errors: number;
    redisHits: number;
    memoryHits: number;
    redisFallbacks: number;
}

/**
 * Cache statistics with service state
 */
export interface CacheServiceStats extends CacheMetrics {
    hitRate: number;
    redisConnected: boolean;
    redisState: string;
    redisFailures: number;
    memoryEntries: number;
    namespaces: string[];
}

/**
 * Options for CacheService constructor
 */
export interface CacheServiceOptions {
    maxRedisFailures?: number;
    cleanupIntervalMs?: number;
}

/**
 * Factory function for getOrSet pattern
 */
export type CacheFactory<T> = () => Promise<T>;
// DEFAULT CONFIGURATION
/**
 * Default namespace configurations
 */
export const DEFAULT_NAMESPACES: Record<string, NamespaceConfig> = {
    'guild': { ttl: 300, maxSize: 1000, useRedis: true },      // Guild settings - 5min
    'user': { ttl: 600, maxSize: 2000, useRedis: true },       // User data - 10min
    'api': { ttl: 300, maxSize: 500, useRedis: true },         // API responses - 5min
    'music': { ttl: 3600, maxSize: 200, useRedis: true },      // Music queues - 1h
    'automod': { ttl: 60, maxSize: 5000, useRedis: true },     // AutoMod tracking - 1min
    'ratelimit': { ttl: 60, maxSize: 10000, useRedis: true },  // Rate limits - 1min
    'session': { ttl: 1800, maxSize: 500, useRedis: true },    // Sessions - 30min
    'temp': { ttl: 60, maxSize: 1000, useRedis: false },       // Temporary - 1min, memory only
};

/**
 * Default temp namespace config for fallback
 */
const DEFAULT_TEMP_CONFIG: NamespaceConfig = { ttl: 60, maxSize: 1000, useRedis: false };
// CACHE SERVICE CLASS
/**
 * Unified cache service with Redis + memory fallback
 */
export class CacheService {
    /** Redis client instance */
    private redis: Redis | null = null;
    
    /** Whether Redis is currently connected */
    private isRedisConnected: boolean = false;
    
    /** In-memory cache storage by namespace */
    private memoryCache: Map<string, Map<string, MemoryCacheEntry>>;
    
    /** Namespace configurations */
    private namespaces: Map<string, NamespaceConfig>;
    
    /** Performance metrics */
    private metrics: CacheMetrics;
    
    /** Consecutive Redis failures */
    private redisFailures: number = 0;
    
    /** Max failures before marking degraded */
    private maxRedisFailures: number;
    
    /** Cleanup interval reference */
    private _cleanupInterval: NodeJS.Timeout;

    constructor(options: CacheServiceOptions = {}) {
        this.memoryCache = new Map();
        this.namespaces = new Map(Object.entries(DEFAULT_NAMESPACES));
        this.maxRedisFailures = options.maxRedisFailures || 3;
        
        // Initialize metrics
        this.metrics = {
            hits: 0,
            misses: 0,
            writes: 0,
            deletes: 0,
            errors: 0,
            redisHits: 0,
            memoryHits: 0,
            redisFallbacks: 0,
        };
        
        // Cleanup interval for memory cache
        this._cleanupInterval = setInterval(
            () => this._cleanupMemory(), 
            options.cleanupIntervalMs || 60000
        );
    }

    /**
     * Initialize with Redis connection
     * @param redisClient - ioredis client instance
     */
    setRedis(redisClient: Redis | null): void {
        this.redis = redisClient;
        this.isRedisConnected = !!redisClient;
        
        if (redisClient) {
            // Register with graceful degradation
            const gd = getGracefulDegradation();
            gd.initialize();
            gd.registerFallback('redis', async () => null); // Fallback returns null (cache miss)
            
            // Listen for Redis errors
            redisClient.on('error', (error: Error) => {
                this._handleRedisError(error);
            });
            
            redisClient.on('connect', () => {
                this._handleRedisReconnect();
            });
        }
        
        logger.info('CacheService', `Redis ${this.isRedisConnected ? 'connected' : 'not available'}`);
    }

    /**
     * Handle Redis error
     */
    private _handleRedisError(error: Error): void {
        this.redisFailures++;
        logger.error('CacheService', `Redis error (${this.redisFailures}/${this.maxRedisFailures}): ${error.message}`);
        
        if (this.redisFailures >= this.maxRedisFailures) {
            const gd = getGracefulDegradation();
            gd.markDegraded('redis', 'Too many failures');
            this.isRedisConnected = false;
        }
    }

    /**
     * Handle Redis reconnection
     */
    private _handleRedisReconnect(): void {
        this.redisFailures = 0;
        this.isRedisConnected = true;
        
        const gd = getGracefulDegradation();
        gd.markHealthy('redis');
        
        logger.info('CacheService', 'Redis reconnected');
    }

    /**
     * Register a new namespace with custom config
     * @param namespace - Namespace name
     * @param config - Namespace configuration
     */
    registerNamespace(namespace: string, config: Partial<NamespaceConfig>): void {
        this.namespaces.set(namespace, {
            ttl: config.ttl || 300,
            maxSize: config.maxSize || 1000,
            useRedis: config.useRedis !== false,
        });
    }

    /**
     * Build full cache key
     */
    private _buildKey(namespace: string, key: string): string {
        return `${namespace}:${key}`;
    }

    /**
     * Get namespace config
     */
    private _getNamespaceConfig(namespace: string): NamespaceConfig {
        return this.namespaces.get(namespace) ?? DEFAULT_TEMP_CONFIG;
    }

    /**
     * Get value from cache
     * @param namespace - Cache namespace
     * @param key - Cache key
     * @returns Cached value or null
     */
    async get<T = unknown>(namespace: string, key: string): Promise<T | null> {
        const fullKey = this._buildKey(namespace, key);
        const config = this._getNamespaceConfig(namespace);

        try {
            // Try Redis first if enabled and connected
            if (config.useRedis && this.isRedisConnected && this.redis) {
                try {
                    const value = await this.redis.get(fullKey);
                    if (value !== null) {
                        this.metrics.hits++;
                        this.metrics.redisHits++;
                        // Reset failures on success
                        this.redisFailures = 0;
                        return JSON.parse(value) as T;
                    }
                } catch (redisError) {
                    // Redis operation failed, mark and fallback
                    this._handleRedisError(redisError as Error);
                    this.metrics.redisFallbacks++;
                }
            }

            // Fallback to memory (either Redis disabled, disconnected, or failed)
            const memNs = this.memoryCache.get(namespace);
            if (memNs) {
                const entry = memNs.get(key);
                if (entry && Date.now() < entry.expiresAt) {
                    this.metrics.hits++;
                    this.metrics.memoryHits++;
                    return entry.value as T;
                }
                // Clean up expired
                if (entry) memNs.delete(key);
            }

            this.metrics.misses++;
            return null;
        } catch (error) {
            this.metrics.errors++;
            logger.error('CacheService', `Get error: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Set value in cache
     * @param namespace - Cache namespace
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - TTL in seconds (optional, uses namespace default)
     */
    async set<T = unknown>(namespace: string, key: string, value: T, ttl?: number): Promise<void> {
        const fullKey = this._buildKey(namespace, key);
        const config = this._getNamespaceConfig(namespace);
        const actualTtl = ttl || config.ttl;

        try {
            this.metrics.writes++;

            // Write to Redis if enabled and connected
            if (config.useRedis && this.isRedisConnected && this.redis) {
                try {
                    await this.redis.setex(fullKey, actualTtl, JSON.stringify(value));
                    // Reset failures on success
                    this.redisFailures = 0;
                } catch (redisError) {
                    // Redis write failed, mark and continue to memory
                    this._handleRedisError(redisError as Error);
                    this.metrics.redisFallbacks++;
                }
            }

            // Always write to memory as fallback
            if (!this.memoryCache.has(namespace)) {
                this.memoryCache.set(namespace, new Map());
            }
            
            const memNs = this.memoryCache.get(namespace)!;
            
            // Evict if at capacity
            if (memNs.size >= config.maxSize) {
                this._evictLRU(namespace);
            }
            
            memNs.set(key, {
                value,
                expiresAt: Date.now() + (actualTtl * 1000)
            });
        } catch (error) {
            this.metrics.errors++;
            logger.error('CacheService', `Set error: ${(error as Error).message}`);
        }
    }

    /**
     * Delete value from cache
     * @param namespace - Cache namespace
     * @param key - Cache key
     */
    async delete(namespace: string, key: string): Promise<void> {
        const fullKey = this._buildKey(namespace, key);
        const config = this._getNamespaceConfig(namespace);

        try {
            this.metrics.deletes++;

            if (config.useRedis && this.isRedisConnected && this.redis) {
                try {
                    await this.redis.del(fullKey);
                    this.redisFailures = 0;
                } catch (redisError) {
                    this._handleRedisError(redisError as Error);
                }
            }

            const memNs = this.memoryCache.get(namespace);
            if (memNs) memNs.delete(key);
        } catch (error) {
            this.metrics.errors++;
            logger.error('CacheService', `Delete error: ${(error as Error).message}`);
        }
    }

    /**
     * Check if key exists
     * @param namespace - Cache namespace
     * @param key - Cache key
     * @returns True if key exists
     */
    async has(namespace: string, key: string): Promise<boolean> {
        return (await this.get(namespace, key)) !== null;
    }

    /**
     * Get or set (cache-aside pattern)
     * @param namespace - Cache namespace
     * @param key - Cache key
     * @param factory - Async function to get value if not cached
     * @param ttl - TTL in seconds
     * @returns Cached or newly fetched value
     */
    async getOrSet<T = unknown>(
        namespace: string, 
        key: string, 
        factory: CacheFactory<T>, 
        ttl?: number
    ): Promise<T> {
        const cached = await this.get<T>(namespace, key);
        if (cached !== null) {
            return cached;
        }

        const value = await factory();
        await this.set(namespace, key, value, ttl);
        return value;
    }

    /**
     * Increment a counter (useful for rate limiting)
     * @param namespace - Cache namespace
     * @param key - Cache key
     * @param ttl - TTL in seconds
     * @returns New count
     */
    async increment(namespace: string, key: string, ttl?: number): Promise<number> {
        const fullKey = this._buildKey(namespace, key);
        const config = this._getNamespaceConfig(namespace);
        const actualTtl = ttl || config.ttl;

        try {
            if (config.useRedis && this.isRedisConnected && this.redis) {
                const multi = this.redis.multi();
                multi.incr(fullKey);
                multi.expire(fullKey, actualTtl);
                const results = await multi.exec();
                if (results && results[0]) {
                    return results[0][1] as number;
                }
            }

            // Fallback to memory
            if (!this.memoryCache.has(namespace)) {
                this.memoryCache.set(namespace, new Map());
            }
            const memNs = this.memoryCache.get(namespace)!;
            const entry = memNs.get(key);
            
            const currentValue = typeof entry?.value === 'number' ? entry.value : 0;
            const newCount = currentValue + 1;
            memNs.set(key, {
                value: newCount,
                expiresAt: Date.now() + (actualTtl * 1000)
            });
            return newCount;
        } catch (error) {
            this.metrics.errors++;
            logger.error('CacheService', `Increment error: ${(error as Error).message}`);
            return 1;
        }
    }

    /**
     * Clear all keys in a namespace
     * @param namespace - Namespace to clear
     */
    async clearNamespace(namespace: string): Promise<void> {
        try {
            const config = this._getNamespaceConfig(namespace);
            
            if (config.useRedis && this.isRedisConnected && this.redis) {
                const keys = await this.redis.keys(`${namespace}:*`);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            }

            this.memoryCache.delete(namespace);
            logger.debug('CacheService', `Cleared namespace: ${namespace}`);
        } catch (error) {
            this.metrics.errors++;
            logger.error('CacheService', `Clear namespace error: ${(error as Error).message}`);
        }
    }

    /**
     * Get cache statistics
     * @returns Cache statistics with service state
     */
    getStats(): CacheServiceStats {
        const memorySize = [...this.memoryCache.values()]
            .reduce((sum, ns) => sum + ns.size, 0);
        
        const gd = getGracefulDegradation();
        const redisState = gd.getServiceState('redis') || 'unknown';
        
        const totalRequests = this.metrics.hits + this.metrics.misses;
        
        return {
            ...this.metrics,
            hitRate: totalRequests > 0 ? this.metrics.hits / totalRequests : 0,
            redisConnected: this.isRedisConnected,
            redisState,
            redisFailures: this.redisFailures,
            memoryEntries: memorySize,
            namespaces: [...this.namespaces.keys()],
        };
    }

    /**
     * Evict least recently used entry from namespace
     */
    private _evictLRU(namespace: string): void {
        const memNs = this.memoryCache.get(namespace);
        if (!memNs || memNs.size === 0) return;

        // Simple: just delete the first (oldest) entry
        const firstKey = memNs.keys().next().value;
        if (firstKey) {
            memNs.delete(firstKey);
        }
    }

    /**
     * Cleanup expired entries from memory cache
     */
    private _cleanupMemory(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [, entries] of this.memoryCache) {
            for (const [key, entry] of entries) {
                if (now > entry.expiresAt) {
                    entries.delete(key);
                    cleaned++;
                }
            }
        }

        if (cleaned > 0) {
            logger.debug('CacheService', `Cleaned ${cleaned} expired entries`);
        }
    }

    /**
     * Shutdown cache service
     */
    async shutdown(): Promise<void> {
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
        }
        this.memoryCache.clear();
        logger.info('CacheService', 'Shutdown complete');
    }
}
// SINGLETON EXPORT
/**
 * Singleton cache service instance
 */
const cacheService = new CacheService();

// Default export
export default cacheService;
// CommonJS COMPATIBILITY
module.exports = cacheService;
module.exports.CacheService = CacheService;
module.exports.DEFAULT_NAMESPACES = DEFAULT_NAMESPACES;
module.exports.default = cacheService;
