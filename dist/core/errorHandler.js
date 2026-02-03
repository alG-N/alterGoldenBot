"use strict";
/**
 * Error Handler
 * Centralized error handling for the application
 * @module core/errorHandler
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShutdownHandler = registerShutdownHandler;
exports.initializeErrorHandlers = initializeErrorHandlers;
exports.handleShutdown = handleShutdown;
exports.safeAsync = safeAsync;
exports.withErrorHandling = withErrorHandling;
exports.withTimeout = withTimeout;
exports.interactionErrorBoundary = interactionErrorBoundary;
const Logger_1 = __importDefault(require("./Logger"));
const errors_1 = require("../errors");
// STATE
const shutdownHandlers = [];
// FUNCTIONS
/**
 * Register a shutdown handler
 * @param handler - Async function to call on shutdown
 */
function registerShutdownHandler(handler) {
    shutdownHandlers.push(handler);
}
/**
 * Initialize global error handlers
 * @param client - Discord client
 */
function initializeErrorHandlers(client) {
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
        // Check if operational error
        if (errors_1.AppError.isOperationalError(error)) {
            Logger_1.default.error('ErrorHandler', `Operational Error: ${error.message}`);
        }
        else {
            Logger_1.default.critical('ErrorHandler', `Uncaught Exception: ${error.message}`);
            console.error('Stack:', error.stack);
            // Log to Discord if possible
            Logger_1.default.logError('Uncaught Exception', error).catch(() => { });
            // For programmer errors, exit after logging
            // (in production, process manager should restart)
            setTimeout(() => process.exit(1), 1000);
        }
    });
    // Unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        if (errors_1.AppError.isOperationalError(error)) {
            Logger_1.default.error('ErrorHandler', `Unhandled Rejection (Operational): ${error.message}`);
        }
        else {
            Logger_1.default.critical('ErrorHandler', `Unhandled Rejection: ${error.message}`);
            console.error('Stack:', error.stack);
            Logger_1.default.logError('Unhandled Rejection', error).catch(() => { });
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
    Logger_1.default.info('ErrorHandler', 'Global error handlers initialized');
}
/**
 * Handle graceful shutdown
 * @param signal - Signal received
 * @param client - Discord client
 */
async function handleShutdown(signal, client = null) {
    Logger_1.default.info('Shutdown', `Received ${signal}, shutting down gracefully...`);
    try {
        // Run all registered shutdown handlers
        const timeout = 10000; // 10 second timeout
        await Promise.race([
            runShutdownHandlers(client),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Shutdown timeout')), timeout))
        ]);
        Logger_1.default.info('Shutdown', 'Graceful shutdown complete');
        process.exit(0);
    }
    catch (error) {
        Logger_1.default.error('Shutdown', `Error during shutdown: ${error.message}`);
        process.exit(1);
    }
}
/**
 * Run all shutdown handlers
 */
async function runShutdownHandlers(client) {
    // Destroy Discord client
    if (client) {
        try {
            client.destroy();
            Logger_1.default.info('Shutdown', 'Discord client destroyed');
        }
        catch {
            // Ignore errors
        }
    }
    // Run registered handlers
    for (const handler of shutdownHandlers) {
        try {
            await handler();
        }
        catch (error) {
            Logger_1.default.error('Shutdown', `Handler failed: ${error.message}`);
        }
    }
}
/**
 * Safe async execution wrapper
 * @param fn - Async function to execute
 * @param context - Context for error logging
 * @returns Wrapped function
 */
function safeAsync(fn, context = 'Unknown') {
    return async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            Logger_1.default.error(context, `Error: ${error.message}`);
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
function withErrorHandling(fn, options = {}) {
    const { context = 'Unknown', retries = 0, retryDelay = 1000, onError = null, rethrow = true } = options;
    return async (...args) => {
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await fn(...args);
            }
            catch (error) {
                lastError = error;
                Logger_1.default.error(context, `Attempt ${attempt + 1} failed: ${lastError.message}`);
                if (attempt < retries) {
                    await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
                }
            }
        }
        if (onError && lastError) {
            try {
                return await onError(lastError, ...args);
            }
            catch {
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
async function withTimeout(fn, timeout, context = 'Operation') {
    return Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${context} timed out after ${timeout}ms`)), timeout))
    ]);
}
/**
 * Create error boundary for Discord interactions
 * @param fn - Handler function
 * @param options - Options
 */
function interactionErrorBoundary(fn, options = {}) {
    const { ephemeral = true } = options;
    return async (interaction, ...args) => {
        try {
            await fn(interaction, ...args);
        }
        catch (error) {
            Logger_1.default.error('Interaction', `${interaction.commandName}: ${error.message}`);
            const errorMessage = errors_1.AppError.isOperationalError(error)
                ? error.message
                : 'An unexpected error occurred. Please try again.';
            try {
                const reply = {
                    content: `❌ ${errorMessage}`,
                    ephemeral
                };
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(reply);
                }
                else {
                    await interaction.reply(reply);
                }
            }
            catch {
                // Ignore reply errors
            }
        }
    };
}
//# sourceMappingURL=errorHandler.js.map