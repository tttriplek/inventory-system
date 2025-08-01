const { getFacilityConfiguration } = require('../config/facilityConfigurations');

/**
 * Middleware to load facility configuration
 * Adds facility configuration to the request object
 */
const loadFacilityConfig = (req, res, next) => {
  try {
    const facilityId = req.facilityId || req.headers['x-facility-id'] || req.query.facilityId;
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required',
        code: 'FACILITY_ID_MISSING'
      });
    }
    
    // Load facility configuration
    const facilityConfig = getFacilityConfiguration(facilityId);
    
    // Add to request object
    req.facilityConfig = facilityConfig;
    req.facilityId = facilityId;
    
    next();
  } catch (error) {
    console.error('Error loading facility configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load facility configuration',
      error: error.message
    });
  }
};

module.exports = {
  loadFacilityConfig
};
