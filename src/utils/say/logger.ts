/**
 * Say Logger
 * @module utils/say/logger
 */

import type { Client } from 'discord.js';
import { LOG_CHANNEL_ID } from '../../config/say/index.js';
// SAY LOGGER CLASS
class SayLogger {
    log(userTag: string, _userId: string, channelName: string, channelId: string, type: string, _message: string): void {
        const now = new Date();
        const dateStr = now.toLocaleString('en-GB');
        const consoleMsg = `[${dateStr}] [say] User: ${userTag} | Channel: ${channelName} (${channelId}) | Type: ${type}`;
        console.log(consoleMsg);
    }

    async logToChannel(
        client: Client, 
        userTag: string, 
        userId: string, 
        channelName: string, 
        channelId: string, 
        type: string, 
        message: string
    ): Promise<void> {
        try {
            const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
            if (logChannel && logChannel.isTextBased() && 'send' in logChannel) {
                await logChannel.send(
                    "```" +
                    `Say Command Used\n` +
                    `User: ${userTag} (${userId})\n` +
                    `Channel: ${channelName} (${channelId})\n` +
                    `Type: ${type}\n` +
                    `Message: ${message}` +
                    "```"
                );
            }
        } catch (err) {
            console.error("[Say Logger] Failed to log to channel:", err);
        }
    }

    error(msg: string): void {
        console.error(`[Say Command Error] ${msg}`);
    }
}

// Export singleton instance
const sayLogger = new SayLogger();
export default sayLogger;
export { SayLogger };
