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
const { User, Clip } = require('./models');
const cron = require('node-cron');
const storage = require('../shared/storage');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Initialize Database and Storage
async function startApp() {
  try {
    console.log('🔄 Initializing Database...');
    await initDatabase();
    
    // Seed Initial Admin User if none exists
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const passwordHash = await bcrypt.hash('FIREFISTDEAD', 12);
      await User.create({
        email: 'PPClipper@admin.com',
        passwordHash: passwordHash
      });
      logger.info('✅ Initial admin user seeded: PPClipper@admin.com');
    } else {
      logger.info(`ℹ️ Database already has ${userCount} users.`);
    }
    
    ensureDirectories();
  } catch (err) {
    logger.error(`❌ App Initialization Error: ${err.message}`);
  }
}

startApp();

// Middleware
app.use(cors({ origin: true, credentials: true })); // Allow credentials for cookies
app.use(express.json());
app.use(cookieParser());

const { authenticateToken } = require('./middleware/authenticate');

// Routes
app.use('/api/nightbot', require('./routes/nightbot'));
app.use('/api/auth', require('./routes/auth'));

// Protected Routes
app.use('/api/clips', authenticateToken, require('./routes/clips'));
app.use('/api/stats', authenticateToken, require('./routes/stats'));
app.use('/api/channels', authenticateToken, require('./routes/channels'));

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

});

// Auto-delete clips older than 2 days
cron.schedule('0 * * * *', async () => {
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const oldClips = await Clip.find({ created_at: { $lt: twoDaysAgo } });
    
    if (oldClips.length > 0) {
      logger.info(`[Auto-Delete] Found ${oldClips.length} clips older than 2 days. Starting cleanup...`);
      
      for (const clip of oldClips) {
        // Delete video file
        const videoPath = storage.getClipPath(clip.channel_title || 'unknown', clip.video_id);
        storage.deleteFile(videoPath);
        
        // Delete thumbnail file
        const thumbPath = storage.getThumbnailPath(clip.video_id);
        storage.deleteFile(thumbPath);
      }
      
      const result = await Clip.deleteMany({ created_at: { $lt: twoDaysAgo } });
      logger.info(`[Auto-Delete] Successfully removed ${result.deletedCount} clips from database.`);
    }
  } catch (err) {
    logger.error(`[Auto-Delete] Error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  logger.info(`🚀 AntyGravity API server running on http://localhost:${PORT}`);
});
