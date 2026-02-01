/**
 * alterGolden Discord Bot
 * Main Entry Point
 * 
 * Professional utility bot with music, video download, API commands and moderation
 * 
 * @author alterGolden Team
 * @version 3.1.0
 */

require('dotenv').config();
const { REST, Routes, Events } = require('discord.js');

// Core utilities
const { createClient } = require('./utils/Client');
const logger = require('./utils/Logger');

// Services
const commandRegistry = require('./services/CommandRegistry');
const eventRegistry = require('./services/EventRegistry');
const { SnipeService } = require('./services');
const redisCache = require('./services/RedisCache');

// Configuration
const { bot, music } = require('./config');

// Database (PostgreSQL)
const { initializeDatabase } = require('./database/admin');

// Utilities
const { initializeErrorHandlers } = require('./utils/errorHandler');

// ==========================================
// APPLICATION INITIALIZATION
// ==========================================

class AlterGoldenBot {
    constructor() {
        this.client = createClient();
        this.rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    }

    /**
     * Initialize and start the bot
     */
    async start() {
        try {
            logger.info('Startup', 'Initializing alterGolden v3.1...');

            // Initialize database (PostgreSQL)
            await initializeDatabase();

            // Initialize Redis cache (optional, falls back to in-memory)
            await this.initializeCache();

            // Load commands
            this.loadCommands();

            // Load events
            this.loadEvents();

            // Setup interaction listener
            this.setupInteractionListener();

            // Initialize error handlers
            initializeErrorHandlers(this.client);

            // Initialize Lavalink BEFORE login
            if (music.enabled) {
                this.initializeLavalink();
            }

            // Connect to Discord
            await this.connect();

            // After ready setup
            this.client.once(Events.ClientReady, async () => {
                // Initialize Snipe Service
                SnipeService.initialize(this.client);
                logger.info('Services', 'SnipeService initialized');

                // Deploy commands if enabled
                if (bot.autoDeploy) {
                    await this.deployCommands();
                }
                
                logger.info('Ready', `🚀 alterGolden is fully operational!`);
            });

        } catch (error) {
            logger.critical('Startup', `Failed to start: ${error.message}`);
            console.error(error);
            process.exit(1);
        }
    }

    /**
     * Initialize Redis cache (optional)
     */
    async initializeCache() {
        try {
            const connected = await redisCache.initialize();
            if (connected) {
                logger.info('Cache', 'Redis cache connected');
            } else {
                logger.info('Cache', 'Using in-memory cache (Redis not available)');
            }
        } catch (error) {
            logger.warn('Cache', `Redis initialization failed: ${error.message}`);
        }
    }

    /**
     * Load all commands
     */
    loadCommands() {
        // Load commands (no legacy mode)
        commandRegistry.loadCommands({ useLegacy: false });
        
        // Attach to client for easy access
        this.client.commands = commandRegistry.commands;
        
        logger.info('Commands', `Loaded ${commandRegistry.size} commands`);
    }

    /**
     * Load all events
     */
    loadEvents() {
        // Load events (no legacy mode)
        eventRegistry.loadEvents({ useLegacy: false });
        
        // Register with client
        eventRegistry.registerWithClient(this.client);
        
        logger.info('Events', `Loaded ${eventRegistry.size} events`);
    }

    /**
     * Setup the main interaction listener
     */
    setupInteractionListener() {
        this.client.on(Events.InteractionCreate, async (interaction) => {
            try {
                // Handle slash commands
                if (interaction.isChatInputCommand()) {
                    const command = commandRegistry.get(interaction.commandName);
                    
                    if (!command) {
                        logger.warn('Interaction', `Unknown command: ${interaction.commandName}`);
                        return;
                    }

                    // Execute command
                    if (command.run) {
                        await command.run(interaction);
                    } else if (command.execute) {
                        await command.execute(interaction);
                    }
                }
                
                // Handle autocomplete
                else if (interaction.isAutocomplete()) {
                    const command = commandRegistry.get(interaction.commandName);
                    
                    if (command?.autocomplete) {
                        await command.autocomplete(interaction);
                    }
                }
                
                // Handle buttons
                else if (interaction.isButton()) {
                    // Button handling logic
                    const [commandName] = interaction.customId.split('_');
                    const command = commandRegistry.get(commandName);
                    
                    if (command?.handleButton) {
                        await command.handleButton(interaction);
                    }
                }
                
                // Handle modals
                else if (interaction.isModalSubmit()) {
                    const [commandName] = interaction.customId.split('_');
                    const command = commandRegistry.getModalHandler(commandName) || 
                                   commandRegistry.get(commandName);
                    
                    if (command?.handleModal) {
                        await command.handleModal(interaction);
                    }
                }
                
                // Handle select menus
                else if (interaction.isStringSelectMenu()) {
                    const [commandName] = interaction.customId.split('_');
                    const command = commandRegistry.get(commandName);
                    
                    if (command?.handleSelectMenu) {
                        await command.handleSelectMenu(interaction);
                    }
                }
                
            } catch (error) {
                logger.error('Interaction', `Error handling interaction: ${error.message}`);
                console.error(error);
                
                // Try to respond with error
                try {
                    const errorMsg = { content: '❌ An error occurred.', ephemeral: true };
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(errorMsg);
                    } else {
                        await interaction.reply(errorMsg);
                    }
                } catch (e) {
                    // Ignore
                }
            }
        });
    }

    /**
     * Initialize Lavalink music service
     */
    initializeLavalink() {
        try {
            const lavalinkService = require('./modules/music/service/LavalinkService');
            lavalinkService.preInitialize(this.client);
            lavalinkService.finalize();
            logger.info('Lavalink', 'Music service pre-initialized');
        } catch (error) {
            logger.warn('Lavalink', `Music service failed: ${error.message}`);
        }
    }

    /**
     * Deploy commands to Discord
     */
    async deployCommands() {
        try {
            const commands = commandRegistry.toJSON();
            
            logger.info('Deploy', `Deploying ${commands.length} commands...`);
            
            await this.rest.put(
                Routes.applicationCommands(bot.clientId),
                { body: commands }
            );
            
            logger.info('Deploy', `Successfully deployed ${commands.length} commands!`);
        } catch (error) {
            logger.error('Deploy', `Failed to deploy commands: ${error.message}`);
        }
    }

    /**
     * Connect to Discord
     */
    async connect() {
        logger.info('Startup', 'Connecting to Discord...');
        await this.client.login(process.env.BOT_TOKEN);
    }
}

// ==========================================
// ENTRY POINT
// ==========================================

const bot_instance = new AlterGoldenBot();
bot_instance.start().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

// Export for external access
module.exports = { bot: bot_instance };
