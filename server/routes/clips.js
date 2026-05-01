const express = require('express');
const router = express.Router();
const { Clip } = require('../models');

// GET /api/clips
router.get('/', async (req, res) => {
  try {
    const { 
      channel, 
      streamer, 
      from, 
      to, 
      search, 
      duration,
      sort = 'newest', 
      page = 1, 
      limit = 20 
    } = req.query;

    const query = {};

    // Filter by Channel
    if (channel && channel !== 'all') {
      query.$or = [
        { channel_id: channel },
        { channel_title: channel }
      ];
    }

    // Filter by Streamer (using channel_title)
    if (streamer && streamer !== 'all') {
      query.clipped_by = streamer;
    }

    // Filter by Duration
    if (duration && duration !== 'any') {
      if (duration === 'short') query.duration = { $lt: 240 };
      else if (duration === 'medium') query.duration = { $gte: 240, $lte: 1200 };
      else if (duration === 'long') query.duration = { $gt: 1200 };
    }

    // Filter by Date Range
    if (from || to) {
      query.created_at = {};
      if (from) query.created_at.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.created_at.$lte = toDate;
      }
    }

    // Search Bar
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: searchRegex },
          { clipped_by: searchRegex },
          { channel_title: searchRegex },
          { game_name: searchRegex }
        ]
      });
    }

    // Sorting
    let sortOptions = { created_at: -1 };
    if (sort === 'oldest') sortOptions = { created_at: 1 };
    if (sort === 'channel_az') sortOptions = { channel_title: 1 };
    if (sort === 'duration') sortOptions = { duration: -1 };
    if (sort === 'duration_asc') sortOptions = { duration: 1 };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clips, totalCount, uniqueChannels, uniqueStreamers] = await Promise.all([
      Clip.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit)),
      Clip.countDocuments(query),
      Clip.distinct('channel_title', { channel_title: { $ne: null } }),
      Clip.distinct('clipped_by', { clipped_by: { $ne: null } })
    ]);

    res.json({
      clips,
      totalCount,
      channels: uniqueChannels.sort(),
      streamers: uniqueStreamers.sort(),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clips/:id
router.delete('/:id', async (req, res) => {
  try {
    await Clip.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Clip deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clips (DELETE ALL)
router.delete('/', async (req, res) => {
  try {
    await Clip.deleteMany({});
    res.json({ success: true, message: 'All clips deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
