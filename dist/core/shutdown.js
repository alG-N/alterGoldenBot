"use strict";
/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of all services
 * @module core/shutdown
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShutdownHandler = registerShutdownHandler;
exports.handleShutdown = handleShutdown;
exports.initializeShutdownHandlers = initializeShutdownHandlers;
exports.getIsShuttingDown = getIsShuttingDown;
const Logger_js_1 = __importDefault(require("./Logger.js"));
const container_js_1 = __importDefault(require("../container.js"));
// STATE
const shutdownHandlers = [];
let isShuttingDown = false;
// FUNCTIONS
/**
 * Register a shutdown handler
 * @param name - Handler name for logging
 * @param handler - Async function to call on shutdown
 * @param priority - Lower = runs first (default: 100)
 */
function registerShutdownHandler(name, handler, priority = 100) {
    shutdownHandlers.push({ name, handler, priority });
    // Sort by priority
    shutdownHandlers.sort((a, b) => a.priority - b.priority);
    Logger_js_1.default.debug('Shutdown', `Registered shutdown handler: ${name} (priority: ${priority})`);
}
/**
 * Handle graceful shutdown
 * @param signal - Signal received (SIGINT, SIGTERM, etc.)
 * @param client - Discord client
 * @param options - Shutdown options
 */
async function handleShutdown(signal, client = null, options = {}) {
    // Prevent multiple shutdown attempts
    if (isShuttingDown) {
        Logger_js_1.default.warn('Shutdown', 'Shutdown already in progress...');
        return;
    }
    isShuttingDown = true;
    const { timeout = 15000 } = options;
    Logger_js_1.default.info('Shutdown', `Received ${signal}, initiating graceful shutdown...`);
    const shutdownStart = Date.now();
    try {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Shutdown timeout after ${timeout}ms`)), timeout);
        });
        // Run shutdown sequence
        const shutdownPromise = runShutdownSequence(client);
        await Promise.race([shutdownPromise, timeoutPromise]);
        const duration = Date.now() - shutdownStart;
        Logger_js_1.default.success('Shutdown', `Graceful shutdown complete in ${duration}ms`);
        process.exit(0);
    }
    catch (error) {
        Logger_js_1.default.error('Shutdown', `Shutdown error: ${error.message}`);
        process.exit(1);
    }
}
/**
 * Run all shutdown handlers in order
 *
 * Shutdown sequence:
 * 1. Destroy Discord client (stop receiving events)
 * 2. Run any manually registered shutdown handlers
 * 3. Shutdown DI container (calls shutdown/destroy/close on ALL registered services)
 * 4. Cleanup static resources (PaginationState)
 *
 * The DI container handles ALL service lifecycle now — database, Redis, cache,
 * API services, music services, handlers, repositories, and events with intervals.
 * No manual require() + shutdown calls needed.
 *
 * @private
 */
async function runShutdownSequence(client) {
    const results = [];
    // 1. Destroy Discord client first (stop receiving events)
    if (client) {
        try {
            Logger_js_1.default.info('Shutdown', 'Destroying Discord client...');
            client.destroy();
            results.push({ name: 'Discord Client', success: true });
        }
        catch (error) {
            results.push({ name: 'Discord Client', success: false, error: error.message });
        }
    }
    // 2. Run registered handlers (external code can still register custom handlers)
    for (const { name, handler } of shutdownHandlers) {
        try {
            Logger_js_1.default.debug('Shutdown', `Running handler: ${name}`);
            await handler();
            results.push({ name, success: true });
        }
        catch (error) {
            Logger_js_1.default.error('Shutdown', `Handler "${name}" failed: ${error.message}`);
            results.push({ name, success: false, error: error.message });
        }
    }
    // 3. Shutdown DI container — handles ALL service lifecycle:
    //    - Database (postgres.close())
    //    - Redis/Cache (redisCache.shutdown(), cacheService.shutdown())
    //    - API services (googleService.shutdown(), fandomService.destroy(), etc.)
    //    - Music services (lavalinkService.shutdown(), musicEventBus.shutdown(), etc.)
    //    - Handlers (nhentaiHandler.destroy())
    //    - Repositories (rule34Cache.destroy(), redditCache.destroy(), etc.)
    //    - Events (voiceStateUpdate.destroy(), readyEvent.destroy())
    //    - Guild services (shardBridge.shutdown(), antiRaidService.shutdown())
    try {
        Logger_js_1.default.info('Shutdown', 'Shutting down DI container...');
        await container_js_1.default.shutdown();
        results.push({ name: 'DI Container', success: true });
    }
    catch (error) {
        Logger_js_1.default.error('Shutdown', `Container shutdown failed: ${error.message}`);
        results.push({ name: 'DI Container', success: false, error: error.message });
    }
    // 4. Cleanup static resources (not managed by container)
    try {
        const { PaginationState } = require('../utils/common/pagination');
        PaginationState.destroyAll();
        Logger_js_1.default.info('Shutdown', 'Pagination state cleanup complete');
        results.push({ name: 'PaginationState', success: true });
    }
    catch (error) {
        results.push({ name: 'PaginationState', success: false, error: error.message });
    }
    return results;
}
/**
 * Initialize shutdown handlers for process signals
 * @param client - Discord client
 */
function initializeShutdownHandlers(client) {
    // Standard signals
    process.on('SIGINT', () => handleShutdown('SIGINT', client));
    process.on('SIGTERM', () => handleShutdown('SIGTERM', client));
    // Windows-specific handling
    if (process.platform === 'win32') {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.on('SIGINT', () => process.emit('SIGINT'));
        rl.on('close', () => handleShutdown('CLOSE', client));
    }
    Logger_js_1.default.info('Shutdown', 'Shutdown handlers initialized');
}
/**
 * Check if shutdown is in progress
 */
function getIsShuttingDown() {
    return isShuttingDown;
}
//# sourceMappingURL=shutdown.js.map