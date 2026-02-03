/**
 * Errors Module
 * Central exports for all error classes
 * @module errors
 */

// Base errors
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

// Music errors
export {
    MusicError,
    NoVoiceChannelError,
    DifferentVoiceChannelError,
    NoPlayerError,
    EmptyQueueError,
    TrackNotFoundError,
    LavalinkNotReadyError,
    QueueFullError,
    TrackTooLongError,
    DJOnlyError,
    VoicePermissionError,
} from './MusicError';

export type { MusicErrorCode } from './MusicError';

// Video errors
export {
    VideoError,
    InvalidUrlError,
    VideoNotFoundError,
    VideoTooLongError,
    VideoTooLargeError,
    DownloadError,
    UnsupportedPlatformError,
} from './VideoError';

export type { VideoErrorCode } from './VideoError';

// API errors
export {
    ApiError,
    ApiUnavailableError,
    ApiRateLimitError,
    NoResultsError,
    NsfwContentError,
    ContentBlockedError,
} from './ApiError';

export type { ApiErrorCode } from './ApiError';

// CommonJS compatibility - import from .ts files
const AppErrorModule = require('./AppError');
const MusicErrorModule = require('./MusicError');
const VideoErrorModule = require('./VideoError');
const ApiErrorModule = require('./ApiError');

module.exports = {
    // Base
    ...AppErrorModule,
    
    // Music
    ...MusicErrorModule,
    
    // Video
    ...VideoErrorModule,
    
    // API
    ...ApiErrorModule,
};
