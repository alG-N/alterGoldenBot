"use strict";
/**
 * Application Bootstrap
 * Centralized initialization for all services and connections
 * @module core/bootstrap
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOTSTRAP_CONFIG = void 0;
exports.bootstrap = bootstrap;
exports.healthCheck = healthCheck;
const Logger_1 = __importDefault(require("./Logger"));
// CONFIGURATION
/**
 * Bootstrap configuration
 */
exports.BOOTSTRAP_CONFIG = {
    // Order matters - dependencies first
    initOrder: [
        'database',
        'redis',
        'services',
        'events',
        'commands'
    ],
    // Timeouts for each init phase
    timeouts: {
        database: 30000,
        redis: 10000,
        services: 15000,
        events: 5000,
        commands: 10000
    }
};
// BOOTSTRAP FUNCTIONS
/**
 * Initialize application with proper dependency order
 * @param client - Discord client
 * @param _options - Bootstrap options (reserved for future use)
 * @returns Initialization results
 */
async function bootstrap(client, _options = {}) {
    const results = {
        success: true,
        timings: {},
        errors: []
    };
    Logger_1.default.info('Bootstrap', 'Starting application initialization...');
    const startTime = Date.now();
    try {
        // 1. Initialize Database
        results.timings.database = await initWithTiming('Database', async () => {
            const db = require('../database');
            await db.initialize();
            return { connected: true };
        });
        // 2. Initialize Redis (optional - graceful degradation)
        results.timings.redis = await initWithTiming('Redis', async () => {
            try {
                const redisCache = require('../services/guild/RedisCache');
                const instance = redisCache.default || redisCache;
                await instance.initialize?.();
                return { connected: true };
            }
            catch (error) {
                Logger_1.default.warn('Bootstrap', `Redis unavailable: ${error.message}. Using fallback.`);
                return { connected: false, fallback: true };
            }
        });
        // 3. Initialize Logger with client
        Logger_1.default.initialize(client);
        // 4. Initialize Services
        results.timings.services = await initWithTiming('Services', async () => {
            const { SnipeService } = require('../services');
            await SnipeService.initialize(client);
            // Register music shutdown handler
            const { registerShutdownHandler } = require('./shutdown');
            const { musicFacade } = require('../services/music/MusicFacade');
            registerShutdownHandler('MusicFacade', () => musicFacade.shutdownAll(), 10);
            return { initialized: true };
        });
        // 5. Load Events
        results.timings.events = await initWithTiming('Events', async () => {
            const eventRegistry = require('../services/EventRegistry');
            const events = eventRegistry.loadEvents();
            eventRegistry.registerEvents(client, events);
            return { count: events.size };
        });
        // 6. Load Commands
        results.timings.commands = await initWithTiming('Commands', async () => {
            const commandRegistry = require('../services/CommandRegistry');
            const commands = commandRegistry.loadCommands();
            return { count: commands.size };
        });
        const totalTime = Date.now() - startTime;
        Logger_1.default.success('Bootstrap', `Application initialized in ${totalTime}ms`);
        // Log detailed timings in debug
        Object.entries(results.timings).forEach(([phase, data]) => {
            Logger_1.default.debug('Bootstrap', `  ${phase}: ${data.duration}ms`);
        });
        return results;
    }
    catch (error) {
        results.success = false;
        results.errors.push(error.message);
        Logger_1.default.critical('Bootstrap', `Initialization failed: ${error.message}`);
        throw error;
    }
}
/**
 * Initialize a phase with timing and error handling
 * @private
 */
async function initWithTiming(name, initFn) {
    const start = Date.now();
    try {
        const result = await initFn();
        const duration = Date.now() - start;
        Logger_1.default.info('Bootstrap', `✓ ${name} initialized (${duration}ms)`);
        return { ...result, duration, success: true };
    }
    catch (error) {
        const duration = Date.now() - start;
        Logger_1.default.error('Bootstrap', `✗ ${name} failed: ${error.message}`);
        return { duration, success: false, error: error.message };
    }
}
/**
 * Health check for all services
 * @returns Health status
 */
async function healthCheck() {
    const health = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        services: {}
    };
    // Database health
    try {
        const postgres = require('../database/postgres');
        await postgres.query('SELECT 1');
        health.services.database = { status: 'healthy' };
    }
    catch (error) {
        health.services.database = { status: 'unhealthy', error: error.message };
        health.status = 'degraded';
    }
    // Redis health
    try {
        const cacheService = require('../cache/CacheService');
        const instance = cacheService.default || cacheService;
        const stats = instance.getStats?.();
        if (stats?.redisConnected) {
            health.services.redis = { status: 'healthy' };
        }
        else {
            health.services.redis = { status: 'disconnected' };
        }
    }
    catch (error) {
        health.services.redis = { status: 'unhealthy', error: error.message };
    }
    return health;
}
//# sourceMappingURL=bootstrap.js.map