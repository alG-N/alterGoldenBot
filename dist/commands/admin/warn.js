"use strict";
/**
 * Warn Command
 * Issue a warning to a user with settings panel
 * @module commands/admin/warn
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const getDefault = (mod) => mod.default || mod;
let infractionService;
let moderationService;
let moderationConfig;
let db;
try {
    const mod = getDefault(require('../../services/moderation'));
    infractionService = mod.InfractionService;
    moderationService = mod.ModerationService;
    moderationConfig = getDefault(require('../../config/features/moderation'));
    db = getDefault(require('../../database'));
}
catch {
    // Services not available
}
/**
 * Format duration for display
 */
function formatDuration(ms) {
    const hours = ms / (60 * 60 * 1000);
    if (hours >= 24)
        return `${Math.floor(hours / 24)} day(s)`;
    if (hours >= 1)
        return `${Math.floor(hours)} hour(s)`;
    return `${Math.floor(ms / (60 * 1000))} minute(s)`;
}
class WarnCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.ADMIN,
            cooldown: 3,
            deferReply: false,
            userPermissions: [discord_js_1.PermissionFlagsBits.ModerateMembers]
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('warn')
            .setDescription('Warning system commands')
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
            .addSubcommand(sub => sub
            .setName('user')
            .setDescription('Issue a warning to a user')
            .addUserOption(option => option.setName('target')
            .setDescription('User to warn')
            .setRequired(true))
            .addStringOption(option => option.setName('reason')
            .setDescription('Reason for the warning')
            .setRequired(false)
            .setMaxLength(500))
            .addBooleanOption(option => option.setName('silent')
            .setDescription('Do not DM the user')
            .setRequired(false)))
            .addSubcommand(sub => sub
            .setName('setting')
            .setDescription('Configure warning escalation thresholds'));
    }
    async run(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'setting') {
            await this._runSettings(interaction);
            return;
        }
        await this._runWarn(interaction);
    }
    /**
     * Run warn user subcommand
     */
    async _runWarn(interaction) {
        if (!interaction.guild) {
            await this.errorReply(interaction, 'This command can only be used in a server.');
            return;
        }
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const silent = interaction.options.getBoolean('silent') || false;
        // Validation
        if (!target) {
            await interaction.reply({
                content: '❌ User not found in this server.',
                ephemeral: true
            });
            return;
        }
        if (target.id === interaction.user.id) {
            await interaction.reply({
                content: '❌ You cannot warn yourself.',
                ephemeral: true
            });
            return;
        }
        if (target.id === interaction.client.user?.id) {
            await interaction.reply({
                content: '❌ I cannot warn myself.',
                ephemeral: true
            });
            return;
        }
        // Check role hierarchy
        const member = interaction.member;
        if (target.roles.highest.position >= member.roles.highest.position &&
            interaction.user.id !== interaction.guild.ownerId) {
            await interaction.reply({
                content: '❌ You cannot warn someone with equal or higher role than you.',
                ephemeral: true
            });
            return;
        }
        await interaction.deferReply();
        try {
            // Create warning
            const result = await infractionService?.createWarning?.(interaction.guild, target.user, interaction.user, reason, {
                metadata: {
                    channelId: interaction.channelId,
                    silent
                }
            });
            if (!result) {
                await interaction.editReply({ content: '❌ Failed to create warning - service unavailable.' });
                return;
            }
            const { infraction, warnCount, escalation } = result;
            // Try to DM user (unless silent)
            let dmSent = false;
            if (!silent && moderationConfig?.punishments?.warnings?.sendDM) {
                try {
                    const dmEmbed = new discord_js_1.EmbedBuilder()
                        .setColor(moderationConfig?.COLORS?.WARN || 0xFFAA00)
                        .setTitle(`${moderationConfig?.EMOJIS?.WARN || '⚠️'} You have been warned`)
                        .setDescription(`You have received a warning in **${interaction.guild.name}**`)
                        .addFields({ name: 'Reason', value: reason }, { name: 'Warning Count', value: `${warnCount} active warning(s)`, inline: true }, { name: 'Moderator', value: interaction.user.tag, inline: true })
                        .setFooter({ text: 'Please follow the server rules to avoid further action.' })
                        .setTimestamp();
                    await target.send({ embeds: [dmEmbed] });
                    dmSent = true;
                }
                catch {
                    // User has DMs disabled
                }
            }
            // Build response embed
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(moderationConfig?.COLORS?.WARN || 0xFFAA00)
                .setTitle(`${moderationConfig?.EMOJIS?.WARN || '⚠️'} Warning Issued`)
                .addFields({ name: 'User', value: `${target.user.tag} (<@${target.id}>)`, inline: true }, { name: 'Warning Count', value: `${warnCount}`, inline: true }, { name: 'Case ID', value: `#${infraction.case_id}`, inline: true }, { name: 'Reason', value: reason })
                .setFooter({ text: `Warned by ${interaction.user.tag}${dmSent ? '' : ' • DM not sent'}` })
                .setTimestamp();
            // Handle escalation if triggered
            if (escalation) {
                const escalationResult = await this._handleEscalation(interaction, target, escalation, warnCount);
                if (escalationResult) {
                    embed.addFields({
                        name: '⚠️ Automatic Action',
                        value: escalationResult.message,
                        inline: false
                    });
                }
            }
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error('[WarnCommand] Error:', error);
            await interaction.editReply({
                content: `❌ Failed to warn user: ${error.message}`
            });
        }
    }
    /**
     * Handle automatic escalation
     */
    async _handleEscalation(interaction, target, escalation, warnCount) {
        const member = interaction.member;
        try {
            switch (escalation.action) {
                case 'mute': {
                    const muteResult = await moderationService?.muteUser?.(target, member, escalation.durationMs || 3600000, `${escalation.reason} (${warnCount} warnings)`);
                    if (muteResult?.success) {
                        await infractionService?.logMute?.(interaction.guild, target.user, interaction.client.user, escalation.reason, escalation.durationMs || 3600000);
                        return {
                            success: true,
                            message: `🔇 User has been automatically muted for ${formatDuration(escalation.durationMs || 3600000)} (${warnCount} warnings)`
                        };
                    }
                    break;
                }
                case 'kick': {
                    const kickResult = await moderationService?.kickUser?.(target, member, `${escalation.reason} (${warnCount} warnings)`);
                    if (kickResult?.success) {
                        await infractionService?.logKick?.(interaction.guild, target.user, interaction.client.user, escalation.reason);
                        return {
                            success: true,
                            message: `👢 User has been automatically kicked (${warnCount} warnings)`
                        };
                    }
                    break;
                }
                case 'ban': {
                    const banResult = await moderationService?.banUser?.(target, member, `${escalation.reason} (${warnCount} warnings)`);
                    if (banResult?.success) {
                        await infractionService?.logBan?.(interaction.guild, target.user, interaction.client.user, escalation.reason);
                        return {
                            success: true,
                            message: `🔨 User has been automatically banned (${warnCount} warnings)`
                        };
                    }
                    break;
                }
            }
        }
        catch (error) {
            console.error('[WarnCommand] Escalation error:', error);
        }
        return null;
    }
    // WARN SETTINGS PANEL
    /**
     * Run warn settings panel
     */
    async _runSettings(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const thresholds = await this._getThresholds(interaction.guildId);
        const embed = this._buildSettingsEmbed(thresholds);
        const components = this._buildSettingsComponents(thresholds);
        const response = await interaction.editReply({
            embeds: [embed],
            components
        });
        this._setupSettingsCollector(response, interaction);
    }
    /**
     * Get warning thresholds from database
     */
    async _getThresholds(guildId) {
        if (!db)
            return [];
        const result = await db.query('SELECT * FROM warn_thresholds WHERE guild_id = $1 ORDER BY warn_count ASC', [guildId]);
        return result.rows;
    }
    /**
     * Build settings embed
     */
    _buildSettingsEmbed(thresholds) {
        const lines = thresholds.length > 0
            ? thresholds.map(t => {
                const durationText = t.action === 'mute' && t.duration_ms
                    ? ` (${formatDuration(t.duration_ms)})`
                    : '';
                return `• **${t.warn_count} warns** → ${this._getActionEmoji(t.action)} ${t.action}${durationText}`;
            })
            : ['*No thresholds configured. Using defaults:*',
                '• **3 warns** → 🔇 mute (1 hour)',
                '• **5 warns** → 👢 kick',
                '• **7 warns** → 🔨 ban'];
        return new discord_js_1.EmbedBuilder()
            .setColor(moderationConfig?.COLORS?.WARN || 0xFFAA00)
            .setTitle('⚠️ Warning Escalation Settings')
            .setDescription([
            'Configure automatic actions when users reach warning thresholds.',
            '',
            '**Current Thresholds:**',
            ...lines,
            '',
            'Use the buttons below to add, edit, or remove thresholds.'
        ].join('\n'))
            .setFooter({ text: 'Thresholds are checked when /warn user is used' })
            .setTimestamp();
    }
    /**
     * Get action emoji
     */
    _getActionEmoji(action) {
        const emojis = { mute: '🔇', kick: '👢', ban: '🔨' };
        return emojis[action] || '⚡';
    }
    /**
     * Build settings components
     */
    _buildSettingsComponents(thresholds) {
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('warn_add_threshold')
            .setLabel('Add Threshold')
            .setEmoji('➕')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId('warn_reset_defaults')
            .setLabel('Reset to Defaults')
            .setEmoji('🔄')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        const rows = [row1];
        // Add edit/delete select if thresholds exist
        if (thresholds.length > 0) {
            const options = thresholds.map(t => ({
                label: `${t.warn_count} warns → ${t.action}`,
                value: `${t.warn_count}`,
                emoji: this._getActionEmoji(t.action)
            }));
            const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
                .setCustomId('warn_select_threshold')
                .setPlaceholder('Select a threshold to edit/delete')
                .addOptions(options));
            rows.push(row2);
        }
        return rows;
    }
    /**
     * Setup settings collector
     */
    _setupSettingsCollector(response, interaction) {
        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 300000 // 5 minutes
        });
        collector.on('collect', async (i) => {
            try {
                if (i.customId === 'warn_add_threshold') {
                    await this._showAddThresholdModal(i);
                }
                else if (i.customId === 'warn_reset_defaults') {
                    await i.deferUpdate();
                    await this._resetToDefaults(i.guildId);
                    const thresholds = await this._getThresholds(i.guildId);
                    await i.editReply({
                        embeds: [this._buildSettingsEmbed(thresholds)],
                        components: this._buildSettingsComponents(thresholds)
                    });
                }
                else if (i.customId === 'warn_select_threshold') {
                    const warnCount = parseInt(i.values[0]);
                    await this._showEditThresholdModal(i, warnCount);
                }
            }
            catch (error) {
                console.error('[WarnCommand] Settings collector error:', error);
            }
        });
        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => { });
        });
    }
    /**
     * Show add threshold modal
     */
    async _showAddThresholdModal(interaction) {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('warn_add_modal')
            .setTitle('Add Warning Threshold');
        const warnCountInput = new discord_js_1.TextInputBuilder()
            .setCustomId('warn_count')
            .setLabel('Warning Count (1-20)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('e.g., 3')
            .setRequired(true)
            .setMaxLength(2);
        const actionInput = new discord_js_1.TextInputBuilder()
            .setCustomId('action')
            .setLabel('Action (mute, kick, or ban)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('mute')
            .setRequired(true)
            .setMaxLength(10);
        const durationInput = new discord_js_1.TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Duration for mute (e.g., 1h, 30m, 1d)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('1h (leave empty for kick/ban)')
            .setRequired(false)
            .setMaxLength(10);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(warnCountInput), new discord_js_1.ActionRowBuilder().addComponents(actionInput), new discord_js_1.ActionRowBuilder().addComponents(durationInput));
        await interaction.showModal(modal);
        // Handle modal submit
        try {
            const modalSubmit = await interaction.awaitModalSubmit({
                filter: i => i.customId === 'warn_add_modal' && i.user.id === interaction.user.id,
                time: 60000
            });
            await modalSubmit.deferUpdate();
            const warnCount = parseInt(modalSubmit.fields.getTextInputValue('warn_count'));
            const action = modalSubmit.fields.getTextInputValue('action').toLowerCase();
            const durationInput = modalSubmit.fields.getTextInputValue('duration');
            if (isNaN(warnCount) || warnCount < 1 || warnCount > 20)
                return;
            if (!['mute', 'kick', 'ban'].includes(action))
                return;
            let durationMs = null;
            if (action === 'mute' && durationInput) {
                durationMs = this._parseDuration(durationInput);
            }
            await this._upsertThreshold(modalSubmit.guildId, warnCount, action, durationMs);
            const thresholds = await this._getThresholds(modalSubmit.guildId);
            await modalSubmit.editReply({
                embeds: [this._buildSettingsEmbed(thresholds)],
                components: this._buildSettingsComponents(thresholds)
            });
        }
        catch {
            // Modal timeout
        }
    }
    /**
     * Show edit threshold modal
     */
    async _showEditThresholdModal(interaction, warnCount) {
        if (!db)
            return;
        const existing = await db.query('SELECT * FROM warn_thresholds WHERE guild_id = $1 AND warn_count = $2', [interaction.guildId, warnCount]);
        const threshold = existing.rows[0];
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId(`warn_edit_modal_${warnCount}`)
            .setTitle(`Edit Threshold: ${warnCount} Warns`);
        const warnCountInput = new discord_js_1.TextInputBuilder()
            .setCustomId('warn_count')
            .setLabel('Warning Count (1-20)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setValue(warnCount.toString())
            .setRequired(true)
            .setMaxLength(2);
        const actionInput = new discord_js_1.TextInputBuilder()
            .setCustomId('action')
            .setLabel('Action (mute, kick, or ban)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setValue(threshold?.action || 'mute')
            .setRequired(true)
            .setMaxLength(10);
        const durationInput = new discord_js_1.TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Duration for mute (e.g., 1h, 30m, 1d)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setValue(threshold?.duration_ms ? this._formatDurationInput(threshold.duration_ms) : '')
            .setRequired(false)
            .setMaxLength(10);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(warnCountInput), new discord_js_1.ActionRowBuilder().addComponents(actionInput), new discord_js_1.ActionRowBuilder().addComponents(durationInput));
        await interaction.showModal(modal);
        // Handle modal submit
        try {
            const modalSubmit = await interaction.awaitModalSubmit({
                filter: i => i.customId === `warn_edit_modal_${warnCount}` && i.user.id === interaction.user.id,
                time: 60000
            });
            await modalSubmit.deferUpdate();
            const newWarnCount = parseInt(modalSubmit.fields.getTextInputValue('warn_count'));
            const action = modalSubmit.fields.getTextInputValue('action').toLowerCase();
            const durationInputValue = modalSubmit.fields.getTextInputValue('duration');
            if (isNaN(newWarnCount) || newWarnCount < 1 || newWarnCount > 20)
                return;
            if (!['mute', 'kick', 'ban'].includes(action))
                return;
            // Delete old if warn count changed
            if (newWarnCount !== warnCount) {
                await this._deleteThreshold(modalSubmit.guildId, warnCount);
            }
            let durationMs = null;
            if (action === 'mute' && durationInputValue) {
                durationMs = this._parseDuration(durationInputValue);
            }
            await this._upsertThreshold(modalSubmit.guildId, newWarnCount, action, durationMs);
            const thresholds = await this._getThresholds(modalSubmit.guildId);
            await modalSubmit.editReply({
                embeds: [this._buildSettingsEmbed(thresholds)],
                components: this._buildSettingsComponents(thresholds)
            });
        }
        catch {
            // Modal timeout
        }
    }
    /**
     * Parse duration string to milliseconds
     */
    _parseDuration(input) {
        const match = input.match(/^(\d+)(m|h|d)$/i);
        if (!match)
            return 60 * 60 * 1000; // Default 1 hour
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const multipliers = {
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000
        };
        return value * multipliers[unit];
    }
    /**
     * Format duration for input field
     */
    _formatDurationInput(ms) {
        const hours = ms / (60 * 60 * 1000);
        if (hours >= 24 && hours % 24 === 0)
            return `${hours / 24}d`;
        if (hours >= 1)
            return `${hours}h`;
        return `${ms / (60 * 1000)}m`;
    }
    /**
     * Upsert threshold
     */
    async _upsertThreshold(guildId, warnCount, action, durationMs) {
        if (!db)
            return;
        await db.query(`
            INSERT INTO warn_thresholds (guild_id, warn_count, action, duration_ms)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (guild_id, warn_count) 
            DO UPDATE SET action = $3, duration_ms = $4
        `, [guildId, warnCount, action, durationMs]);
    }
    /**
     * Delete threshold
     */
    async _deleteThreshold(guildId, warnCount) {
        if (!db)
            return;
        await db.query('DELETE FROM warn_thresholds WHERE guild_id = $1 AND warn_count = $2', [guildId, warnCount]);
    }
    /**
     * Reset to defaults
     */
    async _resetToDefaults(guildId) {
        if (!db)
            return;
        await db.query('DELETE FROM warn_thresholds WHERE guild_id = $1', [guildId]);
        const defaults = [
            { warn_count: 3, action: 'mute', duration_ms: 60 * 60 * 1000 },
            { warn_count: 5, action: 'kick', duration_ms: null },
            { warn_count: 7, action: 'ban', duration_ms: null }
        ];
        for (const d of defaults) {
            await db.query(`
                INSERT INTO warn_thresholds (guild_id, warn_count, action, duration_ms)
                VALUES ($1, $2, $3, $4)
            `, [guildId, d.warn_count, d.action, d.duration_ms]);
        }
    }
}
exports.default = new WarnCommand();
//# sourceMappingURL=warn.js.map