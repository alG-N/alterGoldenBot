"use strict";
/**
 * General Commands Index
 * @module commands/general
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleinfo = exports.reportHandleModal = exports.report = exports.invite = exports.afkOnMessage = exports.formatDuration = exports.removeAfk = exports.isUserAfk = exports.afk = exports.serverinfo = exports.avatar = exports.help = exports.ping = void 0;
// ESM exports
var ping_js_1 = require("./ping.js");
Object.defineProperty(exports, "ping", { enumerable: true, get: function () { return __importDefault(ping_js_1).default; } });
var help_js_1 = require("./help.js");
Object.defineProperty(exports, "help", { enumerable: true, get: function () { return __importDefault(help_js_1).default; } });
var avatar_js_1 = require("./avatar.js");
Object.defineProperty(exports, "avatar", { enumerable: true, get: function () { return __importDefault(avatar_js_1).default; } });
var serverinfo_js_1 = require("./serverinfo.js");
Object.defineProperty(exports, "serverinfo", { enumerable: true, get: function () { return __importDefault(serverinfo_js_1).default; } });
var afk_js_1 = require("./afk.js");
Object.defineProperty(exports, "afk", { enumerable: true, get: function () { return __importDefault(afk_js_1).default; } });
Object.defineProperty(exports, "isUserAfk", { enumerable: true, get: function () { return afk_js_1.isUserAfk; } });
Object.defineProperty(exports, "removeAfk", { enumerable: true, get: function () { return afk_js_1.removeAfk; } });
Object.defineProperty(exports, "formatDuration", { enumerable: true, get: function () { return afk_js_1.formatDuration; } });
Object.defineProperty(exports, "afkOnMessage", { enumerable: true, get: function () { return afk_js_1.onMessage; } });
var invite_js_1 = require("./invite.js");
Object.defineProperty(exports, "invite", { enumerable: true, get: function () { return __importDefault(invite_js_1).default; } });
var report_js_1 = require("./report.js");
Object.defineProperty(exports, "report", { enumerable: true, get: function () { return __importDefault(report_js_1).default; } });
Object.defineProperty(exports, "reportHandleModal", { enumerable: true, get: function () { return report_js_1.handleModal; } });
var roleinfo_js_1 = require("./roleinfo.js");
Object.defineProperty(exports, "roleinfo", { enumerable: true, get: function () { return __importDefault(roleinfo_js_1).default; } });
//# sourceMappingURL=index.js.map