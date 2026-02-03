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
    inactivityTimers = new Map();
    vcMonitorIntervals = new Map();
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
    // INACTIVITY TIMER
    /**
     * Set inactivity timer
     */
    setInactivityTimer(guildId, callback, timeout = music_js_1.INACTIVITY_TIMEOUT) {
        this.clearInactivityTimer(guildId);
        const { musicEventBus, MusicEvents } = getEventBus();
        const timer = setTimeout(() => {
            musicEventBus.emitEvent(MusicEvents.INACTIVITY_TIMEOUT, { guildId });
            if (callback)
                callback();
        }, timeout);
        this.inactivityTimers.set(guildId, timer);
    }
    /**
     * Clear inactivity timer
     */
    clearInactivityTimer(guildId) {
        const timer = this.inactivityTimers.get(guildId);
        if (timer) {
            clearTimeout(timer);
            this.inactivityTimers.delete(guildId);
        }
    }
    // VOICE CHANNEL MONITORING
    /**
     * Start voice channel monitoring
     */
    startVCMonitor(guildId, guild, onEmpty) {
        if (this.vcMonitorIntervals.has(guildId))
            return;
        const { musicEventBus, MusicEvents } = getEventBus();
        const interval = setInterval(async () => {
            const vcId = this.getVoiceChannelId(guildId);
            if (!vcId) {
                this.stopVCMonitor(guildId);
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
        this.vcMonitorIntervals.set(guildId, interval);
    }
    /**
     * Stop voice channel monitoring
     */
    stopVCMonitor(guildId) {
        const interval = this.vcMonitorIntervals.get(guildId);
        if (interval) {
            clearInterval(interval);
            this.vcMonitorIntervals.delete(guildId);
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
    cleanup(guildId) {
        this.clearInactivityTimer(guildId);
        this.stopVCMonitor(guildId);
        this.unbindPlayerEvents(guildId);
        index_js_1.queueService.destroy(guildId);
        LavalinkService_js_1.default.destroyPlayer(guildId);
    }
    /**
     * Shutdown all connections
     */
    shutdownAll() {
        // Clear all timers
        for (const [, timer] of this.inactivityTimers) {
            clearTimeout(timer);
        }
        this.inactivityTimers.clear();
        // Clear all monitors
        for (const [, interval] of this.vcMonitorIntervals) {
            clearInterval(interval);
        }
        this.vcMonitorIntervals.clear();
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
            hasInactivityTimer: this.inactivityTimers.has(guildId),
            hasVCMonitor: this.vcMonitorIntervals.has(guildId)
        };
    }
}
exports.VoiceConnectionService = VoiceConnectionService;
// Export singleton instance and class
const voiceConnectionService = new VoiceConnectionService();
exports.default = voiceConnectionService;
//# sourceMappingURL=VoiceConnectionService.js.map