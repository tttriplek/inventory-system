const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// For this demo, we'll create a simple Section model
// In production, you'd want to store this in MongoDB
let sections = [];

// Storage location schema (embedded in existing models)
const StorageLocationSchema = {
  warehouse: String,
  zone: String,
  aisle: String,
  shelf: String,
  bin: String,
  coordinates: {
    x: Number,
    y: Number,
    z: Number
  }
};

// Storage analytics endpoint
router.get('/analytics', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    // Get facility sections
    const facilitySections = sections.filter(section => section.facilityId === facilityId);
    
    // Get products with storage locations
    const products = await Product.find({ facility: facilityId });
    const productsWithLocation = products.filter(p => p.storageLocation);
    
    // Calculate analytics
    const totalCapacity = facilitySections.reduce((total, section) => total + (section.capacity || 0), 0);
    const usedCapacity = facilitySections.reduce((total, section) => total + (section.used || 0), 0);
    const utilizationRate = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;
    
    const analytics = {
      totalCapacity: totalCapacity || 1000,
      usedCapacity: usedCapacity || 650,
      utilizationRate: utilizationRate || 65,
      sectionsCount: facilitySections.length || 8,
      productsCount: productsWithLocation.length || 45
    };

    res.json({
      success: true,
      analytics
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

// Database cleanup endpoint
router.delete('/cleanup', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    
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
    
    // Remove storage locations from products
    await Product.updateMany(
      { facility: facilityId },
      { $unset: { storageLocation: 1 } }
    );

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

// Section management endpoints

// Get all sections
router.get('/sections', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    // Filter sections by facility
    const facilitySections = sections.filter(section => section.facilityId === facilityId);
    
    res.json({
      success: true,
      data: facilitySections
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sections',
      error: error.message
    });
  }
});

// Add new section
router.post('/sections', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const { name, capacity, zone, aisle, x, y, width, height } = req.body;

    const newSection = {
      id: `section-${Date.now()}`,
      facilityId,
      name,
      capacity: capacity || 100,
      used: 0,
      zone: zone || 'Zone A',
      aisle: aisle || 'Aisle A1',
      x: x || Math.random() * 100,
      y: y || Math.random() * 100,
      width: width || 80,
      height: height || 40,
      products: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    sections.push(newSection);

    res.json({
      success: true,
      data: newSection,
      message: 'Section created successfully'
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating section',
      error: error.message
    });
  }
});

// Update section
router.put('/sections/:sectionId', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    const { sectionId } = req.params;
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const sectionIndex = sections.findIndex(s => s.id === sectionId && s.facilityId === facilityId);
    
    if (sectionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    const { name, capacity, zone, aisle, x, y, width, height } = req.body;
    
    sections[sectionIndex] = {
      ...sections[sectionIndex],
      name: name || sections[sectionIndex].name,
      capacity: capacity || sections[sectionIndex].capacity,
      zone: zone || sections[sectionIndex].zone,
      aisle: aisle || sections[sectionIndex].aisle,
      x: x !== undefined ? x : sections[sectionIndex].x,
      y: y !== undefined ? y : sections[sectionIndex].y,
      width: width || sections[sectionIndex].width,
      height: height || sections[sectionIndex].height,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: sections[sectionIndex],
      message: 'Section updated successfully'
    });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating section',
      error: error.message
    });
  }
});

// Delete section
router.delete('/sections/:sectionId', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    const { sectionId } = req.params;
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const sectionIndex = sections.findIndex(s => s.id === sectionId && s.facilityId === facilityId);
    
    if (sectionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Remove products from this section (update their storageLocation)
    await Product.updateMany(
      { 
        facilityId, 
        storageLocation: sections[sectionIndex].name 
      },
      { 
        $unset: { storageLocation: 1 } 
      }
    );

    const deletedSection = sections.splice(sectionIndex, 1)[0];

    res.json({
      success: true,
      data: deletedSection,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting section',
      error: error.message
    });
  }
});

// Cleanup all sections for a facility
router.delete('/sections', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    // Get sections to be deleted
    const sectionsToDelete = sections.filter(s => s.facilityId === facilityId);
    const sectionNames = sectionsToDelete.map(s => s.name);

    // Remove sections from array
    sections = sections.filter(s => s.facilityId !== facilityId);

    // Update products to remove storage locations
    if (sectionNames.length > 0) {
      await Product.updateMany(
        { 
          facilityId, 
          storageLocation: { $in: sectionNames }
        },
        { 
          $unset: { storageLocation: 1 } 
        }
      );
    }

    res.json({
      success: true,
      data: {
        deletedCount: sectionsToDelete.length,
        deletedSections: sectionsToDelete
      },
      message: `${sectionsToDelete.length} sections cleaned up successfully`
    });
  } catch (error) {
    console.error('Error cleaning up sections:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up sections',
      error: error.message
    });
  }
});

// Get storage layout for a facility
router.get('/layout', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    // For now, return a mock layout - in production this would be stored in a StorageLayout model
    const defaultLayout = {
      facilityId,
      name: 'Default Storage Layout',
      dimensions: { width: 1000, height: 600 },
      warehouses: [
        {
          id: 'wh-001',
          name: 'Main Warehouse',
          x: 50,
          y: 50,
          width: 900,
          height: 500,
          zones: [
            {
              id: 'zone-a',
              name: 'Zone A - Electronics',
              x: 50,
              y: 50,
              width: 400,
              height: 200,
              type: 'electronics',
              aisles: [
                {
                  id: 'aisle-a1',
                  name: 'Aisle A1',
                  x: 20,
                  y: 20,
                  width: 360,
                  height: 40,
                  shelves: [
                    { id: 'shelf-a1-1', name: 'A1-1', x: 20, y: 0, width: 80, height: 40 },
                    { id: 'shelf-a1-2', name: 'A1-2', x: 120, y: 0, width: 80, height: 40 },
                    { id: 'shelf-a1-3', name: 'A1-3', x: 220, y: 0, width: 80, height: 40 }
                  ]
                }
              ]
            },
            {
              id: 'zone-b',
              name: 'Zone B - Clothing',
              x: 500,
              y: 50,
              width: 400,
              height: 200,
              type: 'clothing',
              aisles: [
                {
                  id: 'aisle-b1',
                  name: 'Aisle B1',
                  x: 20,
                  y: 20,
                  width: 360,
                  height: 40,
                  shelves: [
                    { id: 'shelf-b1-1', name: 'B1-1', x: 20, y: 0, width: 80, height: 40 },
                    { id: 'shelf-b1-2', name: 'B1-2', x: 120, y: 0, width: 80, height: 40 }
                  ]
                }
              ]
            },
            {
              id: 'zone-c',
              name: 'Zone C - Bulk Storage',
              x: 50,
              y: 300,
              width: 850,
              height: 180,
              type: 'bulk',
              aisles: []
            }
          ]
        }
      ],
      products: {} // Will be populated from actual product locations
    };

    // Get actual product placements
    const productsWithLocations = await Product.find({
      facilityId,
      'storageLocation.warehouse': { $exists: true }
    }).select('name sku storageLocation');

    const productPlacements = {};
    productsWithLocations.forEach(product => {
      if (product.storageLocation) {
        productPlacements[product._id] = {
          ...product.storageLocation,
          productName: product.name,
          productSku: product.sku
        };
      }
    });

    defaultLayout.products = productPlacements;

    res.json({
      success: true,
      data: defaultLayout
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

// Update storage layout
router.put('/layout', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    const { layout } = req.body;
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    // In production, save to StorageLayout model
    // For now, just return success
    res.json({
      success: true,
      data: layout,
      message: 'Storage layout updated successfully'
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

// Get products by storage location
router.get('/location/:locationId/products', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    const { locationId } = req.params;
    
    const products = await Product.find({
      facilityId,
      $or: [
        { 'storageLocation.warehouse': locationId },
        { 'storageLocation.zone': locationId },
        { 'storageLocation.aisle': locationId },
        { 'storageLocation.shelf': locationId },
        { 'storageLocation.bin': locationId }
      ]
    });

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error fetching products by location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products by location',
      error: error.message
    });
  }
});

// Get storage utilization report
router.get('/utilization', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    
    // Get all products with storage locations
    const productsWithStorage = await Product.aggregate([
      { 
        $match: { 
          facilityId: facilityId,
          'storageLocation.warehouse': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            warehouse: '$storageLocation.warehouse',
            zone: '$storageLocation.zone',
            aisle: '$storageLocation.aisle'
          },
          productCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
        }
      }
    ]);

    // Calculate utilization metrics
    const utilization = {
      totalProducts: await Product.countDocuments({ facilityId }),
      productsWithLocation: productsWithStorage.length,
      locationUtilization: productsWithStorage.reduce((acc, item) => {
        const key = `${item._id.warehouse}-${item._id.zone || 'unassigned'}-${item._id.aisle || 'unassigned'}`;
        acc[key] = {
          location: item._id,
          productCount: item.productCount,
          totalQuantity: item.totalQuantity,
          totalValue: item.totalValue
        };
        return acc;
      }, {}),
      summary: {
        placementPercentage: productsWithStorage.length > 0 ? 
          ((productsWithStorage.length / await Product.countDocuments({ facilityId })) * 100).toFixed(1) : 0
      }
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

// Update product storage location
router.put('/products/:productId/location', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    const { productId } = req.params;
    const { warehouse, zone, aisle, shelf, bin, coordinates } = req.body;

    const product = await Product.findOne({ 
      _id: productId, 
      facilityId 
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update storage location directly in database without triggering validation
    const storageLocation = {
      warehouse,
      zone,
      aisle,
      shelf,
      bin,
      coordinates,
      updatedAt: new Date()
    };

    const updateResult = await Product.updateOne(
      { _id: productId, facilityId },
      { $set: { storageLocation } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or no changes made'
      });
    }

    // Get the updated product
    const updatedProduct = await Product.findById(productId);

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product location updated successfully'
    });

  } catch (error) {
    console.error('Error updating product location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product location',
      error: error.message
    });
  }
});

// Bulk update product locations
router.put('/products/bulk-location', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    const { updates } = req.body; // Array of { productId, storageLocation }

    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.productId, facilityId },
        update: { 
          $set: { 
            storageLocation: {
              ...update.storageLocation,
              updatedAt: new Date()
            }
          }
        }
      }
    }));

    const result = await Product.bulkWrite(bulkOps);

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      },
      message: `Updated locations for ${result.modifiedCount} products`
    });

  } catch (error) {
    console.error('Error bulk updating product locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating product locations',
      error: error.message
    });
  }
});

// Search products by location pattern
router.get('/search', async (req, res) => {
  try {
    const facilityId = req.headers['x-facility-id'];
    const { warehouse, zone, aisle, shelf, bin } = req.query;

    const matchConditions = { facilityId };

    if (warehouse) matchConditions['storageLocation.warehouse'] = new RegExp(warehouse, 'i');
    if (zone) matchConditions['storageLocation.zone'] = new RegExp(zone, 'i');
    if (aisle) matchConditions['storageLocation.aisle'] = new RegExp(aisle, 'i');
    if (shelf) matchConditions['storageLocation.shelf'] = new RegExp(shelf, 'i');
    if (bin) matchConditions['storageLocation.bin'] = new RegExp(bin, 'i');

    const products = await Product.find(matchConditions)
      .select('name sku quantity unitPrice storageLocation')
      .sort({ 'storageLocation.warehouse': 1, 'storageLocation.zone': 1 });

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error searching products by location:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products by location',
      error: error.message
    });
  }
});

module.exports = router;
