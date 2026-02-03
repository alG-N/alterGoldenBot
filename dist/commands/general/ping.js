"use strict";
/**
 * Ping Command - Presentation Layer
 * Check bot latency and status
 * @module commands/general/ping
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_1 = require("../BaseCommand");
const constants_1 = require("../../constants");
class PingCommand extends BaseCommand_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_1.CommandCategory.GENERAL,
            cooldown: 3,
            deferReply: false
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('ping')
            .setDescription('Check bot latency and status');
    }
    async run(interaction) {
        // Calculate latency
        const response = await interaction.reply({ content: 'Pinging...', withResponse: true });
        const sent = response?.resource?.message || await interaction.fetchReply();
        const latency = Math.abs(sent.createdTimestamp - interaction.createdTimestamp);
        const apiLatency = Math.round(interaction.client.ws.ping);
        // Calculate uptime
        const uptime = Math.floor((interaction.client.uptime || 0) / 1000);
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        const uptimeString = [
            days ? `${days}d` : '',
            hours ? `${hours}h` : '',
            minutes ? `${minutes}m` : '',
            seconds ? `${seconds}s` : ''
        ].filter(Boolean).join(' ') || '0s';
        // Determine latency status
        let status;
        let statusColor;
        if (latency < 100) {
            status = '🟢 Excellent';
            statusColor = constants_1.COLORS.SUCCESS;
        }
        else if (latency < 200) {
            status = '🟡 Good';
            statusColor = constants_1.COLORS.WARNING;
        }
        else {
            status = '🔴 High';
            statusColor = constants_1.COLORS.ERROR;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(statusColor)
            .setTitle('🏓 Pong!')
            .addFields({ name: '📡 Latency', value: `\`${latency}ms\``, inline: true }, { name: '🌐 API', value: `\`${apiLatency}ms\``, inline: true }, { name: '📊 Status', value: status, inline: true }, { name: '⏱️ Uptime', value: `\`${uptimeString}\``, inline: true }, { name: '🏠 Servers', value: `\`${interaction.client.guilds.cache.size}\``, inline: true }, { name: '👥 Users', value: `\`${interaction.client.users.cache.size}\``, inline: true })
            .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        })
            .setTimestamp();
        await interaction.editReply({ content: '', embeds: [embed] });
    }
}
// Export singleton instance
const pingCommand = new PingCommand();
exports.default = pingCommand;
// CommonJS compatibility
module.exports = pingCommand;
//# sourceMappingURL=ping.js.map