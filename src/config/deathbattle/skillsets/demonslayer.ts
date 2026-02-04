/**
 * Demon Slayer Skillset for Death Battle
 * Breathing techniques from Kimetsu no Yaiba
 * @module config/deathbattle/skillsets/demonslayer
 */

import type { Skillset } from './types.js';

const demonslayerSkillset: Skillset = {
    name: 'demonslayer',
    displayName: 'Demon Slayer',
    thumbnail: 'https://i.imgur.com/YQd3T7O.png',
    powers: [
        { name: 'water breathing combo', char: 'Tanjiro', type: 'combo', scale: 0.06, hits: 4, desc: 'Water Breathing: Flowing Dance' },
        { name: 'hinokami kagura', char: 'Tanjiro', type: 'burn_stack', scale: 0.09, stacks: 3, desc: 'Hinokami Kagura: Rising Sun', effectName: 'Solar Flames' },
        { name: 'thunderclap flash', char: 'Zenitsu', type: 'execute', scale: 0.08, threshold: 0.25, desc: 'Thunder Breathing: Godspeed' },
        { name: 'beast fang', char: 'Inosuke', type: 'bleed', scale: 0.05, turns: 4, desc: 'Beast Breathing: Fang Rend', effectName: 'Savage Wounds' },
        { name: 'insect sting', char: 'Shinobu', type: 'poison_weaken', scale: 0.04, turns: 5, weaken: 0.20, desc: 'Insect Breathing: Dance of the Butterfly', effectName: 'Wisteria Venom' },
        { name: 'flame tiger', char: 'Rengoku', type: 'momentum', scale: 0.10, bonus: 0.04, desc: 'Flame Breathing: Raging Tiger' },
        { name: 'rengoku spirit', char: 'Rengoku', type: 'revive', scale: 0.08, desc: 'Unyielding Flame Spirit' },
        { name: 'obscuring mist', char: 'Muichiro', type: 'dodge', turns: 2, desc: 'Mist Breathing: Obscuring Clouds' },
        { name: 'love whip', char: 'Mitsuri', type: 'lifesteal', scale: 0.12, steal: 0.35, desc: 'Love Breathing: Shivers of First Love' },
        { name: 'serpent coil', char: 'Obanai', type: 'constrict', scale: 0.08, turns: 3, desc: 'Serpent Breathing: Coiling Constrict', effectName: 'Serpent Bind' },
        { name: 'sound waves', char: 'Tengen', type: 'echo', scale: 0.10, desc: 'Sound Breathing: Score Resonance' },
        { name: 'stone fortress', char: 'Gyomei', type: 'reflect', scale: 0.06, desc: 'Stone Breathing: Stone Skin' },
        { name: 'wind scythe', char: 'Sanemi', type: 'bleed', scale: 0.09, turns: 3, desc: 'Wind Breathing: Gale Slash', effectName: 'Wind Laceration' },
        { name: 'demon blood', char: 'Nezuko', type: 'berserk', scale: 0.14, recoil: 0.10, desc: 'Blood Demon Art: Exploding Blood' },
        { name: 'exploding blood', char: 'Nezuko', type: 'detonate', scale: 0.15, desc: 'Exploding Blood: Chain Detonation' },
        { name: 'moon crescent', char: 'Kokushibo', type: 'combo', scale: 0.05, hits: 6, desc: 'Moon Breathing: Sixfold Crescent' },
        { name: 'compass needle', char: 'Akaza', type: 'counter', scale: 0.12, desc: 'Destructive Death: Compass Needle' },
        { name: 'frozen blood', char: 'Doma', type: 'freeze', turns: 2, damage: 0.06, desc: 'Cryokinesis: Frozen Lotus', effectName: 'Ice Prison' },
        { name: 'red blade', char: 'Tanjiro', type: 'mark_boost', scale: 0.12, boost: 1.30, desc: 'Red Nichirin Blade', effectName: 'Demon Slayer Mark' },
        { name: 'transparent world', char: 'Tanjiro', type: 'critical', scale: 0.15, crit: 2.5, desc: 'Transparent World Vision' },
        { name: 'sun breath', char: 'Yoriichi', type: 'charge', scale: 0.30, charges: 2, desc: 'Sun Breathing: Thirteenth Form' }
    ],
    summonNames: {}
};

export default demonslayerSkillset;
