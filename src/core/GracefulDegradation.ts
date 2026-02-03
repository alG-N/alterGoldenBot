/**
 * Graceful Degradation Service
 * Provides fallback behaviors when services are unavailable
 * Ensures the bot continues functioning with reduced capability
 * @module core/GracefulDegradation
 */

import { EventEmitter } from 'events';
// TYPES & ENUMS
/**
 * Degradation levels for service health
 */
export enum DegradationLevel {
    NORMAL = 'NORMAL',           // All services healthy
    DEGRADED = 'DEGRADED',       // Some services unavailable, fallbacks active
    CRITICAL = 'CRITICAL',       // Core services down, minimal functionality
    OFFLINE = 'OFFLINE'          // Cannot serve requests
}

/**
 * Service states
 */
export enum ServiceState {
    HEALTHY = 'HEALTHY',
    DEGRADED = 'DEGRADED',
    UNAVAILABLE = 'UNAVAILABLE'
}

interface ServiceInfo {
    name: string;
    state: ServiceState;
    critical: boolean;
    lastHealthy: number;
    failureCount: number;
    degradedSince: number | null;
}

interface ServiceOptions {
    critical?: boolean;
}

interface ExecuteOptions<T> {
    fallback?: (error: Error | null) => Promise<T> | T;
    fallbackValue?: T;
    cacheKey?: string;
}

interface ExecuteResult<T> {
    success: boolean;
    data: T | null;
    degraded: boolean;
    stale?: boolean;
    cacheAge?: number;
    error?: string;
}

interface CachedData<T> {
    data: T;
    timestamp: number;
}

interface QueuedWrite {
    serviceName: string;
    operation: string;
    data: unknown;
    options: Record<string, unknown>;
    timestamp: number;
    retries: number;
}

interface ServiceStatusInfo {
    state: ServiceState;
    critical: boolean;
    lastHealthy: string | null;
    degradedSince: string | null;
    failureCount: number;
}

interface SystemStatus {
    level: DegradationLevel;
    timestamp: string;
    services: Record<string, ServiceStatusInfo>;
    queuedWrites: number;
    cacheEntries: number;
}

interface HealthResult {
    healthy: boolean;
    details: SystemStatus;
}
// GRACEFUL DEGRADATION CLASS
/**
 * Graceful Degradation Manager
 * Coordinates fallback behaviors across services
 */
export class GracefulDegradation extends EventEmitter {
    /** Service health states */
    private services: Map<string, ServiceInfo> = new Map();
    
    /** Current system degradation level */
    private level: DegradationLevel = DegradationLevel.NORMAL;
    
    /** Fallback handlers per service */
    private fallbackHandlers: Map<string, (error: Error | null, options: Record<string, unknown>) => Promise<unknown>> = new Map();
    
    /** Cached data for fallbacks */
    private fallbackCache: Map<string, CachedData<unknown>> = new Map();
    
    /** Queued operations for when service recovers */
    private writeQueue: QueuedWrite[] = [];
    
    /** Max queue size before dropping */
    private maxQueueSize: number = 1000;
    
    /** Initialization state */
    private initialized: boolean = false;

    constructor() {
        super();
    }

    /**
     * Initialize the degradation manager
     */
    initialize(): void {
        if (this.initialized) return;
        
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
    registerService(name: string, options: ServiceOptions = {}): void {
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
    registerFallback(
        serviceName: string, 
        handler: (error: Error | null, options: Record<string, unknown>) => Promise<unknown>
    ): void {
        this.fallbackHandlers.set(serviceName, handler);
    }

    /**
     * Mark a service as degraded/unavailable
     * @param serviceName - Service name
     * @param state - ServiceState
     * @param reason - Reason for state change
     */
    markService(serviceName: string, state: ServiceState, reason: string = ''): void {
        const service = this.services.get(serviceName);
        if (!service) return;

        const previousState = service.state;
        service.state = state;
        service.failureCount++;

        if (state !== ServiceState.HEALTHY && !service.degradedSince) {
            service.degradedSince = Date.now();
        } else if (state === ServiceState.HEALTHY) {
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
    markHealthy(serviceName: string): void {
        this.markService(serviceName, ServiceState.HEALTHY);
        
        // Process queued writes for this service
        this._processQueue(serviceName);
    }

    /**
     * Mark service as degraded
     * @param serviceName - Service name
     * @param reason - Reason for degradation
     */
    markDegraded(serviceName: string, reason: string = ''): void {
        this.markService(serviceName, ServiceState.DEGRADED, reason);
    }

    /**
     * Mark service as unavailable
     * @param serviceName - Service name
     * @param reason - Reason for unavailability
     */
    markUnavailable(serviceName: string, reason: string = ''): void {
        this.markService(serviceName, ServiceState.UNAVAILABLE, reason);
    }

    /**
     * Update overall system degradation level
     * @private
     */
    private _updateDegradationLevel(): void {
        let hasCriticalDown = false;
        let hasDegraded = false;
        let allDown = true;

        for (const service of this.services.values()) {
            if (service.state === ServiceState.HEALTHY) {
                allDown = false;
            } else if (service.state === ServiceState.UNAVAILABLE && service.critical) {
                hasCriticalDown = true;
            } else {
                hasDegraded = true;
            }
        }

        const previousLevel = this.level;

        if (allDown) {
            this.level = DegradationLevel.OFFLINE;
        } else if (hasCriticalDown) {
            this.level = DegradationLevel.CRITICAL;
        } else if (hasDegraded) {
            this.level = DegradationLevel.DEGRADED;
        } else {
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
    async execute<T>(
        serviceName: string, 
        operation: () => Promise<T>, 
        options: ExecuteOptions<T> = {}
    ): Promise<ExecuteResult<T>> {
        const service = this.services.get(serviceName);
        
        // If service is unavailable, go straight to fallback
        if (service?.state === ServiceState.UNAVAILABLE) {
            return this._executeFallback<T>(serviceName, options);
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
        } catch (error) {
            // Mark as degraded
            this.markDegraded(serviceName, (error as Error).message);
            
            // Try fallback
            return this._executeFallback<T>(serviceName, options, error as Error);
        }
    }

    /**
     * Execute fallback logic
     * @private
     */
    private async _executeFallback<T>(
        serviceName: string, 
        options: ExecuteOptions<T>, 
        error: Error | null = null
    ): Promise<ExecuteResult<T>> {
        // Try custom fallback first
        if (options.fallback) {
            try {
                const result = await options.fallback(error);
                return { success: true, data: result, degraded: true };
            } catch {
                // Fallback also failed
            }
        }

        // Try registered fallback handler
        const handler = this.fallbackHandlers.get(serviceName);
        if (handler) {
            try {
                const result = await handler(error, options as Record<string, unknown>) as T;
                return { success: true, data: result, degraded: true };
            } catch {
                // Handler also failed
            }
        }

        // Try cached value
        if (options.cacheKey) {
            const cached = this.fallbackCache.get(`${serviceName}:${options.cacheKey}`) as CachedData<T> | undefined;
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
    queueWrite(serviceName: string, operation: string, data: unknown, options: Record<string, unknown> = {}): void {
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
    private async _processQueue(serviceName: string): Promise<void> {
        const pending = this.writeQueue.filter(w => w.serviceName === serviceName);
        if (pending.length === 0) return;

        console.log(`[GracefulDegradation] Processing ${pending.length} queued writes for ${serviceName}`);

        for (const item of pending) {
            try {
                // Emit event for handler to process
                this.emit('processQueuedWrite', item);
                
                // Remove from queue
                const idx = this.writeQueue.indexOf(item);
                if (idx > -1) this.writeQueue.splice(idx, 1);
            } catch (error) {
                item.retries++;
                if (item.retries >= 3) {
                    // Give up after 3 retries
                    const idx = this.writeQueue.indexOf(item);
                    if (idx > -1) this.writeQueue.splice(idx, 1);
                    console.error(`[GracefulDegradation] Failed to process queued write after 3 retries:`, (error as Error).message);
                }
            }
        }
    }

    /**
     * Check if service is available
     * @param serviceName - Service name
     * @returns Whether service is healthy
     */
    isAvailable(serviceName: string): boolean {
        const service = this.services.get(serviceName);
        return service?.state === ServiceState.HEALTHY;
    }

    /**
     * Check if service is degraded but still usable
     * @param serviceName - Service name
     * @returns Whether service is degraded
     */
    isDegraded(serviceName: string): boolean {
        const service = this.services.get(serviceName);
        return service?.state === ServiceState.DEGRADED;
    }

    /**
     * Get service state
     * @param serviceName - Service name
     * @returns Service state or null if not registered
     */
    getServiceState(serviceName: string): ServiceState | null {
        const service = this.services.get(serviceName);
        return service?.state || null;
    }

    /**
     * Check if system is in degraded mode
     * @returns Whether system is degraded
     */
    isSystemDegraded(): boolean {
        return this.level !== DegradationLevel.NORMAL;
    }

    /**
     * Get current system status
     * @returns System status
     */
    getStatus(): SystemStatus {
        const services: Record<string, ServiceStatusInfo> = {};
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
    getHealth(): HealthResult {
        return {
            healthy: this.level !== DegradationLevel.OFFLINE && this.level !== DegradationLevel.CRITICAL,
            details: this.getStatus()
        };
    }

    /**
     * Clear fallback cache
     * @param serviceName - Optional: clear only for specific service
     */
    clearCache(serviceName: string | null = null): void {
        if (serviceName) {
            for (const key of this.fallbackCache.keys()) {
                if (key.startsWith(`${serviceName}:`)) {
                    this.fallbackCache.delete(key);
                }
            }
        } else {
            this.fallbackCache.clear();
        }
    }

    /**
     * Shutdown
     */
    shutdown(): void {
        this.services.clear();
        this.fallbackHandlers.clear();
        this.fallbackCache.clear();
        this.writeQueue = [];
        this.initialized = false;
    }
}
// SINGLETON INSTANCE & EXPORTS
const gracefulDegradation = new GracefulDegradation();

export default gracefulDegradation;
export { gracefulDegradation };
