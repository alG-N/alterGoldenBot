/**
 * Common Utilities Index
 * Re-exports all common utilities
 * @module utils/common
 */
// TIME UTILITIES
export {
    formatDuration,
    formatMusicDuration,
    formatTimeAgo,
    formatCountdown,
    parseDuration,
    parseTimeString,
    discordTimestamp,
    sleep,
    unixTimestamp,
    isToday,
    startOfDay,
    endOfDay
} from './time.js';

import * as time from './time.js';
export { time };
// EMBED UTILITIES
export {
    EMBED_COLORS,
    createErrorEmbed,
    createSuccessEmbed,
    createWarningEmbed,
    createInfoEmbed,
    createLoadingEmbed,
    truncateText,
    formatNumber,
    stripHtml,
    formatFieldValue,
    createProgressBar
} from './embed.js';

import * as embed from './embed.js';
export { embed };
// PAGINATION UTILITIES
export {
    createPaginationButtons,
    createSimplePagination,
    disablePaginationButtons,
    parsePaginationButton,
    getNewPage,
    PaginationState,
    globalPaginationState
} from './pagination.js';

import * as pagination from './pagination.js';
export { pagination };
// HTTP CLIENT UTILITIES
export {
    HttpClient,
    USER_AGENTS,
    clients,
    getClient
} from './httpClient.js';

import * as httpClient from './httpClient.js';
export { httpClient };
// COOLDOWN UTILITIES
export {
    CooldownManager,
    globalCooldownManager,
    checkCooldown,
    clearCooldown
} from './cooldown.js';

import * as cooldown from './cooldown.js';
export { cooldown };
// API UTILITIES
export {
    DEFAULT_CONFIG,
    sleep as apiSleep,
    isRetryableError,
    withRetry,
    withTimeout,
    withTimeoutAndRetry,
    RateLimiter
} from './apiUtils.js';

import * as apiUtils from './apiUtils.js';
export { apiUtils };

// Note: Circuit breaker functionality moved to core/CircuitBreaker.ts and core/CircuitBreakerRegistry.ts
// SAFE ASYNC UTILITIES
/**
 * Execute an async operation without awaiting, with error logging
 * Use for fire-and-forget operations that shouldn't block but should log errors
 * @param operation - Async operation to execute
 * @param context - Optional context string for error logging
 */
export function safeFireAndForget(
    operation: () => Promise<unknown>,
    context: string = 'background operation'
): void {
    operation().catch((error: Error) => {
        console.error(`[SafeFireAndForget] Error in ${context}:`, error.message);
    });
}

/**
 * Execute an async operation without awaiting, silently ignoring errors
 * Use only for truly optional operations where failure is acceptable
 * @param operation - Async operation to execute
 */
export function silentFireAndForget(operation: () => Promise<unknown>): void {
    operation().catch(() => {
        // Intentionally silent
    });
}
// MODULE UTILITIES
/**
 * Helper to get default export from require()
 * Handles ESM compiled modules that wrap default export
 */
export const getDefault = <T>(mod: { default?: T } | T): T => (mod as { default?: T }).default || mod as T;
