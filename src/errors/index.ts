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
} from './AppError';

export type { SerializedError, ErrorCode } from './AppError';

// Domain base errors (for instanceof checks only)
export { MusicError } from './MusicError';
export { VideoError } from './VideoError';
export { ApiError } from './ApiError';

// Type exports
export type { MusicErrorCode } from './MusicError';
export type { VideoErrorCode } from './VideoError';
export type { ApiErrorCode } from './ApiError';


