const express = require('express');
const router = express.Router();
const { stats } = require('../../shared/db');

// GET /api/stats
router.get('/', async (req, res) => {
  res.json(await stats.getOverview());
});

module.exports = router;
