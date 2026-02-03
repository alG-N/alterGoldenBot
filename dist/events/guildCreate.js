"use strict";
/**
 * Guild Create Event - Presentation Layer
 * Fired when bot joins a new server
 * @module presentation/events/guildCreate
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseEvent_js_1 = require("./BaseEvent.js");
const Logger_js_1 = __importDefault(require("../core/Logger.js"));
// GUILD CREATE EVENT
class GuildCreateEvent extends BaseEvent_js_1.BaseEvent {
    constructor() {
        super({
            name: discord_js_1.Events.GuildCreate,
            once: false
        });
    }
    async execute(_client, guild) {
        Logger_js_1.default.info('GuildCreate', `Joined server: ${guild.name} (${guild.id})`);
        await Logger_js_1.default.logGuildEvent('join', guild);
    }
}
exports.default = new GuildCreateEvent();
//# sourceMappingURL=guildCreate.js.map