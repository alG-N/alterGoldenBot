/**
 * Cooldown Middleware
 * Handles command cooldowns
 * @module middleware/cooldown
 */

const cooldowns = new Map();

/**
 * Check and apply cooldown for a user
 * @param {string} userId - User ID
 * @param {string} commandName - Command name
 * @param {number} cooldownMs - Cooldown duration in milliseconds
 * @returns {Object} Result with passed status and remaining time
 */
function checkCooldown(userId, commandName, cooldownMs) {
    const key = `${userId}-${commandName}`;
    const now = Date.now();
    
    if (cooldowns.has(key)) {
        const expirationTime = cooldowns.get(key);
        if (now < expirationTime) {
            const remaining = Math.ceil((expirationTime - now) / 1000);
            return { 
                passed: false, 
                remaining,
                message: `Please wait ${remaining} second(s) before using this command again.`
            };
        }
    }
    
    cooldowns.set(key, now + cooldownMs);
    return { passed: true };
}

/**
 * Clear cooldown for a user
 * @param {string} userId - User ID
 * @param {string} commandName - Command name
 */
function clearCooldown(userId, commandName) {
    const key = `${userId}-${commandName}`;
    cooldowns.delete(key);
}

/**
 * Clear all cooldowns for a user
 * @param {string} userId - User ID
 */
function clearUserCooldowns(userId) {
    for (const key of cooldowns.keys()) {
        if (key.startsWith(`${userId}-`)) {
            cooldowns.delete(key);
        }
    }
}

/**
 * Middleware wrapper for cooldowns
 * @param {number} cooldownMs - Cooldown in milliseconds
 * @returns {Function} Middleware function
 */
function withCooldown(cooldownMs) {
    return (execute) => {
        return async (interaction) => {
            const result = checkCooldown(
                interaction.user.id, 
                interaction.commandName, 
                cooldownMs
            );
            
            if (!result.passed) {
                await interaction.reply({ 
                    content: `⏳ ${result.message}`, 
                    ephemeral: true 
                });
                return;
            }
            
            return execute(interaction);
        };
    };
}

module.exports = {
    checkCooldown,
    clearCooldown,
    clearUserCooldowns,
    withCooldown
};
