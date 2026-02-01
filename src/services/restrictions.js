/**
 * Restrictions Middleware
 * Handles access control for bot commands
 * @module middleware/restrictions
 */

const { isInMaintenance, isAllowedDuringMaintenance, getMaintenanceState } = require('../config/maintenance');
const { isOwner } = require('../config/owner');
const { EmbedBuilder } = require('discord.js');

/**
 * Check if user can execute command (maintenance check)
 * @param {Interaction} interaction - Discord interaction
 * @returns {boolean} Whether user can proceed
 */
async function canExecute(interaction) {
    const userId = interaction.user.id;

    // Check maintenance mode
    if (isInMaintenance() && !isAllowedDuringMaintenance(userId)) {
        const state = getMaintenanceState();
        
        const embed = new EmbedBuilder()
            .setTitle('🔧 Bot Under Maintenance')
            .setDescription(state.reason || 'The bot is currently under maintenance.')
            .setColor(0xFFA500)
            .setTimestamp();

        if (state.estimatedEnd) {
            embed.addFields({
                name: '⏰ Estimated End',
                value: `<t:${Math.floor(state.estimatedEnd / 1000)}:R>`,
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
        return false;
    }

    return true;
}

/**
 * Check if user is an owner
 * @param {string} userId - Discord user ID
 * @returns {boolean} Whether user is an owner
 */
function checkOwner(userId) {
    return isOwner(userId);
}

/**
 * Middleware wrapper for commands
 * @param {Function} execute - Command execute function
 * @returns {Function} Wrapped execute function
 */
function withRestrictions(execute) {
    return async (interaction) => {
        if (!await canExecute(interaction)) {
            return;
        }
        return execute(interaction);
    };
}

module.exports = {
    canExecute,
    checkOwner,
    withRestrictions,
    isInMaintenance,
    isAllowedDuringMaintenance
};
