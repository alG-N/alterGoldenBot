/**
 * Music-specific Error Classes
 * @module errors/MusicError
 */

import { AppError } from './AppError.js';

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
 * Base music error - use only for catch blocks or instanceof checks.
 * @deprecated Prefer `Result.err(ErrorCodes.XXX)` pattern for new error flows.
 */
export class MusicError extends AppError {
    /** @deprecated Use `Result.err(ErrorCodes.XXX)` instead. */
    constructor(message: string, code: MusicErrorCode = 'MUSIC_ERROR') {
        super(message, code, 400);
    }
}
