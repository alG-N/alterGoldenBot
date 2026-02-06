"use strict";
/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by failing fast when a service is unavailable
 * @module core/CircuitBreaker
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitState = void 0;
const events_1 = require("events");
const Logger_js_1 = __importDefault(require("./Logger.js"));
// TYPES & INTERFACES
/**
 * Circuit Breaker States
 */
exports.CircuitState = {
    CLOSED: 'CLOSED', // Normal operation, requests flow through
    OPEN: 'OPEN', // Circuit tripped, requests fail fast
    HALF_OPEN: 'HALF_OPEN' // Testing if service recovered
};
// CIRCUIT BREAKER CLASS
/**
 * Circuit Breaker class
 * Implements the circuit breaker pattern for fault tolerance
 */
class CircuitBreaker extends events_1.EventEmitter {
    name;
    failureThreshold;
    successThreshold;
    timeout;
    resetTimeout;
    fallback;
    isFailure;
    enabled;
    state;
    failureCount;
    successCount;
    lastFailureTime;
    nextAttempt;
    metrics;
    constructor(options = {}) {
        super();
        this.name = options.name || 'default';
        this.failureThreshold = options.failureThreshold || 5;
        this.successThreshold = options.successThreshold || 2;
        this.timeout = options.timeout || 30000;
        this.resetTimeout = options.resetTimeout || 60000;
        this.fallback = options.fallback || null;
        this.isFailure = options.isFailure || ((_err) => true);
        this.enabled = options.enabled !== false;
        // State
        this.state = exports.CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.nextAttempt = null;
        // Metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rejectedRequests: 0,
            timeouts: 0,
            fallbackExecutions: 0,
            stateChanges: []
        };
    }
    /**
     * Execute a function with circuit breaker protection
     */
    async execute(fn) {
        if (!this.enabled) {
            return fn();
        }
        this.metrics.totalRequests++;
        // Check if circuit is open
        if (this.state === exports.CircuitState.OPEN) {
            if (Date.now() >= (this.nextAttempt || 0)) {
                // Try half-open
                this._setState(exports.CircuitState.HALF_OPEN);
            }
            else {
                // Fail fast
                return this._handleRejection();
            }
        }
        try {
            // Execute with timeout
            const result = await this._executeWithTimeout(fn);
            this._onSuccess();
            return result;
        }
        catch (error) {
            return this._onFailure(error);
        }
    }
    /**
     * Execute function with timeout
     */
    async _executeWithTimeout(fn) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.metrics.timeouts++;
                reject(new Error(`Circuit breaker timeout: ${this.name}`));
            }, this.timeout);
            fn()
                .then((result) => {
                clearTimeout(timeoutId);
                resolve(result);
            })
                .catch((error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }
    /**
     * Handle successful execution
     */
    _onSuccess() {
        this.metrics.successfulRequests++;
        if (this.state === exports.CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this._setState(exports.CircuitState.CLOSED);
                this.failureCount = 0;
                this.successCount = 0;
            }
        }
        else {
            // Reset failure count on success in closed state
            this.failureCount = 0;
        }
    }
    /**
     * Handle failed execution
     */
    _onFailure(error) {
        this.metrics.failedRequests++;
        this.lastFailureTime = Date.now();
        this.failureCount++;
        if (this.state === exports.CircuitState.HALF_OPEN) {
            // Single failure in half-open trips circuit again
            this._setState(exports.CircuitState.OPEN);
            this.successCount = 0;
        }
        else if (this.failureCount >= this.failureThreshold) {
            this._setState(exports.CircuitState.OPEN);
        }
        // Check if error should trigger fallback
        if (this.isFailure(error)) {
            return this._executeFallback(error);
        }
        throw error;
    }
    /**
     * Handle rejection when circuit is open
     */
    _handleRejection() {
        this.metrics.rejectedRequests++;
        const error = new Error(`Circuit breaker is OPEN: ${this.name}`);
        error.code = 'CIRCUIT_OPEN';
        error.circuitBreaker = this.name;
        this.emit('reject', { name: this.name, state: this.state });
        return this._executeFallback(error);
    }
    /**
     * Execute fallback function
     */
    _executeFallback(error) {
        if (this.fallback) {
            this.metrics.fallbackExecutions++;
            return this.fallback(error);
        }
        throw error;
    }
    /**
     * Set circuit state
     */
    _setState(newState) {
        const oldState = this.state;
        this.state = newState;
        if (newState === exports.CircuitState.OPEN) {
            this.nextAttempt = Date.now() + this.resetTimeout;
        }
        // Track state change
        this.metrics.stateChanges.push({
            from: oldState,
            to: newState,
            timestamp: new Date().toISOString()
        });
        // Keep only last 20 state changes
        if (this.metrics.stateChanges.length > 20) {
            this.metrics.stateChanges.shift();
        }
        this.emit('stateChange', {
            name: this.name,
            from: oldState,
            to: newState
        });
        Logger_js_1.default.info('CircuitBreaker', `[${this.name}] State changed: ${oldState} → ${newState}`);
    }
    /**
     * Manually trip the circuit
     */
    trip() {
        if (this.state !== exports.CircuitState.OPEN) {
            this._setState(exports.CircuitState.OPEN);
        }
    }
    /**
     * Manually reset the circuit
     */
    reset() {
        this._setState(exports.CircuitState.CLOSED);
        this.failureCount = 0;
        this.successCount = 0;
    }
    /**
     * Check if circuit is open
     */
    isOpen() {
        return this.state === exports.CircuitState.OPEN;
    }
    /**
     * Check if circuit is closed
     */
    isClosed() {
        return this.state === exports.CircuitState.CLOSED;
    }
    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
    /**
     * Get metrics
     */
    getMetrics() {
        return {
            name: this.name,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
            nextAttempt: this.nextAttempt,
            ...this.metrics,
            successRate: this.metrics.totalRequests > 0
                ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
                : 'N/A'
        };
    }
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rejectedRequests: 0,
            timeouts: 0,
            fallbackExecutions: 0,
            stateChanges: []
        };
    }
    /**
     * Get health status for health checks
     */
    getHealth() {
        return {
            name: this.name,
            status: this.state === exports.CircuitState.CLOSED ? 'healthy' :
                this.state === exports.CircuitState.HALF_OPEN ? 'degraded' : 'unhealthy',
            state: this.state,
            failureCount: this.failureCount,
            lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
            nextAttempt: this.nextAttempt ? new Date(this.nextAttempt).toISOString() : null
        };
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=CircuitBreaker.js.map