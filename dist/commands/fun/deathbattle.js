"use strict";
/**
 * DeathBattle Command - Presentation Layer
 * Anime-themed death battle game
 * @module presentation/commands/fun/deathbattle
 */
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const index_js_1 = require("../../services/index.js");
// SERVICE IMPORTS
let skillsetService;
let battleService;
let embedBuilder;
let logger;
let config;
const getDefault = (mod) => mod.default || mod;
try {
    skillsetService = getDefault(require('../../services/fun/deathbattle/SkillsetService'));
    battleService = getDefault(require('../../services/fun/deathbattle/BattleService'));
    embedBuilder = getDefault(require('../../utils/deathbattle/embedBuilder'));
    logger = getDefault(require('../../utils/deathbattle/logger'));
    config = getDefault(require('../../config/deathbattle'));
}
catch (e) {
    console.warn('[DeathBattle] Could not load services:', e.message);
}
const MAX_HP = config?.MAX_HP || 10000;
const DEFAULT_HP = config?.DEFAULT_HP || 1000;
const COUNTDOWN_SECONDS = config?.COUNTDOWN_SECONDS || 3;
const ROUND_INTERVAL = config?.ROUND_INTERVAL || 2000;
// COMMAND
class DeathBattleCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.FUN,
            cooldown: 30,
            deferReply: false
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('deathbattle')
            .setDescription('Start a death battle with another user!')
            .addUserOption(option => option.setName('opponent')
            .setDescription('The user you want to battle')
            .setRequired(true))
            .addStringOption(option => option.setName('skillset')
            .setDescription('Skill set to use')
            .setRequired(true)
            .addChoices({ name: 'Jujutsu Kaisen', value: 'jjk' }, { name: 'Naruto', value: 'naruto' }, { name: 'Demon Slayer', value: 'demonslayer' }, { name: 'One Piece', value: 'onepiece' }, { name: 'Anime Crossover (All Powers)', value: 'crossover' }))
            .addIntegerOption(option => option.setName('your_hp')
            .setDescription(`Your HP (max ${MAX_HP.toLocaleString()})`)
            .setRequired(false))
            .addIntegerOption(option => option.setName('opponent_hp')
            .setDescription(`Opponent HP (max ${MAX_HP.toLocaleString()})`)
            .setRequired(false));
    }
    async run(interaction) {
        // Access control
        const access = await (0, index_js_1.checkAccess)(interaction, index_js_1.AccessType.SUB);
        if (access.blocked) {
            await interaction.reply({ embeds: [access.embed], ephemeral: true });
            return;
        }
        const opponent = interaction.options.getUser('opponent');
        const player1 = interaction.user;
        const skillsetName = interaction.options.getString('skillset', true);
        const player1Hp = interaction.options.getInteger('your_hp') || DEFAULT_HP;
        const player2Hp = interaction.options.getInteger('opponent_hp') || player1Hp;
        // Validation
        if (!opponent) {
            await interaction.reply({
                embeds: [embedBuilder.buildErrorEmbed('You need to select someone to battle!')],
                ephemeral: true
            });
            return;
        }
        if (!skillsetService?.isValidSkillset(skillsetName)) {
            const validSkillsets = skillsetService?.getAllSkillsets?.().join(', ') || 'jjk, naruto, demonslayer, onepiece';
            await interaction.reply({
                embeds: [embedBuilder.buildErrorEmbed(`Invalid skillset! Available: ${validSkillsets}`)],
                ephemeral: true
            });
            return;
        }
        if (opponent.id === player1.id) {
            await interaction.reply({
                embeds: [embedBuilder.buildErrorEmbed('You cannot fight yourself!')],
                ephemeral: true
            });
            return;
        }
        if (player1Hp > MAX_HP || player2Hp > MAX_HP) {
            await interaction.reply({
                embeds: [embedBuilder.buildErrorEmbed(`HP too high! Max is ${MAX_HP.toLocaleString()}.`)],
                ephemeral: true
            });
            return;
        }
        // Create battle
        const battle = await battleService.createBattle(interaction.guild.id, player1, opponent, skillsetName, player1Hp, player2Hp);
        if (!battle) {
            await interaction.reply({
                embeds: [embedBuilder.buildErrorEmbed('A battle is already in progress in this server! Wait for it to finish.')],
                ephemeral: true
            });
            return;
        }
        logger?.log(`Battle started: ${player1.tag} vs ${opponent.tag} (${skillsetName})`, interaction);
        // Start countdown
        let countdown = COUNTDOWN_SECONDS;
        let battleEmbed = embedBuilder.buildCountdownEmbed(battle, countdown);
        await interaction.reply({ embeds: [battleEmbed] });
        const message = await interaction.fetchReply();
        // Countdown interval
        const countdownInterval = setInterval(async () => {
            countdown--;
            if (countdown > 0) {
                battleEmbed = embedBuilder.buildCountdownEmbed(battle, countdown);
                await message.edit({ embeds: [battleEmbed] }).catch(() => { });
            }
            else {
                clearInterval(countdownInterval);
                this._startBattle(message, battle);
            }
        }, 1000);
    }
    async _startBattle(message, battle) {
        const guildId = message.guild?.id || '';
        const runRound = async () => {
            // Check if battle is finished (someone has 0 or less HP)
            const isFinished = battle.player1Health <= 0 || battle.player2Health <= 0;
            if (isFinished)
                return;
            const roundResult = battleService.executeRound(battle);
            const embed = embedBuilder.buildRoundEmbed(battle, roundResult);
            await message.edit({ embeds: [embed] }).catch(() => { });
            // Check again after the round
            const battleFinished = battle.player1Health <= 0 || battle.player2Health <= 0;
            if (!battleFinished) {
                setTimeout(() => runRound(), ROUND_INTERVAL);
            }
            else {
                // Battle finished - show winner with View Log button
                const { embed: winnerEmbed, row } = embedBuilder.buildWinnerEmbed(battle);
                await message.edit({ embeds: [winnerEmbed], components: [row] }).catch(() => { });
                // Store history reference before ending battle
                const battleHistory = [...battle.history];
                const battleState = {
                    player1: battle.player1,
                    player2: battle.player2,
                    skillsetName: battle.skillsetName,
                    player1Health: battle.player1Health,
                    player2Health: battle.player2Health,
                    player1MaxHp: battle.player1MaxHp,
                    player2MaxHp: battle.player2MaxHp,
                    roundCount: battle.roundCount,
                    battleLog: battle.battleLog,
                    history: battleHistory
                };
                await battleService.endBattle(guildId);
                // Set up button collector for View Battle Log
                const collector = message.createMessageComponentCollector({
                    componentType: discord_js_1.ComponentType.Button,
                    time: 300000 // 5 minutes
                });
                collector.on('collect', async (buttonInteraction) => {
                    try {
                        if (buttonInteraction.customId === 'deathbattle_viewlog') {
                            const { embed: logEmbed, row: logRow } = embedBuilder.buildBattleLogEmbed(battleState, battleHistory, 0);
                            await buttonInteraction.reply({
                                embeds: [logEmbed],
                                components: logRow ? [logRow] : [],
                                ephemeral: true
                            });
                        }
                        else if (buttonInteraction.customId.startsWith('deathbattle_log_')) {
                            const parts = buttonInteraction.customId.split('_');
                            const direction = parts[2]; // 'prev' or 'next'
                            const currentPage = parseInt(parts[3], 10);
                            const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
                            const { embed: logEmbed, row: logRow } = embedBuilder.buildBattleLogEmbed(battleState, battleHistory, newPage);
                            await buttonInteraction.update({
                                embeds: [logEmbed],
                                components: logRow ? [logRow] : []
                            });
                        }
                    }
                    catch (err) {
                        console.error('[DeathBattle] Button interaction error:', err);
                    }
                });
                collector.on('end', () => {
                    // Remove button after timeout
                    message.edit({ components: [] }).catch(() => { });
                });
            }
        };
        runRound();
    }
}
exports.default = new DeathBattleCommand();
//# sourceMappingURL=deathbattle.js.map