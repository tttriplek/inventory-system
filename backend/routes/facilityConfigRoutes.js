const express = require('express');
const router = express.Router();
const FacilityConfig = require('../models/FacilityConfig');

// Get current facility configuration
router.get('/', async (req, res) => {
  try {
    const config = await FacilityConfig.findOne().sort({ createdAt: -1 });
    res.json(config || { error: 'No facility configuration found' });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching facility configuration' });
  }
});

// Create or update facility configuration
router.post('/', async (req, res) => {
  try {
    const { facilityType, name } = req.body;
    
    // Get default configuration for facility type
    const defaultConfig = FacilityConfig.getDefaultConfig(facilityType);
    
    // Create new config with defaults and any overrides from req.body
    const config = new FacilityConfig({
      facilityType,
      name,
      features: { ...defaultConfig.features, ...(req.body.features || {}) },
      defaultSettings: { ...defaultConfig.defaultSettings, ...(req.body.defaultSettings || {}) },
      terminology: { ...defaultConfig.terminology, ...(req.body.terminology || {}) }
    });
    
    await config.save();
    res.status(201).json(config);
  } catch (err) {
    res.status(400).json({ error: 'Error creating facility configuration' });
  }
});

// Update specific features or settings
router.patch('/:id', async (req, res) => {
  try {
    const updates = {};
    
    // Only allow updating specific fields
    if (req.body.features) updates.features = req.body.features;
    if (req.body.defaultSettings) updates.defaultSettings = req.body.defaultSettings;
    if (req.body.terminology) updates.terminology = req.body.terminology;
    
    const config = await FacilityConfig.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    
    res.json(config);
  } catch (err) {
    res.status(400).json({ error: 'Error updating facility configuration' });
  }
});

module.exports = router;
