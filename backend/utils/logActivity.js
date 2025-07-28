// backend/utils/logActivity.js
const ActivityLog = require('../models/ActivityLog');

async function logActivity({ action, entity, entityId, user, details }) {
  try {
    await ActivityLog.create({ action, entity, entityId, user, details });
  } catch (err) {
    console.error('Activity log error:', err);
  }
}

module.exports = logActivity;
