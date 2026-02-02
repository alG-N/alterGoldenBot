/**
 * API Utilities
 * Common utilities for API calls: retries, timeouts, circuit breaker patterns
 * @module utils/common/apiUtils
 */

const logger = require('../../core/Logger');

/**
 * Default configuration for API utilities
 */
const DEFAULT_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,           // Base delay in ms (doubles each retry)
    timeout: 10000,              // Default timeout in ms
    retryableStatusCodes: [429, 500, 502, 503, 504],
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']
};

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @param {number[]} retryableStatusCodes - HTTP status codes to retry
 * @returns {boolean}
 */
function isRetryableError(error, retryableStatusCodes = DEFAULT_CONFIG.retryableStatusCodes) {
    // Network errors
    if (DEFAULT_CONFIG.retryableErrors.includes(error.code)) {
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
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry options
 * @param {string} options.name - Name for logging purposes
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.retryDelay - Base delay between retries in ms (default: 1000)
 * @param {number[]} options.retryableStatusCodes - HTTP status codes to retry
 * @param {Function} options.onRetry - Callback when retry occurs (attempt, error) => void
 * @returns {Promise<any>} Result of the function
 */
async function withRetry(fn, options = {}) {
    const {
        name = 'API call',
        maxRetries = DEFAULT_CONFIG.maxRetries,
        retryDelay = DEFAULT_CONFIG.retryDelay,
        retryableStatusCodes = DEFAULT_CONFIG.retryableStatusCodes,
        onRetry = null
    } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Check if we should retry
            if (attempt <= maxRetries && isRetryableError(error, retryableStatusCodes)) {
                const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                
                logger.debug('API', `${name} failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${delay}ms: ${error.message}`);
                
                if (onRetry) {
                    onRetry(attempt, error);
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
 * @param {Function} fn - Async function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} name - Name for error messages
 * @returns {Promise<any>} Result of the function
 */
async function withTimeout(fn, timeoutMs = DEFAULT_CONFIG.timeout, name = 'Operation') {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    
    return Promise.race([fn(), timeoutPromise]);
}

/**
 * Execute a function with both timeout and retries
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Options
 * @param {string} options.name - Name for logging
 * @param {number} options.timeout - Timeout per attempt in ms
 * @param {number} options.maxRetries - Maximum retries
 * @param {number} options.retryDelay - Base delay between retries
 * @returns {Promise<any>} Result of the function
 */
async function withTimeoutAndRetry(fn, options = {}) {
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

/**
 * Simple rate limiter
 */
class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }
    
    /**
     * Check if a request can be made
     * @returns {boolean}
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
     * @returns {Promise<void>}
     */
    async waitForSlot() {
        while (!this.canMakeRequest()) {
            const oldestRequest = this.requests[0];
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

module.exports = {
    withRetry,
    withTimeout,
    withTimeoutAndRetry,
    isRetryableError,
    sleep,
    RateLimiter,
    DEFAULT_CONFIG
};
