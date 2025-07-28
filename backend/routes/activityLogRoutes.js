const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');

// GET /api/activity-logs - fetch recent activity logs
router.get('/', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
