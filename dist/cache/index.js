"use strict";
/**
 * Cache Module
 * Central exports for caching utilities
 * @module cache
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.DEFAULT_NAMESPACES = exports.CacheService = exports.guildCache = exports.userCache = exports.apiCache = exports.globalCacheManager = exports.CacheManager = exports.BaseCache = void 0;
// Base Cache
var BaseCache_1 = require("./BaseCache");
Object.defineProperty(exports, "BaseCache", { enumerable: true, get: function () { return BaseCache_1.BaseCache; } });
// Cache Manager
var CacheManager_1 = require("./CacheManager");
Object.defineProperty(exports, "CacheManager", { enumerable: true, get: function () { return CacheManager_1.CacheManager; } });
Object.defineProperty(exports, "globalCacheManager", { enumerable: true, get: function () { return CacheManager_1.globalCacheManager; } });
Object.defineProperty(exports, "apiCache", { enumerable: true, get: function () { return CacheManager_1.apiCache; } });
Object.defineProperty(exports, "userCache", { enumerable: true, get: function () { return CacheManager_1.userCache; } });
Object.defineProperty(exports, "guildCache", { enumerable: true, get: function () { return CacheManager_1.guildCache; } });
// Cache Service
var CacheService_1 = require("./CacheService");
Object.defineProperty(exports, "CacheService", { enumerable: true, get: function () { return CacheService_1.CacheService; } });
Object.defineProperty(exports, "DEFAULT_NAMESPACES", { enumerable: true, get: function () { return CacheService_1.DEFAULT_NAMESPACES; } });
// Default export is the unified cache service singleton
const CacheService_2 = __importDefault(require("./CacheService"));
exports.cacheService = CacheService_2.default;
exports.default = CacheService_2.default;
// CommonJS COMPATIBILITY
const BaseCacheModule = require('./BaseCache');
const CacheManagerModule = require('./CacheManager');
const CacheServiceModule = require('./CacheService');
module.exports = {
    // Classes
    BaseCache: BaseCacheModule.BaseCache,
    CacheManager: CacheManagerModule.CacheManager,
    CacheService: CacheServiceModule.CacheService,
    // Global instances
    globalCacheManager: CacheManagerModule.globalCacheManager,
    cacheService: CacheServiceModule, // Unified cache (recommended)
    // Pre-configured caches (legacy)
    apiCache: CacheManagerModule.apiCache,
    userCache: CacheManagerModule.userCache,
    guildCache: CacheManagerModule.guildCache,
    // Constants
    DEFAULT_NAMESPACES: CacheServiceModule.DEFAULT_NAMESPACES,
};
//# sourceMappingURL=index.js.map