/**
 * Error Handler
 * Centralized error handling for the application
 * @module core/errorHandler
 */

import type { Client, ChatInputCommandInteraction } from 'discord.js';
import logger from './Logger';
import { AppError } from '../errors';
// TYPES
type AsyncFunction<T extends unknown[], R> = (...args: T) => Promise<R>;

interface ErrorHandlingOptions {
    context?: string;
    retries?: number;
    retryDelay?: number;
    onError?: (error: Error, ...args: unknown[]) => Promise<unknown> | unknown;
    rethrow?: boolean;
}

interface InteractionErrorBoundaryOptions {
    ephemeral?: boolean;
}
// STATE
const shutdownHandlers: Array<() => Promise<void>> = [];
// FUNCTIONS
/**
 * Register a shutdown handler
 * @param handler - Async function to call on shutdown
 */
export function registerShutdownHandler(handler: () => Promise<void>): void {
    shutdownHandlers.push(handler);
}

/**
 * Initialize global error handlers
 * @param client - Discord client
 */
export function initializeErrorHandlers(client: Client): void {
    // Uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
        // Check if operational error
        if (AppError.isOperationalError(error)) {
            logger.error('ErrorHandler', `Operational Error: ${error.message}`);
        } else {
            logger.critical('ErrorHandler', `Uncaught Exception: ${error.message}`);
            console.error('Stack:', error.stack);
            
            // Log to Discord if possible
            logger.logError('Uncaught Exception', error).catch(() => {});
            
            // For programmer errors, exit after logging
            // (in production, process manager should restart)
            setTimeout(() => process.exit(1), 1000);
        }
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        
        if (AppError.isOperationalError(error)) {
            logger.error('ErrorHandler', `Unhandled Rejection (Operational): ${error.message}`);
        } else {
            logger.critical('ErrorHandler', `Unhandled Rejection: ${error.message}`);
            console.error('Stack:', error.stack);
            logger.logError('Unhandled Rejection', error).catch(() => {});
        }
    });

    // Graceful shutdown signals
    process.on('SIGINT', () => handleShutdown('SIGINT', client));
    process.on('SIGTERM', () => handleShutdown('SIGTERM', client));

    // Windows specific
    if (process.platform === 'win32') {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.on('SIGINT', () => process.emit('SIGINT'));
    }

    logger.info('ErrorHandler', 'Global error handlers initialized');
}

/**
 * Handle graceful shutdown
 * @param signal - Signal received
 * @param client - Discord client
 */
export async function handleShutdown(signal: string, client: Client | null = null): Promise<void> {
    logger.info('Shutdown', `Received ${signal}, shutting down gracefully...`);
    
    try {
        // Run all registered shutdown handlers
        const timeout = 10000; // 10 second timeout
        
        await Promise.race([
            runShutdownHandlers(client),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Shutdown timeout')), timeout)
            )
        ]);
        
        logger.info('Shutdown', 'Graceful shutdown complete');
        process.exit(0);
    } catch (error) {
        logger.error('Shutdown', `Error during shutdown: ${(error as Error).message}`);
        process.exit(1);
    }
}

/**
 * Run all shutdown handlers
 */
async function runShutdownHandlers(client: Client | null): Promise<void> {
    // Destroy Discord client
    if (client) {
        try {
            client.destroy();
            logger.info('Shutdown', 'Discord client destroyed');
        } catch {
            // Ignore errors
        }
    }

    // Run registered handlers
    for (const handler of shutdownHandlers) {
        try {
            await handler();
        } catch (error) {
            logger.error('Shutdown', `Handler failed: ${(error as Error).message}`);
        }
    }
}

/**
 * Safe async execution wrapper
 * @param fn - Async function to execute
 * @param context - Context for error logging
 * @returns Wrapped function
 */
export function safeAsync<T extends unknown[], R>(
    fn: AsyncFunction<T, R>, 
    context: string = 'Unknown'
): AsyncFunction<T, R> {
    return async (...args: T): Promise<R> => {
        try {
            return await fn(...args);
        } catch (error) {
            logger.error(context, `Error: ${(error as Error).message}`);
            throw error;
        }
    };
}

/**
 * Wrap an async function with error handling and optional retry
 * @param fn - Async function
 * @param options - Options
 * @returns Wrapped function
 */
export function withErrorHandling<T extends unknown[], R>(
    fn: AsyncFunction<T, R>, 
    options: ErrorHandlingOptions = {}
): AsyncFunction<T, R | undefined> {
    const {
        context = 'Unknown',
        retries = 0,
        retryDelay = 1000,
        onError = null,
        rethrow = true
    } = options;

    return async (...args: T): Promise<R | undefined> => {
        let lastError: Error | undefined;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await fn(...args);
            } catch (error) {
                lastError = error as Error;
                logger.error(context, `Attempt ${attempt + 1} failed: ${lastError.message}`);
                
                if (attempt < retries) {
                    await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
                }
            }
        }

        if (onError && lastError) {
            try {
                return await onError(lastError, ...args) as R;
            } catch {
                // Fallback also failed
            }
        }

        if (rethrow && lastError) {
            throw lastError;
        }
        
        return undefined;
    };
}

/**
 * Execute with timeout
 * @param fn - Async function
 * @param timeout - Timeout in ms
 * @param context - Context for error
 */
export async function withTimeout<T>(
    fn: () => Promise<T>, 
    timeout: number, 
    context: string = 'Operation'
): Promise<T> {
    return Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`${context} timed out after ${timeout}ms`)), timeout)
        )
    ]);
}

/**
 * Create error boundary for Discord interactions
 * @param fn - Handler function
 * @param options - Options
 */
export function interactionErrorBoundary<T extends unknown[]>(
    fn: (interaction: ChatInputCommandInteraction, ...args: T) => Promise<void>,
    options: InteractionErrorBoundaryOptions = {}
): (interaction: ChatInputCommandInteraction, ...args: T) => Promise<void> {
    const { ephemeral = true } = options;
    
    return async (interaction: ChatInputCommandInteraction, ...args: T): Promise<void> => {
        try {
            await fn(interaction, ...args);
        } catch (error) {
            logger.error('Interaction', `${interaction.commandName}: ${(error as Error).message}`);
            
            const errorMessage = AppError.isOperationalError(error as Error)
                ? (error as Error).message
                : 'An unexpected error occurred. Please try again.';

            try {
                const reply = { 
                    content: `❌ ${errorMessage}`, 
                    ephemeral 
                };
                
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(reply);
                } else {
                    await interaction.reply(reply);
                }
            } catch {
                // Ignore reply errors
            }
        }
    };
}
