/**
 * Base Event - Presentation Layer
 * Abstract base class for all events
 * @module presentation/events/BaseEvent
 */

import type { Client } from 'discord.js';
// TYPES
export interface EventOptions {
    name: string;
    once?: boolean;
}
// BASE EVENT CLASS
/**
 * Abstract base class for events
 * @abstract
 */
export abstract class BaseEvent {
    public readonly name: string;
    public readonly once: boolean;

    /**
     * @param options - Event configuration
     */
    constructor(options: EventOptions) {
        if (new.target === BaseEvent) {
            throw new Error('BaseEvent is abstract and cannot be instantiated directly');
        }

        this.name = options.name;
        this.once = options.once || false;
    }

    /**
     * Execute the event handler
     * @abstract
     * @param client - Discord client
     * @param args - Event arguments
     */
    abstract execute(client: Client, ...args: unknown[]): Promise<void>;
}

export default BaseEvent;
