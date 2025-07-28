const mongoose = require('mongoose');

// Removed rackSchema; section now has rackCount and shared dimensions


const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  allowedCategories: [String],
  rackCount: { type: Number, required: true },
  length: { type: Number, required: true }, // rack length
  width: { type: Number, required: true },  // rack width
  height: { type: Number, required: true }  // rack height
});

module.exports = mongoose.model('Section', sectionSchema);
