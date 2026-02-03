"use strict";
/**
 * Music-specific Error Classes
 * @module errors/MusicError
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoicePermissionError = exports.DJOnlyError = exports.TrackTooLongError = exports.QueueFullError = exports.LavalinkNotReadyError = exports.TrackNotFoundError = exports.EmptyQueueError = exports.NoPlayerError = exports.DifferentVoiceChannelError = exports.NoVoiceChannelError = exports.MusicError = void 0;
const AppError_1 = require("./AppError");
/**
 * Base music error
 */
class MusicError extends AppError_1.AppError {
    constructor(message, code = 'MUSIC_ERROR') {
        super(message, code, 400);
    }
}
exports.MusicError = MusicError;
/**
 * No voice channel error
 */
class NoVoiceChannelError extends MusicError {
    constructor() {
        super('You must be in a voice channel to use this command', 'NO_VOICE_CHANNEL');
    }
}
exports.NoVoiceChannelError = NoVoiceChannelError;
/**
 * Different voice channel error
 */
class DifferentVoiceChannelError extends MusicError {
    constructor() {
        super('You must be in the same voice channel as the bot', 'DIFFERENT_VOICE_CHANNEL');
    }
}
exports.DifferentVoiceChannelError = DifferentVoiceChannelError;
/**
 * No player error
 */
class NoPlayerError extends MusicError {
    constructor() {
        super('No music is currently playing', 'NO_PLAYER');
    }
}
exports.NoPlayerError = NoPlayerError;
/**
 * Empty queue error
 */
class EmptyQueueError extends MusicError {
    constructor() {
        super('The queue is empty', 'EMPTY_QUEUE');
    }
}
exports.EmptyQueueError = EmptyQueueError;
/**
 * Track not found error
 */
class TrackNotFoundError extends MusicError {
    query;
    constructor(query = '') {
        super(`No results found${query ? ` for: ${query}` : ''}`, 'TRACK_NOT_FOUND');
        this.query = query;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            query: this.query,
        };
    }
}
exports.TrackNotFoundError = TrackNotFoundError;
/**
 * Lavalink not ready error
 */
class LavalinkNotReadyError extends MusicError {
    constructor() {
        super('Music service is not available. Please try again later.', 'LAVALINK_NOT_READY');
    }
}
exports.LavalinkNotReadyError = LavalinkNotReadyError;
/**
 * Queue full error
 */
class QueueFullError extends MusicError {
    maxSize;
    constructor(maxSize) {
        super(`Queue is full (max ${maxSize} tracks)`, 'QUEUE_FULL');
        this.maxSize = maxSize;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            maxSize: this.maxSize,
        };
    }
}
exports.QueueFullError = QueueFullError;
/**
 * Track too long error
 */
class TrackTooLongError extends MusicError {
    duration;
    maxDuration;
    constructor(duration, maxDuration) {
        super(`Track is too long (${duration}). Maximum allowed: ${maxDuration}`, 'TRACK_TOO_LONG');
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
exports.TrackTooLongError = TrackTooLongError;
/**
 * DJ only error
 */
class DJOnlyError extends MusicError {
    constructor() {
        super('This action is restricted to DJs only', 'DJ_ONLY');
    }
}
exports.DJOnlyError = DJOnlyError;
/**
 * Voice permission error
 */
class VoicePermissionError extends MusicError {
    permission;
    constructor(permission = 'connect') {
        super(`Missing permission to ${permission} to the voice channel`, 'VOICE_PERMISSION');
        this.permission = permission;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            permission: this.permission,
        };
    }
}
exports.VoicePermissionError = VoicePermissionError;
// CommonJS compatibility
module.exports = {
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
};
//# sourceMappingURL=MusicError.js.map