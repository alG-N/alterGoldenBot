/**
 * Music Commands Index
 */

export { default as music } from './music.js';

// CommonJS compatibility for command loader
const getCmd = (mod: { default?: unknown }) => mod.default || mod;
module.exports = {
    music: getCmd(require('./music')),
};
