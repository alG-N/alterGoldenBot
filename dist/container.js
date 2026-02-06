"use strict";
/**
 * Dependency Injection Container
 * Manages service lifecycle and dependencies
 * Replaces singleton pattern for better testability and scalability
 * @module container
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = exports.Container = void 0;
const Logger_js_1 = require("./core/Logger.js");
// Container Class
class Container {
    /** Service factories */
    factories = new Map();
    /** Cached singleton instances */
    instances = new Map();
    /** Tag to service name mapping */
    tagMap = new Map();
    /** Whether container is currently booting */
    isBooting = false;
    /** Services currently being resolved (for circular dependency detection) */
    resolving = new Set();
    /**
     * Register a service factory
     * @param name - Service name
     * @param factory - Factory function (container) => instance
     * @param options - Registration options
     * @returns this (for chaining)
     */
    register(name, factory, options = {}) {
        const opts = {
            singleton: true,
            tags: [],
            ...options
        };
        this.factories.set(name, { factory, options: opts });
        // Register tags
        for (const tag of opts.tags) {
            if (!this.tagMap.has(tag)) {
                this.tagMap.set(tag, []);
            }
            this.tagMap.get(tag).push(name);
        }
        Logger_js_1.logger.debug('Container', `Registered service: ${name}`);
        return this;
    }
    /**
     * Register a pre-built instance
     * @param name - Service name
     * @param inst - Service instance
     * @returns this (for chaining)
     */
    instance(name, inst) {
        this.instances.set(name, inst);
        Logger_js_1.logger.debug('Container', `Registered instance: ${name}`);
        return this;
    }
    /**
     * Resolve a service by name
     * @param name - Service name
     * @returns Service instance
     * @throws Error if service not found or circular dependency
     */
    resolve(name) {
        // Check for cached singleton
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }
        // Check if factory exists
        const registration = this.factories.get(name);
        if (!registration) {
            throw new Error(`Service not found: ${name}`);
        }
        // Check for circular dependencies
        if (this.resolving.has(name)) {
            const chain = [...this.resolving, name].join(' -> ');
            throw new Error(`Circular dependency detected: ${chain}`);
        }
        // Mark as resolving
        this.resolving.add(name);
        try {
            // Create instance
            const inst = registration.factory(this);
            // Cache if singleton
            if (registration.options.singleton) {
                this.instances.set(name, inst);
            }
            return inst;
        }
        finally {
            this.resolving.delete(name);
        }
    }
    /**
     * Check if a service is registered
     * @param name - Service name
     * @returns true if registered
     */
    has(name) {
        return this.factories.has(name) || this.instances.has(name);
    }
    /**
     * Get all services with a specific tag
     * @param tag - Tag name
     * @returns Array of service instances
     */
    tagged(tag) {
        const names = this.tagMap.get(tag) || [];
        return names.map(name => this.resolve(name));
    }
    /**
     * Reset container (for testing)
     * Clears all instances but keeps factories
     */
    reset() {
        this.instances.clear();
        this.resolving.clear();
        Logger_js_1.logger.debug('Container', 'Reset all instances');
    }
    /**
     * Clear everything (for testing)
     */
    clear() {
        this.factories.clear();
        this.instances.clear();
        this.tagMap.clear();
        this.resolving.clear();
        Logger_js_1.logger.debug('Container', 'Cleared all registrations');
    }
    /**
     * Boot all services (initialize singletons)
     * Call this after all registrations
     * @param serviceNames - Specific services to boot, or all if empty
     */
    async boot(serviceNames = []) {
        if (this.isBooting) {
            throw new Error('Container is already booting');
        }
        this.isBooting = true;
        const toResolve = serviceNames.length > 0
            ? serviceNames
            : [...this.factories.keys()];
        Logger_js_1.logger.info('Container', `Booting ${toResolve.length} services...`);
        for (const name of toResolve) {
            try {
                const inst = this.resolve(name);
                // Call initialize() if exists
                if (inst && typeof inst.initialize === 'function') {
                    await inst.initialize();
                    Logger_js_1.logger.debug('Container', `Initialized: ${name}`);
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                Logger_js_1.logger.error('Container', `Failed to boot ${name}: ${message}`);
                throw error;
            }
        }
        this.isBooting = false;
        Logger_js_1.logger.info('Container', 'All services booted');
    }
    /**
     * Graceful shutdown of all services
     */
    async shutdown() {
        Logger_js_1.logger.info('Container', 'Shutting down services...');
        for (const [name, inst] of this.instances) {
            try {
                const service = inst;
                if (!service)
                    continue;
                // Try lifecycle methods in priority order
                if (typeof service.shutdown === 'function') {
                    await service.shutdown();
                }
                else if (typeof service.shutdownAll === 'function') {
                    await service.shutdownAll();
                }
                else if (typeof service.destroy === 'function') {
                    await service.destroy();
                }
                else if (typeof service.destroyAll === 'function') {
                    await service.destroyAll();
                }
                else if (typeof service.close === 'function') {
                    await service.close();
                }
                else {
                    continue; // No lifecycle method — skip logging
                }
                Logger_js_1.logger.debug('Container', `Shutdown: ${name}`);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                Logger_js_1.logger.warn('Container', `Error shutting down ${name}: ${message}`);
            }
        }
        this.reset();
        Logger_js_1.logger.info('Container', 'All services shutdown');
    }
    /**
     * Get debug info about registered services
     * @returns Debug info object
     */
    getDebugInfo() {
        return {
            registered: [...this.factories.keys()],
            instantiated: [...this.instances.keys()],
            tags: Object.fromEntries(this.tagMap)
        };
    }
}
exports.Container = Container;
// Export singleton container (but can create new instances for testing)
exports.container = new Container();
exports.default = exports.container;
//# sourceMappingURL=container.js.map