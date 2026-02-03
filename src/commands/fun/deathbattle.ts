/**
 * DeathBattle Command - Presentation Layer
 * Anime-themed death battle game
 * @module presentation/commands/fun/deathbattle
 */

import { 
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    User,
    Message,
    EmbedBuilder
} from 'discord.js';
import { BaseCommand, CommandCategory, type CommandData } from '../BaseCommand.js';
import { checkAccess, AccessType } from '../../services/index.js';
// TYPES
interface Battle {
    id: string;
    guildId: string;
    player1: User;
    player2: User;
    skillset: string;
    player1Hp: number;
    player2Hp: number;
    isFinished: boolean;
}

interface RoundResult {
    attacker: User;
    defender: User;
    damage: number;
    skill: string;
}

interface SkillsetService {
    isValidSkillset: (name: string) => boolean;
    getAllSkillsets: () => string[];
}

interface BattleService {
    createBattle: (guildId: string, p1: User, p2: User, skillset: string, hp1: number, hp2: number) => Battle;
    executeRound: (battle: Battle) => RoundResult;
    endBattle: (battleId: string) => void;
}

interface EmbedBuilderService {
    buildErrorEmbed: (msg: string) => EmbedBuilder;
    buildCountdownEmbed: (battle: Battle, count: number) => EmbedBuilder;
    buildRoundEmbed: (battle: Battle, result: RoundResult) => EmbedBuilder;
    buildWinnerEmbed: (battle: Battle) => EmbedBuilder;
}

interface LoggerService {
    log: (msg: string, interaction?: ChatInputCommandInteraction) => void;
}

interface DeathBattleConfig {
    MAX_HP?: number;
    DEFAULT_HP?: number;
    COUNTDOWN_SECONDS?: number;
    ROUND_INTERVAL?: number;
}
// SERVICE IMPORTS
let skillsetService: SkillsetService | undefined;
let battleService: BattleService | undefined;
let embedBuilder: EmbedBuilderService | undefined;
let logger: LoggerService | undefined;
let config: DeathBattleConfig | undefined;

const getDefault = <T>(mod: { default?: T } | T): T => (mod as { default?: T }).default || mod as T;

try {
    skillsetService = getDefault(require('../../services/fun/deathbattle/SkillsetService'));
    battleService = getDefault(require('../../services/fun/deathbattle/BattleService'));
    embedBuilder = getDefault(require('../../utils/deathbattle/embedBuilder'));
    logger = getDefault(require('../../utils/deathbattle/logger'));
    config = getDefault(require('../../config/deathbattle'));
} catch (e) {
    console.warn('[DeathBattle] Could not load services:', (e as Error).message);
}

const MAX_HP = config?.MAX_HP || 10000;
const DEFAULT_HP = config?.DEFAULT_HP || 1000;
const COUNTDOWN_SECONDS = config?.COUNTDOWN_SECONDS || 3;
const ROUND_INTERVAL = config?.ROUND_INTERVAL || 2000;
// COMMAND
class DeathBattleCommand extends BaseCommand {
    constructor() {
        super({
            category: CommandCategory.FUN,
            cooldown: 30,
            deferReply: false
        });
    }

    get data(): CommandData {
        return new SlashCommandBuilder()
            .setName('deathbattle')
            .setDescription('Start a death battle with another user!')
            .addUserOption(option =>
                option.setName('opponent')
                    .setDescription('The user you want to battle')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('skillset')
                    .setDescription('Skill set to use')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Jujutsu Kaisen', value: 'jjk' },
                        { name: 'Naruto', value: 'naruto' },
                        { name: 'Demon Slayer', value: 'demonslayer' },
                        { name: 'One Piece', value: 'onepiece' }
                    ))
            .addIntegerOption(option =>
                option.setName('your_hp')
                    .setDescription(`Your HP (max ${MAX_HP.toLocaleString()})`)
                    .setRequired(false))
            .addIntegerOption(option =>
                option.setName('opponent_hp')
                    .setDescription(`Opponent HP (max ${MAX_HP.toLocaleString()})`)
                    .setRequired(false));
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        // Access control
        const access = await checkAccess(interaction, AccessType.SUB);
        if (access.blocked) {
            await interaction.reply({ embeds: [access.embed!], ephemeral: true });
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
                embeds: [embedBuilder!.buildErrorEmbed('You need to select someone to battle!')], 
                ephemeral: true 
            });
            return;
        }

        if (!skillsetService?.isValidSkillset(skillsetName)) {
            const validSkillsets = skillsetService?.getAllSkillsets?.().join(', ') || 'jjk, naruto, demonslayer, onepiece';
            await interaction.reply({ 
                embeds: [embedBuilder!.buildErrorEmbed(`Invalid skillset! Available: ${validSkillsets}`)], 
                ephemeral: true 
            });
            return;
        }

        if (opponent.id === player1.id) {
            await interaction.reply({ 
                embeds: [embedBuilder!.buildErrorEmbed('You cannot fight yourself!')], 
                ephemeral: true 
            });
            return;
        }

        if (player1Hp > MAX_HP || player2Hp > MAX_HP) {
            await interaction.reply({ 
                embeds: [embedBuilder!.buildErrorEmbed(`HP too high! Max is ${MAX_HP.toLocaleString()}.`)], 
                ephemeral: true 
            });
            return;
        }

        // Create battle
        const battle = battleService!.createBattle(
            interaction.guild!.id,
            player1,
            opponent,
            skillsetName,
            player1Hp,
            player2Hp
        );

        logger?.log(`Battle started: ${player1.tag} vs ${opponent.tag} (${skillsetName})`, interaction);

        // Start countdown
        let countdown = COUNTDOWN_SECONDS;
        let battleEmbed = embedBuilder!.buildCountdownEmbed(battle, countdown);

        await interaction.reply({ embeds: [battleEmbed] });
        const message = await interaction.fetchReply() as Message;

        // Countdown interval
        const countdownInterval = setInterval(async () => {
            countdown--;
            if (countdown > 0) {
                battleEmbed = embedBuilder!.buildCountdownEmbed(battle, countdown);
                await message.edit({ embeds: [battleEmbed] }).catch(() => {});
            } else {
                clearInterval(countdownInterval);
                this._startBattle(message, battle);
            }
        }, 1000);
    }

    private async _startBattle(message: Message, battle: Battle): Promise<void> {
        const runRound = async (): Promise<void> => {
            if (battle.isFinished) return;

            const roundResult = battleService!.executeRound(battle);
            const embed = embedBuilder!.buildRoundEmbed(battle, roundResult);
            await message.edit({ embeds: [embed] }).catch(() => {});

            if (!battle.isFinished) {
                setTimeout(() => runRound(), ROUND_INTERVAL);
            } else {
                // Battle finished
                const winnerEmbed = embedBuilder!.buildWinnerEmbed(battle);
                await message.edit({ embeds: [winnerEmbed] }).catch(() => {});
                battleService!.endBattle(battle.id);
            }
        };

        runRound();
    }
}

export default new DeathBattleCommand();
