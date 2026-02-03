"use strict";
/**
 * Clear Warnings Command
 * Clear all warnings for a user
 * @module commands/admin/clearwarns
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
class ClearWarnsCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.ADMIN,
            cooldown: 5,
            deferReply: true,
            userPermissions: [discord_js_1.PermissionFlagsBits.ModerateMembers]
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('clearwarns')
            .setDescription('Clear all warnings for a user')
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
            .addUserOption(option => option.setName('user')
            .setDescription('User to clear warnings for')
            .setRequired(true))
            .addStringOption(option => option.setName('reason')
            .setDescription('Reason for clearing warnings')
            .setRequired(false));
    }
    async run(interaction) {
        if (!interaction.guild) {
            await this.errorReply(interaction, 'This command can only be used in a server.');
            return;
        }
        const targetUser = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        try {
            // Get current warning count
            const beforeCount = await infractionService?.getWarningCount?.(interaction.guild.id, targetUser.id) || 0;
            if (beforeCount === 0) {
                await interaction.editReply({
                    content: '❌ This user has no active warnings to clear.'
                });
                return;
            }
            // Clear warnings
            const clearedCount = await infractionService?.clearWarnings?.(interaction.guild.id, targetUser.id) || 0;
            // Log the action
            await infractionService?.createInfraction?.({
                guild: interaction.guild,
                user: targetUser,
                moderator: interaction.user,
                type: 'note',
                reason: `Cleared ${clearedCount} warning(s). Reason: ${reason}`,
                metadata: {
                    action: 'clear_warnings',
                    clearedCount
                }
            });
            // Build response
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Warnings Cleared')
                .addFields({ name: 'User', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true }, { name: 'Warnings Cleared', value: `${clearedCount}`, inline: true }, { name: 'Reason', value: reason })
                .setFooter({ text: `Cleared by ${interaction.user.tag}` })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error('[ClearWarnsCommand] Error:', error);
            await interaction.editReply({
                content: `❌ Failed to clear warnings: ${error.message}`
            });
        }
    }
}
exports.default = new ClearWarnsCommand();
//# sourceMappingURL=clearwarns.js.map