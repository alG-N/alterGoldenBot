"use strict";
/**
 * Role Info Command - Presentation Layer
 * Display role information
 * @module presentation/commands/general/roleinfo
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const constants_js_1 = require("../../constants.js");
class RoleInfoCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.GENERAL,
            cooldown: 3,
            deferReply: false
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('roleinfo')
            .setDescription('Get information about a role')
            .addRoleOption(option => option.setName('role')
            .setDescription('The role to get info about')
            .setRequired(true));
    }
    async run(interaction) {
        const role = interaction.options.getRole('role');
        if (!role) {
            await this.errorReply(interaction, 'Please provide a valid role.');
            return;
        }
        // Get key permissions
        const keyPermissions = [
            { flag: discord_js_1.PermissionFlagsBits.Administrator, name: 'Administrator' },
            { flag: discord_js_1.PermissionFlagsBits.ManageGuild, name: 'Manage Server' },
            { flag: discord_js_1.PermissionFlagsBits.ManageRoles, name: 'Manage Roles' },
            { flag: discord_js_1.PermissionFlagsBits.ManageChannels, name: 'Manage Channels' },
            { flag: discord_js_1.PermissionFlagsBits.KickMembers, name: 'Kick Members' },
            { flag: discord_js_1.PermissionFlagsBits.BanMembers, name: 'Ban Members' },
            { flag: discord_js_1.PermissionFlagsBits.ManageMessages, name: 'Manage Messages' },
            { flag: discord_js_1.PermissionFlagsBits.MentionEveryone, name: 'Mention Everyone' },
            { flag: discord_js_1.PermissionFlagsBits.ModerateMembers, name: 'Timeout Members' }
        ];
        const hasPermissions = keyPermissions
            .filter(p => role.permissions.has(p.flag))
            .map(p => `\`${p.name}\``)
            .join(', ') || 'None';
        // Count members with this role
        const memberCount = role.members.size;
        // Get role icon if exists
        const roleIcon = role.iconURL();
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`📜 Role: ${role.name}`)
            .setColor(role.color || constants_js_1.COLORS.PRIMARY)
            .addFields({ name: '🆔 ID', value: `\`${role.id}\``, inline: true }, { name: '🎨 Color', value: role.hexColor, inline: true }, { name: '📊 Position', value: `${role.position}/${interaction.guild?.roles.cache.size || 0}`, inline: true }, { name: '👥 Members', value: `${memberCount}`, inline: true }, { name: '📣 Mentionable', value: role.mentionable ? '✅ Yes' : '❌ No', inline: true }, { name: '📌 Hoisted', value: role.hoist ? '✅ Yes' : '❌ No', inline: true }, { name: '🤖 Managed', value: role.managed ? '✅ Yes (Bot/Integration)' : '❌ No', inline: true }, { name: '📅 Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true }, { name: '🔗 Mention', value: `${role}`, inline: true }, { name: '🔑 Key Permissions', value: hasPermissions, inline: false })
            .setTimestamp()
            .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        });
        // Add role icon if exists
        if (roleIcon) {
            embed.setThumbnail(roleIcon);
        }
        await interaction.reply({ embeds: [embed] });
    }
}
exports.default = new RoleInfoCommand();
//# sourceMappingURL=roleinfo.js.map