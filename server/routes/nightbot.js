const express = require('express');
const router = express.Router();

const youtube = require('../../bot/utils/youtube');
const notifications = require('../../bot/utils/notifications');
const logger = require('../../bot/utils/logger');
const db = require('../../shared/db');

// GET /api/nightbot/clip
router.get('/clip', async (req, res) => {
  const { channelId, url, title, user, token } = req.query;
  const ip = req.ip || req.headers['x-forwarded-for'];

  // 1. Check if IP is blacklisted
  if (await db.blacklist.isBlocked(ip)) {
    logger.warn(`Blocked IP ${ip} tried to access the clipper.`);
    return res.status(403).send('❌ Error: Your IP has been blacklisted for suspicious activity.');
  }

  // 2. Verify security token to prevent unauthorized access
  const stats = await db.stats.getOverview();
  const expectedToken = stats.nightbotToken;
  if (token !== expectedToken) {
    return res.send('❌ Error: Unauthorized. Invalid Nightbot token.');
  }

  // 3. Fallback to URL if user manually types !clip https://...
  if (url && youtube.isYouTubeUrl(url)) {
    res.send('✅ Processing specific clip url...');
    return processVideoBackground(url, title, user).catch(err => logger.error(err));
  }

  // 4. Live Stream clipping (uses Nightbot's $(channelid) variable)
  if (!channelId) {
    return res.send('❌ Error: Nightbot command misconfigured. Use: !clip $(urlfetch ...?channelId=$(channelid))');
  }

  // 5. Strict Monitoring: Only allow registered channels
  const channel = await db.channels.findById(channelId);
  if (!channel) {
    logger.warn(`Suspicious activity: Unauthorized channel ${channelId} tried to use the !clip link.`);
    const logEntry = { channel_id: channelId, user_name: user || 'Unknown', query_params: req.query, ip: ip };
    await db.suspicious_logs.insert(logEntry);
    notifications.sendSecurityAlert(logEntry);
    return res.send('❌ Error: This channel is not authorized.');
  }

  // 5.1 Check if channel is paused
  if (!channel.active) {
    return res.send('⏸️ Error: Clipping is currently PAUSED for this channel.');
  }

  // 5.2 Whitelist check
  if (channel.allowed_users && channel.allowed_users.length > 0) {
    const isAllowed = channel.allowed_users.some(
      u => u.username.toLowerCase() === (user || '').toLowerCase()
    );
    if (!isAllowed) {
      logger.info(`Ignoring !clip command from unauthorized user: ${user} in channel: ${channelId}`);
      return res.send(''); // Return empty to ignore
    }
  }

  // 6. Immediately respond to Nightbot so it can output to chat
  res.send('🎬 Clipping live stream! Sending to Discord...');

  // 7. Perform metadata fetch and webhook post asynchronously in the background
  processLiveClipBackground(channelId, title, user).catch(err => {
    logger.error('Background live clip failed:', err.message);
  });
});

async function processLiveClipBackground(channelId, customTitle, username) {
  try {
    logger.info(`Nightbot requested live clip for channel: ${channelId} by user: ${username || 'Unknown'}`);
    
    // 1. Fetch active live stream
    const stream = await youtube.getActiveLiveStream(channelId);
    
    // 2. Calculate timestamp
    if (!stream.actualStartTime) {
        throw new Error('Stream actualStartTime is missing.');
    }

    const startTime = new Date(stream.actualStartTime).getTime();
    const now = Date.now();
    let elapsedSeconds = Math.floor((now - startTime) / 1000);
    
    // Delay by -30 seconds
    elapsedSeconds -= 30;
    if (elapsedSeconds < 0) elapsedSeconds = 0;

    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;

    let tsDisplay = h > 0 
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`;

    const timestampedUrl = `<https://youtu.be/${stream.id}?t=${elapsedSeconds}>`;

    // 3. Send the webhook notification
    await notifications.sendLiveClipNotification(stream, timestampedUrl, tsDisplay, customTitle);
    
    // 4. Track in DB
    await db.stats.incrementApiUsage(2);
    await db.clips.insert({
      video_id: stream.id,
      title: customTitle || stream.title,
      youtube_url: timestampedUrl,
      clipped_by: username || 'Unknown',
    });

    logger.info(`✅ Nightbot live clip workflow finished: ${timestampedUrl}`);

  } catch (err) {
    logger.error('Error in processLiveClipBackground:', err.message);
  }
}

async function processVideoBackground(url, customTitle, username) {
    try {
      const video = await youtube.getVideoByUrl(url);
      await notifications.sendLiveClipNotification(video, video.url, '00:00', customTitle);

      await db.stats.incrementApiUsage(1);
      await db.clips.insert({
        video_id: video.id,
        title: customTitle || video.title,
        youtube_url: video.url,
        clipped_by: username || 'Unknown',
      });
    } catch (err) {
      logger.error('Error in processVideoBackground:', err.message);
    }
  }

module.exports = router;
