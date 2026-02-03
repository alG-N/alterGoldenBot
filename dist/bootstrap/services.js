"use strict";
/**
 * Service Provider - Registers all services with the container
 * This is the central place for dependency configuration
 * @module bootstrap/services
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerServices = registerServices;
exports.getDefaultInstances = getDefaultInstances;
exports.registerDefaultInstances = registerDefaultInstances;
const container_js_1 = __importDefault(require("../container.js"));
const Logger_js_1 = require("../core/Logger.js");
// Service Registration
/**
 * Register all application services
 * Call this once during application startup
 */
function registerServices() {
    Logger_js_1.logger.info('Services', 'Registering services...');
    // CORE SERVICES
    // Database
    container_js_1.default.register('database', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { PostgresDatabase } = require('../database/postgres');
        return new PostgresDatabase();
    }, { tags: ['core', 'database'] });
    // Redis Cache (low-level)
    container_js_1.default.register('redisCache', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { RedisCache } = require('../services/guild/RedisCache');
        return new RedisCache();
    }, { tags: ['core', 'cache'] });
    // Unified Cache Service (recommended)
    container_js_1.default.register('cacheService', (c) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CacheService } = require('../cache/CacheService');
        const cacheService = new CacheService();
        // Connect to Redis if available
        const redis = c.resolve('redisCache');
        if (redis.isConnected && redis.client) {
            cacheService.setRedis(redis.client);
        }
        return cacheService;
    }, { tags: ['core', 'cache'] });
    // Legacy alias for backward compatibility
    container_js_1.default.register('cache', (c) => c.resolve('redisCache'), { tags: ['core'] });
    // MUSIC SERVICES (when enabled)
    container_js_1.default.register('lavalink', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { LavalinkService } = require('../services/music/LavalinkService');
        return new LavalinkService();
    }, { tags: ['music'] });
    // REGISTRY SERVICES
    container_js_1.default.register('commandRegistry', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CommandRegistry } = require('../services/registry/CommandRegistry');
        return new CommandRegistry();
    }, { tags: ['core', 'registry'] });
    Logger_js_1.logger.info('Services', 'All services registered');
}
/**
 * Get default instances (backward compatibility)
 * These are the existing singleton instances that code already imports
 * @returns Map of service name to default instance
 */
function getDefaultInstances() {
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
function registerDefaultInstances() {
    const defaults = getDefaultInstances();
    for (const [name, instance] of Object.entries(defaults)) {
        container_js_1.default.instance(name, instance);
    }
    Logger_js_1.logger.info('Services', 'Default instances registered');
}
exports.default = {
    registerServices,
    getDefaultInstances,
    registerDefaultInstances
};
//# sourceMappingURL=services.js.map