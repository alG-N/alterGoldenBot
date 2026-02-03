"use strict";
/**
 * Wikipedia Command - Presentation Layer
 * Search and display Wikipedia articles
 * @module presentation/commands/api/wikipedia
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const index_js_1 = require("../../services/index.js");
// SERVICE IMPORTS
let wikipediaService;
let wikipediaHandler;
const getDefault = (mod) => mod.default || mod;
try {
    wikipediaService = getDefault(require('../../services/api/wikipediaService'));
    wikipediaHandler = getDefault(require('../../handlers/api/wikipediaHandler'));
}
catch (e) {
    console.warn('[Wikipedia] Could not load services:', e.message);
}
// COMMAND
class WikipediaCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.API,
            cooldown: 3,
            deferReply: true
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('wikipedia')
            .setDescription('Search and browse Wikipedia articles')
            .addSubcommand(sub => sub
            .setName('search')
            .setDescription('Search for Wikipedia articles')
            .addStringOption(option => option.setName('query')
            .setDescription('What to search for')
            .setRequired(true)
            .setMaxLength(200)
            .setAutocomplete(true)))
            .addSubcommand(sub => sub
            .setName('article')
            .setDescription('Get a specific article by title')
            .addStringOption(option => option.setName('title')
            .setDescription('Article title')
            .setRequired(true)
            .setMaxLength(200)
            .setAutocomplete(true))
            .addStringOption(option => option.setName('language')
            .setDescription('Wikipedia language')
            .setRequired(false)
            .addChoices({ name: 'English', value: 'en' }, { name: 'Japanese', value: 'ja' }, { name: 'German', value: 'de' }, { name: 'French', value: 'fr' }, { name: 'Spanish', value: 'es' })))
            .addSubcommand(sub => sub
            .setName('random')
            .setDescription('Get a random Wikipedia article')
            .addStringOption(option => option.setName('language')
            .setDescription('Wikipedia language')
            .setRequired(false)
            .addChoices({ name: 'English', value: 'en' }, { name: 'Japanese', value: 'ja' }, { name: 'German', value: 'de' }, { name: 'French', value: 'fr' }, { name: 'Spanish', value: 'es' })))
            .addSubcommand(sub => sub
            .setName('today')
            .setDescription('Get events that happened on this day in history'));
    }
    async run(interaction) {
        // Access control
        const access = await (0, index_js_1.checkAccess)(interaction, index_js_1.AccessType.SUB);
        if (access.blocked) {
            await interaction.reply({ embeds: [access.embed], ephemeral: true });
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        try {
            switch (subcommand) {
                case 'search':
                    await this._handleSearch(interaction);
                    break;
                case 'article':
                    await this._handleArticle(interaction);
                    break;
                case 'random':
                    await this._handleRandom(interaction);
                    break;
                case 'today':
                    await this._handleToday(interaction);
                    break;
            }
        }
        catch (error) {
            console.error('[Wikipedia]', error);
            await this.errorReply(interaction, 'An error occurred while fetching Wikipedia data.');
        }
    }
    async _handleSearch(interaction) {
        const query = interaction.options.getString('query', true);
        const result = await wikipediaService.search(query);
        if (!result || !result.results?.length) {
            await this.errorReply(interaction, `No Wikipedia articles found for: **${query}**`);
            return;
        }
        const embed = wikipediaHandler.createSearchResultsEmbed(query, result.results);
        await this.safeReply(interaction, { embeds: [embed] });
    }
    async _handleArticle(interaction) {
        const title = interaction.options.getString('title', true);
        const language = interaction.options.getString('language') || 'en';
        const article = await wikipediaService.getArticle(title, language);
        if (!article) {
            await this.errorReply(interaction, `Article not found: **${title}**`);
            return;
        }
        const embed = wikipediaHandler.createArticleEmbed(article);
        const buttons = wikipediaHandler.createArticleButtons(article);
        await this.safeReply(interaction, { embeds: [embed], components: [buttons] });
    }
    async _handleRandom(interaction) {
        const language = interaction.options.getString('language') || 'en';
        const article = await wikipediaService.getRandomArticle(language);
        if (!article) {
            await this.errorReply(interaction, 'Failed to fetch random article.');
            return;
        }
        const embed = wikipediaHandler.createArticleEmbed(article);
        const buttons = wikipediaHandler.createArticleButtons(article);
        await this.safeReply(interaction, { embeds: [embed], components: [buttons] });
    }
    async _handleToday(interaction) {
        const events = await wikipediaService.getOnThisDay();
        if (!events || !events.length) {
            await this.errorReply(interaction, 'Failed to fetch events for today.');
            return;
        }
        const embed = wikipediaHandler.createOnThisDayEmbed(events);
        await this.safeReply(interaction, { embeds: [embed] });
    }
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        if (!focused || focused.length < 2) {
            await interaction.respond([]).catch(() => { });
            return;
        }
        try {
            const suggestions = await wikipediaService.autocomplete(focused);
            const choices = suggestions.slice(0, 25).map(s => ({
                name: s.slice(0, 100),
                value: s.slice(0, 100)
            }));
            await interaction.respond(choices).catch(() => { });
        }
        catch {
            await interaction.respond([]).catch(() => { });
        }
    }
}
exports.default = new WikipediaCommand();
//# sourceMappingURL=wikipedia.js.map