"use strict";
/**
 * Invite Command - Presentation Layer
 * Generate bot invite link
 * @module presentation/commands/general/invite
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const constants_js_1 = require("../../constants.js");
class InviteCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.GENERAL,
            cooldown: 10,
            deferReply: false,
            ephemeral: true
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('invite')
            .setDescription('Invite the bot to your server');
    }
    async run(interaction) {
        // Get client ID
        let clientId;
        try {
            const { bot } = await import('../../config/index.js');
            clientId = bot.clientId || interaction.client.user?.id || '';
        }
        catch {
            clientId = interaction.client.user?.id || '';
        }
        // Generate invite URLs with different permission sets
        const fullInvite = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot+applications.commands`;
        const musicInvite = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=36768832&integration_type=0&scope=bot+applications.commands`;
        const basicInvite = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=274878024704&integration_type=0&scope=bot+applications.commands`;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(constants_js_1.COLORS.PRIMARY)
            .setTitle('🤖 Invite alterGolden')
            .setDescription('Choose an invite option based on your needs:')
            .setThumbnail(interaction.client.user?.displayAvatarURL({ size: 256 }) || null)
            .addFields({
            name: '👑 Full Access',
            value: 'Administrator permissions - All features enabled',
            inline: false
        }, {
            name: '🎵 Music Only',
            value: 'Voice, embed, and message permissions',
            inline: false
        }, {
            name: '📋 Basic',
            value: 'Minimal permissions for utility commands',
            inline: false
        })
            .setFooter({ text: 'Thank you for using alterGolden! 💖' })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setLabel('Full Access')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(fullInvite)
            .setEmoji('👑'), new discord_js_1.ButtonBuilder()
            .setLabel('Music Only')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(musicInvite)
            .setEmoji('🎵'), new discord_js_1.ButtonBuilder()
            .setLabel('Basic')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(basicInvite)
            .setEmoji('📋'));
        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }
}
exports.default = new InviteCommand();
//# sourceMappingURL=invite.js.map