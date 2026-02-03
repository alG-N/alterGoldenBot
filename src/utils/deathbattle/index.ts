/**
 * DeathBattle Utilities Index
 * @module utils/deathbattle
 */

import deathBattleEmbedBuilder, { DeathBattleEmbedBuilder, BattleState, Player, Skillset } from './embedBuilder.js';
import deathBattleLogger, { DeathBattleLogger } from './logger.js';

// Default export
export default {
    embedBuilder: deathBattleEmbedBuilder,
    logger: deathBattleLogger
};

// Named exports
export {
    deathBattleEmbedBuilder,
    deathBattleEmbedBuilder as embedBuilder,
    deathBattleLogger,
    deathBattleLogger as logger,
    // Classes
    DeathBattleEmbedBuilder,
    DeathBattleLogger,
};

// Types
export type {
    BattleState,
    Player,
    Skillset
};
