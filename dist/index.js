"use strict";
/**
 * alterGolden Discord Bot
 * Main Entry Point
 *
 * Professional utility bot with music, video download, API commands and moderation
 *
 * Architecture:
 * - src/core/        - Core client & logging
 * - src/shared/      - Shared utilities, errors, cache, middleware
 * - src/config/      - Centralized configuration
 * - src/infrastructure/ - Database abstraction layer
 * - src/modules/     - Feature modules (music, video, api, fun)
 * - src/commands/    - Slash commands (presentation layer)
 * - src/events/      - Discord event handlers
 * - src/services/    - Application services
 *
 * @author alterGolden Team
 * @version 4.0.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
require("dotenv/config");
const discord_js_1 = require("discord.js");
// Core utilities (from src/core)
const index_js_1 = require("./core/index.js");
// Services
const index_js_2 = require("./services/index.js");
// Configuration
const index_js_3 = require("./config/index.js");
// Database (PostgreSQL)
const admin_js_1 = require("./database/admin.js");
const postgres_js_1 = __importDefault(require("./database/postgres.js"));
// APPLICATION INITIALIZATION
class AlterGoldenBot {
    client;
    rest;
    healthServer = null;
    constructor() {
        this.client = (0, index_js_1.createClient)();
        this.rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    }
    /**
     * Initialize and start the bot
     */
    async start() {
        try {
            index_js_1.logger.info('Startup', 'Initializing alterGolden v4.0...');
            // Initialize Sentry error tracking first
            index_js_1.sentry.initialize({
                release: '4.0.0',
                tags: { bot: 'alterGolden' }
            });
            // Start health check server
            this.startHealthServer();
            // Initialize database (PostgreSQL)
            await (0, admin_js_1.initializeDatabase)();
            // Initialize Redis cache (optional, falls back to in-memory)
            await this.initializeCache();
            // Load commands
            this.loadCommands();
            // Load events
            this.loadEvents();
            // Setup interaction listener
            this.setupInteractionListener();
            // Initialize error handlers
            (0, index_js_1.initializeErrorHandlers)(this.client);
            // Initialize shutdown handlers (NEW: graceful shutdown)
            (0, index_js_1.initializeShutdownHandlers)(this.client);
            // Initialize Lavalink BEFORE login
            if (index_js_3.music.enabled) {
                this.initializeLavalink();
            }
            // Connect to Discord
            await this.connect();
            // After ready setup
            this.client.once(discord_js_1.Events.ClientReady, async () => {
                // Initialize logger with client
                index_js_1.logger.initialize(this.client);
                // Register health checks now that services are ready
                this.registerHealthChecks();
                index_js_1.health.setStatus('healthy');
                // Initialize Snipe Service
                index_js_2.snipeService.initialize(this.client);
                index_js_1.logger.info('Services', 'SnipeService initialized');
                // Deploy commands if enabled
                if (index_js_3.bot.autoDeploy) {
                    await this.deployCommands();
                }
                index_js_1.logger.info('Ready', `🚀 alterGolden is fully operational!`);
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            index_js_1.logger.critical('Startup', `Failed to start: ${message}`);
            index_js_1.sentry.captureException(error instanceof Error ? error : new Error(String(error)), { extra: { phase: 'startup' } });
            console.error(error);
            process.exit(1);
        }
    }
    /**
     * Start health check HTTP server
     */
    startHealthServer() {
        const port = parseInt(process.env.HEALTH_PORT || '3000');
        this.healthServer = index_js_1.health.startHealthServer(port);
    }
    /**
     * Register health checks for all services
     */
    registerHealthChecks() {
        // Handle ESM default export for LavalinkService
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const lavalinkModule = index_js_3.music.enabled ? require('./services/music/LavalinkService') : null;
        const lavalinkService = lavalinkModule?.default || lavalinkModule;
        index_js_1.health.registerDefaultChecks({
            client: this.client,
            database: postgres_js_1.default,
            redis: index_js_2.redisCache,
            lavalink: lavalinkService
        });
    }
    /**
     * Initialize Redis cache (optional)
     */
    async initializeCache() {
        try {
            const connected = await index_js_2.redisCache.initialize();
            if (connected) {
                index_js_1.logger.info('Cache', 'Redis cache connected');
            }
            else {
                index_js_1.logger.info('Cache', 'Using in-memory cache (Redis not available)');
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            index_js_1.logger.warn('Cache', `Redis initialization failed: ${message}`);
        }
    }
    /**
     * Load all commands
     */
    loadCommands() {
        // Load commands from feature modules AND presentation layer
        index_js_2.commandRegistry.loadCommands({ useLegacy: false, useModules: true });
        // Attach to client for easy access
        this.client.commands = index_js_2.commandRegistry.commands;
        index_js_1.logger.info('Commands', `Loaded ${index_js_2.commandRegistry.size} commands`);
    }
    /**
     * Load all events
     */
    loadEvents() {
        // Load events (no legacy mode)
        index_js_2.eventRegistry.loadEvents({ useLegacy: false });
        // Register with client
        index_js_2.eventRegistry.registerWithClient(this.client);
        index_js_1.logger.info('Events', `Loaded ${index_js_2.eventRegistry.size} events`);
    }
    /**
     * Setup the main interaction listener
     */
    setupInteractionListener() {
        this.client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
            try {
                // Handle slash commands
                if (interaction.isChatInputCommand()) {
                    const command = index_js_2.commandRegistry.get(interaction.commandName);
                    if (!command) {
                        index_js_1.logger.warn('Interaction', `Unknown command: ${interaction.commandName}`);
                        return;
                    }
                    // Auto-defer if command has deferReply enabled
                    if (command.deferReply && !interaction.replied && !interaction.deferred) {
                        await interaction.deferReply({ ephemeral: command.ephemeral ?? false });
                    }
                    // Execute command
                    if (command.run) {
                        await command.run(interaction);
                    }
                    else if (command.execute) {
                        await command.execute(interaction);
                    }
                }
                // Handle autocomplete
                else if (interaction.isAutocomplete()) {
                    const command = index_js_2.commandRegistry.get(interaction.commandName);
                    if (command?.autocomplete) {
                        await command.autocomplete(interaction);
                    }
                }
                // Handle buttons
                else if (interaction.isButton()) {
                    // Button handling logic
                    const [commandName] = interaction.customId.split('_');
                    const command = index_js_2.commandRegistry.get(commandName);
                    if (command?.handleButton) {
                        await command.handleButton(interaction);
                    }
                }
                // Handle modals
                else if (interaction.isModalSubmit()) {
                    const [commandName] = interaction.customId.split('_');
                    const command = (index_js_2.commandRegistry.getModalHandler(commandName) ||
                        index_js_2.commandRegistry.get(commandName));
                    if (command?.handleModal) {
                        await command.handleModal(interaction);
                    }
                }
                // Handle select menus
                else if (interaction.isStringSelectMenu()) {
                    const [commandName] = interaction.customId.split('_');
                    const command = index_js_2.commandRegistry.get(commandName);
                    if (command?.handleSelectMenu) {
                        await command.handleSelectMenu(interaction);
                    }
                }
            }
            catch (error) {
                // Ignore "Unknown interaction" errors (interaction expired/already handled)
                // This is normal for long-running commands or user clicking buttons after timeout
                const err = error;
                if (err.code === 10062) {
                    const id = interaction.isChatInputCommand() ? interaction.commandName :
                        'customId' in interaction ? interaction.customId : 'unknown';
                    index_js_1.logger.debug('Interaction', `Interaction expired for ${id}`);
                    return;
                }
                const message = error instanceof Error ? error.message : String(error);
                index_js_1.logger.error('Interaction', `Error handling interaction: ${message}`);
                console.error(error);
                // Try to respond with error
                try {
                    const errorMsg = { content: '❌ An error occurred.', ephemeral: true };
                    if ('replied' in interaction && 'deferred' in interaction) {
                        if (interaction.replied || interaction.deferred) {
                            await interaction.followUp(errorMsg);
                        }
                        else {
                            await interaction.reply(errorMsg);
                        }
                    }
                }
                catch {
                    // Ignore - interaction likely expired
                }
            }
        });
    }
    /**
     * Initialize Lavalink music service
     */
    initializeLavalink() {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const lavalinkService = require('./services/music/LavalinkService').default;
            lavalinkService.preInitialize(this.client);
            lavalinkService.finalize();
            index_js_1.logger.info('Lavalink', 'Music service pre-initialized');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            index_js_1.logger.warn('Lavalink', `Music service failed: ${message}`);
        }
    }
    /**
     * Deploy commands to Discord
     */
    async deployCommands() {
        try {
            const commands = index_js_2.commandRegistry.toJSON();
            index_js_1.logger.info('Deploy', `Deploying ${commands.length} commands...`);
            await this.rest.put(discord_js_1.Routes.applicationCommands(index_js_3.bot.clientId), { body: commands });
            index_js_1.logger.info('Deploy', `Successfully deployed ${commands.length} commands!`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            index_js_1.logger.error('Deploy', `Failed to deploy commands: ${message}`);
        }
    }
    /**
     * Connect to Discord
     */
    async connect() {
        index_js_1.logger.info('Startup', 'Connecting to Discord...');
        await this.client.login(process.env.BOT_TOKEN);
    }
}
// ENTRY POINT
const bot_instance = new AlterGoldenBot();
exports.bot = bot_instance;
bot_instance.start().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
exports.default = { bot: bot_instance };
//# sourceMappingURL=index.js.map