"use strict";
/**
 * Guild Member Remove Event - Presentation Layer
 * Handles member leaves for mod logging
 * @module presentation/events/guildMemberRemove
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseEvent_js_1 = require("./BaseEvent.js");
const index_js_1 = require("../handlers/moderation/index.js");
// GUILD MEMBER REMOVE EVENT
class GuildMemberRemoveEvent extends BaseEvent_js_1.BaseEvent {
    constructor() {
        super({
            name: discord_js_1.Events.GuildMemberRemove,
            once: false
        });
    }
    async execute(client, member) {
        await this._handleModLog(client, member);
    }
    /**
     * Handle mod log for member leave
     */
    async _handleModLog(client, member) {
        try {
            // Only log if we have full member data
            if (!member.partial) {
                await (0, index_js_1.handleMemberLeave)(member);
            }
        }
        catch (error) {
            const clientWithLogger = client;
            clientWithLogger.logger?.error('Mod log (leave) error:', error);
        }
    }
}
exports.default = new GuildMemberRemoveEvent();
//# sourceMappingURL=guildMemberRemove.js.map