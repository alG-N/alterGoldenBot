"use strict";
/**
 * Video-specific Error Classes
 * @module errors/VideoError
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedPlatformError = exports.DownloadError = exports.VideoTooLargeError = exports.VideoTooLongError = exports.VideoNotFoundError = exports.InvalidUrlError = exports.VideoError = void 0;
const AppError_1 = require("./AppError");
/**
 * Base video error
 */
class VideoError extends AppError_1.AppError {
    constructor(message, code = 'VIDEO_ERROR') {
        super(message, code, 400);
    }
}
exports.VideoError = VideoError;
/**
 * Invalid URL error
 */
class InvalidUrlError extends VideoError {
    url;
    constructor(url = '') {
        super(`Invalid or unsupported URL${url ? `: ${url}` : ''}`, 'INVALID_URL');
        this.url = url;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            url: this.url,
        };
    }
}
exports.InvalidUrlError = InvalidUrlError;
/**
 * Video not found error
 */
class VideoNotFoundError extends VideoError {
    constructor() {
        super('Video not found or unavailable', 'VIDEO_NOT_FOUND');
    }
}
exports.VideoNotFoundError = VideoNotFoundError;
/**
 * Video too long error
 */
class VideoTooLongError extends VideoError {
    duration;
    maxDuration;
    constructor(duration, maxDuration) {
        super(`Video is too long (${duration}). Maximum allowed: ${maxDuration}`, 'VIDEO_TOO_LONG');
        this.duration = duration;
        this.maxDuration = maxDuration;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            duration: this.duration,
            maxDuration: this.maxDuration,
        };
    }
}
exports.VideoTooLongError = VideoTooLongError;
/**
 * Video too large error
 */
class VideoTooLargeError extends VideoError {
    size;
    maxSize;
    constructor(size, maxSize) {
        super(`Video file is too large (${size}). Maximum: ${maxSize}`, 'VIDEO_TOO_LARGE');
        this.size = size;
        this.maxSize = maxSize;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            size: this.size,
            maxSize: this.maxSize,
        };
    }
}
exports.VideoTooLargeError = VideoTooLargeError;
/**
 * Download failed error
 */
class DownloadError extends VideoError {
    constructor(reason = 'Unknown error') {
        super(`Failed to download video: ${reason}`, 'DOWNLOAD_FAILED');
    }
}
exports.DownloadError = DownloadError;
/**
 * Unsupported platform error
 */
class UnsupportedPlatformError extends VideoError {
    platform;
    constructor(platform = 'unknown') {
        super(`Platform not supported: ${platform}`, 'UNSUPPORTED_PLATFORM');
        this.platform = platform;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            platform: this.platform,
        };
    }
}
exports.UnsupportedPlatformError = UnsupportedPlatformError;
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
//# sourceMappingURL=VideoError.js.map