"use strict";
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
exports.ServiceState = exports.DegradationLevel = exports.GracefulDegradation = exports.gracefulDegradationInstance = exports.gracefulDegradation = exports.registerDefaultChecks = exports.startHealthServer = exports.setHealthStatus = exports.getHealthStatus = exports.runHealthChecks = exports.registerHealthCheck = exports.health = exports.isSentryEnabled = exports.closeSentry = exports.flushSentry = exports.startTransaction = exports.addBreadcrumb = exports.clearSentryUser = exports.setSentryUser = exports.captureMessage = exports.captureException = exports.initializeSentry = exports.sentry = exports.interactionErrorBoundary = exports.withTimeout = exports.withErrorHandling = exports.safeAsync = exports.initializeErrorHandlers = exports.getIsShuttingDown = exports.initializeShutdownHandlers = exports.handleShutdown = exports.registerShutdownHandler = exports.CLIENT_OPTIONS = exports.ActivityType = exports.getClientStats = exports.setPresence = exports.createClient = exports.CIRCUIT_CONFIGS = exports.CircuitBreakerRegistry = exports.circuitBreakerRegistry = exports.CircuitState = exports.CircuitBreaker = exports.isErrorCategory = exports.getErrorMessage = exports.ErrorCodes = exports.Result = exports.LOG_CHANNEL_ID = exports.LOG_LEVELS = exports.Logger = exports.logger = void 0;
/**
 * Core Module Index
 * Central exports for core infrastructure
 * @module core
 */
// TYPESCRIPT MODULES
// Logger
var Logger_js_1 = require("./Logger.js");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return __importDefault(Logger_js_1).default; } });
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return Logger_js_1.Logger; } });
Object.defineProperty(exports, "LOG_LEVELS", { enumerable: true, get: function () { return Logger_js_1.LOG_LEVELS; } });
Object.defineProperty(exports, "LOG_CHANNEL_ID", { enumerable: true, get: function () { return Logger_js_1.LOG_CHANNEL_ID; } });
// Result Pattern
var Result_js_1 = require("./Result.js");
Object.defineProperty(exports, "Result", { enumerable: true, get: function () { return Result_js_1.Result; } });
// Error Codes
var ErrorCodes_js_1 = require("./ErrorCodes.js");
Object.defineProperty(exports, "ErrorCodes", { enumerable: true, get: function () { return ErrorCodes_js_1.ErrorCodes; } });
Object.defineProperty(exports, "getErrorMessage", { enumerable: true, get: function () { return ErrorCodes_js_1.getErrorMessage; } });
Object.defineProperty(exports, "isErrorCategory", { enumerable: true, get: function () { return ErrorCodes_js_1.isErrorCategory; } });
// Circuit Breaker
var CircuitBreaker_js_1 = require("./CircuitBreaker.js");
Object.defineProperty(exports, "CircuitBreaker", { enumerable: true, get: function () { return CircuitBreaker_js_1.CircuitBreaker; } });
Object.defineProperty(exports, "CircuitState", { enumerable: true, get: function () { return CircuitBreaker_js_1.CircuitState; } });
// Circuit Breaker Registry
var CircuitBreakerRegistry_js_1 = require("./CircuitBreakerRegistry.js");
Object.defineProperty(exports, "circuitBreakerRegistry", { enumerable: true, get: function () { return CircuitBreakerRegistry_js_1.circuitBreakerRegistry; } });
Object.defineProperty(exports, "CircuitBreakerRegistry", { enumerable: true, get: function () { return CircuitBreakerRegistry_js_1.CircuitBreakerRegistry; } });
Object.defineProperty(exports, "CIRCUIT_CONFIGS", { enumerable: true, get: function () { return CircuitBreakerRegistry_js_1.CIRCUIT_CONFIGS; } });
// Client
var Client_js_1 = require("./Client.js");
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return Client_js_1.createClient; } });
Object.defineProperty(exports, "setPresence", { enumerable: true, get: function () { return Client_js_1.setPresence; } });
Object.defineProperty(exports, "getClientStats", { enumerable: true, get: function () { return Client_js_1.getClientStats; } });
Object.defineProperty(exports, "ActivityType", { enumerable: true, get: function () { return Client_js_1.ActivityType; } });
Object.defineProperty(exports, "CLIENT_OPTIONS", { enumerable: true, get: function () { return Client_js_1.CLIENT_OPTIONS; } });
// Shutdown
var shutdown_js_1 = require("./shutdown.js");
Object.defineProperty(exports, "registerShutdownHandler", { enumerable: true, get: function () { return shutdown_js_1.registerShutdownHandler; } });
Object.defineProperty(exports, "handleShutdown", { enumerable: true, get: function () { return shutdown_js_1.handleShutdown; } });
Object.defineProperty(exports, "initializeShutdownHandlers", { enumerable: true, get: function () { return shutdown_js_1.initializeShutdownHandlers; } });
Object.defineProperty(exports, "getIsShuttingDown", { enumerable: true, get: function () { return shutdown_js_1.getIsShuttingDown; } });
// Error Handler
var errorHandler_js_1 = require("./errorHandler.js");
Object.defineProperty(exports, "initializeErrorHandlers", { enumerable: true, get: function () { return errorHandler_js_1.initializeErrorHandlers; } });
Object.defineProperty(exports, "safeAsync", { enumerable: true, get: function () { return errorHandler_js_1.safeAsync; } });
Object.defineProperty(exports, "withErrorHandling", { enumerable: true, get: function () { return errorHandler_js_1.withErrorHandling; } });
Object.defineProperty(exports, "withTimeout", { enumerable: true, get: function () { return errorHandler_js_1.withTimeout; } });
Object.defineProperty(exports, "interactionErrorBoundary", { enumerable: true, get: function () { return errorHandler_js_1.interactionErrorBoundary; } });
// Sentry
exports.sentry = __importStar(require("./sentry.js"));
var sentry_js_1 = require("./sentry.js");
Object.defineProperty(exports, "initializeSentry", { enumerable: true, get: function () { return sentry_js_1.initialize; } });
Object.defineProperty(exports, "captureException", { enumerable: true, get: function () { return sentry_js_1.captureException; } });
Object.defineProperty(exports, "captureMessage", { enumerable: true, get: function () { return sentry_js_1.captureMessage; } });
Object.defineProperty(exports, "setSentryUser", { enumerable: true, get: function () { return sentry_js_1.setUser; } });
Object.defineProperty(exports, "clearSentryUser", { enumerable: true, get: function () { return sentry_js_1.clearUser; } });
Object.defineProperty(exports, "addBreadcrumb", { enumerable: true, get: function () { return sentry_js_1.addBreadcrumb; } });
Object.defineProperty(exports, "startTransaction", { enumerable: true, get: function () { return sentry_js_1.startTransaction; } });
Object.defineProperty(exports, "flushSentry", { enumerable: true, get: function () { return sentry_js_1.flush; } });
Object.defineProperty(exports, "closeSentry", { enumerable: true, get: function () { return sentry_js_1.close; } });
Object.defineProperty(exports, "isSentryEnabled", { enumerable: true, get: function () { return sentry_js_1.isEnabled; } });
// Health
exports.health = __importStar(require("./health.js"));
var health_js_1 = require("./health.js");
Object.defineProperty(exports, "registerHealthCheck", { enumerable: true, get: function () { return health_js_1.registerHealthCheck; } });
Object.defineProperty(exports, "runHealthChecks", { enumerable: true, get: function () { return health_js_1.runHealthChecks; } });
Object.defineProperty(exports, "getHealthStatus", { enumerable: true, get: function () { return health_js_1.getHealthStatus; } });
Object.defineProperty(exports, "setHealthStatus", { enumerable: true, get: function () { return health_js_1.setStatus; } });
Object.defineProperty(exports, "startHealthServer", { enumerable: true, get: function () { return health_js_1.startHealthServer; } });
Object.defineProperty(exports, "registerDefaultChecks", { enumerable: true, get: function () { return health_js_1.registerDefaultChecks; } });
// Graceful Degradation
var GracefulDegradation_js_1 = require("./GracefulDegradation.js");
Object.defineProperty(exports, "gracefulDegradation", { enumerable: true, get: function () { return __importDefault(GracefulDegradation_js_1).default; } });
Object.defineProperty(exports, "gracefulDegradationInstance", { enumerable: true, get: function () { return GracefulDegradation_js_1.gracefulDegradation; } });
Object.defineProperty(exports, "GracefulDegradation", { enumerable: true, get: function () { return GracefulDegradation_js_1.GracefulDegradation; } });
Object.defineProperty(exports, "DegradationLevel", { enumerable: true, get: function () { return GracefulDegradation_js_1.DegradationLevel; } });
Object.defineProperty(exports, "ServiceState", { enumerable: true, get: function () { return GracefulDegradation_js_1.ServiceState; } });
//# sourceMappingURL=index.js.map