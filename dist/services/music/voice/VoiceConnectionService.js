"use strict";
/**
 * Voice Connection Service
 * Handles voice channel connection and monitoring
 * Extracted from MusicService for single responsibility
 * @module services/music/voice/VoiceConnectionService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceConnectionService = void 0;
const LavalinkService_js_1 = __importDefault(require("../LavalinkService.js"));
const index_js_1 = require("../queue/index.js");
const Result_js_1 = require("../../../core/Result.js");
const ErrorCodes_js_1 = require("../../../core/ErrorCodes.js");
const music_js_1 = require("../../../config/features/music.js");
const CacheService_js_1 = __importDefault(require("../../../cache/CacheService.js"));
// Lazy-load to avoid circular dependency
let musicEventBus = null;
let MusicEvents = null;
const getEventBus = () => {
    if (!musicEventBus) {
        // Dynamic import for lazy loading
        const events = require('../events/index.js');
        musicEventBus = events.musicEventBus;
        MusicEvents = events.MusicEvents;
    }
    return { musicEventBus: musicEventBus, MusicEvents: MusicEvents };
};
// VOICE CONNECTION SERVICE CLASS
class VoiceConnectionService {
    boundGuilds = new Set();
    // Local timers for callback execution (Redis stores deadlines, local timers execute)
    localInactivityTimers = new Map();
    localVCMonitorIntervals = new Map();
    // Global inactivity checker interval
    inactivityCheckerInterval = null;
    constructor() {
        // Start global inactivity checker (checks Redis deadlines every 10 seconds)
        this._startInactivityChecker();
    }
    /**
     * Start global inactivity checker
     * Polls Redis for expired inactivity deadlines
     */
    _startInactivityChecker() {
        if (this.inactivityCheckerInterval)
            return;
        this.inactivityCheckerInterval = setInterval(async () => {
            try {
                const expiredGuildIds = await CacheService_js_1.default.checkInactivityDeadlines();
                const { musicEventBus, MusicEvents } = getEventBus();
                for (const guildId of expiredGuildIds) {
                    console.log(`[VoiceConnectionService] Inactivity timeout for guild ${guildId}`);
                    musicEventBus.emitEvent(MusicEvents.INACTIVITY_TIMEOUT, { guildId });
                    // Clear local timer if exists
                    const localTimer = this.localInactivityTimers.get(guildId);
                    if (localTimer) {
                        clearTimeout(localTimer);
                        this.localInactivityTimers.delete(guildId);
                    }
                }
            }
            catch (error) {
                console.error('[VoiceConnectionService] Inactivity checker error:', error.message);
            }
        }, 10000); // Check every 10 seconds
    }
    /**
     * Connect to voice channel
     */
    async connect(interaction) {
        try {
            const guildId = interaction.guild.id;
            const voiceChannel = interaction.member.voice?.channel;
            if (!voiceChannel) {
                return Result_js_1.Result.err(ErrorCodes_js_1.ErrorCodes.VOICE_REQUIRED, 'You must be in a voice channel.');
            }
            let player = LavalinkService_js_1.default.getPlayer(guildId);
            if (!player) {
                player = await LavalinkService_js_1.default.createPlayer(guildId, voiceChannel.id, interaction.channel.id);
            }
            // Update queue with channel info
            const queue = index_js_1.queueService.getOrCreate(guildId);
            queue.voiceChannelId = voiceChannel.id;
            queue.textChannelId = interaction.channel.id;
            queue.textChannel = interaction.channel;
            // Emit event
            const { musicEventBus, MusicEvents } = getEventBus();
            musicEventBus.emitEvent(MusicEvents.VOICE_CONNECT, {
                guildId,
                voiceChannelId: voiceChannel.id,
                textChannelId: interaction.channel.id
            });
            return Result_js_1.Result.ok({
                player,
                voiceChannelId: voiceChannel.id,
                textChannelId: interaction.channel.id
            });
        }
        catch (error) {
            console.error('[VoiceConnectionService] Connect error:', error);
            return Result_js_1.Result.fromError(error, ErrorCodes_js_1.ErrorCodes.LAVALINK_ERROR);
        }
    }
    /**
     * Disconnect from voice channel
     */
    disconnect(guildId) {
        try {
            this.unbindPlayerEvents(guildId);
            this.clearInactivityTimer(guildId);
            this.stopVCMonitor(guildId);
            LavalinkService_js_1.default.destroyPlayer(guildId);
            // Emit event
            const { musicEventBus, MusicEvents } = getEventBus();
            musicEventBus.emitEvent(MusicEvents.VOICE_DISCONNECT, {
                guildId,
                reason: 'manual'
            });
            return Result_js_1.Result.ok({ disconnected: true });
        }
        catch (error) {
            console.error('[VoiceConnectionService] Disconnect error:', error);
            return Result_js_1.Result.fromError(error);
        }
    }
    /**
     * Check if connected to voice
     */
    isConnected(guildId) {
        return !!LavalinkService_js_1.default.getPlayer(guildId);
    }
    /**
     * Get voice channel ID
     */
    getVoiceChannelId(guildId) {
        const player = LavalinkService_js_1.default.getPlayer(guildId);
        return player?.connection?.channelId || null;
    }
    /**
     * Get text channel from queue
     */
    getTextChannel(guildId) {
        const queue = index_js_1.queueService.get(guildId);
        return queue?.textChannel || null;
    }
    // PLAYER EVENTS (Event Bus Integration)
    /**
     * Bind player events using Event Bus
     */
    bindPlayerEvents(guildId, handlers = {}) {
        if (this.boundGuilds.has(guildId))
            return;
        const player = LavalinkService_js_1.default.getPlayer(guildId);
        if (!player)
            return;
        this.boundGuilds.add(guildId);
        const queue = index_js_1.queueService.get(guildId);
        if (queue) {
            queue.eventsBound = true;
        }
        const { musicEventBus, MusicEvents } = getEventBus();
        // Track start
        player.on('start', (data) => {
            musicEventBus.emitTrackStart(guildId, index_js_1.queueService.getCurrentTrack(guildId), data);
            if (handlers.onStart)
                handlers.onStart(data);
        });
        // Track end
        player.on('end', ((data) => {
            musicEventBus.emitTrackEnd(guildId, index_js_1.queueService.getCurrentTrack(guildId), data?.reason);
            if (handlers.onEnd)
                handlers.onEnd(data);
        }));
        // Track exception
        player.on('exception', ((data) => {
            musicEventBus.emitTrackError(guildId, index_js_1.queueService.getCurrentTrack(guildId), data?.message || 'Unknown error');
            if (handlers.onException)
                handlers.onException(data);
        }));
        // Track stuck
        player.on('stuck', ((data) => {
            musicEventBus.emitEvent(MusicEvents.TRACK_STUCK, {
                guildId,
                track: index_js_1.queueService.getCurrentTrack(guildId),
                threshold: data?.threshold
            });
            if (handlers.onStuck)
                handlers.onStuck(data);
        }));
        // Connection closed
        player.on('closed', ((data) => {
            musicEventBus.emitEvent(MusicEvents.VOICE_CLOSED, {
                guildId,
                code: data?.code,
                reason: data?.reason
            });
            if (handlers.onClosed)
                handlers.onClosed(data);
        }));
    }
    /**
     * Unbind player events
     */
    unbindPlayerEvents(guildId) {
        const player = LavalinkService_js_1.default.getPlayer(guildId);
        if (player) {
            player.removeAllListeners();
        }
        this.boundGuilds.delete(guildId);
        const queue = index_js_1.queueService.get(guildId);
        if (queue) {
            queue.eventsBound = false;
        }
    }
    /**
     * Check if events are bound
     */
    areEventsBound(guildId) {
        return this.boundGuilds.has(guildId);
    }
    // INACTIVITY TIMER (Redis-backed for shard safety)
    /**
     * Set inactivity timer
     * Now uses Redis to store deadline for shard-safety
     * Local timer is kept for immediate callback execution on this shard
     */
    async setInactivityTimer(guildId, callback, timeout = music_js_1.INACTIVITY_TIMEOUT) {
        await this.clearInactivityTimer(guildId);
        // Store deadline in Redis (shard-safe)
        await CacheService_js_1.default.setInactivityDeadline(guildId, timeout);
        // Also set local timer for immediate callback on this shard
        if (callback) {
            const timer = setTimeout(() => {
                callback();
                this.localInactivityTimers.delete(guildId);
            }, timeout);
            this.localInactivityTimers.set(guildId, timer);
        }
    }
    /**
     * Clear inactivity timer
     * Clears both Redis deadline and local timer
     */
    async clearInactivityTimer(guildId) {
        // Clear Redis deadline
        await CacheService_js_1.default.clearInactivityDeadline(guildId);
        // Clear local timer
        const timer = this.localInactivityTimers.get(guildId);
        if (timer) {
            clearTimeout(timer);
            this.localInactivityTimers.delete(guildId);
        }
    }
    // VOICE CHANNEL MONITORING (Redis-backed for shard safety)
    /**
     * Start voice channel monitoring
     * Uses Redis flag for coordination, local interval for execution
     */
    async startVCMonitor(guildId, guild, onEmpty) {
        // Check if already monitoring (either locally or another shard)
        if (this.localVCMonitorIntervals.has(guildId))
            return;
        const isActive = await CacheService_js_1.default.isVCMonitorActive(guildId);
        if (isActive)
            return;
        // Set Redis flag
        await CacheService_js_1.default.setVCMonitorActive(guildId, true);
        const { musicEventBus, MusicEvents } = getEventBus();
        const interval = setInterval(async () => {
            const vcId = this.getVoiceChannelId(guildId);
            if (!vcId) {
                await this.stopVCMonitor(guildId);
                return;
            }
            const channel = guild.channels.cache.get(vcId);
            if (!channel) {
                musicEventBus.emitEvent(MusicEvents.VOICE_EMPTY, { guildId, reason: 'channel_not_found' });
                if (onEmpty)
                    onEmpty();
                return;
            }
            // Count non-bot members
            const listeners = channel.members.filter(m => !m.user.bot).size;
            if (listeners === 0) {
                musicEventBus.emitEvent(MusicEvents.VOICE_EMPTY, { guildId, reason: 'no_listeners' });
                if (onEmpty)
                    onEmpty();
            }
        }, music_js_1.VC_CHECK_INTERVAL);
        this.localVCMonitorIntervals.set(guildId, interval);
    }
    /**
     * Stop voice channel monitoring
     */
    async stopVCMonitor(guildId) {
        // Clear Redis flag
        await CacheService_js_1.default.setVCMonitorActive(guildId, false);
        // Clear local interval
        const interval = this.localVCMonitorIntervals.get(guildId);
        if (interval) {
            clearInterval(interval);
            this.localVCMonitorIntervals.delete(guildId);
        }
    }
    // LISTENERS
    /**
     * Get listener count in voice channel
     */
    getListenerCount(guildId, guild) {
        const vcId = this.getVoiceChannelId(guildId);
        if (!vcId)
            return 0;
        const channel = guild.channels.cache.get(vcId);
        if (!channel)
            return 0;
        return channel.members.filter(m => !m.user.bot).size;
    }
    /**
     * Get listeners in voice channel
     */
    getListeners(guildId, guild) {
        const vcId = this.getVoiceChannelId(guildId);
        if (!vcId)
            return [];
        const channel = guild.channels.cache.get(vcId);
        if (!channel)
            return [];
        return Array.from(channel.members.filter(m => !m.user.bot).values());
    }
    /**
     * Check if user is in same voice channel as bot
     */
    checkUserInVoice(guildId, member) {
        const userVcId = member.voice?.channel?.id;
        if (!userVcId) {
            return Result_js_1.Result.err(ErrorCodes_js_1.ErrorCodes.VOICE_REQUIRED, 'You must be in a voice channel.');
        }
        const botVcId = this.getVoiceChannelId(guildId);
        if (botVcId && userVcId !== botVcId) {
            return Result_js_1.Result.err(ErrorCodes_js_1.ErrorCodes.DIFFERENT_VOICE, 'You must be in the same voice channel as the bot.');
        }
        return Result_js_1.Result.ok({ voiceChannelId: userVcId });
    }
    // CLEANUP
    /**
     * Full cleanup for a guild
     */
    async cleanup(guildId) {
        await this.clearInactivityTimer(guildId);
        await this.stopVCMonitor(guildId);
        this.unbindPlayerEvents(guildId);
        index_js_1.queueService.destroy(guildId);
        LavalinkService_js_1.default.destroyPlayer(guildId);
    }
    /**
     * Shutdown all connections
     */
    shutdownAll() {
        // Stop global inactivity checker
        if (this.inactivityCheckerInterval) {
            clearInterval(this.inactivityCheckerInterval);
            this.inactivityCheckerInterval = null;
        }
        // Clear all local timers
        for (const [, timer] of this.localInactivityTimers) {
            clearTimeout(timer);
        }
        this.localInactivityTimers.clear();
        // Clear all local monitors
        for (const [, interval] of this.localVCMonitorIntervals) {
            clearInterval(interval);
        }
        this.localVCMonitorIntervals.clear();
        // Clear bound guilds
        this.boundGuilds.clear();
    }
    /**
     * Get connection state
     */
    getState(guildId) {
        return {
            isConnected: this.isConnected(guildId),
            voiceChannelId: this.getVoiceChannelId(guildId),
            eventsBound: this.areEventsBound(guildId),
            hasInactivityTimer: this.localInactivityTimers.has(guildId),
            hasVCMonitor: this.localVCMonitorIntervals.has(guildId)
        };
    }
}
exports.VoiceConnectionService = VoiceConnectionService;
// Export singleton instance and class
const voiceConnectionService = new VoiceConnectionService();
exports.default = voiceConnectionService;
//# sourceMappingURL=VoiceConnectionService.js.map