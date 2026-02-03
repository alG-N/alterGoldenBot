/**
 * Video Command
 * Download videos from social media platforms
 * @module commands/video/VideoCommand
 */

import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    AttachmentBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChatInputCommandInteraction
} from 'discord.js';
import { BaseCommand, CommandCategory, type CommandData } from '../BaseCommand.js';
import { COLORS } from '../../constants.js';
import { checkAccess, AccessType } from '../../services/index.js';
import fs from 'fs';
import path from 'path';
// TYPES
interface VideoConfig {
    USER_COOLDOWN_SECONDS?: number;
    MAX_CONCURRENT_DOWNLOADS?: number;
    COBALT_VIDEO_QUALITY?: string;
    MAX_FILE_SIZE_MB?: number;
    limits?: {
        maxFileSizeMB?: number;
    };
}

interface Platform {
    name: string;
    id: string;
}

interface DownloadResult {
    path: string;
    size: number;
    format: string;
    error?: string;
}

interface ProgressData {
    stage?: string;
    percent?: number;
    downloaded?: number;
    total?: number;
    speed?: number;
    eta?: number;
    method?: string;
}

interface VideoDownloadService {
    downloadVideo: (url: string, options: { quality: string }) => Promise<DownloadResult>;
    on?: (event: string, handler: (data: ProgressData) => void) => void;
    off?: (event: string, handler: (data: ProgressData) => void) => void;
}

interface PlatformDetector {
    detect: (url: string) => Platform | string;
}

interface VideoEmbedBuilder {
    buildLoadingEmbed?: (platformName: string, platformId: string, stage: string) => EmbedBuilder;
    buildProgressEmbed?: (platformName: string, platformId: string, data: ProgressData) => EmbedBuilder;
    buildDownloadFailedEmbed?: (message: string) => EmbedBuilder;
}

interface UrlValidator {
    validateUrl: (interaction: ChatInputCommandInteraction, url: string) => Promise<boolean>;
}
// SERVICE IMPORTS
let videoDownloadService: VideoDownloadService | undefined;
let platformDetector: PlatformDetector | undefined;
let videoEmbedBuilder: VideoEmbedBuilder | undefined;
let validateUrl: ((interaction: ChatInputCommandInteraction, url: string) => Promise<boolean>) | undefined;
let videoConfig: VideoConfig | undefined;

const getDefault = <T>(mod: { default?: T } | T): T => (mod as { default?: T }).default || mod as T;

try {
    videoDownloadService = getDefault(require('../../services/video/VideoDownloadService'));
    platformDetector = getDefault(require('../../utils/video/platformDetector'));
    videoEmbedBuilder = getDefault(require('../../utils/video/videoEmbedBuilder'));
    const urlValidator = getDefault(require('../../middleware/urlValidator')) as UrlValidator;
    validateUrl = urlValidator.validateUrl;
    videoConfig = getDefault(require('../../config/features/video'));
} catch (e) {
    console.warn('[Video] Could not load services:', (e as Error).message);
}
// RATE LIMITING
const userCooldowns = new Map<string, number>();
const activeDownloads = new Set<string>();

function checkCooldown(userId: string): number {
    const cooldown = userCooldowns.get(userId);
    if (cooldown && Date.now() < cooldown) {
        return Math.ceil((cooldown - Date.now()) / 1000);
    }
    return 0;
}

function setCooldown(userId: string): void {
    const cooldownSeconds = videoConfig?.USER_COOLDOWN_SECONDS || 30;
    userCooldowns.set(userId, Date.now() + (cooldownSeconds * 1000));
}

function checkConcurrentLimit(): boolean {
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
// COMMAND
class VideoCommand extends BaseCommand {
    constructor() {
        super({
            category: CommandCategory.VIDEO,
            cooldown: 5,
            deferReply: true // Auto defer to prevent interaction timeout
        });
    }

    get data(): CommandData {
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

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        // Access control
        const access = await checkAccess(interaction, AccessType.SUB);
        if (access.blocked) {
            await interaction.editReply({ embeds: [access.embed!] });
            return;
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
            await interaction.editReply({ embeds: [cooldownEmbed] });
            return;
        }

        // Check concurrent download limit
        if (checkConcurrentLimit()) {
            const maxConcurrent = videoConfig?.MAX_CONCURRENT_DOWNLOADS || 5;
            const busyEmbed = new EmbedBuilder()
                .setColor(COLORS.ERROR)
                .setTitle('🚦 Server Busy')
                .setDescription(`Too many downloads in progress. Please wait a moment and try again.\n\n*Max concurrent downloads: ${maxConcurrent}*`)
                .setFooter({ text: 'This helps keep the bot responsive' });
            await interaction.editReply({ embeds: [busyEmbed] });
            return;
        }

        const url = interaction.options.getString('url', true);
        const quality = interaction.options.getString('quality') || videoConfig?.COBALT_VIDEO_QUALITY || '720';
        const platform = platformDetector?.detect(url) || { name: '🌐 Web', id: 'web' };
        const platformName = typeof platform === 'string' ? platform : (platform?.name || 'Unknown');
        const platformId = typeof platform === 'string' ? 'web' : (platform?.id || 'web');

        // Show loading embed immediately (replace "thinking")
        try {
            const loadingEmbed = videoEmbedBuilder?.buildLoadingEmbed?.(platformName, platformId, 'initializing') ||
                new EmbedBuilder()
                    .setColor(COLORS.PRIMARY)
                    .setTitle('🎬 Processing Video')
                    .setDescription(`**Platform:** ${platformName}\n\n\`░░░░░░░░░░░░ 0%\`\n\nInitializing download...`)
                    .setFooter({ text: '🎬 Video Downloader • Processing your request' });
            await interaction.editReply({ embeds: [loadingEmbed] });
        } catch (e) {
            console.error('[Video] Failed to show loading embed:', (e as Error).message);
        }

        // Validate URL
        if (validateUrl && !await validateUrl(interaction, url)) {
            return;
        }

        activeDownloads.add(userId);
        let downloadedFilePath: string | null = null;

        try {
            // Setup progress updates
            let lastUpdateTime = 0;
            const UPDATE_INTERVAL = 1500;

            const updateProgress = async (stage: string, progressData: ProgressData = {}): Promise<void> => {
                const now = Date.now();
                if (now - lastUpdateTime < UPDATE_INTERVAL) return;
                lastUpdateTime = now;

                try {
                    const embed = videoEmbedBuilder?.buildProgressEmbed?.(platformName, platformId, {
                        stage,
                        percent: progressData.percent || 0,
                        downloaded: progressData.downloaded || 0,
                        total: progressData.total || 0,
                        speed: progressData.speed || 0,
                        eta: progressData.eta || 0,
                        method: progressData.method || 'Auto',
                    }) || new EmbedBuilder()
                        .setColor(COLORS.PRIMARY)
                        .setTitle('📥 Downloading Video')
                        .setDescription(`**Platform:** ${platformName}\n\nDownloading...`);
                    await interaction.editReply({ embeds: [embed] });
                } catch (err) {
                    // Ignore update errors
                }
            };

            // Subscribe to progress events
            const stageHandler = (data: ProgressData): void => { updateProgress(data.stage || 'processing', data); };
            const progressHandler = (data: ProgressData): void => { updateProgress('downloading', data); };
            
            videoDownloadService?.on?.('stage', stageHandler);
            videoDownloadService?.on?.('progress', progressHandler);

            try {
                // Download the video
                const result = await videoDownloadService!.downloadVideo(url, { quality });

                if (!result || !result.path) {
                    throw new Error(result?.error || 'Download failed - no file returned');
                }

                downloadedFilePath = result.path;
                
                // Validate file size before upload (Discord limits)
                const maxFileSizeMB = videoConfig?.MAX_FILE_SIZE_MB || videoConfig?.limits?.maxFileSizeMB || 100;
                if (result.size && result.size > maxFileSizeMB) {
                    // Clean up oversized file
                    if (fs.existsSync(downloadedFilePath)) {
                        try { fs.unlinkSync(downloadedFilePath); } catch (e) { /* ignore */ }
                    }
                    
                    const sizeErrorEmbed = new EmbedBuilder()
                        .setColor(COLORS.ERROR)
                        .setTitle('📁 File Too Large')
                        .setDescription(
                            `The downloaded video is **${result.size.toFixed(2)} MB**, which exceeds the **${maxFileSizeMB} MB** limit.\n\n` +
                            `**Suggestions:**\n` +
                            `• Try a lower quality setting (480p)\n` +
                            `• Download a shorter clip\n` +
                            `• Use the original link directly`
                        )
                        .setFooter({ text: 'Discord file size limit' });
                    
                    activeDownloads.delete(userId);
                    await interaction.editReply({ embeds: [sizeErrorEmbed], components: [] });
                    return;
                }

                // Show uploading stage
                try {
                    const uploadEmbed = videoEmbedBuilder?.buildLoadingEmbed?.(platformName, platformId, 'uploading') ||
                        new EmbedBuilder()
                            .setColor(COLORS.PRIMARY)
                            .setTitle('☁️ Uploading to Discord')
                            .setDescription('Almost done...');
                    await interaction.editReply({ embeds: [uploadEmbed] });
                } catch (e) {
                    // Ignore update errors
                }

                // Build success message with Original button
                const successMessage = `✅ **${platformName}** • ${result.size.toFixed(2)} MB • ${result.format}`;
                
                const originalButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setLabel('Original')
                        .setStyle(ButtonStyle.Link)
                        .setURL(url)
                        .setEmoji('🔗')
                );

                // Upload video
                const attachment = new AttachmentBuilder(result.path, { 
                    name: `${platformId}_video.${result.format.toLowerCase()}` 
                });
                
                await interaction.editReply({ 
                    content: successMessage,
                    embeds: [],
                    files: [attachment],
                    components: [originalButton]
                });

                // Delete file after successful upload
                if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
                    try {
                        fs.unlinkSync(downloadedFilePath);
                        console.log(`🗑️ Deleted uploaded file: ${downloadedFilePath}`);
                        downloadedFilePath = null;
                    } catch (e) {
                        console.warn(`⚠️ Failed to delete file: ${(e as Error).message}`);
                    }
                }

                setCooldown(userId);

            } finally {
                // Remove event listeners
                videoDownloadService?.off?.('stage', stageHandler);
                videoDownloadService?.off?.('progress', progressHandler);
            }

        } catch (error) {
            const err = error as Error & { code?: number };
            console.error('[Video] Error:', err.message);
            
            // Clean up file on error
            if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
                try { fs.unlinkSync(downloadedFilePath); } catch (e) { /* ignore */ }
            }
            
            // Check if it's a file size or timeout error
            const isFileTooLarge = err.message?.toLowerCase().includes('too large') || 
                                   err.message?.toLowerCase().includes('entity') ||
                                   err.message?.startsWith('FILE_TOO_LARGE') ||
                                   err.code === 40005;
            const isTimeout = err.message?.toLowerCase().includes('abort') ||
                              err.message === 'This operation was aborted' ||
                              err.name === 'AbortError';
            const isDurationTooLong = err.message?.includes('DURATION_TOO_LONG');
            
            let errorEmbed: EmbedBuilder;
            if (isDurationTooLong) {
                const durationMatch = err.message.match(/DURATION_TOO_LONG:([^|]+)/);
                let durationInfo = durationMatch ? durationMatch[1].trim() : 'too long';
                durationInfo = durationInfo.replace(/[')"\]]+$/, '').trim();
                
                errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.ERROR)
                    .setTitle('⏱️ Video Too Long')
                    .setDescription(
                        `⚠️ This video is **${durationInfo}**\n\n` +
                        `📏 **Maximum duration:** 10 minutes\n\n` +
                        `💡 **Suggestions:**\n` +
                        `• Use a shorter video or clip\n` +
                        `• Trim the video before downloading`
                    )
                    .setFooter({ text: 'Maximum video duration: 10 minutes' });
            } else if (isFileTooLarge) {
                const sizeMatch = err.message.match(/FILE_TOO_LARGE:([\d.]+)MB/);
                const fileSize = sizeMatch ? sizeMatch[1] : 'over 100';
                errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.ERROR)
                    .setTitle('📦 Video Too Large')
                    .setDescription(
                        `⚠️ This video is **${fileSize} MB** - max allowed is **100 MB**.\n\n` +
                        `📏 **Discord Limits:**\n` +
                        `• Free: 10 MB • Nitro Basic: 50 MB • Nitro: 500 MB\n\n` +
                        `💡 **Alternatives:**\n` +
                        `• Try lower quality (480p) for smaller file\n` +
                        `• Use a shorter video clip`
                    )
                    .setFooter({ text: 'Maximum file size: 100MB (Discord Nitro limit)' });
            } else if (isTimeout) {
                errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.ERROR)
                    .setTitle('⏰ Download Timeout')
                    .setDescription(
                        `⚠️ The download took too long and was cancelled.\n\n` +
                        `💡 **Suggestions:**\n` +
                        `• Try a shorter video\n` +
                        `• Try lower quality (480p)\n` +
                        `• Try again later if the server is busy`
                    )
                    .setFooter({ text: 'Download timeout: 2 minutes' });
            } else {
                errorEmbed = videoEmbedBuilder?.buildDownloadFailedEmbed?.(err.message) ||
                    new EmbedBuilder()
                        .setColor(COLORS.ERROR)
                        .setTitle('❌ Download Failed')
                        .setDescription(err.message || 'An unexpected error occurred.');
            }

            await interaction.editReply({ embeds: [errorEmbed], files: [], components: [] }).catch(() => {});
        } finally {
            activeDownloads.delete(userId);
        }
    }
}

export default new VideoCommand();
