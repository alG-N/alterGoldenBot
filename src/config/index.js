/**
 * alterGolden Configuration Module
 * Central export for all configuration files
 * @module config
 */

const bot = require('./bot');
const owner = require('./owner');
const admin = require('./admin');
const music = require('./music');
const lavalink = require('./lavalink');
const video = require('./video');
const maintenance = require('./maintenance');

module.exports = {
    bot,
    owner,
    admin,
    music,
    lavalink,
    video,
    maintenance
};
