"use strict";
/**
 * Prometheus Metrics Service
 *
 * Exposes application metrics for monitoring via Prometheus/Grafana
 *
 * Metrics Categories:
 * - Discord: gateway latency, guilds, users, shards
 * - Commands: execution count, duration, errors
 * - Music: active players, queue sizes, voice connections
 * - Cache: hit/miss ratio, Redis status
 * - System: memory, CPU, event loop lag
 *
 * @module core/metrics
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.promClient = exports.register = exports.httpRequestDuration = exports.httpRequestsTotal = exports.discordEventsTotal = exports.automodActionsTotal = exports.automodViolationsTotal = exports.circuitBreakerFailures = exports.circuitBreakerState = exports.databasePoolSize = exports.databaseQueryDuration = exports.databaseQueriesTotal = exports.redisLatency = exports.redisConnectionStatus = exports.cacheHitRatio = exports.cacheOperationsTotal = exports.lavalinkNodePlayers = exports.lavalinkNodeStatus = exports.musicTracksPlayedTotal = exports.musicVoiceConnections = exports.musicQueueSize = exports.musicPlayersActive = exports.commandsActive = exports.commandErrorsTotal = exports.commandExecutionDuration = exports.commandsExecutedTotal = exports.discordUptime = exports.discordChannelsTotal = exports.discordUsersTotal = exports.discordGuildsTotal = exports.discordGatewayLatency = void 0;
exports.getMetrics = getMetrics;
exports.getContentType = getContentType;
exports.resetMetrics = resetMetrics;
exports.trackCommand = trackCommand;
exports.trackCacheOperation = trackCacheOperation;
exports.trackDatabaseQuery = trackDatabaseQuery;
exports.trackAutomodViolation = trackAutomodViolation;
exports.updateDiscordMetrics = updateDiscordMetrics;
exports.updateMusicMetrics = updateMusicMetrics;
exports.updateLavalinkMetrics = updateLavalinkMetrics;
exports.updateCircuitBreakerMetrics = updateCircuitBreakerMetrics;
exports.trackCircuitBreakerFailure = trackCircuitBreakerFailure;
const prom_client_1 = __importStar(require("prom-client"));
exports.promClient = prom_client_1.default;
// ═══════════════════════════════════════════════════════════════
// REGISTRY SETUP
// ═══════════════════════════════════════════════════════════════
// Create a custom registry
const register = new prom_client_1.Registry();
exports.register = register;
// Add default Node.js metrics (memory, CPU, event loop, etc.)
(0, prom_client_1.collectDefaultMetrics)({
    register,
    prefix: 'altergolden_',
    labels: { app: 'altergolden' }
});
// ═══════════════════════════════════════════════════════════════
// DISCORD METRICS
// ═══════════════════════════════════════════════════════════════
/**
 * Discord gateway latency in milliseconds
 */
exports.discordGatewayLatency = new prom_client_1.Gauge({
    name: 'altergolden_discord_gateway_latency_ms',
    help: 'Discord WebSocket gateway latency in milliseconds',
    labelNames: ['shard_id'],
    registers: [register]
});
/**
 * Total guilds the bot is in
 */
exports.discordGuildsTotal = new prom_client_1.Gauge({
    name: 'altergolden_discord_guilds_total',
    help: 'Total number of guilds the bot is in',
    labelNames: ['shard_id'],
    registers: [register]
});
/**
 * Total users across all guilds
 */
exports.discordUsersTotal = new prom_client_1.Gauge({
    name: 'altergolden_discord_users_total',
    help: 'Total number of users across all guilds',
    labelNames: ['shard_id'],
    registers: [register]
});
/**
 * Total channels across all guilds
 */
exports.discordChannelsTotal = new prom_client_1.Gauge({
    name: 'altergolden_discord_channels_total',
    help: 'Total number of channels across all guilds',
    labelNames: ['shard_id'],
    registers: [register]
});
/**
 * Bot uptime in seconds
 */
exports.discordUptime = new prom_client_1.Gauge({
    name: 'altergolden_discord_uptime_seconds',
    help: 'Bot uptime in seconds',
    registers: [register]
});
// ═══════════════════════════════════════════════════════════════
// COMMAND METRICS
// ═══════════════════════════════════════════════════════════════
/**
 * Total commands executed
 */
exports.commandsExecutedTotal = new prom_client_1.Counter({
    name: 'altergolden_commands_executed_total',
    help: 'Total number of commands executed',
    labelNames: ['command', 'category', 'status'],
    registers: [register]
});
/**
 * Command execution duration
 */
exports.commandExecutionDuration = new prom_client_1.Histogram({
    name: 'altergolden_command_execution_duration_seconds',
    help: 'Command execution duration in seconds',
    labelNames: ['command', 'category'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register]
});
/**
 * Command errors
 */
exports.commandErrorsTotal = new prom_client_1.Counter({
    name: 'altergolden_command_errors_total',
    help: 'Total number of command errors',
    labelNames: ['command', 'category', 'error_type'],
    registers: [register]
});
/**
 * Active command executions (currently running)
 */
exports.commandsActive = new prom_client_1.Gauge({
    name: 'altergolden_commands_active',
    help: 'Number of commands currently being executed',
    labelNames: ['command'],
    registers: [register]
});
// ═══════════════════════════════════════════════════════════════
// MUSIC METRICS
// ═══════════════════════════════════════════════════════════════
/**
 * Active music players
 */
exports.musicPlayersActive = new prom_client_1.Gauge({
    name: 'altergolden_music_players_active',
    help: 'Number of active music players',
    registers: [register]
});
/**
 * Total tracks in all queues
 */
exports.musicQueueSize = new prom_client_1.Gauge({
    name: 'altergolden_music_queue_size_total',
    help: 'Total number of tracks across all queues',
    registers: [register]
});
/**
 * Voice connections
 */
exports.musicVoiceConnections = new prom_client_1.Gauge({
    name: 'altergolden_music_voice_connections',
    help: 'Number of active voice connections',
    registers: [register]
});
/**
 * Tracks played total
 */
exports.musicTracksPlayedTotal = new prom_client_1.Counter({
    name: 'altergolden_music_tracks_played_total',
    help: 'Total number of tracks played',
    labelNames: ['source'],
    registers: [register]
});
/**
 * Lavalink node status
 */
exports.lavalinkNodeStatus = new prom_client_1.Gauge({
    name: 'altergolden_lavalink_node_status',
    help: 'Lavalink node status (1=connected, 0=disconnected)',
    labelNames: ['node_name'],
    registers: [register]
});
/**
 * Lavalink node players
 */
exports.lavalinkNodePlayers = new prom_client_1.Gauge({
    name: 'altergolden_lavalink_node_players',
    help: 'Number of players on each Lavalink node',
    labelNames: ['node_name'],
    registers: [register]
});
// ═══════════════════════════════════════════════════════════════
// CACHE METRICS
// ═══════════════════════════════════════════════════════════════
/**
 * Cache operations
 */
exports.cacheOperationsTotal = new prom_client_1.Counter({
    name: 'altergolden_cache_operations_total',
    help: 'Total cache operations',
    labelNames: ['operation', 'namespace', 'result'],
    registers: [register]
});
/**
 * Cache hit ratio
 */
exports.cacheHitRatio = new prom_client_1.Gauge({
    name: 'altergolden_cache_hit_ratio',
    help: 'Cache hit ratio (0-1)',
    labelNames: ['namespace'],
    registers: [register]
});
/**
 * Redis connection status
 */
exports.redisConnectionStatus = new prom_client_1.Gauge({
    name: 'altergolden_redis_connection_status',
    help: 'Redis connection status (1=connected, 0=disconnected)',
    registers: [register]
});
/**
 * Redis latency
 */
exports.redisLatency = new prom_client_1.Histogram({
    name: 'altergolden_redis_latency_seconds',
    help: 'Redis operation latency in seconds',
    labelNames: ['operation'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
    registers: [register]
});
// ═══════════════════════════════════════════════════════════════
// DATABASE METRICS
// ═══════════════════════════════════════════════════════════════
/**
 * Database queries
 */
exports.databaseQueriesTotal = new prom_client_1.Counter({
    name: 'altergolden_database_queries_total',
    help: 'Total database queries',
    labelNames: ['operation', 'table', 'status'],
    registers: [register]
});
/**
 * Database query duration
 */
exports.databaseQueryDuration = new prom_client_1.Histogram({
    name: 'altergolden_database_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    registers: [register]
});
/**
 * Database connection pool
 */
exports.databasePoolSize = new prom_client_1.Gauge({
    name: 'altergolden_database_pool_size',
    help: 'Database connection pool size',
    labelNames: ['state'],
    registers: [register]
});
// ═══════════════════════════════════════════════════════════════
// CIRCUIT BREAKER METRICS
// ═══════════════════════════════════════════════════════════════
/**
 * Circuit breaker state
 */
exports.circuitBreakerState = new prom_client_1.Gauge({
    name: 'altergolden_circuit_breaker_state',
    help: 'Circuit breaker state (0=closed, 0.5=half-open, 1=open)',
    labelNames: ['service'],
    registers: [register]
});
/**
 * Circuit breaker failures
 */
exports.circuitBreakerFailures = new prom_client_1.Counter({
    name: 'altergolden_circuit_breaker_failures_total',
    help: 'Total circuit breaker failures',
    labelNames: ['service'],
    registers: [register]
});
// ═══════════════════════════════════════════════════════════════
// AUTOMOD METRICS
// ═══════════════════════════════════════════════════════════════
/**
 * AutoMod violations
 */
exports.automodViolationsTotal = new prom_client_1.Counter({
    name: 'altergolden_automod_violations_total',
    help: 'Total AutoMod violations detected',
    labelNames: ['type', 'action'],
    registers: [register]
});
/**
 * AutoMod actions taken
 */
exports.automodActionsTotal = new prom_client_1.Counter({
    name: 'altergolden_automod_actions_total',
    help: 'Total AutoMod actions taken',
    labelNames: ['action'],
    registers: [register]
});
// ═══════════════════════════════════════════════════════════════
// EVENT METRICS
// ═══════════════════════════════════════════════════════════════
/**
 * Discord events received
 */
exports.discordEventsTotal = new prom_client_1.Counter({
    name: 'altergolden_discord_events_total',
    help: 'Total Discord events received',
    labelNames: ['event_type'],
    registers: [register]
});
// ═══════════════════════════════════════════════════════════════
// HTTP METRICS (for health endpoint)
// ═══════════════════════════════════════════════════════════════
/**
 * HTTP requests
 */
exports.httpRequestsTotal = new prom_client_1.Counter({
    name: 'altergolden_http_requests_total',
    help: 'Total HTTP requests to health/metrics endpoints',
    labelNames: ['method', 'path', 'status_code'],
    registers: [register]
});
/**
 * HTTP request duration
 */
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: 'altergolden_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    registers: [register]
});
// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════
/**
 * Get all metrics in Prometheus format
 */
async function getMetrics() {
    return await register.metrics();
}
/**
 * Get metrics content type
 */
function getContentType() {
    return register.contentType;
}
/**
 * Reset all metrics (useful for testing)
 */
function resetMetrics() {
    register.resetMetrics();
}
/**
 * Track command execution
 */
function trackCommand(command, category, durationMs, status, errorType) {
    const durationSeconds = durationMs / 1000;
    exports.commandsExecutedTotal.inc({ command, category, status });
    exports.commandExecutionDuration.observe({ command, category }, durationSeconds);
    if (status === 'error' && errorType) {
        exports.commandErrorsTotal.inc({ command, category, error_type: errorType });
    }
}
/**
 * Track cache operation
 */
function trackCacheOperation(namespace, operation, hit) {
    const result = operation === 'get' ? (hit ? 'hit' : 'miss') : 'ok';
    exports.cacheOperationsTotal.inc({ operation, namespace, result });
}
/**
 * Track database query
 */
function trackDatabaseQuery(operation, table, durationMs, success) {
    const durationSeconds = durationMs / 1000;
    const status = success ? 'success' : 'error';
    exports.databaseQueriesTotal.inc({ operation, table, status });
    exports.databaseQueryDuration.observe({ operation, table }, durationSeconds);
}
/**
 * Track AutoMod violation
 */
function trackAutomodViolation(type, action) {
    exports.automodViolationsTotal.inc({ type, action });
    exports.automodActionsTotal.inc({ action });
}
/**
 * Update Discord metrics
 */
function updateDiscordMetrics(data) {
    const labels = { shard_id: String(data.shardId ?? 0) };
    if (data.ping !== undefined) {
        exports.discordGatewayLatency.set(labels, data.ping);
    }
    if (data.guilds !== undefined) {
        exports.discordGuildsTotal.set(labels, data.guilds);
    }
    if (data.users !== undefined) {
        exports.discordUsersTotal.set(labels, data.users);
    }
    if (data.channels !== undefined) {
        exports.discordChannelsTotal.set(labels, data.channels);
    }
    if (data.uptime !== undefined) {
        exports.discordUptime.set(data.uptime / 1000); // Convert to seconds
    }
}
/**
 * Update music metrics
 */
function updateMusicMetrics(data) {
    if (data.activePlayers !== undefined) {
        exports.musicPlayersActive.set(data.activePlayers);
    }
    if (data.totalQueueSize !== undefined) {
        exports.musicQueueSize.set(data.totalQueueSize);
    }
    if (data.voiceConnections !== undefined) {
        exports.musicVoiceConnections.set(data.voiceConnections);
    }
}
/**
 * Update Lavalink node metrics
 */
function updateLavalinkMetrics(nodeName, connected, players) {
    exports.lavalinkNodeStatus.set({ node_name: nodeName }, connected ? 1 : 0);
    exports.lavalinkNodePlayers.set({ node_name: nodeName }, players);
}
/**
 * Update circuit breaker metrics
 */
function updateCircuitBreakerMetrics(service, state) {
    const stateValue = state === 'closed' ? 0 : state === 'half-open' ? 0.5 : 1;
    exports.circuitBreakerState.set({ service }, stateValue);
}
/**
 * Track circuit breaker failure
 */
function trackCircuitBreakerFailure(service) {
    exports.circuitBreakerFailures.inc({ service });
}
exports.default = {
    register,
    getMetrics,
    getContentType,
    resetMetrics,
    trackCommand,
    trackCacheOperation,
    trackDatabaseQuery,
    trackAutomodViolation,
    updateDiscordMetrics,
    updateMusicMetrics,
    updateLavalinkMetrics,
    updateCircuitBreakerMetrics,
    trackCircuitBreakerFailure,
    // Individual metrics for direct access
    discordGatewayLatency: exports.discordGatewayLatency,
    discordGuildsTotal: exports.discordGuildsTotal,
    discordUsersTotal: exports.discordUsersTotal,
    discordChannelsTotal: exports.discordChannelsTotal,
    discordUptime: exports.discordUptime,
    commandsExecutedTotal: exports.commandsExecutedTotal,
    commandExecutionDuration: exports.commandExecutionDuration,
    commandErrorsTotal: exports.commandErrorsTotal,
    commandsActive: exports.commandsActive,
    musicPlayersActive: exports.musicPlayersActive,
    musicQueueSize: exports.musicQueueSize,
    musicVoiceConnections: exports.musicVoiceConnections,
    musicTracksPlayedTotal: exports.musicTracksPlayedTotal,
    lavalinkNodeStatus: exports.lavalinkNodeStatus,
    lavalinkNodePlayers: exports.lavalinkNodePlayers,
    cacheOperationsTotal: exports.cacheOperationsTotal,
    cacheHitRatio: exports.cacheHitRatio,
    redisConnectionStatus: exports.redisConnectionStatus,
    redisLatency: exports.redisLatency,
    databaseQueriesTotal: exports.databaseQueriesTotal,
    databaseQueryDuration: exports.databaseQueryDuration,
    databasePoolSize: exports.databasePoolSize,
    circuitBreakerState: exports.circuitBreakerState,
    circuitBreakerFailures: exports.circuitBreakerFailures,
    automodViolationsTotal: exports.automodViolationsTotal,
    automodActionsTotal: exports.automodActionsTotal,
    discordEventsTotal: exports.discordEventsTotal,
    httpRequestsTotal: exports.httpRequestsTotal,
    httpRequestDuration: exports.httpRequestDuration
};
//# sourceMappingURL=metrics.js.map