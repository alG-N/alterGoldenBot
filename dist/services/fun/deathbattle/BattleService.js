"use strict";
/**
 * Battle Service for Death Battle
 * Manages combat mechanics and state
 * @module services/fun/deathbattle/BattleService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleService = void 0;
const SkillsetService_js_1 = __importDefault(require("./SkillsetService.js"));
// DEFAULT EFFECTS
const createDefaultEffects = () => ({
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
});
// BATTLE SERVICE CLASS
class BattleService {
    activeBattles = new Map();
    /**
     * Create a new battle between two players
     */
    createBattle(guildId, player1, player2, skillsetName, player1Hp, player2Hp) {
        const skillset = SkillsetService_js_1.default.getSkillset(skillsetName);
        const battle = {
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
        };
        this.activeBattles.set(guildId, battle);
        return battle;
    }
    /**
     * Get an active battle by guild ID
     */
    getBattle(guildId) {
        return this.activeBattles.get(guildId);
    }
    /**
     * Remove a battle and clear its interval
     */
    removeBattle(guildId) {
        const battle = this.activeBattles.get(guildId);
        if (battle?.interval) {
            clearInterval(battle.interval);
        }
        this.activeBattles.delete(guildId);
    }
    /**
     * Calculate damage based on HP scaling
     */
    calculateDamage(base, hp, debuff = 1, boost = 1) {
        let scale = 1;
        if (hp > 1000000)
            scale = 3.5;
        else if (hp > 100000)
            scale = 2.5;
        else if (hp > 10000)
            scale = 1.7;
        else if (hp > 1000)
            scale = 1.2;
        else if (hp > 100)
            scale = 1;
        else
            scale = 0.7;
        return Math.floor(base * scale * debuff * boost);
    }
    /**
     * Process a turn and deal damage
     */
    dealDamage(battle, isPlayer1Turn) {
        const attacker = isPlayer1Turn ? battle.player1 : battle.player2;
        const defender = isPlayer1Turn ? battle.player2 : battle.player1;
        const defenderHp = isPlayer1Turn ? battle.player2Health : battle.player1Health;
        const attackerMaxHp = isPlayer1Turn ? battle.player1MaxHp : battle.player2MaxHp;
        const defenderMaxHp = isPlayer1Turn ? battle.player1MaxHp : battle.player2MaxHp;
        let log = '';
        let damage = 0;
        const atkEff = isPlayer1Turn ? battle.effects.user1 : battle.effects.user2;
        const defEff = isPlayer1Turn ? battle.effects.user2 : battle.effects.user1;
        // Dodge check
        if (defEff.dodge > 0) {
            defEff.dodge--;
            return `${defender.username} dodged ${attacker.username}'s attack with perfect evasion!`;
        }
        // Foresight check
        if (defEff.foresight > 0 && Math.random() < 0.6) {
            defEff.foresight--;
            return `${defender.username} saw the future and avoided ${attacker.username}'s attack!`;
        }
        // Calculate boosts
        const bindingBoost = atkEff.binding ? 1.3 : 1;
        const debuff = atkEff.speech * atkEff.poisonWeaken;
        const speedMult = atkEff.speedBoost;
        const markMult = atkEff.markBoost;
        const transformMult = atkEff.transform > 0 ? atkEff.transformBoost : 1;
        const berserkMult = atkEff.berserk ? 1.5 : 1;
        const totalBoost = bindingBoost * speedMult * markMult * transformMult * berserkMult;
        // Get random power
        const power = SkillsetService_js_1.default.getRandomPower(battle.skillsetName, battle.usedPowers);
        if (!power) {
            damage = this.calculateDamage(Math.floor(defenderMaxHp * 0.10) + 10, defenderMaxHp, debuff, totalBoost);
            log = `${attacker.username} used a basic attack for **${damage}** damage!`;
        }
        else {
            [damage, log] = this.processPower(power, attacker, defender, battle, defenderHp, attackerMaxHp, defenderMaxHp, debuff, totalBoost, atkEff, defEff, isPlayer1Turn);
        }
        // Handle reflect
        if (defEff.reflect && damage > 0) {
            const reflectDmg = Math.floor(damage * 0.5);
            if (isPlayer1Turn)
                battle.player1Health = Math.max(0, battle.player1Health - reflectDmg);
            else
                battle.player2Health = Math.max(0, battle.player2Health - reflectDmg);
            log += ` **${reflectDmg}** damage reflected back to ${attacker.username}!`;
            defEff.reflect = false;
        }
        // Handle redirect
        if (defEff.redirect && damage > 0) {
            const redirectDmg = Math.floor(damage * 0.5);
            if (isPlayer1Turn)
                battle.player1Health = Math.max(0, battle.player1Health - redirectDmg);
            else
                battle.player2Health = Math.max(0, battle.player2Health - redirectDmg);
            log += ` **${redirectDmg}** damage redirected back to ${attacker.username}!`;
            defEff.redirect = false;
        }
        // Apply damage
        if (isPlayer1Turn) {
            battle.player2Health = Math.max(0, battle.player2Health - damage);
            battle.lastDamageDealt.user1 = damage;
        }
        else {
            battle.player1Health = Math.max(0, battle.player1Health - damage);
            battle.lastDamageDealt.user2 = damage;
        }
        return log;
    }
    /**
     * Process a power and return damage + log
     */
    processPower(power, attacker, defender, battle, defenderHp, attackerMaxHp, defenderMaxHp, debuff, totalBoost, atkEff, defEff, isPlayer1Turn) {
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
                }
                else {
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
                if (isPlayer1Turn)
                    battle.player1Health = Math.min(battle.player1Health + stolen, battle.player1MaxHp);
                else
                    battle.player2Health = Math.min(battle.player2Health + stolen, battle.player2MaxHp);
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
                if (isPlayer1Turn)
                    battle.player1Health = Math.max(0, battle.player1Health - recoil);
                else
                    battle.player2Health = Math.max(0, battle.player2Health - recoil);
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
                }
                else {
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
                }
                else {
                    log = `${attacker.username} used ${power.desc} for **${damage}** damage!`;
                }
                break;
            case 'drain_power': {
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 15, defenderMaxHp, debuff, totalBoost);
                const selfDrain = Math.floor(attackerMaxHp * (power.self || 0.05));
                if (isPlayer1Turn)
                    battle.player1Health = Math.max(0, battle.player1Health - selfDrain);
                else
                    battle.player2Health = Math.max(0, battle.player2Health - selfDrain);
                defEff.speech = Math.max(0.5, defEff.speech - 0.1);
                log = `${attacker.username} used ${power.desc}, dealing **${damage}** damage, taking **${selfDrain}** self-damage, and weakening opponent!`;
                break;
            }
            case 'phantom':
                for (let i = 0; i < (power.illusions || 3); i++) {
                    damage += this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.04)) + 8, defenderMaxHp, debuff, totalBoost);
                }
                log = `${attacker.username} created ${power.illusions} phantoms with ${power.desc}, dealing **${damage}** total damage!`;
                break;
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
                if (isPlayer1Turn)
                    battle.player1Health = Math.min(battle.player1Health + demonSteal, battle.player1MaxHp);
                else
                    battle.player2Health = Math.min(battle.player2Health + demonSteal, battle.player2MaxHp);
                log = `${attacker.username} unleashed ${power.desc}, dealing **${damage}** damage and stealing **${demonSteal}** HP!`;
                break;
            }
            case 'laser':
                damage = this.calculateDamage(Math.floor(defenderMaxHp * (power.scale || 0.07)) + 15, defenderMaxHp, debuff, totalBoost);
                if (power.piercing) {
                    damage = Math.floor(damage * 1.3);
                    log = `${attacker.username} fired ${power.desc}, piercing through for **${damage}** damage!`;
                }
                else {
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
                }
                else {
                    log = `${attacker.username} used ${power.desc} for **${damage}** damage!`;
                }
                break;
            default:
                damage = this.calculateDamage(Math.floor(defenderMaxHp * 0.10) + 10, defenderMaxHp, debuff, totalBoost);
                log = `${attacker.username} used a combo attack and dealt **${damage}** damage to ${defender.username}!`;
        }
        return [damage, log];
    }
    /**
     * Process end-of-turn effects
     */
    handleEffects(battle) {
        const logs = [];
        // Shrine effects
        if (battle.effects.user1.shrine > 0) {
            const dmg = Math.max(Math.floor(battle.player2MaxHp * 0.05), 1);
            battle.player2Health = Math.max(0, battle.player2Health - dmg);
            logs.push(`**Malevolent Shrine**: Dealt **${dmg}** damage to **${battle.player2.username}**!`);
            battle.effects.user1.shrine--;
        }
        if (battle.effects.user2.shrine > 0) {
            const dmg = Math.max(Math.floor(battle.player1MaxHp * 0.05), 1);
            battle.player1Health = Math.max(0, battle.player1Health - dmg);
            logs.push(`**Malevolent Shrine**: Dealt **${dmg}** damage to **${battle.player1.username}**!`);
            battle.effects.user2.shrine--;
        }
        // Burn effects
        if (battle.effects.user1.burn > 0) {
            const burnDmg = Math.floor(battle.player1MaxHp * 0.035);
            battle.player1Health = Math.max(0, battle.player1Health - burnDmg);
            logs.push(`**Burn**: **${battle.player2.username}** dealt **${burnDmg}** burn damage to **${battle.player1.username}**!`);
            battle.effects.user1.burn--;
        }
        if (battle.effects.user2.burn > 0) {
            const burnDmg = Math.floor(battle.player2MaxHp * 0.035);
            battle.player2Health = Math.max(0, battle.player2Health - burnDmg);
            logs.push(`**Burn**: **${battle.player1.username}** dealt **${burnDmg}** burn damage to **${battle.player2.username}**!`);
            battle.effects.user2.burn--;
        }
        // Bleed effects
        if (battle.effects.user1.bleed > 0) {
            const bleedDmg = Math.floor(battle.player1MaxHp * 0.04);
            battle.player1Health = Math.max(0, battle.player1Health - bleedDmg);
            logs.push(`**Bleed**: **${battle.player1.username}** took **${bleedDmg}** bleed damage!`);
            battle.effects.user1.bleed--;
        }
        if (battle.effects.user2.bleed > 0) {
            const bleedDmg = Math.floor(battle.player2MaxHp * 0.04);
            battle.player2Health = Math.max(0, battle.player2Health - bleedDmg);
            logs.push(`**Bleed**: **${battle.player2.username}** took **${bleedDmg}** bleed damage!`);
            battle.effects.user2.bleed--;
        }
        // Poison effects
        if (battle.effects.user1.poison > 0) {
            const poisonDmg = Math.floor(battle.player1MaxHp * 0.03);
            battle.player1Health = Math.max(0, battle.player1Health - poisonDmg);
            logs.push(`**Poison**: **${battle.player1.username}** took **${poisonDmg}** poison damage!`);
            battle.effects.user1.poison--;
            if (battle.effects.user1.poison === 0)
                battle.effects.user1.poisonWeaken = 1;
        }
        if (battle.effects.user2.poison > 0) {
            const poisonDmg = Math.floor(battle.player2MaxHp * 0.03);
            battle.player2Health = Math.max(0, battle.player2Health - poisonDmg);
            logs.push(`**Poison**: **${battle.player2.username}** took **${poisonDmg}** poison damage!`);
            battle.effects.user2.poison--;
            if (battle.effects.user2.poison === 0)
                battle.effects.user2.poisonWeaken = 1;
        }
        // Constrict effects
        if (battle.effects.user1.constrict > 0) {
            battle.player1Health = Math.max(0, battle.player1Health - battle.effects.user1.constrictDmg);
            logs.push(`**Constrict**: **${battle.player1.username}** took **${battle.effects.user1.constrictDmg}** constriction damage!`);
            battle.effects.user1.constrict--;
        }
        if (battle.effects.user2.constrict > 0) {
            battle.player2Health = Math.max(0, battle.player2Health - battle.effects.user2.constrictDmg);
            logs.push(`**Constrict**: **${battle.player2.username}** took **${battle.effects.user2.constrictDmg}** constriction damage!`);
            battle.effects.user2.constrict--;
        }
        // Frozen effects
        if (battle.effects.user1.frozen > 0) {
            const frozenDmg = Math.floor(battle.player1MaxHp * 0.02);
            battle.player1Health = Math.max(0, battle.player1Health - frozenDmg);
            logs.push(`**Frozen**: **${battle.player1.username}** took **${frozenDmg}** freeze damage!`);
            battle.effects.user1.frozen--;
        }
        if (battle.effects.user2.frozen > 0) {
            const frozenDmg = Math.floor(battle.player2MaxHp * 0.02);
            battle.player2Health = Math.max(0, battle.player2Health - frozenDmg);
            logs.push(`**Frozen**: **${battle.player2.username}** took **${frozenDmg}** freeze damage!`);
            battle.effects.user2.frozen--;
        }
        // Water Prison effects
        if (battle.effects.user1.waterPrison && battle.effects.user1.waterPrison > 0) {
            const drownDmg = Math.floor(battle.player1MaxHp * 0.045);
            battle.player1Health = Math.max(0, battle.player1Health - drownDmg);
            logs.push(`**Water Prison**: **${battle.player1.username}** is drowning for **${drownDmg}** damage!`);
            battle.effects.user1.waterPrison--;
        }
        if (battle.effects.user2.waterPrison && battle.effects.user2.waterPrison > 0) {
            const drownDmg = Math.floor(battle.player2MaxHp * 0.045);
            battle.player2Health = Math.max(0, battle.player2Health - drownDmg);
            logs.push(`**Water Prison**: **${battle.player2.username}** is drowning for **${drownDmg}** damage!`);
            battle.effects.user2.waterPrison--;
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
                logs.push(`**${battle.player1.username}**'s transformation ended!`);
            }
        }
        if (battle.effects.user2.transform > 0) {
            battle.effects.user2.transform--;
            if (battle.effects.user2.transform === 0) {
                battle.effects.user2.transformBoost = 1;
                logs.push(`**${battle.player2.username}**'s transformation ended!`);
            }
        }
        return logs;
    }
    /**
     * Check if a player can revive
     */
    checkRevive(battle, isPlayer1) {
        const effects = isPlayer1 ? battle.effects.user1 : battle.effects.user2;
        const revived = isPlayer1 ? battle.revivedOnce.user1 : battle.revivedOnce.user2;
        if (effects.revive && !revived) {
            const maxHp = isPlayer1 ? battle.player1MaxHp : battle.player2MaxHp;
            const reviveHp = Math.floor(maxHp * 0.25);
            if (isPlayer1) {
                battle.player1Health = reviveHp;
                battle.revivedOnce.user1 = true;
            }
            else {
                battle.player2Health = reviveHp;
                battle.revivedOnce.user2 = true;
            }
            effects.revive = false;
            return true;
        }
        return false;
    }
}
exports.BattleService = BattleService;
// Create singleton instance
const battleService = new BattleService();
exports.default = battleService;
//# sourceMappingURL=BattleService.js.map