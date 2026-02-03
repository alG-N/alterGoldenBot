/**
 * BotCheck Command - Presentation Layer
 * Bot health and status dashboard for owners only
 * @module presentation/commands/owner/botcheck
 */

import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import os from 'os';
import { BaseCommand, CommandCategory, type CommandData } from '../BaseCommand.js';
import { COLORS } from '../../constants.js';
import { isOwner } from '../../config/owner.js';
import { formatUptime } from '../../utils/common/time.js';

class BotCheckCommand extends BaseCommand {
    constructor() {
        super({
            category: CommandCategory.OWNER,
            cooldown: 10,
            deferReply: true,
            ephemeral: true
        });
    }

    get data(): CommandData {
        return new SlashCommandBuilder()
            .setName('botcheck')
            .setDescription('View bot health and statistics (Bot Owner Only)');
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        // Owner check
        if (!isOwner(interaction.user.id)) {
            await this.errorReply(interaction, 'This command is restricted to bot owners.');
            return;
        }

        const client = interaction.client;
        
        // System metrics
        const memUsage = process.memoryUsage();
        const cpuUsage = os.loadavg()[0];
        
        // Bot statistics
        const guilds = client.guilds.cache.size;
        const users = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        const channels = client.channels.cache.size;
        
        // Uptime
        const uptime = formatUptime(client.uptime ?? 0);
        
        // Memory formatting
        const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
        const rss = (memUsage.rss / 1024 / 1024).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle('🤖 alterGolden Health Dashboard')
            .setColor(COLORS.SUCCESS)
            .addFields(
                { name: '📊 Status', value: '```Online```', inline: true },
                { name: '⏱️ Uptime', value: `\`\`\`${uptime}\`\`\``, inline: true },
                { name: '🏓 Ping', value: `\`\`\`${client.ws.ping}ms\`\`\``, inline: true },
                { name: '🏠 Servers', value: `\`\`\`${guilds}\`\`\``, inline: true },
                { name: '👥 Users', value: `\`\`\`${users.toLocaleString()}\`\`\``, inline: true },
                { name: '📺 Channels', value: `\`\`\`${channels}\`\`\``, inline: true },
                { name: '💾 Memory (Heap)', value: `\`\`\`${heapUsed}/${heapTotal} MB\`\`\``, inline: true },
                { name: '💽 Memory (RSS)', value: `\`\`\`${rss} MB\`\`\``, inline: true },
                { name: '🖥️ CPU Load', value: `\`\`\`${cpuUsage.toFixed(2)}%\`\`\``, inline: true },
                { name: '🔧 Node.js', value: `\`\`\`${process.version}\`\`\``, inline: true },
                { name: '💻 Platform', value: `\`\`\`${os.platform()} ${os.arch()}\`\`\``, inline: true },
                { name: '📡 Discord.js', value: `\`\`\`v14.x\`\`\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Bot Health Dashboard' });

        await this.safeReply(interaction, { embeds: [embed] });
    }
}

export default new BotCheckCommand();
