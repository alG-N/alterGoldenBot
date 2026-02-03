"use strict";
/**
 * Admin Commands Index
 * @module commands/admin
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnings = exports.warn = exports.snipe = exports.slowmode = exports.setting = exports.raid = exports.mute = exports.lockdown = exports.kick = exports.delwarn = exports.delete_ = exports.clearwarns = exports.case_ = exports.ban = exports.automod = void 0;
var automod_js_1 = require("./automod.js");
Object.defineProperty(exports, "automod", { enumerable: true, get: function () { return __importDefault(automod_js_1).default; } });
var ban_js_1 = require("./ban.js");
Object.defineProperty(exports, "ban", { enumerable: true, get: function () { return __importDefault(ban_js_1).default; } });
var case_js_1 = require("./case.js");
Object.defineProperty(exports, "case_", { enumerable: true, get: function () { return __importDefault(case_js_1).default; } });
var clearwarns_js_1 = require("./clearwarns.js");
Object.defineProperty(exports, "clearwarns", { enumerable: true, get: function () { return __importDefault(clearwarns_js_1).default; } });
var delete_js_1 = require("./delete.js");
Object.defineProperty(exports, "delete_", { enumerable: true, get: function () { return __importDefault(delete_js_1).default; } });
var delwarn_js_1 = require("./delwarn.js");
Object.defineProperty(exports, "delwarn", { enumerable: true, get: function () { return __importDefault(delwarn_js_1).default; } });
var kick_js_1 = require("./kick.js");
Object.defineProperty(exports, "kick", { enumerable: true, get: function () { return __importDefault(kick_js_1).default; } });
var lockdown_js_1 = require("./lockdown.js");
Object.defineProperty(exports, "lockdown", { enumerable: true, get: function () { return __importDefault(lockdown_js_1).default; } });
var mute_js_1 = require("./mute.js");
Object.defineProperty(exports, "mute", { enumerable: true, get: function () { return __importDefault(mute_js_1).default; } });
var raid_js_1 = require("./raid.js");
Object.defineProperty(exports, "raid", { enumerable: true, get: function () { return __importDefault(raid_js_1).default; } });
var setting_js_1 = require("./setting.js");
Object.defineProperty(exports, "setting", { enumerable: true, get: function () { return __importDefault(setting_js_1).default; } });
var slowmode_js_1 = require("./slowmode.js");
Object.defineProperty(exports, "slowmode", { enumerable: true, get: function () { return __importDefault(slowmode_js_1).default; } });
var snipe_js_1 = require("./snipe.js");
Object.defineProperty(exports, "snipe", { enumerable: true, get: function () { return __importDefault(snipe_js_1).default; } });
var warn_js_1 = require("./warn.js");
Object.defineProperty(exports, "warn", { enumerable: true, get: function () { return __importDefault(warn_js_1).default; } });
var warnings_js_1 = require("./warnings.js");
Object.defineProperty(exports, "warnings", { enumerable: true, get: function () { return __importDefault(warnings_js_1).default; } });
// CommonJS compatibility for command loader
// Handle both `module.exports = cmd` and `export default cmd` patterns
const getCmd = (mod) => mod.default || mod;
module.exports = {
    automod: getCmd(require('./automod')),
    ban: getCmd(require('./ban')),
    case: getCmd(require('./case')),
    clearwarns: getCmd(require('./clearwarns')),
    delete: getCmd(require('./delete')),
    delwarn: getCmd(require('./delwarn')),
    kick: getCmd(require('./kick')),
    lockdown: getCmd(require('./lockdown')),
    mute: getCmd(require('./mute')),
    raid: getCmd(require('./raid')),
    setting: getCmd(require('./setting')),
    slowmode: getCmd(require('./slowmode')),
    snipe: getCmd(require('./snipe')),
    warn: getCmd(require('./warn')),
    warnings: getCmd(require('./warnings')),
};
//# sourceMappingURL=index.js.map