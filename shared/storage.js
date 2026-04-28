/**
 * AntyGravity — File Storage Manager
 * Manages the clips/ directory structure on disk
 */

const fs = require('fs');
const path = require('path');
const logger = require('../bot/utils/logger');

const CLIPS_ROOT = path.join(process.cwd(), 'clips');

const DIRS = {
  root: CLIPS_ROOT,
  downloads: path.join(CLIPS_ROOT, 'downloads'),
  thumbnails: path.join(CLIPS_ROOT, 'thumbnails'),
  temp: path.join(CLIPS_ROOT, 'temp'),
};

/**
 * Create all required clip directories
 */
async function ensureDirectories() {
  for (const [name, dirPath] of Object.entries(DIRS)) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: clips/${name === 'root' ? '' : name}`);
    }
  }
}

/**
 * Get path for a clip download
 * @param {string} streamerName
 * @param {string} clipId
 */
function getClipPath(streamerName, clipId) {
  const streamerDir = path.join(DIRS.downloads, sanitizeName(streamerName));
  if (!fs.existsSync(streamerDir)) fs.mkdirSync(streamerDir, { recursive: true });
  return path.join(streamerDir, `${clipId}.mp4`);
}

/**
 * Get path for a clip thumbnail
 * @param {string} clipId
 */
function getThumbnailPath(clipId) {
  return path.join(DIRS.thumbnails, `${clipId}.jpg`);
}

/**
 * Get path for a temp file
 * @param {string} filename
 */
function getTempPath(filename) {
  return path.join(DIRS.temp, filename);
}

/**
 * Delete a clip file from disk
 * @param {string} filePath
 */
function deleteFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Deleted file: ${filePath}`);
      return true;
    }
  } catch (err) {
    logger.error(`Failed to delete file ${filePath}:`, err);
  }
  return false;
}

/**
 * Get total size used in the clips directory (bytes)
 */
function getStorageUsed() {
  return getDirSize(DIRS.downloads);
}

function getDirSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += getDirSize(fullPath);
    } else {
      try {
        total += fs.statSync(fullPath).size;
      } catch {}
    }
  }
  return total;
}

/**
 * Clean up temp directory
 */
function cleanTemp() {
  if (!fs.existsSync(DIRS.temp)) return;
  for (const file of fs.readdirSync(DIRS.temp)) {
    try {
      fs.unlinkSync(path.join(DIRS.temp, file));
    } catch {}
  }
  logger.info('Temp directory cleaned.');
}

/**
 * Delete clips older than N days
 * @param {number} days
 */
function cleanOldClips(days = 30) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  let deleted = 0;

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else {
        try {
          const stat = fs.statSync(fullPath);
          if (stat.mtimeMs < cutoff) {
            fs.unlinkSync(fullPath);
            deleted++;
          }
        } catch {}
      }
    }
  }

  walkDir(DIRS.downloads);
  if (deleted > 0) logger.info(`Cleaned ${deleted} old clip file(s) older than ${days} days.`);
  return deleted;
}

/**
 * Format bytes into human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if file is within Discord's 25MB attachment limit
 */
function isWithinDiscordLimit(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.size <= 25 * 1024 * 1024; // 25MB
  } catch {
    return false;
  }
}

/**
 * Sanitize a name for use in file paths
 */
function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

module.exports = {
  DIRS,
  ensureDirectories,
  getClipPath,
  getThumbnailPath,
  getTempPath,
  deleteFile,
  getStorageUsed,
  formatBytes,
  cleanTemp,
  cleanOldClips,
  isWithinDiscordLimit,
  sanitizeName,
};
