"use strict";
/**
 * Google Command - Presentation Layer
 * Search the web using Google Custom Search or DuckDuckGo fallback
 * @module presentation/commands/api/google
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const constants_js_1 = require("../../constants.js");
const index_js_1 = require("../../services/index.js");
// SERVICE IMPORTS
let googleService;
let googleHandler;
let cooldownManager;
let COOLDOWN_SETTINGS;
const getDefault = (mod) => mod.default || mod;
try {
    googleService = getDefault(require('../../services/api/googleService'));
    googleHandler = getDefault(require('../../handlers/api/googleHandler'));
    const cooldown = getDefault(require('../../utils/common/cooldown'));
    cooldownManager = cooldown.cooldownManager;
    COOLDOWN_SETTINGS = cooldown.COOLDOWN_SETTINGS;
}
catch (e) {
    console.warn('[Google] Could not load services:', e.message);
}
// COMMAND
class GoogleCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.API,
            cooldown: 3,
            deferReply: false // Manual for subcommand handling
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('google')
            .setDescription('Search the web')
            .addSubcommand(sub => sub
            .setName('search')
            .setDescription('Search for websites and information')
            .addStringOption(option => option.setName('query')
            .setDescription('What to search for')
            .setRequired(true)
            .setMaxLength(200))
            .addBooleanOption(option => option.setName('safe')
            .setDescription('Enable SafeSearch filter (default: true)')
            .setRequired(false)))
            .addSubcommand(sub => sub
            .setName('image')
            .setDescription('Open image search in browser')
            .addStringOption(option => option.setName('query')
            .setDescription('What to search for')
            .setRequired(true)
            .setMaxLength(200)));
    }
    async run(interaction) {
        // Access control
        const access = await (0, index_js_1.checkAccess)(interaction, index_js_1.AccessType.SUB);
        if (access.blocked) {
            await interaction.reply({ embeds: [access.embed], ephemeral: true });
            return;
        }
        // Cooldown check
        if (cooldownManager && COOLDOWN_SETTINGS) {
            const cooldown = cooldownManager.check(interaction.user.id, 'google', COOLDOWN_SETTINGS.google);
            if (cooldown.onCooldown) {
                const embed = googleHandler?.createCooldownEmbed?.(cooldown.remaining) ||
                    new discord_js_1.EmbedBuilder()
                        .setColor(constants_js_1.COLORS.WARNING)
                        .setDescription(`⏳ Please wait ${cooldown.remaining}s before searching again.`);
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
        }
        const subcommand = interaction.options.getSubcommand();
        const query = interaction.options.getString('query', true);
        if (subcommand === 'image') {
            await this._handleImageSearch(interaction, query);
            return;
        }
        await this._handleWebSearch(interaction, query);
    }
    async _handleImageSearch(interaction, query) {
        const searchEngine = googleService?.getSearchEngine?.() || 'Google';
        const url = searchEngine === 'Google'
            ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
            : `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
        await interaction.reply({
            content: `🖼️ **Image Search:** [Click here to search "${query}"](${url})`,
            ephemeral: false
        });
    }
    async _handleWebSearch(interaction, query) {
        await interaction.deferReply();
        try {
            const safeSearch = interaction.options.getBoolean('safe') ?? true;
            const result = await googleService.search(query, {
                safeSearch,
                maxResults: 5
            });
            if (!result.success) {
                const errorEmbed = googleHandler?.createErrorEmbed?.(result.error || 'Unknown error') ||
                    new discord_js_1.EmbedBuilder()
                        .setColor(constants_js_1.COLORS.ERROR)
                        .setTitle('❌ Search Failed')
                        .setDescription(result.error || 'Unknown error');
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }
            const embed = googleHandler?.createResultsEmbed?.(query, result.results || [], {
                totalResults: result.totalResults,
                searchEngine: result.searchEngine
            }) || this._createResultsEmbed(query, result);
            const buttons = googleHandler?.createSearchButtons?.(query, result.searchEngine) ||
                this._createSearchButtons(query);
            await interaction.editReply({ embeds: [embed], components: [buttons] });
        }
        catch (error) {
            console.error('[Google Command]', error);
            await interaction.editReply({
                embeds: [new discord_js_1.EmbedBuilder()
                        .setColor(constants_js_1.COLORS.ERROR)
                        .setTitle('❌ Error')
                        .setDescription('An unexpected error occurred. Please try again.')
                ]
            });
        }
    }
    _createResultsEmbed(query, result) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(constants_js_1.COLORS.PRIMARY)
            .setTitle(`🔍 Search Results: ${query}`)
            .setFooter({ text: `Powered by ${result.searchEngine || 'Web Search'}` });
        if (result.results && result.results.length > 0) {
            const description = result.results.map((r, i) => `**${i + 1}.** [${r.title}](${r.link})\n${r.snippet || ''}`).join('\n\n');
            embed.setDescription(description.slice(0, 4096));
        }
        else {
            embed.setDescription('No results found.');
        }
        return embed;
    }
    _createSearchButtons(query) {
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel('View on Google')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`)
            .setEmoji('🔍'), new discord_js_1.ButtonBuilder()
            .setLabel('View on DuckDuckGo')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`)
            .setEmoji('🦆'));
    }
}
exports.default = new GoogleCommand();
//# sourceMappingURL=google.js.map