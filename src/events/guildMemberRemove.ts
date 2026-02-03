/**
 * Guild Member Remove Event - Presentation Layer
 * Handles member leaves for mod logging
 * @module presentation/events/guildMemberRemove
 */

import { Events, Client, GuildMember, PartialGuildMember } from 'discord.js';
import { BaseEvent } from './BaseEvent.js';
import { handleMemberLeave } from '../handlers/moderation/index.js';
// GUILD MEMBER REMOVE EVENT
class GuildMemberRemoveEvent extends BaseEvent {
    constructor() {
        super({
            name: Events.GuildMemberRemove,
            once: false
        });
    }

    async execute(client: Client, member: GuildMember | PartialGuildMember): Promise<void> {
        await this._handleModLog(client, member);
    }
    
    /**
     * Handle mod log for member leave
     */
    private async _handleModLog(client: Client, member: GuildMember | PartialGuildMember): Promise<void> {
        try {
            // Only log if we have full member data
            if (!member.partial) {
                await handleMemberLeave(member as GuildMember);
            }
        } catch (error: unknown) {
            const clientWithLogger = client as Client & { logger?: { error: (msg: string, err: unknown) => void } };
            clientWithLogger.logger?.error('Mod log (leave) error:', error);
        }
    }
}

export default new GuildMemberRemoveEvent();
