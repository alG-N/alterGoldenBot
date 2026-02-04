"use strict";
/**
 * Naruto Skillset for Death Battle
 * Jutsu from the Naruto series
 * @module config/deathbattle/skillsets/naruto
 */
Object.defineProperty(exports, "__esModule", { value: true });
const narutoSkillset = {
    name: 'naruto',
    displayName: 'Naruto',
    thumbnail: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/2f78d7b0-22ad-42da-b6cd-ce88f18e8123/dg5yyyl-f4c83fec-4b1d-4ad5-8dd4-09b3e3e0f4e9.png/v1/fill/w_894,h_894/naruto_icon_by_kotoamatsukami_dg5yyyl-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTAyNCIsInBhdGgiOiJcL2ZcLzJmNzhkN2IwLTIyYWQtNDJkYS1iNmNkLWNlODhmMThlODEyM1wvZGc1eXl5bC1mNGM4M2ZlYy00YjFkLTRhZDUtOGRkNC0wOWIzZTNlMGY0ZTkucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.lqzKG0H_LYKaQJvW9v-0M9MYNFBq3m_qG0YN9dJCq_Y',
    powers: [
        { name: 'rasengan', char: 'Naruto', type: 'damage', scale: 0.16, desc: 'Rasengan' },
        { name: 'shadow clone jutsu', char: 'Naruto', type: 'phantom', scale: 0.04, illusions: 4, desc: 'Shadow Clone Jutsu' },
        { name: 'nine tails chakra', char: 'Naruto', type: 'transform', scale: 0.08, duration: 4, boost: 1.4, desc: 'Nine Tails Chakra Mode', effectName: 'Kurama Chakra' },
        { name: 'chidori', char: 'Sasuke', type: 'piercing', scale: 0.14, ignore: 0.35, desc: 'Chidori' },
        { name: 'amaterasu', char: 'Sasuke', type: 'dot', scale: 0.06, turns: 4, desc: 'Amaterasu', effectName: 'Black Flames' },
        { name: 'susanoo', char: 'Sasuke', type: 'buff', boost: 1.35, turns: 4, desc: 'Susanoo', effectName: 'Spectral Warrior' },
        { name: 'byakugan', char: 'Hinata', type: 'debuff', scale: 0.08, debuff: 0.65, turns: 3, desc: 'Gentle Fist', effectName: 'Chakra Blocked' },
        { name: 'eight trigrams', char: 'Neji', type: 'combo', scale: 0.04, hits: 8, desc: 'Eight Trigrams Sixty-Four Palms' },
        { name: 'primary lotus', char: 'Rock Lee', type: 'sacrifice', scale: 0.32, self: 0.20, desc: 'Primary Lotus' },
        { name: 'puppet master', char: 'Sasori', type: 'random', scale: 0.09, desc: 'Puppet Master Jutsu' },
        { name: 'sand coffin', char: 'Gaara', type: 'constrict', scale: 0.08, turns: 3, desc: 'Sand Coffin', effectName: 'Sand Burial' },
        { name: 'wood style', char: 'Hashirama', type: 'trap', scale: 0.10, desc: 'Wood Style: Deep Forest Emergence' },
        { name: 'reanimation', char: 'Orochimaru', type: 'revive', scale: 0.07, desc: 'Reanimation Jutsu' },
        { name: 'rasen shuriken', char: 'Naruto', type: 'execute', scale: 0.08, threshold: 0.25, desc: 'Wind Style: Rasen Shuriken' },
        { name: 'kamui', char: 'Kakashi', type: 'swap', scale: 0.10, desc: 'Kamui' },
        { name: 'tsukuyomi', char: 'Itachi', type: 'stun', scale: 0.06, turns: 2, desc: 'Tsukuyomi', effectName: 'Genjutsu Bind' },
        { name: 'explosive clay', char: 'Deidara', type: 'burn_stack', scale: 0.08, stacks: 3, desc: 'Explosive Clay C3', effectName: 'Clay Bomb' },
        { name: 'summoning jutsu', char: 'Jiraiya', type: 'random', scale: 0.11, desc: 'Summoning Jutsu' },
        { name: 'healing jutsu', char: 'Sakura', type: 'heal', scale: 0.10, desc: 'Mitotic Regeneration' },
        { name: 'particle style', char: 'Onoki', type: 'piercing', scale: 0.15, ignore: 0.5, desc: 'Particle Style: Atomic Dismantling' },
        { name: 'infinite tsukuyomi', char: 'Madara', type: 'slow', scale: 0.06, turns: 3, desc: 'Infinite Tsukuyomi', effectName: 'Dream Bind' }
    ],
    summonNames: {
        'shadow clone jutsu': ['Shadow Clone', 'Shadow Clone Squad', 'Multi Shadow Clone'],
        'puppet master': ['Hiruko', 'Crow', 'Black Ant', 'Salamander', '3rd Kazekage'],
        'summoning jutsu': ['Gamabunta', 'Gamaken', 'Gamahiro', 'Ma and Pa', 'Katsuyu']
    }
};
exports.default = narutoSkillset;
//# sourceMappingURL=naruto.js.map