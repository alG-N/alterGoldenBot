"use strict";
/**
 * Crossover Skillset for Death Battle
 * Ultimate mashup combining ALL powers from all anime universes
 * @module config/deathbattle/skillsets/crossover
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jjk_js_1 = __importDefault(require("./jjk.js"));
const naruto_js_1 = __importDefault(require("./naruto.js"));
const demonslayer_js_1 = __importDefault(require("./demonslayer.js"));
const onepiece_js_1 = __importDefault(require("./onepiece.js"));
// Combine all powers from all skillsets with source tags
const allPowers = [
    // JJK Powers (tagged)
    ...jjk_js_1.default.powers.map(p => ({ ...p, char: `${p.char} [JJK]` })),
    // Naruto Powers (tagged)
    ...naruto_js_1.default.powers.map(p => ({ ...p, char: `${p.char} [Naruto]` })),
    // Demon Slayer Powers (tagged)
    ...demonslayer_js_1.default.powers.map(p => ({ ...p, char: `${p.char} [DS]` })),
    // One Piece Powers (tagged)
    ...onepiece_js_1.default.powers.map(p => ({ ...p, char: `${p.char} [OP]` })),
];
// Ultimate Crossover-exclusive moves
const ultimateMoves = [
    { name: 'power of friendship', char: 'All Protagonists', type: 'buff', heal: true, boost: 1.45, desc: '💫 Power of Friendship!' },
    { name: 'villain monologue', char: 'All Villains', type: 'debuff', scale: 0.08, debuff: 0.55, turns: 3, desc: '🎭 Dramatic Villain Speech' },
    { name: 'plot armor activate', char: 'Main Character', type: 'revive', scale: 0.35, desc: '🛡️ Miraculous Plot Armor' },
    { name: 'ultimate final form', char: 'Anyone', type: 'transform', scale: 0.24, boost: 1.55, duration: 4, desc: '⚡ Ultimate Final Form!' },
    { name: 'training arc payoff', char: 'Underdog', type: 'momentum', scale: 0.18, bonus: 0.08, desc: '💪 Training Arc Payoff' },
    { name: 'flashback power', char: 'Any Fighter', type: 'buff', boost: 1.30, desc: '📖 Emotional Flashback Power-up' },
    { name: 'rival acknowledgement', char: 'Rival', type: 'damage', scale: 0.28, desc: '🤝 You\'re finally worthy!' },
    { name: 'mentor sacrifice', char: 'Mentor', type: 'sacrifice', scale: 0.50, self: 0.35, desc: '😢 Mentor\'s Final Lesson' },
    { name: 'opening theme power', char: 'Hero', type: 'buff', heal: true, boost: 1.50, desc: '🎵 OP Song Playing!' },
    { name: 'anime scream', char: 'Anyone', type: 'damage', scale: 0.20, desc: '📢 AAAAAAAAHHHHH!!!' },
];
// Combine all summon names from all skillsets
const allSummonNames = {
    ...jjk_js_1.default.summonNames,
    ...naruto_js_1.default.summonNames,
    ...demonslayer_js_1.default.summonNames,
    ...onepiece_js_1.default.summonNames,
    'power of friendship': ['Nakama', 'Best Friend', 'Rival-turned-ally', 'Mentor Spirit', 'Childhood Friend'],
    'flashback power': ['Deceased Parent', 'First Master', 'Lost Friend', 'Village Elder'],
};
const crossoverSkillset = {
    name: 'crossover',
    displayName: 'Anime Crossover',
    thumbnail: 'https://i.imgur.com/7jKQzXJ.png',
    powers: [...allPowers, ...ultimateMoves],
    summonNames: allSummonNames
};
exports.default = crossoverSkillset;
//# sourceMappingURL=crossover.js.map