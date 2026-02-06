"use strict";
/**
 * Voice Channel Check Middleware
 * Voice channel validation for music commands
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validators = void 0;
exports.checkVoiceChannel = checkVoiceChannel;
exports.checkSameVoiceChannel = checkSameVoiceChannel;
exports.checkVoicePermissions = checkVoicePermissions;
exports.checkVoiceChannelSync = checkVoiceChannelSync;
exports.checkVoicePermissionsSync = checkVoicePermissionsSync;
const trackHandler_js_1 = __importDefault(require("../handlers/music/trackHandler.js"));
const discord_js_1 = require("discord.js");
// Validators
const validators = {
    isInVoiceChannel: (member) => {
        return !!(member?.voice?.channel);
    },
    isInSameVoiceChannel: (member, botChannelId) => {
        return member?.voice?.channelId === botChannelId;
    },
    hasVoicePermissions: (channel) => {
        if (!channel)
            return false;
        const permissions = channel.permissionsFor(channel.guild.members.me);
        if (!permissions)
            return false;
        return permissions.has('Connect') && permissions.has('Speak');
    }
};
exports.validators = validators;
// Sync Functions
/**
 * Check if user is in voice channel (sync version)
 */
function checkVoiceChannelSync(interaction) {
    const member = interaction.member;
    if (!validators.isInVoiceChannel(member)) {
        return { valid: false, error: "Join a voice channel first." };
    }
    return { valid: true };
}
/**
 * Check voice permissions (sync version)
 */
function checkVoicePermissionsSync(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
        return { valid: false, error: "Join a voice channel first." };
    }
    if (!validators.hasVoicePermissions(voiceChannel)) {
        return { valid: false, error: "I don't have permission to connect or speak in your voice channel." };
    }
    return { valid: true };
}
// Async Functions (Legacy)
/**
 * Check if user is in voice channel (async with reply)
 */
async function checkVoiceChannel(interaction) {
    const member = interaction.member;
    if (!member?.voice?.channel) {
        await interaction.reply({
            embeds: [trackHandler_js_1.default.createInfoEmbed("❌ No Voice Channel", "Join a voice channel first.")],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return false;
    }
    return true;
}
/**
 * Check if user is in same voice channel as bot (async with reply)
 */
async function checkSameVoiceChannel(interaction, botChannelId) {
    const member = interaction.member;
    // First check: User must be in a voice channel
    if (!member?.voice?.channel) {
        await interaction.reply({
            flags: discord_js_1.MessageFlags.Ephemeral,
            content: "❌ You must be in a voice channel to use these controls.",
        });
        return false;
    }
    // If bot is not in a channel, allow (for initial join)
    if (!botChannelId) {
        return true;
    }
    // Second check: User must be in the SAME voice channel as the bot
    if (!validators.isInSameVoiceChannel(member, botChannelId)) {
        await interaction.reply({
            flags: discord_js_1.MessageFlags.Ephemeral,
            content: "❌ You must be in the same voice channel as the bot to use these controls.",
        });
        return false;
    }
    return true;
}
/**
 * Check voice permissions (async with reply)
 */
async function checkVoicePermissions(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
        await interaction.reply({
            embeds: [trackHandler_js_1.default.createInfoEmbed("❌ No Voice Channel", "Join a voice channel first.")],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return false;
    }
    if (!validators.hasVoicePermissions(voiceChannel)) {
        await interaction.reply({
            embeds: [trackHandler_js_1.default.createInfoEmbed("❌ Missing Permissions", "I don't have permission to connect or speak in your voice channel.")],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return false;
    }
    return true;
}
exports.default = {
    checkVoiceChannel,
    checkSameVoiceChannel,
    checkVoicePermissions,
    checkVoiceChannelSync,
    checkVoicePermissionsSync,
    validators
};
//# sourceMappingURL=voiceChannelCheck.js.map