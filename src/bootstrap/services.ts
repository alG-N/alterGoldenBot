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
    eventRegistry: unknown;
}
// Service Registration
/**
 * Register all application services
 * Call this once during application startup
 */
export function registerServices(): void {
    logger.info('Container', 'Registering services with DI container...');
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
    container.register('cacheService', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CacheService } = require('../cache/CacheService');
        return new CacheService();
    }, { tags: ['core', 'cache'] });

    // Legacy alias for backward compatibility
    container.register('cache', (c) => c.resolve('redisCache'), { tags: ['core'] });
    // REGISTRY SERVICES
    container.register('commandRegistry', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CommandRegistry } = require('../services/registry/CommandRegistry');
        return new CommandRegistry();
    }, { tags: ['core', 'registry'] });

    container.register('eventRegistry', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { EventRegistry } = require('../services/registry/EventRegistry');
        return new EventRegistry();
    }, { tags: ['core', 'registry'] });
    // MUSIC SERVICES (when enabled)
    container.register('lavalink', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { LavalinkService } = require('../services/music/LavalinkService');
        return new LavalinkService();
    }, { tags: ['music'] });

    // API SERVICES (for proper cleanup interval management)
    container.register('wikipediaService', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { WikipediaService } = require('../services/api/wikipediaService');
        return new WikipediaService();
    }, { tags: ['api'] });

    container.register('googleService', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GoogleService } = require('../services/api/googleService');
        return new GoogleService();
    }, { tags: ['api'] });

    container.register('fandomService', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { FandomService } = require('../services/api/fandomService');
        return new FandomService();
    }, { tags: ['api'] });

    logger.info('Container', 'All services registered');
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
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        eventRegistry: require('../services/registry/EventRegistry'),
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
    
    logger.info('Container', 'Default instances registered');
}

export default {
    registerServices,
    getDefaultInstances,
    registerDefaultInstances
};
