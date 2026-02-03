"use strict";
/**
 * Repositories - Data access layer organized by feature
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModLogRepository = exports.FilterRepository = exports.AutoModRepository = exports.InfractionRepository = exports.MusicCache = exports.MusicCacheFacade = exports.GuildMusicCache = exports.VoteCache = exports.UserMusicCache = exports.QueueCache = exports.rule34Cache = exports.redditCache = exports.pixivCache = exports.nhentaiRepository = exports.cacheManager = exports.animeRepository = exports.moderation = exports.music = exports.api = void 0;
// Import all repository modules
const api = __importStar(require("./api"));
exports.api = api;
const music = __importStar(require("./music"));
exports.music = music;
const moderation = __importStar(require("./moderation"));
exports.moderation = moderation;
// Re-export individual repositories for convenience
var api_1 = require("./api");
Object.defineProperty(exports, "animeRepository", { enumerable: true, get: function () { return api_1.animeRepository; } });
Object.defineProperty(exports, "cacheManager", { enumerable: true, get: function () { return api_1.cacheManager; } });
Object.defineProperty(exports, "nhentaiRepository", { enumerable: true, get: function () { return api_1.nhentaiRepository; } });
Object.defineProperty(exports, "pixivCache", { enumerable: true, get: function () { return api_1.pixivCache; } });
Object.defineProperty(exports, "redditCache", { enumerable: true, get: function () { return api_1.redditCache; } });
Object.defineProperty(exports, "rule34Cache", { enumerable: true, get: function () { return api_1.rule34Cache; } });
var music_1 = require("./music");
Object.defineProperty(exports, "QueueCache", { enumerable: true, get: function () { return music_1.QueueCache; } });
Object.defineProperty(exports, "UserMusicCache", { enumerable: true, get: function () { return music_1.UserMusicCache; } });
Object.defineProperty(exports, "VoteCache", { enumerable: true, get: function () { return music_1.VoteCache; } });
Object.defineProperty(exports, "GuildMusicCache", { enumerable: true, get: function () { return music_1.GuildMusicCache; } });
Object.defineProperty(exports, "MusicCacheFacade", { enumerable: true, get: function () { return music_1.MusicCacheFacade; } });
Object.defineProperty(exports, "MusicCache", { enumerable: true, get: function () { return music_1.MusicCache; } });
var moderation_1 = require("./moderation");
Object.defineProperty(exports, "InfractionRepository", { enumerable: true, get: function () { return moderation_1.InfractionRepository; } });
Object.defineProperty(exports, "AutoModRepository", { enumerable: true, get: function () { return moderation_1.AutoModRepository; } });
Object.defineProperty(exports, "FilterRepository", { enumerable: true, get: function () { return moderation_1.FilterRepository; } });
Object.defineProperty(exports, "ModLogRepository", { enumerable: true, get: function () { return moderation_1.ModLogRepository; } });
// Default export
exports.default = {
    api,
    music,
    moderation
};
//# sourceMappingURL=index.js.map