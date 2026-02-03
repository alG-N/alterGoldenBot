"use strict";
/**
 * Report Command - Presentation Layer
 * Submit reports to bot developers
 * @module presentation/commands/general/report
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleModal = handleModal;
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const constants_js_1 = require("../../constants.js");
// Helper to get default export from require()
const getDefault = (mod) => mod.default || mod;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const logger = getDefault(require('../../core/Logger'));
class ReportCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.GENERAL,
            cooldown: 60,
            deferReply: false
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('report')
            .setDescription('Report a bug or issue to the developers');
    }
    async run(interaction) {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId(`report_submit_${interaction.user.id}`)
            .setTitle('📝 Bug Report');
        const titleInput = new discord_js_1.TextInputBuilder()
            .setCustomId('report_title')
            .setLabel('Title')
            .setPlaceholder('Brief description of the issue')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);
        const descriptionInput = new discord_js_1.TextInputBuilder()
            .setCustomId('report_description')
            .setLabel('Description')
            .setPlaceholder('Detailed description of the bug or issue')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(2000);
        const stepsInput = new discord_js_1.TextInputBuilder()
            .setCustomId('report_steps')
            .setLabel('Steps to Reproduce (Optional)')
            .setPlaceholder('1. Go to...\n2. Click on...\n3. See error')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(1000);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(titleInput), new discord_js_1.ActionRowBuilder().addComponents(descriptionInput), new discord_js_1.ActionRowBuilder().addComponents(stepsInput));
        await interaction.showModal(modal);
    }
}
/**
 * Handle modal submission
 * This is called from InteractionHandler
 */
async function handleModal(interaction) {
    const title = interaction.fields.getTextInputValue('report_title');
    const description = interaction.fields.getTextInputValue('report_description');
    const steps = interaction.fields.getTextInputValue('report_steps') || 'Not provided';
    // Get report channel from config
    let reportChannelId = null;
    try {
        const { REPORT_CHANNEL_ID } = await import('../../config/owner.js');
        reportChannelId = REPORT_CHANNEL_ID;
    }
    catch {
        reportChannelId = null;
    }
    const reportEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(`🐛 Bug Report: ${title}`)
        .setColor(constants_js_1.COLORS.ERROR)
        .addFields({ name: '👤 Reporter', value: `${interaction.user.tag}\n\`${interaction.user.id}\``, inline: true }, { name: '🏠 Server', value: interaction.guild?.name || 'DM', inline: true }, { name: '📅 Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }, { name: '📝 Description', value: description.substring(0, 1024), inline: false })
        .setTimestamp()
        .setFooter({ text: `Report ID: ${Date.now().toString(36)}` });
    if (steps !== 'Not provided') {
        reportEmbed.addFields({
            name: '📋 Steps to Reproduce',
            value: steps.substring(0, 1024),
            inline: false
        });
    }
    // Send to report channel if configured
    let sentToChannel = false;
    if (reportChannelId) {
        try {
            const reportChannel = await interaction.client.channels.fetch(reportChannelId);
            if (reportChannel && reportChannel.isTextBased()) {
                await reportChannel.send({ embeds: [reportEmbed] });
                sentToChannel = true;
            }
        }
        catch (error) {
            const err = error;
            logger.error('Report', `Failed to send to channel: ${err.message}`);
        }
    }
    // Confirm to user
    const confirmEmbed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Report Submitted')
        .setDescription(sentToChannel
        ? 'Thank you for your report! Our team will review it shortly.'
        : 'Your report has been logged. Thank you!')
        .setColor(constants_js_1.COLORS.SUCCESS)
        .setTimestamp();
    await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
}
const command = new ReportCommand();
exports.default = command;
//# sourceMappingURL=report.js.map