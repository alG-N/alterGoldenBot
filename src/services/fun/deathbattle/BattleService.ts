/**
 * Battle Service for Death Battle
 * Manages combat mechanics and state
 * @module services/fun/deathbattle/BattleService
 */

import type { User } from 'discord.js';
import skillsetService from './SkillsetService.js';
import type { Power, Skillset } from './SkillsetService.js';
import cacheService from '../../../cache/CacheService.js';

// NAMED EFFECT - tracks DoT/debuff with source name
export interface NamedEffect {
    name: string;       // e.g., "Amaterasu", "Wisteria Venom"
    turns: number;      // remaining turns
    value: number;      // damage per turn or debuff multiplier
    source?: string;    // character who applied it
}

// TYPES
export interface BattleEffects {
    shrine: number;
    speech: number;
    speechTurns: number;
    binding: boolean;
    burn: number;
    slow: number;
    lightning: number;
    bleed: number;
    poison: number;
    poisonWeaken: number;
    constrict: number;
    constrictDmg: number;
    dodge: number;
    reflect: boolean;
    frozen: number;
    markBoost: number;
    critNext: boolean;
    burnStacks: number;
    momentum: number;
    berserk: boolean;
    speedBoost: number;
    foresight: number;
    transform: number;
    transformBoost: number;
    ghostMode: boolean;
    revive?: boolean;
    illusionCopy?: number;
    trapped?: number;
    waterPrison?: number;
    redirect?: boolean;
    // New effects for JJK skillset types
    stunned?: number;
    dot?: number;
    dotDmg?: number;
    debuff?: number;
    debuffTurns?: number;
    slowed?: number;
    slowAmount?: number;
    buff?: number;
    buffTurns?: number;
    // Named effects for detailed tracking
    namedDots: NamedEffect[];
    namedDebuffs: NamedEffect[];
    namedBuffs: NamedEffect[];
    armor: number;          // Damage reduction multiplier (1.0 = no reduction)
    armorSource?: string;   // Source of armor
    [key: string]: number | boolean | undefined | NamedEffect[] | string; // Allow dynamic charge tracking
}

// Battle history entry for logs
export interface BattleHistoryEntry {
    round: number;
    attacker: string;
    action: string;
    baseDamage: number;
    finalDamage: number;
    modifiers: string[];
    effectsApplied: string[];
    p1HpAfter: number;
    p2HpAfter: number;
}

export interface Battle {
    player1: User;
    player2: User;
    skillsetName: string;
    skillset: Skillset | undefined;
    player1Health: number;
    player2Health: number;
    player1MaxHp: number;
    player2MaxHp: number;
    roundCount: number;
    player1Stunned: boolean;
    player2Stunned: boolean;
    player1Immune: boolean;
    player2Immune: boolean;
    usedPowers: string[];
    effects: {
        user1: BattleEffects;
        user2: BattleEffects;
    };
    lastDamageDealt: { user1: number; user2: number };
    battleLog: string;
    interval: NodeJS.Timeout | null;
    revivedOnce: { user1: boolean; user2: boolean };
    // New: Battle history for detailed logs
    history: BattleHistoryEntry[];
}
// DEFAULT EFFECTS
const createDefaultEffects = (): BattleEffects => ({
    shrine: 0,
    speech: 1,
    speechTurns: 0,
    binding: false,
    burn: 0,
    slow: 0,
    lightning: 0,
    bleed: 0,
    poison: 0,
    poisonWeaken: 1,
    constrict: 0,
    constrictDmg: 0,
    dodge: 0,
    reflect: false,
    frozen: 0,
    markBoost: 1,
    critNext: false,
    burnStacks: 0,
    momentum: 0,
    berserk: false,
    speedBoost: 1,
    foresight: 0,
    transform: 0,
    transformBoost: 1,
    ghostMode: false,
    // Named effect arrays
    namedDots: [],
    namedDebuffs: [],
    namedBuffs: [],
    armor: 1.0,
});
// BATTLE SERVICE CLASS
class BattleService {
    private activeBattles: Map<string, Battle> = new Map();

    /**
     * Create a new battle between two players
     */
    createBattle(
        guildId: string,
        player1: User,
        player2: User,
        skillsetName: string,
        player1Hp: number,
        player2Hp: number
    ): Battle {
        const skillset = skillsetService.getSkillset(skillsetName);

        const battle: Battle = {
            player1,
            player2,
            skillsetName,
            skillset,
            player1Health: player1Hp,
            player2Health: player2Hp,
            player1MaxHp: player1Hp,
            player2MaxHp: player2Hp,
            roundCount: 1,
            player1Stunned: false,
            player2Stunned: false,
            player1Immune: false,
            player2Immune: false,
            usedPowers: [],
            effects: {
                user1: createDefaultEffects(),
                user2: createDefaultEffects(),
            },
            lastDamageDealt: { user1: 0, user2: 0 },
            battleLog: '',
            interval: null,
            revivedOnce: { user1: false, user2: false },
            history: [],
        };

        this.activeBattles.set(guildId, battle);
        return battle;
    }

    /**
     * Get an active battle by guild ID
     */
    getBattle(guildId: string): Battle | undefined {
        return this.activeBattles.get(guildId);
    }

    /**
     * Get battle history by guild ID (from Redis/cache)
     */
    async getBattleHistory(guildId: string): Promise<BattleHistoryEntry[] | null> {
        return cacheService.get<BattleHistoryEntry[]>('temp', `battle:history:${guildId}`);
    }

    /**
     * Save battle history when battle ends (to Redis/cache with 10min TTL)
     */
    async saveBattleHistory(guildId: string, history: BattleHistoryEntry[]): Promise<void> {
        await cacheService.set('temp', `battle:history:${guildId}`, history, 600); // 10 min TTL
    }

    /**
     * Remove a battle and clear its interval
     */
    async removeBattle(guildId: string): Promise<void> {
        const battle = this.activeBattles.get(guildId);
        if (battle?.interval) {
            clearInterval(battle.interval);
        }
        // Save history before removing
        if (battle?.history && battle.history.length > 0) {
            await this.saveBattleHistory(guildId, battle.history);
        }
        this.activeBattles.delete(guildId);
    }

    /**
     * Calculate damage based on HP scaling (LOWERED for longer battles)
     * Returns both final damage and breakdown string
     */
    calculateDamageWithBreakdown(
        base: number, 
        hp: number, 
        modifiers: { name: string; value: number }[] = []
    ): { damage: number; breakdown: string; modifiersList: string[] } {
        // HP-based scaling (lowered)
        let scale = 1;
        if (hp > 1000000) scale = 2.5;      // Was 3.5
        else if (hp > 100000) scale = 1.8;   // Was 2.5
        else if (hp > 10000) scale = 1.3;    // Was 1.7
        else if (hp > 1000) scale = 1.0;     // Was 1.2
        else if (hp > 100) scale = 0.8;      // Was 1.0
        else scale = 0.6;                    // Was 0.7
        
        const scaledBase = Math.floor(base * scale);
        let finalDamage = scaledBase;
        const modifiersList: string[] = [];
        
        // Apply all modifiers
        for (const mod of modifiers) {
            if (mod.value !== 1) {
                const change = Math.floor(scaledBase * (mod.value - 1));
                finalDamage = Math.floor(finalDamage * mod.value);
                if (mod.value > 1) {
                    modifiersList.push(`+${Math.round((mod.value - 1) * 100)}% ${mod.name}`);
                } else {
                    modifiersList.push(`${Math.round((mod.value - 1) * 100)}% ${mod.name}`);
                }
            }
        }
        
        // Build breakdown string
        let breakdown = `**${finalDamage}**`;
        if (modifiersList.length > 0) {
            breakdown = `**${finalDamage}** (${scaledBase} base ${modifiersList.join(', ')})`;
        }
        
        return { damage: Math.max(1, finalDamage), breakdown, modifiersList };
    }

    calculateDamage(base: number, hp: number, debuff: number = 1, boost: number = 1): number {
        // Legacy method for compatibility - uses lowered scales
        let scale = 1;
        if (hp > 1000000) scale = 2.5;
        else if (hp > 100000) scale = 1.8;
        else if (hp > 10000) scale = 1.3;
        else if (hp > 1000) scale = 1.0;
        else if (hp > 100) scale = 0.8;
        else scale = 0.6;
        return Math.max(1, Math.floor(base * scale * debuff * boost));
    }

    /**
     * Process a turn and deal damage
     */
    dealDamage(battle: Battle, isPlayer1Turn: boolean): { log: string; historyEntry: Partial<BattleHistoryEntry> } {
        const attacker = isPlayer1Turn ? battle.player1 : battle.player2;
        const defender = isPlayer1Turn ? battle.player2 : battle.player1;
        const defenderHp = isPlayer1Turn ? battle.player2Health : battle.player1Health;
        const attackerMaxHp = isPlayer1Turn ? battle.player1MaxHp : battle.player2MaxHp;
        const defenderMaxHp = isPlayer1Turn ? battle.player1MaxHp : battle.player2MaxHp;

        let log = '';
        let damage = 0;
        const modifiers: string[] = [];
        const atkEff = isPlayer1Turn ? battle.effects.user1 : battle.effects.user2;
        const defEff = isPlayer1Turn ? battle.effects.user2 : battle.effects.user1;

        // Dodge check
        if (defEff.dodge > 0) {
            defEff.dodge--;
            return { 
                log: `🏃 ${defender.username} dodged ${attacker.username}'s attack with perfect evasion!`,
                historyEntry: { action: 'Dodged', baseDamage: 0, finalDamage: 0, modifiers: ['Dodge'] }
            };
        }

        // Foresight check
        if (defEff.foresight > 0 && Math.random() < 0.6) {
            defEff.foresight--;
            return { 
                log: `👁️ ${defender.username} saw the future and avoided ${attacker.username}'s attack!`,
                historyEntry: { action: 'Foresight Dodge', baseDamage: 0, finalDamage: 0, modifiers: ['Foresight'] }
            };
        }

        // Build modifier list for damage calculation
        const modifierList: { name: string; value: number }[] = [];
        
        if (atkEff.binding) modifierList.push({ name: 'Binding', value: 1.3 });
        if (atkEff.speech !== 1) modifierList.push({ name: 'Cursed Speech', value: atkEff.speech });
        if (atkEff.poisonWeaken !== 1) modifierList.push({ name: 'Poison Debuff', value: atkEff.poisonWeaken });
        if (atkEff.speedBoost !== 1) modifierList.push({ name: 'Speed', value: atkEff.speedBoost });
        if (atkEff.markBoost !== 1) modifierList.push({ name: 'Mark', value: atkEff.markBoost });
        if (atkEff.transform > 0) modifierList.push({ name: 'Transform', value: atkEff.transformBoost });
        if (atkEff.berserk) modifierList.push({ name: 'Berserk', value: 1.5 });
        if (atkEff.buff && atkEff.buffTurns && atkEff.buffTurns > 0) {
            modifierList.push({ name: 'Buff', value: atkEff.buff as number });
        }
        if (atkEff.slowed && atkEff.slowed > 0) {
            modifierList.push({ name: 'Slowed', value: atkEff.slowAmount || 0.7 });
        }
        if (atkEff.debuff && atkEff.debuffTurns && atkEff.debuffTurns > 0) {
            modifierList.push({ name: 'Debuffed', value: atkEff.debuff as number });
        }
        // Apply defender's armor
        if (defEff.armor && defEff.armor !== 1) {
            modifierList.push({ name: defEff.armorSource || 'Armor', value: defEff.armor });
        }
        
        // Calculate total multiplier for legacy method
        const totalBoost = modifierList.reduce((acc, m) => acc * m.value, 1);

        // Get random power
        const power = skillsetService.getRandomPower(battle.skillsetName, battle.usedPowers);
        let baseDamage = 0;
        
        if (!power) {
            baseDamage = Math.floor(defenderMaxHp * 0.06) + 8; // Lowered from 0.10
            const result = this.calculateDamageWithBreakdown(baseDamage, defenderMaxHp, modifierList);
            damage = result.damage;
            log = `${attacker.username} used a basic attack for ${result.breakdown} damage!`;
            modifiers.push(...result.modifiersList);
        } else {
            [damage, log, baseDamage] = this.processPowerWithBreakdown(
                power, attacker, defender, battle,
                defenderHp, attackerMaxHp, defenderMaxHp,
                modifierList, atkEff, defEff, isPlayer1Turn
            );
        }

        // Handle reflect
        if (defEff.reflect && damage > 0) {
            const reflectDmg = Math.floor(damage * 0.5);
            if (isPlayer1Turn) battle.player1Health = Math.max(0, battle.player1Health - reflectDmg);
            else battle.player2Health = Math.max(0, battle.player2Health - reflectDmg);
            log += ` ⚡ **${reflectDmg}** reflected!`;
            defEff.reflect = false;
            modifiers.push(`Reflected ${reflectDmg}`);
        }

        // Handle redirect
        if (defEff.redirect && damage > 0) {
            const redirectDmg = Math.floor(damage * 0.5);
            if (isPlayer1Turn) battle.player1Health = Math.max(0, battle.player1Health - redirectDmg);
            else battle.player2Health = Math.max(0, battle.player2Health - redirectDmg);
            log += ` 🔄 **${redirectDmg}** redirected!`;
            defEff.redirect = false;
            modifiers.push(`Redirected ${redirectDmg}`);
        }

        // Apply damage
        if (isPlayer1Turn) {
            battle.player2Health = Math.max(0, battle.player2Health - damage);
            battle.lastDamageDealt.user1 = damage;
        } else {
            battle.player1Health = Math.max(0, battle.player1Health - damage);
            battle.lastDamageDealt.user2 = damage;
        }

        // Build history entry
        const historyEntry: BattleHistoryEntry = {
            round: battle.roundCount,
            attacker: attacker.username,
            action: power?.name || 'Basic Attack',
            baseDamage: baseDamage,
            finalDamage: damage,
            modifiers: modifiers,
            effectsApplied: [],
            p1HpAfter: battle.player1Health,
            p2HpAfter: battle.player2Health
        };

        return { log, historyEntry };
    }

    /**
     * Process a power and return damage + log
     */
    private processPower(
        power: Power,
        attacker: User,
        defender: User,
        battle: Battle,
        defenderHp: number,
        attackerMaxHp: number,
        defenderMaxHp: number,
        debuff: number,
        totalBoost: number,
        atkEff: BattleEffects,
        defEff: BattleEffects,
        isPlayer1Turn: boolean
    ): [number, string] {
        let damage = 0;
        let log = '';

        switch (power.type) {
            case 'combo':
                for (let i = 0; i < (power.hits || 1); i++) {
                    damage += this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 10, defenderMaxHp, debuff, totalBoost);
                }
                log = `${attacker.username} used ${power.desc} hitting ${power.hits} times for **${damage}** total damage!`;
                break;

            case 'execute': {
                const hpPercent = defenderHp / defenderMaxHp;
                if (hpPercent <= (power.threshold || 0.2)) {
                    damage = Math.floor(defenderHp * 0.9);
                    log = `${attacker.username} executed ${defender.username} with ${power.desc} dealing **${damage}** massive damage!`;
                } else {
                    damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.08)) + 15, defenderMaxHp, debuff, totalBoost);
                    log = `${attacker.username} used ${power.desc} for **${damage}** damage (execute failed - HP too high)!`;
                }
                break;
            }

            case 'bleed':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 10, defenderMaxHp, debuff, totalBoost);
                defEff.bleed = power.turns || 3;
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage and causing bleeding for ${power.turns} turns!`;
                break;

            case 'poison_weaken':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 8, defenderMaxHp, debuff, totalBoost);
                defEff.poison = power.turns || 3;
                defEff.poisonWeaken = 1 - (power.weaken || 0.2);
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage and weakening defense by ${Math.floor((power.weaken || 0.2) * 100)}%!`;
                break;

            case 'momentum': {
                const momentumBonus = atkEff.momentum * (power.bonus || 0.02);
                damage = this.calculateDamage(Math.floor(defenderMaxHp * ((power.scale || 0.06) + momentumBonus)) + 15, defenderMaxHp, debuff, totalBoost);
                atkEff.momentum++;
                log = `${attacker.username} used ${power.desc} with momentum x${atkEff.momentum} dealing **${damage}** damage!`;
                break;
            }

            case 'revive':
                atkEff.revive = true;
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 10, defenderMaxHp, debuff, totalBoost);
                log = `${attacker.username} activated ${power.desc}! Next fatal blow will revive with ${Math.floor((power.scale || 0.25) * 100)}% HP! Dealt **${damage}** damage!`;
                break;

            case 'dodge':
                atkEff.dodge = power.turns || 2;
                log = `${attacker.username} used ${power.desc}! Will dodge the next ${power.turns} attacks!`;
                break;

            case 'lifesteal': {
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 12, defenderMaxHp, debuff, totalBoost);
                const stolen = Math.floor(damage * (power.steal || 0.3));
                if (isPlayer1Turn) battle.player1Health = Math.min(battle.player1Health + stolen, battle.player1MaxHp);
                else battle.player2Health = Math.min(battle.player2Health + stolen, battle.player2MaxHp);
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage and stealing **${stolen}** HP!`;
                break;
            }

            case 'constrict':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 10, defenderMaxHp, debuff, totalBoost);
                defEff.constrict = power.turns || 3;
                defEff.constrictDmg = Math.floor(defenderMaxHp * 0.04);
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage and constricting for ${power.turns} turns!`;
                break;

            case 'echo': {
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 12, defenderMaxHp, debuff, totalBoost);
                const lastDmg = isPlayer1Turn ? battle.lastDamageDealt.user1 : battle.lastDamageDealt.user2;
                const echoDmg = Math.floor(lastDmg * 0.5);
                damage += echoDmg;
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage (${echoDmg} echo from last attack)!`;
                break;
            }

            case 'reflect':
                atkEff.reflect = true;
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 8, defenderMaxHp, debuff, totalBoost);
                log = `${attacker.username} used ${power.desc}! Next attack will reflect ${Math.floor((power.scale || 0.5) * 100)}% damage back! Dealt **${damage}** damage!`;
                break;

            case 'berserk': {
                atkEff.berserk = true;
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.09)) + 15, defenderMaxHp, debuff, totalBoost);
                const recoil = Math.floor(attackerMaxHp * (power.recoil || 0.1));
                if (isPlayer1Turn) battle.player1Health = Math.max(0, battle.player1Health - recoil);
                else battle.player2Health = Math.max(0, battle.player2Health - recoil);
                log = `${attacker.username} went berserk with ${power.desc}! Dealt **${damage}** damage but took **${recoil}** recoil! All attacks boosted!`;
                break;
            }

            case 'detonate': {
                const burnDmg = (defEff.burnStacks || 0) * Math.floor(defenderMaxHp * 0.03);
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.08)) + 15, defenderMaxHp, debuff, totalBoost) + burnDmg;
                defEff.burnStacks = 0;
                log = `${attacker.username} used ${power.desc}, detonating burn stacks for **${damage}** total damage!`;
                break;
            }

            case 'piercing':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.08)) + 15, defenderMaxHp, debuff * (1 + (power.ignore || 0.3)), totalBoost);
                log = `${attacker.username} used ${power.desc}, ignoring ${Math.floor((power.ignore || 0.3) * 100)}% defense for **${damage}** damage!`;
                break;

            case 'counter': {
                const counterDmg = isPlayer1Turn ? battle.lastDamageDealt.user2 : battle.lastDamageDealt.user1;
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.05)) + counterDmg, defenderMaxHp, debuff, totalBoost);
                log = `${attacker.username} countered with ${power.desc}, dealing **${damage}** damage (${counterDmg} from last hit)!`;
                break;
            }

            case 'freeze':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.damage || 0.06)) + 10, defenderMaxHp, debuff, totalBoost);
                defEff.frozen = power.turns || 2;
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage and freezing for ${power.turns} turns!`;
                break;

            case 'mark_boost':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 15, defenderMaxHp, debuff, totalBoost);
                atkEff.markBoost = power.boost || 1.3;
                log = `${attacker.username} activated ${power.desc}! All damage increased by ${Math.floor(((power.boost || 1.3) - 1) * 100)}%! Dealt **${damage}** damage!`;
                break;

            case 'critical':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 15, defenderMaxHp, debuff, totalBoost);
                if (Math.random() < 0.4) {
                    damage = Math.floor(damage * (power.crit || 2));
                    log = `${attacker.username} landed a CRITICAL HIT with ${power.desc} for **${damage}** damage!`;
                } else {
                    log = `${attacker.username} used ${power.desc} for **${damage}** damage!`;
                }
                break;

            case 'burn_stack':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12, defenderMaxHp, debuff, totalBoost);
                defEff.burnStacks = (defEff.burnStacks || 0) + (power.stacks || 2);
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage and stacking ${power.stacks} burn charges!`;
                break;

            case 'bloodpump':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 15, defenderMaxHp, debuff, totalBoost);
                atkEff.speedBoost = power.speed || 1.5;
                log = `${attacker.username} activated ${power.desc}! Attack speed x${power.speed}! Dealt **${damage}** damage!`;
                break;

            case 'reality_warp':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.08)) + 20, defenderMaxHp, debuff, totalBoost);
                if (Math.random() < 0.3) {
                    damage = Math.floor(damage * 1.8);
                    log = `${attacker.username} warped reality with ${power.desc}! Cartoon physics dealt **${damage}** chaotic damage!`;
                } else {
                    log = `${attacker.username} used ${power.desc} for **${damage}** damage!`;
                }
                break;

            case 'drain_power': {
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 15, defenderMaxHp, debuff, totalBoost);
                const selfDrain = Math.floor(attackerMaxHp * (power.self || 0.05));
                if (isPlayer1Turn) battle.player1Health = Math.max(0, battle.player1Health - selfDrain);
                else battle.player2Health = Math.max(0, battle.player2Health - selfDrain);
                defEff.speech = Math.max(0.5, defEff.speech - 0.1);
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage, taking **${selfDrain}** self-damage, and weakening opponent!`;
                break;
            }

            case 'foresight':
                atkEff.foresight = power.turns || 3;
                log = `${attacker.username} activated ${power.desc}! Can see ${power.turns} turns ahead and may dodge attacks!`;
                break;

            case 'aerial':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.08)) + 18, defenderMaxHp, debuff, totalBoost);
                log = `${attacker.username} used ${power.desc}, diving from above for **${damage}** damage!`;
                break;

            case 'chain_lightning': {
                const baseDmg = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12, defenderMaxHp, debuff, totalBoost);
                damage = baseDmg;
                for (let i = 0; i < (power.chains || 3); i++) {
                    damage += Math.floor(baseDmg * 0.5);
                }
                log = `${attacker.username} used ${power.desc}, chaining ${power.chains} times for **${damage}** total damage!`;
                break;
            }

            case 'illusion_copy':
                atkEff.illusionCopy = power.turns || 3;
                log = `${attacker.username} created an illusion copy with ${power.desc}! May confuse attacks for ${power.turns} turns!`;
                break;

            case 'trap':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 10, defenderMaxHp, debuff, totalBoost);
                defEff.trapped = 2;
                log = `${attacker.username} set ${power.desc}, dealing **${damage}** damage and trapping opponent for 2 turns!`;
                break;

            case 'transform':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.08)) + 18, defenderMaxHp, debuff, totalBoost);
                atkEff.transform = power.duration || 4;
                atkEff.transformBoost = power.boost || 1.4;
                log = `${attacker.username} transformed with ${power.desc}! Damage boosted ${Math.floor(((power.boost || 1.4) - 1) * 100)}% for ${power.duration} turns! Dealt **${damage}** damage!`;
                break;

            case 'giant_limbs':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.08)) + 16, defenderMaxHp, debuff, totalBoost * 1.2);
                log = `${attacker.username} used ${power.desc}, crushing with giant limbs for **${damage}** damage!`;
                break;

            case 'demon_form': {
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.09)) + 18, defenderMaxHp, debuff, totalBoost);
                const demonSteal = Math.floor(damage * (power.lifesteal || 0.25));
                if (isPlayer1Turn) battle.player1Health = Math.min(battle.player1Health + demonSteal, battle.player1MaxHp);
                else battle.player2Health = Math.min(battle.player2Health + demonSteal, battle.player2MaxHp);
                log = `${attacker.username} unleashed ${power.desc}, dealing **${damage}** damage and stealing **${demonSteal}** HP!`;
                break;
            }

            case 'laser':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 15, defenderMaxHp, debuff, totalBoost);
                if (power.piercing) {
                    damage = Math.floor(damage * 1.3);
                    log = `${attacker.username} fired ${power.desc}, piercing through for **${damage}** damage!`;
                } else {
                    log = `${attacker.username} fired ${power.desc} for **${damage}** damage!`;
                }
                break;

            case 'ghost':
                atkEff.ghostMode = true;
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12, defenderMaxHp, debuff, totalBoost);
                log = `${attacker.username} entered ${power.desc}! Next attack passes through and becomes intangible! Dealt **${damage}** damage!`;
                break;

            case 'water_prison':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12, defenderMaxHp, debuff, totalBoost);
                defEff.waterPrison = power.turns || 3;
                log = `${attacker.username} trapped opponent in ${power.desc}, dealing **${damage}** damage and drowning for ${power.turns} turns!`;
                break;

            case 'redirect':
                atkEff.redirect = true;
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 8, defenderMaxHp, debuff, totalBoost);
                log = `${attacker.username} prepared ${power.desc}! Next attack will redirect ${Math.floor((power.scale || 0.5) * 100)}% damage back! Dealt **${damage}** damage!`;
                break;

            case 'earthquake':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.09)) + 20, defenderMaxHp, debuff, totalBoost);
                if (power.aoe) {
                    damage = Math.floor(damage * 1.15);
                    log = `${attacker.username} caused ${power.desc}, shaking the entire battlefield for **${damage}** massive damage!`;
                } else {
                    log = `${attacker.username} used ${power.desc} for **${damage}** damage!`;
                }
                break;

            // Basic damage type - most common
            case 'damage':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.10)) + 15, defenderMaxHp, debuff, totalBoost);
                log = `${attacker.username} used ${power.desc} and dealt **${damage}** damage!`;
                break;

            // Stun - skip defender's next turn
            case 'stun':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 8, defenderMaxHp, debuff, totalBoost);
                defEff.stunned = power.turns || 1;
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage and stunning for ${power.turns || 1} turn(s)!`;
                break;

            // DOT - damage over time
            case 'dot':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.04)) + 8, defenderMaxHp, debuff, totalBoost);
                defEff.dot = power.turns || 3;
                defEff.dotDmg = Math.floor(defenderMaxHp * (power.scale || 0.04));
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage and inflicting DoT for ${power.turns || 3} turns!`;
                break;

            // Debuff - reduce opponent's damage
            case 'debuff':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 10, defenderMaxHp, debuff, totalBoost);
                defEff.debuff = (defEff.debuff || 1) * (power.debuff || 0.7);
                defEff.debuffTurns = power.turns || 2;
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage and weakening opponent by ${Math.floor((1 - (power.debuff || 0.7)) * 100)}%!`;
                break;

            // Heal - restore HP
            case 'heal': {
                const healAmount = Math.floor(attackerMaxHp * (power.scale || 0.15));
                if (isPlayer1Turn) battle.player1Health = Math.min(battle.player1Health + healAmount, battle.player1MaxHp);
                else battle.player2Health = Math.min(battle.player2Health + healAmount, battle.player2MaxHp);
                log = `${attacker.username} used ${power.desc} and healed for **${healAmount}** HP!`;
                break;
            }

            // Swap - swap HP percentages
            case 'swap': {
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.08)) + 12, defenderMaxHp, debuff, totalBoost);
                const shouldSwap = Math.random() < 0.35;
                if (shouldSwap) {
                    const atkHpPercent = isPlayer1Turn ? battle.player1Health / battle.player1MaxHp : battle.player2Health / battle.player2MaxHp;
                    const defHpPercent = isPlayer1Turn ? battle.player2Health / battle.player2MaxHp : battle.player1Health / battle.player1MaxHp;
                    if (isPlayer1Turn) {
                        battle.player1Health = Math.floor(battle.player1MaxHp * defHpPercent);
                        battle.player2Health = Math.floor(battle.player2MaxHp * atkHpPercent);
                    } else {
                        battle.player2Health = Math.floor(battle.player2MaxHp * defHpPercent);
                        battle.player1Health = Math.floor(battle.player1MaxHp * atkHpPercent);
                    }
                    log = `${attacker.username} used ${power.desc}! HP percentages swapped! Also dealt **${damage}** damage!`;
                } else {
                    log = `${attacker.username} used ${power.desc} for **${damage}** damage! (Swap failed)`;
                }
                break;
            }

            // Gamble - high risk, high reward
            case 'gamble': {
                const roll = Math.random();
                if (roll < 0.25) {
                    damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.10) * 3) + 30, defenderMaxHp, debuff, totalBoost);
                    log = `${attacker.username} used ${power.desc} and hit the JACKPOT! Dealt **${damage}** massive damage!`;
                } else if (roll < 0.5) {
                    damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.10)) + 15, defenderMaxHp, debuff, totalBoost);
                    log = `${attacker.username} used ${power.desc} for **${damage}** damage!`;
                } else {
                    const selfDmg = Math.floor(attackerMaxHp * 0.10);
                    if (isPlayer1Turn) battle.player1Health = Math.max(1, battle.player1Health - selfDmg);
                    else battle.player2Health = Math.max(1, battle.player2Health - selfDmg);
                    log = `${attacker.username} used ${power.desc} and lost the gamble! Took **${selfDmg}** self-damage!`;
                }
                break;
            }

            // Charge - limited uses but powerful
            case 'charge': {
                const chargeKey = `charge_${power.name}`;
                const chargeValue = atkEff[chargeKey];
                const charges = typeof chargeValue === 'number' ? chargeValue : (power.charges || 2);
                if (charges > 0) {
                    damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.25)) + 25, defenderMaxHp, debuff, totalBoost);
                    atkEff[chargeKey] = charges - 1;
                    log = `${attacker.username} used ${power.desc}! Dealt **${damage}** damage! (${charges - 1} charges left)`;
                } else {
                    damage = this.calculateDamage(Math.floor(defenderMaxHp * 0.05) + 8, defenderMaxHp, debuff, totalBoost);
                    log = `${attacker.username} tried to use ${power.desc} but is out of charges! Dealt **${damage}** weak damage!`;
                }
                break;
            }

            // Slow - reduce opponent's speed/effectiveness
            case 'slow':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 10, defenderMaxHp, debuff, totalBoost);
                defEff.slowed = power.turns || 2;
                defEff.slowAmount = 0.7;
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage and slowing opponent for ${power.turns || 2} turns!`;
                break;

            // Buff - boost own damage
            case 'buff': {
                let healAmount = 0;
                if (power.heal) {
                    healAmount = Math.floor(attackerMaxHp * (power.scale || 0.10));
                    if (isPlayer1Turn) battle.player1Health = Math.min(battle.player1Health + healAmount, battle.player1MaxHp);
                    else battle.player2Health = Math.min(battle.player2Health + healAmount, battle.player2MaxHp);
                }
                atkEff.buff = power.boost || 1.3;
                atkEff.buffTurns = power.turns || 3;
                log = `${attacker.username} used ${power.desc}! Damage boosted by ${Math.floor(((power.boost || 1.3) - 1) * 100)}%${healAmount > 0 ? ` and healed **${healAmount}** HP` : ''}!`;
                break;
            }

            // Sacrifice - deal massive damage but hurt yourself
            case 'sacrifice': {
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.30)) + 30, defenderMaxHp, debuff, totalBoost);
                const selfDamage = Math.floor(attackerMaxHp * (power.self || 0.20));
                if (isPlayer1Turn) battle.player1Health = Math.max(1, battle.player1Health - selfDamage);
                else battle.player2Health = Math.max(1, battle.player2Health - selfDamage);
                log = `${attacker.username} sacrificed health with ${power.desc}! Dealt **${damage}** damage but took **${selfDamage}** self-damage!`;
                break;
            }

            // Random - random effect from summons
            case 'random': {
                const randomMult = 0.8 + Math.random() * 0.6; // 0.8x to 1.4x multiplier
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.09) * randomMult) + 12, defenderMaxHp, debuff, totalBoost);
                const summonName = skillsetService.getSummonName(battle.skillsetName, power.name);
                if (summonName !== 'Unknown Summon') {
                    log = `${attacker.username} summoned **${summonName}** with ${power.desc} for **${damage}** damage!`;
                } else {
                    log = `${attacker.username} used ${power.desc} for **${damage}** damage!`;
                }
                break;
            }

            // Phantom - creates multiple attacking illusions/summons
            case 'phantom': {
                const summonName = skillsetService.getSummonName(battle.skillsetName, power.name);
                for (let i = 0; i < (power.illusions || 3); i++) {
                    damage += this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.04)) + 8, defenderMaxHp, debuff, totalBoost);
                }
                if (summonName !== 'Unknown Summon') {
                    log = `${attacker.username} summoned ${power.illusions} **${summonName}** phantoms with ${power.desc}, dealing **${damage}** total damage!`;
                } else {
                    log = `${attacker.username} created ${power.illusions} phantoms with ${power.desc}, dealing **${damage}** total damage!`;
                }
                break;
            }

            default:
                damage = this.calculateDamage(Math.floor(defenderMaxHp * 0.10) + 10, defenderMaxHp, debuff, totalBoost);
                log = `${attacker.username} used a combo attack and dealt **${damage}** damage to ${defender.username}!`;
        }

        return [damage, log];
    }

    /**
     * Process a power with damage breakdown (shows modifiers in the log)
     */
    private processPowerWithBreakdown(
        power: Power,
        attacker: User,
        defender: User,
        battle: Battle,
        defenderHp: number,
        attackerMaxHp: number,
        defenderMaxHp: number,
        modifierList: { name: string; value: number }[],
        atkEff: BattleEffects,
        defEff: BattleEffects,
        isPlayer1Turn: boolean
    ): [number, string, number] {
        let damage = 0;
        let baseDamage = 0;
        let log = '';

        // Helper to calculate with breakdown
        const calcWithBreakdown = (base: number): { damage: number; breakdown: string } => {
            baseDamage = base;
            return this.calculateDamageWithBreakdown(base, defenderMaxHp, modifierList);
        };

        switch (power.type) {
            case 'combo': {
                baseDamage = Math.floor(defenderMaxHp * (power.scale || 0.04)) + 8;
                for (let i = 0; i < (power.hits || 1); i++) {
                    damage += this.calculateDamageWithBreakdown(baseDamage, defenderMaxHp, modifierList).damage;
                }
                log = `${attacker.username} used **${power.desc}** hitting ${power.hits}x for **${damage}** total damage!`;
                break;
            }

            case 'execute': {
                const hpPercent = defenderHp / defenderMaxHp;
                if (hpPercent <= (power.threshold || 0.2)) {
                    damage = Math.floor(defenderHp * 0.9);
                    baseDamage = damage;
                    log = `💀 ${attacker.username} **EXECUTED** with ${power.desc} for **${damage}** damage!`;
                } else {
                    const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12);
                    damage = result.damage;
                    log = `${attacker.username} used ${power.desc} for ${result.breakdown} damage (execute failed)!`;
                }
                break;
            }

            case 'bleed': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 8);
                damage = result.damage;
                defEff.bleed = power.turns || 3;
                // Add named DoT
                defEff.namedDots.push({
                    name: power.effectName || 'Bleeding',
                    turns: power.turns || 3,
                    value: Math.floor(defenderMaxHp * 0.04),
                    source: attacker.username
                });
                log = `🩸 ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + **${power.effectName || 'Bleeding'}** (${power.turns} turns)!`;
                break;
            }

            case 'poison_weaken': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.04)) + 6);
                damage = result.damage;
                defEff.poison = power.turns || 3;
                defEff.poisonWeaken = 1 - (power.weaken || 0.2);
                defEff.namedDots.push({
                    name: power.effectName || 'Poison',
                    turns: power.turns || 3,
                    value: Math.floor(defenderMaxHp * 0.03),
                    source: attacker.username
                });
                defEff.namedDebuffs.push({
                    name: `${power.effectName || 'Poison'} Weaken`,
                    turns: power.turns || 3,
                    value: power.weaken || 0.2,
                    source: attacker.username
                });
                log = `☠️ ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + **-${Math.floor((power.weaken || 0.2) * 100)}% Weakened**!`;
                break;
            }

            case 'momentum': {
                const momentumBonus = atkEff.momentum * (power.bonus || 0.02);
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * ((power.scale || 0.05) + momentumBonus)) + 12);
                damage = result.damage;
                atkEff.momentum++;
                log = `🔥 ${attacker.username} used **${power.desc}** [Momentum x${atkEff.momentum}] for ${result.breakdown} damage!`;
                break;
            }

            case 'revive': {
                atkEff.revive = true;
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 8);
                damage = result.damage;
                log = `✨ ${attacker.username} activated **${power.desc}**! Will revive with ${Math.floor((power.scale || 0.25) * 100)}% HP! Dealt ${result.breakdown}!`;
                break;
            }

            case 'dodge':
                atkEff.dodge = power.turns || 2;
                log = `🏃 ${attacker.username} used **${power.desc}**! Dodging next ${power.turns} attacks!`;
                break;

            case 'lifesteal': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 10);
                damage = result.damage;
                const stolen = Math.floor(damage * (power.steal || 0.3));
                if (isPlayer1Turn) battle.player1Health = Math.min(battle.player1Health + stolen, battle.player1MaxHp);
                else battle.player2Health = Math.min(battle.player2Health + stolen, battle.player2MaxHp);
                log = `🧛 ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + stealing **${stolen}** HP!`;
                break;
            }

            case 'constrict': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 8);
                damage = result.damage;
                defEff.constrict = power.turns || 3;
                defEff.constrictDmg = Math.floor(defenderMaxHp * 0.04);
                defEff.namedDots.push({
                    name: power.effectName || 'Constriction',
                    turns: power.turns || 3,
                    value: defEff.constrictDmg,
                    source: attacker.username
                });
                log = `🐍 ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + **${power.effectName || 'Constrict'}** (${power.turns} turns)!`;
                break;
            }

            case 'echo': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 10);
                const lastDmg = isPlayer1Turn ? battle.lastDamageDealt.user1 : battle.lastDamageDealt.user2;
                const echoDmg = Math.floor(lastDmg * 0.5);
                damage = result.damage + echoDmg;
                log = `📢 ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + **${echoDmg}** echo damage!`;
                break;
            }

            case 'reflect': {
                atkEff.reflect = true;
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.04)) + 6);
                damage = result.damage;
                log = `🛡️ ${attacker.username} used **${power.desc}**! Next attack reflects 50%! Dealt ${result.breakdown}!`;
                break;
            }

            case 'berserk': {
                atkEff.berserk = true;
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 12);
                damage = result.damage;
                const recoil = Math.floor(attackerMaxHp * (power.recoil || 0.1));
                if (isPlayer1Turn) battle.player1Health = Math.max(0, battle.player1Health - recoil);
                else battle.player2Health = Math.max(0, battle.player2Health - recoil);
                log = `😤 ${attacker.username} went **BERSERK** with ${power.desc}! Dealt ${result.breakdown} but took **${recoil}** self-damage!`;
                break;
            }

            case 'detonate': {
                const burnDmg = (defEff.burnStacks || 0) * Math.floor(defenderMaxHp * 0.03);
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12);
                damage = result.damage + burnDmg;
                defEff.burnStacks = 0;
                log = `💥 ${attacker.username} used **${power.desc}**, detonating for ${result.breakdown} + **${burnDmg}** burn damage!`;
                break;
            }

            case 'piercing': {
                const pierceMod = [...modifierList, { name: 'Pierce', value: 1 + (power.ignore || 0.3) }];
                const result = this.calculateDamageWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12, defenderMaxHp, pierceMod);
                damage = result.damage;
                baseDamage = Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12;
                log = `🗡️ ${attacker.username} used **${power.desc}**, piercing for ${result.breakdown} damage!`;
                break;
            }

            case 'counter': {
                const counterDmg = isPlayer1Turn ? battle.lastDamageDealt.user2 : battle.lastDamageDealt.user1;
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.04)) + counterDmg);
                damage = result.damage;
                log = `⚔️ ${attacker.username} **COUNTERED** with ${power.desc} for ${result.breakdown} damage!`;
                break;
            }

            case 'freeze': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.damage || 0.05)) + 8);
                damage = result.damage;
                defEff.frozen = power.turns || 2;
                defEff.namedDebuffs.push({
                    name: power.effectName || 'Frozen',
                    turns: power.turns || 2,
                    value: 1,
                    source: attacker.username
                });
                log = `❄️ ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + **Frozen** (${power.turns} turns)!`;
                break;
            }

            case 'mark_boost': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12);
                damage = result.damage;
                atkEff.markBoost = power.boost || 1.3;
                atkEff.namedBuffs.push({
                    name: power.effectName || 'Mark',
                    turns: 99,
                    value: power.boost || 1.3,
                    source: attacker.username
                });
                log = `🎯 ${attacker.username} activated **${power.desc}**! +${Math.floor(((power.boost || 1.3) - 1) * 100)}% damage! Dealt ${result.breakdown}!`;
                break;
            }

            case 'critical': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12);
                damage = result.damage;
                if (Math.random() < 0.4) {
                    damage = Math.floor(damage * (power.crit || 2));
                    log = `💢 ${attacker.username} landed a **CRITICAL** with ${power.desc} for **${damage}** damage!`;
                } else {
                    log = `${attacker.username} used **${power.desc}** for ${result.breakdown} damage!`;
                }
                break;
            }

            case 'burn_stack': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 10);
                damage = result.damage;
                defEff.burnStacks = (defEff.burnStacks || 0) + (power.stacks || 2);
                log = `🔥 ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + **${power.stacks} burn stacks**!`;
                break;
            }

            case 'bloodpump': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12);
                damage = result.damage;
                atkEff.speedBoost = power.speed || 1.5;
                atkEff.namedBuffs.push({
                    name: power.effectName || 'Blood Pump',
                    turns: 99,
                    value: power.speed || 1.5,
                    source: attacker.username
                });
                log = `💉 ${attacker.username} activated **${power.desc}**! Speed x${power.speed}! Dealt ${result.breakdown}!`;
                break;
            }

            case 'reality_warp': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 15);
                damage = result.damage;
                if (Math.random() < 0.3) {
                    damage = Math.floor(damage * 1.8);
                    log = `🌀 ${attacker.username} **WARPED REALITY** with ${power.desc}! **${damage}** chaotic damage!`;
                } else {
                    log = `${attacker.username} used **${power.desc}** for ${result.breakdown} damage!`;
                }
                break;
            }

            case 'drain_power': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12);
                damage = result.damage;
                const selfDrain = Math.floor(attackerMaxHp * (power.self || 0.05));
                if (isPlayer1Turn) battle.player1Health = Math.max(0, battle.player1Health - selfDrain);
                else battle.player2Health = Math.max(0, battle.player2Health - selfDrain);
                defEff.speech = Math.max(0.5, defEff.speech - 0.1);
                log = `🌑 ${attacker.username} used **${power.desc}**, dealing ${result.breakdown}, taking **${selfDrain}** self-damage!`;
                break;
            }

            case 'foresight':
                atkEff.foresight = power.turns || 3;
                log = `👁️ ${attacker.username} activated **${power.desc}**! Can dodge for ${power.turns} turns!`;
                break;

            case 'aerial': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 15);
                damage = result.damage;
                log = `🦅 ${attacker.username} used **${power.desc}**, diving for ${result.breakdown} damage!`;
                break;
            }

            case 'chain_lightning': {
                baseDamage = Math.floor(defenderMaxHp * (power.scale || 0.05)) + 10;
                const baseResult = this.calculateDamageWithBreakdown(baseDamage, defenderMaxHp, modifierList);
                damage = baseResult.damage;
                for (let i = 0; i < (power.chains || 3); i++) {
                    damage += Math.floor(baseResult.damage * 0.5);
                }
                log = `⚡ ${attacker.username} used **${power.desc}**, chaining ${power.chains}x for **${damage}** total damage!`;
                break;
            }

            case 'illusion_copy':
                atkEff.illusionCopy = power.turns || 3;
                log = `👻 ${attacker.username} created **${power.desc}**! May confuse attacks for ${power.turns} turns!`;
                break;

            case 'trap': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 8);
                damage = result.damage;
                defEff.trapped = 2;
                log = `🪤 ${attacker.username} set **${power.desc}**, dealing ${result.breakdown} + **Trapped** (2 turns)!`;
                break;
            }

            case 'transform': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 15);
                damage = result.damage;
                atkEff.transform = power.duration || 4;
                atkEff.transformBoost = power.boost || 1.4;
                atkEff.namedBuffs.push({
                    name: power.effectName || 'Transform',
                    turns: power.duration || 4,
                    value: power.boost || 1.4,
                    source: attacker.username
                });
                log = `🔄 ${attacker.username} **TRANSFORMED** with ${power.desc}! +${Math.floor(((power.boost || 1.4) - 1) * 100)}% damage for ${power.duration} turns! Dealt ${result.breakdown}!`;
                break;
            }

            case 'giant_limbs': {
                const giantMod = [...modifierList, { name: 'Giant', value: 1.2 }];
                const result = this.calculateDamageWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 14, defenderMaxHp, giantMod);
                damage = result.damage;
                baseDamage = Math.floor(defenderMaxHp * (power.scale || 0.06)) + 14;
                log = `👊 ${attacker.username} used **${power.desc}**, crushing for ${result.breakdown} damage!`;
                break;
            }

            case 'demon_form': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 15);
                damage = result.damage;
                const demonSteal = Math.floor(damage * (power.lifesteal || 0.25));
                if (isPlayer1Turn) battle.player1Health = Math.min(battle.player1Health + demonSteal, battle.player1MaxHp);
                else battle.player2Health = Math.min(battle.player2Health + demonSteal, battle.player2MaxHp);
                log = `👹 ${attacker.username} unleashed **${power.desc}**, dealing ${result.breakdown} + stealing **${demonSteal}** HP!`;
                break;
            }

            case 'laser': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 12);
                damage = result.damage;
                if (power.piercing) {
                    damage = Math.floor(damage * 1.3);
                    log = `💫 ${attacker.username} fired **${power.desc}**, piercing for **${damage}** damage!`;
                } else {
                    log = `💫 ${attacker.username} fired **${power.desc}** for ${result.breakdown} damage!`;
                }
                break;
            }

            case 'ghost': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 10);
                damage = result.damage;
                atkEff.ghostMode = true;
                log = `👻 ${attacker.username} entered **${power.desc}**! Became intangible! Dealt ${result.breakdown}!`;
                break;
            }

            case 'water_prison': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 10);
                damage = result.damage;
                defEff.waterPrison = power.turns || 3;
                defEff.namedDots.push({
                    name: power.effectName || 'Drowning',
                    turns: power.turns || 3,
                    value: Math.floor(defenderMaxHp * 0.045),
                    source: attacker.username
                });
                log = `🌊 ${attacker.username} trapped in **${power.desc}**, dealing ${result.breakdown} + **Drowning** (${power.turns} turns)!`;
                break;
            }

            case 'redirect': {
                atkEff.redirect = true;
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.04)) + 6);
                damage = result.damage;
                log = `↩️ ${attacker.username} prepared **${power.desc}**! Next attack redirects 50%! Dealt ${result.breakdown}!`;
                break;
            }

            case 'earthquake': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 18);
                damage = result.damage;
                if (power.aoe) {
                    damage = Math.floor(damage * 1.15);
                    log = `🌋 ${attacker.username} caused **${power.desc}**, shaking for **${damage}** massive damage!`;
                } else {
                    log = `${attacker.username} used **${power.desc}** for ${result.breakdown} damage!`;
                }
                break;
            }

            case 'damage': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.08)) + 12);
                damage = result.damage;
                log = `⚔️ ${attacker.username} used **${power.desc}** for ${result.breakdown} damage!`;
                break;
            }

            case 'stun': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.04)) + 6);
                damage = result.damage;
                defEff.stunned = power.turns || 1;
                defEff.namedDebuffs.push({
                    name: power.effectName || 'Stunned',
                    turns: power.turns || 1,
                    value: 1,
                    source: attacker.username
                });
                log = `💫 ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + **Stunned** (${power.turns || 1} turn)!`;
                break;
            }

            case 'dot': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.03)) + 6);
                damage = result.damage;
                defEff.dot = power.turns || 3;
                defEff.dotDmg = Math.floor(defenderMaxHp * (power.scale || 0.04));
                defEff.namedDots.push({
                    name: power.effectName || power.desc,
                    turns: power.turns || 3,
                    value: defEff.dotDmg,
                    source: attacker.username
                });
                log = `🔥 ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + **${power.effectName || 'DoT'}** (${power.turns || 3} turns)!`;
                break;
            }

            case 'debuff': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 8);
                damage = result.damage;
                defEff.debuff = (defEff.debuff || 1) * (power.debuff || 0.7);
                defEff.debuffTurns = power.turns || 2;
                defEff.namedDebuffs.push({
                    name: power.effectName || 'Weakened',
                    turns: power.turns || 2,
                    value: 1 - (power.debuff || 0.7),
                    source: attacker.username
                });
                log = `⬇️ ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + **-${Math.floor((1 - (power.debuff || 0.7)) * 100)}% Weakened**!`;
                break;
            }

            case 'heal': {
                const healAmount = Math.floor(attackerMaxHp * (power.scale || 0.12));
                if (isPlayer1Turn) battle.player1Health = Math.min(battle.player1Health + healAmount, battle.player1MaxHp);
                else battle.player2Health = Math.min(battle.player2Health + healAmount, battle.player2MaxHp);
                log = `💚 ${attacker.username} used **${power.desc}** and healed **${healAmount}** HP!`;
                break;
            }

            case 'swap': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.06)) + 10);
                damage = result.damage;
                const shouldSwap = Math.random() < 0.35;
                if (shouldSwap) {
                    const atkHpPercent = isPlayer1Turn ? battle.player1Health / battle.player1MaxHp : battle.player2Health / battle.player2MaxHp;
                    const defHpPercent = isPlayer1Turn ? battle.player2Health / battle.player2MaxHp : battle.player1Health / battle.player1MaxHp;
                    if (isPlayer1Turn) {
                        battle.player1Health = Math.floor(battle.player1MaxHp * defHpPercent);
                        battle.player2Health = Math.floor(battle.player2MaxHp * atkHpPercent);
                    } else {
                        battle.player2Health = Math.floor(battle.player2MaxHp * defHpPercent);
                        battle.player1Health = Math.floor(battle.player1MaxHp * atkHpPercent);
                    }
                    log = `🔀 ${attacker.username} used **${power.desc}**! HP swapped! Also dealt ${result.breakdown}!`;
                } else {
                    log = `${attacker.username} used **${power.desc}** for ${result.breakdown} (Swap failed)!`;
                }
                break;
            }

            case 'gamble': {
                const roll = Math.random();
                if (roll < 0.25) {
                    baseDamage = Math.floor(defenderMaxHp * (power.scale || 0.08) * 3) + 25;
                    const result = this.calculateDamageWithBreakdown(baseDamage, defenderMaxHp, modifierList);
                    damage = result.damage;
                    log = `🎰 ${attacker.username} used **${power.desc}** and hit **JACKPOT**! **${damage}** massive damage!`;
                } else if (roll < 0.5) {
                    const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.08)) + 12);
                    damage = result.damage;
                    log = `🎲 ${attacker.username} used **${power.desc}** for ${result.breakdown} damage!`;
                } else {
                    const selfDmg = Math.floor(attackerMaxHp * 0.10);
                    if (isPlayer1Turn) battle.player1Health = Math.max(1, battle.player1Health - selfDmg);
                    else battle.player2Health = Math.max(1, battle.player2Health - selfDmg);
                    log = `💸 ${attacker.username} used **${power.desc}** and lost! Took **${selfDmg}** self-damage!`;
                }
                break;
            }

            case 'charge': {
                const chargeKey = `charge_${power.name}`;
                const chargeValue = atkEff[chargeKey];
                const charges = typeof chargeValue === 'number' ? chargeValue : (power.charges || 2);
                if (charges > 0) {
                    const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.20)) + 20);
                    damage = result.damage;
                    atkEff[chargeKey] = charges - 1;
                    log = `⚡ ${attacker.username} used **${power.desc}**! ${result.breakdown} damage! (${charges - 1} charges left)`;
                } else {
                    const result = calcWithBreakdown(Math.floor(defenderMaxHp * 0.04) + 6);
                    damage = result.damage;
                    log = `${attacker.username} tried **${power.desc}** but is out of charges! ${result.breakdown} weak damage!`;
                }
                break;
            }

            case 'slow': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.05)) + 8);
                damage = result.damage;
                defEff.slowed = power.turns || 2;
                defEff.slowAmount = 0.7;
                defEff.namedDebuffs.push({
                    name: power.effectName || 'Slowed',
                    turns: power.turns || 2,
                    value: 0.3,
                    source: attacker.username
                });
                log = `🐢 ${attacker.username} used **${power.desc}**, dealing ${result.breakdown} + **Slowed** (${power.turns || 2} turns)!`;
                break;
            }

            case 'buff': {
                let healAmount = 0;
                if (power.heal) {
                    healAmount = Math.floor(attackerMaxHp * (power.scale || 0.08));
                    if (isPlayer1Turn) battle.player1Health = Math.min(battle.player1Health + healAmount, battle.player1MaxHp);
                    else battle.player2Health = Math.min(battle.player2Health + healAmount, battle.player2MaxHp);
                }
                atkEff.buff = power.boost || 1.3;
                atkEff.buffTurns = power.turns || 3;
                atkEff.namedBuffs.push({
                    name: power.effectName || 'Buff',
                    turns: power.turns || 3,
                    value: power.boost || 1.3,
                    source: attacker.username
                });
                log = `⬆️ ${attacker.username} used **${power.desc}**! +${Math.floor(((power.boost || 1.3) - 1) * 100)}% damage${healAmount > 0 ? ` + healed **${healAmount}** HP` : ''}!`;
                break;
            }

            case 'sacrifice': {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.25)) + 25);
                damage = result.damage;
                const selfDamage = Math.floor(attackerMaxHp * (power.self || 0.20));
                if (isPlayer1Turn) battle.player1Health = Math.max(1, battle.player1Health - selfDamage);
                else battle.player2Health = Math.max(1, battle.player2Health - selfDamage);
                log = `💀 ${attacker.username} **SACRIFICED** with ${power.desc}! ${result.breakdown} but took **${selfDamage}** self-damage!`;
                break;
            }

            case 'random': {
                const randomMult = 0.8 + Math.random() * 0.6;
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * (power.scale || 0.07) * randomMult) + 10);
                damage = result.damage;
                const summonName = skillsetService.getSummonName(battle.skillsetName, power.name);
                if (summonName !== 'Unknown Summon') {
                    log = `✨ ${attacker.username} summoned **${summonName}** with ${power.desc} for ${result.breakdown} damage!`;
                } else {
                    log = `${attacker.username} used **${power.desc}** for ${result.breakdown} damage!`;
                }
                break;
            }

            case 'phantom': {
                baseDamage = Math.floor(defenderMaxHp * (power.scale || 0.03)) + 6;
                const summonName = skillsetService.getSummonName(battle.skillsetName, power.name);
                for (let i = 0; i < (power.illusions || 3); i++) {
                    damage += this.calculateDamageWithBreakdown(baseDamage, defenderMaxHp, modifierList).damage;
                }
                if (summonName !== 'Unknown Summon') {
                    log = `👻 ${attacker.username} summoned ${power.illusions}x **${summonName}** with ${power.desc}, dealing **${damage}** total!`;
                } else {
                    log = `${attacker.username} created ${power.illusions} phantoms with **${power.desc}**, dealing **${damage}** total!`;
                }
                break;
            }

            default: {
                const result = calcWithBreakdown(Math.floor(defenderMaxHp * 0.06) + 8);
                damage = result.damage;
                log = `${attacker.username} used a combo attack for ${result.breakdown} damage!`;
            }
        }

        return [damage, log, baseDamage];
    }

    /**
     * Process end-of-turn effects
     */
    handleEffects(battle: Battle): string[] {
        const logs: string[] = [];

        // Process Named DoTs first (new system with verse-specific names)
        for (const dot of battle.effects.user1.namedDots) {
            if (dot.turns > 0) {
                battle.player1Health = Math.max(0, battle.player1Health - dot.value);
                logs.push(`🔥 **${dot.name}**: **${battle.player1.username}** took **${dot.value}** damage!`);
                dot.turns--;
            }
        }
        battle.effects.user1.namedDots = battle.effects.user1.namedDots.filter(d => d.turns > 0);
        
        for (const dot of battle.effects.user2.namedDots) {
            if (dot.turns > 0) {
                battle.player2Health = Math.max(0, battle.player2Health - dot.value);
                logs.push(`🔥 **${dot.name}**: **${battle.player2.username}** took **${dot.value}** damage!`);
                dot.turns--;
            }
        }
        battle.effects.user2.namedDots = battle.effects.user2.namedDots.filter(d => d.turns > 0);

        // Process Named Debuffs
        for (const debuff of battle.effects.user1.namedDebuffs) {
            if (debuff.turns > 0) {
                debuff.turns--;
                if (debuff.turns === 0) {
                    logs.push(`✨ **${battle.player1.username}**'s **${debuff.name}** wore off!`);
                }
            }
        }
        battle.effects.user1.namedDebuffs = battle.effects.user1.namedDebuffs.filter(d => d.turns > 0);
        
        for (const debuff of battle.effects.user2.namedDebuffs) {
            if (debuff.turns > 0) {
                debuff.turns--;
                if (debuff.turns === 0) {
                    logs.push(`✨ **${battle.player2.username}**'s **${debuff.name}** wore off!`);
                }
            }
        }
        battle.effects.user2.namedDebuffs = battle.effects.user2.namedDebuffs.filter(d => d.turns > 0);

        // Process Named Buffs
        for (const buff of battle.effects.user1.namedBuffs) {
            if (buff.turns > 0 && buff.turns < 99) {
                buff.turns--;
                if (buff.turns === 0) {
                    logs.push(`⬇️ **${battle.player1.username}**'s **${buff.name}** expired!`);
                }
            }
        }
        battle.effects.user1.namedBuffs = battle.effects.user1.namedBuffs.filter(b => b.turns > 0);
        
        for (const buff of battle.effects.user2.namedBuffs) {
            if (buff.turns > 0 && buff.turns < 99) {
                buff.turns--;
                if (buff.turns === 0) {
                    logs.push(`⬇️ **${battle.player2.username}**'s **${buff.name}** expired!`);
                }
            }
        }
        battle.effects.user2.namedBuffs = battle.effects.user2.namedBuffs.filter(b => b.turns > 0);

        // Shrine effects (JJK - Malevolent Shrine)
        if (battle.effects.user1.shrine > 0) {
            const dmg = Math.max(Math.floor(battle.player2MaxHp * 0.045), 1);
            battle.player2Health = Math.max(0, battle.player2Health - dmg);
            logs.push(`⛩️ **Malevolent Shrine**: **${battle.player2.username}** took **${dmg}** cleave damage!`);
            battle.effects.user1.shrine--;
        }
        if (battle.effects.user2.shrine > 0) {
            const dmg = Math.max(Math.floor(battle.player1MaxHp * 0.045), 1);
            battle.player1Health = Math.max(0, battle.player1Health - dmg);
            logs.push(`⛩️ **Malevolent Shrine**: **${battle.player1.username}** took **${dmg}** cleave damage!`);
            battle.effects.user2.shrine--;
        }

        // Burn effects (legacy - kept for backwards compat)
        if (battle.effects.user1.burn > 0) {
            const burnDmg = Math.floor(battle.player1MaxHp * 0.03);
            battle.player1Health = Math.max(0, battle.player1Health - burnDmg);
            logs.push(`🔥 **Burning**: **${battle.player1.username}** took **${burnDmg}** burn damage!`);
            battle.effects.user1.burn--;
        }
        if (battle.effects.user2.burn > 0) {
            const burnDmg = Math.floor(battle.player2MaxHp * 0.03);
            battle.player2Health = Math.max(0, battle.player2Health - burnDmg);
            logs.push(`🔥 **Burning**: **${battle.player2.username}** took **${burnDmg}** burn damage!`);
            battle.effects.user2.burn--;
        }

        // Bleed effects
        if (battle.effects.user1.bleed > 0) {
            const bleedDmg = Math.floor(battle.player1MaxHp * 0.035);
            battle.player1Health = Math.max(0, battle.player1Health - bleedDmg);
            logs.push(`🩸 **Bleeding**: **${battle.player1.username}** took **${bleedDmg}** bleed damage!`);
            battle.effects.user1.bleed--;
        }
        if (battle.effects.user2.bleed > 0) {
            const bleedDmg = Math.floor(battle.player2MaxHp * 0.035);
            battle.player2Health = Math.max(0, battle.player2Health - bleedDmg);
            logs.push(`🩸 **Bleeding**: **${battle.player2.username}** took **${bleedDmg}** bleed damage!`);
            battle.effects.user2.bleed--;
        }

        // Poison effects
        if (battle.effects.user1.poison > 0) {
            const poisonDmg = Math.floor(battle.player1MaxHp * 0.025);
            battle.player1Health = Math.max(0, battle.player1Health - poisonDmg);
            logs.push(`☠️ **Poisoned**: **${battle.player1.username}** took **${poisonDmg}** poison damage!`);
            battle.effects.user1.poison--;
            if (battle.effects.user1.poison === 0) battle.effects.user1.poisonWeaken = 1;
        }
        if (battle.effects.user2.poison > 0) {
            const poisonDmg = Math.floor(battle.player2MaxHp * 0.025);
            battle.player2Health = Math.max(0, battle.player2Health - poisonDmg);
            logs.push(`☠️ **Poisoned**: **${battle.player2.username}** took **${poisonDmg}** poison damage!`);
            battle.effects.user2.poison--;
            if (battle.effects.user2.poison === 0) battle.effects.user2.poisonWeaken = 1;
        }

        // Constrict effects
        if (battle.effects.user1.constrict > 0) {
            battle.player1Health = Math.max(0, battle.player1Health - battle.effects.user1.constrictDmg);
            logs.push(`🐍 **Constricted**: **${battle.player1.username}** took **${battle.effects.user1.constrictDmg}** damage!`);
            battle.effects.user1.constrict--;
        }
        if (battle.effects.user2.constrict > 0) {
            battle.player2Health = Math.max(0, battle.player2Health - battle.effects.user2.constrictDmg);
            logs.push(`🐍 **Constricted**: **${battle.player2.username}** took **${battle.effects.user2.constrictDmg}** damage!`);
            battle.effects.user2.constrict--;
        }

        // Frozen effects
        if (battle.effects.user1.frozen > 0) {
            const frozenDmg = Math.floor(battle.player1MaxHp * 0.015);
            battle.player1Health = Math.max(0, battle.player1Health - frozenDmg);
            logs.push(`❄️ **Frozen**: **${battle.player1.username}** took **${frozenDmg}** freeze damage!`);
            battle.effects.user1.frozen--;
        }
        if (battle.effects.user2.frozen > 0) {
            const frozenDmg = Math.floor(battle.player2MaxHp * 0.015);
            battle.player2Health = Math.max(0, battle.player2Health - frozenDmg);
            logs.push(`❄️ **Frozen**: **${battle.player2.username}** took **${frozenDmg}** freeze damage!`);
            battle.effects.user2.frozen--;
        }

        // Water Prison effects
        if (battle.effects.user1.waterPrison && battle.effects.user1.waterPrison > 0) {
            const drownDmg = Math.floor(battle.player1MaxHp * 0.04);
            battle.player1Health = Math.max(0, battle.player1Health - drownDmg);
            logs.push(`🌊 **Water Prison**: **${battle.player1.username}** is drowning for **${drownDmg}** damage!`);
            battle.effects.user1.waterPrison--;
        }
        if (battle.effects.user2.waterPrison && battle.effects.user2.waterPrison > 0) {
            const drownDmg = Math.floor(battle.player2MaxHp * 0.04);
            battle.player2Health = Math.max(0, battle.player2Health - drownDmg);
            logs.push(`🌊 **Water Prison**: **${battle.player2.username}** is drowning for **${drownDmg}** damage!`);
            battle.effects.user2.waterPrison--;
        }

        // DoT (generic damage over time) effects - fallback
        if (battle.effects.user1.dot && battle.effects.user1.dot > 0) {
            const dotDmg = battle.effects.user1.dotDmg || Math.floor(battle.player1MaxHp * 0.035);
            battle.player1Health = Math.max(0, battle.player1Health - dotDmg);
            logs.push(`💀 **DoT**: **${battle.player1.username}** took **${dotDmg}** damage!`);
            battle.effects.user1.dot--;
            if (battle.effects.user1.dot === 0) battle.effects.user1.dotDmg = 0;
        }
        if (battle.effects.user2.dot && battle.effects.user2.dot > 0) {
            const dotDmg = battle.effects.user2.dotDmg || Math.floor(battle.player2MaxHp * 0.035);
            battle.player2Health = Math.max(0, battle.player2Health - dotDmg);
            logs.push(`💀 **DoT**: **${battle.player2.username}** took **${dotDmg}** damage!`);
            battle.effects.user2.dot--;
            if (battle.effects.user2.dot === 0) battle.effects.user2.dotDmg = 0;
        }

        // Debuff effects
        if (battle.effects.user1.debuffTurns && battle.effects.user1.debuffTurns > 0) {
            battle.effects.user1.debuffTurns--;
            if (battle.effects.user1.debuffTurns === 0 && battle.effects.user1.debuff) {
                logs.push(`✨ **${battle.player1.username}**'s debuff wore off!`);
                battle.effects.user1.speech = 1;
                battle.effects.user1.debuff = 0;
            }
        }
        if (battle.effects.user2.debuffTurns && battle.effects.user2.debuffTurns > 0) {
            battle.effects.user2.debuffTurns--;
            if (battle.effects.user2.debuffTurns === 0 && battle.effects.user2.debuff) {
                logs.push(`✨ **${battle.player2.username}**'s debuff wore off!`);
                battle.effects.user2.speech = 1;
                battle.effects.user2.debuff = 0;
            }
        }

        // Slowed effects
        if (battle.effects.user1.slowed && battle.effects.user1.slowed > 0) {
            battle.effects.user1.slowed--;
            if (battle.effects.user1.slowed === 0) {
                logs.push(`✨ **${battle.player1.username}**'s slow wore off!`);
                battle.effects.user1.slowAmount = 0;
            }
        }
        if (battle.effects.user2.slowed && battle.effects.user2.slowed > 0) {
            battle.effects.user2.slowed--;
            if (battle.effects.user2.slowed === 0) {
                logs.push(`✨ **${battle.player2.username}**'s slow wore off!`);
                battle.effects.user2.slowAmount = 0;
            }
        }

        // Stunned effects
        if (battle.effects.user1.stunned && battle.effects.user1.stunned > 0) {
            battle.player1Stunned = true;
            battle.effects.user1.stunned--;
            if (battle.effects.user1.stunned > 0) {
                logs.push(`💫 **${battle.player1.username}** is stunned! (${battle.effects.user1.stunned} turns left)`);
            }
        }
        if (battle.effects.user2.stunned && battle.effects.user2.stunned > 0) {
            battle.player2Stunned = true;
            battle.effects.user2.stunned--;
            if (battle.effects.user2.stunned > 0) {
                logs.push(`💫 **${battle.player2.username}** is stunned! (${battle.effects.user2.stunned} turns left)`);
            }
        }

        // Buff effects
        if (battle.effects.user1.buffTurns && battle.effects.user1.buffTurns > 0) {
            battle.effects.user1.buffTurns--;
            if (battle.effects.user1.buffTurns === 0) {
                logs.push(`⬇️ **${battle.player1.username}**'s buff expired!`);
                battle.effects.user1.buff = 0;
            }
        }
        if (battle.effects.user2.buffTurns && battle.effects.user2.buffTurns > 0) {
            battle.effects.user2.buffTurns--;
            if (battle.effects.user2.buffTurns === 0) {
                logs.push(`⬇️ **${battle.player2.username}**'s buff expired!`);
                battle.effects.user2.buff = 0;
            }
        }

        // Speech turns
        if (battle.effects.user1.speechTurns > 0) {
            battle.effects.user1.speechTurns--;
            if (battle.effects.user1.speechTurns === 0) {
                battle.effects.user1.speech = 1;
            }
        }
        if (battle.effects.user2.speechTurns > 0) {
            battle.effects.user2.speechTurns--;
            if (battle.effects.user2.speechTurns === 0) {
                battle.effects.user2.speech = 1;
            }
        }

        // Transform effects
        if (battle.effects.user1.transform > 0) {
            battle.effects.user1.transform--;
            if (battle.effects.user1.transform === 0) {
                battle.effects.user1.transformBoost = 1;
                logs.push(`🔄 **${battle.player1.username}**'s transformation ended!`);
            }
        }
        if (battle.effects.user2.transform > 0) {
            battle.effects.user2.transform--;
            if (battle.effects.user2.transform === 0) {
                battle.effects.user2.transformBoost = 1;
                logs.push(`🔄 **${battle.player2.username}**'s transformation ended!`);
            }
        }

        return logs;
    }

    /**
     * Check if a player can revive
     */
    checkRevive(battle: Battle, isPlayer1: boolean): boolean {
        const effects = isPlayer1 ? battle.effects.user1 : battle.effects.user2;
        const revived = isPlayer1 ? battle.revivedOnce.user1 : battle.revivedOnce.user2;

        if (effects.revive && !revived) {
            const maxHp = isPlayer1 ? battle.player1MaxHp : battle.player2MaxHp;
            const reviveHp = Math.floor(maxHp * 0.25);

            if (isPlayer1) {
                battle.player1Health = reviveHp;
                battle.revivedOnce.user1 = true;
            } else {
                battle.player2Health = reviveHp;
                battle.revivedOnce.user2 = true;
            }

            effects.revive = false;
            return true;
        }

        return false;
    }

    /**
     * Execute a full battle round - processes both players' turns and effects
     * @returns RoundResult with attacker, defender, damage, and skill used
     */
    executeRound(battle: Battle): { attacker: User; defender: User; damage: number; skill: string; effectLogs: string[]; historyEntry?: BattleHistoryEntry } {
        // Determine who attacks this round (alternating based on round count)
        const isPlayer1Turn = battle.roundCount % 2 === 1;
        const attacker = isPlayer1Turn ? battle.player1 : battle.player2;
        const defender = isPlayer1Turn ? battle.player2 : battle.player1;

        // Check if attacker is stunned
        const attackerStunned = isPlayer1Turn ? battle.player1Stunned : battle.player2Stunned;
        if (attackerStunned) {
            // Clear stun and skip turn
            if (isPlayer1Turn) battle.player1Stunned = false;
            else battle.player2Stunned = false;
            
            battle.roundCount++;
            return {
                attacker,
                defender,
                damage: 0,
                skill: `💫 **${attacker.username}** is stunned - Turn skipped!`,
                effectLogs: []
            };
        }

        // Deal damage and get the log + history entry
        const { log: damageLog, historyEntry } = this.dealDamage(battle, isPlayer1Turn);

        // Extract damage from history entry or log
        const damage = historyEntry.finalDamage || 0;

        // Process end-of-turn effects
        const effectLogs = this.handleEffects(battle);

        // Add effect logs to history entry
        if (historyEntry) {
            historyEntry.effectsApplied = effectLogs.map(l => l.replace(/\*\*/g, ''));
            historyEntry.p1HpAfter = battle.player1Health;
            historyEntry.p2HpAfter = battle.player2Health;
            
            // Add to battle history
            battle.history.push(historyEntry as BattleHistoryEntry);
        }

        // Check for revives if anyone died
        if (battle.player1Health <= 0) {
            const revived = this.checkRevive(battle, true);
            if (revived) {
                effectLogs.push(`✨ **${battle.player1.username}** revived with 25% HP!`);
            }
        }
        if (battle.player2Health <= 0) {
            const revived = this.checkRevive(battle, false);
            if (revived) {
                effectLogs.push(`✨ **${battle.player2.username}** revived with 25% HP!`);
            }
        }

        // Increment round counter
        battle.roundCount++;

        return {
            attacker,
            defender,
            damage,
            skill: damageLog,
            effectLogs,
            historyEntry: historyEntry as BattleHistoryEntry
        };
    }

    /**
     * End a battle and clean up
     */
    async endBattle(battleId: string): Promise<void> {
        // battleId could be guildId in our implementation
        await this.removeBattle(battleId);
    }
}

// Create singleton instance
const battleService = new BattleService();

export { BattleService };
export default battleService;
