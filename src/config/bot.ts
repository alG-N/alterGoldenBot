/**
 * Bot Configuration
 * Main configuration file for alterGolden Discord Bot
 * @module config/bot
 */

export const clientId = process.env.CLIENT_ID || '1467027746906701951';

export const autoDeploy = process.env.AUTO_DEPLOY !== 'false';

export const presence = {
    status: 'online' as const,
    activity: '/help | alterGolden',
    activityType: 'PLAYING' as const
};

export default {
    clientId,
    autoDeploy,
    presence
};
