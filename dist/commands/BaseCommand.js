"use strict";
/**
 * BaseCommand Class
 * Abstract base class for all slash commands
 * Provides common functionality: error handling, cooldowns, validation
 * @module commands/BaseCommand
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommand = exports.CommandCategory = void 0;
const discord_js_1 = require("discord.js");
const constants_1 = require("../constants");
const errors_1 = require("../errors");
const metrics_1 = require("../core/metrics");
// Helper to get default export from require()
const getDefault = (mod) => mod.default || mod;
// Use require for Logger to avoid circular dependency
const logger = getDefault(require('../core/Logger'));
// TYPES & INTERFACES
/**
 * Command categories enum
 */
exports.CommandCategory = {
    GENERAL: 'general',
    ADMIN: 'admin',
    OWNER: 'owner',
    MUSIC: 'music',
    VIDEO: 'video',
    API: 'api',
    FUN: 'fun',
};
// BASE COMMAND CLASS
/**
 * Base command class - extend this for all commands
 */
class BaseCommand {
    /** Command category */
    category;
    /** Cooldown in seconds */
    cooldown;
    /** Owner only command */
    ownerOnly;
    /** Admin only command */
    adminOnly;
    /** Guild only command */
    guildOnly;
    /** NSFW only command */
    nsfw;
    /** Required user permissions */
    userPermissions;
    /** Required bot permissions */
    botPermissions;
    /** Whether to defer reply */
    deferReply;
    /** Whether reply should be ephemeral */
    ephemeral;
    /** Cooldown tracking map */
    _cooldowns = new Map();
    constructor(options = {}) {
        this.category = options.category || exports.CommandCategory.GENERAL;
        this.cooldown = options.cooldown ?? constants_1.TIMEOUTS.COMMAND_COOLDOWN / 1000;
        this.ownerOnly = options.ownerOnly || false;
        this.adminOnly = options.adminOnly || false;
        this.guildOnly = options.guildOnly ?? true;
        this.nsfw = options.nsfw || false;
        this.userPermissions = options.userPermissions || [];
        this.botPermissions = options.botPermissions || [];
        this.deferReply = options.deferReply ?? false;
        this.ephemeral = options.ephemeral ?? false;
    }
    /**
     * Handle autocomplete - Override if needed
     */
    async autocomplete(interaction) {
        await interaction.respond([]);
    }
    /**
     * Handle button interactions - Override if needed
     */
    async handleButton(_interaction) {
        // Default: no button handling
    }
    /**
     * Handle select menu interactions - Override if needed
     */
    async handleSelectMenu(_interaction) {
        // Default: no select menu handling
    }
    /**
     * Handle modal submissions - Override if needed
     */
    async handleModal(_interaction) {
        // Default: no modal handling
    }
    /**
     * Execute command with full error handling and validation
     */
    async execute(interaction) {
        const startTime = Date.now();
        const commandName = this.data?.name || 'unknown';
        // Track active commands
        metrics_1.commandsActive.inc({ command: commandName });
        try {
            // Pre-execution validations
            await this._validateExecution(interaction);
            // Check cooldown
            const cooldownResult = this._checkCooldown(interaction.user.id);
            if (cooldownResult.onCooldown && cooldownResult.remaining) {
                await this._sendCooldownMessage(interaction, cooldownResult.remaining);
                return;
            }
            // Defer if configured
            if (this.deferReply && !interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ ephemeral: this.ephemeral });
            }
            // Execute command
            await this.run(interaction, {
                client: interaction.client,
                guild: interaction.guild,
                user: interaction.user,
                member: interaction.member,
            });
            // Set cooldown after successful execution
            this._setCooldown(interaction.user.id);
            // Track metrics
            const duration = Date.now() - startTime;
            (0, metrics_1.trackCommand)(commandName, this.category, duration, 'success');
            metrics_1.commandsActive.dec({ command: commandName });
            // Log slow executions
            if (duration > 3000) {
                logger.warn(commandName, `Slow command execution: ${duration}ms`);
            }
        }
        catch (error) {
            // Track error metrics
            const duration = Date.now() - startTime;
            (0, metrics_1.trackCommand)(commandName, this.category, duration, 'error');
            metrics_1.commandsActive.dec({ command: commandName });
            metrics_1.commandErrorsTotal.inc({
                command: commandName,
                category: this.category,
                error_type: error.name || 'Unknown'
            });
            await this._handleError(interaction, error, commandName);
        }
    }
    /**
     * Validate execution requirements
     */
    async _validateExecution(interaction) {
        // Guild only check
        if (this.guildOnly && !interaction.guild) {
            throw new errors_1.ValidationError('This command can only be used in a server');
        }
        // NSFW check
        if (this.nsfw && interaction.channel && 'nsfw' in interaction.channel && !interaction.channel.nsfw) {
            throw new errors_1.ValidationError('This command can only be used in NSFW channels');
        }
        // Owner only check
        if (this.ownerOnly) {
            const { isOwner } = require('../config/owner');
            if (!isOwner(interaction.user.id)) {
                throw new errors_1.PermissionError('This command is restricted to bot owners');
            }
        }
        // Admin only check
        if (this.adminOnly && interaction.guild && interaction.member) {
            const member = interaction.member;
            const isAdmin = member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
            const isGuildOwner = interaction.guild.ownerId === interaction.user.id;
            if (!isAdmin && !isGuildOwner) {
                throw new errors_1.PermissionError('This command requires Administrator permission');
            }
        }
        // User permissions check
        if (this.userPermissions.length > 0 && interaction.guild && interaction.member) {
            const member = interaction.member;
            const missing = this.userPermissions.filter(perm => !member.permissions.has(perm));
            if (missing.length > 0) {
                throw new errors_1.PermissionError(`Missing permissions: ${missing.join(', ')}`);
            }
        }
        // Bot permissions check
        if (this.botPermissions.length > 0 && interaction.guild) {
            const botMember = interaction.guild.members.me;
            if (botMember) {
                const missing = this.botPermissions.filter(perm => !botMember.permissions.has(perm));
                if (missing.length > 0) {
                    throw new errors_1.PermissionError(`I'm missing permissions: ${missing.join(', ')}`);
                }
            }
        }
    }
    /**
     * Check cooldown
     */
    _checkCooldown(userId) {
        if (this.cooldown <= 0)
            return { onCooldown: false };
        const now = Date.now();
        const cooldownEnd = this._cooldowns.get(userId);
        if (cooldownEnd && now < cooldownEnd) {
            return {
                onCooldown: true,
                remaining: Math.ceil((cooldownEnd - now) / 1000),
            };
        }
        return { onCooldown: false };
    }
    /**
     * Set cooldown
     */
    _setCooldown(userId) {
        if (this.cooldown <= 0)
            return;
        this._cooldowns.set(userId, Date.now() + (this.cooldown * 1000));
        // Auto-cleanup after cooldown expires
        setTimeout(() => {
            this._cooldowns.delete(userId);
        }, this.cooldown * 1000 + 1000);
    }
    /**
     * Send cooldown message
     */
    async _sendCooldownMessage(interaction, remaining) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(constants_1.COLORS.WARNING)
            .setDescription(`${constants_1.EMOJIS.CLOCK} Please wait **${remaining}s** before using this command again.`);
        await this.safeReply(interaction, { embeds: [embed], ephemeral: true });
    }
    /**
     * Handle errors uniformly
     */
    async _handleError(interaction, error, commandName) {
        // Log error
        logger.error(commandName, `Error: ${error.message}`);
        if (error.stack && !errors_1.AppError.isOperationalError(error)) {
            console.error(error.stack);
        }
        // Determine error message
        let userMessage = 'An unexpected error occurred. Please try again later.';
        let color = constants_1.COLORS.ERROR;
        if (error instanceof errors_1.AppError) {
            userMessage = error.message;
            if (error.code === 'VALIDATION_ERROR') {
                color = constants_1.COLORS.WARNING;
            }
        }
        else if (error.code === 'InteractionAlreadyReplied') {
            return;
        }
        // Send error response
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(color)
            .setDescription(`${constants_1.EMOJIS.ERROR} ${userMessage}`);
        await this.safeReply(interaction, { embeds: [embed], ephemeral: true });
    }
    /**
     * Safe reply helper - handles deferred/replied states
     */
    async safeReply(interaction, options) {
        try {
            if (interaction.deferred) {
                // Extract only compatible properties for editReply
                const { content, embeds, components, files, allowedMentions } = options;
                return await interaction.editReply({ content, embeds, components, files, allowedMentions });
            }
            else if (interaction.replied) {
                return await interaction.followUp(options);
            }
            else {
                const response = await interaction.reply({ ...options, withResponse: false });
                return response;
            }
        }
        catch (error) {
            logger.debug('BaseCommand', `Reply failed: ${error.message}`);
        }
    }
    // EMBED HELPERS
    /**
     * Create success embed
     */
    successEmbed(title, description) {
        return new discord_js_1.EmbedBuilder()
            .setColor(constants_1.COLORS.SUCCESS)
            .setTitle(`${constants_1.EMOJIS.SUCCESS} ${title}`)
            .setDescription(description)
            .setTimestamp();
    }
    /**
     * Create error embed
     */
    errorEmbed(message) {
        return new discord_js_1.EmbedBuilder()
            .setColor(constants_1.COLORS.ERROR)
            .setDescription(`${constants_1.EMOJIS.ERROR} ${message}`);
    }
    /**
     * Create info embed
     */
    infoEmbed(title, description) {
        return new discord_js_1.EmbedBuilder()
            .setColor(constants_1.COLORS.INFO)
            .setTitle(`${constants_1.EMOJIS.INFO} ${title}`)
            .setDescription(description);
    }
    /**
     * Create warning embed
     */
    warningEmbed(message) {
        return new discord_js_1.EmbedBuilder()
            .setColor(constants_1.COLORS.WARNING)
            .setDescription(`${constants_1.EMOJIS.WARNING} ${message}`);
    }
    // REPLY HELPERS
    /**
     * Send info reply
     */
    async infoReply(interaction, message, ephemeral = true) {
        const embed = this.infoEmbed('Info', message);
        return this.safeReply(interaction, { embeds: [embed], ephemeral });
    }
    /**
     * Send error reply
     */
    async errorReply(interaction, message, ephemeral = true) {
        const embed = this.errorEmbed(message);
        return this.safeReply(interaction, { embeds: [embed], ephemeral });
    }
    /**
     * Send success reply
     */
    async successReply(interaction, title, description, ephemeral = false) {
        const embed = this.successEmbed(title, description);
        return this.safeReply(interaction, { embeds: [embed], ephemeral });
    }
    /**
     * Send warning reply
     */
    async warningReply(interaction, message, ephemeral = true) {
        const embed = this.warningEmbed(message);
        return this.safeReply(interaction, { embeds: [embed], ephemeral });
    }
}
exports.BaseCommand = BaseCommand;
// CommonJS COMPATIBILITY
module.exports = {
    BaseCommand,
    CommandCategory: exports.CommandCategory,
};
//# sourceMappingURL=BaseCommand.js.map