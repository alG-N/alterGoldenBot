/**
 * Guild Create Event - Presentation Layer
 * Fired when bot joins a new server
 * @module presentation/events/guildCreate
 */

import { Events, Client, Guild } from 'discord.js';
import { BaseEvent } from './BaseEvent.js';
import logger from '../core/Logger.js';
// GUILD CREATE EVENT
class GuildCreateEvent extends BaseEvent {
    constructor() {
        super({
            name: Events.GuildCreate,
            once: false
        });
    }

    async execute(_client: Client, guild: Guild): Promise<void> {
        logger.info('GuildCreate', `Joined server: ${guild.name} (${guild.id})`);
        await logger.logGuildEvent('join', guild);
    }
}

export default new GuildCreateEvent();
