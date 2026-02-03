"use strict";
/**
 * Errors Module
 * Central exports for all error classes
 * @module errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentBlockedError = exports.NsfwContentError = exports.NoResultsError = exports.ApiRateLimitError = exports.ApiUnavailableError = exports.ApiError = exports.UnsupportedPlatformError = exports.DownloadError = exports.VideoTooLargeError = exports.VideoTooLongError = exports.VideoNotFoundError = exports.InvalidUrlError = exports.VideoError = exports.VoicePermissionError = exports.DJOnlyError = exports.TrackTooLongError = exports.QueueFullError = exports.LavalinkNotReadyError = exports.TrackNotFoundError = exports.EmptyQueueError = exports.NoPlayerError = exports.DifferentVoiceChannelError = exports.NoVoiceChannelError = exports.MusicError = exports.CooldownError = exports.TimeoutError = exports.ConfigurationError = exports.DatabaseError = exports.ExternalServiceError = exports.RateLimitError = exports.PermissionError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
// Base errors
var AppError_1 = require("./AppError");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return AppError_1.AppError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return AppError_1.ValidationError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return AppError_1.NotFoundError; } });
Object.defineProperty(exports, "PermissionError", { enumerable: true, get: function () { return AppError_1.PermissionError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return AppError_1.RateLimitError; } });
Object.defineProperty(exports, "ExternalServiceError", { enumerable: true, get: function () { return AppError_1.ExternalServiceError; } });
Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: function () { return AppError_1.DatabaseError; } });
Object.defineProperty(exports, "ConfigurationError", { enumerable: true, get: function () { return AppError_1.ConfigurationError; } });
Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function () { return AppError_1.TimeoutError; } });
Object.defineProperty(exports, "CooldownError", { enumerable: true, get: function () { return AppError_1.CooldownError; } });
// Music errors
var MusicError_1 = require("./MusicError");
Object.defineProperty(exports, "MusicError", { enumerable: true, get: function () { return MusicError_1.MusicError; } });
Object.defineProperty(exports, "NoVoiceChannelError", { enumerable: true, get: function () { return MusicError_1.NoVoiceChannelError; } });
Object.defineProperty(exports, "DifferentVoiceChannelError", { enumerable: true, get: function () { return MusicError_1.DifferentVoiceChannelError; } });
Object.defineProperty(exports, "NoPlayerError", { enumerable: true, get: function () { return MusicError_1.NoPlayerError; } });
Object.defineProperty(exports, "EmptyQueueError", { enumerable: true, get: function () { return MusicError_1.EmptyQueueError; } });
Object.defineProperty(exports, "TrackNotFoundError", { enumerable: true, get: function () { return MusicError_1.TrackNotFoundError; } });
Object.defineProperty(exports, "LavalinkNotReadyError", { enumerable: true, get: function () { return MusicError_1.LavalinkNotReadyError; } });
Object.defineProperty(exports, "QueueFullError", { enumerable: true, get: function () { return MusicError_1.QueueFullError; } });
Object.defineProperty(exports, "TrackTooLongError", { enumerable: true, get: function () { return MusicError_1.TrackTooLongError; } });
Object.defineProperty(exports, "DJOnlyError", { enumerable: true, get: function () { return MusicError_1.DJOnlyError; } });
Object.defineProperty(exports, "VoicePermissionError", { enumerable: true, get: function () { return MusicError_1.VoicePermissionError; } });
// Video errors
var VideoError_1 = require("./VideoError");
Object.defineProperty(exports, "VideoError", { enumerable: true, get: function () { return VideoError_1.VideoError; } });
Object.defineProperty(exports, "InvalidUrlError", { enumerable: true, get: function () { return VideoError_1.InvalidUrlError; } });
Object.defineProperty(exports, "VideoNotFoundError", { enumerable: true, get: function () { return VideoError_1.VideoNotFoundError; } });
Object.defineProperty(exports, "VideoTooLongError", { enumerable: true, get: function () { return VideoError_1.VideoTooLongError; } });
Object.defineProperty(exports, "VideoTooLargeError", { enumerable: true, get: function () { return VideoError_1.VideoTooLargeError; } });
Object.defineProperty(exports, "DownloadError", { enumerable: true, get: function () { return VideoError_1.DownloadError; } });
Object.defineProperty(exports, "UnsupportedPlatformError", { enumerable: true, get: function () { return VideoError_1.UnsupportedPlatformError; } });
// API errors
var ApiError_1 = require("./ApiError");
Object.defineProperty(exports, "ApiError", { enumerable: true, get: function () { return ApiError_1.ApiError; } });
Object.defineProperty(exports, "ApiUnavailableError", { enumerable: true, get: function () { return ApiError_1.ApiUnavailableError; } });
Object.defineProperty(exports, "ApiRateLimitError", { enumerable: true, get: function () { return ApiError_1.ApiRateLimitError; } });
Object.defineProperty(exports, "NoResultsError", { enumerable: true, get: function () { return ApiError_1.NoResultsError; } });
Object.defineProperty(exports, "NsfwContentError", { enumerable: true, get: function () { return ApiError_1.NsfwContentError; } });
Object.defineProperty(exports, "ContentBlockedError", { enumerable: true, get: function () { return ApiError_1.ContentBlockedError; } });
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
//# sourceMappingURL=index.js.map