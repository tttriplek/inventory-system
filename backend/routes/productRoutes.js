const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { body, validationResult, query } = require('express-validator');

// Middleware to extract facility ID from headers
const extractFacilityId = (req, res, next) => {
  const facilityId = req.headers['x-facility-id'] || req.query.facilityId;
  if (!facilityId) {
    return res.status(400).json({
      success: false,
      message: 'Facility ID is required in headers (X-Facility-ID) or query params'
    });
  }
  req.facilityId = facilityId;
  next();
};

// Validation middleware
const validateProduct = [
  body('name').notEmpty().trim().withMessage('Product name is required'),
  body('sku').notEmpty().trim().toUpperCase().withMessage('SKU is required'),
  body('category.primary').notEmpty().withMessage('Primary category is required'),
  body('pricing.cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('pricing.sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be a positive integer'),
  body('maxStockLevel').optional().isInt({ min: 1 }).withMessage('Max stock level must be greater than 0')
];

const validateBatch = [
  body('batchNumber').optional().trim(),
  body('quantity').isInt({ min: 1 }).withMessage('Batch quantity must be greater than 0'),
  body('manufacturedDate').isISO8601().withMessage('Valid manufactured date is required'),
  body('expiryDate').optional().isISO8601().withMessage('Valid expiry date required if provided'),
  body('qualityGrade').optional().isIn(['A', 'B', 'C', 'Rejected']).withMessage('Invalid quality grade')
];

/**
 * GET /api/products
 * Get all products for a facility with advanced filtering and pagination
 */
router.get('/', 
  extractFacilityId,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim(),
    query('category').optional().trim(),
    query('status').optional().isIn(['active', 'inactive', 'discontinued', 'pending-approval', 'recalled']),
    query('lowStock').optional().isBoolean(),
    query('expiringSoon').optional().isBoolean(),
    query('sortBy').optional().isIn(['name', 'sku', 'totalQuantity', 'createdAt', 'updatedAt', 'pricing.sellingPrice']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 20,
        search,
        category,
        status = 'active',
        lowStock,
        expiringSoon,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      let query = { facilityId: req.facilityId };

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (category) {
        query['category.primary'] = new RegExp(category, 'i');
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'category.primary': { $regex: search, $options: 'i' } },
          { 'brand.name': { $regex: search, $options: 'i' } }
        ];
      }

      if (lowStock === 'true') {
        query.$expr = { $lte: ['$totalQuantity', '$reorderLevel'] };
      }

      if (expiringSoon === 'true') {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        query['batches.expiryDate'] = { $lte: futureDate };
        query['batches.status'] = 'available';
      }

      // Sort configuration
      const sortConfig = {};
      sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [products, totalCount] = await Promise.all([
        Product.find(query)
          .sort(sortConfig)
          .skip(skip)
          .limit(parseInt(limit))
          .populate('facilityId', 'name code type')
          .lean(),
        Product.countDocuments(query)
      ]);

      // Add computed fields
      const enrichedProducts = products.map(product => ({
        ...product,
        isLowStock: product.totalQuantity <= product.reorderLevel,
        profitPerUnit: product.pricing ? product.pricing.sellingPrice - product.pricing.cost : 0,
        expiringBatchesCount: product.batches ? product.batches.filter(batch => {
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return batch.expiryDate && batch.expiryDate <= thirtyDaysFromNow && batch.status === 'available';
        }).length : 0
      }));

      res.json({
        success: true,
        data: enrichedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        filters: {
          facilityId: req.facilityId,
          search,
          category,
          status,
          lowStock,
          expiringSoon
        }
      });

    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/products/:id
 * Get a specific product with full details
 */
router.get('/:id', extractFacilityId, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      facilityId: req.facilityId
    }).populate('facilityId', 'name code type features');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add computed fields
    const enrichedProduct = {
      ...product.toObject(),
      isLowStock: product.totalQuantity <= product.reorderLevel,
      profitPerUnit: product.pricing ? product.pricing.sellingPrice - product.pricing.cost : 0,
      expiringBatches: product.batches.filter(batch => {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return batch.expiryDate && batch.expiryDate <= thirtyDaysFromNow && batch.status === 'available';
      })
    };

    res.json({
      success: true,
      data: enrichedProduct
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

/**
 * POST /api/products
 * Create a new product
 */
router.post('/',
  extractFacilityId,
  validateProduct,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      // Check if SKU already exists in this facility
      const existingProduct = await Product.findOne({
        sku: req.body.sku,
        facilityId: req.facilityId
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'A product with this SKU already exists in this facility'
        });
      }

      // Create product with facility ID
      const productData = {
        ...req.body,
        facilityId: req.facilityId,
        createdBy: req.user?.id || 'system'
      };

      const product = new Product(productData);
      await product.save();

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });

    } catch (error) {
      console.error('Error creating product:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message
      });
    }
  }
);

/**
 * PUT /api/products/:id
 * Update a product
 */
router.put('/:id',
  extractFacilityId,
  validateProduct,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const product = await Product.findOne({
        _id: req.params.id,
        facilityId: req.facilityId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Log changes for audit trail
      const updatedBy = req.user?.id || 'system';
      Object.keys(req.body).forEach(key => {
        if (product[key] !== req.body[key]) {
          product.logChange(key, product[key], req.body[key], updatedBy, 'Manual update');
        }
      });

      // Update product
      Object.assign(product, req.body);
      product.updatedBy = updatedBy;
      product.version += 1;

      await product.save();

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });

    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message
      });
    }
  }
);

/**
 * DELETE /api/products/:id
 * Delete a product (soft delete by setting status to inactive)
 */
router.delete('/:id', extractFacilityId, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      facilityId: req.facilityId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete
    product.status = 'inactive';
    product.updatedBy = req.user?.id || 'system';
    product.logChange('status', 'active', 'inactive', req.user?.id || 'system', 'Product deleted');
    
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

/**
 * POST /api/products/:id/batches
 * Add a batch to a product
 */
router.post('/:id/batches',
  extractFacilityId,
  validateBatch,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const product = await Product.findOne({
        _id: req.params.id,
        facilityId: req.facilityId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const batch = product.addBatch(req.body);
      await product.save();

      res.status(201).json({
        success: true,
        message: 'Batch added successfully',
        data: batch
      });

    } catch (error) {
      console.error('Error adding batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add batch',
        error: error.message
      });
    }
  }
);

/**
 * PUT /api/products/:id/batches/:batchNumber
 * Update a specific batch
 */
router.put('/:id/batches/:batchNumber',
  extractFacilityId,
  validateBatch,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const product = await Product.findOne({
        _id: req.params.id,
        facilityId: req.facilityId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const updatedBatch = product.updateBatch(req.params.batchNumber, req.body);
      
      if (!updatedBatch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      await product.save();

      res.json({
        success: true,
        message: 'Batch updated successfully',
        data: updatedBatch
      });

    } catch (error) {
      console.error('Error updating batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update batch',
        error: error.message
      });
    }
  }
);

/**
 * DELETE /api/products/:id/batches/:batchNumber
 * Remove a batch from a product
 */
router.delete('/:id/batches/:batchNumber', extractFacilityId, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      facilityId: req.facilityId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const removed = product.removeBatch(req.params.batchNumber);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    await product.save();

    res.json({
      success: true,
      message: 'Batch removed successfully'
    });

  } catch (error) {
    console.error('Error removing batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove batch',
      error: error.message
    });
  }
});

/**
 * POST /api/products/:id/reserve
 * Reserve quantity from available batches
 */
router.post('/:id/reserve', 
  extractFacilityId,
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be greater than 0'),
    body('reason').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const product = await Product.findOne({
        _id: req.params.id,
        facilityId: req.facilityId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const { quantity, reason } = req.body;
      
      if (product.availableQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient available quantity. Available: ${product.availableQuantity}, Requested: ${quantity}`
        });
      }

      const reservation = product.reserveQuantity(quantity, reason);
      await product.save();

      res.json({
        success: true,
        message: 'Quantity reserved successfully',
        data: reservation
      });

    } catch (error) {
      console.error('Error reserving quantity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reserve quantity',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/products/analytics/summary
 * Get analytics summary for products in facility
 */
router.get('/analytics/summary', extractFacilityId, async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      expiringProducts,
      totalValue,
      categoryStats
    ] = await Promise.all([
      Product.countDocuments({ facilityId: req.facilityId }),
      Product.countDocuments({ facilityId: req.facilityId, status: 'active' }),
      Product.countDocuments({
        facilityId: req.facilityId,
        status: 'active',
        $expr: { $lte: ['$totalQuantity', '$reorderLevel'] }
      }),
      Product.countDocuments({
        facilityId: req.facilityId,
        status: 'active',
        'batches.expiryDate': { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        'batches.status': 'available'
      }),
      Product.aggregate([
        { $match: { facilityId: req.facilityId, status: 'active' } },
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: { $multiply: ['$totalQuantity', '$pricing.cost'] }
            }
          }
        }
      ]),
      Product.aggregate([
        { $match: { facilityId: req.facilityId, status: 'active' } },
        {
          $group: {
            _id: '$category.primary',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$totalQuantity' },
            avgPrice: { $avg: '$pricing.sellingPrice' }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          activeProducts,
          lowStockProducts,
          expiringProducts,
          totalInventoryValue: totalValue[0]?.totalValue || 0
        },
        categories: categoryStats
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

module.exports = router;
