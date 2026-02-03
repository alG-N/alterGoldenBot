"use strict";
/**
 * Skillset Service for Death Battle
 * Manages different anime skillsets and powers
 * @module services/fun/deathbattle/SkillsetService
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsetService = void 0;
const jjk_js_1 = __importDefault(require("../../../config/deathbattle/skillsets/jjk.js"));
const naruto_js_1 = __importDefault(require("../../../config/deathbattle/skillsets/naruto.js"));
const demonslayer_js_1 = __importDefault(require("../../../config/deathbattle/skillsets/demonslayer.js"));
const onepiece_js_1 = __importDefault(require("../../../config/deathbattle/skillsets/onepiece.js"));
// SKILLSET SERVICE CLASS
class SkillsetService {
    skillsets = new Map();
    constructor() {
        this.skillsets.set('jjk', jjk_js_1.default);
        this.skillsets.set('naruto', naruto_js_1.default);
        this.skillsets.set('demonslayer', demonslayer_js_1.default);
        this.skillsets.set('onepiece', onepiece_js_1.default);
    }
    /**
     * Get a skillset by name
     */
    getSkillset(name) {
        return this.skillsets.get(name.toLowerCase());
    }
    /**
     * Get all available skillset names
     */
    getAllSkillsets() {
        return Array.from(this.skillsets.keys());
    }
    /**
     * Check if a skillset exists
     */
    isValidSkillset(name) {
        return this.skillsets.has(name.toLowerCase());
    }
    /**
     * Get a random power from a skillset, avoiding recently used ones
     */
    getRandomPower(skillsetName, usedPowers = []) {
        const skillset = this.getSkillset(skillsetName);
        if (!skillset)
            return null;
        // Reset used powers if all have been used
        if (usedPowers.length >= skillset.powers.length) {
            usedPowers.length = 0;
        }
        const available = skillset.powers.filter(p => !usedPowers.includes(p.name));
        if (available.length === 0)
            return null;
        const selected = available[Math.floor(Math.random() * available.length)];
        usedPowers.push(selected.name);
        return selected;
    }
    /**
     * Get a random summon name for a power
     */
    getSummonName(skillsetName, powerName) {
        const skillset = this.getSkillset(skillsetName);
        if (!skillset || !skillset.summonNames[powerName]) {
            return 'Unknown Summon';
        }
        const summons = skillset.summonNames[powerName];
        return summons[Math.floor(Math.random() * summons.length)] || 'Unknown Summon';
    }
}
exports.SkillsetService = SkillsetService;
// Create singleton instance
const skillsetService = new SkillsetService();
exports.default = skillsetService;
//# sourceMappingURL=SkillsetService.js.map