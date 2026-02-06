"use strict";
/**
 * Music Caches
 * In-memory caching for music playback state
 * Note: These are per-shard caches, not database repositories
 * @module cache/music
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteCache = exports.voteCache = exports.GuildMusicCache = exports.guildMusicCache = exports.UserMusicCache = exports.userMusicCache = exports.QueueCache = exports.queueCache = exports.MusicCacheFacade = exports.MusicCache = void 0;
// Main facade (backward compatible)
var MusicCacheFacade_js_1 = require("./MusicCacheFacade.js");
Object.defineProperty(exports, "MusicCache", { enumerable: true, get: function () { return __importDefault(MusicCacheFacade_js_1).default; } });
Object.defineProperty(exports, "MusicCacheFacade", { enumerable: true, get: function () { return MusicCacheFacade_js_1.musicCacheFacade; } });
// Individual caches
var QueueCache_js_1 = require("./QueueCache.js");
Object.defineProperty(exports, "queueCache", { enumerable: true, get: function () { return __importDefault(QueueCache_js_1).default; } });
Object.defineProperty(exports, "QueueCache", { enumerable: true, get: function () { return QueueCache_js_1.queueCache; } });
var UserMusicCache_js_1 = require("./UserMusicCache.js");
Object.defineProperty(exports, "userMusicCache", { enumerable: true, get: function () { return __importDefault(UserMusicCache_js_1).default; } });
Object.defineProperty(exports, "UserMusicCache", { enumerable: true, get: function () { return UserMusicCache_js_1.userMusicCache; } });
var GuildMusicCache_js_1 = require("./GuildMusicCache.js");
Object.defineProperty(exports, "guildMusicCache", { enumerable: true, get: function () { return __importDefault(GuildMusicCache_js_1).default; } });
Object.defineProperty(exports, "GuildMusicCache", { enumerable: true, get: function () { return GuildMusicCache_js_1.guildMusicCache; } });
var VoteCache_js_1 = require("./VoteCache.js");
Object.defineProperty(exports, "voteCache", { enumerable: true, get: function () { return __importDefault(VoteCache_js_1).default; } });
Object.defineProperty(exports, "VoteCache", { enumerable: true, get: function () { return VoteCache_js_1.voteCache; } });
//# sourceMappingURL=index.js.map