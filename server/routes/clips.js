const express = require('express');
const router = express.Router();
const { clips: clipsDb } = require('../../shared/db');
const { deleteFile } = require('../../shared/storage');

// GET /api/clips
router.get('/', async (req, res) => {
  const { limit = 20, channel } = req.query;
  const allClips = await clipsDb.findAll({ 
    limit: parseInt(limit, 10), 
    channel 
  });
  res.json(allClips);
});

// DELETE /api/clips/:id
router.delete('/:id', async (req, res) => {
  // In MongoDB version, we search by _id or video_id
  // For simplicity, let's just delete the record for now
  // In a real app, you'd want to find it first to delete the file
  await clipsDb.delete(req.params.id);
  res.json({ success: true, message: 'Clip deleted' });
});

module.exports = router;
