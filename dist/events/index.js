"use strict";
/**
 * Events Module Index
 * Re-exports all event handlers
 * @module presentation/events
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = exports.voiceStateUpdate = exports.guildMemberRemove = exports.guildMemberAdd = exports.guildDelete = exports.guildCreate = exports.messageUpdate = exports.messageCreate = exports.ready = exports.BaseEvent = void 0;
var BaseEvent_js_1 = require("./BaseEvent.js");
Object.defineProperty(exports, "BaseEvent", { enumerable: true, get: function () { return BaseEvent_js_1.BaseEvent; } });
// Import events
const ready_js_1 = __importDefault(require("./ready.js"));
exports.ready = ready_js_1.default;
const messageCreate_js_1 = __importDefault(require("./messageCreate.js"));
exports.messageCreate = messageCreate_js_1.default;
const messageUpdate_js_1 = __importDefault(require("./messageUpdate.js"));
exports.messageUpdate = messageUpdate_js_1.default;
const guildCreate_js_1 = __importDefault(require("./guildCreate.js"));
exports.guildCreate = guildCreate_js_1.default;
const guildDelete_js_1 = __importDefault(require("./guildDelete.js"));
exports.guildDelete = guildDelete_js_1.default;
const guildMemberAdd_js_1 = __importDefault(require("./guildMemberAdd.js"));
exports.guildMemberAdd = guildMemberAdd_js_1.default;
const guildMemberRemove_js_1 = __importDefault(require("./guildMemberRemove.js"));
exports.guildMemberRemove = guildMemberRemove_js_1.default;
const voiceStateUpdate_js_1 = __importDefault(require("./voiceStateUpdate.js"));
exports.voiceStateUpdate = voiceStateUpdate_js_1.default;
// Export all events as array for easy registration
exports.events = [
    ready_js_1.default,
    messageCreate_js_1.default,
    messageUpdate_js_1.default,
    guildCreate_js_1.default,
    guildDelete_js_1.default,
    guildMemberAdd_js_1.default,
    guildMemberRemove_js_1.default,
    voiceStateUpdate_js_1.default
];
exports.default = exports.events;
//# sourceMappingURL=index.js.map