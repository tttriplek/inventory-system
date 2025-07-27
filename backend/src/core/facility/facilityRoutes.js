const express = require('express');
const { body, param, validationResult } = require('express-validator');
const FacilityService = require('./FacilityService');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * Professional Facility API Routes
 * 
 * RESTful endpoints for facility management with comprehensive
 * validation, error handling, and professional response formats.
 */

// 🏢 GET /api/facilities - List all facilities
router.get('/', async (req, res) => {
  try {
    const { status, type, features } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (features) {
      // Allow filtering by enabled features
      const featureList = features.split(',');
      featureList.forEach(feature => {
        query[`features.${feature}.enabled`] = true;
      });
    }

    const facilities = await require('./Facility').find(query)
      .select('name code type status location.city features setupCompleted')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: facilities,
      count: facilities.length,
      message: 'Facilities retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to fetch facilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve facilities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🏢 POST /api/facilities - Create new facility
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 })
    .withMessage('Facility name must be 2-100 characters'),
  body('type').isIn(['warehouse', 'retail', 'distribution', 'manufacturing', 'hybrid'])
    .withMessage('Invalid facility type'),
  body('location.address').notEmpty()
    .withMessage('Address is required'),
  body('location.city').notEmpty()
    .withMessage('City is required'),
  body('location.country').notEmpty()
    .withMessage('Country is required'),
  body('contact.email').optional().isEmail()
    .withMessage('Invalid email format')
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user?.id || 'system'; // From auth middleware
    const facility = await FacilityService.createFacility(req.body, userId);

    res.status(201).json({
      success: true,
      data: facility,
      message: `Facility '${facility.name}' created successfully`
    });

  } catch (error) {
    logger.error('Facility creation failed:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Facility code already exists',
        field: 'code'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create facility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🏢 GET /api/facilities/:id - Get facility by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid facility ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid facility ID',
        errors: errors.array()
      });
    }

    const config = await FacilityService.getFacilityConfig(req.params.id);
    
    res.json({
      success: true,
      data: config,
      message: 'Facility configuration retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get facility:', error);
    
    if (error.message === 'Facility not found') {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve facility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🎯 PUT /api/facilities/:id/features - Update facility features
router.put('/:id/features', [
  param('id').isMongoId().withMessage('Invalid facility ID'),
  body().custom((value) => {
    if (typeof value !== 'object' || value === null) {
      throw new Error('Request body must be an object');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user?.id || 'system';
    const facility = await FacilityService.updateFeatures(
      req.params.id, 
      req.body, 
      userId
    );

    res.json({
      success: true,
      data: {
        id: facility._id,
        features: facility.features,
        enabledFeatures: facility.getEnabledFeatures()
      },
      message: 'Facility features updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update facility features:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update facility features',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔍 GET /api/facilities/:id/features/:feature - Check specific feature
router.get('/:id/features/:feature', [
  param('id').isMongoId().withMessage('Invalid facility ID'),
  param('feature').notEmpty().withMessage('Feature path is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const isEnabled = await FacilityService.isFeatureEnabled(
      req.params.id, 
      req.params.feature
    );

    res.json({
      success: true,
      data: {
        feature: req.params.feature,
        enabled: isEnabled
      },
      message: 'Feature status retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to check feature status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check feature status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📊 GET /api/facilities/:id/metrics - Get facility metrics
router.get('/:id/metrics', [
  param('id').isMongoId().withMessage('Invalid facility ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const metrics = await FacilityService.getFacilityMetrics(req.params.id);
    
    res.json({
      success: true,
      data: metrics,
      message: 'Facility metrics retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get facility metrics:', error);
    
    if (error.message === 'Facility not found') {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve facility metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🚀 POST /api/facilities/:id/setup/:step - Complete setup step
router.post('/:id/setup/:step', [
  param('id').isMongoId().withMessage('Invalid facility ID'),
  param('step').isIn(['basicInfo', 'features', 'sections', 'users', 'testing'])
    .withMessage('Invalid setup step')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user?.id || 'system';
    const result = await FacilityService.completeSetupStep(
      req.params.id, 
      req.params.step, 
      userId
    );

    res.json({
      success: true,
      data: {
        completedStep: req.params.step,
        progress: result.progress,
        nextStep: result.nextStep,
        setupCompleted: result.facility.setupCompleted
      },
      message: `Setup step '${req.params.step}' completed successfully`
    });

  } catch (error) {
    logger.error('Failed to complete setup step:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete setup step',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  logger.error('Facility API Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in facility API',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;
