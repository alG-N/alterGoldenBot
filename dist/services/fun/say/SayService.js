"use strict";
/**
 * Say Service
 * Handles the say command functionality
 * @module services/fun/say/SayService
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SayService = void 0;
const discord_js_1 = require("discord.js");
const index_js_1 = require("../../../config/say/index.js");
// SAY SERVICE CLASS
class SayService {
    /**
     * Sanitize message to prevent mass pings
     */
    sanitizeMessage(message) {
        return message
            .replace(/@everyone/g, '[everyone]')
            .replace(/@here/g, '[here]');
    }
    /**
     * Build credit text for the message footer
     */
    buildCreditText(userId, userTag, showCredit) {
        if (userId === index_js_1.OWNER_ID) {
            return showCredit ? `Requested by Owner (${userTag})` : '';
        }
        return `Requested by ${userTag}`;
    }
    /**
     * Build an embed for the say message
     */
    buildEmbed(message, type, creditText) {
        const embed = new discord_js_1.EmbedBuilder()
            .setDescription(message)
            .setColor(index_js_1.TYPE_COLORS[type] ?? index_js_1.TYPE_COLORS.normal ?? 0x5865F2)
            .setTimestamp();
        if (creditText) {
            embed.setFooter({ text: creditText });
        }
        return embed;
    }
    /**
     * Build a plain text message with credit
     */
    buildPlainMessage(message, creditText) {
        return message + (creditText ? `\n\n— ${creditText}` : '');
    }
    /**
     * Send a message to a channel
     */
    async sendMessage(channel, _content, useEmbed, message, type, creditText) {
        if (!('send' in channel)) {
            throw new Error('Channel does not support sending messages');
        }
        if (useEmbed) {
            const embed = this.buildEmbed(message, type, creditText);
            return await channel.send({ embeds: [embed] });
        }
        else {
            const plainMessage = this.buildPlainMessage(message, creditText);
            return await channel.send({ content: plainMessage });
        }
    }
    /**
     * Validate that a channel can receive messages
     */
    validateChannel(channel) {
        return channel.isTextBased();
    }
}
exports.SayService = SayService;
// Create singleton instance
const sayService = new SayService();
exports.default = sayService;
//# sourceMappingURL=SayService.js.map