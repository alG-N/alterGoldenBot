"use strict";
/**
 * Pagination Utilities
 * Shared pagination for Discord embeds
 * @module utils/common/pagination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalPaginationState = exports.PaginationState = void 0;
exports.createPaginationButtons = createPaginationButtons;
exports.createSimplePagination = createSimplePagination;
exports.disablePaginationButtons = disablePaginationButtons;
exports.parsePaginationButton = parsePaginationButton;
exports.getNewPage = getNewPage;
const discord_js_1 = require("discord.js");
// PAGINATION BUTTON FUNCTIONS
/**
 * Create pagination buttons
 * @param currentPage - Current page (0-indexed)
 * @param totalPages - Total pages
 * @param prefix - Button ID prefix
 * @param userId - User ID (to filter button clicks)
 * @param disabled - Disable all buttons
 */
function createPaginationButtons(currentPage, totalPages, prefix, userId, disabled = false) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`${prefix}_first_${userId}`)
        .setLabel('⏮')
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(disabled || currentPage === 0), new discord_js_1.ButtonBuilder()
        .setCustomId(`${prefix}_prev_${userId}`)
        .setLabel('◀')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === 0), new discord_js_1.ButtonBuilder()
        .setCustomId(`${prefix}_page_${userId}`)
        .setLabel(`${currentPage + 1} / ${totalPages}`)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(true), new discord_js_1.ButtonBuilder()
        .setCustomId(`${prefix}_next_${userId}`)
        .setLabel('▶')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(disabled || currentPage >= totalPages - 1), new discord_js_1.ButtonBuilder()
        .setCustomId(`${prefix}_last_${userId}`)
        .setLabel('⏭')
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(disabled || currentPage >= totalPages - 1));
}
/**
 * Create simple prev/next pagination
 * @param currentPage - Current page (0-indexed)
 * @param totalPages - Total pages
 * @param prefix - Button ID prefix
 * @param userId - User ID
 * @param disabled - Disable all buttons
 */
function createSimplePagination(currentPage, totalPages, prefix, userId, disabled = false) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`${prefix}_prev_${userId}`)
        .setLabel('◀ Previous')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === 0), new discord_js_1.ButtonBuilder()
        .setCustomId(`${prefix}_page_${userId}`)
        .setLabel(`Page ${currentPage + 1}/${totalPages}`)
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(true), new discord_js_1.ButtonBuilder()
        .setCustomId(`${prefix}_next_${userId}`)
        .setLabel('Next ▶')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setDisabled(disabled || currentPage >= totalPages - 1));
}
/**
 * Disable all pagination buttons
 * @param currentPage - Current page
 * @param totalPages - Total pages
 * @param prefix - Button ID prefix
 * @param userId - User ID
 */
function disablePaginationButtons(currentPage, totalPages, prefix, userId) {
    return createPaginationButtons(currentPage, totalPages, prefix, userId, true);
}
/**
 * Parse pagination button interaction
 * @param customId - Button custom ID
 */
function parsePaginationButton(customId) {
    const parts = customId.split('_');
    if (parts.length < 3)
        return null;
    const action = parts[parts.length - 2];
    const userId = parts[parts.length - 1];
    const prefix = parts.slice(0, -2).join('_');
    if (!['first', 'prev', 'next', 'last', 'page'].includes(action)) {
        return null;
    }
    return {
        prefix,
        action: action,
        userId
    };
}
/**
 * Calculate new page based on action
 * @param action - Pagination action
 * @param currentPage - Current page
 * @param totalPages - Total pages
 */
function getNewPage(action, currentPage, totalPages) {
    switch (action) {
        case 'first': return 0;
        case 'prev': return Math.max(0, currentPage - 1);
        case 'next': return Math.min(totalPages - 1, currentPage + 1);
        case 'last': return totalPages - 1;
        default: return currentPage;
    }
}
// PAGINATION STATE CLASS
/**
 * Pagination State Manager
 * Tracks pagination state with auto-expiry
 * NOTE: Uses WeakRef-like pattern with cleanup on access for memory safety
 */
class PaginationState {
    states = new Map();
    expiryMs;
    cleanupInterval = null;
    static instances = new Set();
    constructor(expiryMs = 300000) {
        this.expiryMs = expiryMs;
        // Auto cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => this._cleanup(), 300000);
        // Track instance for global cleanup
        PaginationState.instances.add(this);
    }
    /**
     * Static method to destroy all instances (call on shutdown)
     */
    static destroyAll() {
        for (const instance of PaginationState.instances) {
            instance.destroy();
        }
        PaginationState.instances.clear();
    }
    set(userId, key, value) {
        const userKey = `${userId}_${key}`;
        this.states.set(userKey, {
            value,
            timestamp: Date.now()
        });
    }
    get(userId, key) {
        const userKey = `${userId}_${key}`;
        const entry = this.states.get(userKey);
        if (!entry)
            return undefined;
        if (Date.now() - entry.timestamp > this.expiryMs) {
            this.states.delete(userKey);
            return undefined;
        }
        return entry.value;
    }
    update(userId, key, updater) {
        const current = this.get(userId, key);
        this.set(userId, key, updater(current));
    }
    delete(userId, key) {
        const userKey = `${userId}_${key}`;
        this.states.delete(userKey);
    }
    clear(userId) {
        if (!userId) {
            this.states.clear();
            return;
        }
        for (const key of this.states.keys()) {
            if (key.startsWith(`${userId}_`)) {
                this.states.delete(key);
            }
        }
    }
    _cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.states.entries()) {
            if (now - entry.timestamp > this.expiryMs) {
                this.states.delete(key);
            }
        }
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.states.clear();
        PaginationState.instances.delete(this);
    }
}
exports.PaginationState = PaginationState;
// GLOBAL INSTANCE
// Global pagination state instance
exports.globalPaginationState = new PaginationState();
//# sourceMappingURL=pagination.js.map