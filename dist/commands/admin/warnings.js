"use strict";
/**
 * Warnings Command
 * View warnings for a user
 * @module commands/admin/warnings
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const WARNINGS_PER_PAGE = 5;
const getDefault = (mod) => mod.default || mod;
let infractionService;
let moderationConfig;
try {
    const mod = getDefault(require('../../services/moderation'));
    infractionService = mod.InfractionService;
    moderationConfig = getDefault(require('../../config/features/moderation'));
}
catch {
    // Service not available
}
class WarningsCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.ADMIN,
            cooldown: 3,
            deferReply: true,
            userPermissions: [discord_js_1.PermissionFlagsBits.ModerateMembers]
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('warnings')
            .setDescription('View warnings for a user')
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
            .addUserOption(option => option.setName('user')
            .setDescription('User to view warnings for')
            .setRequired(true))
            .addBooleanOption(option => option.setName('all')
            .setDescription('Show all infractions, not just warnings')
            .setRequired(false));
    }
    async run(interaction) {
        if (!interaction.guild) {
            await this.errorReply(interaction, 'This command can only be used in a server.');
            return;
        }
        const targetUser = interaction.options.getUser('user', true);
        const showAll = interaction.options.getBoolean('all') || false;
        try {
            // Get infractions
            const infractions = await infractionService?.getUserHistory?.(interaction.guild.id, targetUser.id, {
                type: showAll ? null : 'warn',
                activeOnly: !showAll,
                limit: 50
            }) || [];
            if (infractions.length === 0) {
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle(`${moderationConfig?.EMOJIS?.USER || '👤'} ${targetUser.tag}`)
                    .setDescription(showAll
                    ? '✅ This user has no infractions.'
                    : '✅ This user has no active warnings.')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            // Get active warning count
            const activeWarnings = await infractionService?.getWarningCount?.(interaction.guild.id, targetUser.id) || 0;
            // Paginate
            const pages = this._paginateInfractions(infractions, targetUser, activeWarnings, showAll);
            if (pages.length === 1) {
                await interaction.editReply({ embeds: [pages[0]] });
                return;
            }
            // Multi-page with buttons
            let currentPage = 0;
            const row = this._createNavigationRow(currentPage, pages.length);
            const message = await interaction.editReply({
                embeds: [pages[currentPage]],
                components: [row]
            });
            // Button collector
            const collector = message.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 120000 // 2 minutes
            });
            collector.on('collect', async (i) => {
                if (i.customId === 'warnings_prev') {
                    currentPage = Math.max(0, currentPage - 1);
                }
                else if (i.customId === 'warnings_next') {
                    currentPage = Math.min(pages.length - 1, currentPage + 1);
                }
                await i.update({
                    embeds: [pages[currentPage]],
                    components: [this._createNavigationRow(currentPage, pages.length)]
                });
            });
            collector.on('end', async () => {
                const disabledRow = this._createNavigationRow(currentPage, pages.length, true);
                await message.edit({ components: [disabledRow] }).catch(() => { });
            });
        }
        catch (error) {
            console.error('[WarningsCommand] Error:', error);
            await interaction.editReply({
                content: `❌ Failed to fetch warnings: ${error.message}`
            });
        }
    }
    /**
     * Paginate infractions into embeds
     */
    _paginateInfractions(infractions, user, activeWarnings, showAll) {
        const pages = [];
        const totalPages = Math.ceil(infractions.length / WARNINGS_PER_PAGE);
        for (let i = 0; i < totalPages; i++) {
            const start = i * WARNINGS_PER_PAGE;
            const pageInfractions = infractions.slice(start, start + WARNINGS_PER_PAGE);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(activeWarnings > 0 ? (moderationConfig?.COLORS?.WARN || 0xFFAA00) : 0x00FF00)
                .setTitle(`${moderationConfig?.EMOJIS?.USER || '👤'} ${user.tag}`)
                .setThumbnail(user.displayAvatarURL())
                .setDescription(showAll
                ? `Showing all infractions (${infractions.length} total)`
                : `**Active Warnings:** ${activeWarnings}`)
                .setFooter({ text: `Page ${i + 1}/${totalPages} • User ID: ${user.id}` })
                .setTimestamp();
            for (const infraction of pageInfractions) {
                const type = infraction.type.toUpperCase();
                const emoji = moderationConfig?.EMOJIS?.[type] || '📋';
                const date = new Date(infraction.created_at);
                const timestamp = Math.floor(date.getTime() / 1000);
                let value = `**Reason:** ${infraction.reason || 'No reason'}\n`;
                value += `**Moderator:** <@${infraction.moderator_id}>\n`;
                value += `**Date:** <t:${timestamp}:R>`;
                if (infraction.duration_ms) {
                    try {
                        const { formatDuration } = require('../../utils/common/time');
                        value += `\n**Duration:** ${formatDuration(infraction.duration_ms)}`;
                    }
                    catch {
                        value += `\n**Duration:** ${Math.floor(infraction.duration_ms / 60000)} minutes`;
                    }
                }
                if (!infraction.active) {
                    value += '\n*⚠️ Inactive*';
                }
                embed.addFields({
                    name: `${emoji} Case #${infraction.case_id} - ${infraction.type.charAt(0).toUpperCase() + infraction.type.slice(1)}`,
                    value,
                    inline: false
                });
            }
            pages.push(embed);
        }
        return pages;
    }
    /**
     * Create navigation button row
     */
    _createNavigationRow(currentPage, totalPages, disabled = false) {
        return new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('warnings_prev')
            .setLabel('◀ Previous')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(disabled || currentPage === 0), new discord_js_1.ButtonBuilder()
            .setCustomId('warnings_page')
            .setLabel(`${currentPage + 1}/${totalPages}`)
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setDisabled(true), new discord_js_1.ButtonBuilder()
            .setCustomId('warnings_next')
            .setLabel('Next ▶')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(disabled || currentPage === totalPages - 1));
    }
}
exports.default = new WarningsCommand();
//# sourceMappingURL=warnings.js.map