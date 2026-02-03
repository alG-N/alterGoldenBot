/**
 * Video-specific Error Classes
 * @module errors/VideoError
 */

import { AppError, SerializedError } from './AppError';

/**
 * Video error codes
 */
export type VideoErrorCode =
    | 'VIDEO_ERROR'
    | 'INVALID_URL'
    | 'VIDEO_NOT_FOUND'
    | 'VIDEO_TOO_LONG'
    | 'VIDEO_TOO_LARGE'
    | 'DOWNLOAD_FAILED'
    | 'UNSUPPORTED_PLATFORM';

/**
 * Base video error
 */
export class VideoError extends AppError {
    constructor(message: string, code: VideoErrorCode = 'VIDEO_ERROR') {
        super(message, code, 400);
    }
}

/**
 * Invalid URL error
 */
export class InvalidUrlError extends VideoError {
    public readonly url: string;

    constructor(url: string = '') {
        super(`Invalid or unsupported URL${url ? `: ${url}` : ''}`, 'INVALID_URL');
        this.url = url;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            url: this.url,
        };
    }
}

/**
 * Video not found error
 */
export class VideoNotFoundError extends VideoError {
    constructor() {
        super('Video not found or unavailable', 'VIDEO_NOT_FOUND');
    }
}

/**
 * Video too long error
 */
export class VideoTooLongError extends VideoError {
    public readonly duration: string;
    public readonly maxDuration: string;

    constructor(duration: string, maxDuration: string) {
        super(`Video is too long (${duration}). Maximum allowed: ${maxDuration}`, 'VIDEO_TOO_LONG');
        this.duration = duration;
        this.maxDuration = maxDuration;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            duration: this.duration,
            maxDuration: this.maxDuration,
        };
    }
}

/**
 * Video too large error
 */
export class VideoTooLargeError extends VideoError {
    public readonly size: string;
    public readonly maxSize: string;

    constructor(size: string, maxSize: string) {
        super(`Video file is too large (${size}). Maximum: ${maxSize}`, 'VIDEO_TOO_LARGE');
        this.size = size;
        this.maxSize = maxSize;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            size: this.size,
            maxSize: this.maxSize,
        };
    }
}

/**
 * Download failed error
 */
export class DownloadError extends VideoError {
    constructor(reason: string = 'Unknown error') {
        super(`Failed to download video: ${reason}`, 'DOWNLOAD_FAILED');
    }
}

/**
 * Unsupported platform error
 */
export class UnsupportedPlatformError extends VideoError {
    public readonly platform: string;

    constructor(platform: string = 'unknown') {
        super(`Platform not supported: ${platform}`, 'UNSUPPORTED_PLATFORM');
        this.platform = platform;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            platform: this.platform,
        };
    }
}

// CommonJS compatibility
module.exports = {
    VideoError,
    InvalidUrlError,
    VideoNotFoundError,
    VideoTooLongError,
    VideoTooLargeError,
    DownloadError,
    UnsupportedPlatformError,
};
