"use strict";
/**
 * Video Commands Index
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.video = void 0;
var video_js_1 = require("./video.js");
Object.defineProperty(exports, "video", { enumerable: true, get: function () { return __importDefault(video_js_1).default; } });
// CommonJS compatibility for command loader
const getCmd = (mod) => mod.default || mod;
module.exports = {
    video: getCmd(require('./video')),
};
//# sourceMappingURL=index.js.map