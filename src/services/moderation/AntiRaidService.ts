/**
 * Anti-Raid Service
 * Detects and responds to raid attacks
 * @module services/moderation/AntiRaidService
 */

import { Collection, type GuildMember, type Snowflake } from 'discord.js';

// Use require for CommonJS config
const automodConfigModule = require('../../config/features/moderation/automod.js') as {
    default?: {
        ANTI_RAID?: {
            JOIN_RATE: { WINDOW_SECONDS: number; THRESHOLD: number };
            ACCOUNT_AGE: { MIN_DAYS: number };
            ACTIONS: { ON_RAID: string };
        };
        SPAM?: Record<string, unknown>;
        DUPLICATE?: Record<string, unknown>;
    };
    ANTI_RAID?: {
        JOIN_RATE: { WINDOW_SECONDS: number; THRESHOLD: number };
        ACCOUNT_AGE: { MIN_DAYS: number };
        ACTIONS: { ON_RAID: string };
    };
    SPAM?: Record<string, unknown>;
    DUPLICATE?: Record<string, unknown>;
};
// Handle both ESM default export and direct export
const automodConfig = automodConfigModule.default || automodConfigModule;
// TYPES
interface JoinEntry {
    userId: Snowflake;
    timestamp: number;
    accountAge: number;
    username: string;
}

interface RaidModeState {
    active: boolean;
    activatedAt: number;
    activatedBy: Snowflake;
    reason: string;
}

interface JoinAnalysis {
    isRaid: boolean;
    isSuspicious: boolean;
    triggers: string[];
    recommendation: string | null;
    stats: {
        joinCount: number;
        newAccounts: number;
        similarNames: number;
    };
}

interface SimilarNameResult {
    count: number;
    isSuspicious: boolean;
}
// ANTI-RAID SERVICE CLASS
class AntiRaidService {
    private joinTracker: Collection<Snowflake, JoinEntry[]> = new Collection();
    private raidModeState: Collection<Snowflake, RaidModeState> = new Collection();
    private flaggedAccounts: Collection<Snowflake, Set<Snowflake>> = new Collection();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this._startCleanup();
    }

    /**
     * Track a member join event
     */
    trackJoin(member: GuildMember): JoinAnalysis {
        const guildId = member.guild.id;
        const now = Date.now();

        if (!this.joinTracker.has(guildId)) {
            this.joinTracker.set(guildId, []);
        }

        const joins = this.joinTracker.get(guildId)!;

        // Add this join
        joins.push({
            userId: member.id,
            timestamp: now,
            accountAge: now - member.user.createdTimestamp,
            username: member.user.username
        });

        // Clean old entries
        const ANTI_RAID = automodConfig.ANTI_RAID || { JOIN_RATE: { WINDOW_SECONDS: 30, THRESHOLD: 10 }, ACCOUNT_AGE: { MIN_DAYS: 7 }, ACTIONS: { ON_RAID: 'lockdown' } };
        const windowStart = now - ANTI_RAID.JOIN_RATE.WINDOW_SECONDS * 1000;
        const recentJoins = joins.filter(j => j.timestamp > windowStart);
        this.joinTracker.set(guildId, recentJoins);

        return this._analyzeJoins(guildId, recentJoins, member);
    }

    /**
     * Analyze joins for raid patterns
     */
    private _analyzeJoins(guildId: Snowflake, recentJoins: JoinEntry[], newMember: GuildMember): JoinAnalysis {
        const ANTI_RAID = automodConfig.ANTI_RAID || { JOIN_RATE: { WINDOW_SECONDS: 30, THRESHOLD: 10 }, ACCOUNT_AGE: { MIN_DAYS: 7 }, ACTIONS: { ON_RAID: 'lockdown' } };
        
        const result: JoinAnalysis = {
            isRaid: false,
            isSuspicious: false,
            triggers: [],
            recommendation: null,
            stats: {
                joinCount: recentJoins.length,
                newAccounts: 0,
                similarNames: 0
            }
        };

        // Check if raid mode already active
        if (this.isRaidModeActive(guildId)) {
            result.isSuspicious = true;
            result.triggers.push('raid_mode_active');
            this._flagAccount(guildId, newMember.id);
            return result;
        }

        // Count new accounts
        const newAccountThreshold = ANTI_RAID.ACCOUNT_AGE.MIN_DAYS * 24 * 60 * 60 * 1000;
        result.stats.newAccounts = recentJoins.filter(j =>
            j.accountAge < newAccountThreshold
        ).length;

        // Check similar usernames
        const usernamePatterns = this._detectSimilarUsernames(recentJoins);
        result.stats.similarNames = usernamePatterns.count;

        // Trigger 1: Too many joins in window
        if (recentJoins.length >= ANTI_RAID.JOIN_RATE.THRESHOLD) {
            result.triggers.push('high_join_rate');
            result.isRaid = true;
        }

        // Trigger 2: Many new accounts joining
        const newAccountRatio = result.stats.newAccounts / recentJoins.length;
        if (recentJoins.length >= 5 && newAccountRatio >= 0.7) {
            result.triggers.push('mass_new_accounts');
            result.isRaid = true;
        }

        // Trigger 3: Similar username pattern
        if (usernamePatterns.isSuspicious) {
            result.triggers.push('similar_usernames');
            result.isRaid = true;
        }

        // Suspicious checks
        if (!result.isRaid) {
            const isNewAccount = (Date.now() - newMember.user.createdTimestamp) < newAccountThreshold;
            if (isNewAccount && recentJoins.length >= 3) {
                result.isSuspicious = true;
                result.triggers.push('new_account_high_activity');
            }
        }

        // Set recommendation
        if (result.isRaid) {
            result.recommendation = ANTI_RAID.ACTIONS.ON_RAID;
        } else if (result.isSuspicious) {
            result.recommendation = 'monitor';
        }

        return result;
    }

    /**
     * Detect similar username patterns
     */
    private _detectSimilarUsernames(joins: JoinEntry[]): SimilarNameResult {
        if (joins.length < 4) {
            return { count: 0, isSuspicious: false };
        }

        const usernames = joins.map(j => j.username.toLowerCase());

        const prefixMap = new Map<string, number>();
        const suffixMap = new Map<string, number>();

        for (const name of usernames) {
            if (name.length >= 4) {
                const prefix = name.slice(0, 4);
                const suffix = name.slice(-4);

                prefixMap.set(prefix, (prefixMap.get(prefix) || 0) + 1);
                suffixMap.set(suffix, (suffixMap.get(suffix) || 0) + 1);
            }

            const match = name.match(/^([a-z]+)(\d+)$/);
            if (match) {
                const base = match[1];
                prefixMap.set(`num_${base}`, (prefixMap.get(`num_${base}`) || 0) + 1);
            }
        }

        const maxPrefix = Math.max(...prefixMap.values(), 0);
        const maxSuffix = Math.max(...suffixMap.values(), 0);
        const maxSimilar = Math.max(maxPrefix, maxSuffix);

        return {
            count: maxSimilar,
            isSuspicious: maxSimilar >= 3 && maxSimilar >= joins.length * 0.5
        };
    }

    /**
     * Flag an account during raid
     */
    private _flagAccount(guildId: Snowflake, userId: Snowflake): void {
        if (!this.flaggedAccounts.has(guildId)) {
            this.flaggedAccounts.set(guildId, new Set());
        }
        this.flaggedAccounts.get(guildId)!.add(userId);
    }

    /**
     * Activate raid mode
     */
    activateRaidMode(guildId: Snowflake, activatedBy: Snowflake, reason: string): void {
        this.raidModeState.set(guildId, {
            active: true,
            activatedAt: Date.now(),
            activatedBy,
            reason
        });
    }

    /**
     * Deactivate raid mode
     */
    deactivateRaidMode(guildId: Snowflake): void {
        this.raidModeState.delete(guildId);
        this.flaggedAccounts.delete(guildId);
    }

    /**
     * Check if raid mode is active
     */
    isRaidModeActive(guildId: Snowflake): boolean {
        return this.raidModeState.get(guildId)?.active || false;
    }

    /**
     * Get raid mode state
     */
    getRaidModeState(guildId: Snowflake): RaidModeState | undefined {
        return this.raidModeState.get(guildId);
    }

    /**
     * Get flagged accounts
     */
    getFlaggedAccounts(guildId: Snowflake): Snowflake[] {
        return [...(this.flaggedAccounts.get(guildId) || [])];
    }

    /**
     * Clear flagged accounts
     */
    clearFlaggedAccounts(guildId: Snowflake): void {
        this.flaggedAccounts.delete(guildId);
    }

    /**
     * Start cleanup interval
     */
    private _startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            const maxAge = 5 * 60 * 1000; // 5 minutes

            for (const [guildId, joins] of this.joinTracker) {
                const recentJoins = joins.filter(j => now - j.timestamp < maxAge);
                if (recentJoins.length === 0) {
                    this.joinTracker.delete(guildId);
                } else {
                    this.joinTracker.set(guildId, recentJoins);
                }
            }

            // Auto-disable raid mode after 30 minutes
            for (const [guildId, state] of this.raidModeState) {
                if (state.active && now - state.activatedAt > 30 * 60 * 1000) {
                    this.deactivateRaidMode(guildId);
                    console.log(`[AntiRaidService] Auto-disabled raid mode for guild ${guildId}`);
                }
            }
        }, 60 * 1000);
    }

    /**
     * Shutdown service
     */
    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.joinTracker.clear();
        this.raidModeState.clear();
        this.flaggedAccounts.clear();
    }
}

// Create singleton instance
const antiRaidService = new AntiRaidService();

export { AntiRaidService };
export default antiRaidService;
