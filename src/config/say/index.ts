/**
 * Say Command Config
 * @module config/say
 */
// TYPE COLORS
export const TYPE_COLORS: Record<string, number> = {
    default: 0x5865F2,
    normal: 0x5865F2,
    success: 0x57F287,
    warning: 0xFEE75C,
    error: 0xED4245,
    info: 0x5865F2
};
// OWNER SETTINGS
export const OWNER_ID: string = process.env.OWNER_ID || '';
export const LOG_CHANNEL_ID: string = process.env.LOG_CHANNEL_ID || '';
// DEFAULT EXPORT
export default {
    TYPE_COLORS,
    OWNER_ID,
    LOG_CHANNEL_ID
};
