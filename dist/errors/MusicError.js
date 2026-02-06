"use strict";
/**
 * Music-specific Error Classes
 * @module errors/MusicError
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicError = void 0;
const AppError_js_1 = require("./AppError.js");
/**
 * Base music error - use only for catch blocks or instanceof checks.
 * @deprecated Prefer `Result.err(ErrorCodes.XXX)` pattern for new error flows.
 */
class MusicError extends AppError_js_1.AppError {
    /** @deprecated Use `Result.err(ErrorCodes.XXX)` instead. */
    constructor(message, code = 'MUSIC_ERROR') {
        super(message, code, 400);
    }
}
exports.MusicError = MusicError;
//# sourceMappingURL=MusicError.js.map