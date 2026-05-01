const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const uaparser = require('ua-parser-js');
const { User, RefreshToken } = require('../models');
const { 
  signAccessToken, 
  signRefreshToken, 
  signSecondaryToken, 
  verifyRefreshToken 
} = require('../utils/jwt');
const { authenticateToken, authenticateSecondaryToken } = require('../middleware/authenticate');

const SALT_ROUNDS = 12;

// Utility to hash refresh token for DB storage
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate tokens
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Parse device info
    const ua = uaparser(req.headers['user-agent']);
    const browserName = ua.browser.name || 'Unknown Browser';
    const browserVersion = ua.browser.version ? ` ${ua.browser.major || ua.browser.version || ''}` : '';
    const osName = ua.os.name || 'Unknown OS';
    const osVersion = ua.os.version ? ` ${ua.os.version}` : '';
    const deviceModel = ua.device.model ? ` (${ua.device.model})` : '';
    const deviceInfo = `${browserName}${browserVersion} on ${osName}${osVersion}${deviceModel}`.trim();

    // Capture real IP
    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '::1').split(',')[0].trim();

    // Store refresh token
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      deviceInfo,
      userAgent: req.headers['user-agent'],
      ipAddress,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ 
      accessToken, 
      user: { email: user.email, id: user._id } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/refresh
router.get('/refresh', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token missing' });

  const decoded = verifyRefreshToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid refresh token' });

  try {
    const hashed = hashToken(token);
    const storedToken = await RefreshToken.findOne({ tokenHash: hashed, userId: decoded.userId, isActive: true });

    if (!storedToken) return res.status(401).json({ error: 'Session revoked or expired' });

    // Rotate tokens (optional but more secure)
    const newAccessToken = signAccessToken(decoded.userId);
    const newRefreshToken = signRefreshToken(decoded.userId);

    // Update stored token
    const ua = uaparser(req.headers['user-agent']);
    const browserName = ua.browser.name || 'Unknown Browser';
    const browserVersion = ua.browser.version ? ` ${ua.browser.major || ua.browser.version || ''}` : '';
    const osName = ua.os.name || 'Unknown OS';
    const osVersion = ua.os.version ? ` ${ua.os.version}` : '';
    const deviceModel = ua.device.model ? ` (${ua.device.model})` : '';
    const deviceInfo = `${browserName}${browserVersion} on ${osName}${osVersion}${deviceModel}`.trim();
    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '::1').split(',')[0].trim();

    storedToken.tokenHash = hashToken(newRefreshToken);
    storedToken.lastUsedAt = new Date();
    storedToken.deviceInfo = deviceInfo;
    storedToken.userAgent = req.headers['user-agent'];
    storedToken.ipAddress = ipAddress;
    await storedToken.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    const user = await User.findById(decoded.userId);
    res.json({ 
      accessToken: newAccessToken, 
      user: { email: user.email, id: user._id } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await RefreshToken.findOneAndDelete({ tokenHash: hashToken(token) });
  }
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// --- Sessions & Security ---

// GET /api/auth/sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const currentToken = req.cookies.refreshToken;
    const currentHash = currentToken ? hashToken(currentToken) : null;

    const sessions = await RefreshToken.find({ userId: req.user._id, isActive: true })
      .sort({ lastUsedAt: -1 });

    res.json(sessions.map(s => ({
      id: s._id,
      deviceInfo: s.deviceInfo,
      userAgent: s.userAgent || s.deviceInfo, // Fallback for old sessions
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      isCurrent: s.tokenHash === currentHash
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/auth/sessions/:id
router.delete('/sessions/:id', authenticateToken, authenticateSecondaryToken, async (req, res) => {
  try {
    await RefreshToken.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/auth/sessions (ALL OTHER)
router.delete('/sessions', authenticateToken, authenticateSecondaryToken, async (req, res) => {
  try {
    const currentToken = req.cookies.refreshToken;
    const currentHash = currentToken ? hashToken(currentToken) : null;

    await RefreshToken.deleteMany({ 
      userId: req.user._id, 
      tokenHash: { $ne: currentHash } 
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/secondary-password/set
router.post('/secondary-password/set', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);
    
    // If secondary pass already set, verify current one
    if (user.secondaryPasswordHash) {
      if (!currentPassword) return res.status(400).json({ error: 'Current security password required' });
      const isMatch = await bcrypt.compare(currentPassword, user.secondaryPasswordHash);
      if (!isMatch) return res.status(403).json({ error: 'Incorrect current security password' });
    }

    user.secondaryPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/secondary-password/verify
router.post('/secondary-password/verify', authenticateToken, async (req, res) => {
  const { password } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user.secondaryPasswordHash) return res.status(400).json({ error: 'Security password not set' });

    const isMatch = await bcrypt.compare(password, user.secondaryPasswordHash);
    if (!isMatch) return res.status(403).json({ error: 'Incorrect security password' });

    const secondaryToken = signSecondaryToken(user._id);
    res.json({ secondaryToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/check-secondary
router.get('/check-secondary', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ isSet: !!user.secondaryPasswordHash });
});

module.exports = router;
