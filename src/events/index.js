/**
 * Events - Presentation Layer
 * @module presentation/events
 */

const { BaseEvent } = require('./BaseEvent');
const ready = require('./ready');
const messageCreate = require('./messageCreate');
const guildCreate = require('./guildCreate');
const guildDelete = require('./guildDelete');
const voiceStateUpdate = require('./voiceStateUpdate');

module.exports = {
    BaseEvent,
    ready,
    messageCreate,
    guildCreate,
    guildDelete,
    voiceStateUpdate
};



