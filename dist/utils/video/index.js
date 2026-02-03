"use strict";
/**
 * Video Utilities Index
 * @module utils/video
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
exports.VideoEmbedBuilder = exports.ProgressAnimator = exports.PlatformDetector = exports.videoEmbedBuilder = exports.progressAnimator = exports.platformDetector = void 0;
const platformDetector_js_1 = __importStar(require("./platformDetector.js"));
exports.platformDetector = platformDetector_js_1.default;
Object.defineProperty(exports, "PlatformDetector", { enumerable: true, get: function () { return platformDetector_js_1.PlatformDetector; } });
const progressAnimator_js_1 = __importStar(require("./progressAnimator.js"));
exports.progressAnimator = progressAnimator_js_1.default;
Object.defineProperty(exports, "ProgressAnimator", { enumerable: true, get: function () { return progressAnimator_js_1.ProgressAnimator; } });
const videoEmbedBuilder_js_1 = __importStar(require("./videoEmbedBuilder.js"));
exports.videoEmbedBuilder = videoEmbedBuilder_js_1.default;
Object.defineProperty(exports, "VideoEmbedBuilder", { enumerable: true, get: function () { return videoEmbedBuilder_js_1.VideoEmbedBuilder; } });
// Default exports
exports.default = {
    platformDetector: platformDetector_js_1.default,
    progressAnimator: progressAnimator_js_1.default,
    videoEmbedBuilder: videoEmbedBuilder_js_1.default
};
//# sourceMappingURL=index.js.map