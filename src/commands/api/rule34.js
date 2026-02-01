/**
 * Rule34 Command - Presentation Layer
 * Search Rule34 for images and videos
 * @module presentation/commands/api/rule34
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { BaseCommand, CommandCategory } = require('../BaseCommand');
const { checkAccess, AccessType } = require('../../services');

// Import services
let rule34Service, rule34Cache, postHandler;
try {
    rule34Service = require('../../modules/api/services/rule34Service');
    rule34Cache = require('../../modules/api/repositories/rule34Cache');
    postHandler = require('../../modules/api/handlers/rule34PostHandler');
} catch (e) {
    console.warn('[Rule34] Could not load services:', e.message);
}

class Rule34Command extends BaseCommand {
    constructor() {
        super({
            category: CommandCategory.API,
            cooldown: 3,
            deferReply: false,
            nsfw: true
        });
    }

    get data() {
        return new SlashCommandBuilder()
            .setName('rule34')
            .setDescription('Search Rule34 for images and videos')
            .setNSFW(true)
            .addSubcommand(subcommand =>
                subcommand
                    .setName('search')
                    .setDescription('Search for posts by tags')
                    .addStringOption(option =>
                        option.setName('tags')
                            .setDescription('Tags to search for (space-separated)')
                            .setRequired(true)
                            .setAutocomplete(true)
                    )
                    .addStringOption(option =>
                        option.setName('rating')
                            .setDescription('Filter by rating')
                            .setRequired(false)
                            .addChoices(
                                { name: '🟢 Safe', value: 'safe' },
                                { name: '🟡 Questionable', value: 'questionable' },
                                { name: '🔴 Explicit', value: 'explicit' },
                                { name: '⚪ All Ratings', value: 'all' }
                            )
                    )
                    .addStringOption(option =>
                        option.setName('sort')
                            .setDescription('Sort results by')
                            .setRequired(false)
                            .addChoices(
                                { name: '⭐ Score (Highest)', value: 'score:desc' },
                                { name: '⭐ Score (Lowest)', value: 'score:asc' },
                                { name: '🆕 Newest First', value: 'id:desc' },
                                { name: '📅 Oldest First', value: 'id:asc' },
                                { name: '🔄 Recently Updated', value: 'updated:desc' }
                            )
                    )
                    .addBooleanOption(option =>
                        option.setName('ai_filter')
                            .setDescription('Hide AI-generated content (Default: uses your settings)')
                            .setRequired(false)
                    )
                    .addIntegerOption(option =>
                        option.setName('min_score')
                            .setDescription('Minimum score filter (0-10000)')
                            .setRequired(false)
                            .setMinValue(0)
                            .setMaxValue(10000)
                    )
                    .addStringOption(option =>
                        option.setName('content_type')
                            .setDescription('Filter by content type')
                            .setRequired(false)
                            .addChoices(
                                { name: '🎬 Videos Only', value: 'animated' },
                                { name: '📖 Comics Only', value: 'comic' },
                                { name: '📷 Images Only', value: 'image' }
                            )
                    )
                    .addBooleanOption(option =>
                        option.setName('high_quality')
                            .setDescription('Only show high quality posts')
                            .setRequired(false)
                    )
                    .addIntegerOption(option =>
                        option.setName('min_width')
                            .setDescription('Minimum image width')
                            .setRequired(false)
                            .setMinValue(100)
                            .setMaxValue(10000)
                    )
                    .addIntegerOption(option =>
                        option.setName('min_height')
                            .setDescription('Minimum image height')
                            .setRequired(false)
                            .setMinValue(100)
                            .setMaxValue(10000)
                    )
                    .addStringOption(option =>
                        option.setName('exclude')
                            .setDescription('Tags to exclude (space-separated)')
                            .setRequired(false)
                    )
                    .addIntegerOption(option =>
                        option.setName('page')
                            .setDescription('Page number (default: 1)')
                            .setRequired(false)
                            .setMinValue(1)
                            .setMaxValue(200)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('random')
                    .setDescription('Get random posts')
                    .addStringOption(option =>
                        option.setName('tags')
                            .setDescription('Optional tags to filter by')
                            .setRequired(false)
                            .setAutocomplete(true)
                    )
                    .addIntegerOption(option =>
                        option.setName('count')
                            .setDescription('Number of random posts (1-10)')
                            .setRequired(false)
                            .setMinValue(1)
                            .setMaxValue(10)
                    )
                    .addBooleanOption(option =>
                        option.setName('ai_filter')
                            .setDescription('Hide AI-generated content')
                            .setRequired(false)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('id')
                    .setDescription('Get a specific post by ID')
                    .addIntegerOption(option =>
                        option.setName('post_id')
                            .setDescription('The post ID to look up')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('trending')
                    .setDescription('Get trending/popular posts')
                    .addStringOption(option =>
                        option.setName('timeframe')
                            .setDescription('Timeframe for trending')
                            .setRequired(false)
                            .addChoices(
                                { name: '📅 Today', value: 'day' },
                                { name: '📊 This Week', value: 'week' },
                                { name: '📈 This Month', value: 'month' }
                            )
                    )
                    .addBooleanOption(option =>
                        option.setName('ai_filter')
                            .setDescription('Hide AI-generated content')
                            .setRequired(false)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('related')
                    .setDescription('Find tags related to a tag')
                    .addStringOption(option =>
                        option.setName('tag')
                            .setDescription('Tag to find related tags for')
                            .setRequired(true)
                            .setAutocomplete(true)
                    )
            )
            .addSubcommandGroup(group =>
                group
                    .setName('blacklist')
                    .setDescription('Manage your personal blacklist')
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName('view')
                            .setDescription('View your blacklisted tags')
                    )
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName('add')
                            .setDescription('Add tags to your blacklist')
                            .addStringOption(option =>
                                option.setName('tags')
                                    .setDescription('Tags to blacklist (space-separated)')
                                    .setRequired(true)
                            )
                    )
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName('remove')
                            .setDescription('Remove tags from your blacklist')
                            .addStringOption(option =>
                                option.setName('tags')
                                    .setDescription('Tags to remove (space-separated)')
                                    .setRequired(true)
                            )
                    )
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName('clear')
                            .setDescription('Clear your entire blacklist')
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('settings')
                    .setDescription('Configure your Rule34 preferences')
            );
    }

    async autocomplete(interaction) {
        try {
            const focused = interaction.options.getFocused(true);
            
            if (focused.name !== 'tags' && focused.name !== 'tag') {
                return interaction.respond([]).catch(() => {});
            }

            const focusedValue = focused.value?.trim();
            
            if (!focusedValue || focusedValue.length < 2) {
                return interaction.respond([
                    { name: '💡 Type at least 2 characters...', value: ' ' }
                ]).catch(() => {});
            }

            // Check cache first
            const cached = rule34Cache?.getAutocompleteSuggestions?.(focusedValue);
            if (cached) {
                const choices = cached.map(s => ({
                    name: `${s.name}${s.count ? ` (${s.count})` : ''}`.slice(0, 100),
                    value: s.value.slice(0, 100)
                }));
                return interaction.respond(choices).catch(() => {});
            }

            // Get suggestions from API
            const suggestions = await rule34Service.getAutocompleteSuggestions?.(focusedValue) || [];
            
            // Cache results
            rule34Cache?.setAutocompleteSuggestions?.(focusedValue, suggestions);
            
            // Add user's exact input as first option
            const choices = [
                { name: `🔍 "${focusedValue}"`, value: focusedValue }
            ];
            
            // Add API suggestions
            for (const s of suggestions.slice(0, 24)) {
                choices.push({
                    name: `${s.name}${s.count ? ` (${s.count})` : ''}`.slice(0, 100),
                    value: (s.value || s.name || '').slice(0, 100)
                });
            }

            await interaction.respond(choices).catch(() => {});
        } catch (error) {
            console.log('[Rule34 Autocomplete] Error:', error.message);
            const focusedValue = interaction.options.getFocused() || '';
            await interaction.respond([
                { name: `🔍 "${focusedValue.slice(0, 90)}"`, value: focusedValue.slice(0, 100) || 'search' }
            ]).catch(() => {});
        }
    }

    async run(interaction) {
        // Access control
        const access = await checkAccess(interaction, AccessType.SUB);
        if (access.blocked) {
            return interaction.reply({ embeds: [access.embed], ephemeral: true });
        }

        // Verify NSFW channel
        if (!interaction.channel?.nsfw) {
            return this.safeReply(interaction, {
                embeds: [this.errorEmbed('🔞 This command can only be used in NSFW channels!')],
                ephemeral: true
            });
        }

        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        try {
            // Handle subcommand groups
            if (subcommandGroup === 'blacklist') {
                return await this._handleBlacklistCommands(interaction, subcommand, userId);
            }

            // Handle regular subcommands
            switch (subcommand) {
                case 'search':
                    return await this._handleSearch(interaction, userId);
                case 'random':
                    return await this._handleRandom(interaction, userId);
                case 'id':
                    return await this._handleGetById(interaction, userId);
                case 'trending':
                    return await this._handleTrending(interaction, userId);
                case 'related':
                    return await this._handleRelated(interaction, userId);
                case 'settings':
                    return await this._handleSettings(interaction, userId);
                default:
                    return this.safeReply(interaction, { 
                        embeds: [this.errorEmbed('Unknown command')], 
                        ephemeral: true 
                    });
            }
        } catch (error) {
            console.error('[Rule34 Command Error]', error);
            const errorEmbed = postHandler?.createErrorEmbed?.(error) || this.errorEmbed(error.message || 'An error occurred');
            
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ embeds: [errorEmbed] }).catch(() => {});
            }
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }

    async _handleSearch(interaction, userId) {
        await interaction.deferReply();

        const tags = interaction.options.getString('tags');
        const rating = interaction.options.getString('rating');
        const sort = interaction.options.getString('sort');
        const aiFilter = interaction.options.getBoolean('ai_filter');
        const minScore = interaction.options.getInteger('min_score');
        const contentType = interaction.options.getString('content_type');
        const highQuality = interaction.options.getBoolean('high_quality');
        const minWidth = interaction.options.getInteger('min_width');
        const minHeight = interaction.options.getInteger('min_height');
        const exclude = interaction.options.getString('exclude');
        const page = interaction.options.getInteger('page') || 1;

        // Get user preferences
        const prefs = rule34Cache?.getPreferences?.(userId) || {};
        const blacklist = rule34Cache?.getBlacklist?.(userId) || [];

        // Build search options
        const searchOptions = {
            limit: 50,
            page: page - 1,
            sort: sort || prefs.sortMode || 'score:desc',
            rating: rating === 'all' ? null : (rating || prefs.defaultRating),
            excludeAi: aiFilter ?? prefs.aiFilter,
            minScore: minScore ?? prefs.minScore ?? 0,
            contentType: contentType,
            excludeTags: [...blacklist, ...(exclude ? exclude.split(/\s+/) : [])],
            minWidth: minWidth || 0,
            minHeight: minHeight || 0,
            highQualityOnly: highQuality ?? prefs.highQualityOnly,
            excludeLowQuality: prefs.excludeLowQuality
        };

        // Perform search
        const result = await rule34Service.search(tags, searchOptions);

        if (!result?.posts?.length) {
            const noResultsEmbed = postHandler?.createNoResultsEmbed?.(tags) || this.errorEmbed(`No results found for **${tags}**`);
            return interaction.editReply({ embeds: [noResultsEmbed] });
        }

        // Store session
        rule34Cache?.setSession?.(userId, {
            type: 'search',
            query: tags,
            posts: result.posts,
            options: searchOptions,
            currentIndex: 0,
            currentPage: page,
            hasMore: result.hasMore
        });

        // Create embed for first post
        const post = result.posts[0];
        
        // Add to view history
        rule34Cache?.addToHistory?.(userId, post.id, { score: post.score });

        if (post.hasVideo) {
            const { embed, rows } = postHandler.createVideoEmbed?.(post, {
                resultIndex: 0,
                totalResults: result.posts.length,
                userId,
                searchPage: page
            }) || await postHandler.createPostEmbed(post, { resultIndex: 0, totalResults: result.posts.length, userId, searchPage: page });
            return interaction.editReply({ embeds: [embed], components: rows });
        }

        const { embed, rows } = await postHandler.createPostEmbed(post, {
            resultIndex: 0,
            totalResults: result.posts.length,
            query: tags,
            userId,
            searchPage: page
        });

        return interaction.editReply({ embeds: [embed], components: rows });
    }

    async _handleRandom(interaction, userId) {
        await interaction.deferReply();

        const tags = interaction.options.getString('tags') || '';
        const count = interaction.options.getInteger('count') || 1;
        const aiFilter = interaction.options.getBoolean('ai_filter');

        const prefs = rule34Cache?.getPreferences?.(userId) || {};
        const blacklist = rule34Cache?.getBlacklist?.(userId) || [];

        const posts = await rule34Service.getRandom?.({
            tags,
            count,
            excludeAi: aiFilter ?? prefs.aiFilter,
            minScore: prefs.minScore
        }) || await rule34Service.search(tags, { limit: count, sort: 'random' }).then(r => r.posts);

        // Filter blacklisted tags
        const filteredPosts = posts?.filter(post => {
            const postTags = (post.tags || '').split(' ');
            return !postTags.some(t => blacklist.includes(t));
        }) || [];

        if (filteredPosts.length === 0) {
            const noResultsEmbed = postHandler?.createNoResultsEmbed?.(tags || 'random') || this.errorEmbed('No results found');
            return interaction.editReply({ embeds: [noResultsEmbed] });
        }

        // Store session
        rule34Cache?.setSession?.(userId, {
            type: 'random',
            query: tags || '',
            posts: filteredPosts,
            currentIndex: 0,
            currentPage: 1
        });

        const post = filteredPosts[0];
        rule34Cache?.addToHistory?.(userId, post.id, { score: post.score });

        if (post.hasVideo && postHandler.createVideoEmbed) {
            const { embed, rows } = postHandler.createVideoEmbed(post, {
                resultIndex: 0,
                totalResults: filteredPosts.length,
                userId
            });
            return interaction.editReply({ embeds: [embed], components: rows });
        }

        const { embed, rows } = await postHandler.createPostEmbed(post, {
            resultIndex: 0,
            totalResults: filteredPosts.length,
            userId
        });

        return interaction.editReply({ embeds: [embed], components: rows });
    }

    async _handleGetById(interaction, userId) {
        await interaction.deferReply();

        const postId = interaction.options.getInteger('post_id');
        const post = await rule34Service.getPostById?.(postId);

        if (!post) {
            return interaction.editReply({
                embeds: [this.errorEmbed(`Post #${postId} not found.`)]
            });
        }

        // Store session
        rule34Cache?.setSession?.(userId, {
            type: 'single',
            posts: [post],
            currentIndex: 0
        });

        rule34Cache?.addToHistory?.(userId, post.id, { score: post.score });

        if (post.hasVideo && postHandler.createVideoEmbed) {
            const { embed, rows } = postHandler.createVideoEmbed(post, {
                resultIndex: 0,
                totalResults: 1,
                userId
            });
            return interaction.editReply({ embeds: [embed], components: rows });
        }

        const { embed, rows } = await postHandler.createPostEmbed(post, {
            resultIndex: 0,
            totalResults: 1,
            userId
        });

        return interaction.editReply({ embeds: [embed], components: rows });
    }

    async _handleTrending(interaction, userId) {
        await interaction.deferReply();

        const timeframe = interaction.options.getString('timeframe') || 'day';
        const aiFilter = interaction.options.getBoolean('ai_filter');

        const prefs = rule34Cache?.getPreferences?.(userId) || {};
        const blacklist = rule34Cache?.getBlacklist?.(userId) || [];

        const result = await rule34Service.getTrending?.({
            timeframe,
            excludeAi: aiFilter ?? prefs.aiFilter
        }) || await rule34Service.search('', { sort: 'score:desc', limit: 50 });

        const posts = result?.posts || result || [];
        
        // Filter blacklisted tags
        const filteredPosts = posts.filter(post => {
            const postTags = (post.tags || '').split(' ');
            return !postTags.some(t => blacklist.includes(t));
        });

        if (filteredPosts.length === 0) {
            return interaction.editReply({
                embeds: [this.errorEmbed('No trending posts found matching your filters.')]
            });
        }

        rule34Cache?.setSession?.(userId, {
            type: 'trending',
            posts: filteredPosts,
            currentIndex: 0,
            timeframe
        });

        const post = filteredPosts[0];
        rule34Cache?.addToHistory?.(userId, post.id, { score: post.score });

        if (post.hasVideo && postHandler.createVideoEmbed) {
            const { embed, rows } = postHandler.createVideoEmbed(post, {
                resultIndex: 0,
                totalResults: filteredPosts.length,
                userId
            });
            return interaction.editReply({ embeds: [embed], components: rows });
        }

        const { embed, rows } = await postHandler.createPostEmbed(post, {
            resultIndex: 0,
            totalResults: filteredPosts.length,
            query: `🔥 Trending (${timeframe})`,
            userId
        });

        return interaction.editReply({ embeds: [embed], components: rows });
    }

    async _handleRelated(interaction, userId) {
        await interaction.deferReply();

        const tag = interaction.options.getString('tag');
        const relatedTags = await rule34Service.getRelatedTags?.(tag, 20) || [];

        const embed = postHandler?.createRelatedTagsEmbed?.(tag, relatedTags) || this.infoEmbed('Related Tags', relatedTags.map(t => `• ${t.name || t}`).join('\n') || 'No related tags found');
        return interaction.editReply({ embeds: [embed] });
    }

    async _handleSettings(interaction, userId) {
        const embed = postHandler?.createSettingsEmbed?.(userId) || this.infoEmbed('Settings', 'Use the buttons below to configure your preferences');
        const rows = postHandler?.createSettingsComponents?.(userId) || [];

        return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    }

    async _handleBlacklistCommands(interaction, subcommand, userId) {
        switch (subcommand) {
            case 'view': {
                const blacklist = rule34Cache?.getBlacklist?.(userId) || [];
                const embed = postHandler?.createBlacklistEmbed?.(userId, blacklist) || 
                    this.infoEmbed('Your Blacklist', blacklist.length > 0 ? blacklist.map(t => `\`${t}\``).join(', ') : 'No tags blacklisted');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            case 'add': {
                const tags = interaction.options.getString('tags').split(/\s+/);
                const updated = rule34Cache?.addToBlacklist?.(userId, tags) || tags;
                return interaction.reply({
                    content: `✅ Added **${tags.length}** tag(s) to your blacklist.\nTotal blacklisted: **${updated.length}**`,
                    ephemeral: true
                });
            }
            case 'remove': {
                const tags = interaction.options.getString('tags').split(/\s+/);
                const updated = rule34Cache?.removeFromBlacklist?.(userId, tags) || [];
                return interaction.reply({
                    content: `✅ Removed tag(s) from your blacklist.\nRemaining: **${updated.length}**`,
                    ephemeral: true
                });
            }
            case 'clear': {
                rule34Cache?.clearBlacklist?.(userId);
                return interaction.reply({
                    content: '✅ Your blacklist has been cleared.',
                    ephemeral: true
                });
            }
        }
    }

    async handleButton(interaction) {
        const parts = interaction.customId.split('_');
        const action = parts[1];
        const userId = parts[parts.length - 1];

        // Verify button owner
        if (userId !== interaction.user.id) {
            return interaction.reply({
                content: '❌ This button is not for you!',
                ephemeral: true
            });
        }

        try {
            switch (action) {
                case 'prev':
                case 'next':
                case 'random':
                    return await this._handleNavigation(interaction, action, userId);
                case 'prevpage':
                case 'nextpage':
                    return await this._handlePageNavigation(interaction, action, userId);
                case 'fav':
                    return await this._handleFavoriteToggle(interaction, parts[2], userId);
                case 'tags':
                    return await this._handleTagsToggle(interaction, userId);
                case 'related':
                    return await this._handleRelatedFromPost(interaction, userId);
                case 'settings':
                    if (parts[2] === 'reset') {
                        return await this._handleSettingsReset(interaction, userId);
                    }
                    if (parts[2] === 'close') {
                        return interaction.message.delete().catch(() => {});
                    }
                    break;
                case 'counter':
                case 'pageinfo':
                    return interaction.deferUpdate();
            }
        } catch (error) {
            console.error('[Rule34 Button Error]', error);
            return interaction.reply({
                content: '❌ An error occurred. Please try again.',
                ephemeral: true
            });
        }
    }

    async _handleNavigation(interaction, action, userId) {
        const session = rule34Cache?.getSession?.(userId);
        
        if (!session) {
            return interaction.reply({
                content: '⏱️ Session expired (bot may have restarted). Please run the command again.',
                ephemeral: true
            });
        }

        await interaction.deferUpdate();

        let newIndex = session.currentIndex;
        
        if (action === 'prev') {
            newIndex = Math.max(0, newIndex - 1);
        } else if (action === 'next') {
            newIndex = Math.min(session.posts.length - 1, newIndex + 1);
        } else if (action === 'random') {
            newIndex = Math.floor(Math.random() * session.posts.length);
        }

        rule34Cache?.updateSession?.(userId, { currentIndex: newIndex });

        const post = session.posts[newIndex];
        rule34Cache?.addToHistory?.(userId, post.id, { score: post.score });

        if (post.hasVideo && postHandler.createVideoEmbed) {
            const { embed, rows } = postHandler.createVideoEmbed(post, {
                resultIndex: newIndex,
                totalResults: session.posts.length,
                userId,
                searchPage: session.currentPage || 1
            });
            return interaction.editReply({ embeds: [embed], components: rows });
        }

        const { embed, rows } = await postHandler.createPostEmbed(post, {
            resultIndex: newIndex,
            totalResults: session.posts.length,
            query: session.query,
            userId,
            searchPage: session.currentPage || 1
        });

        return interaction.editReply({ embeds: [embed], components: rows });
    }

    async _handlePageNavigation(interaction, action, userId) {
        const session = rule34Cache?.getSession?.(userId);
        
        if (!session || (session.type !== 'search' && session.type !== 'random')) {
            return interaction.reply({
                content: '⏱️ Session expired (bot may have restarted). Please run the command again.',
                ephemeral: true
            });
        }

        await interaction.deferUpdate();

        const currentPage = session.currentPage || 1;
        const newPage = action === 'nextpage' ? currentPage + 1 : Math.max(1, currentPage - 1);

        let posts = [];
        let hasMore = false;

        if (session.type === 'random') {
            const prefs = rule34Cache?.getPreferences?.(userId) || {};
            const blacklist = rule34Cache?.getBlacklist?.(userId) || [];
            
            const rawPosts = await rule34Service.getRandom?.({
                tags: session.query || '',
                count: session.posts?.length || 10,
                excludeAi: prefs.aiFilter,
                minScore: prefs.minScore
            }) || await rule34Service.search(session.query || '', { limit: 10, sort: 'random' }).then(r => r.posts);
            
            posts = rawPosts?.filter(post => {
                const postTags = (post.tags || '').split(' ');
                return !postTags.some(t => blacklist.includes(t));
            }) || [];
            hasMore = posts.length > 0;
        } else {
            const searchOptions = {
                ...session.options,
                page: newPage - 1
            };

            const result = await rule34Service.search(session.query, searchOptions);
            posts = result?.posts || [];
            hasMore = result?.hasMore;
        }

        if (posts.length === 0) {
            return interaction.followUp({
                content: '❌ No more results found.',
                ephemeral: true
            });
        }

        rule34Cache?.updateSession?.(userId, {
            posts: posts,
            currentIndex: 0,
            currentPage: newPage,
            hasMore: hasMore
        });

        const post = posts[0];
        rule34Cache?.addToHistory?.(userId, post.id, { score: post.score });

        if (post.hasVideo && postHandler.createVideoEmbed) {
            const { embed, rows } = postHandler.createVideoEmbed(post, {
                resultIndex: 0,
                totalResults: posts.length,
                userId,
                searchPage: newPage
            });
            return interaction.editReply({ embeds: [embed], components: rows });
        }

        const { embed, rows } = await postHandler.createPostEmbed(post, {
            resultIndex: 0,
            totalResults: posts.length,
            query: session.query || 'random',
            userId,
            searchPage: newPage
        });

        return interaction.editReply({ embeds: [embed], components: rows });
    }

    async _handleFavoriteToggle(interaction, postId, userId) {
        const isFavorited = rule34Cache?.isFavorited?.(userId, parseInt(postId));
        
        if (isFavorited) {
            rule34Cache?.removeFavorite?.(userId, parseInt(postId));
            return interaction.reply({
                content: '💔 Removed from favorites.',
                ephemeral: true
            });
        } else {
            const session = rule34Cache?.getSession?.(userId);
            const post = session?.posts.find(p => p.id === parseInt(postId));
            
            rule34Cache?.addFavorite?.(userId, parseInt(postId), {
                score: post?.score,
                rating: post?.rating
            });
            
            return interaction.reply({
                content: '💖 Added to favorites!',
                ephemeral: true
            });
        }
    }

    async _handleTagsToggle(interaction, userId) {
        const session = rule34Cache?.getSession?.(userId);
        
        if (!session) {
            return interaction.reply({
                content: '⏱️ Session expired.',
                ephemeral: true
            });
        }

        await interaction.deferUpdate();

        const post = session.posts[session.currentIndex];
        const showTags = !session.showTags;
        
        rule34Cache?.updateSession?.(userId, { showTags });

        if (post.hasVideo && postHandler.createVideoEmbed) {
            const { embed, rows } = postHandler.createVideoEmbed(post, {
                resultIndex: session.currentIndex,
                totalResults: session.posts.length,
                userId,
                searchPage: session.currentPage || 1,
                showTags
            });
            return interaction.editReply({ embeds: [embed], components: rows });
        }

        const { embed, rows } = await postHandler.createPostEmbed(post, {
            resultIndex: session.currentIndex,
            totalResults: session.posts.length,
            query: session.query,
            userId,
            searchPage: session.currentPage || 1,
            showTags
        });

        return interaction.editReply({ embeds: [embed], components: rows });
    }

    async _handleRelatedFromPost(interaction, userId) {
        const session = rule34Cache?.getSession?.(userId);
        
        if (!session) {
            return interaction.reply({
                content: '⏱️ Session expired.',
                ephemeral: true
            });
        }

        const post = session.posts[session.currentIndex];
        const mainTags = post.tagList?.slice(0, 3) || (post.tags || '').split(' ').slice(0, 3);
        
        if (mainTags.length === 0) {
            return interaction.reply({
                content: '❌ No tags to find related content.',
                ephemeral: true
            });
        }

        const relatedTags = await rule34Service.getRelatedTags?.(mainTags[0], 15) || [];
        const embed = postHandler?.createRelatedTagsEmbed?.(mainTags[0], relatedTags) || 
            this.infoEmbed('Related Tags', relatedTags.map(t => `• ${t.name || t}`).join('\n') || 'No related tags found');
        
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async _handleSettingsReset(interaction, userId) {
        rule34Cache?.resetPreferences?.(userId);
        
        const embed = postHandler?.createSettingsEmbed?.(userId) || this.infoEmbed('Settings', 'Settings have been reset');
        const rows = postHandler?.createSettingsComponents?.(userId) || [];
        
        await interaction.update({ embeds: [embed], components: rows });
    }

    async handleSelectMenu(interaction) {
        const parts = interaction.customId.split('_');
        const setting = parts[2];
        const userId = parts[parts.length - 1];

        if (userId !== interaction.user.id) {
            return interaction.reply({
                content: '❌ This menu is not for you!',
                ephemeral: true
            });
        }

        const value = interaction.values[0];

        try {
            switch (setting) {
                case 'aifilter':
                    rule34Cache?.setPreferences?.(userId, { aiFilter: value === 'true' });
                    break;
                case 'sort':
                    rule34Cache?.setPreferences?.(userId, { sortMode: value });
                    break;
                case 'quality':
                    if (value === 'all') {
                        rule34Cache?.setPreferences?.(userId, { excludeLowQuality: false, highQualityOnly: false });
                    } else if (value === 'exclude_low') {
                        rule34Cache?.setPreferences?.(userId, { excludeLowQuality: true, highQualityOnly: false });
                    } else if (value === 'high_only') {
                        rule34Cache?.setPreferences?.(userId, { excludeLowQuality: false, highQualityOnly: true });
                    }
                    break;
                case 'minscore':
                    rule34Cache?.setPreferences?.(userId, { minScore: parseInt(value) });
                    break;
            }

            const embed = postHandler?.createSettingsEmbed?.(userId) || this.infoEmbed('Settings', 'Setting updated');
            const rows = postHandler?.createSettingsComponents?.(userId) || [];
            
            await interaction.update({ embeds: [embed], components: rows });
        } catch (error) {
            console.error('[Rule34 SelectMenu Error]', error);
            return interaction.reply({
                content: '❌ Failed to update setting.',
                ephemeral: true
            });
        }
    }
}

module.exports = new Rule34Command();
