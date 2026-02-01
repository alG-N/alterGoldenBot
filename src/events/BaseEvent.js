/**
 * Base Event - Presentation Layer
 * Abstract base class for all events
 * @module presentation/events/BaseEvent
 */

/**
 * Abstract base class for events
 * @abstract
 */
class BaseEvent {
    /**
     * @param {Object} options - Event configuration
     * @param {string} options.name - Event name
     * @param {boolean} [options.once=false] - Whether event should only fire once
     */
    constructor(options = {}) {
        if (this.constructor === BaseEvent) {
            throw new Error('BaseEvent is abstract and cannot be instantiated directly');
        }

        this.name = options.name;
        this.once = options.once || false;
    }

    /**
     * Execute the event handler
     * @abstract
     * @param {Client} client - Discord client
     * @param {...any} args - Event arguments
     */
    async execute(client, ...args) {
        throw new Error('Event must implement execute() method');
    }
}

module.exports = { BaseEvent };



