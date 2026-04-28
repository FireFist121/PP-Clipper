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
    let channel_url = '';

    // If it looks like a URL or handle, try to resolve it
    if (input.includes('youtube.com') || input.startsWith('@')) {
      let channelInfo;
      if (input.includes('channel/')) {
        const cid = input.split('channel/')[1].split('/')[0];
        channelInfo = await youtube.getChannelInfo(cid);
      } else if (input.includes('@') || input.startsWith('@')) {
        const handle = input.includes('@') ? '@' + input.split('@')[1].split('/')[0] : input;
        channelInfo = await youtube.getChannelInfoByHandle(handle);
      }
      
      if (channelInfo) {
        username = channelInfo.title;
        channel_url = channelInfo.url;
      }
    }

    const channel = await channels.findById(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    // Check if already exists
    if (channel.allowed_users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ error: 'User already in whitelist' });
    }

    channel.allowed_users.push({ username, channel_url });
    await channel.save();
    res.json({ success: true, user: { username, channel_url } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/channels/:id/allowed-users/:username
router.delete('/:id/allowed-users/:username', async (req, res) => {
  const channel = await channels.findById(req.params.id);
  if (!channel) return res.status(404).json({ error: 'Channel not found' });

  channel.allowed_users = channel.allowed_users.filter(u => u.username !== req.params.username);
  await channel.save();
  res.json({ success: true });
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
  const { channel_id, title, url } = req.body;
  if (!channel_id) return res.status(400).json({ error: 'channel_id is required' });
  await channels.upsert({ channel_id, title, url, active: true, clips: 0 });
  res.json({ success: true });
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
