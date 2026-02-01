/**
 * Maintenance Configuration
 * Based on FumoBOT's maintenance system
 * @module config/maintenance
 */

const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const MAINTENANCE_FILE = path.join(__dirname, '..', 'data', 'maintenanceState.json');

// Default maintenance state
let maintenanceState = {
    enabled: false,
    reason: 'Scheduled maintenance',
    startTime: null,
    estimatedEnd: null,
    partialMode: false,
    disabledFeatures: [],
    allowedUsers: [],
    scheduledMaintenance: null
};

// Developer ID (can always bypass)
const DEVELOPER_ID = '1128296349566251068';

/**
 * Load maintenance state from file
 */
function loadMaintenanceState() {
    try {
        const dir = path.dirname(MAINTENANCE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (fs.existsSync(MAINTENANCE_FILE)) {
            const data = JSON.parse(fs.readFileSync(MAINTENANCE_FILE, 'utf8'));
            maintenanceState = { ...maintenanceState, ...data };
        }
    } catch (error) {
        console.error('[Maintenance] Failed to load state:', error.message);
    }
    return maintenanceState;
}

/**
 * Save maintenance state to file
 */
function saveMaintenanceState() {
    try {
        const dir = path.dirname(MAINTENANCE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(MAINTENANCE_FILE, JSON.stringify(maintenanceState, null, 2));
    } catch (error) {
        console.error('[Maintenance] Failed to save state:', error.message);
    }
}

// Initialize on load
loadMaintenanceState();

/**
 * Enable maintenance mode
 * @param {Object} options - Maintenance options
 */
function enableMaintenance(options = {}) {
    maintenanceState.enabled = true;
    maintenanceState.reason = options.reason || 'Scheduled maintenance';
    maintenanceState.startTime = Date.now();
    maintenanceState.estimatedEnd = options.estimatedEnd || null;
    maintenanceState.partialMode = options.partialMode || false;
    maintenanceState.disabledFeatures = options.disabledFeatures || [];
    
    if (!maintenanceState.allowedUsers.includes(DEVELOPER_ID)) {
        maintenanceState.allowedUsers.push(DEVELOPER_ID);
    }
    
    saveMaintenanceState();
    return maintenanceState;
}

/**
 * Disable maintenance mode
 */
function disableMaintenance() {
    maintenanceState.enabled = false;
    maintenanceState.reason = null;
    maintenanceState.startTime = null;
    maintenanceState.estimatedEnd = null;
    maintenanceState.partialMode = false;
    maintenanceState.disabledFeatures = [];
    
    saveMaintenanceState();
    return maintenanceState;
}

/**
 * Check if maintenance is active
 */
function isInMaintenance() {
    return maintenanceState.enabled;
}

/**
 * Check if user can bypass maintenance
 * @param {string} userId - User ID
 */
function canBypassMaintenance(userId) {
    return userId === DEVELOPER_ID || maintenanceState.allowedUsers.includes(userId);
}

/**
 * Check if user is allowed during maintenance
 * @param {string} userId - User ID
 */
function isAllowedDuringMaintenance(userId) {
    if (!maintenanceState.enabled) return true;
    return canBypassMaintenance(userId);
}

/**
 * Check if a specific feature is disabled
 * @param {string} featureName - Feature name
 */
function isFeatureDisabled(featureName) {
    if (!maintenanceState.enabled) return false;
    if (!maintenanceState.partialMode) return true; // All features disabled
    return maintenanceState.disabledFeatures.includes(featureName);
}

/**
 * Add user to bypass list
 * @param {string} userId - User ID
 */
function addBypassUser(userId) {
    if (!maintenanceState.allowedUsers.includes(userId)) {
        maintenanceState.allowedUsers.push(userId);
        saveMaintenanceState();
    }
}

/**
 * Remove user from bypass list
 * @param {string} userId - User ID
 */
function removeBypassUser(userId) {
    maintenanceState.allowedUsers = maintenanceState.allowedUsers.filter(id => id !== userId);
    saveMaintenanceState();
}

/**
 * Schedule future maintenance
 * @param {number} startTime - Start timestamp
 * @param {Object} options - Maintenance options
 */
function scheduleMaintenance(startTime, options = {}) {
    maintenanceState.scheduledMaintenance = {
        startTime,
        reason: options.reason || 'Scheduled maintenance',
        estimatedDuration: options.estimatedDuration || null,
        ...options
    };
    saveMaintenanceState();
    return maintenanceState.scheduledMaintenance;
}

/**
 * Cancel scheduled maintenance
 */
function cancelScheduledMaintenance() {
    maintenanceState.scheduledMaintenance = null;
    saveMaintenanceState();
}

/**
 * Get maintenance status for display
 */
function getMaintenanceStatus() {
    if (!maintenanceState.enabled) {
        return {
            active: false,
            message: null
        };
    }

    let timeInfo = '';
    if (maintenanceState.estimatedEnd) {
        const remaining = maintenanceState.estimatedEnd - Date.now();
        if (remaining > 0) {
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            timeInfo = `\n⏰ Estimated completion: ${hours}h ${minutes}m`;
        }
    }

    return {
        active: true,
        enabled: maintenanceState.enabled,
        reason: maintenanceState.reason,
        estimatedEnd: maintenanceState.estimatedEnd,
        startTime: maintenanceState.startTime,
        message: `🚧 **Maintenance Active**\n\n${maintenanceState.reason || 'Bot is undergoing maintenance.'}${timeInfo}\n\nThank you for your patience!`,
        partialMode: maintenanceState.partialMode,
        disabledFeatures: maintenanceState.disabledFeatures
    };
}

/**
 * Create maintenance embed
 */
function createMaintenanceEmbed() {
    const status = getMaintenanceStatus();
    
    const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('🚧 Maintenance Mode')
        .setDescription(status.message || 'Bot is currently in maintenance mode.')
        .setFooter({ text: 'alterGolden Bot' })
        .setTimestamp();

    if (maintenanceState.estimatedEnd) {
        embed.addFields({
            name: '⏰ Estimated End',
            value: `<t:${Math.floor(maintenanceState.estimatedEnd / 1000)}:R>`,
            inline: true
        });
    }

    if (maintenanceState.startTime) {
        embed.addFields({
            name: '🕐 Started',
            value: `<t:${Math.floor(maintenanceState.startTime / 1000)}:R>`,
            inline: true
        });
    }

    if (maintenanceState.partialMode && maintenanceState.disabledFeatures.length > 0) {
        embed.addFields({
            name: '🔧 Disabled Features',
            value: maintenanceState.disabledFeatures.join(', '),
            inline: false
        });
    }

    return embed;
}

/**
 * Get the full state object
 */
function getMaintenanceState() {
    return { ...maintenanceState };
}

module.exports = {
    DEVELOPER_ID,
    enableMaintenance,
    disableMaintenance,
    isInMaintenance,
    canBypassMaintenance,
    isAllowedDuringMaintenance,
    isFeatureDisabled,
    addBypassUser,
    removeBypassUser,
    scheduleMaintenance,
    cancelScheduledMaintenance,
    getMaintenanceStatus,
    createMaintenanceEmbed,
    getMaintenanceState,
    loadMaintenanceState,
    saveMaintenanceState
};
