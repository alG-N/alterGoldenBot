/**
 * Core Module Index
 * Central exports for core infrastructure
 * @module core
 */
// TYPESCRIPT MODULES
// Logger
export { default as logger, Logger, LOG_LEVELS, LOG_CHANNEL_ID } from './Logger';
export type { LogLevel, LogFormat, LogMetadata, RequestLogOptions } from './Logger';

// Result Pattern
export { Result } from './Result';
export type { ErrorDetails, ReplyOptions, DiscordReply, ResultJSON } from './Result';

// Error Codes
export { ErrorCodes, getErrorMessage, isErrorCategory } from './ErrorCodes';
export type { ErrorCode, ErrorCategory } from './ErrorCodes';

// Circuit Breaker
export { CircuitBreaker, CircuitState } from './CircuitBreaker';
export type { 
    CircuitStateType,
    CircuitBreakerOptions,
    CircuitMetrics,
    CircuitBreakerMetrics,
    CircuitHealth,
    StateChange
} from './CircuitBreaker';

// Circuit Breaker Registry
export { 
    circuitBreakerRegistry, 
    CircuitBreakerRegistry, 
    CIRCUIT_CONFIGS 
} from './CircuitBreakerRegistry';
export type { RegistryHealth, RegistrySummary, FallbackResult } from './CircuitBreakerRegistry';

// Client
export { 
    createClient, 
    setPresence, 
    getClientStats, 
    ActivityType,
    CLIENT_OPTIONS 
} from './Client';
export type { ClientStats } from './Client';

// Shutdown
export { 
    registerShutdownHandler, 
    handleShutdown, 
    initializeShutdownHandlers,
    getIsShuttingDown
} from './shutdown';

// Error Handler
export { 
    initializeErrorHandlers,
    safeAsync,
    withErrorHandling,
    withTimeout,
    interactionErrorBoundary
} from './errorHandler';

// Sentry
export * as sentry from './sentry';
export {
    initialize as initializeSentry,
    captureException,
    captureMessage,
    setUser as setSentryUser,
    clearUser as clearSentryUser,
    addBreadcrumb,
    startTransaction,
    flush as flushSentry,
    close as closeSentry,
    isEnabled as isSentryEnabled
} from './sentry';

// Health
export * as health from './health';
export {
    registerHealthCheck,
    runHealthChecks,
    getHealthStatus,
    setStatus as setHealthStatus,
    startHealthServer,
    registerDefaultChecks
} from './health';

// Graceful Degradation
export { 
    default as gracefulDegradation,
    gracefulDegradation as gracefulDegradationInstance,
    GracefulDegradation, 
    DegradationLevel, 
    ServiceState 
} from './GracefulDegradation';

