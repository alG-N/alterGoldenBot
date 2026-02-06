"use strict";
/**
 * Repositories - Data access layer organized by feature
 * Note: Music caches have been moved to src/cache/music/
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
exports.AfkRepository = exports.afkRepository = exports.ModLogRepository = exports.FilterRepository = exports.AutoModRepository = exports.InfractionRepository = exports.rule34Cache = exports.redditCache = exports.pixivCache = exports.nhentaiRepository = exports.animeRepository = exports.general = exports.moderation = exports.api = void 0;
// Import all repository modules
const api = __importStar(require("./api/index.js"));
exports.api = api;
const moderation = __importStar(require("./moderation/index.js"));
exports.moderation = moderation;
const general = __importStar(require("./general/index.js"));
exports.general = general;
// Re-export individual repositories for convenience
var index_js_1 = require("./api/index.js");
Object.defineProperty(exports, "animeRepository", { enumerable: true, get: function () { return index_js_1.animeRepository; } });
Object.defineProperty(exports, "nhentaiRepository", { enumerable: true, get: function () { return index_js_1.nhentaiRepository; } });
Object.defineProperty(exports, "pixivCache", { enumerable: true, get: function () { return index_js_1.pixivCache; } });
Object.defineProperty(exports, "redditCache", { enumerable: true, get: function () { return index_js_1.redditCache; } });
Object.defineProperty(exports, "rule34Cache", { enumerable: true, get: function () { return index_js_1.rule34Cache; } });
// Music caches are now in src/cache/music/
// Import from there: import { MusicCache } from '../../cache/music.js';
var index_js_2 = require("./moderation/index.js");
Object.defineProperty(exports, "InfractionRepository", { enumerable: true, get: function () { return index_js_2.InfractionRepository; } });
Object.defineProperty(exports, "AutoModRepository", { enumerable: true, get: function () { return index_js_2.AutoModRepository; } });
Object.defineProperty(exports, "FilterRepository", { enumerable: true, get: function () { return index_js_2.FilterRepository; } });
Object.defineProperty(exports, "ModLogRepository", { enumerable: true, get: function () { return index_js_2.ModLogRepository; } });
var index_js_3 = require("./general/index.js");
Object.defineProperty(exports, "afkRepository", { enumerable: true, get: function () { return index_js_3.afkRepository; } });
Object.defineProperty(exports, "AfkRepository", { enumerable: true, get: function () { return index_js_3.AfkRepository; } });
// Default export
exports.default = {
    api,
    moderation,
    general
};
//# sourceMappingURL=index.js.map