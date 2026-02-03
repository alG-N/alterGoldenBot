/**
 * Help Command - Presentation Layer
 * Shows list of available commands
 * @module commands/general/help
 */

import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand, CommandCategory, CommandData } from '../BaseCommand';
import { COLORS } from '../../constants';

/**
 * Help category filter values
 */
type HelpCategory = 'media' | 'music' | 'fun' | 'utility' | 'admin' | null;

class HelpCommand extends BaseCommand {
    constructor() {
        super({
            category: CommandCategory.GENERAL,
            cooldown: 5,
            deferReply: false
        });
    }

    get data(): CommandData {
        return new SlashCommandBuilder()
            .setName('help')
            .setDescription('Shows a list of all available commands')
            .addStringOption(option =>
                option.setName('category')
                    .setDescription('Filter commands by category')
                    .setRequired(false)
                    .addChoices(
                        { name: '🎬 Media', value: 'media' },
                        { name: '🎵 Music', value: 'music' },
                        { name: '⚔️ Fun', value: 'fun' },
                        { name: '📋 Utility', value: 'utility' },
                        { name: '🛡️ Admin', value: 'admin' }
                    )
            );
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const category = interaction.options.getString('category') as HelpCategory;

        const embed = new EmbedBuilder()
            .setTitle('📚 alterGolden - Command List')
            .setColor(COLORS.INFO)
            .setTimestamp()
            .setFooter({ 
                text: `Requested by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        if (!category || category === 'media') {
            embed.addFields({
                name: '🎬 Media Commands', 
                value: [
                    '`/video [url]` - Download videos from TikTok, YouTube, Twitter, etc.',
                    '`/pixiv [query]` - Search Pixiv artwork',
                    '`/reddit [subreddit]` - Fetch posts from Reddit',
                    '`/anime [name]` - Search anime information',
                    '`/steam` - Check Steam sales',
                    '`/rule34 search [tag]` - Search Rule34 images'
                ].join('\n'),
                inline: false 
            });
        }

        if (!category || category === 'music') {
            embed.addFields({
                name: '🎵 Music Commands', 
                value: [
                    '`/music play [query]` - Play music in voice channel',
                    '`/music queue` - View the queue',
                    '`/music skip` - Skip current track',
                    '`/music pause` - Pause/resume playback',
                    '`/music volume [level]` - Adjust volume',
                    '`/music loop [mode]` - Toggle loop mode',
                    '`/music stop` - Stop and disconnect'
                ].join('\n'),
                inline: false 
            });
        }

        if (!category || category === 'fun') {
            embed.addFields({
                name: '⚔️ Interactive Commands', 
                value: [
                    '`/deathbattle [@user] [skillset]` - Battle with anime skillsets',
                    '`/say [message]` - Make the bot speak'
                ].join('\n'),
                inline: false 
            });
        }

        if (!category || category === 'utility') {
            embed.addFields({
                name: '📋 Utility Commands', 
                value: [
                    '`/avatar [user]` - View user avatar',
                    '`/ping` - Check bot latency',
                    '`/serverinfo` - Server information',
                    '`/roleinfo [@role]` - Role information',
                    '`/afk [reason]` - Set AFK status',
                    '`/invite` - Invite the bot',
                    '`/report` - Report an issue'
                ].join('\n'),
                inline: false 
            });
        }

        if (!category || category === 'admin') {
            embed.addFields({
                name: '🛡️ Admin Commands', 
                value: [
                    '`/setting` - Server settings',
                    '`/snipe` - View deleted messages',
                    '`/kick [@user]` - Kick a user',
                    '`/ban [@user]` - Ban a user',
                    '`/mute [@user]` - Mute a user',
                    '`/delete [amount]` - Bulk delete messages'
                ].join('\n'),
                inline: false 
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
}

// Export singleton instance
const helpCommand = new HelpCommand();
export default helpCommand;

// CommonJS compatibility
module.exports = helpCommand;
