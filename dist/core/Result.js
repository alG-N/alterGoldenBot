"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
// RESULT CLASS
/**
 * Result class for consistent service returns
 * Implements Railway-Oriented Programming pattern
 */
class Result {
    success;
    data;
    error;
    code;
    details;
    constructor(success, data, error, code, details = null) {
        this.success = success;
        this.data = data;
        this.error = error;
        this.code = code;
        this.details = details;
    }
    static ok(data) {
        return new Result(true, data ?? null, null, null, null);
    }
    /**
     * Create an error result
     */
    static err(code, message, details = null) {
        return new Result(false, null, message, code, details);
    }
    /**
     * Create error from an exception
     */
    static fromError(error, code = 'INTERNAL_ERROR') {
        return new Result(false, null, error.message, code, { stack: error.stack, name: error.name });
    }
    /**
     * Check if result is success
     */
    isOk() {
        return this.success === true;
    }
    /**
     * Check if result is error
     */
    isErr() {
        return this.success === false;
    }
    /**
     * Get data or throw if error
     */
    unwrap() {
        if (this.isErr()) {
            const error = new Error(this.error ?? 'Unknown error');
            error.code = this.code ?? undefined;
            throw error;
        }
        return this.data;
    }
    /**
     * Get data or return default value
     */
    unwrapOr(defaultValue) {
        return this.isOk() ? this.data : defaultValue;
    }
    /**
     * Map success data to new value
     */
    map(fn) {
        if (this.isErr()) {
            return Result.err(this.code ?? 'UNKNOWN', this.error ?? 'Unknown error', this.details);
        }
        return Result.ok(fn(this.data));
    }
    /**
     * Chain another Result-returning function
     */
    flatMap(fn) {
        if (this.isErr()) {
            return Result.err(this.code ?? 'UNKNOWN', this.error ?? 'Unknown error', this.details);
        }
        return fn(this.data);
    }
    /**
     * Convert to plain object (for JSON serialization)
     */
    toJSON() {
        return {
            success: this.success,
            data: this.data,
            error: this.error,
            code: this.code,
            ...(this.details && { details: this.details })
        };
    }
    /**
     * Convert to Discord-friendly reply format
     */
    toReply(options = {}) {
        const { successMessage, ephemeral = false } = options;
        if (this.isOk()) {
            return {
                content: successMessage || '✅ Success!',
                ephemeral
            };
        }
        return {
            content: `❌ ${this.error}`,
            ephemeral: true
        };
    }
}
exports.Result = Result;
//# sourceMappingURL=Result.js.map