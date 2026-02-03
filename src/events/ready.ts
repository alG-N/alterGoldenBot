/**
 * Ready Event - Presentation Layer
 * Fired when the bot successfully connects to Discord
 * @module presentation/events/ready
 */

import { Events, Client, ActivityType, PresenceStatusData } from 'discord.js';
import { BaseEvent } from './BaseEvent.js';
import logger from '../core/Logger.js';
import { setPresence } from '../core/Client.js';
import { bot } from '../config/index.js';
// READY EVENT
class ReadyEvent extends BaseEvent {
    constructor() {
        super({
            name: Events.ClientReady,
            once: true
        });
    }

    async execute(client: Client): Promise<void> {
        if (!client.user) return;
        
        logger.success('Ready', `Logged in as ${client.user.tag}`);
        
        // Initialize logger with client
        logger.initialize(client);
        
        // Set presence from config
        const presenceConfig = bot.presence;
        setPresence(
            client, 
            (presenceConfig.status || 'online') as PresenceStatusData, 
            presenceConfig.activity || '/help | alterGolden', 
            ActivityType.Playing
        );
        
        // Log statistics
        logger.info('Ready', `Serving ${client.guilds.cache.size} guilds`);
        
        // Log startup to Discord
        await logger.logSystemEvent(
            'Bot Started', 
            `alterGolden is now online with ${client.guilds.cache.size} guilds`
        );
        
        logger.success('Ready', '🚀 alterGolden is fully operational!');
    }
}

export default new ReadyEvent();
