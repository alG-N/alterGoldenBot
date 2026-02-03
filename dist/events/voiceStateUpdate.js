"use strict";
/**
 * Voice State Update Event - Presentation Layer
 * Handles voice channel updates for auto-disconnect
 * @module presentation/events/voiceStateUpdate
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseEvent_js_1 = require("./BaseEvent.js");
// VOICE STATE UPDATE EVENT
class VoiceStateUpdateEvent extends BaseEvent_js_1.BaseEvent {
    _disconnectTimers = new Map();
    _disconnectDelay = 30000; // 30 seconds
    constructor() {
        super({
            name: discord_js_1.Events.VoiceStateUpdate,
            once: false
        });
    }
    async execute(client, oldState, newState) {
        // Only handle when someone leaves a channel
        if (!oldState.channel)
            return;
        // Check if bot was in the old channel
        const botMember = oldState.guild.members.cache.get(client.user?.id || '');
        if (!botMember?.voice.channel)
            return;
        // Check if bot is in the same channel that was left
        if (botMember.voice.channel.id !== oldState.channel.id)
            return;
        // Check if channel is now empty (only bot left)
        await this._checkEmptyChannel(client, oldState.channel, oldState.guild.id);
    }
    /**
     * Check if voice channel is empty and schedule disconnect
     */
    async _checkEmptyChannel(client, channel, guildId) {
        // Count human members (exclude bots)
        const humanMembers = channel.members.filter(m => !m.user.bot);
        if (humanMembers.size === 0) {
            // Channel is empty, schedule disconnect
            this._scheduleDisconnect(client, guildId);
        }
        else {
            // Someone rejoined, cancel scheduled disconnect
            this._cancelDisconnect(guildId);
        }
    }
    /**
     * Schedule auto-disconnect after delay
     */
    _scheduleDisconnect(client, guildId) {
        // Cancel existing timer if any
        this._cancelDisconnect(guildId);
        const timer = setTimeout(async () => {
            await this._handleDisconnect(client, guildId);
            this._disconnectTimers.delete(guildId);
        }, this._disconnectDelay);
        this._disconnectTimers.set(guildId, timer);
    }
    /**
     * Cancel scheduled disconnect
     */
    _cancelDisconnect(guildId) {
        const timer = this._disconnectTimers.get(guildId);
        if (timer) {
            clearTimeout(timer);
            this._disconnectTimers.delete(guildId);
        }
    }
    /**
     * Handle disconnect via music service
     */
    async _handleDisconnect(client, guildId) {
        try {
            // Use MusicFacade - the refactored music service
            const getDefault = (mod) => mod.default || mod;
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const musicFacadeModule = getDefault(require('../services/music/MusicFacade'));
            const musicFacade = musicFacadeModule?.musicFacade || musicFacadeModule;
            if (musicFacade?.cleanup) {
                await musicFacade.cleanup(guildId);
            }
            const clientWithLogger = client;
            clientWithLogger.logger?.debug(`Auto-disconnected from empty channel in guild ${guildId}`);
        }
        catch (error) {
            const clientWithLogger = client;
            clientWithLogger.logger?.error('Voice disconnect error:', error);
        }
    }
}
exports.default = new VoiceStateUpdateEvent();
//# sourceMappingURL=voiceStateUpdate.js.map