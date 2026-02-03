"use strict";
/**
 * Reddit Command - Presentation Layer
 * Fetch posts from Reddit
 * @module presentation/commands/api/reddit
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const constants_js_1 = require("../../constants.js");
const index_js_1 = require("../../services/index.js");
// SERVICE IMPORTS
let redditService;
let redditCache;
let postHandler;
const getDefault = (mod) => mod.default || mod;
try {
    redditService = getDefault(require('../../services/api/redditService'));
    redditCache = getDefault(require('../../repositories/api/redditCache'));
    postHandler = getDefault(require('../../handlers/api/redditPostHandler'));
}
catch (e) {
    console.warn('[Reddit] Could not load services:', e.message);
}
// COMMAND
class RedditCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.API,
            cooldown: 5,
            deferReply: false // Manual defer
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('reddit')
            .setDescription('Fetches posts from Reddit')
            .addSubcommand(sub => sub.setName('browse')
            .setDescription('Browse a specific subreddit')
            .addStringOption(option => option.setName('subreddit')
            .setDescription('The subreddit to fetch')
            .setRequired(true)
            .setAutocomplete(true))
            .addStringOption(option => option.setName('sort')
            .setDescription('How to sort the posts')
            .setRequired(false)
            .addChoices({ name: '🔥 Hot', value: 'hot' }, { name: '⭐ Best', value: 'best' }, { name: '🏆 Top', value: 'top' }, { name: '🆕 New', value: 'new' }, { name: '📈 Rising', value: 'rising' }))
            .addStringOption(option => option.setName('count')
            .setDescription('Number of posts to fetch (default: 5)')
            .setRequired(false)
            .addChoices({ name: '5 posts', value: '5' }, { name: '10 posts', value: '10' }, { name: '15 posts', value: '15' })))
            .addSubcommand(sub => sub.setName('trending')
            .setDescription('See what\'s trending on Reddit right now')
            .addStringOption(option => option.setName('source')
            .setDescription('Where to get trending posts from')
            .setRequired(false)
            .addChoices({ name: '🌍 r/popular (Global)', value: 'popular' }, { name: '🌐 r/all (Everything)', value: 'all' }))
            .addStringOption(option => option.setName('count')
            .setDescription('Number of posts to fetch (default: 10)')
            .setRequired(false)
            .addChoices({ name: '5 posts', value: '5' }, { name: '10 posts', value: '10' }, { name: '15 posts', value: '15' }, { name: '20 posts', value: '20' })));
    }
    async run(interaction) {
        // Access control
        const access = await (0, index_js_1.checkAccess)(interaction, index_js_1.AccessType.SUB);
        if (access.blocked) {
            await interaction.reply({ embeds: [access.embed], ephemeral: true });
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'trending') {
            await this._handleTrending(interaction);
            return;
        }
        await this._handleBrowse(interaction);
    }
    async _handleBrowse(interaction) {
        const subreddit = interaction.options.getString('subreddit', true).replace(/\s/g, '').trim();
        const sortBy = interaction.options.getString('sort') || 'top';
        const count = parseInt(interaction.options.getString('count') || '5');
        const channel = interaction.channel;
        const isNsfwChannel = channel && 'nsfw' in channel ? channel.nsfw : false;
        await interaction.deferReply();
        const sortNames = {
            hot: 'Hot', best: 'Best', top: 'Top', new: 'New', rising: 'Rising'
        };
        const loadingEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('🔄 Fetching Posts...')
            .setDescription(`Retrieving **${count} ${sortNames[sortBy]}** posts from **r/${subreddit}**\n\nThis may take a moment...`)
            .setColor(constants_js_1.COLORS.PRIMARY)
            .setThumbnail('https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png')
            .setTimestamp();
        await interaction.editReply({ embeds: [loadingEmbed] });
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1500));
        const result = await redditService.fetchSubredditPosts(subreddit, sortBy, count);
        if (result.error === 'not_found') {
            const similarSubreddits = await redditService.searchSimilarSubreddits(subreddit);
            const embed = postHandler.createNotFoundEmbed(subreddit, similarSubreddits);
            await interaction.editReply({ embeds: [embed] });
            return;
        }
        if (result.error || !result.posts || result.posts.length === 0) {
            await interaction.editReply({
                embeds: [new discord_js_1.EmbedBuilder()
                        .setColor(constants_js_1.COLORS.ERROR)
                        .setTitle('❌ Error')
                        .setDescription(result.error || 'No posts found.')
                ]
            });
            return;
        }
        let filteredPosts = result.posts;
        if (!isNsfwChannel) {
            filteredPosts = result.posts.filter(p => !p.nsfw && !p.over_18);
            if (filteredPosts.length === 0 && result.posts.length > 0) {
                await interaction.editReply({
                    embeds: [new discord_js_1.EmbedBuilder()
                            .setColor(constants_js_1.COLORS.WARNING)
                            .setDescription('⚠️ All posts are NSFW. Use this command in an age-restricted channel.')
                    ]
                });
                return;
            }
        }
        redditCache.setPosts(interaction.user.id, filteredPosts);
        redditCache.setPage(interaction.user.id, 0);
        redditCache.setSort(interaction.user.id, sortBy);
        redditCache.setNsfwChannel(interaction.user.id, isNsfwChannel);
        await postHandler.sendPostListEmbed(interaction, subreddit, filteredPosts, sortBy, 0, isNsfwChannel);
    }
    async _handleTrending(interaction) {
        const source = interaction.options.getString('source') || 'popular';
        const count = parseInt(interaction.options.getString('count') || '10');
        const channel = interaction.channel;
        const isNsfwChannel = channel && 'nsfw' in channel ? channel.nsfw : false;
        await interaction.deferReply();
        const sourceNames = { popular: 'r/popular', all: 'r/all' };
        const loadingEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('🔥 Fetching Trending Posts...')
            .setDescription(`Getting **${count}** hot posts from **${sourceNames[source]}**\n\nThis may take a moment...`)
            .setColor(constants_js_1.COLORS.PRIMARY)
            .setThumbnail('https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png')
            .setTimestamp();
        await interaction.editReply({ embeds: [loadingEmbed] });
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1500));
        let result;
        if (source === 'all') {
            result = await redditService.fetchAllPosts?.('hot', count) ||
                await redditService.fetchSubredditPosts('all', 'hot', count);
        }
        else {
            result = await redditService.fetchTrendingPosts?.('global', count) ||
                await redditService.fetchSubredditPosts('popular', 'hot', count);
        }
        if (result.error || !result.posts || result.posts.length === 0) {
            await interaction.editReply({
                embeds: [new discord_js_1.EmbedBuilder()
                        .setColor(constants_js_1.COLORS.ERROR)
                        .setDescription('❌ Failed to fetch trending posts. Please try again later.')
                ]
            });
            return;
        }
        let filteredPosts = result.posts;
        if (!isNsfwChannel) {
            filteredPosts = result.posts.filter(p => !p.nsfw && !p.over_18);
            if (filteredPosts.length === 0) {
                await interaction.editReply({
                    embeds: [new discord_js_1.EmbedBuilder()
                            .setColor(constants_js_1.COLORS.WARNING)
                            .setDescription('⚠️ All trending posts are NSFW. Use this command in an age-restricted channel.')
                    ]
                });
                return;
            }
        }
        redditCache.setPosts(interaction.user.id, filteredPosts);
        redditCache.setPage(interaction.user.id, 0);
        redditCache.setSort(interaction.user.id, 'hot');
        redditCache.setNsfwChannel(interaction.user.id, isNsfwChannel);
        const displayName = source === 'all' ? 'all (Trending)' : 'popular (Trending)';
        await postHandler.sendPostListEmbed(interaction, displayName, filteredPosts, 'hot', 0, isNsfwChannel);
    }
    async handleButton(interaction) {
        const customId = interaction.customId;
        const userId = interaction.user.id;
        const parts = customId.split('_');
        const buttonUserId = parts[parts.length - 1];
        if (userId !== buttonUserId) {
            await interaction.reply({ content: '❌ This button is not for you!', ephemeral: true });
            return;
        }
        const posts = redditCache.getPosts(userId);
        if (!posts || posts.length === 0) {
            await interaction.reply({ content: '⚠️ Session expired. Please run the command again.', ephemeral: true });
            return;
        }
        await interaction.deferUpdate();
        try {
            if (customId.startsWith('reddit_prev_') || customId.startsWith('reddit_next_')) {
                const currentPage = redditCache.getPage(userId);
                const totalPages = Math.ceil(posts.length / 5);
                let newPage = currentPage;
                if (customId.startsWith('reddit_prev_')) {
                    newPage = Math.max(0, currentPage - 1);
                }
                else {
                    newPage = Math.min(totalPages - 1, currentPage + 1);
                }
                redditCache.setPage(userId, newPage);
                const sortBy = redditCache.getSort(userId);
                const isNsfw = redditCache.getNsfwChannel(userId);
                const subreddit = interaction.message?.embeds?.[0]?.title?.match(/r\/(\S+)/)?.[1] || 'reddit';
                await postHandler.sendPostListEmbed(interaction, subreddit, posts, sortBy, newPage, isNsfw);
            }
            else if (customId.startsWith('reddit_show_')) {
                const postIndex = parseInt(parts[2]);
                const post = posts[postIndex];
                if (post) {
                    await postHandler.showPostDetails(interaction, post, postIndex, userId);
                }
            }
            else if (customId.startsWith('reddit_gprev_') || customId.startsWith('reddit_gnext_')) {
                const postIndex = parseInt(parts[2]);
                const post = posts[postIndex];
                if (post && post.gallery) {
                    const currentGalleryPage = redditCache.getGalleryPage(userId, postIndex);
                    let newGalleryPage = currentGalleryPage;
                    if (customId.startsWith('reddit_gprev_')) {
                        newGalleryPage = Math.max(0, currentGalleryPage - 1);
                    }
                    else {
                        newGalleryPage = Math.min(post.gallery.length - 1, currentGalleryPage + 1);
                    }
                    redditCache.setGalleryPage(userId, postIndex, newGalleryPage);
                    await postHandler.showPostDetails(interaction, post, postIndex, userId);
                }
            }
            else if (customId.startsWith('reddit_back_') || customId.startsWith('reddit_gclose_')) {
                const currentPage = redditCache.getPage(userId);
                const sortBy = redditCache.getSort(userId);
                const isNsfw = redditCache.getNsfwChannel(userId);
                const subreddit = interaction.message?.embeds?.[0]?.footer?.text?.match(/r\/(\S+)/)?.[1] || 'reddit';
                await postHandler.sendPostListEmbed(interaction, subreddit, posts, sortBy, currentPage, isNsfw);
            }
        }
        catch (error) {
            console.error('[Reddit Button Error]', error);
        }
    }
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        if (!focused || focused.length < 2) {
            await interaction.respond([]).catch(() => { });
            return;
        }
        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500));
            const searchPromise = redditService.searchSubreddits(focused, 8);
            const subreddits = await Promise.race([searchPromise, timeoutPromise]);
            const choices = subreddits.map(sub => ({
                name: `${sub.displayName} — ${sub.title}`.slice(0, 100),
                value: sub.name
            }));
            await interaction.respond(choices).catch(() => { });
        }
        catch {
            await interaction.respond([]).catch(() => { });
        }
    }
}
exports.default = new RedditCommand();
//# sourceMappingURL=reddit.js.map