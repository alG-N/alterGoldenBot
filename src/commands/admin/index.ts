/**
 * Admin Commands Index
 * @module commands/admin
 */

export { default as automod } from './automod.js';
export { default as ban } from './ban.js';
export { default as case_ } from './case.js';
export { default as clearwarns } from './clearwarns.js';
export { default as delete_ } from './delete.js';
export { default as delwarn } from './delwarn.js';
export { default as kick } from './kick.js';
export { default as lockdown } from './lockdown.js';
export { default as mute } from './mute.js';
export { default as raid } from './raid.js';
export { default as setting } from './setting.js';
export { default as slowmode } from './slowmode.js';
export { default as snipe } from './snipe.js';
export { default as warn } from './warn.js';
export { default as warnings } from './warnings.js';

// CommonJS compatibility for command loader
// Handle both `module.exports = cmd` and `export default cmd` patterns
const getCmd = (mod: { default?: unknown }) => mod.default || mod;
module.exports = {
    automod: getCmd(require('./automod')),
    ban: getCmd(require('./ban')),
    case: getCmd(require('./case')),
    clearwarns: getCmd(require('./clearwarns')),
    delete: getCmd(require('./delete')),
    delwarn: getCmd(require('./delwarn')),
    kick: getCmd(require('./kick')),
    lockdown: getCmd(require('./lockdown')),
    mute: getCmd(require('./mute')),
    raid: getCmd(require('./raid')),
    setting: getCmd(require('./setting')),
    slowmode: getCmd(require('./slowmode')),
    snipe: getCmd(require('./snipe')),
    warn: getCmd(require('./warn')),
    warnings: getCmd(require('./warnings')),
};
