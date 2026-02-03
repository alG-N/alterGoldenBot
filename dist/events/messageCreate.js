"use strict";
/**
 * Message Create Event - Presentation Layer
 * Handles AFK mentions, auto-moderation, and other message-based features
 * @module presentation/events/messageCreate
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseEvent_js_1 = require("./BaseEvent.js");
const index_js_1 = require("../handlers/moderation/index.js");
// MESSAGE CREATE EVENT
class MessageCreateEvent extends BaseEvent_js_1.BaseEvent {
    constructor() {
        super({
            name: discord_js_1.Events.MessageCreate,
            once: false
        });
    }
    async execute(client, message) {
        // Ignore bots and DMs
        if (message.author.bot || !message.guild)
            return;
        // Run auto-moderation first - if message is deleted, stop processing
        const automodResult = await this._handleAutoMod(client, message);
        if (automodResult?.deleted)
            return;
        // Handle AFK system
        await this._handleAfk(client, message);
    }
    /**
     * Handle auto-moderation
     */
    async _handleAutoMod(client, message) {
        try {
            const result = await (0, index_js_1.handleAutoModMessage)(client, message);
            if (typeof result === 'boolean') {
                return result ? { deleted: true } : null;
            }
            return result;
        }
        catch (error) {
            const err = error;
            console.error('[AutoMod] Error:', err.message);
            return null;
        }
    }
    /**
     * Handle AFK system
     */
    async _handleAfk(client, message) {
        try {
            // Try presentation layer first - access default export's onMessage
            const afkModule = await import('../commands/general/afk.js');
            const afkCommand = afkModule.default;
            if (afkCommand?.onMessage) {
                await Promise.resolve(afkCommand.onMessage(message, client));
                return;
            }
        }
        catch {
            // Fallback to old location
            try {
                const clientWithCommands = client;
                const afkCommand = clientWithCommands.commands?.get('afk');
                if (afkCommand?.onMessage) {
                    await afkCommand.onMessage(message, client);
                }
            }
            catch {
                // Silent fail for AFK
            }
        }
    }
}
exports.default = new MessageCreateEvent();
//# sourceMappingURL=messageCreate.js.map