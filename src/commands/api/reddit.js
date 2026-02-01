/**
 * Reddit Command - Presentation Layer
 * Fetch posts from Reddit
 * @module presentation/commands/api/reddit
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BaseCommand, CommandCategory } = require('../BaseCommand');
const { COLORS } = require('../../utils/constants');
const { checkAccess, AccessType } = require('../../services');

// Import services
let redditService, redditCache, postHandler;
try {
    redditService = require('../../modules/api/services/redditService');
    redditCache = require('../../modules/api/repositories/redditCache');
    postHandler = require('../../modules/api/handlers/redditPostHandler');
} catch (e) {
    console.warn('[Reddit] Could not load services:', e.message);
}

class RedditCommand extends BaseCommand {
    constructor() {
        super({
            category: CommandCategory.API,
            cooldown: 5,
            deferReply: false // Manual defer
        });
    }

    get data() {
        return new SlashCommandBuilder()
            .setName('reddit')
            .setDescription('Fetches posts from Reddit')
            .addSubcommand(sub =>
                sub.setName('browse')
                    .setDescription('Browse a specific subreddit')
                    .addStringOption(option =>
                        option.setName('subreddit')
                            .setDescription('The subreddit to fetch')
                            .setRequired(true)
                            .setAutocomplete(true)
                    )
                    .addStringOption(option =>
                        option.setName('sort')
                            .setDescription('How to sort the posts')
                            .setRequired(false)
                            .addChoices(
                                { name: '🔥 Hot', value: 'hot' },
                                { name: '⭐ Best', value: 'best' },
                                { name: '🏆 Top', value: 'top' },
                                { name: '🆕 New', value: 'new' },
                                { name: '📈 Rising', value: 'rising' }
                            )
                    )
                    .addStringOption(option =>
                        option.setName('count')
                            .setDescription('Number of posts to fetch (default: 5)')
                            .setRequired(false)
                            .addChoices(
                                { name: '5 posts', value: '5' },
                                { name: '10 posts', value: '10' },
                                { name: '15 posts', value: '15' }
                            )
                    )
            )
            .addSubcommand(sub =>
                sub.setName('trending')
                    .setDescription('See what\'s trending on Reddit right now')
                    .addStringOption(option =>
                        option.setName('source')
                            .setDescription('Where to get trending posts from')
                            .setRequired(false)
                            .addChoices(
                                { name: '🌍 r/popular (Global)', value: 'popular' },
                                { name: '🌐 r/all (Everything)', value: 'all' }
                            )
                    )
                    .addStringOption(option =>
                        option.setName('count')
                            .setDescription('Number of posts to fetch (default: 10)')
                            .setRequired(false)
                            .addChoices(
                                { name: '5 posts', value: '5' },
                                { name: '10 posts', value: '10' },
                                { name: '15 posts', value: '15' },
                                { name: '20 posts', value: '20' }
                            )
                    )
            );
    }

    async run(interaction) {
        // Access control
        const access = await checkAccess(interaction, AccessType.SUB);
        if (access.blocked) {
            return interaction.reply({ embeds: [access.embed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'trending') {
            return this._handleTrending(interaction);
        }

        return this._handleBrowse(interaction);
    }

    async _handleBrowse(interaction) {
        const subreddit = interaction.options.getString('subreddit').replace(/\s/g, '').trim();
        const sortBy = interaction.options.getString('sort') || 'top';
        const count = parseInt(interaction.options.getString('count') || '5');
        const isNsfwChannel = interaction.channel?.nsfw || false;

        await interaction.deferReply();

        const sortNames = {
            hot: 'Hot', best: 'Best', top: 'Top', new: 'New', rising: 'Rising'
        };

        const loadingEmbed = new EmbedBuilder()
            .setTitle('🔄 Fetching Posts...')
            .setDescription(`Retrieving **${count} ${sortNames[sortBy]}** posts from **r/${subreddit}**\n\nThis may take a moment...`)
            .setColor(COLORS.PRIMARY)
            .setThumbnail('https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png')
            .setTimestamp();

        await interaction.editReply({ embeds: [loadingEmbed] });

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1500));

        const result = await redditService.fetchSubredditPosts(subreddit, sortBy, count);

        if (result.error === 'not_found') {
            const similarSubreddits = await redditService.searchSimilarSubreddits(subreddit);
            const embed = postHandler.createNotFoundEmbed(subreddit, similarSubreddits);
            return interaction.editReply({ embeds: [embed] });
        }

        if (result.error || !result.posts || result.posts.length === 0) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.ERROR)
                    .setTitle('❌ Error')
                    .setDescription(result.error || 'No posts found.')
                ]
            });
        }

        // Filter NSFW if not in NSFW channel
        let posts = result.posts;
        if (!isNsfwChannel) {
            posts = posts.filter(p => !p.over_18);
        }

        const embeds = posts.slice(0, 10).map(post => postHandler.createPostEmbed(post, subreddit));
        
        if (embeds.length === 0) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.WARNING)
                    .setDescription('⚠️ All posts are NSFW. Use this command in an NSFW channel.')
                ]
            });
        }

        await interaction.editReply({ embeds });
    }

    async _handleTrending(interaction) {
        const source = interaction.options.getString('source') || 'popular';
        const count = parseInt(interaction.options.getString('count') || '10');

        await interaction.deferReply();

        const result = await redditService.fetchSubredditPosts(source, 'hot', count);

        if (result.error || !result.posts || result.posts.length === 0) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.ERROR)
                    .setDescription('❌ Failed to fetch trending posts.')
                ]
            });
        }

        const embeds = result.posts.slice(0, 10).map(post => postHandler.createPostEmbed(post, source));
        await interaction.editReply({ embeds });
    }

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();

        if (!focused || focused.length < 2) {
            return interaction.respond([]).catch(() => {});
        }

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 2500)
            );

            const searchPromise = redditService.searchSubreddits(focused, 8);
            const subreddits = await Promise.race([searchPromise, timeoutPromise]);

            const choices = subreddits.map(sub => ({
                name: `${sub.displayName} — ${sub.title}`.slice(0, 100),
                value: sub.name
            }));

            await interaction.respond(choices).catch(() => {});
        } catch (error) {
            await interaction.respond([]).catch(() => {});
        }
    }
}

module.exports = new RedditCommand();



