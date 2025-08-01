/**
 * Revolutionary Inventory System - Feature Toggle API Routes
 * 
 * RESTful API for managing feature toggles at system and facility levels
 */

const express = require('express');
const router = express.Router();
const { featureManager, FEATURE_DEFINITIONS, FEATURE_CATEGORIES } = require('../services/FeatureManager');

// GET /api/features/definitions - Get feature definitions only
router.get('/definitions', (req, res) => {
  try {
    res.json({
      success: true,
      features: Object.values(FEATURE_DEFINITIONS)
    });
  } catch (error) {
    console.error('Error getting feature definitions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get feature definitions' 
    });
  }
});

// GET /api/features - Get all feature definitions and categories
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        definitions: FEATURE_DEFINITIONS,
        categories: FEATURE_CATEGORIES,
        version: '3.0.0'
      }
    });
  } catch (error) {
    console.error('Error getting feature definitions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get feature definitions' 
    });
  }
});

// GET /api/features/global/config - Get global feature configuration
router.get('/global/config', (req, res) => {
  try {
    const config = featureManager.globalConfig;
    const analysis = featureManager.getFeatureAnalysis();
    
    res.json({
      success: true,
      data: {
        config,
        analysis,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting global config:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get global configuration' 
    });
  }
});

// PUT /api/features/global/config - Update global feature configuration
router.put('/global/config', (req, res) => {
  try {
    const { config, options = {} } = req.body;
    
    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration format'
      });
    }
    
    const result = featureManager.setGlobalConfig(config);
    const analysis = featureManager.getFeatureAnalysis();
    
    res.json({
      success: true,
      data: {
        result,
        config: featureManager.globalConfig,
        analysis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating global config:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/features/global/toggles - Get feature toggles for admin UI
router.get('/global/toggles', (req, res) => {
  try {
    const toggles = featureManager.getFeatureToggles();
    
    res.json({
      success: true,
      data: {
        toggles,
        categories: FEATURE_CATEGORIES,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting global toggles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get feature toggles' 
    });
  }
});

// GET /api/features/facility/:facilityId/config - Get facility feature configuration
router.get('/facility/:facilityId/config', (req, res) => {
  try {
    const { facilityId } = req.params;
    const config = featureManager.getEffectiveFacilityConfig(facilityId);
    const analysis = featureManager.getFeatureAnalysis(facilityId);
    
    res.json({
      success: true,
      data: {
        facilityId,
        config,
        analysis,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting facility config:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get facility configuration' 
    });
  }
});

// PUT /api/features/facility/:facilityId/config - Update facility feature configuration
router.put('/facility/:facilityId/config', (req, res) => {
  try {
    const { facilityId } = req.params;
    const { config, options = {} } = req.body;
    
    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration format'
      });
    }
    
    const result = featureManager.setFacilityConfig(facilityId, config);
    const analysis = featureManager.getFeatureAnalysis(facilityId);
    
    res.json({
      success: true,
      data: {
        facilityId,
        result,
        config: featureManager.getEffectiveFacilityConfig(facilityId),
        analysis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating facility config:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/features/facility/:facilityId/toggles - Get facility feature toggles
router.get('/facility/:facilityId/toggles', (req, res) => {
  try {
    const { facilityId } = req.params;
    const toggles = featureManager.getFeatureToggles(facilityId);
    const globalToggles = featureManager.getFeatureToggles();
    
    res.json({
      success: true,
      data: {
        facilityId,
        toggles,
        globalToggles,
        categories: FEATURE_CATEGORIES,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting facility toggles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get facility feature toggles' 
    });
  }
});

// POST /api/features/enable - Enable feature(s) with dependency resolution
router.post('/enable', (req, res) => {
  try {
    const { featureId, facilityId, options = {} } = req.body;
    
    if (!featureId) {
      return res.status(400).json({
        success: false,
        error: 'Feature ID is required'
      });
    }
    
    const result = featureManager.enableFeature(featureId, facilityId, options);
    const config = facilityId 
      ? featureManager.getEffectiveFacilityConfig(facilityId)
      : featureManager.globalConfig;
    
    res.json({
      success: true,
      data: {
        featureId,
        facilityId,
        result,
        config,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error enabling feature:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/features/disable - Disable feature with dependent check
router.post('/disable', (req, res) => {
  try {
    const { featureId, facilityId, options = {} } = req.body;
    
    if (!featureId) {
      return res.status(400).json({
        success: false,
        error: 'Feature ID is required'
      });
    }
    
    const result = featureManager.disableFeature(featureId, facilityId, options);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    const config = facilityId 
      ? featureManager.getEffectiveFacilityConfig(facilityId)
      : featureManager.globalConfig;
    
    res.json({
      success: true,
      data: {
        featureId,
        facilityId,
        result,
        config,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error disabling feature:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/features/check/:featureId - Check if specific feature is enabled
router.get('/check/:featureId', (req, res) => {
  try {
    const { featureId } = req.params;
    const { facilityId } = req.query;
    
    const enabled = featureManager.isFeatureEnabled(featureId, facilityId);
    const definition = FEATURE_DEFINITIONS[featureId];
    
    if (!definition) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }
    
    const dependents = featureManager.findDependentFeatures(featureId, facilityId);
    
    res.json({
      success: true,
      data: {
        featureId,
        facilityId,
        enabled,
        definition,
        dependents,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking feature:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check feature status' 
    });
  }
});

// GET /api/features/analysis - Get comprehensive feature analysis
router.get('/analysis', (req, res) => {
  try {
    const { facilityId } = req.query;
    const analysis = featureManager.getFeatureAnalysis(facilityId);
    
    res.json({
      success: true,
      data: {
        facilityId,
        analysis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting feature analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get feature analysis' 
    });
  }
});

// POST /api/features/bulk-update - Bulk update multiple features
router.post('/bulk-update', (req, res) => {
  try {
    const { updates, facilityId, options = {} } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'Updates array is required'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        if (update.enabled) {
          const result = featureManager.enableFeature(update.featureId, facilityId, options);
          results.push({ featureId: update.featureId, action: 'enable', result });
        } else {
          const result = featureManager.disableFeature(update.featureId, facilityId, options);
          results.push({ featureId: update.featureId, action: 'disable', result });
        }
      } catch (error) {
        errors.push({ featureId: update.featureId, error: error.message });
      }
    }
    
    const config = facilityId 
      ? featureManager.getEffectiveFacilityConfig(facilityId)
      : featureManager.globalConfig;
    
    res.json({
      success: errors.length === 0,
      data: {
        facilityId,
        results,
        errors,
        config,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error bulk updating features:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to bulk update features' 
    });
  }
});

module.exports = router;
