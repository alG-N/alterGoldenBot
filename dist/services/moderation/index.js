"use strict";
/**
 * Moderation Services Module
 * Central exports for all moderation services
 * @module services/moderation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.antiRaidService = exports.lockdownService = exports.modLogService = exports.infractionService = exports.autoModService = exports.filterService = exports.snipeService = exports.moderationService = void 0;
// Service exports (default exports as named)
var ModerationService_js_1 = require("./ModerationService.js");
Object.defineProperty(exports, "moderationService", { enumerable: true, get: function () { return __importDefault(ModerationService_js_1).default; } });
var SnipeService_js_1 = require("./SnipeService.js");
Object.defineProperty(exports, "snipeService", { enumerable: true, get: function () { return __importDefault(SnipeService_js_1).default; } });
var FilterService_js_1 = require("./FilterService.js");
Object.defineProperty(exports, "filterService", { enumerable: true, get: function () { return __importDefault(FilterService_js_1).default; } });
var AutoModService_js_1 = require("./AutoModService.js");
Object.defineProperty(exports, "autoModService", { enumerable: true, get: function () { return __importDefault(AutoModService_js_1).default; } });
var InfractionService_js_1 = require("./InfractionService.js");
Object.defineProperty(exports, "infractionService", { enumerable: true, get: function () { return __importDefault(InfractionService_js_1).default; } });
var ModLogService_js_1 = require("./ModLogService.js");
Object.defineProperty(exports, "modLogService", { enumerable: true, get: function () { return __importDefault(ModLogService_js_1).default; } });
var LockdownService_js_1 = require("./LockdownService.js");
Object.defineProperty(exports, "lockdownService", { enumerable: true, get: function () { return __importDefault(LockdownService_js_1).default; } });
var AntiRaidService_js_1 = require("./AntiRaidService.js");
Object.defineProperty(exports, "antiRaidService", { enumerable: true, get: function () { return __importDefault(AntiRaidService_js_1).default; } });
//# sourceMappingURL=index.js.map