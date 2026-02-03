"use strict";
/**
 * Anime Repository
 * Database operations for anime favourites and notifications
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimeRepository = exports.animeRepository = void 0;
const postgres_1 = __importDefault(require("../../database/postgres"));
// Simple logger fallback
const logger = {
    info: (tag, msg) => console.log(`[${tag}] ${msg}`),
    warn: (tag, msg) => console.warn(`[${tag}] ${msg}`),
    error: (tag, msg) => console.error(`[${tag}] ${msg}`)
};
// AnimeRepository Class
class AnimeRepository {
    initialized;
    constructor() {
        this.initialized = false;
    }
    async _initialize() {
        if (this.initialized)
            return;
        try {
            // Create tables if not exists (for development, schema.sql handles production)
            await postgres_1.default.query(`
                CREATE TABLE IF NOT EXISTS anime_favourites (
                    user_id VARCHAR(20) NOT NULL,
                    anime_id INTEGER NOT NULL,
                    anime_title TEXT NOT NULL,
                    source VARCHAR(20) DEFAULT 'anilist',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, anime_id)
                )
            `);
            // Add source column if not exists (migration for existing tables)
            await postgres_1.default.query(`
                ALTER TABLE anime_favourites 
                ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'anilist'
            `).catch(() => { });
            await postgres_1.default.query(`
                CREATE TABLE IF NOT EXISTS anime_notifications (
                    user_id VARCHAR(20) NOT NULL,
                    anime_id INTEGER NOT NULL,
                    notify BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, anime_id)
                )
            `);
            this.initialized = true;
        }
        catch (error) {
            logger.error('AnimeRepository', `Failed to initialize: ${error.message}`);
        }
    }
    async getUserFavourites(userId) {
        await this._initialize();
        try {
            const rows = await postgres_1.default.getMany(`SELECT anime_id, anime_title, COALESCE(source, 'anilist') as source FROM anime_favourites WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
            // Map anime_title to title for compatibility
            return (rows || []).map(r => ({
                ...r,
                title: r.anime_title,
                source: r.source || 'anilist'
            }));
        }
        catch (error) {
            logger.error('AnimeRepository', `Error getting user favourites: ${error.message}`);
            return [];
        }
    }
    async isFavourited(userId, animeId) {
        await this._initialize();
        try {
            const row = await postgres_1.default.getOne(`SELECT 1 FROM anime_favourites WHERE user_id = $1 AND anime_id = $2`, [userId, animeId]);
            return !!row;
        }
        catch (error) {
            logger.error('AnimeRepository', `Error checking favourite: ${error.message}`);
            return false;
        }
    }
    async isNotifyEnabled(userId, animeId) {
        await this._initialize();
        try {
            const row = await postgres_1.default.getOne(`SELECT notify FROM anime_notifications WHERE user_id = $1 AND anime_id = $2`, [userId, animeId]);
            return row?.notify === true;
        }
        catch (error) {
            logger.error('AnimeRepository', `Error checking notify status: ${error.message}`);
            return false;
        }
    }
    async addFavourite(userId, animeId, animeTitle, source = 'anilist') {
        await this._initialize();
        try {
            const result = await postgres_1.default.query(`INSERT INTO anime_favourites (user_id, anime_id, anime_title, source) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (user_id, anime_id) DO UPDATE SET anime_title = EXCLUDED.anime_title, source = EXCLUDED.source`, [userId, animeId, animeTitle, source]);
            return (result.rowCount ?? 0) > 0;
        }
        catch (error) {
            logger.error('AnimeRepository', `Error adding favourite: ${error.message}`);
            return false;
        }
    }
    async removeFavourite(userId, animeId) {
        await this._initialize();
        try {
            await postgres_1.default.transaction(async (client) => {
                await client.query(`DELETE FROM anime_favourites WHERE user_id = $1 AND anime_id = $2`, [userId, animeId]);
                await client.query(`DELETE FROM anime_notifications WHERE user_id = $1 AND anime_id = $2`, [userId, animeId]);
            });
        }
        catch (error) {
            logger.error('AnimeRepository', `Error removing favourite: ${error.message}`);
        }
    }
    async enableNotify(userId, animeId) {
        await this._initialize();
        try {
            await postgres_1.default.query(`INSERT INTO anime_notifications (user_id, anime_id, notify) 
                 VALUES ($1, $2, true) 
                 ON CONFLICT (user_id, anime_id) 
                 DO UPDATE SET notify = true, updated_at = CURRENT_TIMESTAMP`, [userId, animeId]);
        }
        catch (error) {
            logger.error('AnimeRepository', `Error enabling notify: ${error.message}`);
        }
    }
    async disableNotify(userId, animeId) {
        await this._initialize();
        try {
            await postgres_1.default.query(`INSERT INTO anime_notifications (user_id, anime_id, notify) 
                 VALUES ($1, $2, false) 
                 ON CONFLICT (user_id, anime_id) 
                 DO UPDATE SET notify = false, updated_at = CURRENT_TIMESTAMP`, [userId, animeId]);
        }
        catch (error) {
            logger.error('AnimeRepository', `Error disabling notify: ${error.message}`);
        }
    }
    async getEnabledNotifications() {
        await this._initialize();
        try {
            const rows = await postgres_1.default.getMany(`SELECT user_id, anime_id FROM anime_notifications WHERE notify = true`);
            return rows || [];
        }
        catch (error) {
            logger.error('AnimeRepository', `Error getting enabled notifications: ${error.message}`);
            return [];
        }
    }
}
exports.AnimeRepository = AnimeRepository;
// Export singleton instance
const animeRepository = new AnimeRepository();
exports.animeRepository = animeRepository;
exports.default = animeRepository;
//# sourceMappingURL=animeRepository.js.map