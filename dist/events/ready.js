"use strict";
/**
 * Ready Event - Presentation Layer
 * Fired when the bot successfully connects to Discord
 * @module presentation/events/ready
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseEvent_js_1 = require("./BaseEvent.js");
const Logger_js_1 = __importDefault(require("../core/Logger.js"));
const Client_js_1 = require("../core/Client.js");
const index_js_1 = require("../config/index.js");
// READY EVENT
class ReadyEvent extends BaseEvent_js_1.BaseEvent {
    constructor() {
        super({
            name: discord_js_1.Events.ClientReady,
            once: true
        });
    }
    async execute(client) {
        if (!client.user)
            return;
        Logger_js_1.default.success('Ready', `Logged in as ${client.user.tag}`);
        // Initialize logger with client
        Logger_js_1.default.initialize(client);
        // Set presence from config
        const presenceConfig = index_js_1.bot.presence;
        (0, Client_js_1.setPresence)(client, (presenceConfig.status || 'online'), presenceConfig.activity || '/help | alterGolden', discord_js_1.ActivityType.Playing);
        // Log statistics
        Logger_js_1.default.info('Ready', `Serving ${client.guilds.cache.size} guilds`);
        // Log startup to Discord
        await Logger_js_1.default.logSystemEvent('Bot Started', `alterGolden is now online with ${client.guilds.cache.size} guilds`);
        Logger_js_1.default.success('Ready', '🚀 alterGolden is fully operational!');
    }
}
exports.default = new ReadyEvent();
//# sourceMappingURL=ready.js.map