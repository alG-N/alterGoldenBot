"use strict";
/**
 * One Piece Skillset for Death Battle
 * Devil Fruit powers and Haki techniques
 * @module config/deathbattle/skillsets/onepiece
 */
Object.defineProperty(exports, "__esModule", { value: true });
const onepieceSkillset = {
    name: 'onepiece',
    displayName: 'One Piece',
    thumbnail: 'https://i.imgur.com/kJXbNQY.png',
    powers: [
        { name: 'gum gum gatling', char: 'Luffy', type: 'combo', scale: 0.06, hits: 5, desc: 'Gum-Gum Gatling Gun' },
        { name: 'gear second', char: 'Luffy', type: 'bloodpump', scale: 0.10, speed: 1.8, desc: 'Gear Second', effectName: 'Blood Pump' },
        { name: 'gear fifth', char: 'Luffy', type: 'reality_warp', scale: 0.16, desc: 'Gear Fifth: Nika Liberation' },
        { name: 'enma unleashed', char: 'Zoro', type: 'drain_power', scale: 0.14, self: 0.10, desc: 'Enma: King of Hell' },
        { name: 'ashura', char: 'Zoro', type: 'phantom', scale: 0.05, illusions: 3, desc: 'Nine Sword Style: Ashura' },
        { name: 'observation haki', char: 'Luffy', type: 'foresight', turns: 3, desc: 'Observation Haki: Future Sight' },
        { name: 'ifrit jambe', char: 'Sanji', type: 'dot', scale: 0.06, turns: 3, desc: 'Ifrit Jambe', effectName: 'Hellfire' },
        { name: 'sky walk', char: 'Sanji', type: 'aerial', scale: 0.12, desc: 'Sky Walk: Flambage Shot' },
        { name: 'thunder tempo', char: 'Nami', type: 'chain_lightning', scale: 0.08, chains: 3, desc: 'Thunder Breed Tempo' },
        { name: 'mirage tempo', char: 'Nami', type: 'illusion_copy', turns: 2, desc: 'Mirage Tempo' },
        { name: 'green star', char: 'Usopp', type: 'trap', scale: 0.09, desc: 'Pop Green: Devil' },
        { name: 'monster point', char: 'Chopper', type: 'transform', scale: 0.14, boost: 1.45, duration: 4, desc: 'Monster Point', effectName: 'Rumble Ball' },
        { name: 'gigante fleur', char: 'Robin', type: 'giant_limbs', scale: 0.13, desc: 'Gigante Fleur' },
        { name: 'demonio fleur', char: 'Robin', type: 'demon_form', scale: 0.15, lifesteal: 0.25, desc: 'Demonio Fleur' },
        { name: 'radical beam', char: 'Franky', type: 'laser', scale: 0.14, piercing: true, desc: 'Franky Radical Beam' },
        { name: 'soul parade', char: 'Brook', type: 'ghost', scale: 0.11, desc: 'Soul Solid' },
        { name: 'ice world', char: 'Brook', type: 'freeze', turns: 2, damage: 0.07, desc: 'Soul Solid: Ice Burn', effectName: 'Soul Chill' },
        { name: 'fishman secret', char: 'Jinbe', type: 'water_prison', scale: 0.12, turns: 2, desc: 'Fishman Karate: Ocean Current', effectName: 'Tidal Prison' },
        { name: 'ocean current', char: 'Jinbe', type: 'redirect', scale: 0.06, desc: 'Vagabond Drill' },
        { name: 'tremor quake', char: 'Whitebeard', type: 'earthquake', scale: 0.20, aoe: true, desc: 'Gura Gura no Mi: Seaquake' },
        { name: 'conquerors haki', char: 'Shanks', type: 'stun', scale: 0.08, turns: 2, desc: 'Conqueror\'s Haki', effectName: 'Supreme King' },
        { name: 'magma fist', char: 'Akainu', type: 'dot', scale: 0.08, turns: 4, desc: 'Magu Magu no Mi: Meteor Volcano', effectName: 'Magma Burns' }
    ],
    summonNames: {
        'ashura': ['Ashura Form', 'Demon Spirit', 'Nine-Sword Spirit']
    }
};
exports.default = onepieceSkillset;
//# sourceMappingURL=onepiece.js.map