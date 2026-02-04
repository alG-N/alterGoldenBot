"use strict";
/**
 * Jujutsu Kaisen Skillset for Death Battle
 * Cursed techniques from JJK
 * @module config/deathbattle/skillsets/jjk
 */
Object.defineProperty(exports, "__esModule", { value: true });
const jjkSkillset = {
    name: 'jjk',
    displayName: 'Jujutsu Kaisen',
    thumbnail: 'https://steamuserimages-a.akamaihd.net/ugc/5107676531909210294/7A14253B35558071FBE17AD6F27C6158D078960C/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false',
    powers: [
        { name: 'hollow purple', char: 'Gojo', type: 'damage', scale: 0.20, desc: 'Hollow Purple' },
        { name: 'infinity', char: 'Gojo', type: 'stun', scale: 0.08, turns: 1, desc: 'Infinity', effectName: 'Cursed Barrier' },
        { name: 'black flash', char: 'Itadori', type: 'critical', scale: 0.12, crit: 2.0, desc: 'Black Flash' },
        { name: 'summon mahoraga', char: 'Fushiguro', type: 'damage', scale: 0.13, desc: 'Summon Mahoraga' },
        { name: 'seven shadows', char: 'Fushiguro', type: 'random', scale: 0.08, desc: 'Shikigami: Seven Shadows' },
        { name: 'malevolent shrine', char: 'Sukuna', type: 'dot', scale: 0.04, turns: 4, desc: 'Malevolent Shrine', effectName: 'Cleave & Dismantle' },
        { name: 'world cutting slash', char: 'Sukuna', type: 'execute', scale: 0.06, threshold: 0.25, desc: 'World Cutting Slash' },
        { name: 'cursed speech', char: 'Inumaki', type: 'debuff', scale: 0.07, debuff: 0.7, turns: 2, desc: 'Cursed Speech: Stop', effectName: 'Cursed Tongue' },
        { name: 'reverse cursed energy', char: 'Yuta', type: 'heal', scale: 0.10, desc: 'Reverse Cursed Energy' },
        { name: 'boogie woogie', char: 'Todo', type: 'swap', scale: 0.09, desc: 'Boogie Woogie' },
        { name: 'ratio technique', char: 'Nanami', type: 'piercing', scale: 0.10, ignore: 0.3, desc: 'Ratio Technique: 7:3' },
        { name: 'idle death gamble', char: 'Hakari', type: 'gamble', scale: 0.11, desc: 'Idle Death Gamble' },
        { name: 'lightning', char: 'Kashimo', type: 'charge', scale: 0.28, charges: 2, desc: 'Mythical Beast Amber' },
        { name: 'volcano', char: 'Jogo', type: 'dot', scale: 0.06, turns: 3, desc: 'Coffin of the Iron Mountain', effectName: 'Volcanic Flames' },
        { name: 'ice formation', char: 'Uraume', type: 'freeze', damage: 0.07, turns: 2, desc: 'Ice Formation', effectName: 'Frost Bind' },
        { name: 'blood manipulation', char: 'Choso', type: 'bleed', scale: 0.08, turns: 3, desc: 'Piercing Blood', effectName: 'Blood Drain' },
        { name: 'heavenly restriction', char: 'Maki', type: 'buff', heal: true, scale: 0.08, boost: 1.3, turns: 4, desc: 'Heavenly Restriction', effectName: 'Physical Prowess' },
        { name: 'star rage', char: 'Yuki', type: 'sacrifice', scale: 0.35, self: 0.25, desc: 'Star Rage' },
        { name: 'soul transformation', char: 'Mahito', type: 'poison_weaken', scale: 0.07, turns: 3, weaken: 0.25, desc: 'Idle Transfiguration', effectName: 'Soul Corruption' },
        { name: 'cursed spirit manipulation', char: 'Geto', type: 'random', scale: 0.09, desc: 'Cursed Spirit Manipulation' },
        { name: 'domain expansion', char: 'Various', type: 'transform', scale: 0.09, duration: 4, boost: 1.4, desc: 'Domain Expansion', effectName: 'Domain' },
        { name: 'medical technique', char: 'Shoko', type: 'heal', scale: 0.09, desc: 'Reverse Cursed Medical Technique' }
    ],
    summonNames: {
        'seven shadows': ['Divine Dog', 'Nue', 'Great Serpent', 'Toad', 'Max Elephant', 'Rabbit Escape', 'Black Divine Dog'],
        'cursed spirit manipulation': ['Rika', 'Tamamo-no-Mae', 'Rainbow Dragon', 'Smallpox Deity', 'Fly Heads']
    }
};
exports.default = jjkSkillset;
//# sourceMappingURL=jjk.js.map