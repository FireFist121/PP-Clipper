/**
 * AntyGravity — Notifications
 * Discord Webhook plain text formatter
 */

const axios = require('axios');
const logger = require('./logger');

/**
 * Sends a plain text notification to the configured Discord Webhook.
 * Format:
 * Clip ID  | **TItle / captation* 
 * 
 * TS
 * <link>
 * Delayed by -30 seconds.
 * @param {Object} stream 
 * @param {string} timestampedUrl 
 * @param {string} elapsedStr 
 * @param {string} customTitle 
 * @param {string} username
 */
async function sendLiveClipNotification(stream, timestampedUrl, elapsedStr, customTitle, username) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    logger.warn('DISCORD_WEBHOOK_URL is not set. Skipping notification.');
    return false;
  }

  const titleToUse = customTitle ? customTitle : stream.title;
  const cleanUser = username ? username.replace(/^@+/, '') : '';
  const clippedBy = cleanUser ? `\nClipped by @${cleanUser}` : '';
  const content = `${stream.id} | **${titleToUse}**\n\n${elapsedStr}\n${timestampedUrl}${clippedBy}\nDelayed by -30 seconds.`;

  try {
    await axios.post(webhookUrl, { content });
    logger.info(`Webhook text notification sent for: ${stream.title} at ${elapsedStr}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send webhook notification for ${stream.id}:`, error.message);
    return false;
  }
}

async function sendSecurityAlert(logData) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhookUrl) return false;

  const content = `🚨 **SECURITY ALERT** 🚨\n\n**Unauthorized Access Attempt Blocked**\n**Channel ID:** \`${logData.channel_id}\`\n**User:** \`${logData.user_name}\`\n**IP Address:** \`${logData.ip}\`\n**Timestamp:** \`${new Date().toLocaleString()}\`\n\n*Dashboard: Check "Suspicious Activity" to block this IP.*`;

  try {
    await axios.post(webhookUrl, { content });
    return true;
  } catch (error) {
    logger.error(`Failed to send security alert:`, error.message);
    return false;
  }
}

module.exports = {
  sendLiveClipNotification,
  sendSecurityAlert
};
