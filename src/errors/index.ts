/**
 * Errors Module
 * Central exports for all error classes
 * @module errors
 */

// Base errors (AppError subclasses)
export {
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
} from './AppError.js';

export type { SerializedError, ErrorCode } from './AppError.js';

// Domain base errors (for instanceof checks only)
export { MusicError } from './MusicError.js';
export { VideoError } from './VideoError.js';
export { ApiError } from './ApiError.js';

// Type exports
export type { MusicErrorCode } from './MusicError.js';
export type { VideoErrorCode } from './VideoError.js';
export type { ApiErrorCode } from './ApiError.js';


