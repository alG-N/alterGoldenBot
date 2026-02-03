/**
 * Service Provider - Registers all services with the container
 * This is the central place for dependency configuration
 * @module bootstrap/services
 */

import container from '../container.js';
import { logger } from '../core/Logger.js';
// Types
export interface DefaultInstances {
    database: unknown;
    cache: unknown;
    lavalink: unknown;
    commandRegistry: unknown;
}
// Service Registration
/**
 * Register all application services
 * Call this once during application startup
 */
export function registerServices(): void {
    logger.info('Services', 'Registering services...');
    // CORE SERVICES
    // Database
    container.register('database', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { PostgresDatabase } = require('../database/postgres');
        return new PostgresDatabase();
    }, { tags: ['core', 'database'] });

    // Redis Cache (low-level)
    container.register('redisCache', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { RedisCache } = require('../services/guild/RedisCache');
        return new RedisCache();
    }, { tags: ['core', 'cache'] });

    // Unified Cache Service (recommended)
    container.register('cacheService', (c) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CacheService } = require('../cache/CacheService');
        const cacheService = new CacheService();
        
        // Connect to Redis if available
        const redis = c.resolve<{ isConnected?: boolean; client?: unknown }>('redisCache');
        if (redis.isConnected && redis.client) {
            cacheService.setRedis(redis.client);
        }
        
        return cacheService;
    }, { tags: ['core', 'cache'] });

    // Legacy alias for backward compatibility
    container.register('cache', (c) => c.resolve('redisCache'), { tags: ['core'] });
    // MUSIC SERVICES (when enabled)
    container.register('lavalink', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { LavalinkService } = require('../services/music/LavalinkService');
        return new LavalinkService();
    }, { tags: ['music'] });
    // REGISTRY SERVICES
    container.register('commandRegistry', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CommandRegistry } = require('../services/registry/CommandRegistry');
        return new CommandRegistry();
    }, { tags: ['core', 'registry'] });

    logger.info('Services', 'All services registered');
}

/**
 * Get default instances (backward compatibility)
 * These are the existing singleton instances that code already imports
 * @returns Map of service name to default instance
 */
export function getDefaultInstances(): DefaultInstances {
    return {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        database: require('../database/postgres'),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        cache: require('../services/guild/RedisCache'),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        lavalink: require('../services/music/LavalinkService'),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        commandRegistry: require('../services/registry/CommandRegistry'),
    };
}

/**
 * Register default instances with container
 * Use this to make existing singletons available through container
 */
export function registerDefaultInstances(): void {
    const defaults = getDefaultInstances();
    
    for (const [name, instance] of Object.entries(defaults)) {
        container.instance(name, instance);
    }
    
    logger.info('Services', 'Default instances registered');
}

export default {
    registerServices,
    getDefaultInstances,
    registerDefaultInstances
};
