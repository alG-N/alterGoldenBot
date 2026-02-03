/**
 * Fun Commands - Presentation Layer
 * @module presentation/commands/fun
 */

export { default as deathbattle } from './deathbattle.js';
export { default as say } from './say.js';

// CommonJS compatibility for command loader
// Handle both `module.exports = cmd` and `export default cmd` patterns
const getCmd = (mod: { default?: unknown }) => mod.default || mod;
module.exports = {
    deathbattle: getCmd(require('./deathbattle')),
    say: getCmd(require('./say')),
};
