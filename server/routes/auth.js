const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Session } = require('../models');
const logger = require('../../bot/utils/logger');

// Middleware to parse device info
const getDeviceInfo = (req) => {
  const ua = req.headers['user-agent'] || 'Unknown Device';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('Android')) return 'Android Phone';
  if (ua.includes('Macintosh')) return 'MacBook';
  return 'Desktop/Browser';
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'PPClipper@admin.com' && password === 'FIREFISTDEAD') {
    const token = crypto.randomBytes(32).toString('hex');
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    const session = await Session.create({
      token,
      user: email,
      ip,
      device: getDeviceInfo(req)
    });

    return res.json({ token, user: email });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

// GET /api/auth/me - Validate current session
router.get('/me', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token' });

  const session = await Session.findOne({ token });
  if (!session) return res.status(401).json({ error: 'Invalid session' });

  // Update last active
  session.last_active = new Date();
  await session.save();

  res.json({ user: session.user, ip: session.ip, device: session.device });
});

// GET /api/auth/sessions - List all active sessions
router.get('/sessions', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const currentSession = await Session.findOne({ token });
  if (!currentSession) return res.status(401).json({ error: 'Unauthorized' });

  const sessions = await Session.find().sort({ last_active: -1 });
  res.json(sessions.map(s => ({
    id: s._id,
    user: s.user,
    ip: s.ip,
    device: s.device,
    last_active: s.last_active,
    is_current: s.token === token
  })));
});

// DELETE /api/auth/sessions/:id - Logout a specific session
router.post('/sessions/logout-other', async (req, res) => {
  const { sessionId, masterPassword } = req.body;
  const token = req.headers['authorization'];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  // Use a different password for session management
  const REAL_MASTER_PASS = process.env.MASTER_PASSWORD || 'FIREFIST_SESSION_KILLER';

  if (masterPassword !== REAL_MASTER_PASS) {
    return res.status(403).json({ error: 'Incorrect Master Password' });
  }

  await Session.findByIdAndDelete(sessionId);
  res.json({ success: true });
});

// POST /api/auth/logout - Current session logout
router.post('/logout', async (req, res) => {
  const token = req.headers['authorization'];
  if (token) {
    await Session.findOneAndDelete({ token });
  }
  res.json({ success: true });
});

module.exports = router;
