"use strict";
/**
 * DeathBattle Embed Builder
 * @module utils/deathbattle/embedBuilder
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeathBattleEmbedBuilder = void 0;
const discord_js_1 = require("discord.js");
// DEATHBATTLE EMBED BUILDER CLASS
class DeathBattleEmbedBuilder {
    buildCountdownEmbed(battle, countdown) {
        return new discord_js_1.EmbedBuilder()
            .setTitle(`⚔️ ${battle.skillset.displayName} Death-Battle ⚔️`)
            .setDescription(`⏳ Battle begins in **${countdown}** seconds!`)
            .setColor('#ff0000')
            .addFields({ name: `${battle.player1.username}'s HP`, value: `${battle.player1Health} HP`, inline: true }, { name: `${battle.player2.username}'s HP`, value: `${battle.player2Health} HP`, inline: true })
            .setThumbnail(battle.skillset.thumbnail)
            .setFooter({ text: 'Get ready for an epic showdown!' });
    }
    buildBattleEmbed(battle) {
        return new discord_js_1.EmbedBuilder()
            .setTitle(`⚔️ ${battle.skillset.displayName} Death-Battle ⚔️`)
            .setDescription(battle.battleLog)
            .setColor('#ff0000')
            .addFields({ name: `${battle.player1.username}'s HP`, value: `${battle.player1Health > 0 ? battle.player1Health : 0} HP`, inline: true }, { name: `${battle.player2.username}'s HP`, value: `${battle.player2Health > 0 ? battle.player2Health : 0} HP`, inline: true })
            .setThumbnail(battle.skillset.thumbnail)
            .setFooter({ text: 'Who will win? Place your bet.' });
    }
    buildErrorEmbed(message) {
        return new discord_js_1.EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription(message)
            .setTimestamp();
    }
}
exports.DeathBattleEmbedBuilder = DeathBattleEmbedBuilder;
// Export singleton instance
const deathBattleEmbedBuilder = new DeathBattleEmbedBuilder();
exports.default = deathBattleEmbedBuilder;
//# sourceMappingURL=embedBuilder.js.map