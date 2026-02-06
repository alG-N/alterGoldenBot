"use strict";
/**
 * Bot Configuration
 * Main configuration file for alterGolden Discord Bot
 * @module config/bot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.presence = exports.autoDeploy = exports.clientId = void 0;
exports.clientId = process.env.CLIENT_ID || '';
exports.autoDeploy = process.env.AUTO_DEPLOY !== 'false';
exports.presence = {
    status: 'online',
    activity: '/help | alterGolden',
    activityType: 'PLAYING'
};
exports.default = {
    clientId: exports.clientId,
    autoDeploy: exports.autoDeploy,
    presence: exports.presence
};
//# sourceMappingURL=bot.js.map