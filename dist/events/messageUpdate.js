"use strict";
/**
 * Message Update Event - Presentation Layer
 * Handles edited messages for auto-moderation and mod logging
 * @module presentation/events/messageUpdate
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseEvent_js_1 = require("./BaseEvent.js");
const index_js_1 = require("../handlers/moderation/index.js");
// MESSAGE UPDATE EVENT
class MessageUpdateEvent extends BaseEvent_js_1.BaseEvent {
    constructor() {
        super({
            name: discord_js_1.Events.MessageUpdate,
            once: false
        });
    }
    async execute(client, oldMessage, newMessage) {
        // Ignore bots, DMs, and unchanged content
        if (newMessage.author?.bot || !newMessage.guild)
            return;
        if (oldMessage.content === newMessage.content)
            return;
        // Fetch partials if needed
        if (oldMessage.partial) {
            try {
                await oldMessage.fetch();
            }
            catch {
                // Message too old to fetch, continue with what we have
            }
        }
        // Run auto-moderation on edited content
        await this._handleAutoMod(client, oldMessage, newMessage);
        // Log message edit
        await this._handleModLog(client, oldMessage, newMessage);
    }
    /**
     * Handle auto-moderation for edited messages
     */
    async _handleAutoMod(client, oldMessage, newMessage) {
        try {
            await (0, index_js_1.handleAutoModUpdate)(oldMessage, newMessage);
        }
        catch (error) {
            const clientWithLogger = client;
            clientWithLogger.logger?.error('Auto-mod (edit) error:', error);
        }
    }
    /**
     * Handle mod log for message edits
     */
    async _handleModLog(client, oldMessage, newMessage) {
        try {
            await (0, index_js_1.handleMessageUpdateLog)(oldMessage, newMessage);
        }
        catch (error) {
            const clientWithLogger = client;
            clientWithLogger.logger?.error('Mod log (edit) error:', error);
        }
    }
}
exports.default = new MessageUpdateEvent();
//# sourceMappingURL=messageUpdate.js.map