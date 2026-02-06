"use strict";
/**
 * API Utilities
 * Common utilities for API calls: retries, timeouts, circuit breaker patterns
 * @module utils/common/apiUtils
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = exports.DEFAULT_CONFIG = void 0;
exports.sleep = sleep;
exports.isRetryableError = isRetryableError;
exports.withRetry = withRetry;
exports.withTimeout = withTimeout;
exports.withTimeoutAndRetry = withTimeoutAndRetry;
const Logger_js_1 = __importDefault(require("../../core/Logger.js"));
// CONFIGURATION
/**
 * Default configuration for API utilities
 */
exports.DEFAULT_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000, // Base delay in ms (doubles each retry)
    timeout: 10000, // Default timeout in ms
    retryableStatusCodes: [429, 500, 502, 503, 504],
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']
};
// UTILITY FUNCTIONS
/**
 * Sleep for a specified duration
 * @param ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Check if an error is retryable
 * @param error - The error to check
 * @param retryableStatusCodes - HTTP status codes to retry
 */
function isRetryableError(error, retryableStatusCodes = exports.DEFAULT_CONFIG.retryableStatusCodes) {
    // Network errors
    if (error.code && exports.DEFAULT_CONFIG.retryableErrors.includes(error.code)) {
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
async function withRetry(fn, options = {}) {
    const { name = 'API call', maxRetries = exports.DEFAULT_CONFIG.maxRetries, retryDelay = exports.DEFAULT_CONFIG.retryDelay, retryableStatusCodes = exports.DEFAULT_CONFIG.retryableStatusCodes, onRetry = null } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            // Check if we should retry
            if (attempt <= maxRetries && isRetryableError(error, retryableStatusCodes)) {
                const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                Logger_js_1.default.debug('API', `${name} failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${delay}ms: ${lastError.message}`);
                if (onRetry) {
                    onRetry(attempt, lastError);
                }
                await sleep(delay);
            }
            else {
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
async function withTimeout(fn, timeoutMs = exports.DEFAULT_CONFIG.timeout, name = 'Operation') {
    const timeoutPromise = new Promise((_, reject) => {
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
async function withTimeoutAndRetry(fn, options = {}) {
    const { name = 'API call', timeout = exports.DEFAULT_CONFIG.timeout, ...retryOptions } = options;
    return withRetry(() => withTimeout(fn, timeout, name), { name, ...retryOptions });
}
// RATE LIMITER
/**
 * Simple rate limiter
 */
class RateLimiter {
    maxRequests;
    windowMs;
    requests = [];
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    /**
     * Check if a request can be made
     */
    canMakeRequest() {
        this._cleanup();
        return this.requests.length < this.maxRequests;
    }
    /**
     * Record a request
     */
    recordRequest() {
        this._cleanup();
        this.requests.push(Date.now());
    }
    /**
     * Wait until a request can be made
     */
    async waitForSlot() {
        while (!this.canMakeRequest()) {
            const oldestRequest = this.requests[0];
            if (oldestRequest === undefined)
                break;
            const waitTime = oldestRequest + this.windowMs - Date.now() + 10;
            await sleep(Math.max(0, waitTime));
        }
    }
    _cleanup() {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        this.requests = this.requests.filter(time => time > cutoff);
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=apiUtils.js.map