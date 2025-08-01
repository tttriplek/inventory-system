const express = require('express');
const router = express.Router();
const Facility = require('../../core/facility/Facility');

/**
 * Get enterprise features for a specific facility
 */
router.get('/facility/:facilityId/enterprise', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const facility = await Facility.findOne({ code: facilityId });
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }
    
    // Extract enterprise features
    const enterpriseFeatures = {
      'smart-notifications': facility.features['smart-notifications']?.enabled || false,
      'financial-tracking': facility.features['financial-tracking']?.enabled || false,
      'multi-currency-support': facility.features['multi-currency-support']?.enabled || false,
      'cost-analysis': facility.features['cost-analysis']?.enabled || false,
      'security-compliance': facility.features['security-compliance']?.enabled || false,
      'insurance-integration': facility.features['insurance-integration']?.enabled || false,
      'audit-trails': facility.features['audit-trails']?.enabled || false
    };
    
    res.json({
      success: true,
      facilityId,
      facilityCode: facility.code,
      facilityName: facility.name,
      enterpriseFeatures
    });
    
  } catch (error) {
    console.error('Error getting enterprise features:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Toggle an enterprise feature for a facility
 */
router.patch('/facility/:facilityId/enterprise/:featureId', async (req, res) => {
  try {
    const { facilityId, featureId } = req.params;
    const { enabled } = req.body;
    
    const validFeatures = [
      'smart-notifications', 'financial-tracking', 'multi-currency-support',
      'cost-analysis', 'security-compliance', 'insurance-integration', 'audit-trails'
    ];
    
    if (!validFeatures.includes(featureId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid enterprise feature: ${featureId}`
      });
    }
    
    const facility = await Facility.findOne({ code: facilityId });
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }
    
    // Update the enterprise feature
    facility.features[featureId].enabled = Boolean(enabled);
    await facility.save();
    
    res.json({
      success: true,
      facilityId,
      featureId,
      enabled: Boolean(enabled),
      message: `Enterprise feature ${featureId} ${enabled ? 'enabled' : 'disabled'}`
    });
    
  } catch (error) {
    console.error('Error toggling enterprise feature:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
