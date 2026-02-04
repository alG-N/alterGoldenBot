"use strict";
/**
 * Cooldown Manager
 * Shared cooldown tracking for commands and features
 * Uses Redis via CacheService for shard-safe distributed cooldowns
 * @module utils/common/cooldown
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalCooldownManager = exports.CooldownManager = void 0;
exports.checkCooldown = checkCooldown;
exports.clearCooldown = clearCooldown;
const CacheService_js_1 = __importDefault(require("../../cache/CacheService.js"));
// COOLDOWN MANAGER CLASS
/**
 * Shard-safe cooldown manager using Redis-backed CacheService
 */
class CooldownManager {
    defaultCooldown;
    prefix;
    /**
     * @param options - Configuration options
     */
    constructor(options = {}) {
        this.defaultCooldown = options.defaultCooldown || 3000;
        this.prefix = options.prefix || '';
    }
    /**
     * Generate cache key
     * @private
     */
    _getKey(userId, commandName) {
        return this.prefix ? `${this.prefix}:${commandName}` : commandName;
    }
    /**
     * Check if user is on cooldown
     * @param userId - User ID
     * @param commandName - Command name
     * @param cooldownMs - Cooldown duration (uses default if not provided)
     */
    async check(userId, commandName, _cooldownMs = this.defaultCooldown) {
        const key = this._getKey(userId, commandName);
        const remaining = await CacheService_js_1.default.getCooldown(key, userId);
        if (remaining === null || remaining <= 0) {
            return { onCooldown: false, remaining: 0 };
        }
        return { onCooldown: true, remaining };
    }
    /**
     * Set cooldown for user
     * @param userId - User ID
     * @param commandName - Command name
     * @param cooldownMs - Cooldown duration
     */
    async set(userId, commandName, cooldownMs = this.defaultCooldown) {
        const key = this._getKey(userId, commandName);
        await CacheService_js_1.default.setCooldown(key, userId, cooldownMs);
    }
    /**
     * Check and set cooldown in one operation (atomic, shard-safe)
     * @param userId - User ID
     * @param commandName - Command name
     * @param cooldownMs - Cooldown duration
     */
    async checkAndSet(userId, commandName, cooldownMs = this.defaultCooldown) {
        const key = this._getKey(userId, commandName);
        return CacheService_js_1.default.checkAndSetCooldown(key, userId, cooldownMs);
    }
    /**
     * Clear cooldown for user
     * @param userId - User ID
     * @param commandName - Command name
     */
    async clear(userId, commandName) {
        const key = this._getKey(userId, commandName);
        await CacheService_js_1.default.clearCooldown(key, userId);
    }
    /**
     * Clear all cooldowns for a user
     * @param userId - User ID
     */
    async clearUser(userId) {
        await CacheService_js_1.default.clearUserCooldowns(userId);
    }
    /**
     * Get remaining cooldown time
     * @param userId - User ID
     * @param commandName - Command name
     * @returns Remaining time in ms (0 if not on cooldown)
     */
    async getRemaining(userId, commandName) {
        const result = await this.check(userId, commandName);
        return result.remaining;
    }
    /**
     * Get stats for monitoring (placeholder - stats now in CacheService)
     */
    getStats() {
        return {
            totalEntries: 0,
            memoryEstimate: 0
        };
    }
    /**
     * Destroy the cooldown manager (no-op with CacheService backend)
     */
    destroy() {
        // No-op - CacheService handles cleanup
    }
}
exports.CooldownManager = CooldownManager;
// GLOBAL INSTANCE & EXPORTS
// Global cooldown manager instance
exports.globalCooldownManager = new CooldownManager();
// Convenience functions using global manager (now async)
async function checkCooldown(userId, commandName, cooldownMs) {
    return exports.globalCooldownManager.checkAndSet(userId, commandName, cooldownMs);
}
async function clearCooldown(userId, commandName) {
    return exports.globalCooldownManager.clear(userId, commandName);
}
//# sourceMappingURL=cooldown.js.map