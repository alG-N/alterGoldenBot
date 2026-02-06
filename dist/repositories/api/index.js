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
exports.Rule34Cache = exports.RedditCache = exports.PixivCache = exports.NHentaiRepository = exports.AnimeRepository = exports.rule34Cache = exports.redditCache = exports.pixivCache = exports.nhentaiRepository = exports.animeRepository = void 0;
// Import all repositories
const animeRepository_js_1 = __importStar(require("./animeRepository.js"));
exports.animeRepository = animeRepository_js_1.default;
Object.defineProperty(exports, "AnimeRepository", { enumerable: true, get: function () { return animeRepository_js_1.AnimeRepository; } });
const nhentaiRepository_js_1 = __importStar(require("./nhentaiRepository.js"));
exports.nhentaiRepository = nhentaiRepository_js_1.default;
Object.defineProperty(exports, "NHentaiRepository", { enumerable: true, get: function () { return nhentaiRepository_js_1.NHentaiRepository; } });
const pixivCache_js_1 = __importStar(require("./pixivCache.js"));
exports.pixivCache = pixivCache_js_1.default;
Object.defineProperty(exports, "PixivCache", { enumerable: true, get: function () { return pixivCache_js_1.PixivCache; } });
const redditCache_js_1 = __importStar(require("./redditCache.js"));
exports.redditCache = redditCache_js_1.default;
Object.defineProperty(exports, "RedditCache", { enumerable: true, get: function () { return redditCache_js_1.RedditCache; } });
const rule34Cache_js_1 = __importStar(require("./rule34Cache.js"));
exports.rule34Cache = rule34Cache_js_1.default;
Object.defineProperty(exports, "Rule34Cache", { enumerable: true, get: function () { return rule34Cache_js_1.Rule34Cache; } });
// Default export for CommonJS compatibility
exports.default = {
    animeRepository: animeRepository_js_1.default,
    nhentaiRepository: nhentaiRepository_js_1.default,
    pixivCache: pixivCache_js_1.default,
    redditCache: redditCache_js_1.default,
    rule34Cache: rule34Cache_js_1.default
};
//# sourceMappingURL=index.js.map