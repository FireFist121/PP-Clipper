const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'pp_clipper_access_secret_2026';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'pp_clipper_refresh_secret_2026';
const SECONDARY_TOKEN_SECRET = process.env.SECONDARY_TOKEN_SECRET || 'pp_clipper_secondary_secret_2026';

const signAccessToken = (userId) => {
  return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

const signRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
};

const signSecondaryToken = (userId) => {
  return jwt.sign({ userId }, SECONDARY_TOKEN_SECRET, { expiresIn: '5m' });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

const verifySecondaryToken = (token) => {
  try {
    return jwt.verify(token, SECONDARY_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  signSecondaryToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifySecondaryToken
};
