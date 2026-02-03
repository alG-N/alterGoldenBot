"use strict";
/**
 * Base Event - Presentation Layer
 * Abstract base class for all events
 * @module presentation/events/BaseEvent
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEvent = void 0;
// BASE EVENT CLASS
/**
 * Abstract base class for events
 * @abstract
 */
class BaseEvent {
    name;
    once;
    /**
     * @param options - Event configuration
     */
    constructor(options) {
        if (new.target === BaseEvent) {
            throw new Error('BaseEvent is abstract and cannot be instantiated directly');
        }
        this.name = options.name;
        this.once = options.once || false;
    }
}
exports.BaseEvent = BaseEvent;
exports.default = BaseEvent;
//# sourceMappingURL=BaseEvent.js.map