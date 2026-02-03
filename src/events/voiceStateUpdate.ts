/**
 * Voice State Update Event - Presentation Layer
 * Handles voice channel updates for auto-disconnect
 * @module presentation/events/voiceStateUpdate
 */

import { Events, Client, VoiceState, VoiceBasedChannel } from 'discord.js';
import { BaseEvent } from './BaseEvent.js';
// VOICE STATE UPDATE EVENT
class VoiceStateUpdateEvent extends BaseEvent {
    private _disconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
    private readonly _disconnectDelay: number = 30000; // 30 seconds
    
    constructor() {
        super({
            name: Events.VoiceStateUpdate,
            once: false
        });
    }

    async execute(client: Client, oldState: VoiceState, newState: VoiceState): Promise<void> {
        // Only handle when someone leaves a channel
        if (!oldState.channel) return;
        
        // Check if bot was in the old channel
        const botMember = oldState.guild.members.cache.get(client.user?.id || '');
        if (!botMember?.voice.channel) return;
        
        // Check if bot is in the same channel that was left
        if (botMember.voice.channel.id !== oldState.channel.id) return;
        
        // Check if channel is now empty (only bot left)
        await this._checkEmptyChannel(client, oldState.channel, oldState.guild.id);
    }
    
    /**
     * Check if voice channel is empty and schedule disconnect
     */
    private async _checkEmptyChannel(
        client: Client, 
        channel: VoiceBasedChannel, 
        guildId: string
    ): Promise<void> {
        // Count human members (exclude bots)
        const humanMembers = channel.members.filter(m => !m.user.bot);
        
        if (humanMembers.size === 0) {
            // Channel is empty, schedule disconnect
            this._scheduleDisconnect(client, guildId);
        } else {
            // Someone rejoined, cancel scheduled disconnect
            this._cancelDisconnect(guildId);
        }
    }
    
    /**
     * Schedule auto-disconnect after delay
     */
    private _scheduleDisconnect(client: Client, guildId: string): void {
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
    private _cancelDisconnect(guildId: string): void {
        const timer = this._disconnectTimers.get(guildId);
        if (timer) {
            clearTimeout(timer);
            this._disconnectTimers.delete(guildId);
        }
    }
    
    /**
     * Handle disconnect via music service
     */
    private async _handleDisconnect(client: Client, guildId: string): Promise<void> {
        try {
            // Use MusicFacade - the refactored music service
            const getDefault = <T>(mod: { default?: T } | T): T => (mod as { default?: T }).default || mod as T;
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const musicFacadeModule = getDefault(require('../services/music/MusicFacade'));
            const musicFacade = musicFacadeModule?.musicFacade || musicFacadeModule;
            
            if (musicFacade?.cleanup) {
                await musicFacade.cleanup(guildId);
            }
            
            const clientWithLogger = client as Client & { logger?: { debug: (msg: string) => void } };
            clientWithLogger.logger?.debug(`Auto-disconnected from empty channel in guild ${guildId}`);
            
        } catch (error: unknown) {
            const clientWithLogger = client as Client & { logger?: { error: (msg: string, err: unknown) => void } };
            clientWithLogger.logger?.error('Voice disconnect error:', error);
        }
    }
}

export default new VoiceStateUpdateEvent();
