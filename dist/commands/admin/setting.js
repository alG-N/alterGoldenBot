"use strict";
/**
 * Setting Command - Simplified Server Settings
 * All settings are managed through /setting view with interactive components
 * @module commands/admin/setting
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const constants_js_1 = require("../../constants.js");
class SettingCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.ADMIN,
            cooldown: 5,
            deferReply: false,
            userPermissions: [discord_js_1.PermissionFlagsBits.Administrator]
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('setting')
            .setDescription('Configure server settings (Server Owner only)')
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
    }
    async run(interaction) {
        // Server owner check
        if (interaction.user.id !== interaction.guild?.ownerId) {
            await interaction.reply({
                content: '❌ Only the server owner can use this command.',
                ephemeral: true
            });
            return;
        }
        await this._showMainPanel(interaction);
    }
    /**
     * Show main settings panel
     */
    async _showMainPanel(interaction, isUpdate = false) {
        let GuildSettingsService;
        let AutoModService;
        let LockdownService;
        let AntiRaidService;
        let ModLogService;
        try {
            const services = require('../../services');
            GuildSettingsService = services.GuildSettingsService;
            const modServices = require('../../services/moderation');
            AutoModService = modServices.autoModService;
            LockdownService = modServices.lockdownService;
            AntiRaidService = modServices.antiRaidService;
            ModLogService = modServices.modLogService;
        }
        catch {
            await interaction.reply({
                content: '❌ Settings service unavailable.',
                ephemeral: true
            });
            return;
        }
        const guildId = interaction.guildId;
        const settings = await GuildSettingsService.getGuildSettings(guildId);
        const snipeLimit = await GuildSettingsService.getSnipeLimit(guildId);
        const deleteLimit = await GuildSettingsService.getDeleteLimit(guildId);
        const adminRoles = await GuildSettingsService.getAdminRoles(guildId);
        const modRoles = await GuildSettingsService.getModRoles(guildId);
        // Get mod log channel from ModLogService
        let modLogChannel = null;
        try {
            const modLogSettings = await ModLogService?.getSettings(guildId);
            modLogChannel = modLogSettings?.log_channel_id || null;
        }
        catch { }
        // Get moderation status
        let automodSettings = { enabled: false };
        let lockdownStatus = { lockedCount: 0 };
        let raidStatus = null;
        try {
            automodSettings = await AutoModService.getSettings(guildId);
        }
        catch { }
        try {
            lockdownStatus = await LockdownService.getLockStatus(guildId);
        }
        catch { }
        try {
            raidStatus = await AntiRaidService.getRaidModeState(guildId);
        }
        catch { }
        const adminRolesMention = adminRoles.length > 0
            ? adminRoles.map(id => `<@&${id}>`).join(', ')
            : '*None*';
        const modRolesMention = modRoles.length > 0
            ? modRoles.map(id => `<@&${id}>`).join(', ')
            : '*None*';
        // Moderation status
        const automodFeatures = automodSettings.enabled ? [
            automodSettings.spam_enabled ? 'Spam' : null,
            automodSettings.duplicate_enabled ? 'Duplicate' : null,
            automodSettings.links_enabled ? 'Links' : null,
            automodSettings.invites_enabled ? 'Invites' : null,
            automodSettings.mention_enabled ? 'Mentions' : null,
            automodSettings.caps_enabled ? 'Caps' : null,
            automodSettings.filter_enabled ? 'Filter' : null
        ].filter(Boolean) : [];
        const automodStatus = automodSettings.enabled
            ? `✅ Enabled (${automodFeatures.length} active)`
            : '❌ Disabled';
        // Announcement status
        const announceEnabled = settings.announcements_enabled !== false;
        const announceStatus = announceEnabled
            ? (settings.announcement_channel ? `✅ <#${settings.announcement_channel}>` : '⚠️ No channel set')
            : '❌ Disabled';
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(constants_js_1.COLORS.INFO)
            .setTitle('⚙️ Server Settings')
            .setDescription(`Settings for **${interaction.guild.name}**\nClick buttons or use select menus to configure.`)
            .addFields({ name: '📝 Snipe Limit', value: `\`${snipeLimit}\``, inline: true }, { name: '🗑️ Delete Limit', value: `\`${deleteLimit}\``, inline: true }, { name: '📋 Mod Log', value: modLogChannel ? `<#${modLogChannel}>` : '*Not set*', inline: true }, { name: '👑 Admin Roles', value: adminRolesMention, inline: true }, { name: '🛡️ Mod Roles', value: modRolesMention, inline: true }, { name: '📢 Announce', value: announceStatus, inline: true }, { name: '─────────────', value: '**🔧 Moderation Status**', inline: false }, { name: '🤖 AutoMod', value: automodStatus, inline: true }, { name: '🔒 Lockdown', value: lockdownStatus.lockedCount > 0 ? `🔒 Active (${lockdownStatus.lockedCount})` : '🔓 Inactive', inline: true }, { name: '🛡️ Raid Mode', value: raidStatus?.active ? '🛡️ Active' : '🛡️ Inactive', inline: true })
            .setFooter({ text: 'Use /automod for detailed automod settings • /modlogs for log toggles' })
            .setTimestamp();
        // Settings select menu
        const settingsMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('setting_menu')
            .setPlaceholder('📝 Quick Edit Setting...')
            .addOptions([
            { label: 'Snipe Limit', value: 'snipe', emoji: '📝', description: 'Messages to track for snipe' },
            { label: 'Delete Limit', value: 'delete', emoji: '🗑️', description: 'Max messages per delete' },
            { label: 'Toggle Announcements', value: 'toggle_announce', emoji: '📢', description: announceEnabled ? 'Currently: Enabled' : 'Currently: Disabled' },
            { label: 'Reset All', value: 'reset', emoji: '🔄', description: 'Reset to defaults' }
        ]);
        // Channel select for mod log
        const channelMenu = new discord_js_1.ChannelSelectMenuBuilder()
            .setCustomId('setting_modlog_channel')
            .setPlaceholder('📋 Set Mod Log Channel...')
            .setChannelTypes(discord_js_1.ChannelType.GuildText)
            .setMinValues(0)
            .setMaxValues(1);
        // Channel select for announcement
        const announceChannelMenu = new discord_js_1.ChannelSelectMenuBuilder()
            .setCustomId('setting_announce_channel')
            .setPlaceholder('📢 Set Announcement Channel...')
            .setChannelTypes(discord_js_1.ChannelType.GuildText)
            .setMinValues(0)
            .setMaxValues(1);
        // Role menus
        const adminRoleMenu = new discord_js_1.RoleSelectMenuBuilder()
            .setCustomId('setting_admin_role')
            .setPlaceholder('👑 Add/Remove Admin Role...')
            .setMinValues(0)
            .setMaxValues(5);
        const modRoleMenu = new discord_js_1.RoleSelectMenuBuilder()
            .setCustomId('setting_mod_role')
            .setPlaceholder('🛡️ Add/Remove Mod Role...')
            .setMinValues(0)
            .setMaxValues(5);
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(settingsMenu);
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(channelMenu);
        const row3 = new discord_js_1.ActionRowBuilder().addComponents(announceChannelMenu);
        const row4 = new discord_js_1.ActionRowBuilder().addComponents(adminRoleMenu);
        const row5 = new discord_js_1.ActionRowBuilder().addComponents(modRoleMenu);
        const messageOptions = {
            embeds: [embed],
            components: [row1, row2, row3, row4, row5],
            ephemeral: true
        };
        const response = await interaction.reply({ ...messageOptions, fetchReply: true });
        // Collector
        const collector = response.createMessageComponentCollector({
            time: 300000 // 5 minutes
        });
        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: '❌ This panel is not for you!', ephemeral: true });
                return;
            }
            try {
                if (i.customId === 'setting_menu') {
                    await this._handleSettingMenu(i, i.values[0]);
                }
                else if (i.customId === 'setting_modlog_channel') {
                    await this._handleModLogChannel(i);
                }
                else if (i.customId === 'setting_announce_channel') {
                    await this._handleAnnounceChannel(i);
                }
                else if (i.customId === 'setting_admin_role') {
                    await this._handleAdminRoles(i);
                }
                else if (i.customId === 'setting_mod_role') {
                    await this._handleModRoles(i);
                }
            }
            catch (error) {
                const err = error;
                if (err.code === 10062)
                    return; // Unknown interaction
                console.error('[Setting] Error:', error);
                if (!i.replied && !i.deferred) {
                    await i.reply({ content: '❌ An error occurred.', ephemeral: true }).catch(() => { });
                }
            }
        });
        collector.on('end', async () => {
            try {
                await interaction.editReply({ components: [] }).catch(() => { });
            }
            catch { }
        });
    }
    async _handleSettingMenu(interaction, value) {
        let GuildSettingsService;
        try {
            const services = require('../../services');
            GuildSettingsService = services.GuildSettingsService;
        }
        catch {
            return;
        }
        const guildId = interaction.guildId;
        if (value === 'reset') {
            await GuildSettingsService.resetGuildSettings(guildId);
            await interaction.update({
                content: '✅ All settings have been reset to defaults!',
                embeds: [],
                components: []
            });
            return;
        }
        if (value === 'toggle_announce') {
            const settings = await GuildSettingsService.getGuildSettings(guildId);
            const currentEnabled = settings.announcements_enabled !== false;
            await GuildSettingsService.updateGuildSettings(guildId, {
                announcements_enabled: !currentEnabled
            });
            await interaction.reply({
                content: !currentEnabled
                    ? '✅ Announcements have been **enabled**. Set a channel to receive announcements.'
                    : '❌ Announcements have been **disabled**.',
                ephemeral: true
            });
            return;
        }
        // Show modal for numeric inputs
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId(`setting_modal_${value}`)
            .setTitle(value === 'snipe' ? 'Set Snipe Limit' : 'Set Delete Limit');
        const input = new discord_js_1.TextInputBuilder()
            .setCustomId('value')
            .setLabel(value === 'snipe' ? 'Snipe Limit (1-50)' : 'Delete Limit (1-500)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(3);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        // Wait for modal submit
        try {
            const modalSubmit = await interaction.awaitModalSubmit({
                filter: i => i.customId === `setting_modal_${value}`,
                time: 60000
            });
            const newValue = parseInt(modalSubmit.fields.getTextInputValue('value'));
            if (isNaN(newValue)) {
                await modalSubmit.reply({ content: '❌ Please enter a valid number!', ephemeral: true });
                return;
            }
            if (value === 'snipe') {
                if (newValue < 1 || newValue > 50) {
                    await modalSubmit.reply({ content: '❌ Snipe limit must be 1-50!', ephemeral: true });
                    return;
                }
                await GuildSettingsService.setSnipeLimit(guildId, newValue);
            }
            else {
                if (newValue < 1 || newValue > 500) {
                    await modalSubmit.reply({ content: '❌ Delete limit must be 1-500!', ephemeral: true });
                    return;
                }
                await GuildSettingsService.setDeleteLimit(guildId, newValue);
            }
            await modalSubmit.reply({
                content: `✅ ${value === 'snipe' ? 'Snipe' : 'Delete'} limit set to **${newValue}**!`,
                ephemeral: true
            });
        }
        catch {
            // Modal timeout - ignore
        }
    }
    async _handleModLogChannel(interaction) {
        let ModLogService;
        try {
            const modServices = require('../../services/moderation');
            ModLogService = modServices.modLogService;
        }
        catch {
            return;
        }
        const channelId = interaction.values[0] || null;
        await ModLogService.setLogChannel(interaction.guildId, channelId);
        await interaction.reply({
            content: channelId
                ? `✅ Mod log channel set to <#${channelId}>`
                : '✅ Mod log channel has been disabled',
            ephemeral: true
        });
    }
    async _handleAnnounceChannel(interaction) {
        let GuildSettingsService;
        try {
            const services = require('../../services');
            GuildSettingsService = services.GuildSettingsService;
        }
        catch {
            return;
        }
        const channelId = interaction.values[0] || null;
        await GuildSettingsService.updateGuildSettings(interaction.guildId, {
            announcement_channel: channelId
        });
        await interaction.reply({
            content: channelId
                ? `✅ Announcement channel set to <#${channelId}>`
                : '✅ Announcement channel has been cleared',
            ephemeral: true
        });
    }
    async _handleAdminRoles(interaction) {
        let GuildSettingsService;
        try {
            const services = require('../../services');
            GuildSettingsService = services.GuildSettingsService;
        }
        catch {
            return;
        }
        const newRoles = interaction.values;
        await GuildSettingsService.setAdminRoles(interaction.guildId, newRoles);
        await interaction.reply({
            content: newRoles.length
                ? `✅ Admin roles updated: ${newRoles.map(r => `<@&${r}>`).join(', ')}`
                : '✅ Admin roles cleared',
            ephemeral: true
        });
    }
    async _handleModRoles(interaction) {
        let GuildSettingsService;
        try {
            const services = require('../../services');
            GuildSettingsService = services.GuildSettingsService;
        }
        catch {
            return;
        }
        const newRoles = interaction.values;
        await GuildSettingsService.setModRoles(interaction.guildId, newRoles);
        await interaction.reply({
            content: newRoles.length
                ? `✅ Mod roles updated: ${newRoles.map(r => `<@&${r}>`).join(', ')}`
                : '✅ Mod roles cleared',
            ephemeral: true
        });
    }
}
exports.default = new SettingCommand();
//# sourceMappingURL=setting.js.map