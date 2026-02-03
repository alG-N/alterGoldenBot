/**
 * DeathBattle Embed Builder
 * @module utils/deathbattle/embedBuilder
 */

import { EmbedBuilder } from 'discord.js';
// TYPES
interface Player {
    username: string;
}

interface Skillset {
    displayName: string;
    thumbnail: string;
}

interface BattleState {
    skillset: Skillset;
    player1: Player;
    player2: Player;
    player1Health: number;
    player2Health: number;
    battleLog: string;
}
// DEATHBATTLE EMBED BUILDER CLASS
class DeathBattleEmbedBuilder {
    buildCountdownEmbed(battle: BattleState, countdown: number): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`⚔️ ${battle.skillset.displayName} Death-Battle ⚔️`)
            .setDescription(`⏳ Battle begins in **${countdown}** seconds!`)
            .setColor('#ff0000')
            .addFields(
                { name: `${battle.player1.username}'s HP`, value: `${battle.player1Health} HP`, inline: true },
                { name: `${battle.player2.username}'s HP`, value: `${battle.player2Health} HP`, inline: true }
            )
            .setThumbnail(battle.skillset.thumbnail)
            .setFooter({ text: 'Get ready for an epic showdown!' });
    }

    buildBattleEmbed(battle: BattleState): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`⚔️ ${battle.skillset.displayName} Death-Battle ⚔️`)
            .setDescription(battle.battleLog)
            .setColor('#ff0000')
            .addFields(
                { name: `${battle.player1.username}'s HP`, value: `${battle.player1Health > 0 ? battle.player1Health : 0} HP`, inline: true },
                { name: `${battle.player2.username}'s HP`, value: `${battle.player2Health > 0 ? battle.player2Health : 0} HP`, inline: true }
            )
            .setThumbnail(battle.skillset.thumbnail)
            .setFooter({ text: 'Who will win? Place your bet.' });
    }

    buildErrorEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription(message)
            .setTimestamp();
    }
}

// Export singleton instance
const deathBattleEmbedBuilder = new DeathBattleEmbedBuilder();
export default deathBattleEmbedBuilder;
export { DeathBattleEmbedBuilder };
export type { BattleState, Player, Skillset };
