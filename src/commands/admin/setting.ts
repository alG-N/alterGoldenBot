/**
 * Setting Command - Simplified Server Settings
 * All settings are managed through /setting view with interactive components
 * @module commands/admin/setting
 */

import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ChannelType,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChatInputCommandInteraction,
    StringSelectMenuInteraction,
    ChannelSelectMenuInteraction,
    RoleSelectMenuInteraction,
    Message
} from 'discord.js';
import { BaseCommand, CommandCategory, type CommandData } from '../BaseCommand.js';
import { COLORS } from '../../constants.js';

interface GuildSettings {
    announcements_enabled?: boolean;
    announcement_channel?: string | null;
}

interface AutoModSettings {
    enabled: boolean;
    spam_enabled?: boolean;
    duplicate_enabled?: boolean;
    links_enabled?: boolean;
    invites_enabled?: boolean;
    mention_enabled?: boolean;
    caps_enabled?: boolean;
    filter_enabled?: boolean;
}

interface LockdownStatus {
    lockedCount: number;
}

interface RaidStatus {
    active: boolean;
}

interface ModLogSettings {
    log_channel_id?: string | null;
}

interface GuildSettingsService {
    getGuildSettings: (guildId: string) => Promise<GuildSettings>;
    getSnipeLimit: (guildId: string) => Promise<number>;
    getDeleteLimit: (guildId: string) => Promise<number>;
    getAdminRoles: (guildId: string) => Promise<string[]>;
    getModRoles: (guildId: string) => Promise<string[]>;
    resetGuildSettings: (guildId: string) => Promise<void>;
    updateGuildSettings: (guildId: string, settings: Partial<GuildSettings>) => Promise<void>;
    setSnipeLimit: (guildId: string, limit: number) => Promise<void>;
    setDeleteLimit: (guildId: string, limit: number) => Promise<void>;
    setAdminRoles: (guildId: string, roles: string[]) => Promise<void>;
    setModRoles: (guildId: string, roles: string[]) => Promise<void>;
}

interface AutoModServiceType {
    getSettings: (guildId: string) => Promise<AutoModSettings>;
}

interface LockdownServiceType {
    getLockStatus: (guildId: string) => LockdownStatus;
}

interface AntiRaidServiceType {
    getRaidModeState: (guildId: string) => RaidStatus | null;
}

interface ModLogServiceType {
    getSettings: (guildId: string) => Promise<ModLogSettings | null>;
    setLogChannel: (guildId: string, channelId: string | null) => Promise<void>;
}

class SettingCommand extends BaseCommand {
    constructor() {
        super({
            category: CommandCategory.ADMIN,
            cooldown: 5,
            deferReply: false,
            userPermissions: [PermissionFlagsBits.Administrator]
        });
    }

    get data(): CommandData {
        return new SlashCommandBuilder()
            .setName('setting')
            .setDescription('Configure server settings (Server Owner only)')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
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
    private async _showMainPanel(interaction: ChatInputCommandInteraction, isUpdate = false): Promise<void> {
        let GuildSettingsService: GuildSettingsService | undefined;
        let AutoModService: AutoModServiceType | undefined;
        let LockdownService: LockdownServiceType | undefined;
        let AntiRaidService: AntiRaidServiceType | undefined;
        let ModLogService: ModLogServiceType | undefined;
        
        try {
            const services = require('../../services');
            GuildSettingsService = services.GuildSettingsService;
            const modServices = require('../../services/moderation');
            AutoModService = modServices.AutoModService;
            LockdownService = modServices.LockdownService;
            AntiRaidService = modServices.AntiRaidService;
            ModLogService = modServices.ModLogService;
        } catch {
            await interaction.reply({
                content: '❌ Settings service unavailable.',
                ephemeral: true
            });
            return;
        }

        const guildId = interaction.guildId!;
        const settings = await GuildSettingsService!.getGuildSettings(guildId);
        const snipeLimit = await GuildSettingsService!.getSnipeLimit(guildId);
        const deleteLimit = await GuildSettingsService!.getDeleteLimit(guildId);
        const adminRoles = await GuildSettingsService!.getAdminRoles(guildId);
        const modRoles = await GuildSettingsService!.getModRoles(guildId);

        // Get mod log channel from ModLogService
        let modLogChannel: string | null = null;
        try {
            const modLogSettings = await ModLogService?.getSettings(guildId);
            modLogChannel = modLogSettings?.log_channel_id || null;
        } catch {}

        // Get moderation status
        let automodSettings: AutoModSettings = { enabled: false };
        let lockdownStatus: LockdownStatus = { lockedCount: 0 };
        let raidStatus: RaidStatus | null = null;
        
        try { automodSettings = await AutoModService!.getSettings(guildId); } catch {}
        try { lockdownStatus = LockdownService!.getLockStatus(guildId); } catch {}
        try { raidStatus = AntiRaidService!.getRaidModeState(guildId); } catch {}

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

        const embed = new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle('⚙️ Server Settings')
            .setDescription(`Settings for **${interaction.guild!.name}**\nClick buttons or use select menus to configure.`)
            .addFields(
                { name: '📝 Snipe Limit', value: `\`${snipeLimit}\``, inline: true },
                { name: '🗑️ Delete Limit', value: `\`${deleteLimit}\``, inline: true },
                { name: '📋 Mod Log', value: modLogChannel ? `<#${modLogChannel}>` : '*Not set*', inline: true },
                { name: '👑 Admin Roles', value: adminRolesMention, inline: true },
                { name: '🛡️ Mod Roles', value: modRolesMention, inline: true },
                { name: '📢 Announce', value: announceStatus, inline: true },
                { name: '─────────────', value: '**🔧 Moderation Status**', inline: false },
                { name: '🤖 AutoMod', value: automodStatus, inline: true },
                { name: '🔒 Lockdown', value: lockdownStatus.lockedCount > 0 ? `🔒 Active (${lockdownStatus.lockedCount})` : '🔓 Inactive', inline: true },
                { name: '🛡️ Raid Mode', value: raidStatus?.active ? '🛡️ Active' : '🛡️ Inactive', inline: true }
            )
            .setFooter({ text: 'Use /automod for detailed automod settings • /modlogs for log toggles' })
            .setTimestamp();

        // Settings select menu
        const settingsMenu = new StringSelectMenuBuilder()
            .setCustomId('setting_menu')
            .setPlaceholder('📝 Quick Edit Setting...')
            .addOptions([
                { label: 'Snipe Limit', value: 'snipe', emoji: '📝', description: 'Messages to track for snipe' },
                { label: 'Delete Limit', value: 'delete', emoji: '🗑️', description: 'Max messages per delete' },
                { label: 'Toggle Announcements', value: 'toggle_announce', emoji: '📢', description: announceEnabled ? 'Currently: Enabled' : 'Currently: Disabled' },
                { label: 'Reset All', value: 'reset', emoji: '🔄', description: 'Reset to defaults' }
            ]);

        // Channel select for mod log
        const channelMenu = new ChannelSelectMenuBuilder()
            .setCustomId('setting_modlog_channel')
            .setPlaceholder('📋 Set Mod Log Channel...')
            .setChannelTypes(ChannelType.GuildText)
            .setMinValues(0)
            .setMaxValues(1);

        // Channel select for announcement
        const announceChannelMenu = new ChannelSelectMenuBuilder()
            .setCustomId('setting_announce_channel')
            .setPlaceholder('📢 Set Announcement Channel...')
            .setChannelTypes(ChannelType.GuildText)
            .setMinValues(0)
            .setMaxValues(1);

        // Role menus
        const adminRoleMenu = new RoleSelectMenuBuilder()
            .setCustomId('setting_admin_role')
            .setPlaceholder('👑 Add/Remove Admin Role...')
            .setMinValues(0)
            .setMaxValues(5);

        const modRoleMenu = new RoleSelectMenuBuilder()
            .setCustomId('setting_mod_role')
            .setPlaceholder('🛡️ Add/Remove Mod Role...')
            .setMinValues(0)
            .setMaxValues(5);

        const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(settingsMenu);
        const row2 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu);
        const row3 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(announceChannelMenu);
        const row4 = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(adminRoleMenu);
        const row5 = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(modRoleMenu);

        const messageOptions = { 
            embeds: [embed], 
            components: [row1, row2, row3, row4, row5],
            ephemeral: true as const
        };

        const response = await interaction.reply({ ...messageOptions, fetchReply: true }) as Message;

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
                    await this._handleSettingMenu(i as StringSelectMenuInteraction, (i as StringSelectMenuInteraction).values[0]);
                } else if (i.customId === 'setting_modlog_channel') {
                    await this._handleModLogChannel(i as ChannelSelectMenuInteraction);
                } else if (i.customId === 'setting_announce_channel') {
                    await this._handleAnnounceChannel(i as ChannelSelectMenuInteraction);
                } else if (i.customId === 'setting_admin_role') {
                    await this._handleAdminRoles(i as RoleSelectMenuInteraction);
                } else if (i.customId === 'setting_mod_role') {
                    await this._handleModRoles(i as RoleSelectMenuInteraction);
                }
            } catch (error: unknown) {
                const err = error as { code?: number };
                if (err.code === 10062) return; // Unknown interaction
                console.error('[Setting] Error:', error);
                if (!i.replied && !i.deferred) {
                    await i.reply({ content: '❌ An error occurred.', ephemeral: true }).catch(() => {});
                }
            }
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply({ components: [] }).catch(() => {});
            } catch {}
        });
    }

    private async _handleSettingMenu(interaction: StringSelectMenuInteraction, value: string): Promise<void> {
        let GuildSettingsService: GuildSettingsService | undefined;
        try {
            const services = require('../../services');
            GuildSettingsService = services.GuildSettingsService;
        } catch {
            return;
        }

        const guildId = interaction.guildId!;

        if (value === 'reset') {
            await GuildSettingsService!.resetGuildSettings(guildId);
            await interaction.update({
                content: '✅ All settings have been reset to defaults!',
                embeds: [],
                components: []
            });
            return;
        }

        if (value === 'toggle_announce') {
            const settings = await GuildSettingsService!.getGuildSettings(guildId);
            const currentEnabled = settings.announcements_enabled !== false;
            await GuildSettingsService!.updateGuildSettings(guildId, { 
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
        const modal = new ModalBuilder()
            .setCustomId(`setting_modal_${value}`)
            .setTitle(value === 'snipe' ? 'Set Snipe Limit' : 'Set Delete Limit');

        const input = new TextInputBuilder()
            .setCustomId('value')
            .setLabel(value === 'snipe' ? 'Snipe Limit (1-50)' : 'Delete Limit (1-500)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(3);

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
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
                await GuildSettingsService!.setSnipeLimit(guildId, newValue);
            } else {
                if (newValue < 1 || newValue > 500) {
                    await modalSubmit.reply({ content: '❌ Delete limit must be 1-500!', ephemeral: true });
                    return;
                }
                await GuildSettingsService!.setDeleteLimit(guildId, newValue);
            }

            await modalSubmit.reply({ 
                content: `✅ ${value === 'snipe' ? 'Snipe' : 'Delete'} limit set to **${newValue}**!`, 
                ephemeral: true 
            });
        } catch {
            // Modal timeout - ignore
        }
    }

    private async _handleModLogChannel(interaction: ChannelSelectMenuInteraction): Promise<void> {
        let ModLogService: ModLogServiceType | undefined;
        try {
            const modServices = require('../../services/moderation');
            ModLogService = modServices.ModLogService;
        } catch {
            return;
        }

        const channelId = interaction.values[0] || null;
        
        await ModLogService!.setLogChannel(interaction.guildId!, channelId);
        
        await interaction.reply({
            content: channelId 
                ? `✅ Mod log channel set to <#${channelId}>` 
                : '✅ Mod log channel has been disabled',
            ephemeral: true
        });
    }

    private async _handleAnnounceChannel(interaction: ChannelSelectMenuInteraction): Promise<void> {
        let GuildSettingsService: GuildSettingsService | undefined;
        try {
            const services = require('../../services');
            GuildSettingsService = services.GuildSettingsService;
        } catch {
            return;
        }

        const channelId = interaction.values[0] || null;
        
        await GuildSettingsService!.updateGuildSettings(interaction.guildId!, { 
            announcement_channel: channelId 
        });
        
        await interaction.reply({
            content: channelId 
                ? `✅ Announcement channel set to <#${channelId}>` 
                : '✅ Announcement channel has been cleared',
            ephemeral: true
        });
    }

    private async _handleAdminRoles(interaction: RoleSelectMenuInteraction): Promise<void> {
        let GuildSettingsService: GuildSettingsService | undefined;
        try {
            const services = require('../../services');
            GuildSettingsService = services.GuildSettingsService;
        } catch {
            return;
        }

        const newRoles = interaction.values;
        
        await GuildSettingsService!.setAdminRoles(interaction.guildId!, newRoles);
        
        await interaction.reply({
            content: newRoles.length 
                ? `✅ Admin roles updated: ${newRoles.map(r => `<@&${r}>`).join(', ')}` 
                : '✅ Admin roles cleared',
            ephemeral: true
        });
    }

    private async _handleModRoles(interaction: RoleSelectMenuInteraction): Promise<void> {
        let GuildSettingsService: GuildSettingsService | undefined;
        try {
            const services = require('../../services');
            GuildSettingsService = services.GuildSettingsService;
        } catch {
            return;
        }

        const newRoles = interaction.values;
        
        await GuildSettingsService!.setModRoles(interaction.guildId!, newRoles);
        
        await interaction.reply({
            content: newRoles.length 
                ? `✅ Mod roles updated: ${newRoles.map(r => `<@&${r}>`).join(', ')}` 
                : '✅ Mod roles cleared',
            ephemeral: true
        });
    }
}

export default new SettingCommand();
