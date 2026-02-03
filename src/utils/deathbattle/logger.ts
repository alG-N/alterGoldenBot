/**
 * DeathBattle Logger
 * @module utils/deathbattle/logger
 */

import type { Client, ChatInputCommandInteraction } from 'discord.js';
import deathbattleConfig from '../../config/deathbattle/index.js';

const LOG_CHANNEL_ID = deathbattleConfig.LOG_CHANNEL_ID;
// DEATHBATTLE LOGGER CLASS
class DeathBattleLogger {
    log(msg: string, interaction?: ChatInputCommandInteraction): void {
        const now = new Date();
        const ts = now.toLocaleString('en-GB');
        const guild = interaction?.guild?.name ?? "UnknownGuild";
        const user = interaction?.user?.tag ?? "UnknownUser";
        const logMsg = `[${ts}] [DeathBattle] [${guild}] [${user}] ${msg}`;
        
        console.log(logMsg);
        
        if (interaction && interaction.client) {
            this.logToChannel(interaction.client, `[${ts}] ${msg}`);
        }
    }

    async logToChannel(client: Client, msg: string): Promise<void> {
        try {
            const channel = await client.channels.fetch(LOG_CHANNEL_ID);
            if (channel && channel.isTextBased() && 'send' in channel) {
                await channel.send(`\`\`\`js\n${msg}\n\`\`\``);
            }
        } catch (err) {
            console.error("[DeathBattle Logger] Failed to send log to channel:", err);
        }
    }

    error(msg: string, interaction: ChatInputCommandInteraction | null = null): void {
        const errorMsg = `[ERROR] ${msg}`;
        console.error(errorMsg);
        
        if (interaction && interaction.client) {
            this.logToChannel(interaction.client, errorMsg);
        }
    }
}

// Export singleton instance
const deathBattleLogger = new DeathBattleLogger();
export default deathBattleLogger;
export { DeathBattleLogger };
