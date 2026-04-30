const { verifyAccessToken, verifySecondaryToken } = require('../utils/jwt');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Authentication token required' });

  const decoded = verifyAccessToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid or expired access token' });

  try {
    const user = await User.findById(decoded.userId).select('-passwordHash -secondaryPasswordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error during authentication' });
  }
};

const authenticateSecondaryToken = async (req, res, next) => {
  const token = req.headers['x-secondary-token'];

  if (!token) return res.status(403).json({ error: 'Secondary security token required' });

  const decoded = verifySecondaryToken(token);
  if (!decoded) return res.status(403).json({ error: 'Security session expired. Please verify password again.' });

  req.secondaryUserId = decoded.userId;
  next();
};

module.exports = { authenticateToken, authenticateSecondaryToken };
