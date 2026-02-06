"use strict";
/**
 * Middleware Module
 * Centralized access control, validation, and restrictions
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
exports.BLOCKED_HOST_PATTERNS = exports.isBlockedHost = exports.validateUrl = exports.checkVoicePermissionsSync = exports.checkVoiceChannelSync = exports.checkVoicePermissions = exports.checkSameVoiceChannel = exports.checkVoiceChannel = exports.validateVideoUrl = exports.botCanModerate = exports.canModerate = exports.isServerOwner = exports.isServerAdmin = exports.hasPermissions = exports.createCooldownEmbed = exports.createInfoEmbed = exports.createSuccessEmbed = exports.createWarningEmbed = exports.createErrorEmbed = exports.checkAccess = exports.checkNSFW = exports.checkMaintenance = exports.validators = exports.DistributedRateLimiter = exports.RateLimiter = exports.AccessType = void 0;
// Import modules
const access = __importStar(require("./access.js"));
const voiceChannelCheck = __importStar(require("./voiceChannelCheck.js"));
const urlValidator = __importStar(require("./urlValidator.js"));
// Re-export access control
var access_js_1 = require("./access.js");
Object.defineProperty(exports, "AccessType", { enumerable: true, get: function () { return access_js_1.AccessType; } });
Object.defineProperty(exports, "RateLimiter", { enumerable: true, get: function () { return access_js_1.RateLimiter; } });
Object.defineProperty(exports, "DistributedRateLimiter", { enumerable: true, get: function () { return access_js_1.DistributedRateLimiter; } });
Object.defineProperty(exports, "validators", { enumerable: true, get: function () { return access_js_1.validators; } });
Object.defineProperty(exports, "checkMaintenance", { enumerable: true, get: function () { return access_js_1.checkMaintenance; } });
Object.defineProperty(exports, "checkNSFW", { enumerable: true, get: function () { return access_js_1.checkNSFW; } });
Object.defineProperty(exports, "checkAccess", { enumerable: true, get: function () { return access_js_1.checkAccess; } });
Object.defineProperty(exports, "createErrorEmbed", { enumerable: true, get: function () { return access_js_1.createErrorEmbed; } });
Object.defineProperty(exports, "createWarningEmbed", { enumerable: true, get: function () { return access_js_1.createWarningEmbed; } });
Object.defineProperty(exports, "createSuccessEmbed", { enumerable: true, get: function () { return access_js_1.createSuccessEmbed; } });
Object.defineProperty(exports, "createInfoEmbed", { enumerable: true, get: function () { return access_js_1.createInfoEmbed; } });
Object.defineProperty(exports, "createCooldownEmbed", { enumerable: true, get: function () { return access_js_1.createCooldownEmbed; } });
Object.defineProperty(exports, "hasPermissions", { enumerable: true, get: function () { return access_js_1.hasPermissions; } });
Object.defineProperty(exports, "isServerAdmin", { enumerable: true, get: function () { return access_js_1.isServerAdmin; } });
Object.defineProperty(exports, "isServerOwner", { enumerable: true, get: function () { return access_js_1.isServerOwner; } });
Object.defineProperty(exports, "canModerate", { enumerable: true, get: function () { return access_js_1.canModerate; } });
Object.defineProperty(exports, "botCanModerate", { enumerable: true, get: function () { return access_js_1.botCanModerate; } });
Object.defineProperty(exports, "validateVideoUrl", { enumerable: true, get: function () { return access_js_1.validateVideoUrl; } });
// Re-export voice channel checks
var voiceChannelCheck_js_1 = require("./voiceChannelCheck.js");
Object.defineProperty(exports, "checkVoiceChannel", { enumerable: true, get: function () { return voiceChannelCheck_js_1.checkVoiceChannel; } });
Object.defineProperty(exports, "checkSameVoiceChannel", { enumerable: true, get: function () { return voiceChannelCheck_js_1.checkSameVoiceChannel; } });
Object.defineProperty(exports, "checkVoicePermissions", { enumerable: true, get: function () { return voiceChannelCheck_js_1.checkVoicePermissions; } });
Object.defineProperty(exports, "checkVoiceChannelSync", { enumerable: true, get: function () { return voiceChannelCheck_js_1.checkVoiceChannelSync; } });
Object.defineProperty(exports, "checkVoicePermissionsSync", { enumerable: true, get: function () { return voiceChannelCheck_js_1.checkVoicePermissionsSync; } });
// Re-export URL validation
var urlValidator_js_1 = require("./urlValidator.js");
Object.defineProperty(exports, "validateUrl", { enumerable: true, get: function () { return urlValidator_js_1.validateUrl; } });
Object.defineProperty(exports, "isBlockedHost", { enumerable: true, get: function () { return urlValidator_js_1.isBlockedHost; } });
Object.defineProperty(exports, "BLOCKED_HOST_PATTERNS", { enumerable: true, get: function () { return urlValidator_js_1.BLOCKED_HOST_PATTERNS; } });
// Default export with all modules
exports.default = {
    // Access module
    ...access,
    // Voice channel checks
    ...voiceChannelCheck,
    // URL validator
    ...urlValidator
};
//# sourceMappingURL=index.js.map