"use strict";
/**
 * Health Check Service
 * Provides health status for the application
 * Used by load balancers, Kubernetes probes, and monitoring
 * @module core/health
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHealthCheck = registerHealthCheck;
exports.runHealthChecks = runHealthChecks;
exports.getHealthStatus = getHealthStatus;
exports.setStatus = setStatus;
exports.startHealthServer = startHealthServer;
exports.registerDefaultChecks = registerDefaultChecks;
const http = __importStar(require("http"));
const Logger_1 = __importDefault(require("./Logger"));
const metrics_1 = require("./metrics");
const healthState = {
    status: 'starting',
    startTime: Date.now(),
    checks: {}
};
// Registered health checks
const healthChecks = new Map();
// FUNCTIONS
/**
 * Register a health check
 * @param name - Check name
 * @param checkFn - Async function returning { healthy: boolean, details?: object }
 */
function registerHealthCheck(name, checkFn) {
    healthChecks.set(name, checkFn);
    Logger_1.default.debug('Health', `Registered health check: ${name}`);
}
/**
 * Run all health checks
 * @returns Health status
 */
async function runHealthChecks() {
    const results = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - healthState.startTime) / 1000),
        checks: {}
    };
    for (const [name, checkFn] of healthChecks) {
        try {
            const startTime = Date.now();
            const result = await Promise.race([
                checkFn(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000))
            ]);
            results.checks[name] = {
                status: result.healthy ? 'healthy' : 'unhealthy',
                latency: Date.now() - startTime,
                ...result.details
            };
            if (!result.healthy) {
                results.status = 'unhealthy';
            }
        }
        catch (error) {
            results.checks[name] = {
                status: 'unhealthy',
                error: error.message
            };
            results.status = 'unhealthy';
        }
    }
    healthState.checks = results.checks;
    healthState.status = results.status === 'healthy' ? 'healthy' : 'unhealthy';
    return results;
}
/**
 * Get current health status (cached, fast)
 * @returns Current health state
 */
function getHealthStatus() {
    return {
        status: healthState.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - healthState.startTime) / 1000),
        checks: healthState.checks
    };
}
/**
 * Set the overall status
 * @param status - New status
 */
function setStatus(status) {
    healthState.status = status;
}
/**
 * Start the health check HTTP server
 * @param port - Port to listen on (default: 3000)
 * @returns HTTP server instance
 */
function startHealthServer(port = 3000) {
    const server = http.createServer(async (req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        if (req.url === '/health' || req.url === '/healthz') {
            try {
                const health = await runHealthChecks();
                const statusCode = health.status === 'healthy' ? 200 : 503;
                res.writeHead(statusCode);
                res.end(JSON.stringify(health, null, 2));
            }
            catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ status: 'error', error: error.message }));
            }
        }
        else if (req.url === '/ready' || req.url === '/readyz') {
            // Readiness probe - quick check, no deep health checks
            const status = healthState.status;
            const ready = status === 'healthy';
            res.writeHead(ready ? 200 : 503);
            res.end(JSON.stringify({ ready, status }));
        }
        else if (req.url === '/live' || req.url === '/livez') {
            // Liveness probe - just check if process is alive
            res.writeHead(200);
            res.end(JSON.stringify({ alive: true }));
        }
        else if (req.url === '/metrics') {
            // Prometheus metrics endpoint
            try {
                const metrics = await (0, metrics_1.getMetrics)();
                res.setHeader('Content-Type', (0, metrics_1.getContentType)());
                res.writeHead(200);
                res.end(metrics);
            }
            catch (error) {
                res.writeHead(500);
                res.end(`# Error collecting metrics: ${error.message}`);
            }
        }
        else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    });
    server.listen(port, () => {
        Logger_1.default.info('Health', `Health check server listening on port ${port}`);
    });
    server.on('error', (error) => {
        Logger_1.default.error('Health', `Health server error: ${error.message}`);
    });
    return server;
}
/**
 * Create default health checks for common services
 * @param services - Services to check
 */
function registerDefaultChecks(services = {}) {
    // Discord client check
    if (services.client) {
        registerHealthCheck('discord', async () => {
            const client = services.client;
            return {
                healthy: client.isReady(),
                details: {
                    ping: client.ws.ping,
                    guilds: client.guilds.cache.size,
                    uptime: client.uptime
                }
            };
        });
    }
    // PostgreSQL check
    if (services.database) {
        registerHealthCheck('postgres', async () => {
            try {
                await services.database.query('SELECT 1');
                return { healthy: true, details: { connected: true } };
            }
            catch (error) {
                return { healthy: false, details: { error: error.message } };
            }
        });
    }
    // Redis check
    if (services.redis) {
        registerHealthCheck('redis', async () => {
            try {
                if (services.redis.isConnected) {
                    await services.redis.client.ping();
                    return { healthy: true, details: { connected: true } };
                }
                return { healthy: true, details: { connected: false, fallback: 'in-memory' } };
            }
            catch (error) {
                return { healthy: false, details: { error: error.message } };
            }
        });
    }
    // Cache service check (if provided)
    if (services.cacheService) {
        registerHealthCheck('cache', async () => {
            const stats = services.cacheService.getStats();
            return {
                healthy: true,
                details: {
                    hitRate: Math.round(stats.hitRate * 100) + '%',
                    hits: stats.hits,
                    misses: stats.misses,
                    memoryEntries: stats.memoryEntries,
                    redisConnected: stats.redisConnected
                }
            };
        });
    }
    // Lavalink check
    if (services.lavalink) {
        registerHealthCheck('lavalink', async () => {
            const status = services.lavalink.getNodeStatus?.() || {};
            // Consider healthy if ready OR if we have nodes (node might be connecting)
            const nodeCount = status.nodes?.length || 0;
            const isHealthy = status.ready === true || nodeCount > 0;
            return {
                healthy: isHealthy,
                details: {
                    ready: status.ready,
                    nodes: nodeCount,
                    players: status.activeConnections || 0
                }
            };
        });
    }
    // Circuit Breaker check
    if (services.circuitBreakerRegistry) {
        registerHealthCheck('circuitBreakers', async () => {
            const health = services.circuitBreakerRegistry.getHealth();
            const summary = services.circuitBreakerRegistry.getSummary();
            return {
                healthy: health.status !== 'unhealthy',
                details: {
                    status: health.status,
                    total: summary.total,
                    closed: summary.closed,
                    open: summary.open,
                    halfOpen: summary.halfOpen,
                    breakers: Object.fromEntries(Object.entries(health.breakers).map(([name, b]) => [name, b.state]))
                }
            };
        });
    }
    // Graceful Degradation check
    if (services.gracefulDegradation) {
        registerHealthCheck('degradation', async () => {
            const status = services.gracefulDegradation.getStatus();
            return {
                healthy: status.level !== 'critical' && status.level !== 'offline',
                details: {
                    level: status.level,
                    services: status.services,
                    pendingWrites: Object.fromEntries(Object.entries(status.writeQueues || {}).map(([k, v]) => [k, v]))
                }
            };
        });
    }
}
//# sourceMappingURL=health.js.map