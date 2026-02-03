"use strict";
/**
 * Favorites Handler
 * Handles favorites management
 * @module handlers/music/favoritesHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesHandler = void 0;
const trackHandler_js_1 = require("./trackHandler.js");
const voiceChannelCheck_js_1 = require("../../middleware/voiceChannelCheck.js");
const MusicFacade_js_1 = require("../../services/music/MusicFacade.js");
exports.favoritesHandler = {
    async handleFavorites(interaction, subcommand, userId) {
        switch (subcommand) {
            case 'list':
                return await this.handleFavoritesList(interaction, userId);
            case 'play':
                return await this.handleFavoritesPlay(interaction, userId);
            case 'remove':
                return await this.handleFavoritesRemove(interaction, userId);
            case 'clear':
                return await this.handleFavoritesClear(interaction, userId);
        }
    },
    async handleFavoritesList(interaction, userId) {
        const favorites = MusicFacade_js_1.musicFacade.getFavorites(userId);
        const page = interaction.options.getInteger('page') || 1;
        const embed = trackHandler_js_1.trackHandler.createFavoritesEmbed(favorites, userId, page);
        await interaction.reply({ embeds: [embed] });
    },
    async handleFavoritesPlay(interaction, userId) {
        const number = interaction.options.getInteger('number');
        const favorites = MusicFacade_js_1.musicFacade.getFavorites(userId);
        if (number > favorites.length) {
            await interaction.reply({
                embeds: [trackHandler_js_1.trackHandler.createErrorEmbed(`Invalid number. You only have ${favorites.length} favorites.`)],
                ephemeral: true
            });
            return;
        }
        const favorite = favorites[number - 1];
        if (!await (0, voiceChannelCheck_js_1.checkVoiceChannel)(interaction))
            return;
        if (!await (0, voiceChannelCheck_js_1.checkVoicePermissions)(interaction))
            return;
        await interaction.deferReply();
        const guildId = interaction.guild.id;
        await MusicFacade_js_1.musicFacade.connect(interaction);
        const trackData = await MusicFacade_js_1.musicFacade.search(favorite.url);
        if (!trackData) {
            await interaction.editReply({
                embeds: [trackHandler_js_1.trackHandler.createErrorEmbed('Failed to load favorite track')]
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
    async handleFavoritesRemove(interaction, userId) {
        const number = interaction.options.getInteger('number');
        const favorites = MusicFacade_js_1.musicFacade.getFavorites(userId);
        if (number > favorites.length) {
            await interaction.reply({
                embeds: [trackHandler_js_1.trackHandler.createErrorEmbed(`Invalid number. You only have ${favorites.length} favorites.`)],
                ephemeral: true
            });
            return;
        }
        const removed = favorites[number - 1];
        MusicFacade_js_1.musicFacade.removeFavorite(userId, removed.url);
        await interaction.reply({
            embeds: [trackHandler_js_1.trackHandler.createInfoEmbed('💔 Removed', `Removed **${removed.title}** from favorites`, 'success')]
        });
    },
    async handleFavoritesClear(interaction, userId) {
        const favorites = MusicFacade_js_1.musicFacade.getFavorites(userId);
        if (favorites.length === 0) {
            await interaction.reply({
                embeds: [trackHandler_js_1.trackHandler.createInfoEmbed('💖 Favorites', 'You have no favorites to clear.')],
                ephemeral: true
            });
            return;
        }
        // Clear all favorites
        favorites.forEach(fav => MusicFacade_js_1.musicFacade.removeFavorite(userId, fav.url));
        await interaction.reply({
            embeds: [trackHandler_js_1.trackHandler.createInfoEmbed('🗑️ Cleared', 'All favorites have been cleared', 'success')]
        });
    }
};
exports.default = exports.favoritesHandler;
//# sourceMappingURL=favoritesHandler.js.map