"use strict";
/**
 * Server Info Command - Presentation Layer
 * Display server information
 * @module commands/general/serverinfo
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_1 = require("../BaseCommand");
const constants_1 = require("../../constants");
class ServerInfoCommand extends BaseCommand_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_1.CommandCategory.GENERAL,
            cooldown: 5,
            deferReply: true
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('serverinfo')
            .setDescription('Display information about the server');
    }
    async run(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await this.errorReply(interaction, 'This command can only be used in a server.');
            return;
        }
        // Fetch owner
        const owner = await guild.fetchOwner().catch(() => null);
        // Channel counts
        const channels = guild.channels.cache;
        const textChannels = channels.filter(c => c.type === discord_js_1.ChannelType.GuildText).size;
        const voiceChannels = channels.filter(c => c.type === discord_js_1.ChannelType.GuildVoice).size;
        const categories = channels.filter(c => c.type === discord_js_1.ChannelType.GuildCategory).size;
        const threads = channels.filter(c => c.type === discord_js_1.ChannelType.PublicThread ||
            c.type === discord_js_1.ChannelType.PrivateThread).size;
        // Member counts  
        const members = guild.members.cache;
        const humans = members.filter(m => !m.user.bot).size;
        const bots = members.filter(m => m.user.bot).size;
        const online = members.filter(m => m.presence?.status === 'online').size;
        // Roles
        const roles = guild.roles.cache;
        const topRole = roles.sort((a, b) => b.position - a.position).first();
        // Boost info
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount || 0;
        const boostEmoji = ['🔰', '🚀', '🚀🚀', '🚀🚀🚀'][boostLevel] || '🔰';
        // Verification levels
        const verificationLevels = {
            [discord_js_1.GuildVerificationLevel.None]: 'None',
            [discord_js_1.GuildVerificationLevel.Low]: 'Low',
            [discord_js_1.GuildVerificationLevel.Medium]: 'Medium',
            [discord_js_1.GuildVerificationLevel.High]: 'High',
            [discord_js_1.GuildVerificationLevel.VeryHigh]: 'Very High'
        };
        // Content filter levels
        const contentFilterLevels = {
            [discord_js_1.GuildExplicitContentFilter.Disabled]: 'Disabled',
            [discord_js_1.GuildExplicitContentFilter.MembersWithoutRoles]: 'Members without roles',
            [discord_js_1.GuildExplicitContentFilter.AllMembers]: 'All members'
        };
        // Format date
        const createdAt = guild.createdAt;
        const createdTimestamp = Math.floor(createdAt.getTime() / 1000);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`✨ ${guild.name}`)
            .setColor(constants_1.COLORS.INFO)
            .setThumbnail(guild.iconURL({ size: 1024, forceStatic: false }))
            .setDescription(guild.description || '*No description set*')
            .addFields(
        // General Info
        { name: '👑 Owner', value: owner ? `<@${owner.id}>` : 'Unknown', inline: true }, { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true }, { name: '📅 Created', value: `<t:${createdTimestamp}:R>`, inline: true }, 
        // Members
        { name: '👥 Members', value: `Total: **${guild.memberCount}**\nHumans: ${humans}\nBots: ${bots}`, inline: true }, { name: '🟢 Online', value: `${online} members`, inline: true }, { name: '📜 Roles', value: `${roles.size} roles\nTop: ${topRole?.name || 'None'}`, inline: true }, 
        // Channels
        { name: '💬 Channels', value: `Text: ${textChannels}\nVoice: ${voiceChannels}\nCategories: ${categories}`, inline: true }, { name: '🧵 Threads', value: `${threads}`, inline: true }, { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true }, 
        // Server settings
        { name: '🔐 Verification', value: verificationLevels[guild.verificationLevel] || 'Unknown', inline: true }, { name: '🚫 Content Filter', value: contentFilterLevels[guild.explicitContentFilter] || 'Unknown', inline: true }, { name: `${boostEmoji} Boost`, value: `Level ${boostLevel} (${boostCount} boosts)`, inline: true })
            .setTimestamp()
            .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        });
        // Add banner if exists
        if (guild.banner) {
            const bannerURL = guild.bannerURL({ size: 1024 });
            if (bannerURL) {
                embed.setImage(bannerURL);
            }
        }
        await this.safeReply(interaction, { embeds: [embed] });
    }
}
// Export singleton instance
const serverInfoCommand = new ServerInfoCommand();
exports.default = serverInfoCommand;
// CommonJS compatibility
module.exports = serverInfoCommand;
//# sourceMappingURL=serverinfo.js.map