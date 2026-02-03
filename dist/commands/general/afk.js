"use strict";
/**
 * AFK Command - Presentation Layer
 * Set AFK status (guild or global)
 * @module presentation/commands/general/afk
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = formatDuration;
exports.isUserAfk = isUserAfk;
exports.removeAfk = removeAfk;
exports.onMessage = onMessage;
const discord_js_1 = require("discord.js");
const BaseCommand_js_1 = require("../BaseCommand.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// File path for persistence - stored in src/data/afk.json
const afkFilePath = path.join(process.cwd(), 'src', 'data', 'afk.json');
// STATE
let afkCache = null;
let isDirty = false;
// UTILITY FUNCTIONS
/**
 * Format duration from seconds to readable string
 */
function formatDuration(seconds) {
    if (seconds < 60)
        return `${seconds}s`;
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours < 24) {
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}
/**
 * Load AFK users from file (cached)
 */
function loadAfkUsers() {
    if (afkCache !== null)
        return afkCache;
    try {
        const dir = path.dirname(afkFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(afkFilePath)) {
            afkCache = {};
            fs.promises.writeFile(afkFilePath, '{}').catch(() => { });
            return afkCache;
        }
        afkCache = JSON.parse(fs.readFileSync(afkFilePath, 'utf-8').trim() || '{}');
    }
    catch {
        afkCache = {};
    }
    return afkCache;
}
/**
 * Save AFK users to cache (async save with dirty flag)
 */
function saveAfkUsers(data) {
    afkCache = data;
    isDirty = true;
}
// Periodic async save every 30s if dirty
const saveInterval = setInterval(async () => {
    if (isDirty && afkCache !== null) {
        try {
            await fs.promises.writeFile(afkFilePath, JSON.stringify(afkCache, null, 2));
            isDirty = false;
        }
        catch (err) {
            console.error('[AFK] Failed to save:', err);
        }
    }
}, 30000);
// Cleanup on process exit
process.on('exit', () => {
    clearInterval(saveInterval);
    if (isDirty && afkCache !== null) {
        try {
            fs.writeFileSync(afkFilePath, JSON.stringify(afkCache, null, 2));
        }
        catch (err) {
            console.error('[AFK] Failed to save on exit:', err);
        }
    }
});
/**
 * Check if user is AFK
 */
function isUserAfk(userId, guildId = null) {
    const afkData = loadAfkUsers();
    const userData = afkData[userId];
    if (!userData)
        return null;
    // Check global AFK
    if (userData.type === 'global') {
        return userData;
    }
    // Check guild-specific AFK
    if (guildId && userData[guildId]) {
        return userData[guildId];
    }
    return null;
}
/**
 * Remove user from AFK
 */
function removeAfk(userId, guildId = null) {
    const afkData = loadAfkUsers();
    const userData = afkData[userId];
    if (!userData)
        return null;
    let removed = null;
    if (userData.type === 'global') {
        removed = userData;
        delete afkData[userId];
    }
    else if (guildId && userData[guildId]) {
        removed = userData[guildId];
        delete userData[guildId];
        if (Object.keys(userData).length === 0) {
            delete afkData[userId];
        }
    }
    if (removed) {
        saveAfkUsers(afkData);
    }
    return removed;
}
// COMMAND CLASS
class AfkCommand extends BaseCommand_js_1.BaseCommand {
    constructor() {
        super({
            category: BaseCommand_js_1.CommandCategory.GENERAL,
            cooldown: 10,
            deferReply: false
        });
    }
    get data() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('afk')
            .setDescription('Set your AFK status')
            .addStringOption(option => option.setName('type')
            .setDescription('AFK type')
            .addChoices({ name: 'guild', value: 'guild' }, { name: 'global', value: 'global' }))
            .addStringOption(option => option.setName('reason')
            .setDescription('Reason for being AFK')
            .setMaxLength(200));
    }
    async run(interaction) {
        const afkData = loadAfkUsers();
        const userId = interaction.user.id;
        const guildId = interaction.guild?.id;
        const type = (interaction.options.getString('type') || 'guild');
        const reason = interaction.options.getString('reason') || 'No reason provided.';
        const timestamp = Date.now();
        // Set AFK status
        if (type === 'global') {
            afkData[userId] = { reason, timestamp, type: 'global' };
        }
        else {
            if (!afkData[userId] || afkData[userId].type === 'global') {
                afkData[userId] = {};
            }
            if (guildId) {
                afkData[userId][guildId] = { reason, timestamp, type: 'guild' };
            }
        }
        saveAfkUsers(afkData);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x8A2BE2)
            .setTitle('AFK mode activated!')
            .setDescription(`**Type:** ${type}\n**Reason:** ${reason}`)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({
            text: 'I will let others know if they mention you 💬',
            iconURL: interaction.client.user?.displayAvatarURL()
        });
        await interaction.reply({ embeds: [embed] });
    }
}
/**
 * Handle message events for AFK system
 */
function onMessage(message, client) {
    try {
        if (message.author.bot)
            return;
        if (!message.guild)
            return;
        const afkData = loadAfkUsers();
        const userId = message.author.id;
        const guildId = message.guild.id;
        // Check if message author is AFK and remove them
        let wasAfk = false;
        let afkInfo;
        if (afkData[userId]?.type === 'global') {
            wasAfk = true;
            afkInfo = afkData[userId];
            delete afkData[userId];
        }
        else if (afkData[userId]?.[guildId]) {
            wasAfk = true;
            afkInfo = afkData[userId][guildId];
            delete afkData[userId][guildId];
            if (Object.keys(afkData[userId]).length === 0)
                delete afkData[userId];
        }
        if (wasAfk && afkInfo) {
            saveAfkUsers(afkData);
            const timeAway = Math.floor((Date.now() - afkInfo.timestamp) / 1000);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x00CED1)
                .setTitle('Welcome Back!')
                .setDescription(`You were AFK for **${formatDuration(timeAway)}**. おかえりなさい！`)
                .setThumbnail(message.author.displayAvatarURL())
                .setImage('https://media.tenor.com/blCLnVdO3CgAAAAd/senko-sewayaki-kitsune-no-senko-san.gif')
                .setFooter({ text: 'We missed you! 🎌', iconURL: client.user?.displayAvatarURL() });
            message.reply({ embeds: [embed] })
                .then(msg => setTimeout(() => msg.delete().catch(() => { }), 15000))
                .catch(() => { });
            return;
        }
        // Check mentions for AFK users
        message.mentions.users.forEach(user => {
            let mentionedAfkInfo;
            if (afkData[user.id]?.type === 'global') {
                mentionedAfkInfo = afkData[user.id];
            }
            else if (afkData[user.id]?.[guildId]) {
                mentionedAfkInfo = afkData[user.id][guildId];
            }
            if (mentionedAfkInfo) {
                const timeAway = Math.floor((Date.now() - mentionedAfkInfo.timestamp) / 1000);
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(0xFFA07A)
                    .setTitle(`${user.username} is currently AFK 💤`)
                    .setDescription(`**AFK for:** ${formatDuration(timeAway)}\n**Reason:** ${mentionedAfkInfo.reason}`)
                    .setThumbnail(user.displayAvatarURL())
                    .addFields([
                    {
                        name: 'While you wait...',
                        value: '🍵 Grab tea\n📺 Watch anime\n🎮 Play a game\n🈶 Practice Japanese\n🎨 Draw a fumo\n'
                    }
                ])
                    .setFooter({ text: 'They\'ll return soon 🌸', iconURL: client.user?.displayAvatarURL() });
                message.reply({ embeds: [embed] }).catch(() => { });
            }
        });
    }
    catch (error) {
        const err = error;
        console.error('[AFK] onMessage error:', err.message);
    }
}
// Export command and utility functions
const command = new AfkCommand();
exports.default = command;
//# sourceMappingURL=afk.js.map