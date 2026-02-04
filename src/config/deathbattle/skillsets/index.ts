/**
 * Skillsets Index
 * Re-exports all skillsets for Death Battle
 * @module config/deathbattle/skillsets
 */

export type { Power, Skillset } from './types.js';

import naruto from './naruto.js';
import onepiece from './onepiece.js';
import jjk from './jjk.js';
import demonslayer from './demonslayer.js';
import crossover from './crossover.js';

export { naruto, onepiece, jjk, demonslayer, crossover };

// All skillsets as array
export const skillsets = [naruto, onepiece, jjk, demonslayer, crossover];

// Skillsets map by name
export const skillsetsMap = {
    naruto,
    onepiece,
    jjk,
    demonslayer,
    crossover
};

export default skillsets;
