"use strict";
/**
 * Steam Command - Presentation Layer
 * Steam game utilities
 * @module presentation/commands/api/steam
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const index_js_1 = require("../../services/index.js");
// SERVICE IMPORTS
let handleSaleCommand;
const getDefault = (mod) => mod.default || mod;
try {
    const steamHandler = getDefault(require('../../handlers/api/steamSaleHandler'));
    handleSaleCommand = steamHandler.handleSaleCommand;
}
catch (e) {
    console.warn('[Steam] Could not load handler:', e.message);
}
// COMMAND
class SteamCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.API,
            cooldown: 10,
            deferReply: false // Handler manages defer
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('steam')
            .setDescription('Steam game utilities')
            .addSubcommand(subcommand => subcommand
            .setName('sale')
            .setDescription('Find games on sale with a minimum discount percentage')
            .addIntegerOption(option => option
            .setName('discount')
            .setDescription('Minimum discount percentage (0-100, 0 = free games)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(100))
            .addBooleanOption(option => option
            .setName('detailed')
            .setDescription('Show detailed info (owners, ratings) from SteamSpy')
            .setRequired(false)));
    }
    async run(interaction) {
        // Access control
        const access = await (0, index_js_1.checkAccess)(interaction, index_js_1.AccessType.SUB);
        if (access.blocked) {
            await interaction.reply({ embeds: [access.embed], ephemeral: true });
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'sale' && handleSaleCommand) {
            await handleSaleCommand(interaction);
            return;
        }
        await this.errorReply(interaction, 'Steam sale handler not available.');
    }
}
exports.default = new SteamCommand();
//# sourceMappingURL=steam.js.map