"use strict";
/**
 * Cache Module
 * Central exports for caching utilities
 * @module cache
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.VoteCache = exports.GuildMusicCache = exports.UserMusicCache = exports.QueueCache = exports.MusicCacheFacade = exports.MusicCache = exports.music = exports.DEFAULT_NAMESPACES = exports.CacheService = exports.BaseCache = void 0;
// Base Cache (legacy — used by music caches, will be migrated to CacheService)
var BaseCache_1 = require("./BaseCache");
Object.defineProperty(exports, "BaseCache", { enumerable: true, get: function () { return BaseCache_1.BaseCache; } });
// Cache Service
var CacheService_1 = require("./CacheService");
Object.defineProperty(exports, "CacheService", { enumerable: true, get: function () { return CacheService_1.CacheService; } });
Object.defineProperty(exports, "DEFAULT_NAMESPACES", { enumerable: true, get: function () { return CacheService_1.DEFAULT_NAMESPACES; } });
// Music Caches (moved from repositories/music)
exports.music = __importStar(require("./music"));
var music_1 = require("./music");
Object.defineProperty(exports, "MusicCache", { enumerable: true, get: function () { return music_1.MusicCache; } });
Object.defineProperty(exports, "MusicCacheFacade", { enumerable: true, get: function () { return music_1.MusicCacheFacade; } });
Object.defineProperty(exports, "QueueCache", { enumerable: true, get: function () { return music_1.QueueCache; } });
Object.defineProperty(exports, "UserMusicCache", { enumerable: true, get: function () { return music_1.UserMusicCache; } });
Object.defineProperty(exports, "GuildMusicCache", { enumerable: true, get: function () { return music_1.GuildMusicCache; } });
Object.defineProperty(exports, "VoteCache", { enumerable: true, get: function () { return music_1.VoteCache; } });
// Default export is the unified cache service singleton
const CacheService_2 = __importDefault(require("./CacheService"));
exports.cacheService = CacheService_2.default;
exports.default = CacheService_2.default;
//# sourceMappingURL=index.js.map