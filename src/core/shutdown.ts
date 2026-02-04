/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of all services
 * @module core/shutdown
 */

import logger from './Logger';
import container from '../container';
// TYPES
interface ShutdownHandler {
    name: string;
    handler: () => Promise<void>;
    priority: number;
}

interface ShutdownResult {
    name: string;
    success: boolean;
    error?: string;
}

interface ShutdownOptions {
    timeout?: number;
}
// STATE
const shutdownHandlers: ShutdownHandler[] = [];
let isShuttingDown = false;
// FUNCTIONS
/**
 * Register a shutdown handler
 * @param name - Handler name for logging
 * @param handler - Async function to call on shutdown
 * @param priority - Lower = runs first (default: 100)
 */
export function registerShutdownHandler(
    name: string, 
    handler: () => Promise<void>, 
    priority: number = 100
): void {
    shutdownHandlers.push({ name, handler, priority });
    // Sort by priority
    shutdownHandlers.sort((a, b) => a.priority - b.priority);
    logger.debug('Shutdown', `Registered shutdown handler: ${name} (priority: ${priority})`);
}

/**
 * Handle graceful shutdown
 * @param signal - Signal received (SIGINT, SIGTERM, etc.)
 * @param client - Discord client
 * @param options - Shutdown options
 */
export async function handleShutdown(
    signal: string, 
    client: { destroy: () => void } | null = null, 
    options: ShutdownOptions = {}
): Promise<void> {
    // Prevent multiple shutdown attempts
    if (isShuttingDown) {
        logger.warn('Shutdown', 'Shutdown already in progress...');
        return;
    }
    
    isShuttingDown = true;
    const { timeout = 15000 } = options;
    
    logger.info('Shutdown', `Received ${signal}, initiating graceful shutdown...`);
    
    const shutdownStart = Date.now();
    
    try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Shutdown timeout after ${timeout}ms`)), timeout);
        });
        
        // Run shutdown sequence
        const shutdownPromise = runShutdownSequence(client);
        
        await Promise.race([shutdownPromise, timeoutPromise]);
        
        const duration = Date.now() - shutdownStart;
        logger.success('Shutdown', `Graceful shutdown complete in ${duration}ms`);
        process.exit(0);
        
    } catch (error) {
        logger.error('Shutdown', `Shutdown error: ${(error as Error).message}`);
        process.exit(1);
    }
}

/**
 * Run all shutdown handlers in order
 * @private
 */
async function runShutdownSequence(client: { destroy: () => void } | null): Promise<ShutdownResult[]> {
    const results: ShutdownResult[] = [];
    
    // 1. Destroy Discord client first (stop receiving events)
    if (client) {
        try {
            logger.info('Shutdown', 'Destroying Discord client...');
            client.destroy();
            results.push({ name: 'Discord Client', success: true });
        } catch (error) {
            results.push({ name: 'Discord Client', success: false, error: (error as Error).message });
        }
    }
    
    // 2. Run registered handlers
    for (const { name, handler } of shutdownHandlers) {
        try {
            logger.debug('Shutdown', `Running handler: ${name}`);
            await handler();
            results.push({ name, success: true });
        } catch (error) {
            logger.error('Shutdown', `Handler "${name}" failed: ${(error as Error).message}`);
            results.push({ name, success: false, error: (error as Error).message });
        }
    }
    
    // 3. Shutdown DI container (this calls shutdown() on all registered services)
    try {
        logger.info('Shutdown', 'Shutting down DI container...');
        await container.shutdown();
        results.push({ name: 'DI Container', success: true });
    } catch (error) {
        logger.error('Shutdown', `Container shutdown failed: ${(error as Error).message}`);
        results.push({ name: 'DI Container', success: false, error: (error as Error).message });
    }
    
    // 4. Close database connections (try infrastructure first, then legacy)
    try {
        let infrastructure: { shutdown?: () => Promise<void> } | null = null;
        try {
            infrastructure = require('../infrastructure');
        } catch {
            infrastructure = null;
        }
        
        if (infrastructure?.shutdown) {
            await infrastructure.shutdown();
            logger.info('Shutdown', 'Infrastructure shutdown complete');
        } else {
            const postgres = require('../database/postgres');
            await postgres.close();
            logger.info('Shutdown', 'Database connections closed');
        }
        results.push({ name: 'Database', success: true });
    } catch (error) {
        results.push({ name: 'Database', success: false, error: (error as Error).message });
    }
    
    // 5. Close Redis connections
    try {
        const cacheService = require('../cache/CacheService');
        const instance = cacheService.default || cacheService;
        await instance.shutdown?.();
        logger.info('Shutdown', 'Cache service closed');
        results.push({ name: 'Redis', success: true });
    } catch (error) {
        results.push({ name: 'Redis', success: false, error: (error as Error).message });
    }

    // 6. Cleanup PaginationState instances
    try {
        const { PaginationState } = require('../utils/common/pagination');
        PaginationState.destroyAll();
        logger.info('Shutdown', 'Pagination state cleanup complete');
        results.push({ name: 'PaginationState', success: true });
    } catch (error) {
        results.push({ name: 'PaginationState', success: false, error: (error as Error).message });
    }
    
    return results;
}

/**
 * Initialize shutdown handlers for process signals
 * @param client - Discord client
 */
export function initializeShutdownHandlers(client: { destroy: () => void }): void {
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
    
    logger.info('Shutdown', 'Shutdown handlers initialized');
}

/**
 * Check if shutdown is in progress
 */
export function getIsShuttingDown(): boolean {
    return isShuttingDown;
}
