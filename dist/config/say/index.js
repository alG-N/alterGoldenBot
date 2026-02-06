"use strict";
/**
 * Say Command Config
 * @module config/say
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_CHANNEL_ID = exports.OWNER_ID = exports.TYPE_COLORS = void 0;
const owner_js_1 = require("../owner.js");
// TYPE COLORS
exports.TYPE_COLORS = {
    default: 0x5865F2,
    normal: 0x5865F2,
    success: 0x57F287,
    warning: 0xFEE75C,
    error: 0xED4245,
    info: 0x5865F2
};
/**
 * @deprecated Use DEVELOPER_ID from config/owner.ts directly
 */
exports.OWNER_ID = owner_js_1.DEVELOPER_ID;
exports.LOG_CHANNEL_ID = process.env.SYSTEM_LOG_CHANNEL_ID || '';
// DEFAULT EXPORT
exports.default = {
    TYPE_COLORS: exports.TYPE_COLORS,
    OWNER_ID: exports.OWNER_ID,
    LOG_CHANNEL_ID: exports.LOG_CHANNEL_ID
};
//# sourceMappingURL=index.js.map