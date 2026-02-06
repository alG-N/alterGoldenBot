/**
 * API Utilities
 * Common utilities for API calls: retries, timeouts, circuit breaker patterns
 * @module utils/common/apiUtils
 */

import logger from '../../core/Logger.js';
// TYPES
interface RetryOptions {
    name?: string;
    maxRetries?: number;
    retryDelay?: number;
    retryableStatusCodes?: number[];
    onRetry?: (attempt: number, error: Error) => void;
}

interface TimeoutRetryOptions extends RetryOptions {
    timeout?: number;
}

interface ErrorWithResponse extends Error {
    code?: string;
    response?: { status?: number };
    status?: number;
}
// CONFIGURATION
/**
 * Default configuration for API utilities
 */
export const DEFAULT_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,           // Base delay in ms (doubles each retry)
    timeout: 10000,              // Default timeout in ms
    retryableStatusCodes: [429, 500, 502, 503, 504],
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']
};
// UTILITY FUNCTIONS
/**
 * Sleep for a specified duration
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 * @param error - The error to check
 * @param retryableStatusCodes - HTTP status codes to retry
 */
export function isRetryableError(
    error: ErrorWithResponse, 
    retryableStatusCodes: number[] = DEFAULT_CONFIG.retryableStatusCodes
): boolean {
    // Network errors
    if (error.code && DEFAULT_CONFIG.retryableErrors.includes(error.code)) {
        return true;
    }
    
    // Axios/fetch HTTP status codes
    const status = error.response?.status || error.status;
    if (status && retryableStatusCodes.includes(status)) {
        return true;
    }
    
    // Rate limit errors
    if (error.message?.toLowerCase().includes('rate limit')) {
        return true;
    }
    
    return false;
}

/**
 * Execute a function with automatic retries
 * @param fn - Async function to execute
 * @param options - Retry options
 * @returns Result of the function
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const {
        name = 'API call',
        maxRetries = DEFAULT_CONFIG.maxRetries,
        retryDelay = DEFAULT_CONFIG.retryDelay,
        retryableStatusCodes = DEFAULT_CONFIG.retryableStatusCodes,
        onRetry = null
    } = options;
    
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            // Check if we should retry
            if (attempt <= maxRetries && isRetryableError(error as ErrorWithResponse, retryableStatusCodes)) {
                const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                
                logger.debug('API', `${name} failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${delay}ms: ${lastError.message}`);
                
                if (onRetry) {
                    onRetry(attempt, lastError);
                }
                
                await sleep(delay);
            } else {
                // Not retryable or max retries reached
                break;
            }
        }
    }
    
    throw lastError;
}

/**
 * Execute a function with a timeout
 * @param fn - Async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param name - Name for error messages
 * @returns Result of the function
 */
export async function withTimeout<T>(
    fn: () => Promise<T>, 
    timeoutMs: number = DEFAULT_CONFIG.timeout, 
    name: string = 'Operation'
): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    
    return Promise.race([fn(), timeoutPromise]);
}

/**
 * Execute a function with both timeout and retries
 * @param fn - Async function to execute
 * @param options - Options
 * @returns Result of the function
 */
export async function withTimeoutAndRetry<T>(fn: () => Promise<T>, options: TimeoutRetryOptions = {}): Promise<T> {
    const {
        name = 'API call',
        timeout = DEFAULT_CONFIG.timeout,
        ...retryOptions
    } = options;
    
    return withRetry(
        () => withTimeout(fn, timeout, name),
        { name, ...retryOptions }
    );
}
// RATE LIMITER
/**
 * Simple rate limiter
 */
export class RateLimiter {
    private maxRequests: number;
    private windowMs: number;
    private requests: number[] = [];

    constructor(maxRequests: number, windowMs: number) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    
    /**
     * Check if a request can be made
     */
    canMakeRequest(): boolean {
        this._cleanup();
        return this.requests.length < this.maxRequests;
    }
    
    /**
     * Record a request
     */
    recordRequest(): void {
        this._cleanup();
        this.requests.push(Date.now());
    }
    
    /**
     * Wait until a request can be made
     */
    async waitForSlot(): Promise<void> {
        while (!this.canMakeRequest()) {
            const oldestRequest = this.requests[0];
            if (oldestRequest === undefined) break;
            const waitTime = oldestRequest + this.windowMs - Date.now() + 10;
            await sleep(Math.max(0, waitTime));
        }
    }
    
    private _cleanup(): void {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        this.requests = this.requests.filter(time => time > cutoff);
    }
}
