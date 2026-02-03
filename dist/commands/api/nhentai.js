"use strict";
/**
 * NHentai Command - Presentation Layer
 * Search and browse doujinshi from nhentai
 * @module presentation/commands/api/nhentai
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const index_js_1 = require("../../services/index.js");
// SERVICE IMPORTS
let nhentaiService;
let nhentaiHandler;
const getDefault = (mod) => mod.default || mod;
try {
    nhentaiService = getDefault(require('../../services/api/nhentaiService'));
    nhentaiHandler = getDefault(require('../../handlers/api/nhentaiHandler'));
}
catch (e) {
    console.warn('[NHentai] Could not load services:', e.message);
}
// COMMAND
class NHentaiCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.API,
            cooldown: 3,
            deferReply: true,
            nsfw: true
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('nhentai')
            .setDescription('Search and browse doujinshi from nhentai (NSFW only)')
            .setNSFW(true)
            .addSubcommand(sub => sub
            .setName('code')
            .setDescription('Get a gallery by its code')
            .addIntegerOption(opt => opt
            .setName('code')
            .setDescription('The 6-digit nhentai code')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(999999)))
            .addSubcommand(sub => sub
            .setName('random')
            .setDescription('Get a random gallery'))
            .addSubcommand(sub => sub
            .setName('popular')
            .setDescription('Get a popular gallery'))
            .addSubcommand(sub => sub
            .setName('search')
            .setDescription('Search for galleries by tag')
            .addStringOption(opt => opt
            .setName('query')
            .setDescription('Search query (tag, artist, parody, etc.)')
            .setRequired(true))
            .addStringOption(opt => opt
            .setName('sort')
            .setDescription('Sort order')
            .setRequired(false)
            .addChoices({ name: '📅 Recent', value: 'recent' }, { name: '🔥 Popular Today', value: 'popular-today' }, { name: '📊 Popular This Week', value: 'popular-week' }, { name: '📈 All Time Popular', value: 'popular' }))
            .addIntegerOption(opt => opt
            .setName('page')
            .setDescription('Page number')
            .setMinValue(1)
            .setMaxValue(100)))
            .addSubcommand(sub => sub
            .setName('favourites')
            .setDescription('View your saved favourites'));
    }
    async run(interaction) {
        // Access control
        const access = await (0, index_js_1.checkAccess)(interaction, index_js_1.AccessType.SUB);
        if (access.blocked) {
            await interaction.reply({ embeds: [access.embed], ephemeral: true });
            return;
        }
        // NSFW check
        const channel = interaction.channel;
        const isNsfw = channel && 'nsfw' in channel ? channel.nsfw : false;
        if (!isNsfw) {
            await this.safeReply(interaction, {
                embeds: [this.errorEmbed('🔞 This command can only be used in NSFW channels.')],
                ephemeral: true
            });
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        try {
            switch (subcommand) {
                case 'code':
                    await this._handleCode(interaction);
                    break;
                case 'random':
                    await this._handleRandom(interaction);
                    break;
                case 'popular':
                    await this._handlePopular(interaction);
                    break;
                case 'search':
                    await this._handleSearch(interaction);
                    break;
                case 'favourites':
                    await this._handleFavourites(interaction);
                    break;
            }
        }
        catch (error) {
            console.error('[NHentai]', error);
            await this.safeReply(interaction, {
                embeds: [this.errorEmbed('An error occurred while fetching data from nhentai.')],
                ephemeral: true
            });
        }
    }
    async _handleCode(interaction) {
        const code = interaction.options.getInteger('code', true);
        const result = await nhentaiService.fetchGallery(code);
        if (!result?.success || !result.data) {
            await this.safeReply(interaction, {
                embeds: [this.errorEmbed(`Gallery **${code}** not found or unavailable.`)],
                ephemeral: true
            });
            return;
        }
        const embed = nhentaiHandler.createGalleryEmbed(result.data);
        const buttons = await nhentaiHandler.createMainButtons(result.data.id, interaction.user.id, result.data.num_pages, result.data);
        await this.safeReply(interaction, { embeds: [embed], components: buttons });
    }
    async _handleRandom(interaction) {
        const result = await nhentaiService.fetchRandomGallery();
        if (!result?.success || !result.data) {
            await this.safeReply(interaction, {
                embeds: [this.errorEmbed('Could not fetch a random gallery. Please try again.')],
                ephemeral: true
            });
            return;
        }
        const embed = nhentaiHandler.createGalleryEmbed(result.data, { isRandom: true });
        const buttons = await nhentaiHandler.createMainButtons(result.data.id, interaction.user.id, result.data.num_pages, result.data);
        await this.safeReply(interaction, { embeds: [embed], components: buttons });
    }
    async _handlePopular(interaction) {
        const result = await nhentaiService.fetchPopularGallery();
        if (!result?.success || !result.data) {
            await this.safeReply(interaction, {
                embeds: [this.errorEmbed('Could not fetch a popular gallery. Please try again.')],
                ephemeral: true
            });
            return;
        }
        const embed = nhentaiHandler.createGalleryEmbed(result.data, { isPopular: true });
        const buttons = await nhentaiHandler.createMainButtons(result.data.id, interaction.user.id, result.data.num_pages, result.data);
        await this.safeReply(interaction, { embeds: [embed], components: buttons });
    }
    async _handleSearch(interaction) {
        const query = interaction.options.getString('query', true);
        const sort = interaction.options.getString('sort') || 'recent';
        const page = interaction.options.getInteger('page') || 1;
        const result = await nhentaiService.search(query, { sort, page });
        if (!result?.success || !result?.data?.length) {
            await this.safeReply(interaction, {
                embeds: [this.errorEmbed(`No results found for **${query}**.`)],
                ephemeral: true
            });
            return;
        }
        // Show first result with navigation
        const embed = nhentaiHandler.createSearchResultsEmbed?.(result.data, query, { page, sort })
            || nhentaiHandler.createGalleryEmbed(result.data[0]);
        const buttons = await nhentaiHandler.createMainButtons(result.data[0].id, interaction.user.id, result.data[0].num_pages, result.data[0]);
        await this.safeReply(interaction, { embeds: [embed], components: buttons });
    }
    async _handleFavourites(interaction) {
        const result = await nhentaiHandler.createFavouritesEmbed(interaction.user.id);
        if (!result?.embed) {
            await this.safeReply(interaction, {
                embeds: [this.errorEmbed('You have no saved favourites yet.')],
                ephemeral: true
            });
            return;
        }
        await this.safeReply(interaction, {
            embeds: [result.embed],
            components: result.buttons || []
        });
    }
    async handleButton(interaction) {
        await nhentaiHandler?.handleButton?.(interaction);
    }
    async handleModal(interaction) {
        await nhentaiHandler?.handleModal?.(interaction);
    }
}
exports.default = new NHentaiCommand();
//# sourceMappingURL=nhentai.js.map