/**
 * Result Pattern Unit Tests
 * Tests for the Railway-Oriented Programming Result class
 */

import { Result } from '../../../src/core/Result';

describe('Result', () => {
    describe('Result.ok()', () => {
        it('should create a success result with data', () => {
            const result = Result.ok({ value: 42 });
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual({ value: 42 });
            expect(result.error).toBeNull();
            expect(result.code).toBeNull();
        });

        it('should create a success result without data', () => {
            const result = Result.ok();
            
            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
            expect(result.error).toBeNull();
        });

        it('should handle primitive values', () => {
            expect(Result.ok(42).data).toBe(42);
            expect(Result.ok('hello').data).toBe('hello');
            expect(Result.ok(true).data).toBe(true);
        });
    });

    describe('Result.err()', () => {
        it('should create an error result', () => {
            const result = Result.err('NOT_FOUND', 'Item not found');
            
            expect(result.success).toBe(false);
            expect(result.data).toBeNull();
            expect(result.error).toBe('Item not found');
            expect(result.code).toBe('NOT_FOUND');
        });

        it('should include error details', () => {
            const result = Result.err('DB_ERROR', 'Query failed', { 
                query: 'SELECT * FROM users',
                table: 'users' 
            });
            
            expect(result.details).toEqual({
                query: 'SELECT * FROM users',
                table: 'users'
            });
        });
    });

    describe('Result.fromError()', () => {
        it('should create result from Error object', () => {
            const error = new Error('Something went wrong');
            const result = Result.fromError(error);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Something went wrong');
            expect(result.code).toBe('INTERNAL_ERROR');
            expect(result.details?.name).toBe('Error');
            expect(result.details?.stack).toBeDefined();
        });

        it('should use custom error code', () => {
            const error = new Error('Not found');
            const result = Result.fromError(error, 'NOT_FOUND');
            
            expect(result.code).toBe('NOT_FOUND');
        });
    });

    describe('isOk() / isErr()', () => {
        it('should return true for success on isOk()', () => {
            const ok = Result.ok('data');
            const err = Result.err('ERR', 'error');
            
            expect(ok.isOk()).toBe(true);
            expect(err.isOk()).toBe(false);
        });

        it('should return true for error on isErr()', () => {
            const ok = Result.ok('data');
            const err = Result.err('ERR', 'error');
            
            expect(ok.isErr()).toBe(false);
            expect(err.isErr()).toBe(true);
        });

        it('should work as type guard', () => {
            const result = Result.ok({ name: 'test' });
            
            if (result.isOk()) {
                // TypeScript should know result.data is not null here
                expect(result.data.name).toBe('test');
            }
        });
    });

    describe('unwrap()', () => {
        it('should return data for success result', () => {
            const result = Result.ok({ value: 42 });
            expect(result.unwrap()).toEqual({ value: 42 });
        });

        it('should throw for error result', () => {
            const result = Result.err('ERR', 'Something failed');
            expect(() => result.unwrap()).toThrow('Something failed');
        });

        it('should include error code in thrown error', () => {
            const result = Result.err('CUSTOM_CODE', 'Error message');
            
            try {
                result.unwrap();
                fail('Should have thrown');
            } catch (e) {
                const error = e as Error & { code?: string };
                expect(error.code).toBe('CUSTOM_CODE');
            }
        });
    });

    describe('unwrapOr()', () => {
        it('should return data for success result', () => {
            const result = Result.ok(42);
            expect(result.unwrapOr(0)).toBe(42);
        });

        it('should return default for error result', () => {
            const result = Result.err<number>('ERR', 'error');
            expect(result.unwrapOr(0)).toBe(0);
        });

        it('should work with different types', () => {
            const result = Result.err<string>('ERR', 'error');
            expect(result.unwrapOr('default')).toBe('default');
        });
    });

    describe('map()', () => {
        it('should transform success data', () => {
            const result = Result.ok(5)
                .map(x => x * 2)
                .map(x => x + 1);
            
            expect(result.data).toBe(11);
        });

        it('should skip transformation for error', () => {
            const mapFn = jest.fn(x => x * 2);
            const result = Result.err<number>('ERR', 'error').map(mapFn);
            
            expect(mapFn).not.toHaveBeenCalled();
            expect(result.isErr()).toBe(true);
            expect(result.code).toBe('ERR');
        });

        it('should change the data type', () => {
            const result = Result.ok(42).map(n => `Number: ${n}`);
            expect(result.data).toBe('Number: 42');
        });
    });

    describe('flatMap()', () => {
        it('should chain Result-returning functions', () => {
            const parseNumber = (s: string): Result<number> => {
                const n = parseInt(s, 10);
                return isNaN(n) 
                    ? Result.err('PARSE_ERROR', 'Invalid number')
                    : Result.ok(n);
            };

            const double = (n: number): Result<number> => {
                return Result.ok(n * 2);
            };

            const result = Result.ok('21')
                .flatMap(parseNumber)
                .flatMap(double);
            
            expect(result.data).toBe(42);
        });

        it('should short-circuit on error', () => {
            const parseNumber = (s: string): Result<number> => {
                const n = parseInt(s, 10);
                return isNaN(n) 
                    ? Result.err('PARSE_ERROR', 'Invalid number')
                    : Result.ok(n);
            };

            const doubleFn = jest.fn((n: number) => Result.ok(n * 2));

            const result = Result.ok('not-a-number')
                .flatMap(parseNumber)
                .flatMap(doubleFn);
            
            expect(result.isErr()).toBe(true);
            expect(result.code).toBe('PARSE_ERROR');
            expect(doubleFn).not.toHaveBeenCalled();
        });

        it('should preserve error details through chain', () => {
            const result = Result.err<number>('ORIGINAL', 'Original error', { key: 'value' })
                .flatMap(n => Result.ok(n * 2));
            
            expect(result.code).toBe('ORIGINAL');
            expect(result.error).toBe('Original error');
        });
    });

    describe('toJSON()', () => {
        it('should serialize success result', () => {
            const result = Result.ok({ name: 'test' });
            const json = result.toJSON();
            
            expect(json).toEqual({
                success: true,
                data: { name: 'test' },
                error: null,
                code: null,
            });
        });

        it('should serialize error result', () => {
            const result = Result.err('ERR_CODE', 'Error message', { extra: 'info' });
            const json = result.toJSON();
            
            expect(json).toEqual({
                success: false,
                data: null,
                error: 'Error message',
                code: 'ERR_CODE',
                details: { extra: 'info' },
            });
        });

        it('should be JSON.stringify compatible', () => {
            const result = Result.ok({ id: 1 });
            const str = JSON.stringify(result);
            const parsed = JSON.parse(str);
            
            expect(parsed.success).toBe(true);
            expect(parsed.data.id).toBe(1);
        });
    });

    describe('toReply()', () => {
        it('should create success reply', () => {
            const result = Result.ok({ id: 1 });
            const reply = result.toReply({ successMessage: 'Created!' });
            
            expect(reply.content).toBe('Created!');
            expect(reply.ephemeral).toBe(false);
        });

        it('should use default success message', () => {
            const result = Result.ok();
            const reply = result.toReply();
            
            expect(reply.content).toBe('✅ Success!');
        });

        it('should create error reply', () => {
            const result = Result.err('ERR', 'Something went wrong');
            const reply = result.toReply();
            
            expect(reply.content).toBe('❌ Something went wrong');
            expect(reply.ephemeral).toBe(true);
        });

        it('should respect ephemeral option for success', () => {
            const result = Result.ok();
            const reply = result.toReply({ ephemeral: true });
            
            expect(reply.ephemeral).toBe(true);
        });
    });

    describe('practical use cases', () => {
        it('should work for validation chain', () => {
            interface User {
                name: string;
                age: number;
                email: string;
            }

            const validateName = (user: User): Result<User> => {
                if (!user.name || user.name.length < 2) {
                    return Result.err('INVALID_NAME', 'Name must be at least 2 characters');
                }
                return Result.ok(user);
            };

            const validateAge = (user: User): Result<User> => {
                if (user.age < 0 || user.age > 150) {
                    return Result.err('INVALID_AGE', 'Age must be between 0 and 150');
                }
                return Result.ok(user);
            };

            const validateEmail = (user: User): Result<User> => {
                if (!user.email.includes('@')) {
                    return Result.err('INVALID_EMAIL', 'Invalid email format');
                }
                return Result.ok(user);
            };

            const validateUser = (user: User): Result<User> => {
                return Result.ok(user)
                    .flatMap(validateName)
                    .flatMap(validateAge)
                    .flatMap(validateEmail);
            };

            // Valid user
            const validResult = validateUser({ name: 'John', age: 30, email: 'john@example.com' });
            expect(validResult.isOk()).toBe(true);

            // Invalid name
            const invalidName = validateUser({ name: 'J', age: 30, email: 'john@example.com' });
            expect(invalidName.isErr()).toBe(true);
            expect(invalidName.code).toBe('INVALID_NAME');

            // Invalid age (but valid name)
            const invalidAge = validateUser({ name: 'John', age: -1, email: 'john@example.com' });
            expect(invalidAge.code).toBe('INVALID_AGE');
        });
    });
});
