"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalCooldownManager = exports.CooldownManager = void 0;
exports.checkCooldown = checkCooldown;
exports.clearCooldown = clearCooldown;
// COOLDOWN MANAGER CLASS
class CooldownManager {
    cooldowns = new Map();
    defaultCooldown;
    cleanupInterval;
    /**
     * @param options - Configuration options
     */
    constructor(options = {}) {
        this.defaultCooldown = options.defaultCooldown || 3000;
        // Auto cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => this._cleanup(), options.cleanupInterval || 300000);
    }
    /**
     * Generate cache key
     * @private
     */
    _getKey(userId, commandName) {
        return `${userId}:${commandName}`;
    }
    /**
     * Check if user is on cooldown
     * @param userId - User ID
     * @param commandName - Command name
     * @param cooldownMs - Cooldown duration (uses default if not provided)
     */
    check(userId, commandName, _cooldownMs = this.defaultCooldown) {
        const key = this._getKey(userId, commandName);
        const entry = this.cooldowns.get(key);
        if (!entry) {
            return { onCooldown: false, remaining: 0 };
        }
        const elapsed = Date.now() - entry.timestamp;
        const remaining = entry.duration - elapsed;
        if (remaining <= 0) {
            this.cooldowns.delete(key);
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
    set(userId, commandName, cooldownMs = this.defaultCooldown) {
        const key = this._getKey(userId, commandName);
        this.cooldowns.set(key, {
            timestamp: Date.now(),
            duration: cooldownMs
        });
    }
    /**
     * Check and set cooldown in one operation
     * @param userId - User ID
     * @param commandName - Command name
     * @param cooldownMs - Cooldown duration
     */
    checkAndSet(userId, commandName, cooldownMs = this.defaultCooldown) {
        const result = this.check(userId, commandName, cooldownMs);
        if (!result.onCooldown) {
            this.set(userId, commandName, cooldownMs);
            return { passed: true, remaining: 0 };
        }
        return { passed: false, remaining: result.remaining };
    }
    /**
     * Clear cooldown for user
     * @param userId - User ID
     * @param commandName - Command name
     */
    clear(userId, commandName) {
        const key = this._getKey(userId, commandName);
        this.cooldowns.delete(key);
    }
    /**
     * Clear all cooldowns for a user
     * @param userId - User ID
     */
    clearUser(userId) {
        for (const key of this.cooldowns.keys()) {
            if (key.startsWith(`${userId}:`)) {
                this.cooldowns.delete(key);
            }
        }
    }
    /**
     * Get remaining cooldown time
     * @param userId - User ID
     * @param commandName - Command name
     * @returns Remaining time in ms (0 if not on cooldown)
     */
    getRemaining(userId, commandName) {
        const result = this.check(userId, commandName);
        return result.remaining;
    }
    /**
     * Cleanup expired cooldowns
     * @private
     */
    _cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cooldowns) {
            if (now - entry.timestamp > entry.duration) {
                this.cooldowns.delete(key);
            }
        }
    }
    /**
     * Get stats for monitoring
     */
    getStats() {
        return {
            totalEntries: this.cooldowns.size,
            memoryEstimate: this.cooldowns.size * 100 // rough estimate in bytes
        };
    }
    /**
     * Destroy the cooldown manager
     */
    destroy() {
        clearInterval(this.cleanupInterval);
        this.cooldowns.clear();
    }
}
exports.CooldownManager = CooldownManager;
// GLOBAL INSTANCE & EXPORTS
// Global cooldown manager instance
exports.globalCooldownManager = new CooldownManager();
// Convenience functions using global manager
function checkCooldown(userId, commandName, cooldownMs) {
    return exports.globalCooldownManager.checkAndSet(userId, commandName, cooldownMs);
}
function clearCooldown(userId, commandName) {
    return exports.globalCooldownManager.clear(userId, commandName);
}
//# sourceMappingURL=cooldown.js.map