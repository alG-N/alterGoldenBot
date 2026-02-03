/**
 * Cooldown Manager
 * Shared cooldown tracking for commands and features
 * @module utils/common/cooldown
 */
// TYPES
interface CooldownEntry {
    timestamp: number;
    duration: number;
}

interface CooldownCheckResult {
    onCooldown: boolean;
    remaining: number;
}

interface CooldownCheckAndSetResult {
    passed: boolean;
    remaining: number;
}

interface CooldownStats {
    totalEntries: number;
    memoryEstimate: number;
}

interface CooldownManagerOptions {
    defaultCooldown?: number;
    cleanupInterval?: number;
}
// COOLDOWN MANAGER CLASS
export class CooldownManager {
    private cooldowns: Map<string, CooldownEntry> = new Map();
    private defaultCooldown: number;
    private cleanupInterval: ReturnType<typeof setInterval>;

    /**
     * @param options - Configuration options
     */
    constructor(options: CooldownManagerOptions = {}) {
        this.defaultCooldown = options.defaultCooldown || 3000;
        
        // Auto cleanup every 5 minutes
        this.cleanupInterval = setInterval(
            () => this._cleanup(), 
            options.cleanupInterval || 300000
        );
    }

    /**
     * Generate cache key
     * @private
     */
    private _getKey(userId: string, commandName: string): string {
        return `${userId}:${commandName}`;
    }

    /**
     * Check if user is on cooldown
     * @param userId - User ID
     * @param commandName - Command name
     * @param cooldownMs - Cooldown duration (uses default if not provided)
     */
    check(userId: string, commandName: string, _cooldownMs: number = this.defaultCooldown): CooldownCheckResult {
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
    set(userId: string, commandName: string, cooldownMs: number = this.defaultCooldown): void {
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
    checkAndSet(userId: string, commandName: string, cooldownMs: number = this.defaultCooldown): CooldownCheckAndSetResult {
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
    clear(userId: string, commandName: string): void {
        const key = this._getKey(userId, commandName);
        this.cooldowns.delete(key);
    }

    /**
     * Clear all cooldowns for a user
     * @param userId - User ID
     */
    clearUser(userId: string): void {
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
    getRemaining(userId: string, commandName: string): number {
        const result = this.check(userId, commandName);
        return result.remaining;
    }

    /**
     * Cleanup expired cooldowns
     * @private
     */
    private _cleanup(): void {
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
    getStats(): CooldownStats {
        return {
            totalEntries: this.cooldowns.size,
            memoryEstimate: this.cooldowns.size * 100 // rough estimate in bytes
        };
    }

    /**
     * Destroy the cooldown manager
     */
    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.cooldowns.clear();
    }
}
// GLOBAL INSTANCE & EXPORTS
// Global cooldown manager instance
export const globalCooldownManager = new CooldownManager();

// Convenience functions using global manager
export function checkCooldown(userId: string, commandName: string, cooldownMs?: number): CooldownCheckAndSetResult {
    return globalCooldownManager.checkAndSet(userId, commandName, cooldownMs);
}

export function clearCooldown(userId: string, commandName: string): void {
    return globalCooldownManager.clear(userId, commandName);
}
