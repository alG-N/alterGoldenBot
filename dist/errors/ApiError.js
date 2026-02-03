"use strict";
/**
 * API-specific Error Classes
 * @module errors/ApiError
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentBlockedError = exports.NsfwContentError = exports.NoResultsError = exports.ApiRateLimitError = exports.ApiUnavailableError = exports.ApiError = void 0;
const AppError_1 = require("./AppError");
/**
 * Base API error
 */
class ApiError extends AppError_1.AppError {
    service;
    constructor(message, code = 'API_ERROR', service = null) {
        super(message, code, 400);
        this.service = service;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            service: this.service,
        };
    }
}
exports.ApiError = ApiError;
/**
 * API not available error
 */
class ApiUnavailableError extends ApiError {
    constructor(service) {
        super(`${service} API is currently unavailable`, 'API_UNAVAILABLE', service);
    }
}
exports.ApiUnavailableError = ApiUnavailableError;
/**
 * API rate limit error
 */
class ApiRateLimitError extends ApiError {
    retryAfter;
    constructor(service, retryAfter = null) {
        super(`Rate limited by ${service}${retryAfter ? `. Try again in ${retryAfter}s` : ''}`, 'API_RATE_LIMITED', service);
        this.retryAfter = retryAfter;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            retryAfter: this.retryAfter,
        };
    }
}
exports.ApiRateLimitError = ApiRateLimitError;
/**
 * No results error
 */
class NoResultsError extends ApiError {
    query;
    constructor(query = '', service = null) {
        super(`No results found${query ? ` for: ${query}` : ''}`, 'NO_RESULTS', service);
        this.query = query;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            query: this.query,
        };
    }
}
exports.NoResultsError = NoResultsError;
/**
 * NSFW content error
 */
class NsfwContentError extends ApiError {
    constructor() {
        super('This content is NSFW and can only be viewed in age-restricted channels', 'NSFW_CONTENT');
    }
}
exports.NsfwContentError = NsfwContentError;
/**
 * Content blocked error
 */
class ContentBlockedError extends ApiError {
    constructor(reason = 'Content is blocked') {
        super(reason, 'CONTENT_BLOCKED');
    }
}
exports.ContentBlockedError = ContentBlockedError;
// CommonJS compatibility
module.exports = {
    ApiError,
    ApiUnavailableError,
    ApiRateLimitError,
    NoResultsError,
    NsfwContentError,
    ContentBlockedError,
};
//# sourceMappingURL=ApiError.js.map