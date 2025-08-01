const express = require('express');
const router = express.Router();
const featureManager = require('./FeatureManager');
const { featureDefinitions, getAllFeatures } = require('./feature-definitions');

// Get all feature definitions
router.get('/definitions', (req, res) => {
  try {
    res.json({
      success: true,
      features: getAllFeatures()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get global feature configuration
router.get('/global/toggles', (req, res) => {
  try {
    const config = featureManager.getGlobalConfig();
    const analysis = featureManager.getFeatureAnalysis('global');
    
    res.json({
      success: true,
      config,
      analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update global feature configuration
router.put('/global/toggles', (req, res) => {
  try {
    const { features } = req.body;
    const results = featureManager.setMultipleFeatures('global', features);
    
    res.json({
      success: true,
      results: results.results,
      errors: results.errors,
      config: featureManager.getGlobalConfig()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get facility-specific feature configuration
router.get('/facility/:facilityId/toggles', (req, res) => {
  try {
    const { facilityId } = req.params;
    const config = featureManager.getFacilityConfig(facilityId);
    const analysis = featureManager.getFeatureAnalysis(facilityId);
    
    res.json({
      success: true,
      facilityId,
      config,
      analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update facility-specific feature configuration
router.put('/facility/:facilityId/toggles', (req, res) => {
  try {
    const { facilityId } = req.params;
    const { features } = req.body;
    const results = featureManager.setMultipleFeatures(facilityId, features);
    
    res.json({
      success: true,
      facilityId,
      results: results.results,
      errors: results.errors,
      config: featureManager.getFacilityConfig(facilityId)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Toggle a single feature for a facility
router.patch('/facility/:facilityId/toggles/:featureId', (req, res) => {
  try {
    const { facilityId, featureId } = req.params;
    const { enabled } = req.body;
    
    const changes = featureManager.setFacilityFeature(facilityId, featureId, enabled);
    
    res.json({
      success: true,
      facilityId,
      featureId,
      enabled,
      changes,
      config: featureManager.getFacilityConfig(facilityId)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get feature analysis for a facility
router.get('/facility/:facilityId/analysis', (req, res) => {
  try {
    const { facilityId } = req.params;
    const analysis = featureManager.getFeatureAnalysis(facilityId);
    
    res.json({
      success: true,
      facilityId,
      analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reset facility configuration to defaults
router.post('/facility/:facilityId/reset', (req, res) => {
  try {
    const { facilityId } = req.params;
    featureManager.resetToDefaults(facilityId);
    
    res.json({
      success: true,
      facilityId,
      message: 'Configuration reset to defaults',
      config: featureManager.getFacilityConfig(facilityId)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export facility configuration
router.get('/facility/:facilityId/export', (req, res) => {
  try {
    const { facilityId } = req.params;
    const exportData = featureManager.exportConfig(facilityId);
    
    res.json({
      success: true,
      exportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Import facility configuration
router.post('/facility/:facilityId/import', (req, res) => {
  try {
    const { facilityId } = req.params;
    const { configData } = req.body;
    
    const results = featureManager.importConfig(facilityId, configData);
    
    res.json({
      success: true,
      facilityId,
      results: results.results,
      errors: results.errors,
      config: featureManager.getFacilityConfig(facilityId)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bulk enable/disable features by category
router.post('/facility/:facilityId/category/:category', (req, res) => {
  try {
    const { facilityId, category } = req.params;
    const { enabled } = req.body;
    
    const categoryFeatures = getAllFeatures()
      .filter(feature => feature.category === category)
      .reduce((acc, feature) => {
        acc[feature.id] = enabled;
        return acc;
      }, {});
    
    const results = featureManager.setMultipleFeatures(facilityId, categoryFeatures);
    
    res.json({
      success: true,
      facilityId,
      category,
      enabled,
      results: results.results,
      errors: results.errors,
      config: featureManager.getFacilityConfig(facilityId)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
