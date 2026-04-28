const express = require('express');
const router = express.Router();
const { channels, suspicious_logs, blacklist } = require('../../shared/db');
const notifications = require('../../bot/utils/notifications');
const youtube = require('../../bot/utils/youtube');


// POST /api/channels/:id/allowed-users
router.post('/:id/allowed-users', async (req, res) => {
  const { input } = req.body; // Can be username or channel link
  if (!input) return res.status(400).json({ error: 'Input is required' });

  try {
    let username = input;
    let handle = '';
    let channel_url = '';
    let channel_id = '';
    let thumbnail = '';

    // If it looks like a URL, handle, or channel ID, try to resolve it
    if (input.includes('youtube.com') || input.startsWith('@') || input.startsWith('UC')) {
      try {
        let channelInfo;
        if (input.includes('channel/')) {
          const cid = input.split('channel/')[1].split('/')[0];
          channelInfo = await youtube.getChannelInfo(cid);
        } else if (input.startsWith('UC') && input.length === 24) {
          channelInfo = await youtube.getChannelInfo(input);
        } else if (input.includes('@') || input.startsWith('@')) {
          const h = input.includes('@') ? '@' + input.split('@')[1].split('/')[0] : input;
          channelInfo = await youtube.getChannelInfoByHandle(h);
        }
        
        if (channelInfo) {
          username = channelInfo.title;
          handle = channelInfo.handle;
          channel_url = channelInfo.url;
          channel_id = channelInfo.id;
          thumbnail = channelInfo.thumbnail;
        }
      } catch (e) {
        logger.warn(`Failed to fetch channel details for: ${input}. Using raw input as username.`);
      }
    }

    const channel = await channels.findById(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    // Check if already exists
    if (channel.allowed_users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ error: 'User already in whitelist' });
    }

    channel.allowed_users.push({ username, handle, channel_url, channel_id, thumbnail });
    await channel.save();
    res.json({ success: true, user: { username, handle, channel_url, channel_id, thumbnail } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/channels/:id/allowed-users/:username
router.delete('/:id/allowed-users/:username', async (req, res) => {
  try {
    const channel = await channels.findById(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const usernameToRemove = decodeURIComponent(req.params.username).toLowerCase();
    channel.allowed_users = channel.allowed_users.filter(u => u.username.toLowerCase() !== usernameToRemove);
    
    await channel.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/channels/suspicious
router.get('/suspicious', async (req, res) => {
  res.json(await suspicious_logs.findAll());
});

// DELETE /api/channels/suspicious
router.delete('/suspicious', async (req, res) => {
  await suspicious_logs.clear();
  res.json({ success: true });
});

// GET /api/channels/blacklist
router.get('/blacklist', async (req, res) => {
  res.json(await blacklist.findAll());
});

// POST /api/channels/blacklist
router.post('/blacklist', async (req, res) => {
  const { ip, reason } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP is required' });
  await blacklist.add(ip, reason);
  res.json({ success: true });
});

// DELETE /api/channels/blacklist/:ip
router.delete('/blacklist/:ip', async (req, res) => {
  await blacklist.remove(req.params.ip);
  res.json({ success: true });
});

// GET /api/channels
router.get('/', async (req, res) => {
  res.json(await channels.findAll());
});

// POST /api/channels
router.post('/', async (req, res) => {
  const { channel_id: input_id, title: input_title, url: input_url } = req.body;
  
  try {
    let channel_id = input_id;
    let title = input_title;
    let url = input_url;
    let thumbnail = '';

    // Resolve channel details from YouTube API
    let channelInfo;
    if (input_url && input_url.includes('youtube.com')) {
      if (input_url.includes('channel/')) {
        channel_id = input_url.split('channel/')[1].split('/')[0].split('?')[0];
      } else if (input_url.includes('@')) {
        let handle = '@' + input_url.split('@')[1].split('/')[0].split('?')[0];
        channelInfo = await youtube.getChannelInfoByHandle(handle);
      }
    }

    if (!channelInfo && channel_id) {
      channelInfo = await youtube.getChannelInfo(channel_id);
    }

    if (channelInfo) {
      channel_id = channelInfo.id;
      title = channelInfo.title; // Always use official title
      url = channelInfo.url;
      thumbnail = channelInfo.thumbnail;
    }

    if (!channel_id) return res.status(400).json({ error: 'Could not resolve channel_id' });
    if (!thumbnail) return res.status(400).json({ error: 'Could not fetch channel logo from YouTube. Check the link.' });

    await channels.upsert({ 
      channel_id, 
      title: title, // Use official title
      url: url,
      thumbnail: thumbnail, // Save the logo!
      active: true, 
      clips: 0 
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/channels/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
  const channel = await channels.findById(req.params.id);
  if (!channel) return res.status(404).json({ error: 'Channel not found' });
  await channels.upsert({ channel_id: req.params.id, active: !channel.active });
  res.json({ success: true });
});

// DELETE /api/channels/:id
router.delete('/:id', async (req, res) => {
  await channels.delete(req.params.id);
  res.json({ success: true });
});

// POST /api/channels/test-webhook
router.post('/test-webhook', async (req, res) => {
  const success = await notifications.sendSecurityAlert({
    channel_id: 'WEBHOOK_TEST',
    user_name: 'Admin',
    ip: req.ip || '127.0.0.1'
  });
  if (success) res.json({ success: true });
  else res.status(500).json({ error: 'Failed to send. Check DISCORD_WEBHOOK_URL on Render.' });
});

module.exports = router;
