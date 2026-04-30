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

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database and Storage
initDatabase().catch(err => logger.error(`Database Init Error: ${err.message}`));
ensureDirectories();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/nightbot', require('./routes/nightbot'));
app.use('/api/clips', require('./routes/clips'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/channels', require('./routes/channels'));

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
