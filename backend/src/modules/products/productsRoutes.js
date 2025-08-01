const express = require('express');
const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const Product = require('./Product');
const ProductsService = require('./ProductsService');
const logger = require('../../utils/logger');
const { loadFacilityConfig } = require('../../middleware/facilityConfig');
const { getFacilityConfiguration } = require('../../config/facilityConfigurations');

const router = express.Router();

/**
 * Professional Products API Routes
 * 
 * RESTful endpoints for product management with comprehensive
 * validation, feature-aware functionality, and professional response formats.
 */

// 📦 GET /api/products - Get products with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('category').optional().trim().isLength({ min: 1 }),
  query('status').optional().isIn(['active', 'reserved', 'damaged', 'expired', 'recalled']),
  query('search').optional().trim().isLength({ min: 1 }),
  query('expiring').optional().isInt({ min: 1 }).withMessage('Expiring days must be positive'),
  query('lowStock').optional().isInt({ min: 1 }).withMessage('Low stock threshold must be positive')
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

    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required',
        code: 'FACILITY_ID_MISSING'
      });
    }

    const { page, limit, sort, ...filters } = req.query;
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sort: sort ? JSON.parse(sort) : { createdAt: -1 },
      ...filters
    };

    const result = await ProductsService.getProducts(facilityId, {}, options);

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
      message: 'Products retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📦 GET /api/products/grouped - Get products grouped by name and SKU prefix
router.get('/grouped', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be 1-10000'),
  query('category').optional().trim().isLength({ min: 1 }),
  query('status').optional().isIn(['active', 'reserved', 'damaged', 'expired', 'recalled']),
  query('search').optional().trim().isLength({ min: 1 }),
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

    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required',
        code: 'FACILITY_ID_MISSING'
      });
    }

    const { page, limit, sort, ...filters } = req.query;
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sort: sort ? JSON.parse(sort) : { createdAt: -1 },
      ...filters
    };

    const result = await ProductsService.getGroupedProducts(facilityId, {}, options);

    res.json({
      success: true,
      data: result.groups,
      metadata: {
        totalGroups: result.totalGroups,
        totalIndividualProducts: result.totalIndividualProducts
      },
      message: 'Grouped products retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get grouped products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve grouped products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📦 GET /api/products/suggestions - Get product name suggestions
router.get('/suggestions', [
  query('name').trim().isLength({ min: 1 }).withMessage('Name query is required'),
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

    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const { name } = req.query;
    
    // Find similar product names (case-insensitive partial match)
    const suggestions = await Product.aggregate([
      {
        $match: {
          facilityId: new mongoose.Types.ObjectId(facilityId),
          name: { $regex: name, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$name',
          skuPrefix: { $first: { $arrayElemAt: [{ $split: ['$batchId', '-'] }, 0] } },
          totalQuantity: { $sum: '$quantity' },
          lastCreated: { $max: '$createdAt' },
          sampleProduct: { $first: '$$ROOT' }
        }
      },
      {
        $project: {
          name: '$_id',
          skuPrefix: 1,
          totalQuantity: 1,
          lastCreated: 1,
          category: '$sampleProduct.category',
          pricePerUnit: '$sampleProduct.pricePerUnit',
          description: '$sampleProduct.description'
        }
      },
      {
        $sort: { totalQuantity: -1, lastCreated: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: suggestions,
      message: 'Product suggestions retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get product suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📦 POST /api/products - Create individual products for each unit
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 })
    .withMessage('Product name must be 2-100 characters'),
  body('category.primary').trim().isLength({ min: 2, max: 50 })
    .withMessage('Primary category must be 2-50 characters'),
  body('quantity').isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('pricing.sellingPrice').isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  body('description').optional().isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
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

    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required',
        code: 'FACILITY_ID_MISSING'
      });
    }

    // Transform the frontend data format to match the service
    const serviceData = {
      name: req.body.name,
      category: req.body.category?.primary || 'General',
      quantity: req.body.quantity,
      pricePerUnit: req.body.pricing?.sellingPrice || 0,
      description: req.body.description
    };

    const userId = req.user?.id || 'system';
    const products = await ProductsService.createProduct(serviceData, facilityId, userId);

    res.status(201).json({
      success: true,
      data: products,
      count: products.length,
      message: `${products.length} individual products created successfully in batch`
    });

  } catch (error) {
    logger.error('Product creation failed:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Product SKU already exists',
        field: 'sku'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔄 PUT /api/products/batch/:batchId - Update all products in a batch
router.put('/batch/:batchId', [
  body('name').optional().trim().isLength({ min: 2, max: 100 })
    .withMessage('Product name must be 2-100 characters'),
  body('category.primary').optional().trim().isLength({ min: 2, max: 50 })
    .withMessage('Primary category must be 2-50 characters'),
  body('pricing.sellingPrice').optional().isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  body('description').optional().isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
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

    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const { batchId } = req.params;
    const userId = req.user?.id || 'system';

    // Transform the frontend data format to match the database
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.category?.primary) updateData.category = req.body.category.primary;
    if (req.body.pricing?.sellingPrice) updateData.pricePerUnit = req.body.pricing.sellingPrice;
    if (req.body.description) updateData.description = req.body.description;
    
    updateData.updatedBy = userId;
    updateData.updatedAt = new Date();

    // Find all products in the batch first
    const batchProducts = await Product.find({ batchId, facilityId });
    
    if (batchProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found for this batch'
      });
    }

    console.log(`Updating ${batchProducts.length} products in batch ${batchId}`);

    // Update all products in the batch
    const result = await Product.updateMany(
      { batchId, facilityId },
      { $set: updateData }
    );

    console.log(`Successfully updated ${result.modifiedCount} products in batch ${batchId}`);

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} products in batch ${batchId}`,
      modifiedCount: result.modifiedCount,
      batchId
    });

  } catch (error) {
    logger.error('Batch update failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// � GET /api/products/analytics - Revolutionary Analytics Dashboard
router.get('/analytics', async (req, res) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const analytics = await ProductsService.getAnalytics(facilityId);

    // Log analytics access
    logger.info('Analytics dashboard accessed', {
      facilityId,
      user: req.user?.username || 'system',
      alertsCount: analytics.alerts.expiring.length + analytics.alerts.lowStock.length
    });

    res.json({
      success: true,
      data: analytics,
      message: 'Revolutionary analytics retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🚚 POST /api/products/distribute - FIFO Distribution System
router.post('/distribute', [
  body('productName').trim().isLength({ min: 1 })
    .withMessage('Product name is required'),
  body('requestedQuantity').isInt({ min: 1 })
    .withMessage('Requested quantity must be a positive integer'),
  body('distributionReason').optional().trim().isLength({ max: 200 })
    .withMessage('Distribution reason cannot exceed 200 characters')
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

    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const { productName, requestedQuantity, distributionReason = 'General Distribution' } = req.body;
    
    const result = await ProductsService.distributeProducts(
      facilityId, 
      productName, 
      requestedQuantity, 
      distributionReason,
      req.user?.username || 'system'
    );

    logger.info('FIFO distribution completed', {
      facilityId,
      productName,
      requestedQuantity,
      user: req.user?.username || 'system'
    });

    res.json({
      success: true,
      data: result,
      message: `Successfully distributed ${requestedQuantity} units of ${productName} using FIFO method`
    });

  } catch (error) {
    logger.error('Failed to distribute products:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to distribute products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// �📦 GET /api/products/:id - Get single product
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
        errors: errors.array()
      });
    }

    const product = await require('./Product').findById(req.params.id)
      .populate('facilityId', 'name code');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check facility access
    if (req.facilityId && product.facilityId._id.toString() !== req.facilityId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this product'
      });
    }

    res.json({
      success: true,
      data: product,
      message: 'Product retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📦 PUT /api/products/:id - Update product
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('category').optional().trim().isLength({ min: 2, max: 50 }),
  body('quantity').optional().isInt({ min: 0 }),
  body('pricePerUnit').optional().isFloat({ min: 0 }),
  body('description').optional().isLength({ max: 500 }),
  body('status').optional().isIn(['active', 'reserved', 'damaged', 'expired', 'recalled'])
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
    const product = await ProductsService.updateProduct(req.params.id, req.body, userId);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });

  } catch (error) {
    logger.error('Product update failed:', error);
    
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📦 DELETE /api/products/:id - Delete product
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
        errors: errors.array()
      });
    }

    const product = await require('./Product').findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check facility access
    if (req.facilityId && product.facilityId.toString() !== req.facilityId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this product'
      });
    }

    const userId = req.user?.id || 'system';
    product.addHistory('deleted', { deletedBy: userId }, userId);
    
    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    logger.error('Product deletion failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📦 POST /api/products/distribute - Distribute products
router.post('/distribute', [
  body('productName').trim().isLength({ min: 1 })
    .withMessage('Product name is required'),
  body('destination').trim().isLength({ min: 1 })
    .withMessage('Destination is required'),
  body('quantity').isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
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

    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required',
        code: 'FACILITY_ID_MISSING'
      });
    }

    const { productName, destination, quantity } = req.body;
    const userId = req.user?.id || 'system';

    const distributions = await ProductsService.distributeProducts(
      facilityId, 
      productName, 
      destination, 
      quantity, 
      userId
    );

    res.json({
      success: true,
      data: distributions,
      message: `${quantity} units distributed to ${destination}`
    });

  } catch (error) {
    logger.error('Product distribution failed:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to distribute products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📅 GET /api/products/expiring - Get expiring products (Feature: Expiry Tracking)
router.get('/expiring', [
  query('days').optional().isInt({ min: 1 }).withMessage('Days must be positive')
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

    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required',
        code: 'FACILITY_ID_MISSING'
      });
    }

    const days = parseInt(req.query.days) || 30;
    const grouped = await ProductsService.getExpiringProducts(facilityId, days);

    res.json({
      success: true,
      data: grouped,
      message: 'Expiring products retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get expiring products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expiring products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📉 GET /api/products/low-stock - Get low stock products
router.get('/low-stock', [
  query('threshold').optional().isInt({ min: 1 }).withMessage('Threshold must be positive')
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

    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required',
        code: 'FACILITY_ID_MISSING'
      });
    }

    const threshold = parseInt(req.query.threshold) || 10;
    const grouped = await ProductsService.getLowStockProducts(facilityId, threshold);

    res.json({
      success: true,
      data: grouped,
      message: 'Low stock products retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get low stock products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve low stock products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  logger.error('Products API Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in products API',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 🏢 GET /api/products/facility-config - Get facility configuration
router.get('/facility-config', async (req, res) => {
  try {
    const facilityId = req.facilityId || req.headers['x-facility-id'] || req.query.facilityId;
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }
    
    const config = getFacilityConfiguration(facilityId);
    
    res.json({
      success: true,
      data: config,
      message: 'Facility configuration retrieved successfully'
    });
    
  } catch (error) {
    logger.error('Failed to get facility configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve facility configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📦 GET /api/products/detail/:compositeKey - Get product details by composite key
router.get('/detail/:compositeKey', async (req, res) => {
  try {
    const facilityId = req.facilityId || req.headers['x-facility-id'];
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const { compositeKey } = req.params;
    
    // Decode the composite key (name_sku)
    const decodedKey = decodeURIComponent(compositeKey);
    const [productName, productSku] = decodedKey.split('_');
    
    if (!productName || !productSku) {
      return res.status(400).json({
        success: false,
        message: 'Invalid composite key format. Expected: name_sku'
      });
    }

    // Get all products matching the name and SKU pattern
    const products = await ProductsService.getProductsByCompositeKey(productName, productSku, facilityId);
    
    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Group products by batch
    const batchGroups = ProductsService.groupProductsByBatch(products);
    
    // Create product summary
    const summary = {
      name: productName,
      sku: productSku,
      category: products[0].category,
      description: products[0].description,
      totalQuantity: products.reduce((sum, p) => sum + (p.quantity || 1), 0),
      totalValue: products.reduce((sum, p) => sum + (p.totalPrice || p.pricePerUnit || 0), 0),
      avgPricePerUnit: products.length > 0 ? 
        products.reduce((sum, p) => sum + (p.pricePerUnit || 0), 0) / products.length : 0,
      totalBatches: batchGroups.length,
      locations: [...new Set(products.map(p => p.placement?.section).filter(Boolean))],
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        summary,
        batches: batchGroups,
        individualProducts: products
      },
      message: 'Product details retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get product details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📤 GET /api/products/export - Export products to CSV
router.get('/export', async (req, res) => {
  try {
    const facilityId = req.facilityId || req.headers['x-facility-id'];
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    // Get all products for the facility
    const products = await ProductsService.getAllProducts(facilityId);
    
    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found to export'
      });
    }

    // Convert to CSV format
    const headers = ['Name', 'SKU', 'Category', 'Description', 'Quantity', 'Price Per Unit', 'Total Price', 'Expiry Date', 'Batch', 'Placement Section'];
    const csvData = products.map(product => [
      product.name,
      product.sku,
      product.category,
      product.description,
      product.quantity || 1,
      product.pricePerUnit || 0,
      product.totalPrice || product.pricePerUnit || 0,
      product.expiry?.date ? new Date(product.expiry.date).toISOString().split('T')[0] : '',
      product.batch || '',
      product.placement?.section || ''
    ]);

    // Create CSV content
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
    
    res.send(csvContent);

  } catch (error) {
    logger.error('Failed to export products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📥 POST /api/products/import - Import products from CSV
router.post('/import', async (req, res) => {
  try {
    const facilityId = req.facilityId || req.headers['x-facility-id'];
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const { csvData } = req.body;
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({
        success: false,
        message: 'CSV data is required as an array of objects'
      });
    }

    const results = {
      imported: 0,
      errors: [],
      skipped: 0
    };

    for (let i = 0; i < csvData.length; i++) {
      try {
        const row = csvData[i];
        
        // Validate required fields
        if (!row.name || !row.sku) {
          results.errors.push(`Row ${i + 1}: Name and SKU are required`);
          results.skipped++;
          continue;
        }

        // Create product object
        const productData = {
          name: row.name,
          sku: row.sku,
          category: row.category || 'Uncategorized',
          description: row.description || '',
          quantity: parseInt(row.quantity) || 1,
          pricePerUnit: parseFloat(row.pricePerUnit) || 0,
          batch: row.batch || '',
          facilityId: facilityId,
          placement: {
            section: row.section || 'Unassigned'
          }
        };

        // Add expiry date if provided
        if (row.expiryDate) {
          const expiryDate = new Date(row.expiryDate);
          if (!isNaN(expiryDate.getTime())) {
            productData.expiry = { date: expiryDate };
          }
        }

        // Calculate total price
        productData.totalPrice = productData.quantity * productData.pricePerUnit;

        // Create the product
        await ProductsService.createProduct(productData);
        results.imported++;

      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error.message}`);
        results.skipped++;
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Import completed. ${results.imported} products imported, ${results.skipped} skipped.`
    });

  } catch (error) {
    logger.error('Failed to import products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔄 PUT /api/products/batch/:batchId/quantity - Update batch quantity by adding/removing individual products
router.put('/batch/:batchId/quantity', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { quantityChange, pricePerUnit } = req.body;
    const facilityId = req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({ 
        success: false,
        error: 'Facility ID is required' 
      });
    }

    // Find existing products in the batch
    const existingProducts = await Product.find({ batchId, facilityId });
    
    if (existingProducts.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Batch not found' 
      });
    }

    const productName = existingProducts[0].name;
    const productCategory = existingProducts[0].category;
    
    if (quantityChange > 0) {
      // Add new individual products to the batch
      const createdProducts = [];
      
      for (let i = 0; i < quantityChange; i++) {
        const nextUnitNumber = existingProducts.length + i + 1;
        const sku = `${batchId}-${String(nextUnitNumber).padStart(3, '0')}`;
        
        const productDoc = new Product({
          name: productName,
          sku,
          batchId,
          description: existingProducts[0].description || '',
          facilityId,
          category: productCategory,
          quantity: 1,
          initialQuantity: 1,
          pricePerUnit: pricePerUnit || existingProducts[0].pricePerUnit,
          totalPrice: pricePerUnit || existingProducts[0].pricePerUnit,
          status: 'active',
          createdBy: req.user?.username || 'system',
          updatedBy: req.user?.username || 'system'
        });

        productDoc.addHistory('created', { 
          batch: batchId,
          quantity: 1,
          unit: nextUnitNumber,
          reason: 'batch_quantity_increase'
        }, req.user?.username || 'system');

        const createdProduct = await productDoc.save();
        createdProducts.push(createdProduct);
      }
      
      res.json({ 
        success: true, 
        message: `Added ${quantityChange} products to batch ${batchId}`,
        data: { createdProducts }
      });
      
    } else if (quantityChange < 0) {
      // Remove individual products from the batch (FIFO - remove oldest first)
      const productsToRemove = existingProducts
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(0, Math.abs(quantityChange));
      
      const removeIds = productsToRemove.map(p => p._id);
      await Product.deleteMany({ _id: { $in: removeIds } });
      
      res.json({ 
        success: true, 
        message: `Removed ${Math.abs(quantityChange)} products from batch ${batchId}`,
        data: { removedCount: productsToRemove.length }
      });
      
    } else {
      res.json({ 
        success: true, 
        message: 'No quantity change requested',
        data: {}
      });
    }
    
  } catch (error) {
    logger.error('Error updating batch quantity:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// 🔄 PUT /api/products/batch/:batchId/price - Update price for all products in a batch
router.put('/batch/:batchId/price', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { pricePerUnit } = req.body;
    const facilityId = req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({ 
        success: false,
        error: 'Facility ID is required' 
      });
    }

    const result = await Product.updateMany(
      { batchId, facilityId },
      { 
        pricePerUnit: pricePerUnit,
        totalPrice: pricePerUnit,
        updatedBy: req.user?.username || 'system',
        updatedAt: new Date()
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Batch not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: `Updated price for ${result.modifiedCount} products in batch ${batchId}`,
      data: { updatedCount: result.modifiedCount }
    });
    
  } catch (error) {
    logger.error('Error updating batch price:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// 🗑️ DELETE /api/products/batch/:batchId - Delete entire batch
router.delete('/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const facilityId = req.headers['x-facility-id'];
    
    if (!facilityId) {
      return res.status(400).json({ 
        success: false,
        error: 'Facility ID is required' 
      });
    }

    const result = await Product.deleteMany({ batchId, facilityId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Batch not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: `Deleted batch ${batchId} with ${result.deletedCount} products`,
      data: { deletedCount: result.deletedCount }
    });
    
  } catch (error) {
    logger.error('Error deleting batch:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
