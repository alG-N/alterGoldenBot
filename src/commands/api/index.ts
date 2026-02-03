/**
 * API Commands Index
 * Export all API-related commands
 * @module presentation/commands/api
 */

export { default as anime } from './anime.js';
export { default as fandom } from './fandom.js';
export { default as google } from './google.js';
export { default as nhentai } from './nhentai.js';
export { default as pixiv } from './pixiv.js';
export { default as reddit } from './reddit.js';
export { default as rule34 } from './rule34.js';
export { default as steam } from './steam.js';
export { default as wikipedia } from './wikipedia.js';

// CommonJS compatibility for command loader
// Handle both `module.exports = cmd` and `export default cmd` patterns
const getCmd = (mod: { default?: unknown }) => mod.default || mod;
module.exports = {
    anime: getCmd(require('./anime')),
    fandom: getCmd(require('./fandom')),
    google: getCmd(require('./google')),
    nhentai: getCmd(require('./nhentai')),
    pixiv: getCmd(require('./pixiv')),
    reddit: getCmd(require('./reddit')),
    rule34: getCmd(require('./rule34')),
    steam: getCmd(require('./steam')),
    wikipedia: getCmd(require('./wikipedia')),
};
