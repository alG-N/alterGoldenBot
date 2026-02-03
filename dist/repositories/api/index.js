"use strict";
/**
 * API Repositories - Data caching for API services
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
exports.Rule34Cache = exports.RedditCache = exports.PixivCache = exports.NHentaiRepository = exports.CacheManager = exports.AnimeRepository = exports.rule34Cache = exports.redditCache = exports.pixivCache = exports.nhentaiRepository = exports.cacheManager = exports.animeRepository = void 0;
// Import all repositories
const animeRepository_1 = __importStar(require("./animeRepository"));
exports.animeRepository = animeRepository_1.default;
Object.defineProperty(exports, "AnimeRepository", { enumerable: true, get: function () { return animeRepository_1.AnimeRepository; } });
const cacheManager_1 = __importStar(require("./cacheManager"));
exports.cacheManager = cacheManager_1.default;
Object.defineProperty(exports, "CacheManager", { enumerable: true, get: function () { return cacheManager_1.CacheManager; } });
const nhentaiRepository_1 = __importStar(require("./nhentaiRepository"));
exports.nhentaiRepository = nhentaiRepository_1.default;
Object.defineProperty(exports, "NHentaiRepository", { enumerable: true, get: function () { return nhentaiRepository_1.NHentaiRepository; } });
const pixivCache_1 = __importStar(require("./pixivCache"));
exports.pixivCache = pixivCache_1.default;
Object.defineProperty(exports, "PixivCache", { enumerable: true, get: function () { return pixivCache_1.PixivCache; } });
const redditCache_1 = __importStar(require("./redditCache"));
exports.redditCache = redditCache_1.default;
Object.defineProperty(exports, "RedditCache", { enumerable: true, get: function () { return redditCache_1.RedditCache; } });
const rule34Cache_1 = __importStar(require("./rule34Cache"));
exports.rule34Cache = rule34Cache_1.default;
Object.defineProperty(exports, "Rule34Cache", { enumerable: true, get: function () { return rule34Cache_1.Rule34Cache; } });
// Default export for CommonJS compatibility
exports.default = {
    animeRepository: animeRepository_1.default,
    cacheManager: cacheManager_1.default,
    nhentaiRepository: nhentaiRepository_1.default,
    pixivCache: pixivCache_1.default,
    redditCache: redditCache_1.default,
    rule34Cache: rule34Cache_1.default
};
//# sourceMappingURL=index.js.map