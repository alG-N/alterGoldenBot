/**
 * Voice State Update Event - Presentation Layer
 * Handles auto-disconnect when all users leave voice channel
 * @module presentation/events/voiceStateUpdate
 */

const { Events } = require('discord.js');
const { BaseEvent } = require('./BaseEvent');
const logger = require('../core/Logger');

class VoiceStateUpdateEvent extends BaseEvent {
    constructor() {
        super({
            name: Events.VoiceStateUpdate,
            once: false
        });
    }

    async execute(client, oldState, newState) {
        // Handle when someone leaves a voice channel
        if (oldState.channel) {
            await this._checkEmptyChannel(client, oldState);
        }
        
        // Handle when someone moves between channels (they left old channel)
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            await this._checkEmptyChannel(client, oldState);
        }
    }

    async _checkEmptyChannel(client, state) {
        const guildId = state.guild.id;
        
        // Refresh the bot member to get current voice state
        let botMember;
        try {
            botMember = await state.guild.members.fetch(client.user.id);
        } catch (e) {
            // Bot might have been kicked, ignore
            return;
        }
        
        // Check if bot is in a voice channel
        if (!botMember?.voice?.channel) return;
        
        const botChannel = botMember.voice.channel;
        
        // Only care if someone left the same channel as bot
        if (state.channel.id !== botChannel.id) return;
        
        // Refresh channel members to get accurate count
        let freshChannel;
        try {
            freshChannel = await client.channels.fetch(botChannel.id);
        } catch (e) {
            return;
        }
        
        // Count non-bot members in the channel
        const nonBotMembers = freshChannel.members.filter(m => !m.user.bot).size;
        
        // If no humans left, disconnect
        if (nonBotMembers === 0) {
            logger.info('Voice', `No users in ${botChannel.name}, disconnecting...`);
            await this._handleDisconnect(guildId, botChannel.name);
        }
    }

    async _handleDisconnect(guildId, channelName) {
        try {
            // Try to use music service to properly disconnect
            const musicService = require('../services/music/MusicService');
            
            // Stop playback and cleanup (includes disconnect)
            await musicService.cleanup(guildId);
            
            logger.debug(`[Voice] Disconnected from ${channelName} (no users)`);
        } catch (error) {
            // Fallback: force disconnect via Lavalink
            try {
                const lavalinkService = require('../services/music/LavalinkService');
                lavalinkService.destroyPlayer(guildId);
                logger.debug(`[Voice] Force disconnected from ${channelName}`);
            } catch (e) {
                logger.warn(`[Voice] Failed to disconnect: ${e.message}`);
            }
        }
    }
}

module.exports = new VoiceStateUpdateEvent();



