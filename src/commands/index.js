/**
 * Presentation Commands Index
 * @module presentation/commands
 */

const { BaseCommand, CommandCategory } = require('./BaseCommand');
const general = require('./general');
const admin = require('./admin');
const owner = require('./owner');
const music = require('./music');
const video = require('./video');
const api = require('./api');
const fun = require('./fun');

module.exports = {
    BaseCommand,
    CommandCategory,
    general,
    admin,
    owner,
    music,
    video,
    api,
    fun
};



