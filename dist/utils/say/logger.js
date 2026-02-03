"use strict";
/**
 * Say Logger
 * @module utils/say/logger
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SayLogger = void 0;
const index_js_1 = require("../../config/say/index.js");
// SAY LOGGER CLASS
class SayLogger {
    log(userTag, _userId, channelName, channelId, type, _message) {
        const now = new Date();
        const dateStr = now.toLocaleString('en-GB');
        const consoleMsg = `[${dateStr}] [say] User: ${userTag} | Channel: ${channelName} (${channelId}) | Type: ${type}`;
        console.log(consoleMsg);
    }
    async logToChannel(client, userTag, userId, channelName, channelId, type, message) {
        try {
            const logChannel = await client.channels.fetch(index_js_1.LOG_CHANNEL_ID);
            if (logChannel && logChannel.isTextBased() && 'send' in logChannel) {
                await logChannel.send("```" +
                    `Say Command Used\n` +
                    `User: ${userTag} (${userId})\n` +
                    `Channel: ${channelName} (${channelId})\n` +
                    `Type: ${type}\n` +
                    `Message: ${message}` +
                    "```");
            }
        }
        catch (err) {
            console.error("[Say Logger] Failed to log to channel:", err);
        }
    }
    error(msg) {
        console.error(`[Say Command Error] ${msg}`);
    }
}
exports.SayLogger = SayLogger;
// Export singleton instance
const sayLogger = new SayLogger();
exports.default = sayLogger;
//# sourceMappingURL=logger.js.map