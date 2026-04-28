const express = require('express');
const router = express.Router();
const { channels, suspicious_logs, blacklist } = require('../../shared/db');
const notifications = require('../../bot/utils/notifications');

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
