"use strict";
/**
 * Maintenance Configuration
 * Based on FumoBOT's maintenance system
 * @module config/maintenance
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEVELOPER_ID = void 0;
exports.loadMaintenanceState = loadMaintenanceState;
exports.saveMaintenanceState = saveMaintenanceState;
exports.enableMaintenance = enableMaintenance;
exports.disableMaintenance = disableMaintenance;
exports.isInMaintenance = isInMaintenance;
exports.canBypassMaintenance = canBypassMaintenance;
exports.isAllowedDuringMaintenance = isAllowedDuringMaintenance;
exports.isFeatureDisabled = isFeatureDisabled;
exports.addBypassUser = addBypassUser;
exports.removeBypassUser = removeBypassUser;
exports.scheduleMaintenance = scheduleMaintenance;
exports.cancelScheduledMaintenance = cancelScheduledMaintenance;
exports.getMaintenanceStatus = getMaintenanceStatus;
exports.createMaintenanceEmbed = createMaintenanceEmbed;
exports.getMaintenanceState = getMaintenanceState;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const discord_js_1 = require("discord.js");
// STATE
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
exports.DEVELOPER_ID = '1128296349566251068';
// STATE MANAGEMENT
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('[Maintenance] Failed to save state:', error.message);
    }
}
// Initialize on load
loadMaintenanceState();
// MAINTENANCE CONTROL
/**
 * Enable maintenance mode
 */
function enableMaintenance(options = {}) {
    maintenanceState.enabled = true;
    maintenanceState.reason = options.reason || 'Scheduled maintenance';
    maintenanceState.startTime = Date.now();
    maintenanceState.estimatedEnd = options.estimatedEnd || null;
    maintenanceState.partialMode = options.partialMode || false;
    maintenanceState.disabledFeatures = options.disabledFeatures || [];
    if (!maintenanceState.allowedUsers.includes(exports.DEVELOPER_ID)) {
        maintenanceState.allowedUsers.push(exports.DEVELOPER_ID);
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
 */
function canBypassMaintenance(userId) {
    return userId === exports.DEVELOPER_ID || maintenanceState.allowedUsers.includes(userId);
}
/**
 * Check if user is allowed during maintenance
 */
function isAllowedDuringMaintenance(userId) {
    if (!maintenanceState.enabled)
        return true;
    return canBypassMaintenance(userId);
}
/**
 * Check if a specific feature is disabled
 */
function isFeatureDisabled(featureName) {
    if (!maintenanceState.enabled)
        return false;
    if (!maintenanceState.partialMode)
        return true; // All features disabled
    return maintenanceState.disabledFeatures.includes(featureName);
}
// USER MANAGEMENT
/**
 * Add user to bypass list
 */
function addBypassUser(userId) {
    if (!maintenanceState.allowedUsers.includes(userId)) {
        maintenanceState.allowedUsers.push(userId);
        saveMaintenanceState();
    }
}
/**
 * Remove user from bypass list
 */
function removeBypassUser(userId) {
    maintenanceState.allowedUsers = maintenanceState.allowedUsers.filter(id => id !== userId);
    saveMaintenanceState();
}
// SCHEDULING
/**
 * Schedule future maintenance
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
// STATUS & DISPLAY
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
    const embed = new discord_js_1.EmbedBuilder()
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
exports.default = {
    DEVELOPER_ID: exports.DEVELOPER_ID,
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
//# sourceMappingURL=maintenance.js.map