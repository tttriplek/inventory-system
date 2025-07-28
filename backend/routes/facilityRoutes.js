const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');

/**
 * GET /api/facilities
 * Get all facilities
 */
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find({})
      .select('_id name code type features location createdAt')
      .sort({ name: 1 });

    res.json({
      success: true,
      facilities,
      count: facilities.length
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch facilities',
      error: error.message
    });
  }
});

/**
 * GET /api/facilities/:id
 * Get a specific facility by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.json({
      success: true,
      facility
    });
  } catch (error) {
    console.error('Error fetching facility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch facility',
      error: error.message
    });
  }
});

/**
 * POST /api/facilities
 * Create a new facility
 */
router.post('/', async (req, res) => {
  try {
    const facilityData = req.body;
    
    // Check if code already exists
    const existingFacility = await Facility.findOne({ code: facilityData.code });
    if (existingFacility) {
      return res.status(400).json({
        success: false,
        message: 'Facility code already exists'
      });
    }

    const facility = new Facility(facilityData);
    await facility.save();

    res.status(201).json({
      success: true,
      message: 'Facility created successfully',
      facility
    });
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create facility',
      error: error.message
    });
  }
});

/**
 * PUT /api/facilities/:id
 * Update a facility
 */
router.put('/:id', async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.json({
      success: true,
      message: 'Facility updated successfully',
      facility
    });
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update facility',
      error: error.message
    });
  }
});

/**
 * DELETE /api/facilities/:id
 * Delete a facility
 */
router.delete('/:id', async (req, res) => {
  try {
    const facility = await Facility.findByIdAndDelete(req.params.id);
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.json({
      success: true,
      message: 'Facility deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete facility',
      error: error.message
    });
  }
});

/**
 * GET /api/facilities/:id/features
 * Get facility features and configuration
 */
router.get('/:id/features', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id)
      .select('_id name code type features');
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.json({
      success: true,
      facility: {
        id: facility._id,
        name: facility.name,
        code: facility.code,
        type: facility.type,
        features: facility.features
      }
    });
  } catch (error) {
    console.error('Error fetching facility features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch facility features',
      error: error.message
    });
  }
});

module.exports = router;
