/**
 * API-specific Error Classes
 * @module errors/ApiError
 */

import { AppError, SerializedError } from './AppError';

/**
 * API error codes
 */
export type ApiErrorCode =
    | 'API_ERROR'
    | 'API_UNAVAILABLE'
    | 'API_RATE_LIMITED'
    | 'NO_RESULTS'
    | 'NSFW_CONTENT'
    | 'CONTENT_BLOCKED';

/**
 * Base API error
 */
export class ApiError extends AppError {
    public readonly service: string | null;

    constructor(message: string, code: ApiErrorCode = 'API_ERROR', service: string | null = null) {
        super(message, code, 400);
        this.service = service;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            service: this.service,
        };
    }
}

/**
 * API not available error
 */
export class ApiUnavailableError extends ApiError {
    constructor(service: string) {
        super(`${service} API is currently unavailable`, 'API_UNAVAILABLE', service);
    }
}

/**
 * API rate limit error
 */
export class ApiRateLimitError extends ApiError {
    public readonly retryAfter: number | null;

    constructor(service: string, retryAfter: number | null = null) {
        super(
            `Rate limited by ${service}${retryAfter ? `. Try again in ${retryAfter}s` : ''}`,
            'API_RATE_LIMITED',
            service
        );
        this.retryAfter = retryAfter;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            retryAfter: this.retryAfter,
        };
    }
}

/**
 * No results error
 */
export class NoResultsError extends ApiError {
    public readonly query: string;

    constructor(query: string = '', service: string | null = null) {
        super(`No results found${query ? ` for: ${query}` : ''}`, 'NO_RESULTS', service);
        this.query = query;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            query: this.query,
        };
    }
}

/**
 * NSFW content error
 */
export class NsfwContentError extends ApiError {
    constructor() {
        super('This content is NSFW and can only be viewed in age-restricted channels', 'NSFW_CONTENT');
    }
}

/**
 * Content blocked error
 */
export class ContentBlockedError extends ApiError {
    constructor(reason: string = 'Content is blocked') {
        super(reason, 'CONTENT_BLOCKED');
    }
}

// CommonJS compatibility
module.exports = {
    ApiError,
    ApiUnavailableError,
    ApiRateLimitError,
    NoResultsError,
    NsfwContentError,
    ContentBlockedError,
};
