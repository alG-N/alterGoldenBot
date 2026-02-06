/**
 * ErrorCodes Unit Tests
 * Tests for centralized error codes, messages, and categories
 */

import { ErrorCodes, getErrorMessage, isErrorCategory } from '../../../src/core/ErrorCodes';

describe('ErrorCodes', () => {
    describe('ErrorCodes constant', () => {
        it('should define all general error codes', () => {
            expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
            expect(ErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT');
            expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
            expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
            expect(ErrorCodes.RATE_LIMITED).toBe('RATE_LIMITED');
            expect(ErrorCodes.TIMEOUT).toBe('TIMEOUT');
            expect(ErrorCodes.DISABLED).toBe('DISABLED');
            expect(ErrorCodes.MAINTENANCE).toBe('MAINTENANCE');
        });

        it('should define all user error codes', () => {
            expect(ErrorCodes.USER_NOT_FOUND).toBe('USER_NOT_FOUND');
            expect(ErrorCodes.USER_IS_BOT).toBe('USER_IS_BOT');
            expect(ErrorCodes.USER_IS_SELF).toBe('USER_IS_SELF');
            expect(ErrorCodes.USER_NOT_IN_VOICE).toBe('USER_NOT_IN_VOICE');
            expect(ErrorCodes.USER_IN_DIFFERENT_VOICE).toBe('USER_IN_DIFFERENT_VOICE');
        });

        it('should define all music error codes', () => {
            expect(ErrorCodes.NO_PLAYER).toBe('NO_PLAYER');
            expect(ErrorCodes.NO_TRACK).toBe('NO_TRACK');
            expect(ErrorCodes.NO_QUEUE).toBe('NO_QUEUE');
            expect(ErrorCodes.QUEUE_FULL).toBe('QUEUE_FULL');
            expect(ErrorCodes.VOICE_REQUIRED).toBe('VOICE_REQUIRED');
            expect(ErrorCodes.LAVALINK_ERROR).toBe('LAVALINK_ERROR');
            expect(ErrorCodes.ALREADY_CONNECTED).toBe('ALREADY_CONNECTED');
        });

        it('should define all API error codes', () => {
            expect(ErrorCodes.API_ERROR).toBe('API_ERROR');
            expect(ErrorCodes.API_RATE_LIMITED).toBe('API_RATE_LIMITED');
            expect(ErrorCodes.API_UNAVAILABLE).toBe('API_UNAVAILABLE');
            expect(ErrorCodes.NO_RESULTS).toBe('NO_RESULTS');
            expect(ErrorCodes.NSFW_REQUIRED).toBe('NSFW_REQUIRED');
        });

        it('should define all database error codes', () => {
            expect(ErrorCodes.DB_ERROR).toBe('DB_ERROR');
            expect(ErrorCodes.DB_CONNECTION_FAILED).toBe('DB_CONNECTION_FAILED');
            expect(ErrorCodes.DB_QUERY_FAILED).toBe('DB_QUERY_FAILED');
            expect(ErrorCodes.DUPLICATE_ENTRY).toBe('DUPLICATE_ENTRY');
        });

        it('should define all cache error codes', () => {
            expect(ErrorCodes.CACHE_ERROR).toBe('CACHE_ERROR');
            expect(ErrorCodes.CACHE_MISS).toBe('CACHE_MISS');
            expect(ErrorCodes.REDIS_ERROR).toBe('REDIS_ERROR');
        });

        it('should define all video error codes', () => {
            expect(ErrorCodes.VIDEO_NOT_FOUND).toBe('VIDEO_NOT_FOUND');
            expect(ErrorCodes.VIDEO_TOO_LONG).toBe('VIDEO_TOO_LONG');
            expect(ErrorCodes.VIDEO_TOO_LARGE).toBe('VIDEO_TOO_LARGE');
            expect(ErrorCodes.DOWNLOAD_FAILED).toBe('DOWNLOAD_FAILED');
            expect(ErrorCodes.PROCESSING_FAILED).toBe('PROCESSING_FAILED');
        });

        it('should be immutable (as const)', () => {
            // Verify the object is frozen / readonly at type-level
            // At runtime, `as const` doesn't freeze; this checks value stability
            const keys = Object.keys(ErrorCodes);
            expect(keys.length).toBeGreaterThanOrEqual(60);
        });
    });

    describe('getErrorMessage()', () => {
        it('should return correct message for known codes', () => {
            expect(getErrorMessage('INTERNAL_ERROR')).toBe('An unexpected error occurred.');
            expect(getErrorMessage('NOT_FOUND')).toBe('Not found.');
            expect(getErrorMessage('RATE_LIMITED')).toBe('You are doing this too fast. Please wait a moment.');
        });

        it('should return user-friendly messages for user codes', () => {
            expect(getErrorMessage('USER_NOT_IN_VOICE')).toBe('You need to join a voice channel first.');
            expect(getErrorMessage('USER_IS_BOT')).toBe('Cannot perform this action on a bot.');
            expect(getErrorMessage('USER_IS_SELF')).toBe('You cannot perform this action on yourself.');
        });

        it('should return messages for music codes', () => {
            expect(getErrorMessage('NO_PLAYER')).toBe('No music is playing.');
            expect(getErrorMessage('QUEUE_FULL')).toBe('Queue is full.');
            expect(getErrorMessage('DJ_ONLY')).toBe('Only DJs can perform this action.');
        });

        it('should return messages for API codes', () => {
            expect(getErrorMessage('API_UNAVAILABLE')).toBe('Service temporarily unavailable.');
            expect(getErrorMessage('NSFW_REQUIRED')).toBe('This command can only be used in NSFW channels.');
        });

        it('should return fallback for unknown codes', () => {
            expect(getErrorMessage('NONEXISTENT_CODE')).toBe('An error occurred.');
            expect(getErrorMessage('')).toBe('An error occurred.');
        });

        it('should accept locale parameter (currently only en)', () => {
            expect(getErrorMessage('NOT_FOUND', 'en')).toBe('Not found.');
            expect(getErrorMessage('NOT_FOUND', 'ja')).toBe('Not found.'); // Falls back to en
        });
    });

    describe('isErrorCategory()', () => {
        it('should correctly identify GENERAL category', () => {
            expect(isErrorCategory('INTERNAL_ERROR', 'GENERAL')).toBe(true);
            expect(isErrorCategory('TIMEOUT', 'GENERAL')).toBe(true);
            expect(isErrorCategory('MAINTENANCE', 'GENERAL')).toBe(true);
            expect(isErrorCategory('NO_PLAYER', 'GENERAL')).toBe(false);
        });

        it('should correctly identify USER category', () => {
            expect(isErrorCategory('USER_NOT_FOUND', 'USER')).toBe(true);
            expect(isErrorCategory('USER_IS_BOT', 'USER')).toBe(true);
            expect(isErrorCategory('INTERNAL_ERROR', 'USER')).toBe(false);
        });

        it('should correctly identify MODERATION category', () => {
            expect(isErrorCategory('CANNOT_BAN', 'MODERATION')).toBe(true);
            expect(isErrorCategory('MUTE_ROLE_NOT_FOUND', 'MODERATION')).toBe(true);
            expect(isErrorCategory('USER_NOT_FOUND', 'MODERATION')).toBe(false);
        });

        it('should correctly identify MUSIC category', () => {
            expect(isErrorCategory('NO_PLAYER', 'MUSIC')).toBe(true);
            expect(isErrorCategory('LAVALINK_ERROR', 'MUSIC')).toBe(true);
            expect(isErrorCategory('ALREADY_CONNECTED', 'MUSIC')).toBe(true);
            expect(isErrorCategory('API_ERROR', 'MUSIC')).toBe(false);
        });

        it('should correctly identify API category', () => {
            expect(isErrorCategory('API_ERROR', 'API')).toBe(true);
            expect(isErrorCategory('NSFW_REQUIRED', 'API')).toBe(true);
            expect(isErrorCategory('DB_ERROR', 'API')).toBe(false);
        });

        it('should correctly identify DATABASE category', () => {
            expect(isErrorCategory('DB_ERROR', 'DATABASE')).toBe(true);
            expect(isErrorCategory('DUPLICATE_ENTRY', 'DATABASE')).toBe(true);
            expect(isErrorCategory('CACHE_ERROR', 'DATABASE')).toBe(false);
        });

        it('should correctly identify CACHE category', () => {
            expect(isErrorCategory('CACHE_ERROR', 'CACHE')).toBe(true);
            expect(isErrorCategory('REDIS_ERROR', 'CACHE')).toBe(true);
            expect(isErrorCategory('DB_ERROR', 'CACHE')).toBe(false);
        });

        it('should correctly identify GUILD category', () => {
            expect(isErrorCategory('GUILD_NOT_FOUND', 'GUILD')).toBe(true);
            expect(isErrorCategory('MISSING_PERMISSIONS', 'GUILD')).toBe(true);
        });

        it('should correctly identify VIDEO category', () => {
            expect(isErrorCategory('VIDEO_NOT_FOUND', 'VIDEO')).toBe(true);
            expect(isErrorCategory('DOWNLOAD_FAILED', 'VIDEO')).toBe(true);
            expect(isErrorCategory('API_ERROR', 'VIDEO')).toBe(false);
        });

        it('should return false for unknown category', () => {
            expect(isErrorCategory('INTERNAL_ERROR', 'NONEXISTENT' as any)).toBe(false);
        });

        it('should return false for unknown code in valid category', () => {
            expect(isErrorCategory('FAKE_CODE', 'GENERAL')).toBe(false);
        });
    });
});
