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
  await clipsDb.delete(req.params.id);
  res.json({ success: true, message: 'Clip deleted' });
});

// DELETE /api/clips (DELETE ALL)
router.delete('/', async (req, res) => {
  await clipsDb.deleteAll();
  res.json({ success: true, message: 'All clips deleted' });
});

module.exports = router;
