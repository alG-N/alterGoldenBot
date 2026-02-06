"use strict";
/**
 * Base Application Error
 * All custom errors extend from this class
 * @module errors/AppError
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CooldownError = exports.TimeoutError = exports.ConfigurationError = exports.DatabaseError = exports.ExternalServiceError = exports.RateLimitError = exports.PermissionError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
/**
 * Base application error class.
 * Retained for `instanceof` checks in catch blocks.
 * For new error flows, prefer `Result.err(ErrorCodes.XXX)` pattern.
 */
class AppError extends Error {
    code;
    statusCode;
    isOperational;
    timestamp;
    /**
     * @deprecated Use `Result.err(ErrorCodes.XXX)` instead of throwing.
     * Retained for `instanceof` checks in catch blocks and BaseCommand validation.
     * @param message - Error message
     * @param code - Error code for programmatic handling
     * @param statusCode - HTTP-like status code
     * @param isOperational - Whether error is expected (vs programmer error)
     */
    constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date();
        Error.captureStackTrace(this, this.constructor);
    }
    /**
     * Serialize error for logging/API response
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
        };
    }
    /**
     * Check if error is operational (expected) vs programmer error
     */
    static isOperationalError(error) {
        if (error instanceof AppError) {
            return error.isOperational;
        }
        return false;
    }
}
exports.AppError = AppError;
/**
 * Validation errors (user input issues).
 * @deprecated Prefer `Result.err(ErrorCodes.VALIDATION_ERROR)`. Retained for `instanceof` checks.
 */
class ValidationError extends AppError {
    field;
    /** @deprecated Use `Result.err(ErrorCodes.VALIDATION_ERROR)` instead. */
    constructor(message, field = null) {
        super(message, 'VALIDATION_ERROR', 400);
        this.field = field;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            field: this.field,
        };
    }
}
exports.ValidationError = ValidationError;
/**
 * Not found errors.
 * @deprecated Prefer `Result.err(ErrorCodes.NOT_FOUND)`. Retained for `instanceof` checks.
 */
class NotFoundError extends AppError {
    resource;
    /** @deprecated Use `Result.err(ErrorCodes.NOT_FOUND)` instead. */
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 'NOT_FOUND', 404);
        this.resource = resource;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            resource: this.resource,
        };
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Permission errors.
 * @deprecated Prefer `Result.err(ErrorCodes.PERMISSION_DENIED)`. Retained for `instanceof` checks.
 */
class PermissionError extends AppError {
    /** @deprecated Use `Result.err(ErrorCodes.PERMISSION_DENIED)` instead. */
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 'PERMISSION_DENIED', 403);
    }
}
exports.PermissionError = PermissionError;
/**
 * Rate limit errors.
 * @deprecated Prefer `Result.err(ErrorCodes.RATE_LIMITED)`. Retained for `instanceof` checks.
 */
class RateLimitError extends AppError {
    retryAfter;
    /** @deprecated Use `Result.err(ErrorCodes.RATE_LIMITED)` instead. */
    constructor(retryAfter = 60) {
        super(`Rate limited. Try again in ${retryAfter} seconds`, 'RATE_LIMITED', 429);
        this.retryAfter = retryAfter;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            retryAfter: this.retryAfter,
        };
    }
}
exports.RateLimitError = RateLimitError;
/**
 * External service errors (APIs, etc.).
 * @deprecated Prefer `Result.err(ErrorCodes.EXTERNAL_SERVICE_ERROR)`. Retained for `instanceof` checks.
 */
class ExternalServiceError extends AppError {
    service;
    /** @deprecated Use `Result.err(ErrorCodes.EXTERNAL_SERVICE_ERROR)` instead. */
    constructor(service, message = 'External service unavailable') {
        super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 503);
        this.service = service;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            service: this.service,
        };
    }
}
exports.ExternalServiceError = ExternalServiceError;
/**
 * Database errors.
 * @deprecated Prefer `Result.err(ErrorCodes.DATABASE_ERROR)`. Retained for `instanceof` checks.
 */
class DatabaseError extends AppError {
    operation;
    /** @deprecated Use `Result.err(ErrorCodes.DATABASE_ERROR)` instead. */
    constructor(message = 'Database operation failed', operation = null) {
        super(message, 'DATABASE_ERROR', 500);
        this.operation = operation;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            operation: this.operation,
        };
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Configuration errors.
 * @deprecated Prefer `Result.err(ErrorCodes.CONFIGURATION_ERROR)`. Retained for `instanceof` checks.
 */
class ConfigurationError extends AppError {
    /** @deprecated Use `Result.err(ErrorCodes.CONFIGURATION_ERROR)` instead. */
    constructor(message = 'Invalid configuration') {
        super(message, 'CONFIGURATION_ERROR', 500, false);
    }
}
exports.ConfigurationError = ConfigurationError;
/**
 * Timeout errors.
 * @deprecated Prefer `Result.err(ErrorCodes.TIMEOUT)`. Retained for `instanceof` checks.
 */
class TimeoutError extends AppError {
    timeout;
    /** @deprecated Use `Result.err(ErrorCodes.TIMEOUT)` instead. */
    constructor(operation = 'Operation', timeout = null) {
        super(`${operation} timed out${timeout ? ` after ${timeout}ms` : ''}`, 'TIMEOUT', 408);
        this.timeout = timeout;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            timeout: this.timeout,
        };
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Cooldown errors.
 * @deprecated Prefer `Result.err(ErrorCodes.COOLDOWN)`. Retained for `instanceof` checks.
 */
class CooldownError extends AppError {
    remainingMs;
    /** @deprecated Use `Result.err(ErrorCodes.COOLDOWN)` instead. */
    constructor(remainingMs) {
        const seconds = Math.ceil(remainingMs / 1000);
        super(`Please wait ${seconds} seconds before using this command again`, 'COOLDOWN', 429);
        this.remainingMs = remainingMs;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            remainingMs: this.remainingMs,
        };
    }
}
exports.CooldownError = CooldownError;
//# sourceMappingURL=AppError.js.map