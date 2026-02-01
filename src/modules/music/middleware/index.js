/**
 * Module Middleware Compatibility Layer
 * Provides checkAccess and AccessType for all modules
 */

const { EmbedBuilder } = require('discord.js');

// Try to load maintenance config from multiple possible paths
let maintenanceConfig = null;

try {
    maintenanceConfig = require('../../../config/maintenance');
} catch (e) {
    try {
        maintenanceConfig = require('../../config/maintenance');
    } catch (e2) {
        console.log('[Middleware] Using fallback maintenance config');
        maintenanceConfig = {
            getSystemState: () => ({ enabled: false }),
            canBypassMaintenance: () => false
        };
    }
}

// Access Types
const AccessType = {
    SUB: 'sub',
    MAIN: 'main',
    BOTH: 'both'
};

/**
 * Check access for a command
 */
async function checkAccess(interaction, accessType = AccessType.SUB) {
    const userId = interaction.user?.id;
    
    try {
        const maintenanceState = maintenanceConfig.getSystemState('sub');
        
        if (maintenanceState?.enabled) {
            if (maintenanceConfig.canBypassMaintenance(userId)) {
                return { blocked: false };
            }
            
            const embed = new EmbedBuilder()
                .setTitle('🔧 System Maintenance')
                .setColor(0xFFAA00)
                .setDescription(`alterGolden is currently under maintenance.\n\n**Reason:** ${maintenanceState.reason || 'Scheduled maintenance'}`)
                .setTimestamp();
            
            if (maintenanceState.estimatedEnd) {
                embed.addFields({
                    name: '⏰ Estimated Return',
                    value: `<t:${Math.floor(maintenanceState.estimatedEnd / 1000)}:R>`,
                    inline: true
                });
            }
            
            return { blocked: true, embed };
        }
    } catch (error) {
        console.error('[Middleware] checkAccess error:', error.message);
    }
    
    return { blocked: false };
}

async function checkSubAccess(interaction) {
    return checkAccess(interaction, AccessType.SUB);
}

module.exports = {
    checkAccess,
    checkSubAccess,
    AccessType
};
