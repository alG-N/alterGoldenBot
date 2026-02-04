/**
 * Jest Test Setup
 * Global configuration and mocks for all tests
 */

export {};

// Suppress console output during tests (optional - comment out to debug)
// global.console = {
//     ...console,
//     log: jest.fn(),
//     debug: jest.fn(),
//     info: jest.fn(),
//     warn: jest.fn(),
//     // Keep error for debugging
//     error: console.error,
// };

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DISCORD_TOKEN = 'test-token';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test utilities
declare global {
    namespace NodeJS {
        interface Global {
            testUtils: {
                wait: (ms: number) => Promise<void>;
                randomString: (length: number) => string;
            };
        }
    }
}

(global as unknown as { testUtils: unknown }).testUtils = {
    wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
    randomString: (length: number) => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    },
};

// Cleanup after all tests
afterAll(async () => {
    // Allow any pending timers to complete
    await new Promise(resolve => setTimeout(resolve, 100));
});
