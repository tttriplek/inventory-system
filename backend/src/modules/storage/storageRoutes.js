const express = require('express');
const router = express.Router();
const Product = require('../products/Product');

// For this demo, we'll create a simple Section model
// In production, you'd want to store this in MongoDB
let sections = [];

// Mock layout data structure
const createMockLayout = (facilityId) => {
  return {
    facilityId,
    name: 'Storage Layout',
    dimensions: { width: 1000, height: 600 },
    warehouses: [
      {
        id: 'warehouse-1',
        name: 'Main Warehouse',
        dimensions: { width: 800, height: 500 },
        position: { x: 100, y: 50 },
        zones: [
          {
            id: 'zone-1',
            name: 'Zone A',
            dimensions: { width: 200, height: 200 },
            position: { x: 50, y: 50 },
            aisles: [
              {
                id: 'aisle-1',
                name: 'Aisle A1',
                dimensions: { width: 80, height: 180 },
                position: { x: 10, y: 10 }
              }
            ]
          }
        ]
      }
    ]
  };
};

// Storage layout endpoint
router.get('/layout', async (req, res) => {
  try {
    const facilityId = req.facilityId || req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    // Create mock layout for now
    const layout = createMockLayout(facilityId);

    res.json({
      success: true,
      data: layout
    });
  } catch (error) {
    console.error('Error fetching storage layout:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching storage layout',
      error: error.message
    });
  }
});

// Storage utilization endpoint
router.get('/utilization', async (req, res) => {
  try {
    const facilityId = req.facilityId || req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    // Mock utilization data
    const utilization = {
      totalCapacity: 1000,
      usedCapacity: 650,
      utilizationRate: 65,
      sections: [
        {
          id: 'section-1',
          name: 'Section A',
          capacity: 200,
          used: 150,
          utilizationRate: 75
        },
        {
          id: 'section-2',
          name: 'Section B',
          capacity: 300,
          used: 200,
          utilizationRate: 67
        }
      ]
    };

    res.json({
      success: true,
      data: utilization
    });
  } catch (error) {
    console.error('Error fetching storage utilization:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching storage utilization',
      error: error.message
    });
  }
});

// Storage analytics endpoint
router.get('/analytics', async (req, res) => {
  try {
    const facilityId = req.facilityId || req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const analytics = {
      totalCapacity: 1000,
      usedCapacity: 650,
      utilizationRate: 65,
      sectionsCount: 8,
      productsCount: 45
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching storage analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching storage analytics',
      error: error.message
    });
  }
});

// Update layout endpoint
router.put('/layout', async (req, res) => {
  try {
    const facilityId = req.facilityId || req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    // For now, just return success
    // In production, you would save the layout to database
    const updatedLayout = req.body;

    res.json({
      success: true,
      message: 'Storage layout updated successfully',
      data: updatedLayout
    });
  } catch (error) {
    console.error('Error updating storage layout:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating storage layout',
      error: error.message
    });
  }
});

// Database cleanup endpoint
router.delete('/cleanup', async (req, res) => {
  try {
    const facilityId = req.facilityId || req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    // Remove all sections for this facility
    const originalLength = sections.length;
    sections = sections.filter(section => section.facilityId !== facilityId);
    const deletedCount = originalLength - sections.length;

    res.json({
      success: true,
      message: `Database cleanup successful. ${deletedCount} sections removed.`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up database:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up database',
      error: error.message
    });
  }
});

module.exports = router;
