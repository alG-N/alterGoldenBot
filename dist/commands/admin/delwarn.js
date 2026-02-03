"use strict";
/**
 * Delete Warning Command
 * Delete a specific warning by case ID
 * @module commands/admin/delwarn
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
class DelWarnCommand extends BaseCommand_js_1.BaseCommand {
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
            .setName('delwarn')
            .setDescription('Delete a specific warning by case ID')
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
            .addIntegerOption(option => option.setName('case')
            .setDescription('Case ID to delete')
            .setRequired(true)
            .setMinValue(1))
            .addStringOption(option => option.setName('reason')
            .setDescription('Reason for deletion')
            .setRequired(false));
    }
    async run(interaction) {
        if (!interaction.guild) {
            await this.errorReply(interaction, 'This command can only be used in a server.');
            return;
        }
        const caseId = interaction.options.getInteger('case', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        try {
            // Get the case
            const infraction = await infractionService?.getCase?.(interaction.guild.id, caseId);
            if (!infraction) {
                await interaction.editReply({
                    content: `❌ Case #${caseId} not found.`
                });
                return;
            }
            if (!infraction.active) {
                await interaction.editReply({
                    content: `❌ Case #${caseId} is already deleted/inactive.`
                });
                return;
            }
            // Only allow deleting warnings (not bans/kicks)
            if (infraction.type !== 'warn') {
                await interaction.editReply({
                    content: `❌ Case #${caseId} is a ${infraction.type}, not a warning. Use this command only for warnings.`
                });
                return;
            }
            // Delete (deactivate) the warning
            await infractionService?.deleteCase?.(interaction.guild.id, caseId);
            // Get user for display
            const targetUser = await interaction.client.users.fetch(infraction.user_id).catch(() => null);
            const userName = targetUser?.tag || `Unknown User (${infraction.user_id})`;
            // Build response
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Warning Deleted')
                .addFields({ name: 'Case ID', value: `#${caseId}`, inline: true }, { name: 'User', value: userName, inline: true }, { name: 'Original Reason', value: infraction.reason || 'No reason', inline: false }, { name: 'Deletion Reason', value: reason })
                .setFooter({ text: `Deleted by ${interaction.user.tag}` })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error('[DelWarnCommand] Error:', error);
            await interaction.editReply({
                content: `❌ Failed to delete warning: ${error.message}`
            });
        }
    }
}
exports.default = new DelWarnCommand();
//# sourceMappingURL=delwarn.js.map