/**
 * Music-specific Error Classes
 * @module errors/MusicError
 */

import { AppError, SerializedError } from './AppError';

/**
 * Music error codes
 */
export type MusicErrorCode =
    | 'MUSIC_ERROR'
    | 'NO_VOICE_CHANNEL'
    | 'DIFFERENT_VOICE_CHANNEL'
    | 'NO_PLAYER'
    | 'EMPTY_QUEUE'
    | 'TRACK_NOT_FOUND'
    | 'LAVALINK_NOT_READY'
    | 'QUEUE_FULL'
    | 'TRACK_TOO_LONG'
    | 'DJ_ONLY'
    | 'VOICE_PERMISSION';

/**
 * Base music error
 */
export class MusicError extends AppError {
    constructor(message: string, code: MusicErrorCode = 'MUSIC_ERROR') {
        super(message, code, 400);
    }
}

/**
 * No voice channel error
 */
export class NoVoiceChannelError extends MusicError {
    constructor() {
        super('You must be in a voice channel to use this command', 'NO_VOICE_CHANNEL');
    }
}

/**
 * Different voice channel error
 */
export class DifferentVoiceChannelError extends MusicError {
    constructor() {
        super('You must be in the same voice channel as the bot', 'DIFFERENT_VOICE_CHANNEL');
    }
}

/**
 * No player error
 */
export class NoPlayerError extends MusicError {
    constructor() {
        super('No music is currently playing', 'NO_PLAYER');
    }
}

/**
 * Empty queue error
 */
export class EmptyQueueError extends MusicError {
    constructor() {
        super('The queue is empty', 'EMPTY_QUEUE');
    }
}

/**
 * Track not found error
 */
export class TrackNotFoundError extends MusicError {
    public readonly query: string;

    constructor(query: string = '') {
        super(`No results found${query ? ` for: ${query}` : ''}`, 'TRACK_NOT_FOUND');
        this.query = query;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            query: this.query,
        };
    }
}

/**
 * Lavalink not ready error
 */
export class LavalinkNotReadyError extends MusicError {
    constructor() {
        super('Music service is not available. Please try again later.', 'LAVALINK_NOT_READY');
    }
}

/**
 * Queue full error
 */
export class QueueFullError extends MusicError {
    public readonly maxSize: number;

    constructor(maxSize: number) {
        super(`Queue is full (max ${maxSize} tracks)`, 'QUEUE_FULL');
        this.maxSize = maxSize;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            maxSize: this.maxSize,
        };
    }
}

/**
 * Track too long error
 */
export class TrackTooLongError extends MusicError {
    public readonly duration: string;
    public readonly maxDuration: string;

    constructor(duration: string, maxDuration: string) {
        super(`Track is too long (${duration}). Maximum allowed: ${maxDuration}`, 'TRACK_TOO_LONG');
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
 * DJ only error
 */
export class DJOnlyError extends MusicError {
    constructor() {
        super('This action is restricted to DJs only', 'DJ_ONLY');
    }
}

/**
 * Voice permission error
 */
export class VoicePermissionError extends MusicError {
    public readonly permission: string;

    constructor(permission: string = 'connect') {
        super(`Missing permission to ${permission} to the voice channel`, 'VOICE_PERMISSION');
        this.permission = permission;
    }

    override toJSON(): SerializedError {
        return {
            ...super.toJSON(),
            permission: this.permission,
        };
    }
}

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
