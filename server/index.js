/**
 * AntyGravity — Express API Server
 * Backend for the Web Dashboard
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('../bot/utils/logger');
const { initDatabase } = require('../shared/db');
const { ensureDirectories } = require('../shared/storage');

const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { User } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database and Storage
initDatabase().then(async () => {
  // Seed Initial Admin User if none exists
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const passwordHash = await bcrypt.hash('FIREFISTDEAD', 12);
    await User.create({
      email: 'PPClipper@admin.com',
      passwordHash: passwordHash
    });
    logger.info('✅ Initial admin user seeded: PPClipper@admin.com');
  }
}).catch(err => logger.error(`Database Init Error: ${err.message}`));

ensureDirectories();

// Middleware
app.use(cors({ origin: true, credentials: true })); // Allow credentials for cookies
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/nightbot', require('./routes/nightbot'));
app.use('/api/clips', require('./routes/clips'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/auth', require('./routes/auth'));

// Serve downloaded clips statically (so dashboard can play them)
app.use('/clips', express.static(path.join(process.cwd(), 'clips', 'downloads')));
app.use('/thumbnails', express.static(path.join(process.cwd(), 'clips', 'thumbnails')));

// Serve Frontend (Compiled Client)
app.use(express.static(path.join(process.cwd(), 'client', 'dist')));

// SPA Catch-all: Send index.html for any route not matched by API
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(process.cwd(), 'client', 'dist', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`API Error: ${err.message}`);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  logger.info(`🚀 AntyGravity API server running on http://localhost:${PORT}`);
});
