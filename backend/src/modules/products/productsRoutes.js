const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const ProductsService = require('./ProductsService');
const logger = require('../../utils/logger');

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

// 📦 POST /api/products - Create new product(s)
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 })
    .withMessage('Product name must be 2-100 characters'),
  body('category').trim().isLength({ min: 2, max: 50 })
    .withMessage('Category must be 2-50 characters'),
  body('quantity').isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('pricePerUnit').isFloat({ min: 0 })
    .withMessage('Price per unit must be a positive number'),
  body('description').optional().isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('origin.supplier').optional().trim().isLength({ min: 1 }),
  body('placement.section').optional().trim().isLength({ min: 1 })
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

    const userId = req.user?.id || 'system';
    const products = await ProductsService.createProduct(req.body, facilityId, userId);

    res.status(201).json({
      success: true,
      data: products,
      count: products.length,
      message: `${products.length} product(s) created successfully`
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

module.exports = router;
