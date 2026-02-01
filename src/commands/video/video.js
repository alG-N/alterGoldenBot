/**
 * Video Command - Presentation Layer
 * Download videos from social media platforms
 * @module presentation/commands/video/video
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BaseCommand, CommandCategory } = require('../BaseCommand');
const { COLORS } = require('../../utils/constants');
const { checkAccess, AccessType } = require('../../services');

// Import services from existing module
let videoDownloadService, platformDetector, videoEmbedBuilder, progressAnimator, validateUrl, videoConfig;
try {
    videoDownloadService = require('../../modules/video/service/VideoDownloadService');
    platformDetector = require('../../modules/video/utils/platformDetector');
    videoEmbedBuilder = require('../../modules/video/utils/videoEmbedBuilder');
    progressAnimator = require('../../modules/video/utils/progressAnimator');
    const urlValidator = require('../../modules/video/middleware/urlValidator');
    validateUrl = urlValidator.validateUrl;
    videoConfig = require('../../config/video');
} catch (e) {
    console.warn('[Video] Could not load services:', e.message);
}

// Rate Limiting
const userCooldowns = new Map();
const activeDownloads = new Set();

function checkCooldown(userId) {
    const cooldown = userCooldowns.get(userId);
    if (cooldown && Date.now() < cooldown) {
        return Math.ceil((cooldown - Date.now()) / 1000);
    }
    return 0;
}

function setCooldown(userId) {
    const cooldownSeconds = videoConfig?.USER_COOLDOWN_SECONDS || 30;
    userCooldowns.set(userId, Date.now() + (cooldownSeconds * 1000));
}

function checkConcurrentLimit() {
    const maxConcurrent = videoConfig?.MAX_CONCURRENT_DOWNLOADS || 5;
    return activeDownloads.size >= maxConcurrent;
}

// Cleanup old cooldowns periodically
setInterval(() => {
    const now = Date.now();
    for (const [userId, expiry] of userCooldowns.entries()) {
        if (now > expiry) userCooldowns.delete(userId);
    }
}, 60000);

class VideoCommand extends BaseCommand {
    constructor() {
        super({
            category: CommandCategory.VIDEO,
            cooldown: 5,
            deferReply: false // Manual defer for progress updates
        });
    }

    get data() {
        return new SlashCommandBuilder()
            .setName('video')
            .setDescription('Download videos from social media platforms')
            .addStringOption(option =>
                option.setName('url')
                    .setDescription('Video URL (TikTok, Reddit, Twitter, Instagram, YouTube, etc.)')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('quality')
                    .setDescription('Video quality preference')
                    .addChoices(
                        { name: '📺 SD (480p) - Faster, smaller', value: '480' },
                        { name: '🎥 HD (720p) - Balanced', value: '720' },
                        { name: '🎬 Full HD (1080p) - Best quality', value: '1080' }
                    )
                    .setRequired(false)
            );
    }

    async run(interaction) {
        // Access control
        const access = await checkAccess(interaction, AccessType.SUB);
        if (access.blocked) {
            return interaction.reply({ embeds: [access.embed], ephemeral: true });
        }

        const userId = interaction.user.id;

        // Check user cooldown
        const remainingCooldown = checkCooldown(userId);
        if (remainingCooldown > 0) {
            const cooldownEmbed = new EmbedBuilder()
                .setColor(COLORS.ERROR)
                .setTitle('⏳ Cooldown Active')
                .setDescription(`Please wait **${remainingCooldown} seconds** before downloading another video.`)
                .setFooter({ text: 'This helps prevent server overload' });
            return interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
        }

        // Check concurrent download limit
        if (checkConcurrentLimit()) {
            const maxConcurrent = videoConfig?.MAX_CONCURRENT_DOWNLOADS || 5;
            const busyEmbed = new EmbedBuilder()
                .setColor(COLORS.ERROR)
                .setTitle('🚦 Server Busy')
                .setDescription(`Too many downloads in progress. Please wait a moment and try again.\n\n*Max concurrent downloads: ${maxConcurrent}*`)
                .setFooter({ text: 'This helps keep the bot responsive' });
            return interaction.reply({ embeds: [busyEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        const url = interaction.options.getString('url');
        const quality = interaction.options.getString('quality') || videoConfig?.COBALT_VIDEO_QUALITY || '720';
        const platform = platformDetector?.detect(url) || 'unknown';

        // Validate URL
        if (validateUrl && !await validateUrl(interaction, url)) {
            return;
        }

        activeDownloads.add(userId);

        try {
            // Build initial processing embed
            const platformName = typeof platform === 'string' ? platform : (platform?.name || 'Unknown');
            const processingEmbed = videoEmbedBuilder?.buildProcessingEmbed?.(platformName, url) || 
                new EmbedBuilder()
                    .setColor(COLORS.INFO)
                    .setTitle('📥 Processing...')
                    .setDescription(`Downloading video from ${platformName}...`);

            await interaction.editReply({ embeds: [processingEmbed] });

            // Start progress animation if available
            let animator;
            if (progressAnimator?.start) {
                animator = progressAnimator.start(interaction, platform);
            }

            // Download the video
            const result = await videoDownloadService.downloadVideo(url, {
                quality,
                platform,
                userId
            });

            // Stop animation
            if (animator?.stop) animator.stop();

            if (!result.success) {
                const errorMessage = typeof result.error === 'string' ? result.error : (result.error?.message || 'Unknown error');
                const errorEmbed = videoEmbedBuilder?.buildErrorEmbed?.('❌ Download Failed', errorMessage) ||
                    new EmbedBuilder()
                        .setColor(COLORS.ERROR)
                        .setTitle('❌ Download Failed')
                        .setDescription(errorMessage);

                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Success - send video
            const successEmbed = videoEmbedBuilder?.buildSuccessEmbed?.(result, platform) ||
                new EmbedBuilder()
                    .setColor(COLORS.SUCCESS)
                    .setTitle('✅ Video Downloaded')
                    .setDescription(`Platform: ${platform}`);

            if (result.file) {
                await interaction.editReply({ 
                    embeds: [successEmbed], 
                    files: [result.file] 
                });
            } else if (result.url) {
                successEmbed.setDescription(`[Download Link](${result.url})`);
                await interaction.editReply({ embeds: [successEmbed] });
            }

            setCooldown(userId);

        } catch (error) {
            console.error('[Video] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.ERROR)
                .setTitle('❌ Error')
                .setDescription('An unexpected error occurred while downloading the video.');

            await interaction.editReply({ embeds: [errorEmbed] }).catch(() => {});
        } finally {
            activeDownloads.delete(userId);
        }
    }
}

module.exports = new VideoCommand();



