/**
 * Setting Command - Presentation Layer
 * Server owner settings configuration
 * @module presentation/commands/admin/setting
 */

const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');
const { BaseCommand, CommandCategory } = require('../BaseCommand');
const { COLORS } = require('../../utils/constants');

class SettingCommand extends BaseCommand {
    constructor() {
        super({
            category: CommandCategory.ADMIN,
            cooldown: 5,
            deferReply: false, // Handle deferral manually for different subcommands
            requiredPermissions: [PermissionFlagsBits.Administrator]
        });
    }

    get data() {
        return new SlashCommandBuilder()
            .setName('setting')
            .setDescription('Configure server settings (Server Owner only)')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addSubcommand(sub =>
                sub.setName('view')
                    .setDescription('View current server settings'))
            .addSubcommand(sub =>
                sub.setName('snipe')
                    .setDescription('Configure snipe message limit')
                    .addIntegerOption(opt =>
                        opt.setName('limit')
                            .setDescription('Number of deleted messages to track (1-50)')
                            .setRequired(true)
                            .setMinValue(1)
                            .setMaxValue(50)))
            .addSubcommand(sub =>
                sub.setName('delete_limit')
                    .setDescription('Configure maximum messages that can be deleted at once')
                    .addIntegerOption(opt =>
                        opt.setName('limit')
                            .setDescription('Maximum messages to delete (1-500)')
                            .setRequired(true)
                            .setMinValue(1)
                            .setMaxValue(500)))
            .addSubcommand(sub =>
                sub.setName('announcement')
                    .setDescription('Set the announcement channel')
                    .addChannelOption(opt =>
                        opt.setName('channel')
                            .setDescription('Channel for bot announcements (leave empty to disable)')
                            .addChannelTypes(ChannelType.GuildText)))
            .addSubcommand(sub =>
                sub.setName('log')
                    .setDescription('Set the moderation log channel')
                    .addChannelOption(opt =>
                        opt.setName('channel')
                            .setDescription('Channel for moderation logs (leave empty to disable)')
                            .addChannelTypes(ChannelType.GuildText)))
            .addSubcommand(sub =>
                sub.setName('adminrole')
                    .setDescription('Manage admin roles')
                    .addStringOption(opt =>
                        opt.setName('action')
                            .setDescription('Add or remove role')
                            .setRequired(true)
                            .addChoices(
                                { name: 'Add', value: 'add' },
                                { name: 'Remove', value: 'remove' }
                            ))
                    .addRoleOption(opt =>
                        opt.setName('role')
                            .setDescription('Role to add/remove')
                            .setRequired(true)))
            .addSubcommand(sub =>
                sub.setName('modrole')
                    .setDescription('Manage moderator roles')
                    .addStringOption(opt =>
                        opt.setName('action')
                            .setDescription('Add or remove role')
                            .setRequired(true)
                            .addChoices(
                                { name: 'Add', value: 'add' },
                                { name: 'Remove', value: 'remove' }
                            ))
                    .addRoleOption(opt =>
                        opt.setName('role')
                            .setDescription('Role to add/remove')
                            .setRequired(true)))
            .addSubcommand(sub =>
                sub.setName('reset')
                    .setDescription('Reset all settings to default'));
    }

    async run(interaction) {
        // Server owner check
        try {
            const { GuildSettingsService } = require('../../../services');
            if (!GuildSettingsService.isServerOwner(interaction.member)) {
                return interaction.reply({
                    content: '❌ Only the server owner can use this command.',
                    ephemeral: true
                });
            }
        } catch {
            // Fallback to basic owner check
            if (interaction.user.id !== interaction.guild.ownerId) {
                return interaction.reply({
                    content: '❌ Only the server owner can use this command.',
                    ephemeral: true
                });
            }
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'view': return await this._handleView(interaction);
                case 'snipe': return await this._handleSnipe(interaction);
                case 'delete_limit': return await this._handleDeleteLimit(interaction);
                case 'announcement': return await this._handleAnnouncement(interaction);
                case 'log': return await this._handleLog(interaction);
                case 'adminrole': return await this._handleAdminRole(interaction);
                case 'modrole': return await this._handleModRole(interaction);
                case 'reset': return await this._handleReset(interaction);
                default:
                    return interaction.reply({ content: '❌ Unknown subcommand.', ephemeral: true });
            }
        } catch (error) {
            console.error('[/setting] Error:', error);
            const errorMsg = { content: '❌ An error occurred while processing the command.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                return interaction.followUp(errorMsg);
            }
            return interaction.reply(errorMsg);
        }
    }

    async _handleView(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const { GuildSettingsService } = require('../../../services');
        
        const settings = await GuildSettingsService.getGuildSettings(interaction.guild.id);
        const snipeLimit = await GuildSettingsService.getSnipeLimit(interaction.guild.id);
        const deleteLimit = await GuildSettingsService.getDeleteLimit(interaction.guild.id);
        const adminRoles = await GuildSettingsService.getAdminRoles(interaction.guild.id);
        const modRoles = await GuildSettingsService.getModRoles(interaction.guild.id);

        const adminRolesMention = adminRoles.length > 0 
            ? adminRoles.map(id => `<@&${id}>`).join(', ')
            : '*None configured*';
        
        const modRolesMention = modRoles.length > 0 
            ? modRoles.map(id => `<@&${id}>`).join(', ')
            : '*None configured*';

        const embed = new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle('⚙️ Server Settings')
            .setDescription(`Settings for **${interaction.guild.name}**`)
            .addFields(
                { name: '📝 Snipe Limit', value: `${snipeLimit} messages`, inline: true },
                { name: '🗑️ Delete Limit', value: `${deleteLimit} messages`, inline: true },
                { name: '📋 Log Channel', value: settings.log_channel ? `<#${settings.log_channel}>` : '*Not set*', inline: true },
                { name: '🔨 Mod Log Channel', value: settings.mod_log_channel ? `<#${settings.mod_log_channel}>` : '*Not set*', inline: true },
                { name: '👑 Admin Roles', value: adminRolesMention },
                { name: '🛡️ Moderator Roles', value: modRolesMention }
            )
            .setFooter({ text: 'Use /setting <option> to change settings' })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }

    async _handleSnipe(interaction) {
        const { GuildSettingsService } = require('../../../services');
        
        const limit = interaction.options.getInteger('limit');
        await GuildSettingsService.setSnipeLimit(interaction.guild.id, limit);

        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('✅ Snipe Limit Updated')
            .setDescription(`The bot will now track the last **${limit}** deleted messages.`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async _handleDeleteLimit(interaction) {
        const { GuildSettingsService } = require('../../../services');
        
        const limit = interaction.options.getInteger('limit');
        await GuildSettingsService.setDeleteLimit(interaction.guild.id, limit);

        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('✅ Delete Limit Updated')
            .setDescription(`Moderators can now delete up to **${limit}** messages at once using \`/delete\`.`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async _handleAnnouncement(interaction) {
        const { GuildSettingsService } = require('../../../services');
        
        const channel = interaction.options.getChannel('channel');
        const channelId = channel?.id || null;

        await GuildSettingsService.updateSetting(interaction.guild.id, 'announcement_channel', channelId);

        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTimestamp();

        if (channelId) {
            embed.setTitle('✅ Announcement Channel Set')
                .setDescription(`Bot announcements will be sent to <#${channelId}>`);
        } else {
            embed.setTitle('✅ Announcement Channel Disabled')
                .setDescription('Bot announcements have been disabled for this server.');
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async _handleLog(interaction) {
        const { GuildSettingsService } = require('../../../services');
        
        const channel = interaction.options.getChannel('channel');
        const channelId = channel?.id || null;

        await GuildSettingsService.setLogChannel(interaction.guild.id, channelId);

        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTimestamp();

        if (channelId) {
            embed.setTitle('✅ Log Channel Set')
                .setDescription(`Moderation logs will be sent to <#${channelId}>`);
        } else {
            embed.setTitle('✅ Log Channel Disabled')
                .setDescription('Moderation logging has been disabled for this server.');
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async _handleAdminRole(interaction) {
        const { GuildSettingsService } = require('../../../services');
        
        const action = interaction.options.getString('action');
        const role = interaction.options.getRole('role');

        // Prevent @everyone or managed roles
        if (role.id === interaction.guild.id || role.managed) {
            return interaction.reply({ content: '❌ You cannot use this role.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTimestamp();

        if (action === 'add') {
            await GuildSettingsService.addAdminRole(interaction.guild.id, role.id);
            embed.setTitle('✅ Admin Role Added')
                .setDescription(`<@&${role.id}> can now use admin commands.`);
        } else {
            await GuildSettingsService.removeAdminRole(interaction.guild.id, role.id);
            embed.setTitle('✅ Admin Role Removed')
                .setDescription(`<@&${role.id}> can no longer use admin commands.`);
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async _handleModRole(interaction) {
        const { GuildSettingsService } = require('../../../services');
        
        const action = interaction.options.getString('action');
        const role = interaction.options.getRole('role');

        // Prevent @everyone or managed roles
        if (role.id === interaction.guild.id || role.managed) {
            return interaction.reply({ content: '❌ You cannot use this role.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTimestamp();

        if (action === 'add') {
            await GuildSettingsService.addModRole(interaction.guild.id, role.id);
            embed.setTitle('✅ Moderator Role Added')
                .setDescription(`<@&${role.id}> can now use moderation commands.`);
        } else {
            await GuildSettingsService.removeModRole(interaction.guild.id, role.id);
            embed.setTitle('✅ Moderator Role Removed')
                .setDescription(`<@&${role.id}> can no longer use moderation commands.`);
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async _handleReset(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('setting_reset_confirm')
                    .setLabel('Confirm Reset')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('setting_reset_cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        const embed = new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle('⚠️ Reset Settings')
            .setDescription('Are you sure you want to reset all settings to default?\n\nThis will clear:\n• Admin roles\n• Moderator roles\n• Announcement channel\n• Log channel\n• Snipe limit (reset to 10)')
            .setTimestamp();

        const response = await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });

        try {
            const buttonInteraction = await response.awaitMessageComponent({
                filter: i => i.user.id === interaction.user.id,
                time: 30000
            });

            if (buttonInteraction.customId === 'setting_reset_confirm') {
                const { GuildSettingsService } = require('../../../services');
                
                // Reset all settings
                await GuildSettingsService.updateGuildSettings(interaction.guild.id, {
                    log_channel: null,
                    mod_log_channel: null,
                    mute_role: null,
                    settings: {
                        snipe_limit: 10,
                        delete_limit: 100,
                        announcement_channel: null,
                        admin_roles: [],
                        mod_roles: []
                    }
                });
                GuildSettingsService.clearCache(interaction.guild.id);

                const successEmbed = new EmbedBuilder()
                    .setColor(COLORS.SUCCESS)
                    .setTitle('✅ Settings Reset')
                    .setDescription('All settings have been reset to default.')
                    .setTimestamp();

                await buttonInteraction.update({ embeds: [successEmbed], components: [] });
            } else {
                const cancelEmbed = new EmbedBuilder()
                    .setColor(COLORS.INFO)
                    .setTitle('❌ Reset Cancelled')
                    .setDescription('Settings were not changed.')
                    .setTimestamp();

                await buttonInteraction.update({ embeds: [cancelEmbed], components: [] });
            }
        } catch (error) {
            const timeoutEmbed = new EmbedBuilder()
                .setColor(COLORS.ERROR)
                .setTitle('⏰ Timeout')
                .setDescription('Reset cancelled due to timeout.')
                .setTimestamp();

            await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        }
    }
}

module.exports = new SettingCommand();



