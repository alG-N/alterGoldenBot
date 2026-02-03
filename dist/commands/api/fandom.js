"use strict";
/**
 * Fandom Command - Presentation Layer
 * Search and browse wiki articles from Fandom
 * @module presentation/commands/api/fandom
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const index_js_1 = require("../../services/index.js");
// SERVICE IMPORTS
let fandomService;
const getDefault = (mod) => mod.default || mod;
try {
    fandomService = getDefault(require('../../services/api/fandomService'));
}
catch (e) {
    console.warn('[Fandom] Could not load service:', e.message);
}
// COMMAND
class FandomCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.API,
            cooldown: 3,
            deferReply: true
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('fandom')
            .setDescription('Search Fandom wikis for games, anime, movies, and more')
            .addSubcommand(sub => sub
            .setName('search')
            .setDescription('Search for articles in a wiki')
            .addStringOption(opt => opt
            .setName('wiki')
            .setDescription('Wiki name (e.g., genshin, naruto, marvel, minecraft)')
            .setRequired(true)
            .setAutocomplete(true))
            .addStringOption(opt => opt
            .setName('query')
            .setDescription('What to search for')
            .setRequired(true)
            .setAutocomplete(true)))
            .addSubcommand(sub => sub
            .setName('article')
            .setDescription('Get a specific article from a wiki')
            .addStringOption(opt => opt
            .setName('wiki')
            .setDescription('Wiki name (e.g., genshin, naruto, marvel)')
            .setRequired(true)
            .setAutocomplete(true))
            .addStringOption(opt => opt
            .setName('title')
            .setDescription('Article title')
            .setRequired(true)
            .setAutocomplete(true)))
            .addSubcommand(sub => sub
            .setName('random')
            .setDescription('Get a random article from a wiki')
            .addStringOption(opt => opt
            .setName('wiki')
            .setDescription('Wiki name (e.g., genshin, naruto, marvel)')
            .setRequired(true)
            .setAutocomplete(true)))
            .addSubcommand(sub => sub
            .setName('info')
            .setDescription('Get information about a wiki')
            .addStringOption(opt => opt
            .setName('wiki')
            .setDescription('Wiki name (e.g., genshin, naruto, marvel)')
            .setRequired(true)
            .setAutocomplete(true)));
    }
    async run(interaction) {
        // Access control
        const access = await (0, index_js_1.checkAccess)(interaction, index_js_1.AccessType.SUB);
        if (access.blocked) {
            await interaction.reply({ embeds: [access.embed], ephemeral: true });
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        const wiki = interaction.options.getString('wiki', true);
        try {
            switch (subcommand) {
                case 'search':
                    await this._handleSearch(interaction, wiki);
                    break;
                case 'article':
                    await this._handleArticle(interaction, wiki);
                    break;
                case 'random':
                    await this._handleRandom(interaction, wiki);
                    break;
                case 'info':
                    await this._handleInfo(interaction, wiki);
                    break;
            }
        }
        catch (error) {
            console.error('[Fandom]', error);
            await this.safeReply(interaction, { embeds: [this.errorEmbed('An error occurred while fetching Fandom data.')], ephemeral: true });
        }
    }
    async _handleSearch(interaction, wiki) {
        const query = interaction.options.getString('query', true);
        const result = await fandomService.search(wiki, query);
        if (!result?.success || !result?.results || result.results.length === 0) {
            await this.safeReply(interaction, { embeds: [this.errorEmbed(`No articles found for **${query}** on ${wiki} wiki.`)], ephemeral: true });
            return;
        }
        const results = result.results;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x00D6D6)
            .setTitle(`🔍 Search: "${query}" on ${result.wiki || wiki}`)
            .setDescription(results.slice(0, 10).map((r, i) => `**${i + 1}.** [${r.title}](${r.url})`).join('\n'))
            .setFooter({ text: `Found ${results.length} results` });
        await this.safeReply(interaction, { embeds: [embed] });
    }
    async _handleArticle(interaction, wiki) {
        const title = interaction.options.getString('title', true);
        const result = await fandomService.getArticle(wiki, title);
        if (!result?.success || !result?.article) {
            await this.safeReply(interaction, { embeds: [this.errorEmbed(result?.error || `Article **${title}** not found on ${wiki} wiki.`)], ephemeral: true });
            return;
        }
        const article = result.article;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x00D6D6)
            .setTitle(article.title)
            .setURL(article.url)
            .setDescription(article.extract?.slice(0, 4096) || 'No description available.')
            .setThumbnail(article.thumbnail || null)
            .setFooter({ text: `${article.wikiName || wiki} Wiki | Fandom` });
        const components = [];
        if (article.url) {
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setLabel('View on Fandom')
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(article.url));
            components.push(row);
        }
        await this.safeReply(interaction, { embeds: [embed], components });
    }
    async _handleRandom(interaction, wiki) {
        const result = await fandomService.getRandomArticle(wiki);
        if (!result?.success || !result?.article) {
            await this.safeReply(interaction, { embeds: [this.errorEmbed(result?.error || `Failed to get random article from ${wiki} wiki.`)], ephemeral: true });
            return;
        }
        const article = result.article;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x00D6D6)
            .setTitle(`🎲 ${article.title}`)
            .setURL(article.url)
            .setDescription(article.extract?.slice(0, 4096) || 'No description available.')
            .setThumbnail(article.thumbnail || null)
            .setFooter({ text: `Random article from ${article.wikiName || wiki} Wiki` });
        const components = [];
        if (article.url) {
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setLabel('View on Fandom')
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(article.url));
            components.push(row);
        }
        await this.safeReply(interaction, { embeds: [embed], components });
    }
    async _handleInfo(interaction, wiki) {
        const result = await fandomService.getWikiInfo(wiki);
        if (!result?.success || !result?.info) {
            await this.safeReply(interaction, { embeds: [this.errorEmbed(result?.error || `Wiki **${wiki}** not found.`)], ephemeral: true });
            return;
        }
        const info = result.info;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x00D6D6)
            .setTitle(info.name || wiki)
            .setURL(info.base || null)
            .setDescription(`A Fandom wiki with **${info.articles?.toLocaleString() || 'N/A'}** articles`)
            .addFields({ name: '📊 Statistics', value: `Articles: ${info.articles?.toLocaleString() || 'N/A'}\nPages: ${info.pages?.toLocaleString() || 'N/A'}\nEdits: ${info.edits?.toLocaleString() || 'N/A'}`, inline: true }, { name: '👥 Users', value: `Total: ${info.users?.toLocaleString() || 'N/A'}\nActive: ${info.activeUsers?.toLocaleString() || 'N/A'}`, inline: true })
            .setThumbnail(info.logo || null)
            .setFooter({ text: 'Powered by Fandom' });
        await this.safeReply(interaction, { embeds: [embed] });
    }
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);
        const wiki = interaction.options.getString('wiki');
        try {
            if (focused.name === 'wiki') {
                const query = focused.value;
                if (!query || query.length < 2) {
                    const popular = fandomService.getPopularWikis().slice(0, 15);
                    await interaction.respond(popular.map(w => ({ name: w.name, value: w.subdomain }))).catch(() => { });
                    return;
                }
                const suggestions = await fandomService.searchWikis(query);
                await interaction.respond(suggestions.map(w => ({ name: w.name, value: w.subdomain }))).catch(() => { });
                return;
            }
            if (focused.name === 'query' || focused.name === 'title') {
                if (!wiki || !focused.value || focused.value.length < 2) {
                    await interaction.respond([]).catch(() => { });
                    return;
                }
                const suggestions = await fandomService.autocomplete(wiki, focused.value);
                await interaction.respond(suggestions.slice(0, 25).map(s => ({
                    name: s.title.slice(0, 100),
                    value: s.title.slice(0, 100)
                }))).catch(() => { });
                return;
            }
        }
        catch {
            await interaction.respond([]).catch(() => { });
        }
    }
}
exports.default = new FandomCommand();
//# sourceMappingURL=fandom.js.map