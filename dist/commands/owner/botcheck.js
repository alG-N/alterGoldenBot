"use strict";
/**
 * BotCheck Command - Presentation Layer
 * Bot health and status dashboard for owners only
 * @module presentation/commands/owner/botcheck
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const os_1 = __importDefault(require("os"));
const BaseCommand_js_1 = require("../BaseCommand.js");
const constants_js_1 = require("../../constants.js");
const owner_js_1 = require("../../config/owner.js");
const time_js_1 = require("../../utils/common/time.js");
class BotCheckCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.OWNER,
            cooldown: 10,
            deferReply: true,
            ephemeral: true
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('botcheck')
            .setDescription('View bot health and statistics (Bot Owner Only)');
    }
    async run(interaction) {
        // Owner check
        if (!(0, owner_js_1.isOwner)(interaction.user.id)) {
            await this.errorReply(interaction, 'This command is restricted to bot owners.');
            return;
        }
        const client = interaction.client;
        // System metrics
        const memUsage = process.memoryUsage();
        const cpuUsage = os_1.default.loadavg()[0];
        // Bot statistics
        const guilds = client.guilds.cache.size;
        const users = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        const channels = client.channels.cache.size;
        // Uptime
        const uptime = (0, time_js_1.formatUptime)(client.uptime ?? 0);
        // Memory formatting
        const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
        const rss = (memUsage.rss / 1024 / 1024).toFixed(2);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🤖 alterGolden Health Dashboard')
            .setColor(constants_js_1.COLORS.SUCCESS)
            .addFields({ name: '📊 Status', value: '```Online```', inline: true }, { name: '⏱️ Uptime', value: `\`\`\`${uptime}\`\`\``, inline: true }, { name: '🏓 Ping', value: `\`\`\`${client.ws.ping}ms\`\`\``, inline: true }, { name: '🏠 Servers', value: `\`\`\`${guilds}\`\`\``, inline: true }, { name: '👥 Users', value: `\`\`\`${users.toLocaleString()}\`\`\``, inline: true }, { name: '📺 Channels', value: `\`\`\`${channels}\`\`\``, inline: true }, { name: '💾 Memory (Heap)', value: `\`\`\`${heapUsed}/${heapTotal} MB\`\`\``, inline: true }, { name: '💽 Memory (RSS)', value: `\`\`\`${rss} MB\`\`\``, inline: true }, { name: '🖥️ CPU Load', value: `\`\`\`${cpuUsage.toFixed(2)}%\`\`\``, inline: true }, { name: '🔧 Node.js', value: `\`\`\`${process.version}\`\`\``, inline: true }, { name: '💻 Platform', value: `\`\`\`${os_1.default.platform()} ${os_1.default.arch()}\`\`\``, inline: true }, { name: '📡 Discord.js', value: `\`\`\`v14.x\`\`\``, inline: true })
            .setTimestamp()
            .setFooter({ text: 'Bot Health Dashboard' });
        await this.safeReply(interaction, { embeds: [embed] });
    }
}
exports.default = new BotCheckCommand();
//# sourceMappingURL=botcheck.js.map