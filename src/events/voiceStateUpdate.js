/**
 * Voice State Update Event - Presentation Layer
 * Handles auto-disconnect when all users leave voice channel
 * @module presentation/events/voiceStateUpdate
 */

const { Events } = require('discord.js');
const { BaseEvent } = require('./BaseEvent');

class VoiceStateUpdateEvent extends BaseEvent {
    constructor() {
        super({
            name: Events.VoiceStateUpdate,
            once: false
        });
    }

    async execute(client, oldState, newState) {
        // Only handle when someone leaves a voice channel
        if (!oldState.channel) return;
        
        // Get the bot's voice connection in this guild
        const guildId = oldState.guild.id;
        const botMember = oldState.guild.members.cache.get(client.user.id);
        
        // Check if bot is in a voice channel
        if (!botMember?.voice?.channel) return;
        
        const botChannel = botMember.voice.channel;
        
        // Only care if someone left the same channel as bot
        if (oldState.channel.id !== botChannel.id) return;
        
        // Count non-bot members in the channel
        const nonBotMembers = botChannel.members.filter(m => !m.user.bot).size;
        
        // If no humans left, disconnect
        if (nonBotMembers === 0) {
            console.log(`[Voice] No users in ${botChannel.name}, disconnecting...`);
            await this._handleDisconnect(guildId, botChannel.name);
        }
    }

    async _handleDisconnect(guildId, channelName) {
        try {
            // Try to use music service to properly disconnect
            const musicService = require('../../modules/music/Service/MusicService');
            
            // Stop playback and disconnect
            await musicService.stop(guildId);
            
            console.log(`[Voice] ✅ Disconnected from ${channelName} (no users)`);
        } catch (error) {
            // Fallback: force disconnect via Lavalink
            try {
                const lavalinkService = require('../../modules/music/service/LavalinkService');
                lavalinkService.destroyPlayer(guildId);
                console.log(`[Voice] ✅ Force disconnected from ${channelName}`);
            } catch (e) {
                console.error(`[Voice] Failed to disconnect:`, e.message);
            }
        }
    }
}

module.exports = new VoiceStateUpdateEvent();



