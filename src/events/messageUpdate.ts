/**
 * Message Update Event - Presentation Layer
 * Handles edited messages for auto-moderation and mod logging
 * @module presentation/events/messageUpdate
 */

import { Events, Client, Message, PartialMessage } from 'discord.js';
import { BaseEvent } from './BaseEvent.js';
import { handleAutoModUpdate, handleMessageUpdateLog } from '../handlers/moderation/index.js';
// MESSAGE UPDATE EVENT
class MessageUpdateEvent extends BaseEvent {
    constructor() {
        super({
            name: Events.MessageUpdate,
            once: false
        });
    }

    async execute(
        client: Client, 
        oldMessage: Message | PartialMessage, 
        newMessage: Message | PartialMessage
    ): Promise<void> {
        // Ignore bots, DMs, and unchanged content
        if (newMessage.author?.bot || !newMessage.guild) return;
        if (oldMessage.content === newMessage.content) return;
        
        // Fetch partials if needed
        if (oldMessage.partial) {
            try {
                await oldMessage.fetch();
            } catch {
                // Message too old to fetch, continue with what we have
            }
        }
        
        // Run auto-moderation on edited content
        await this._handleAutoMod(client, oldMessage as Message, newMessage as Message);
        
        // Log message edit
        await this._handleModLog(client, oldMessage as Message, newMessage as Message);
    }
    
    /**
     * Handle auto-moderation for edited messages
     */
    private async _handleAutoMod(client: Client, oldMessage: Message, newMessage: Message): Promise<void> {
        try {
            await handleAutoModUpdate(oldMessage, newMessage);
        } catch (error: unknown) {
            const clientWithLogger = client as Client & { logger?: { error: (msg: string, err: unknown) => void } };
            clientWithLogger.logger?.error('Auto-mod (edit) error:', error);
        }
    }
    
    /**
     * Handle mod log for message edits
     */
    private async _handleModLog(client: Client, oldMessage: Message, newMessage: Message): Promise<void> {
        try {
            await handleMessageUpdateLog(oldMessage, newMessage);
        } catch (error: unknown) {
            const clientWithLogger = client as Client & { logger?: { error: (msg: string, err: unknown) => void } };
            clientWithLogger.logger?.error('Mod log (edit) error:', error);
        }
    }
}

export default new MessageUpdateEvent();
