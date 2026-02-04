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
    getUsername(player) {
        return 'username' in player ? player.username : player.username;
    }
    getSkillsetName(battle) {
        return battle.skillset?.displayName || battle.skillsetName || 'Death-Battle';
    }
    getThumbnail(battle) {
        return battle.skillset?.thumbnail || 'https://i.imgur.com/AfFp7pu.png';
    }
    buildCountdownEmbed(battle, countdown) {
        const p1Name = this.getUsername(battle.player1);
        const p2Name = this.getUsername(battle.player2);
        return new discord_js_1.EmbedBuilder()
            .setTitle(`⚔️ ${this.getSkillsetName(battle)} Death-Battle ⚔️`)
            .setDescription(`⏳ Battle begins in **${countdown}** seconds!`)
            .setColor(0xff0000)
            .addFields({ name: `${p1Name}'s HP`, value: `${battle.player1Health} HP`, inline: true }, { name: `${p2Name}'s HP`, value: `${battle.player2Health} HP`, inline: true })
            .setThumbnail(this.getThumbnail(battle))
            .setFooter({ text: 'Get ready for an epic showdown!' });
    }
    buildRoundEmbed(battle, result) {
        const p1Name = this.getUsername(battle.player1);
        const p2Name = this.getUsername(battle.player2);
        const p1MaxHp = battle.player1MaxHp || battle.player1Health;
        const p2MaxHp = battle.player2MaxHp || battle.player2Health;
        // Build health bar
        const p1HealthPercent = Math.max(0, Math.min(100, (battle.player1Health / p1MaxHp) * 100));
        const p2HealthPercent = Math.max(0, Math.min(100, (battle.player2Health / p2MaxHp) * 100));
        const p1HealthBar = this.buildHealthBar(p1HealthPercent);
        const p2HealthBar = this.buildHealthBar(p2HealthPercent);
        // Combine action log
        let description = `**Round ${battle.roundCount || 1}**\n\n`;
        description += `${result.skill}\n\n`;
        // Add effect logs if present
        if (result.effectLogs && result.effectLogs.length > 0) {
            description += result.effectLogs.join('\n') + '\n\n';
        }
        return new discord_js_1.EmbedBuilder()
            .setTitle(`⚔️ ${this.getSkillsetName(battle)} Death-Battle ⚔️`)
            .setDescription(description)
            .setColor(0xff6600)
            .addFields({
            name: `${p1Name}`,
            value: `${p1HealthBar}\n\`${Math.max(0, battle.player1Health).toLocaleString()} / ${p1MaxHp.toLocaleString()} HP\``,
            inline: true
        }, {
            name: `${p2Name}`,
            value: `${p2HealthBar}\n\`${Math.max(0, battle.player2Health).toLocaleString()} / ${p2MaxHp.toLocaleString()} HP\``,
            inline: true
        })
            .setThumbnail(this.getThumbnail(battle))
            .setFooter({ text: 'The battle rages on...' });
    }
    buildWinnerEmbed(battle) {
        const p1Name = this.getUsername(battle.player1);
        const p2Name = this.getUsername(battle.player2);
        const winner = battle.player1Health > 0 ? battle.player1 : battle.player2;
        const loser = battle.player1Health > 0 ? battle.player2 : battle.player1;
        const winnerName = this.getUsername(winner);
        const loserName = this.getUsername(loser);
        const winnerHp = battle.player1Health > 0 ? battle.player1Health : battle.player2Health;
        const winnerMaxHp = battle.player1Health > 0
            ? (battle.player1MaxHp || battle.player1Health)
            : (battle.player2MaxHp || battle.player2Health);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`🏆 ${this.getSkillsetName(battle)} Death-Battle - WINNER! 🏆`)
            .setDescription(`**${winnerName}** has defeated **${loserName}** in **${battle.roundCount || 1}** rounds!`)
            .setColor(0x00ff00)
            .addFields({ name: '🎖️ Winner', value: winnerName, inline: true }, { name: '💀 Defeated', value: loserName, inline: true }, { name: '❤️ Remaining HP', value: `${winnerHp.toLocaleString()} / ${winnerMaxHp.toLocaleString()}`, inline: true })
            .setThumbnail(this.getThumbnail(battle))
            .setFooter({ text: 'Click "View Battle Log" to see the full battle history!' })
            .setTimestamp();
        // Create button row for viewing battle log
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('deathbattle_viewlog')
            .setLabel('📜 View Battle Log')
            .setStyle(discord_js_1.ButtonStyle.Primary));
        return { embed, row };
    }
    /**
     * Build the battle log embed showing full history
     */
    buildBattleLogEmbed(battle, history, page = 0) {
        const p1Name = this.getUsername(battle.player1);
        const p2Name = this.getUsername(battle.player2);
        const entriesPerPage = 8;
        const totalPages = Math.ceil(history.length / entriesPerPage);
        const currentPage = Math.max(0, Math.min(page, totalPages - 1));
        const startIdx = currentPage * entriesPerPage;
        const pageEntries = history.slice(startIdx, startIdx + entriesPerPage);
        let description = `**Full Battle Log** (Page ${currentPage + 1}/${totalPages})\n\n`;
        for (const entry of pageEntries) {
            const modStr = entry.modifiers.length > 0 ? ` (${entry.modifiers.join(', ')})` : '';
            description += `**Round ${entry.round}**: ${entry.attacker}\n`;
            description += `└ ${entry.action}: **${entry.baseDamage}** → **${entry.finalDamage}**${modStr}\n`;
            description += `└ HP: ${p1Name}: ${entry.p1HpAfter.toLocaleString()} | ${p2Name}: ${entry.p2HpAfter.toLocaleString()}\n`;
            if (entry.effectsApplied.length > 0) {
                description += `└ Effects: ${entry.effectsApplied.slice(0, 2).join(', ')}\n`;
            }
            description += '\n';
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`📜 ${this.getSkillsetName(battle)} Battle History`)
            .setDescription(description)
            .setColor(0x3498db)
            .setThumbnail(this.getThumbnail(battle))
            .setFooter({ text: `Total Rounds: ${history.length}` });
        // Pagination buttons if needed
        let row = null;
        if (totalPages > 1) {
            row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`deathbattle_log_prev_${currentPage}`)
                .setLabel('◀️ Previous')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(currentPage === 0), new discord_js_1.ButtonBuilder()
                .setCustomId(`deathbattle_log_next_${currentPage}`)
                .setLabel('Next ▶️')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(currentPage >= totalPages - 1));
        }
        return { embed, row };
    }
    buildBattleEmbed(battle) {
        const p1Name = this.getUsername(battle.player1);
        const p2Name = this.getUsername(battle.player2);
        return new discord_js_1.EmbedBuilder()
            .setTitle(`⚔️ ${this.getSkillsetName(battle)} Death-Battle ⚔️`)
            .setDescription(battle.battleLog)
            .setColor(0xff0000)
            .addFields({ name: `${p1Name}'s HP`, value: `${battle.player1Health > 0 ? battle.player1Health : 0} HP`, inline: true }, { name: `${p2Name}'s HP`, value: `${battle.player2Health > 0 ? battle.player2Health : 0} HP`, inline: true })
            .setThumbnail(this.getThumbnail(battle))
            .setFooter({ text: 'Who will win? Place your bet.' });
    }
    buildErrorEmbed(message) {
        return new discord_js_1.EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Error')
            .setDescription(message)
            .setTimestamp();
    }
    buildHealthBar(percent) {
        const filled = Math.round(percent / 10);
        const empty = 10 - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return `[${bar}] ${Math.round(percent)}%`;
    }
}
exports.DeathBattleEmbedBuilder = DeathBattleEmbedBuilder;
// Export singleton instance
const deathBattleEmbedBuilder = new DeathBattleEmbedBuilder();
exports.default = deathBattleEmbedBuilder;
//# sourceMappingURL=embedBuilder.js.map