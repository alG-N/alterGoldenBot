"use strict";
/**
 * Graceful Degradation Service
 * Provides fallback behaviors when services are unavailable
 * Ensures the bot continues functioning with reduced capability
 * @module core/GracefulDegradation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulDegradation = exports.GracefulDegradation = exports.ServiceState = exports.DegradationLevel = void 0;
const events_1 = require("events");
// TYPES & ENUMS
/**
 * Degradation levels for service health
 */
var DegradationLevel;
(function (DegradationLevel) {
    DegradationLevel["NORMAL"] = "NORMAL";
    DegradationLevel["DEGRADED"] = "DEGRADED";
    DegradationLevel["CRITICAL"] = "CRITICAL";
    DegradationLevel["OFFLINE"] = "OFFLINE"; // Cannot serve requests
})(DegradationLevel || (exports.DegradationLevel = DegradationLevel = {}));
/**
 * Service states
 */
var ServiceState;
(function (ServiceState) {
    ServiceState["HEALTHY"] = "HEALTHY";
    ServiceState["DEGRADED"] = "DEGRADED";
    ServiceState["UNAVAILABLE"] = "UNAVAILABLE";
})(ServiceState || (exports.ServiceState = ServiceState = {}));
// GRACEFUL DEGRADATION CLASS
/**
 * Graceful Degradation Manager
 * Coordinates fallback behaviors across services
 */
class GracefulDegradation extends events_1.EventEmitter {
    /** Service health states */
    services = new Map();
    /** Current system degradation level */
    level = DegradationLevel.NORMAL;
    /** Fallback handlers per service */
    fallbackHandlers = new Map();
    /** Cached data for fallbacks */
    fallbackCache = new Map();
    /** Queued operations for when service recovers */
    writeQueue = [];
    /** Max queue size before dropping */
    maxQueueSize = 1000;
    /** Initialization state */
    initialized = false;
    constructor() {
        super();
    }
    /**
     * Initialize the degradation manager
     */
    initialize() {
        if (this.initialized)
            return;
        // Register core services
        this.registerService('redis', { critical: false });
        this.registerService('database', { critical: true });
        this.registerService('lavalink', { critical: false });
        this.registerService('discord', { critical: true });
        this.initialized = true;
        console.log('[GracefulDegradation] Initialized');
    }
    /**
     * Register a service for monitoring
     * @param name - Service name
     * @param options - Service options
     */
    registerService(name, options = {}) {
        this.services.set(name, {
            name,
            state: ServiceState.HEALTHY,
            critical: options.critical || false,
            lastHealthy: Date.now(),
            failureCount: 0,
            degradedSince: null
        });
    }
    /**
     * Register a fallback handler for a service
     * @param serviceName - Service name
     * @param handler - Async function that provides fallback behavior
     */
    registerFallback(serviceName, handler) {
        this.fallbackHandlers.set(serviceName, handler);
    }
    /**
     * Mark a service as degraded/unavailable
     * @param serviceName - Service name
     * @param state - ServiceState
     * @param reason - Reason for state change
     */
    markService(serviceName, state, reason = '') {
        const service = this.services.get(serviceName);
        if (!service)
            return;
        const previousState = service.state;
        service.state = state;
        service.failureCount++;
        if (state !== ServiceState.HEALTHY && !service.degradedSince) {
            service.degradedSince = Date.now();
        }
        else if (state === ServiceState.HEALTHY) {
            service.lastHealthy = Date.now();
            service.degradedSince = null;
            service.failureCount = 0;
        }
        // Update overall degradation level
        this._updateDegradationLevel();
        // Emit event
        if (previousState !== state) {
            this.emit('serviceStateChange', {
                service: serviceName,
                previousState,
                newState: state,
                reason
            });
            console.log(`[GracefulDegradation] ${serviceName}: ${previousState} → ${state}${reason ? ` (${reason})` : ''}`);
        }
    }
    /**
     * Mark service as healthy
     * @param serviceName - Service name
     */
    markHealthy(serviceName) {
        this.markService(serviceName, ServiceState.HEALTHY);
        // Process queued writes for this service
        this._processQueue(serviceName);
    }
    /**
     * Mark service as degraded
     * @param serviceName - Service name
     * @param reason - Reason for degradation
     */
    markDegraded(serviceName, reason = '') {
        this.markService(serviceName, ServiceState.DEGRADED, reason);
    }
    /**
     * Mark service as unavailable
     * @param serviceName - Service name
     * @param reason - Reason for unavailability
     */
    markUnavailable(serviceName, reason = '') {
        this.markService(serviceName, ServiceState.UNAVAILABLE, reason);
    }
    /**
     * Update overall system degradation level
     * @private
     */
    _updateDegradationLevel() {
        let hasCriticalDown = false;
        let hasDegraded = false;
        let allDown = true;
        for (const service of this.services.values()) {
            if (service.state === ServiceState.HEALTHY) {
                allDown = false;
            }
            else if (service.state === ServiceState.UNAVAILABLE && service.critical) {
                hasCriticalDown = true;
            }
            else {
                hasDegraded = true;
            }
        }
        const previousLevel = this.level;
        if (allDown) {
            this.level = DegradationLevel.OFFLINE;
        }
        else if (hasCriticalDown) {
            this.level = DegradationLevel.CRITICAL;
        }
        else if (hasDegraded) {
            this.level = DegradationLevel.DEGRADED;
        }
        else {
            this.level = DegradationLevel.NORMAL;
        }
        if (previousLevel !== this.level) {
            this.emit('levelChange', {
                previousLevel,
                newLevel: this.level
            });
            console.log(`[GracefulDegradation] System level: ${previousLevel} → ${this.level}`);
        }
    }
    /**
     * Execute with fallback support
     * @param serviceName - Service name
     * @param operation - Primary operation
     * @param options - Execute options
     * @returns Execution result with degradation info
     */
    async execute(serviceName, operation, options = {}) {
        const service = this.services.get(serviceName);
        // If service is unavailable, go straight to fallback
        if (service?.state === ServiceState.UNAVAILABLE) {
            return this._executeFallback(serviceName, options);
        }
        try {
            const result = await operation();
            // Cache successful result if cacheKey provided
            if (options.cacheKey && result != null) {
                this.fallbackCache.set(`${serviceName}:${options.cacheKey}`, {
                    data: result,
                    timestamp: Date.now()
                });
            }
            // Mark healthy on success (recovery)
            if (service?.state !== ServiceState.HEALTHY) {
                this.markHealthy(serviceName);
            }
            return { success: true, data: result, degraded: false };
        }
        catch (error) {
            // Mark as degraded
            this.markDegraded(serviceName, error.message);
            // Try fallback
            return this._executeFallback(serviceName, options, error);
        }
    }
    /**
     * Execute fallback logic
     * @private
     */
    async _executeFallback(serviceName, options, error = null) {
        // Try custom fallback first
        if (options.fallback) {
            try {
                const result = await options.fallback(error);
                return { success: true, data: result, degraded: true };
            }
            catch {
                // Fallback also failed
            }
        }
        // Try registered fallback handler
        const handler = this.fallbackHandlers.get(serviceName);
        if (handler) {
            try {
                const result = await handler(error, options);
                return { success: true, data: result, degraded: true };
            }
            catch {
                // Handler also failed
            }
        }
        // Try cached value
        if (options.cacheKey) {
            const cached = this.fallbackCache.get(`${serviceName}:${options.cacheKey}`);
            if (cached) {
                return {
                    success: true,
                    data: cached.data,
                    degraded: true,
                    stale: true,
                    cacheAge: Date.now() - cached.timestamp
                };
            }
        }
        // Use static fallback value
        if (options.fallbackValue !== undefined) {
            return { success: true, data: options.fallbackValue, degraded: true };
        }
        // Complete failure
        return {
            success: false,
            data: null,
            degraded: true,
            error: error?.message || 'Service unavailable'
        };
    }
    /**
     * Queue a write operation for when service recovers
     * @param serviceName - Service name
     * @param operation - Operation name
     * @param data - Data to write
     * @param options - Additional options
     */
    queueWrite(serviceName, operation, data, options = {}) {
        if (this.writeQueue.length >= this.maxQueueSize) {
            // Drop oldest entries
            this.writeQueue.shift();
            console.warn('[GracefulDegradation] Write queue full, dropping oldest entry');
        }
        this.writeQueue.push({
            serviceName,
            operation,
            data,
            options,
            timestamp: Date.now(),
            retries: 0
        });
        this.emit('writeQueued', { serviceName, operation, queueSize: this.writeQueue.length });
    }
    /**
     * Process queued writes for a recovered service
     * @private
     */
    async _processQueue(serviceName) {
        const pending = this.writeQueue.filter(w => w.serviceName === serviceName);
        if (pending.length === 0)
            return;
        console.log(`[GracefulDegradation] Processing ${pending.length} queued writes for ${serviceName}`);
        for (const item of pending) {
            try {
                // Emit event for handler to process
                this.emit('processQueuedWrite', item);
                // Remove from queue
                const idx = this.writeQueue.indexOf(item);
                if (idx > -1)
                    this.writeQueue.splice(idx, 1);
            }
            catch (error) {
                item.retries++;
                if (item.retries >= 3) {
                    // Give up after 3 retries
                    const idx = this.writeQueue.indexOf(item);
                    if (idx > -1)
                        this.writeQueue.splice(idx, 1);
                    console.error(`[GracefulDegradation] Failed to process queued write after 3 retries:`, error.message);
                }
            }
        }
    }
    /**
     * Check if service is available
     * @param serviceName - Service name
     * @returns Whether service is healthy
     */
    isAvailable(serviceName) {
        const service = this.services.get(serviceName);
        return service?.state === ServiceState.HEALTHY;
    }
    /**
     * Check if service is degraded but still usable
     * @param serviceName - Service name
     * @returns Whether service is degraded
     */
    isDegraded(serviceName) {
        const service = this.services.get(serviceName);
        return service?.state === ServiceState.DEGRADED;
    }
    /**
     * Get service state
     * @param serviceName - Service name
     * @returns Service state or null if not registered
     */
    getServiceState(serviceName) {
        const service = this.services.get(serviceName);
        return service?.state || null;
    }
    /**
     * Check if system is in degraded mode
     * @returns Whether system is degraded
     */
    isSystemDegraded() {
        return this.level !== DegradationLevel.NORMAL;
    }
    /**
     * Get current system status
     * @returns System status
     */
    getStatus() {
        const services = {};
        for (const [name, service] of this.services) {
            services[name] = {
                state: service.state,
                critical: service.critical,
                lastHealthy: service.lastHealthy ? new Date(service.lastHealthy).toISOString() : null,
                degradedSince: service.degradedSince ? new Date(service.degradedSince).toISOString() : null,
                failureCount: service.failureCount
            };
        }
        return {
            level: this.level,
            timestamp: new Date().toISOString(),
            services,
            queuedWrites: this.writeQueue.length,
            cacheEntries: this.fallbackCache.size
        };
    }
    /**
     * Get health for health check endpoint
     * @returns Health result
     */
    getHealth() {
        return {
            healthy: this.level !== DegradationLevel.OFFLINE && this.level !== DegradationLevel.CRITICAL,
            details: this.getStatus()
        };
    }
    /**
     * Clear fallback cache
     * @param serviceName - Optional: clear only for specific service
     */
    clearCache(serviceName = null) {
        if (serviceName) {
            for (const key of this.fallbackCache.keys()) {
                if (key.startsWith(`${serviceName}:`)) {
                    this.fallbackCache.delete(key);
                }
            }
        }
        else {
            this.fallbackCache.clear();
        }
    }
    /**
     * Shutdown
     */
    shutdown() {
        this.services.clear();
        this.fallbackHandlers.clear();
        this.fallbackCache.clear();
        this.writeQueue = [];
        this.initialized = false;
    }
}
exports.GracefulDegradation = GracefulDegradation;
// SINGLETON INSTANCE & EXPORTS
const gracefulDegradation = new GracefulDegradation();
exports.gracefulDegradation = gracefulDegradation;
exports.default = gracefulDegradation;
//# sourceMappingURL=GracefulDegradation.js.map