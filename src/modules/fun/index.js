/**
 * Fun Module Exports
 * Services, utilities for fun commands
 * NOTE: Commands are loaded from src/commands/fun/ by CommandRegistry
 * @module modules/fun
 */

// Services
const BattleService = require('./services/DeathbattleService/BattleService');
const SkillsetService = require('./services/DeathbattleService/SkillsetService');
const SayService = require('./services/SayService/SayService');

// Config
const deathBattleConfig = require('./config/Deathbattle/deathBattleConfig');
const sayConfig = require('./config/Say/sayConfig');

// Utilities
const deathbattleEmbedBuilder = require('./utility/DeathbattleUtility/embedBuilder');
const deathbattleLogger = require('./utility/DeathbattleUtility/logger');
const sayLogger = require('./utility/SayUtility/logger');

module.exports = {
    // Services
    services: {
        BattleService,
        SkillsetService,
        SayService
    },
    
    // Individual service exports
    BattleService,
    SkillsetService,
    SayService,
    
    // Config
    config: {
        deathBattle: deathBattleConfig,
        say: sayConfig
    },
    
    // Utilities
    utilities: {
        deathbattle: {
            embedBuilder: deathbattleEmbedBuilder,
            logger: deathbattleLogger
        },
        say: {
            logger: sayLogger
        }
    }
};
