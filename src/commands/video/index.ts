/**
 * Video Commands Index
 */

export { default as video } from './video.js';

// CommonJS compatibility for command loader
const getCmd = (mod: { default?: unknown }) => mod.default || mod;
module.exports = {
    video: getCmd(require('./video')),
};
