const { validators } = require('../utils');
const trackHandler = require('../handler/trackHandler');
const { MessageFlags } = require('discord.js');

/**
 * Check if user is in voice channel
 * @param {Object} interaction - Discord interaction
 * @param {boolean} shouldReply - Whether to reply on failure (default true)
 * @returns {Object} { valid: boolean, error?: string }
 */
function checkVoiceChannelSync(interaction) {
    if (!validators.isInVoiceChannel(interaction.member)) {
        return { valid: false, error: "Join a voice channel first." };
    }
    return { valid: true };
}

/**
 * Check voice permissions
 * @param {Object} interaction - Discord interaction
 * @returns {Object} { valid: boolean, error?: string }
 */
function checkVoicePermissionsSync(interaction) {
    const voiceChannel = interaction.member.voice?.channel;
    
    if (!voiceChannel) {
        return { valid: false, error: "Join a voice channel first." };
    }

    if (!validators.hasVoicePermissions(voiceChannel)) {
        return { valid: false, error: "I don't have permission to connect or speak in your voice channel." };
    }

    return { valid: true };
}

// Legacy async functions for backward compatibility
async function checkVoiceChannel(interaction) {
    if (!validators.isInVoiceChannel(interaction.member)) {
        await interaction.reply({
            embeds: [trackHandler.createInfoEmbed("❌ No Voice Channel", "Join a voice channel first.")],
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }
    return true;
}

async function checkSameVoiceChannel(interaction, botChannelId) {
    if (!botChannelId) {
        return true;
    }

    if (!validators.isInSameVoiceChannel(interaction.member, botChannelId)) {
        await interaction.reply({
            flags: MessageFlags.Ephemeral,
            content: "❌ You must be in the same voice channel as the bot to use these controls.",
        });
        return false;
    }
    return true;
}

async function checkVoicePermissions(interaction) {
    const voiceChannel = interaction.member.voice?.channel;
    
    if (!voiceChannel) {
        await interaction.reply({
            embeds: [trackHandler.createInfoEmbed("❌ No Voice Channel", "Join a voice channel first.")],
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    if (!validators.hasVoicePermissions(voiceChannel)) {
        await interaction.reply({
            embeds: [trackHandler.createInfoEmbed(
                "❌ Missing Permissions", 
                "I don't have permission to connect or speak in your voice channel."
            )],
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    return true;
}

module.exports = {
    checkVoiceChannel,
    checkSameVoiceChannel,
    checkVoicePermissions,
    checkVoiceChannelSync,
    checkVoicePermissionsSync
};