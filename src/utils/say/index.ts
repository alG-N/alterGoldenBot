/**
 * Say Utilities Index
 * @module utils/say
 */

import sayLogger, { SayLogger } from './logger.js';

// Default export
export default {
    logger: sayLogger
};

// Named exports
export {
    sayLogger,
    sayLogger as logger,
    SayLogger
};
