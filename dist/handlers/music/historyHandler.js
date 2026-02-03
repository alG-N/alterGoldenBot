"use strict";
/**
 * History Handler
 * Handles listening history
 * @module handlers/music/historyHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyHandler = void 0;
const trackHandler_js_1 = require("./trackHandler.js");
const voiceChannelCheck_js_1 = require("../../middleware/voiceChannelCheck.js");
const MusicFacade_js_1 = require("../../services/music/MusicFacade.js");
exports.historyHandler = {
    async handleHistory(interaction, subcommand, userId) {
        switch (subcommand) {
            case 'list':
                return await this.handleHistoryList(interaction, userId);
            case 'play':
                return await this.handleHistoryPlay(interaction, userId);
            case 'clear':
                return await this.handleHistoryClear(interaction, userId);
        }
    },
    async handleHistoryList(interaction, userId) {
        const history = MusicFacade_js_1.musicFacade.getHistory(userId, 100);
        const page = interaction.options.getInteger('page') || 1;
        const embed = trackHandler_js_1.trackHandler.createHistoryEmbed(history, userId, page);
        await interaction.reply({ embeds: [embed] });
    },
    async handleHistoryPlay(interaction, userId) {
        const number = interaction.options.getInteger('number');
        const history = MusicFacade_js_1.musicFacade.getHistory(userId, 100);
        if (number > history.length) {
            await interaction.reply({
                embeds: [trackHandler_js_1.trackHandler.createErrorEmbed(`Invalid number. History only has ${history.length} items.`)],
                ephemeral: true
            });
            return;
        }
        const historyItem = history[number - 1];
        if (!await (0, voiceChannelCheck_js_1.checkVoiceChannel)(interaction))
            return;
        if (!await (0, voiceChannelCheck_js_1.checkVoicePermissions)(interaction))
            return;
        await interaction.deferReply();
        const guildId = interaction.guild.id;
        await MusicFacade_js_1.musicFacade.connect(interaction);
        const trackData = await MusicFacade_js_1.musicFacade.search(historyItem.url);
        if (!trackData) {
            await interaction.editReply({
                embeds: [trackHandler_js_1.trackHandler.createErrorEmbed('Failed to load track')]
            });
            return;
        }
        MusicFacade_js_1.musicFacade.addTrack(guildId, trackData);
        const currentTrack = MusicFacade_js_1.musicFacade.getCurrentTrack(guildId);
        if (!currentTrack) {
            const queue = MusicFacade_js_1.musicFacade.getQueueList(guildId);
            const nextTrack = queue[0];
            if (nextTrack) {
                MusicFacade_js_1.musicFacade.removeTrack(guildId, 0);
                await MusicFacade_js_1.musicFacade.playTrack(guildId, nextTrack);
            }
        }
        const position = currentTrack ? MusicFacade_js_1.musicFacade.getQueueLength(guildId) : 0;
        const embed = trackHandler_js_1.trackHandler.createQueuedEmbed(trackData, position, interaction.user);
        await interaction.editReply({ embeds: [embed] });
    },
    async handleHistoryClear(interaction, userId) {
        MusicFacade_js_1.musicFacade.clearHistory(userId);
        await interaction.reply({
            embeds: [trackHandler_js_1.trackHandler.createInfoEmbed('🗑️ Cleared', 'Listening history cleared', 'success')]
        });
    }
};
exports.default = exports.historyHandler;
//# sourceMappingURL=historyHandler.js.map