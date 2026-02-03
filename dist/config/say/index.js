"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_CHANNEL_ID = exports.OWNER_ID = exports.TYPE_COLORS = void 0;
/**
 * Say Command Config
 * @module config/say
 */
// TYPE COLORS
exports.TYPE_COLORS = {
    default: 0x5865F2,
    normal: 0x5865F2,
    success: 0x57F287,
    warning: 0xFEE75C,
    error: 0xED4245,
    info: 0x5865F2
};
// OWNER SETTINGS
exports.OWNER_ID = process.env.OWNER_ID || '';
exports.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || '';
// DEFAULT EXPORT
exports.default = {
    TYPE_COLORS: exports.TYPE_COLORS,
    OWNER_ID: exports.OWNER_ID,
    LOG_CHANNEL_ID: exports.LOG_CHANNEL_ID
};
//# sourceMappingURL=index.js.map