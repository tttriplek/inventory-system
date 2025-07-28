// models/ActivityLog.js

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'create', 'update', 'delete'
  entity: { type: String, required: true }, // e.g., 'Product', 'Batch', 'Distribution'
  entityId: { type: String }, // ID of the affected entity
  user: { type: String }, // Username or user ID (if available)
  details: { type: Object }, // Additional info (before/after, fields changed, etc.)
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
