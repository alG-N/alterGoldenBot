"use strict";
/**
 * Video-specific Error Classes
 * @module errors/VideoError
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoError = void 0;
const AppError_js_1 = require("./AppError.js");
/**
 * Base video error - use only for catch blocks or instanceof checks.
 * @deprecated Prefer `Result.err(ErrorCodes.XXX)` pattern for new error flows.
 */
class VideoError extends AppError_js_1.AppError {
    /** @deprecated Use `Result.err(ErrorCodes.XXX)` instead. */
    constructor(message, code = 'VIDEO_ERROR') {
        super(message, code, 400);
    }
}
exports.VideoError = VideoError;
//# sourceMappingURL=VideoError.js.map