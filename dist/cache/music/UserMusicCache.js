"use strict";
/**
 * User Music Cache
 * Manages user preferences, favorites, and listening history
 * Persisted to PostgreSQL, cached in CacheService (shard-safe)
 * @module modules/music/repository/UserMusicCache
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMusicCache = void 0;
const postgres_1 = __importDefault(require("../../database/postgres"));
const CacheService_js_1 = __importDefault(require("../CacheService.js"));
// UserMusicCache Class — PostgreSQL-backed, CacheService-cached
class UserMusicCache {
    CACHE_NS = 'music';
    PREFS_TTL = 600; // 10 minutes
    FAVS_TTL = 300; // 5 minutes
    HISTORY_TTL = 300; // 5 minutes
    HISTORY_MAX_SIZE = 100;
    FAVORITES_MAX_SIZE = 200;
    constructor() {
        // All state managed by PostgreSQL + CacheService — no local intervals needed
    }
    /**
     * Default preferences
     */
    getDefaultPreferences() {
        return {
            defaultVolume: 100,
            autoPlay: false,
            announceTrack: true,
            compactMode: false,
            djMode: false,
            maxTrackDuration: 600, // 10 minutes
            maxQueueSize: 100,
            preferredSource: 'youtube',
            showThumbnails: true,
            autoLeaveEmpty: true,
            voteSkipEnabled: true,
            updatedAt: Date.now()
        };
    }
    /**
     * Get user preferences (cache → DB → defaults)
     */
    async getPreferences(userId) {
        const cacheKey = `user_prefs:${userId}`;
        // Check cache first
        const cached = await CacheService_js_1.default.get(this.CACHE_NS, cacheKey);
        if (cached)
            return cached;
        // Load from DB
        try {
            const result = await postgres_1.default.query('SELECT * FROM user_music_preferences WHERE user_id = $1', [userId]);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                const prefs = {
                    defaultVolume: row.default_volume,
                    autoPlay: row.auto_play,
                    announceTrack: row.announce_track,
                    compactMode: row.compact_mode,
                    djMode: row.dj_mode,
                    maxTrackDuration: row.max_track_duration,
                    maxQueueSize: row.max_queue_size,
                    preferredSource: row.preferred_source,
                    showThumbnails: row.show_thumbnails,
                    autoLeaveEmpty: row.auto_leave_empty,
                    voteSkipEnabled: row.vote_skip_enabled,
                    updatedAt: new Date(row.updated_at).getTime(),
                    lastAccessed: Date.now()
                };
                await CacheService_js_1.default.set(this.CACHE_NS, cacheKey, prefs, this.PREFS_TTL);
                return prefs;
            }
        }
        catch (error) {
            console.error('[UserMusicCache] Failed to load preferences from DB:', error.message);
        }
        return this.getDefaultPreferences();
    }
    /**
     * Set user preferences (write-through: DB + cache)
     */
    async setPreferences(userId, preferences) {
        const current = await this.getPreferences(userId);
        const updated = {
            ...current,
            ...preferences,
            updatedAt: Date.now(),
            lastAccessed: Date.now()
        };
        try {
            await postgres_1.default.query(`INSERT INTO user_music_preferences (
                    user_id, default_volume, auto_play, announce_track, compact_mode,
                    dj_mode, max_track_duration, max_queue_size, preferred_source,
                    show_thumbnails, auto_leave_empty, vote_skip_enabled
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (user_id) DO UPDATE SET
                    default_volume = EXCLUDED.default_volume,
                    auto_play = EXCLUDED.auto_play,
                    announce_track = EXCLUDED.announce_track,
                    compact_mode = EXCLUDED.compact_mode,
                    dj_mode = EXCLUDED.dj_mode,
                    max_track_duration = EXCLUDED.max_track_duration,
                    max_queue_size = EXCLUDED.max_queue_size,
                    preferred_source = EXCLUDED.preferred_source,
                    show_thumbnails = EXCLUDED.show_thumbnails,
                    auto_leave_empty = EXCLUDED.auto_leave_empty,
                    vote_skip_enabled = EXCLUDED.vote_skip_enabled`, [
                userId, updated.defaultVolume, updated.autoPlay, updated.announceTrack,
                updated.compactMode, updated.djMode, updated.maxTrackDuration,
                updated.maxQueueSize, updated.preferredSource, updated.showThumbnails,
                updated.autoLeaveEmpty, updated.voteSkipEnabled
            ]);
        }
        catch (error) {
            console.error('[UserMusicCache] Failed to save preferences to DB:', error.message);
        }
        const cacheKey = `user_prefs:${userId}`;
        await CacheService_js_1.default.set(this.CACHE_NS, cacheKey, updated, this.PREFS_TTL);
        return updated;
    }
    /**
     * Reset user preferences
     */
    async resetPreferences(userId) {
        try {
            await postgres_1.default.query('DELETE FROM user_music_preferences WHERE user_id = $1', [userId]);
        }
        catch (error) {
            console.error('[UserMusicCache] Failed to delete preferences from DB:', error.message);
        }
        await CacheService_js_1.default.delete(this.CACHE_NS, `user_prefs:${userId}`);
        return this.getDefaultPreferences();
    }
    /**
     * Get user favorites (cache → DB)
     */
    async getFavorites(userId) {
        const cacheKey = `user_favs:${userId}`;
        const cached = await CacheService_js_1.default.get(this.CACHE_NS, cacheKey);
        if (cached)
            return cached;
        try {
            const result = await postgres_1.default.query('SELECT url, title, author, duration, thumbnail, added_at FROM user_music_favorites WHERE user_id = $1 ORDER BY added_at DESC LIMIT $2', [userId, this.FAVORITES_MAX_SIZE]);
            const tracks = result.rows.map((row) => ({
                url: row.url,
                title: row.title,
                author: row.author || undefined,
                duration: row.duration || undefined,
                thumbnail: row.thumbnail || undefined,
                addedAt: new Date(row.added_at).getTime()
            }));
            await CacheService_js_1.default.set(this.CACHE_NS, cacheKey, tracks, this.FAVS_TTL);
            return tracks;
        }
        catch (error) {
            console.error('[UserMusicCache] Failed to load favorites from DB:', error.message);
            return [];
        }
    }
    /**
     * Add to favorites (write-through: DB + invalidate cache)
     */
    async addFavorite(userId, track) {
        try {
            // Check count first
            const countResult = await postgres_1.default.query('SELECT COUNT(*) as cnt FROM user_music_favorites WHERE user_id = $1', [userId]);
            const currentCount = parseInt(countResult.rows[0].cnt, 10);
            if (currentCount >= this.FAVORITES_MAX_SIZE) {
                // Remove oldest to make room
                await postgres_1.default.query(`DELETE FROM user_music_favorites WHERE id IN (
                        SELECT id FROM user_music_favorites WHERE user_id = $1
                        ORDER BY added_at ASC LIMIT 1
                    )`, [userId]);
            }
            // Insert (UPSERT — ignore if already exists)
            const result = await postgres_1.default.query(`INSERT INTO user_music_favorites (user_id, url, title, author, duration, thumbnail)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (user_id, url) DO NOTHING
                 RETURNING id`, [userId, track.url, track.title, track.author || null, track.lengthSeconds || track.duration || null, track.thumbnail || null]);
            if (result.rows.length === 0) {
                return { success: false, message: 'Already in favorites' };
            }
            // Invalidate cache
            await CacheService_js_1.default.delete(this.CACHE_NS, `user_favs:${userId}`);
            return { success: true, count: currentCount + 1 };
        }
        catch (error) {
            console.error('[UserMusicCache] Failed to add favorite:', error.message);
            return { success: false, message: 'Database error' };
        }
    }
    /**
     * Remove from favorites
     */
    async removeFavorite(userId, trackUrl) {
        try {
            await postgres_1.default.query('DELETE FROM user_music_favorites WHERE user_id = $1 AND url = $2', [userId, trackUrl]);
        }
        catch (error) {
            console.error('[UserMusicCache] Failed to remove favorite:', error.message);
        }
        // Invalidate and return fresh list
        await CacheService_js_1.default.delete(this.CACHE_NS, `user_favs:${userId}`);
        return this.getFavorites(userId);
    }
    /**
     * Check if favorited
     */
    async isFavorited(userId, trackUrl) {
        const favorites = await this.getFavorites(userId);
        return favorites.some(f => f.url === trackUrl);
    }
    /**
     * Add to listening history (write-through: DB + invalidate cache)
     */
    async addToHistory(userId, track) {
        try {
            // Remove existing entry for same URL (move to top)
            await postgres_1.default.query('DELETE FROM user_music_history WHERE user_id = $1 AND url = $2', [userId, track.url]);
            // Insert new entry
            await postgres_1.default.query(`INSERT INTO user_music_history (user_id, url, title, author, duration, thumbnail)
                 VALUES ($1, $2, $3, $4, $5, $6)`, [userId, track.url, track.title, track.author || null, track.lengthSeconds || track.duration || null, track.thumbnail || null]);
            // Trim trigger handles size limit in DB
        }
        catch (error) {
            console.error('[UserMusicCache] Failed to add to history:', error.message);
        }
        // Invalidate cache
        await CacheService_js_1.default.delete(this.CACHE_NS, `user_history:${userId}`);
        return this.getHistory(userId);
    }
    /**
     * Get listening history (cache → DB)
     */
    async getHistory(userId, limit = 20) {
        const cacheKey = `user_history:${userId}`;
        // For default limit, try cache
        if (limit <= this.HISTORY_MAX_SIZE) {
            const cached = await CacheService_js_1.default.get(this.CACHE_NS, cacheKey);
            if (cached)
                return cached.slice(0, limit);
        }
        try {
            const result = await postgres_1.default.query('SELECT url, title, author, duration, thumbnail, played_at FROM user_music_history WHERE user_id = $1 ORDER BY played_at DESC LIMIT $2', [userId, Math.min(limit, this.HISTORY_MAX_SIZE)]);
            const tracks = result.rows.map((row) => ({
                url: row.url,
                title: row.title,
                author: row.author || undefined,
                duration: row.duration || undefined,
                thumbnail: row.thumbnail || undefined,
                playedAt: new Date(row.played_at).getTime()
            }));
            // Cache full history for future reads
            await CacheService_js_1.default.set(this.CACHE_NS, cacheKey, tracks, this.HISTORY_TTL);
            return tracks.slice(0, limit);
        }
        catch (error) {
            console.error('[UserMusicCache] Failed to load history from DB:', error.message);
            return [];
        }
    }
    /**
     * Clear listening history
     */
    async clearHistory(userId) {
        try {
            await postgres_1.default.query('DELETE FROM user_music_history WHERE user_id = $1', [userId]);
        }
        catch (error) {
            console.error('[UserMusicCache] Failed to clear history:', error.message);
        }
        await CacheService_js_1.default.delete(this.CACHE_NS, `user_history:${userId}`);
    }
    /**
     * Cleanup — no-op, PostgreSQL manages data lifecycle
     */
    cleanup() {
        // No local state to clean — PostgreSQL + CacheService handle everything
    }
    /**
     * Get statistics
     */
    async getStats() {
        try {
            const [prefsResult, favsResult, histResult] = await Promise.all([
                postgres_1.default.query('SELECT COUNT(*) as cnt FROM user_music_preferences'),
                postgres_1.default.query('SELECT COUNT(DISTINCT user_id) as cnt FROM user_music_favorites'),
                postgres_1.default.query('SELECT COUNT(DISTINCT user_id) as cnt FROM user_music_history')
            ]);
            return {
                preferences: parseInt(prefsResult.rows[0].cnt, 10),
                favorites: parseInt(favsResult.rows[0].cnt, 10),
                history: parseInt(histResult.rows[0].cnt, 10),
                maxUsers: 0 // No longer limited by memory
            };
        }
        catch {
            return { preferences: 0, favorites: 0, history: 0, maxUsers: 0 };
        }
    }
    /**
     * Shutdown — no local state to clear
     */
    shutdown() {
        // No intervals or local state to clean up
    }
}
exports.userMusicCache = new UserMusicCache();
exports.default = exports.userMusicCache;
// CommonJS compatibility
module.exports = exports.userMusicCache;
module.exports.userMusicCache = exports.userMusicCache;
module.exports.UserMusicCache = UserMusicCache;
//# sourceMappingURL=UserMusicCache.js.map