"use strict";
/**
 * Case Command
 * View details of a specific moderation case
 * @module commands/admin/case
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const getDefault = (mod) => mod.default || mod;
let infractionService;
try {
    const mod = getDefault(require('../../services/moderation'));
    infractionService = mod.InfractionService;
}
catch {
    // Service not available
}
class CaseCommand extends BaseCommand_js_1.BaseCommand {
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
            .setName('case')
            .setDescription('View details of a specific moderation case')
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
            .addIntegerOption(option => option.setName('id')
            .setDescription('Case ID to view')
            .setRequired(true)
            .setMinValue(1));
    }
    async run(interaction) {
        if (!interaction.guild) {
            await this.errorReply(interaction, 'This command can only be used in a server.');
            return;
        }
        const caseId = interaction.options.getInteger('id', true);
        try {
            // Get the case
            const infraction = await infractionService?.getCase?.(interaction.guild.id, caseId);
            if (!infraction) {
                await interaction.editReply({
                    content: `❌ Case #${caseId} not found.`
                });
                return;
            }
            // Get user for avatar
            const targetUser = await interaction.client.users.fetch(infraction.user_id).catch(() => null);
            // Build embed
            const embed = infractionService?.buildCaseEmbed?.(infraction, targetUser) || this._buildDefaultEmbed(infraction, targetUser);
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error('[CaseCommand] Error:', error);
            await interaction.editReply({
                content: `❌ Failed to fetch case: ${error.message}`
            });
        }
    }
    _buildDefaultEmbed(infraction, targetUser) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📋 Case #${infraction.id}`)
            .addFields({ name: 'Type', value: infraction.type.toUpperCase(), inline: true }, { name: 'User', value: targetUser ? `${targetUser.tag} (<@${targetUser.id}>)` : `<@${infraction.user_id}>`, inline: true }, { name: 'Moderator', value: `<@${infraction.moderator_id}>`, inline: true }, { name: 'Reason', value: infraction.reason || 'No reason provided', inline: false }, { name: 'Status', value: infraction.active ? '🟢 Active' : '🔴 Inactive', inline: true })
            .setTimestamp(infraction.created_at);
        if (targetUser) {
            embed.setThumbnail(targetUser.displayAvatarURL());
        }
        return embed;
    }
}
exports.default = new CaseCommand();
//# sourceMappingURL=case.js.map