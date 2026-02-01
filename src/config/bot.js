/**
 * Bot Configuration
 * Main configuration file for alterGolden Discord Bot
 * @module config/bot
 */

module.exports = {
    // Bot identification
    clientId: '1467027746906701951',
    
    // Command deployment
    autoDeploy: true,
    
    // Presence settings
    presence: {
        status: 'online',
        activity: '/help | alterGolden',
        activityType: 'PLAYING' // PLAYING, STREAMING, LISTENING, WATCHING, COMPETING
    }
};
