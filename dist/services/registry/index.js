"use strict";
/**
 * Registry Services Index
 * Command and Event registration
 * @module services/registry
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRegistry = exports.EventRegistry = exports.commandRegistry = exports.CommandRegistry = void 0;
var CommandRegistry_js_1 = require("./CommandRegistry.js");
Object.defineProperty(exports, "CommandRegistry", { enumerable: true, get: function () { return CommandRegistry_js_1.CommandRegistry; } });
Object.defineProperty(exports, "commandRegistry", { enumerable: true, get: function () { return __importDefault(CommandRegistry_js_1).default; } });
var EventRegistry_js_1 = require("./EventRegistry.js");
Object.defineProperty(exports, "EventRegistry", { enumerable: true, get: function () { return EventRegistry_js_1.EventRegistry; } });
Object.defineProperty(exports, "eventRegistry", { enumerable: true, get: function () { return __importDefault(EventRegistry_js_1).default; } });
//# sourceMappingURL=index.js.map