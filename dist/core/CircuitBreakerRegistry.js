"use strict";
/**
 * Circuit Breaker Registry
 * Central management for all circuit breakers
 * @module core/CircuitBreakerRegistry
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreakerRegistry = exports.CircuitBreakerRegistry = exports.CIRCUIT_CONFIGS = void 0;
const CircuitBreaker_js_1 = require("./CircuitBreaker.js");
const Logger_js_1 = __importDefault(require("./Logger.js"));
// PRE-CONFIGURED CIRCUIT CONFIGS
/**
 * Pre-configured circuit breaker configs for different services
 */
exports.CIRCUIT_CONFIGS = {
    // Lavalink - music streaming, can be slow
    lavalink: {
        name: 'lavalink',
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 30000, // 30s - search can be slow
        resetTimeout: 60000, // 60s - give time to recover
        fallback: (_error) => ({
            success: false,
            error: 'Music service temporarily unavailable',
            code: 'LAVALINK_UNAVAILABLE'
        })
    },
    // External APIs (Reddit, Steam, etc.)
    externalApi: {
        name: 'externalApi',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 10000, // 10s
        resetTimeout: 30000, // 30s
        fallback: (_error) => ({
            success: false,
            error: 'External service temporarily unavailable',
            code: 'API_UNAVAILABLE'
        })
    },
    // Database operations
    database: {
        name: 'database',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 5000, // 5s
        resetTimeout: 30000, // 30s
        fallback: (_error) => ({
            success: false,
            error: 'Database temporarily unavailable',
            code: 'DB_UNAVAILABLE'
        })
    },
    // Redis cache
    redis: {
        name: 'redis',
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 3000, // 3s
        resetTimeout: 15000, // 15s
        fallback: (_error) => null // Cache miss is acceptable
    },
    // Discord API (rate limited)
    discord: {
        name: 'discord',
        failureThreshold: 10, // Higher threshold for rate limits
        successThreshold: 3,
        timeout: 15000, // 15s
        resetTimeout: 30000, // 30s
        isFailure: (err) => {
            // Don't trip on rate limits, only on actual failures
            return err.code !== 429 && err.httpStatus !== 429;
        }
    },
    // Anime/Manga APIs (AniList, MAL)
    anime: {
        name: 'anime',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 10000,
        resetTimeout: 30000,
        fallback: (_error) => ({
            success: false,
            error: 'Anime service temporarily unavailable',
            code: 'ANIME_API_UNAVAILABLE'
        })
    },
    // NSFW APIs (nhentai, rule34, etc.)
    nsfw: {
        name: 'nsfw',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 15000,
        resetTimeout: 60000,
        fallback: (_error) => ({
            success: false,
            error: 'Service temporarily unavailable',
            code: 'NSFW_API_UNAVAILABLE'
        })
    },
    // Google/Search API
    google: {
        name: 'google',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 10000,
        resetTimeout: 30000,
        fallback: (_error) => ({
            success: false,
            error: 'Search service temporarily unavailable',
            code: 'SEARCH_API_UNAVAILABLE'
        })
    },
    // Wikipedia API
    wikipedia: {
        name: 'wikipedia',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 8000,
        resetTimeout: 30000,
        fallback: (_error) => ({
            success: false,
            error: 'Wikipedia service temporarily unavailable',
            code: 'WIKIPEDIA_API_UNAVAILABLE'
        })
    },
    // Pixiv API
    pixiv: {
        name: 'pixiv',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 15000,
        resetTimeout: 60000,
        fallback: (_error) => ({
            success: false,
            error: 'Pixiv service temporarily unavailable',
            code: 'PIXIV_API_UNAVAILABLE'
        })
    },
    // Fandom/Wikia API
    fandom: {
        name: 'fandom',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 10000,
        resetTimeout: 30000,
        fallback: (_error) => ({
            success: false,
            error: 'Fandom service temporarily unavailable',
            code: 'FANDOM_API_UNAVAILABLE'
        })
    },
    // Steam API
    steam: {
        name: 'steam',
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 10000,
        resetTimeout: 30000,
        fallback: (_error) => ({
            success: false,
            error: 'Steam service temporarily unavailable',
            code: 'STEAM_API_UNAVAILABLE'
        })
    }
};
// CIRCUIT BREAKER REGISTRY CLASS
/**
 * Circuit Breaker Registry
 * Manages all circuit breakers in the application
 */
class CircuitBreakerRegistry {
    breakers;
    initialized;
    constructor() {
        this.breakers = new Map();
        this.initialized = false;
    }
    /**
     * Initialize all pre-configured circuit breakers
     */
    initialize() {
        if (this.initialized)
            return;
        for (const [key, config] of Object.entries(exports.CIRCUIT_CONFIGS)) {
            this.register(key, config);
        }
        this.initialized = true;
        Logger_js_1.default.info('CircuitBreakerRegistry', `Initialized ${this.breakers.size} circuit breakers`);
    }
    /**
     * Register a new circuit breaker
     */
    register(name, config = {}) {
        if (this.breakers.has(name)) {
            Logger_js_1.default.warn('CircuitBreakerRegistry', `Breaker '${name}' already exists, returning existing`);
            return this.breakers.get(name);
        }
        const breaker = new CircuitBreaker_js_1.CircuitBreaker({ name, ...config });
        // Log state changes
        breaker.on('stateChange', ({ name, from, to }) => {
            if (to === 'OPEN') {
                Logger_js_1.default.warn('CircuitBreakerRegistry', `⚠️ Circuit '${name}' OPENED - service degraded`);
            }
            else if (to === 'CLOSED' && from === 'HALF_OPEN') {
                Logger_js_1.default.info('CircuitBreakerRegistry', `✅ Circuit '${name}' recovered`);
            }
        });
        this.breakers.set(name, breaker);
        return breaker;
    }
    /**
     * Get a circuit breaker by name
     */
    get(name) {
        return this.breakers.get(name);
    }
    /**
     * Execute a function with a specific circuit breaker
     */
    async execute(name, fn) {
        const breaker = this.breakers.get(name);
        if (!breaker) {
            Logger_js_1.default.warn('CircuitBreakerRegistry', `Breaker '${name}' not found, executing without protection`);
            return fn();
        }
        return breaker.execute(fn);
    }
    /**
     * Get all breakers' health status
     */
    getHealth() {
        const health = {
            status: 'healthy',
            breakers: {}
        };
        let hasUnhealthy = false;
        let hasDegraded = false;
        for (const [name, breaker] of this.breakers) {
            const breakerHealth = breaker.getHealth();
            health.breakers[name] = breakerHealth;
            if (breakerHealth.status === 'unhealthy')
                hasUnhealthy = true;
            if (breakerHealth.status === 'degraded')
                hasDegraded = true;
        }
        if (hasUnhealthy)
            health.status = 'unhealthy';
        else if (hasDegraded)
            health.status = 'degraded';
        return health;
    }
    /**
     * Get all breakers' metrics
     */
    getMetrics() {
        const metrics = {};
        for (const [name, breaker] of this.breakers) {
            metrics[name] = breaker.getMetrics();
        }
        return metrics;
    }
    /**
     * Reset all circuit breakers
     */
    resetAll() {
        for (const breaker of this.breakers.values()) {
            breaker.reset();
        }
        Logger_js_1.default.info('CircuitBreakerRegistry', 'All circuits reset');
    }
    /**
     * Reset metrics for all breakers
     */
    resetAllMetrics() {
        for (const breaker of this.breakers.values()) {
            breaker.resetMetrics();
        }
    }
    /**
     * Get summary of current states
     */
    getSummary() {
        const summary = {
            total: this.breakers.size,
            closed: 0,
            open: 0,
            halfOpen: 0
        };
        for (const breaker of this.breakers.values()) {
            const state = breaker.getState();
            if (state === CircuitBreaker_js_1.CircuitState.CLOSED)
                summary.closed++;
            else if (state === CircuitBreaker_js_1.CircuitState.OPEN)
                summary.open++;
            else if (state === CircuitBreaker_js_1.CircuitState.HALF_OPEN)
                summary.halfOpen++;
        }
        return summary;
    }
    /**
     * Shutdown - cleanup
     */
    shutdown() {
        for (const breaker of this.breakers.values()) {
            breaker.removeAllListeners();
        }
        this.breakers.clear();
        this.initialized = false;
    }
}
exports.CircuitBreakerRegistry = CircuitBreakerRegistry;
// Export singleton and class
const circuitBreakerRegistry = new CircuitBreakerRegistry();
exports.circuitBreakerRegistry = circuitBreakerRegistry;
exports.default = circuitBreakerRegistry;
//# sourceMappingURL=CircuitBreakerRegistry.js.map