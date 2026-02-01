/**
 * Admin Commands - Presentation Layer
 * @module presentation/commands/admin
 */

const kick = require('./kick');
const ban = require('./ban');
const mute = require('./mute');
const deleteCmd = require('./delete');
const snipe = require('./snipe');
const setting = require('./setting');

module.exports = {
    kick,
    ban,
    mute,
    delete: deleteCmd,
    snipe,
    setting
};



