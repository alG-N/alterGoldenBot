/**
 * General Commands Index - Presentation Layer
 * @module presentation/commands/general
 */

const ping = require('./ping');
const help = require('./help');
const avatar = require('./avatar');
const serverinfo = require('./serverinfo');
const invite = require('./invite');
const afk = require('./afk');
const roleinfo = require('./roleinfo');
const report = require('./report');

module.exports = {
    ping,
    help,
    avatar,
    serverinfo,
    invite,
    afk,
    roleinfo,
    report
};



