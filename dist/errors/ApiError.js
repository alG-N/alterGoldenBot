"use strict";
/**
 * API-specific Error Classes
 * @module errors/ApiError
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
const AppError_js_1 = require("./AppError.js");
/**
 * Base API error - use only for catch blocks or instanceof checks.
 * @deprecated Prefer `Result.err(ErrorCodes.XXX)` pattern for new error flows.
 */
class ApiError extends AppError_js_1.AppError {
    service;
    /** @deprecated Use `Result.err(ErrorCodes.XXX)` instead. */
    constructor(message, code = 'API_ERROR', service = null) {
        super(message, code, 400);
        this.service = service;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            service: this.service,
        };
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=ApiError.js.map