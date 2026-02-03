/**
 * Owner Commands - Presentation Layer
 * @module presentation/commands/owner
 */

export { default as botcheck } from './botcheck.js';

// CommonJS compatibility for command loader
// Handle both `module.exports = cmd` and `export default cmd` patterns
const getCmd = (mod: { default?: unknown }) => mod.default || mod;
module.exports = {
    botcheck: getCmd(require('./botcheck')),
};
