"use strict";
/**
 * Music Cache Facade
 * Provides backward-compatible interface to split cache modules
 *
 * NEW STRUCTURE:
 * - QueueCache: Guild queue management
 * - UserMusicCache: User preferences, favorites, history
 * - VoteCache: Skip/priority voting
 * - GuildMusicCache: Guild settings, recently played, DJ lock
 *
 * @module modules/music/repository/MusicCacheFacade
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.musicCacheFacade = void 0;
const QueueCache_js_1 = __importDefault(require("./QueueCache.js"));
const UserMusicCache_js_1 = __importDefault(require("./UserMusicCache.js"));
const VoteCache_js_1 = __importDefault(require("./VoteCache.js"));
const GuildMusicCache_js_1 = __importDefault(require("./GuildMusicCache.js"));
const Logger_js_1 = __importDefault(require("../../core/Logger.js"));
// MusicCacheFacade Class
/**
 * Facade for backward compatibility
 * Delegates to specialized caches
 */
class MusicCacheFacade {
    // Expose sub-caches for direct access when needed
    queueCache = QueueCache_js_1.default;
    userMusicCache = UserMusicCache_js_1.default;
    voteCache = VoteCache_js_1.default;
    guildMusicCache = GuildMusicCache_js_1.default;
    // Global cleanup interval
    _cleanupInterval;
    constructor() {
        this._cleanupInterval = setInterval(() => this._runGlobalCleanup(), 10 * 60 * 1000);
    }
    getOrCreateQueue(guildId) {
        return QueueCache_js_1.default.getOrCreate(guildId);
    }
    getQueue(guildId) {
        return QueueCache_js_1.default.get(guildId);
    }
    updateQueue(guildId, updates) {
        return QueueCache_js_1.default.update(guildId, updates);
    }
    deleteQueue(guildId) {
        VoteCache_js_1.default.cleanupGuild(guildId);
        return QueueCache_js_1.default.delete(guildId);
    }
    hasQueue(guildId) {
        return QueueCache_js_1.default.has(guildId);
    }
    addTrack(guildId, track) {
        const result = QueueCache_js_1.default.addTrack(guildId, track);
        return result.position;
    }
    addTrackToFront(guildId, track) {
        const result = QueueCache_js_1.default.addTrackToFront(guildId, track);
        return result.success ? 1 : 0;
    }
    addTracks(guildId, tracks) {
        const result = QueueCache_js_1.default.addTracks(guildId, tracks);
        return result.totalLength;
    }
    removeTrack(guildId, index) {
        return QueueCache_js_1.default.removeTrack(guildId, index);
    }
    clearTracks(guildId) {
        QueueCache_js_1.default.clearTracks(guildId);
    }
    getNextTrack(guildId) {
        return QueueCache_js_1.default.getNextTrack(guildId);
    }
    shuffleQueue(guildId) {
        QueueCache_js_1.default.shuffle(guildId);
    }
    unshuffleQueue(guildId) {
        QueueCache_js_1.default.unshuffle(guildId);
    }
    setCurrentTrack(guildId, track) {
        QueueCache_js_1.default.setCurrentTrack(guildId, track);
        if (track) {
            GuildMusicCache_js_1.default.addToRecentlyPlayed(guildId, track);
        }
    }
    getCurrentTrack(guildId) {
        return QueueCache_js_1.default.getCurrentTrack(guildId);
    }
    togglePause(guildId) {
        return QueueCache_js_1.default.togglePause(guildId);
    }
    setLoopMode(guildId, mode) {
        QueueCache_js_1.default.setLoopMode(guildId, mode);
    }
    cycleLoopMode(guildId) {
        return QueueCache_js_1.default.cycleLoopMode(guildId);
    }
    getLoopCount(guildId) {
        const queue = QueueCache_js_1.default.get(guildId);
        return queue?.loopCount || 0;
    }
    incrementLoopCount(guildId) {
        const queue = QueueCache_js_1.default.get(guildId);
        if (!queue)
            return 0;
        queue.loopCount = (queue.loopCount || 0) + 1;
        return queue.loopCount;
    }
    resetLoopCount(guildId) {
        const queue = QueueCache_js_1.default.get(guildId);
        if (queue)
            queue.loopCount = 0;
    }
    setVolume(guildId, volume) {
        return QueueCache_js_1.default.setVolume(guildId, volume);
    }
    setNowPlayingMessage(guildId, message) {
        QueueCache_js_1.default.setNowPlayingMessage(guildId, message);
    }
    getNowPlayingMessage(guildId) {
        return QueueCache_js_1.default.getNowPlayingMessage(guildId);
    }
    async clearNowPlayingMessage(guildId) {
        await QueueCache_js_1.default.clearNowPlayingMessage(guildId);
    }
    startSkipVote(guildId, userId, listenerCount) {
        return VoteCache_js_1.default.startSkipVote(guildId, userId, listenerCount);
    }
    addSkipVote(guildId, userId) {
        return VoteCache_js_1.default.addSkipVote(guildId, userId);
    }
    endSkipVote(guildId) {
        return VoteCache_js_1.default.endSkipVote(guildId);
    }
    getRequiredVotes(listenerCount) {
        return VoteCache_js_1.default.getRequiredVotes(listenerCount);
    }
    hasEnoughSkipVotes(guildId) {
        return VoteCache_js_1.default.hasEnoughSkipVotes(guildId);
    }
    getVoteSkipStatus(guildId, listenerCount = 0) {
        return VoteCache_js_1.default.getVoteSkipStatus(guildId, listenerCount);
    }
    getDefaultPreferences() {
        return UserMusicCache_js_1.default.getDefaultPreferences();
    }
    async getPreferences(userId) {
        return UserMusicCache_js_1.default.getPreferences(userId);
    }
    async setPreferences(userId, preferences) {
        return UserMusicCache_js_1.default.setPreferences(userId, preferences);
    }
    async resetPreferences(userId) {
        return UserMusicCache_js_1.default.resetPreferences(userId);
    }
    async getFavorites(userId) {
        return UserMusicCache_js_1.default.getFavorites(userId);
    }
    async addFavorite(userId, track) {
        return UserMusicCache_js_1.default.addFavorite(userId, track);
    }
    async removeFavorite(userId, trackUrl) {
        return UserMusicCache_js_1.default.removeFavorite(userId, trackUrl);
    }
    async isFavorited(userId, trackUrl) {
        return UserMusicCache_js_1.default.isFavorited(userId, trackUrl);
    }
    async addToHistory(userId, track) {
        return UserMusicCache_js_1.default.addToHistory(userId, track);
    }
    async getHistory(userId, limit = 20) {
        return UserMusicCache_js_1.default.getHistory(userId, limit);
    }
    async clearHistory(userId) {
        await UserMusicCache_js_1.default.clearHistory(userId);
    }
    addToRecentlyPlayed(guildId, track) {
        return GuildMusicCache_js_1.default.addToRecentlyPlayed(guildId, track);
    }
    getRecentlyPlayed(guildId, limit = 10) {
        return GuildMusicCache_js_1.default.getRecentlyPlayed(guildId, limit);
    }
    setDJLock(guildId, enabled, djUserId = null) {
        GuildMusicCache_js_1.default.setDJLock(guildId, enabled, djUserId);
    }
    getDJLock(guildId) {
        return GuildMusicCache_js_1.default.getDJLock(guildId);
    }
    isDJ(guildId, userId) {
        return GuildMusicCache_js_1.default.isDJ(guildId, userId);
    }
    cachePlaylist(playlistUrl, playlistData) {
        GuildMusicCache_js_1.default.cachePlaylist(playlistUrl, playlistData);
    }
    getCachedPlaylist(playlistUrl) {
        return GuildMusicCache_js_1.default.getCachedPlaylist(playlistUrl);
    }
    getDefaultGuildSettings() {
        return GuildMusicCache_js_1.default.getDefaultSettings();
    }
    getGuildSettings(guildId) {
        return GuildMusicCache_js_1.default.getSettings(guildId);
    }
    setGuildSettings(guildId, settings) {
        return GuildMusicCache_js_1.default.setSettings(guildId, settings);
    }
    resetGuildSettings(guildId) {
        return GuildMusicCache_js_1.default.resetSettings(guildId);
    }
    cleanupGuild(guildId) {
        QueueCache_js_1.default.delete(guildId);
        VoteCache_js_1.default.cleanupGuild(guildId);
        GuildMusicCache_js_1.default.cleanupGuild(guildId);
    }
    stopCleanupInterval() {
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
        }
    }
    _runGlobalCleanup() {
        QueueCache_js_1.default.cleanup();
        UserMusicCache_js_1.default.cleanup();
        VoteCache_js_1.default.cleanup();
        GuildMusicCache_js_1.default.cleanup();
    }
    async getStats() {
        return {
            queue: QueueCache_js_1.default.getStats(),
            user: await UserMusicCache_js_1.default.getStats(),
            vote: VoteCache_js_1.default.getStats(),
            guild: GuildMusicCache_js_1.default.getStats(),
        };
    }
    /**
     * Get all active guild IDs with music queues
     */
    getAllActiveGuildIds() {
        return QueueCache_js_1.default.getActiveGuildIds();
    }
    shutdown() {
        this.stopCleanupInterval();
        QueueCache_js_1.default.shutdown();
        UserMusicCache_js_1.default.shutdown();
        VoteCache_js_1.default.shutdown();
        GuildMusicCache_js_1.default.shutdown();
        Logger_js_1.default.debug('MusicCache', 'All caches shutdown');
    }
}
// Export singleton (backward compatible)
exports.musicCacheFacade = new MusicCacheFacade();
exports.default = exports.musicCacheFacade;
//# sourceMappingURL=MusicCacheFacade.js.map