/**
 * Deathbattle Config
 * @module config/deathbattle
 */

export interface DeathbattleConfig {
    enabled: boolean;
    maxRounds: number;
    LOG_CHANNEL_ID: string;
}

const deathbattleConfig: DeathbattleConfig = {
    enabled: true,
    maxRounds: 10,
    LOG_CHANNEL_ID: process.env.SYSTEM_LOG_CHANNEL_ID || ''
};

export default deathbattleConfig;
