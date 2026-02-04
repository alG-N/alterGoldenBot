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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = exports.withTimeoutAndRetry = exports.withTimeout = exports.withRetry = exports.isRetryableError = exports.apiSleep = exports.DEFAULT_CONFIG = exports.cooldown = exports.clearCooldown = exports.checkCooldown = exports.globalCooldownManager = exports.CooldownManager = exports.httpClient = exports.getClient = exports.clients = exports.USER_AGENTS = exports.HttpClient = exports.pagination = exports.globalPaginationState = exports.PaginationState = exports.getNewPage = exports.parsePaginationButton = exports.disablePaginationButtons = exports.createSimplePagination = exports.createPaginationButtons = exports.embed = exports.createProgressBar = exports.formatFieldValue = exports.stripHtml = exports.formatNumber = exports.truncateText = exports.createLoadingEmbed = exports.createInfoEmbed = exports.createWarningEmbed = exports.createSuccessEmbed = exports.createErrorEmbed = exports.EMBED_COLORS = exports.time = exports.endOfDay = exports.startOfDay = exports.isToday = exports.unixTimestamp = exports.sleep = exports.discordTimestamp = exports.parseTimeString = exports.parseDuration = exports.formatCountdown = exports.formatTimeAgo = exports.formatMusicDuration = exports.formatDuration = void 0;
exports.getDefault = exports.apiUtils = void 0;
exports.safeFireAndForget = safeFireAndForget;
exports.silentFireAndForget = silentFireAndForget;
/**
 * Common Utilities Index
 * Re-exports all common utilities
 * @module utils/common
 */
// TIME UTILITIES
var time_js_1 = require("./time.js");
Object.defineProperty(exports, "formatDuration", { enumerable: true, get: function () { return time_js_1.formatDuration; } });
Object.defineProperty(exports, "formatMusicDuration", { enumerable: true, get: function () { return time_js_1.formatMusicDuration; } });
Object.defineProperty(exports, "formatTimeAgo", { enumerable: true, get: function () { return time_js_1.formatTimeAgo; } });
Object.defineProperty(exports, "formatCountdown", { enumerable: true, get: function () { return time_js_1.formatCountdown; } });
Object.defineProperty(exports, "parseDuration", { enumerable: true, get: function () { return time_js_1.parseDuration; } });
Object.defineProperty(exports, "parseTimeString", { enumerable: true, get: function () { return time_js_1.parseTimeString; } });
Object.defineProperty(exports, "discordTimestamp", { enumerable: true, get: function () { return time_js_1.discordTimestamp; } });
Object.defineProperty(exports, "sleep", { enumerable: true, get: function () { return time_js_1.sleep; } });
Object.defineProperty(exports, "unixTimestamp", { enumerable: true, get: function () { return time_js_1.unixTimestamp; } });
Object.defineProperty(exports, "isToday", { enumerable: true, get: function () { return time_js_1.isToday; } });
Object.defineProperty(exports, "startOfDay", { enumerable: true, get: function () { return time_js_1.startOfDay; } });
Object.defineProperty(exports, "endOfDay", { enumerable: true, get: function () { return time_js_1.endOfDay; } });
const time = __importStar(require("./time.js"));
exports.time = time;
// EMBED UTILITIES
var embed_js_1 = require("./embed.js");
Object.defineProperty(exports, "EMBED_COLORS", { enumerable: true, get: function () { return embed_js_1.EMBED_COLORS; } });
Object.defineProperty(exports, "createErrorEmbed", { enumerable: true, get: function () { return embed_js_1.createErrorEmbed; } });
Object.defineProperty(exports, "createSuccessEmbed", { enumerable: true, get: function () { return embed_js_1.createSuccessEmbed; } });
Object.defineProperty(exports, "createWarningEmbed", { enumerable: true, get: function () { return embed_js_1.createWarningEmbed; } });
Object.defineProperty(exports, "createInfoEmbed", { enumerable: true, get: function () { return embed_js_1.createInfoEmbed; } });
Object.defineProperty(exports, "createLoadingEmbed", { enumerable: true, get: function () { return embed_js_1.createLoadingEmbed; } });
Object.defineProperty(exports, "truncateText", { enumerable: true, get: function () { return embed_js_1.truncateText; } });
Object.defineProperty(exports, "formatNumber", { enumerable: true, get: function () { return embed_js_1.formatNumber; } });
Object.defineProperty(exports, "stripHtml", { enumerable: true, get: function () { return embed_js_1.stripHtml; } });
Object.defineProperty(exports, "formatFieldValue", { enumerable: true, get: function () { return embed_js_1.formatFieldValue; } });
Object.defineProperty(exports, "createProgressBar", { enumerable: true, get: function () { return embed_js_1.createProgressBar; } });
const embed = __importStar(require("./embed.js"));
exports.embed = embed;
// PAGINATION UTILITIES
var pagination_js_1 = require("./pagination.js");
Object.defineProperty(exports, "createPaginationButtons", { enumerable: true, get: function () { return pagination_js_1.createPaginationButtons; } });
Object.defineProperty(exports, "createSimplePagination", { enumerable: true, get: function () { return pagination_js_1.createSimplePagination; } });
Object.defineProperty(exports, "disablePaginationButtons", { enumerable: true, get: function () { return pagination_js_1.disablePaginationButtons; } });
Object.defineProperty(exports, "parsePaginationButton", { enumerable: true, get: function () { return pagination_js_1.parsePaginationButton; } });
Object.defineProperty(exports, "getNewPage", { enumerable: true, get: function () { return pagination_js_1.getNewPage; } });
Object.defineProperty(exports, "PaginationState", { enumerable: true, get: function () { return pagination_js_1.PaginationState; } });
Object.defineProperty(exports, "globalPaginationState", { enumerable: true, get: function () { return pagination_js_1.globalPaginationState; } });
const pagination = __importStar(require("./pagination.js"));
exports.pagination = pagination;
// HTTP CLIENT UTILITIES
var httpClient_js_1 = require("./httpClient.js");
Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () { return httpClient_js_1.HttpClient; } });
Object.defineProperty(exports, "USER_AGENTS", { enumerable: true, get: function () { return httpClient_js_1.USER_AGENTS; } });
Object.defineProperty(exports, "clients", { enumerable: true, get: function () { return httpClient_js_1.clients; } });
Object.defineProperty(exports, "getClient", { enumerable: true, get: function () { return httpClient_js_1.getClient; } });
const httpClient = __importStar(require("./httpClient.js"));
exports.httpClient = httpClient;
// COOLDOWN UTILITIES
var cooldown_js_1 = require("./cooldown.js");
Object.defineProperty(exports, "CooldownManager", { enumerable: true, get: function () { return cooldown_js_1.CooldownManager; } });
Object.defineProperty(exports, "globalCooldownManager", { enumerable: true, get: function () { return cooldown_js_1.globalCooldownManager; } });
Object.defineProperty(exports, "checkCooldown", { enumerable: true, get: function () { return cooldown_js_1.checkCooldown; } });
Object.defineProperty(exports, "clearCooldown", { enumerable: true, get: function () { return cooldown_js_1.clearCooldown; } });
const cooldown = __importStar(require("./cooldown.js"));
exports.cooldown = cooldown;
// API UTILITIES
var apiUtils_js_1 = require("./apiUtils.js");
Object.defineProperty(exports, "DEFAULT_CONFIG", { enumerable: true, get: function () { return apiUtils_js_1.DEFAULT_CONFIG; } });
Object.defineProperty(exports, "apiSleep", { enumerable: true, get: function () { return apiUtils_js_1.sleep; } });
Object.defineProperty(exports, "isRetryableError", { enumerable: true, get: function () { return apiUtils_js_1.isRetryableError; } });
Object.defineProperty(exports, "withRetry", { enumerable: true, get: function () { return apiUtils_js_1.withRetry; } });
Object.defineProperty(exports, "withTimeout", { enumerable: true, get: function () { return apiUtils_js_1.withTimeout; } });
Object.defineProperty(exports, "withTimeoutAndRetry", { enumerable: true, get: function () { return apiUtils_js_1.withTimeoutAndRetry; } });
Object.defineProperty(exports, "RateLimiter", { enumerable: true, get: function () { return apiUtils_js_1.RateLimiter; } });
const apiUtils = __importStar(require("./apiUtils.js"));
exports.apiUtils = apiUtils;
// Note: Circuit breaker functionality moved to core/CircuitBreaker.ts and core/CircuitBreakerRegistry.ts
// SAFE ASYNC UTILITIES
/**
 * Execute an async operation without awaiting, with error logging
 * Use for fire-and-forget operations that shouldn't block but should log errors
 * @param operation - Async operation to execute
 * @param context - Optional context string for error logging
 */
function safeFireAndForget(operation, context = 'background operation') {
    operation().catch((error) => {
        console.error(`[SafeFireAndForget] Error in ${context}:`, error.message);
    });
}
/**
 * Execute an async operation without awaiting, silently ignoring errors
 * Use only for truly optional operations where failure is acceptable
 * @param operation - Async operation to execute
 */
function silentFireAndForget(operation) {
    operation().catch(() => {
        // Intentionally silent
    });
}
// MODULE UTILITIES
/**
 * Helper to get default export from require()
 * Handles ESM compiled modules that wrap default export
 */
const getDefault = (mod) => mod.default || mod;
exports.getDefault = getDefault;
//# sourceMappingURL=index.js.map