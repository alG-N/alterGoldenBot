/**
 * Database Integration Tests
 * Tests database operations with real Postgres
 * @module tests/integration/database.integration.test
 */

import { getTestPostgres, cleanupTestResources, testUtils } from './setup';
import type { Knex } from 'knex';

// Skip if not running integration tests
const describeIntegration = process.env.RUN_INTEGRATION_TESTS ? describe : describe.skip;

describeIntegration('Database Integration', () => {
    let db: Knex;

    beforeAll(async () => {
        db = await getTestPostgres();
        
        // Ensure test tables exist
        await ensureTestTables(db);
    });

    afterAll(async () => {
        await cleanupTestResources();
    });

    describe('Guild Settings', () => {
        const tableName = 'guilds';

        beforeEach(async () => {
            // Clean test data
            await db(tableName).where('guild_id', 'like', 'test-%').del();
        });

        it('should insert and retrieve guild settings', async () => {
            const guildId = `test-${testUtils.randomId()}`;
            
            await db(tableName).insert({
                guild_id: guildId,
                prefix: '!',
                language: 'en',
                nsfw_enabled: false,
            });
            
            const result = await db(tableName)
                .where('guild_id', guildId)
                .first();
            
            expect(result.guild_id).toBe(guildId);
            expect(result.prefix).toBe('!');
            expect(result.nsfw_enabled).toBe(false);
        });

        it('should update guild settings', async () => {
            const guildId = `test-${testUtils.randomId()}`;
            
            await db(tableName).insert({
                guild_id: guildId,
                prefix: '!',
                nsfw_enabled: false,
            });
            
            await db(tableName)
                .where('guild_id', guildId)
                .update({ nsfw_enabled: true });
            
            const result = await db(tableName)
                .where('guild_id', guildId)
                .first();
            
            expect(result.nsfw_enabled).toBe(true);
        });

        it('should handle upsert (insert or update)', async () => {
            const guildId = `test-${testUtils.randomId()}`;
            
            // First insert
            await db(tableName)
                .insert({
                    guild_id: guildId,
                    prefix: '!',
                })
                .onConflict('guild_id')
                .merge();
            
            // Update via upsert
            await db(tableName)
                .insert({
                    guild_id: guildId,
                    prefix: '?',
                })
                .onConflict('guild_id')
                .merge();
            
            const result = await db(tableName)
                .where('guild_id', guildId)
                .first();
            
            expect(result.prefix).toBe('?');
        });
    });

    describe('Command Analytics', () => {
        const tableName = 'command_usage';

        beforeEach(async () => {
            await db(tableName).where('guild_id', 'like', 'test-%').del();
        });

        it('should track command usage', async () => {
            const guildId = `test-${testUtils.randomId()}`;
            const userId = testUtils.mockUserId();
            
            await db(tableName).insert({
                guild_id: guildId,
                user_id: userId,
                command_name: 'play',
                executed_at: new Date(),
            });
            
            const count = await db(tableName)
                .where('guild_id', guildId)
                .count('* as total')
                .first();
            
            expect(parseInt(count?.total as string)).toBe(1);
        });

        it('should aggregate command statistics', async () => {
            const guildId = `test-${testUtils.randomId()}`;
            
            // Insert multiple command usages
            await db(tableName).insert([
                { guild_id: guildId, user_id: 'u1', command_name: 'play', executed_at: new Date() },
                { guild_id: guildId, user_id: 'u1', command_name: 'play', executed_at: new Date() },
                { guild_id: guildId, user_id: 'u2', command_name: 'skip', executed_at: new Date() },
                { guild_id: guildId, user_id: 'u1', command_name: 'queue', executed_at: new Date() },
            ]);
            
            // Aggregate by command
            const stats = await db(tableName)
                .select('command_name')
                .count('* as usage_count')
                .where('guild_id', guildId)
                .groupBy('command_name')
                .orderBy('usage_count', 'desc');
            
            expect(stats[0].command_name).toBe('play');
            expect(parseInt(stats[0].usage_count as string)).toBe(2);
        });
    });

    describe('Moderation Cases', () => {
        const tableName = 'moderation_cases';

        beforeEach(async () => {
            await db(tableName).where('guild_id', 'like', 'test-%').del();
        });

        it('should create moderation case', async () => {
            const guildId = `test-${testUtils.randomId()}`;
            
            const [caseRecord] = await db(tableName)
                .insert({
                    guild_id: guildId,
                    user_id: 'target-user',
                    moderator_id: 'mod-user',
                    action: 'warn',
                    reason: 'Test warning',
                })
                .returning('*');
            
            expect(caseRecord.case_id).toBeDefined();
            expect(caseRecord.action).toBe('warn');
        });

        it('should retrieve case history for user', async () => {
            const guildId = `test-${testUtils.randomId()}`;
            const userId = 'repeat-offender';
            
            await db(tableName).insert([
                { guild_id: guildId, user_id: userId, moderator_id: 'm1', action: 'warn', reason: 'First' },
                { guild_id: guildId, user_id: userId, moderator_id: 'm1', action: 'mute', reason: 'Second' },
                { guild_id: guildId, user_id: userId, moderator_id: 'm2', action: 'warn', reason: 'Third' },
            ]);
            
            const history = await db(tableName)
                .where({ guild_id: guildId, user_id: userId })
                .orderBy('created_at', 'desc');
            
            expect(history).toHaveLength(3);
        });
    });

    describe('Transaction Safety', () => {
        it('should rollback on failure', async () => {
            const guildId = `test-${testUtils.randomId()}`;
            
            try {
                await db.transaction(async (trx) => {
                    await trx('guilds').insert({
                        guild_id: guildId,
                        prefix: '!',
                    });
                    
                    // Force error
                    throw new Error('Simulated failure');
                });
            } catch {
                // Expected
            }
            
            // Should not exist due to rollback
            const result = await db('guilds')
                .where('guild_id', guildId)
                .first();
            
            expect(result).toBeUndefined();
        });

        it('should commit on success', async () => {
            const guildId = `test-${testUtils.randomId()}`;
            
            await db.transaction(async (trx) => {
                await trx('guilds').insert({
                    guild_id: guildId,
                    prefix: '!',
                });
            });
            
            const result = await db('guilds')
                .where('guild_id', guildId)
                .first();
            
            expect(result).toBeDefined();
            
            // Cleanup
            await db('guilds').where('guild_id', guildId).del();
        });
    });

    describe('Connection Pool', () => {
        it('should handle concurrent queries', async () => {
            const queries = Array.from({ length: 20 }, () => 
                db.raw('SELECT pg_sleep(0.01), 1 as result')
            );
            
            const results = await Promise.all(queries);
            
            expect(results).toHaveLength(20);
        });
    });
});

/**
 * Ensure test tables exist with required schema
 */
async function ensureTestTables(db: Knex): Promise<void> {
    // Check if tables exist, create if not
    const hasGuilds = await db.schema.hasTable('guilds');
    if (!hasGuilds) {
        await db.schema.createTable('guilds', (table) => {
            table.string('guild_id').primary();
            table.string('prefix').defaultTo('!');
            table.string('language').defaultTo('en');
            table.boolean('nsfw_enabled').defaultTo(false);
            table.timestamps(true, true);
        });
    }

    const hasCommandUsage = await db.schema.hasTable('command_usage');
    if (!hasCommandUsage) {
        await db.schema.createTable('command_usage', (table) => {
            table.increments('id');
            table.string('guild_id').notNullable();
            table.string('user_id').notNullable();
            table.string('command_name').notNullable();
            table.timestamp('executed_at').defaultTo(db.fn.now());
        });
    }

    const hasModerationCases = await db.schema.hasTable('moderation_cases');
    if (!hasModerationCases) {
        await db.schema.createTable('moderation_cases', (table) => {
            table.increments('case_id');
            table.string('guild_id').notNullable();
            table.string('user_id').notNullable();
            table.string('moderator_id').notNullable();
            table.string('action').notNullable();
            table.text('reason');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    }
}
