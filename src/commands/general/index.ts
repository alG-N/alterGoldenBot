/**
 * General Commands Index
 * @module commands/general
 */

// ESM exports
export { default as ping } from './ping.js';
export { default as help } from './help.js';
export { default as avatar } from './avatar.js';
export { default as serverinfo } from './serverinfo.js';
export { default as afk, isUserAfk, removeAfk, formatDuration, onMessage as afkOnMessage } from './afk.js';
export { default as invite } from './invite.js';
export { default as report, handleModal as reportHandleModal } from './report.js';
export { default as roleinfo } from './roleinfo.js';

// CommonJS compatibility for command loader
// Handle both `module.exports = cmd` and `export default cmd` patterns
const getCmd = (mod: { default?: unknown }) => mod.default || mod;
module.exports = {
    ping: getCmd(require('./ping')),
    help: getCmd(require('./help')),
    avatar: getCmd(require('./avatar')),
    serverinfo: getCmd(require('./serverinfo')),
    afk: getCmd(require('./afk')),
    invite: getCmd(require('./invite')),
    report: getCmd(require('./report')),
    roleinfo: getCmd(require('./roleinfo')),
};
