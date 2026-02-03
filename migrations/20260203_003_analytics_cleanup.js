/**
 * Analytics Cleanup Migration
 * Adds periodic cleanup function for analytics data
 * 
 * @type {import('knex').Knex.Migration}
 */

exports.up = async function(knex) {
    // Function to cleanup old analytics data
    await knex.raw(`
        CREATE OR REPLACE FUNCTION cleanup_old_analytics()
        RETURNS void AS $$
        BEGIN
            -- Keep 90 days of command analytics
            DELETE FROM command_analytics
            WHERE used_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
            
            -- Keep 24 hours of snipes
            DELETE FROM snipes
            WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
            
            -- Clean up old bot stats (keep 365 days)
            DELETE FROM bot_stats
            WHERE date < CURRENT_DATE - INTERVAL '365 days';
        END;
        $$ LANGUAGE plpgsql;
    `);

    // Note: For automatic cleanup, you can set up a cron job or pg_cron extension
    -- For now, this function can be called manually or from the application
};

exports.down = async function(knex) {
    await knex.raw('DROP FUNCTION IF EXISTS cleanup_old_analytics()');
};
