"use strict";
/**
 * Base Application Error
 * All custom errors extend from this class
 * @module errors/AppError
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CooldownError = exports.TimeoutError = exports.ConfigurationError = exports.DatabaseError = exports.ExternalServiceError = exports.RateLimitError = exports.PermissionError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
/**
 * Base application error class
 */
class AppError extends Error {
    code;
    statusCode;
    isOperational;
    timestamp;
    /**
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
 * Validation errors (user input issues)
 */
class ValidationError extends AppError {
    field;
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
 * Not found errors
 */
class NotFoundError extends AppError {
    resource;
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
 * Permission errors
 */
class PermissionError extends AppError {
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 'PERMISSION_DENIED', 403);
    }
}
exports.PermissionError = PermissionError;
/**
 * Rate limit errors
 */
class RateLimitError extends AppError {
    retryAfter;
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
 * External service errors (APIs, etc.)
 */
class ExternalServiceError extends AppError {
    service;
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
 * Database errors
 */
class DatabaseError extends AppError {
    operation;
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
 * Configuration errors
 */
class ConfigurationError extends AppError {
    constructor(message = 'Invalid configuration') {
        super(message, 'CONFIGURATION_ERROR', 500, false);
    }
}
exports.ConfigurationError = ConfigurationError;
/**
 * Timeout errors
 */
class TimeoutError extends AppError {
    timeout;
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
 * Cooldown errors
 */
class CooldownError extends AppError {
    remainingMs;
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
// CommonJS compatibility export
module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    PermissionError,
    RateLimitError,
    ExternalServiceError,
    DatabaseError,
    ConfigurationError,
    TimeoutError,
    CooldownError,
};
module.exports.AppError = AppError;
module.exports.ValidationError = ValidationError;
module.exports.NotFoundError = NotFoundError;
module.exports.PermissionError = PermissionError;
module.exports.RateLimitError = RateLimitError;
module.exports.ExternalServiceError = ExternalServiceError;
module.exports.DatabaseError = DatabaseError;
module.exports.ConfigurationError = ConfigurationError;
module.exports.TimeoutError = TimeoutError;
module.exports.CooldownError = CooldownError;
//# sourceMappingURL=AppError.js.map