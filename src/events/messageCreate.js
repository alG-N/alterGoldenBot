/**
 * Message Create Event - Presentation Layer
 * Handles AFK mentions and other message-based features
 * @module presentation/events/messageCreate
 */

const { Events } = require('discord.js');
const { BaseEvent } = require('./BaseEvent');

class MessageCreateEvent extends BaseEvent {
    constructor() {
        super({
            name: Events.MessageCreate,
            once: false
        });
    }

    async execute(client, message) {
        // Ignore bots and DMs
        if (message.author.bot || !message.guild) return;
        
        // Handle AFK system
        await this._handleAfk(client, message);
        
        // Handle deleted message tracking for snipe
        // Note: This is handled by messageDelete event, not here
    }

    async _handleAfk(client, message) {
        try {
            // Try presentation layer first
            const afkCommand = require('../commands/general/afk');
            if (afkCommand?.onMessage) {
                await afkCommand.onMessage(message, client);
                return;
            }
        } catch {
            // Fallback to old location
            try {
                const afkCommand = client.commands?.get('afk');
                if (afkCommand?.onMessage) {
                    await afkCommand.onMessage(message, client);
                }
            } catch {
                // Silent fail for AFK
            }
        }
    }
}

module.exports = new MessageCreateEvent();



