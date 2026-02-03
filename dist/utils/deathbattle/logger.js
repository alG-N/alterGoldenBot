"use strict";
/**
 * DeathBattle Logger
 * @module utils/deathbattle/logger
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeathBattleLogger = void 0;
const index_js_1 = __importDefault(require("../../config/deathbattle/index.js"));
const LOG_CHANNEL_ID = index_js_1.default.LOG_CHANNEL_ID;
// DEATHBATTLE LOGGER CLASS
class DeathBattleLogger {
    log(msg, interaction) {
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
    async logToChannel(client, msg) {
        try {
            const channel = await client.channels.fetch(LOG_CHANNEL_ID);
            if (channel && channel.isTextBased() && 'send' in channel) {
                await channel.send(`\`\`\`js\n${msg}\n\`\`\``);
            }
        }
        catch (err) {
            console.error("[DeathBattle Logger] Failed to send log to channel:", err);
        }
    }
    error(msg, interaction = null) {
        const errorMsg = `[ERROR] ${msg}`;
        console.error(errorMsg);
        if (interaction && interaction.client) {
            this.logToChannel(interaction.client, errorMsg);
        }
    }
}
exports.DeathBattleLogger = DeathBattleLogger;
// Export singleton instance
const deathBattleLogger = new DeathBattleLogger();
exports.default = deathBattleLogger;
//# sourceMappingURL=logger.js.map