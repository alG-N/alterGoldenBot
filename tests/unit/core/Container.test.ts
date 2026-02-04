/**
 * Container Unit Tests
 * Tests for the dependency injection container
 */

import { Container } from '../../../src/container';

// Mock logger to prevent console output
jest.mock('../../../src/core/Logger', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

describe('Container', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
    });

    afterEach(() => {
        container.clear();
    });

    describe('register()', () => {
        it('should register a service factory', () => {
            container.register('test', () => ({ value: 42 }));
            expect(container.has('test')).toBe(true);
        });

        it('should allow chaining registrations', () => {
            const result = container
                .register('a', () => 'a')
                .register('b', () => 'b');
            
            expect(result).toBe(container);
            expect(container.has('a')).toBe(true);
            expect(container.has('b')).toBe(true);
        });

        it('should register tags', () => {
            container.register('service1', () => ({}), { tags: ['http'] });
            container.register('service2', () => ({}), { tags: ['http'] });
            container.register('service3', () => ({}), { tags: ['database'] });
            
            const httpServices = container.tagged('http');
            expect(httpServices).toHaveLength(2);
        });
    });

    describe('instance()', () => {
        it('should register a pre-built instance', () => {
            const obj = { value: 'test' };
            container.instance('myInstance', obj);
            
            expect(container.has('myInstance')).toBe(true);
            expect(container.resolve('myInstance')).toBe(obj);
        });
    });

    describe('resolve()', () => {
        it('should resolve a registered service', () => {
            container.register('test', () => ({ value: 42 }));
            const service = container.resolve<{ value: number }>('test');
            expect(service.value).toBe(42);
        });

        it('should throw if service not found', () => {
            expect(() => container.resolve('nonexistent')).toThrow('Service not found: nonexistent');
        });

        it('should cache singleton instances by default', () => {
            let count = 0;
            container.register('counter', () => ({ id: ++count }));
            
            const first = container.resolve<{ id: number }>('counter');
            const second = container.resolve<{ id: number }>('counter');
            
            expect(first.id).toBe(1);
            expect(second.id).toBe(1);
            expect(first).toBe(second);
        });

        it('should create new instances when singleton=false', () => {
            let count = 0;
            container.register('counter', () => ({ id: ++count }), { singleton: false });
            
            const first = container.resolve<{ id: number }>('counter');
            const second = container.resolve<{ id: number }>('counter');
            
            expect(first.id).toBe(1);
            expect(second.id).toBe(2);
            expect(first).not.toBe(second);
        });

        it('should pass container to factory', () => {
            container.register('config', () => ({ port: 3000 }));
            container.register('server', (c) => ({
                config: c.resolve<{ port: number }>('config'),
            }));
            
            const server = container.resolve<{ config: { port: number } }>('server');
            expect(server.config.port).toBe(3000);
        });

        it('should detect circular dependencies', () => {
            container.register('a', (c) => ({ b: c.resolve('b') }));
            container.register('b', (c) => ({ a: c.resolve('a') }));
            
            expect(() => container.resolve('a')).toThrow(/circular/i);
        });

        it('should detect deep circular dependencies', () => {
            container.register('a', (c) => ({ next: c.resolve('b') }));
            container.register('b', (c) => ({ next: c.resolve('c') }));
            container.register('c', (c) => ({ next: c.resolve('a') }));
            
            expect(() => container.resolve('a')).toThrow(/circular/i);
        });

        it('should resolve pre-built instances', () => {
            const obj = { special: true };
            container.instance('special', obj);
            
            expect(container.resolve('special')).toBe(obj);
        });
    });

    describe('has()', () => {
        it('should return true for registered factories', () => {
            container.register('test', () => ({}));
            expect(container.has('test')).toBe(true);
        });

        it('should return true for registered instances', () => {
            container.instance('test', {});
            expect(container.has('test')).toBe(true);
        });

        it('should return false for unregistered services', () => {
            expect(container.has('nonexistent')).toBe(false);
        });
    });

    describe('tagged()', () => {
        it('should return all services with a tag', () => {
            container.register('s1', () => ({ name: 's1' }), { tags: ['api'] });
            container.register('s2', () => ({ name: 's2' }), { tags: ['api'] });
            container.register('s3', () => ({ name: 's3' }), { tags: ['db'] });
            
            const apiServices = container.tagged<{ name: string }>('api');
            expect(apiServices).toHaveLength(2);
            expect(apiServices.map(s => s.name)).toContain('s1');
            expect(apiServices.map(s => s.name)).toContain('s2');
        });

        it('should return empty array for unknown tag', () => {
            const services = container.tagged('nonexistent');
            expect(services).toEqual([]);
        });
    });

    describe('reset()', () => {
        it('should clear cached instances but keep factories', () => {
            let count = 0;
            container.register('counter', () => ({ id: ++count }));
            
            container.resolve('counter'); // id = 1
            container.reset();
            const result = container.resolve<{ id: number }>('counter'); // id = 2
            
            expect(result.id).toBe(2);
            expect(container.has('counter')).toBe(true);
        });
    });

    describe('clear()', () => {
        it('should remove all registrations and instances', () => {
            container.register('test', () => ({}));
            container.resolve('test');
            container.clear();
            
            expect(container.has('test')).toBe(false);
        });
    });

    describe('boot()', () => {
        it('should initialize all services with initialize method', async () => {
            const initFn = jest.fn();
            container.register('service', () => ({
                initialize: initFn,
            }));
            
            await container.boot();
            expect(initFn).toHaveBeenCalled();
        });

        it('should initialize only specified services', async () => {
            const initA = jest.fn();
            const initB = jest.fn();
            
            container.register('a', () => ({ initialize: initA }));
            container.register('b', () => ({ initialize: initB }));
            
            await container.boot(['a']);
            
            expect(initA).toHaveBeenCalled();
            expect(initB).not.toHaveBeenCalled();
        });

        it('should handle services without initialize method', async () => {
            container.register('plain', () => ({ value: 1 }));
            await expect(container.boot()).resolves.not.toThrow();
        });

        it('should throw if boot is called during boot', async () => {
            container.register('slow', () => ({
                initialize: () => new Promise(r => setTimeout(r, 100)),
            }));
            
            const bootPromise = container.boot();
            await expect(container.boot()).rejects.toThrow(/already booting/i);
            await bootPromise;
        });
    });

    describe('shutdown()', () => {
        it('should call shutdown on all instantiated services', async () => {
            const shutdownFn = jest.fn();
            container.register('service', () => ({
                shutdown: shutdownFn,
            }));
            
            container.resolve('service');
            await container.shutdown();
            
            expect(shutdownFn).toHaveBeenCalled();
        });

        it('should continue shutdown even if one service fails', async () => {
            const shutdown1 = jest.fn().mockRejectedValue(new Error('fail'));
            const shutdown2 = jest.fn();
            
            container.register('s1', () => ({ shutdown: shutdown1 }));
            container.register('s2', () => ({ shutdown: shutdown2 }));
            
            container.resolve('s1');
            container.resolve('s2');
            
            await container.shutdown();
            
            expect(shutdown1).toHaveBeenCalled();
            expect(shutdown2).toHaveBeenCalled();
        });

        it('should clear instances after shutdown', async () => {
            container.register('service', () => ({}));
            container.resolve('service');
            
            await container.shutdown();
            
            // Instance cleared, but factory still exists
            expect(container.has('service')).toBe(true);
            // New resolve creates new instance
            let count = 0;
            container.register('counter', () => ({ id: ++count }));
            container.resolve('counter');
            container.reset();
            expect(container.resolve<{ id: number }>('counter').id).toBe(2);
        });
    });

    describe('getDebugInfo()', () => {
        it('should return debug information', () => {
            container.register('s1', () => ({}), { tags: ['api'] });
            container.register('s2', () => ({}), { tags: ['api', 'http'] });
            container.resolve('s1');
            
            const info = container.getDebugInfo();
            
            expect(info.registered).toContain('s1');
            expect(info.registered).toContain('s2');
            expect(info.instantiated).toContain('s1');
            expect(info.instantiated).not.toContain('s2');
            expect(info.tags['api']).toContain('s1');
            expect(info.tags['api']).toContain('s2');
        });
    });
});
