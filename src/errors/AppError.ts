/**
 * Base Application Error
 * All custom errors extend from this class
 * @module errors/AppError
 */

/**
 * Error code type
 */
export type ErrorCode = 
    | 'UNKNOWN_ERROR'
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'RATE_LIMITED'
    | 'EXTERNAL_SERVICE_ERROR'
    | 'DATABASE_ERROR'
    | 'CONFIGURATION_ERROR'
    | 'TIMEOUT'
    | 'COOLDOWN';

/**
 * Serialized error format
 */
export interface SerializedError {
    name: string;
    message: string;
    code: string;
    statusCode: number;
    timestamp: Date;
    [key: string]: unknown;
}

/**
 * Base application error class
 */
export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly timestamp: Date;

    /**
     * @param message - Error message
     * @param code - Error code for programmatic handling
     * @param statusCode - HTTP-like status code
     * @param isOperational - Whether error is expected (vs programmer error)
     */
    constructor(
        message: string,
        code: string = 'UNKNOWN_ERROR',
        statusCode: number = 500,
        isOperational: boolean = true
    ) {
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
    toJSON(): SerializedError {
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
    static isOperationalError(error: Error): boolean {
        if (error instanceof AppError) {
            return error.isOperational;
        }
        return false;
    }
}

/**
 * Validation errors (user input issues)
 */
export class ValidationError extends AppError {
    public readonly field: string | null;

    constructor(message: string, field: string | null = null) {
        super(message, 'VALIDATION_ERROR', 400);
        this.field = field;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            field: this.field,
        };
    }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
    public readonly resource: string;

    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 'NOT_FOUND', 404);
        this.resource = resource;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            resource: this.resource,
        };
    }
}

/**
 * Permission errors
 */
export class PermissionError extends AppError {
    constructor(message: string = 'You do not have permission to perform this action') {
        super(message, 'PERMISSION_DENIED', 403);
    }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
    public readonly retryAfter: number;

    constructor(retryAfter: number = 60) {
        super(`Rate limited. Try again in ${retryAfter} seconds`, 'RATE_LIMITED', 429);
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
 * External service errors (APIs, etc.)
 */
export class ExternalServiceError extends AppError {
    public readonly service: string;

    constructor(service: string, message: string = 'External service unavailable') {
        super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 503);
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
 * Database errors
 */
export class DatabaseError extends AppError {
    public readonly operation: string | null;

    constructor(message: string = 'Database operation failed', operation: string | null = null) {
        super(message, 'DATABASE_ERROR', 500);
        this.operation = operation;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            operation: this.operation,
        };
    }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AppError {
    constructor(message: string = 'Invalid configuration') {
        super(message, 'CONFIGURATION_ERROR', 500, false);
    }
}

/**
 * Timeout errors
 */
export class TimeoutError extends AppError {
    public readonly timeout: number | null;

    constructor(operation: string = 'Operation', timeout: number | null = null) {
        super(`${operation} timed out${timeout ? ` after ${timeout}ms` : ''}`, 'TIMEOUT', 408);
        this.timeout = timeout;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            timeout: this.timeout,
        };
    }
}

/**
 * Cooldown errors
 */
export class CooldownError extends AppError {
    public readonly remainingMs: number;

    constructor(remainingMs: number) {
        const seconds = Math.ceil(remainingMs / 1000);
        super(`Please wait ${seconds} seconds before using this command again`, 'COOLDOWN', 429);
        this.remainingMs = remainingMs;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            remainingMs: this.remainingMs,
        };
    }
}

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
