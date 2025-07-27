const Product = require('./Product');
const logger = require('../../utils/logger');

/**
 * Professional Products Service
 * 
 * Handles all business logic for product management with
 * facility-aware operations and feature-dependent functionality.
 */
class ProductsService {

  /**
   * Create a new product with intelligent batch and SKU generation
   */
  static async createProduct(productData, facilityId, userId) {
    try {
      // Generate batch ID if not provided
      if (!productData.batchId) {
        productData.batchId = await this.generateBatchId(productData.name, facilityId);
      }

      // Generate SKU if not provided
      if (!productData.sku) {
        productData.sku = await this.generateSKU(productData.batchId, facilityId);
      }

      // Create individual products for each unit
      const products = [];
      const quantity = productData.quantity || 1;

      for (let i = 1; i <= quantity; i++) {
        const sku = productData.quantity > 1 
          ? `${productData.sku}-${String(i).padStart(2, '0')}`
          : productData.sku;

        const product = new Product({
          ...productData,
          sku,
          quantity: 1,
          initialQuantity: 1,
          totalPrice: productData.pricePerUnit,
          facilityId,
          createdBy: userId,
          updatedBy: userId
        });

        product.addHistory('created', { 
          batch: productData.batchId,
          originalQuantity: quantity 
        }, userId);

        await product.save();
        products.push(product);
      }

      logger.info(`Products created: ${products.length} units of ${productData.name}`);
      return products;

    } catch (error) {
      logger.error('Product creation failed:', error);
      throw error;
    }
  }

  /**
   * Get products by facility with filtering and pagination
   */
  static async getProducts(facilityId, filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        sort = { createdAt: -1 },
        category,
        status,
        search,
        expiring,
        lowStock
      } = options;

      let query = { facilityId };

      // Apply filters
      if (category) query.category = category;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { batchId: { $regex: search, $options: 'i' } }
        ];
      }

      // Special filters
      if (expiring) {
        const days = parseInt(expiring) || 30;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        
        query['expiry.isTracked'] = true;
        query['expiry.date'] = { $lte: futureDate, $gte: new Date() };
      }

      if (lowStock) {
        const threshold = parseInt(lowStock) || 10;
        query.quantity = { $lte: threshold };
      }

      const skip = (page - 1) * limit;
      
      const [products, total] = await Promise.all([
        Product.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('facilityId', 'name code'),
        Product.countDocuments(query)
      ]);

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Failed to get products:', error);
      throw error;
    }
  }

  /**
   * Update product with history tracking
   */
  static async updateProduct(productId, updates, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Track what changed
      const changes = {};
      Object.keys(updates).forEach(key => {
        if (product[key] !== updates[key]) {
          changes[key] = { from: product[key], to: updates[key] };
        }
      });

      Object.assign(product, updates);
      product.updatedBy = userId;

      product.addHistory('updated', changes, userId);
      await product.save();

      logger.info(`Product updated: ${product.sku}`);
      return product;

    } catch (error) {
      logger.error('Product update failed:', error);
      throw error;
    }
  }

  /**
   * Distribute products using FIFO method
   */
  static async distributeProducts(facilityId, productName, destination, quantity, userId) {
    try {
      const products = await Product.find({
        facilityId,
        name: productName,
        status: 'active',
        quantity: { $gt: 0 }
      }).sort({ receivedDate: 1 }); // FIFO

      if (products.length === 0) {
        throw new Error('No products available for distribution');
      }

      let remainingQuantity = quantity;
      const distributions = [];

      for (const product of products) {
        if (remainingQuantity <= 0) break;

        const useQuantity = Math.min(remainingQuantity, product.quantity);
        
        const distribution = product.distribute(destination, useQuantity, userId);
        await product.save();

        distributions.push({
          productId: product._id,
          sku: product.sku,
          quantity: useQuantity,
          distribution
        });

        remainingQuantity -= useQuantity;
      }

      if (remainingQuantity > 0) {
        throw new Error(`Insufficient stock. ${remainingQuantity} units could not be distributed.`);
      }

      logger.info(`Products distributed: ${quantity} units of ${productName} to ${destination}`);
      return distributions;

    } catch (error) {
      logger.error('Product distribution failed:', error);
      throw error;
    }
  }

  /**
   * Get expiring products
   */
  static async getExpiringProducts(facilityId, days = 30) {
    try {
      const products = await Product.findExpiring(facilityId, days);
      
      // Group by expiry timeframe
      const grouped = products.reduce((acc, product) => {
        const daysUntil = product.daysUntilExpiry;
        let key;
        
        if (daysUntil < 0) key = 'expired';
        else if (daysUntil <= 7) key = 'week';
        else if (daysUntil <= 30) key = 'month';
        else key = 'future';

        if (!acc[key]) acc[key] = [];
        acc[key].push(product);
        return acc;
      }, {});

      return grouped;

    } catch (error) {
      logger.error('Failed to get expiring products:', error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(facilityId, threshold = 10) {
    try {
      const products = await Product.findLowStock(facilityId, threshold);
      
      // Group by stock level
      const grouped = products.reduce((acc, product) => {
        let key;
        if (product.quantity === 0) key = 'outOfStock';
        else if (product.quantity <= 5) key = 'critical';
        else key = 'low';

        if (!acc[key]) acc[key] = [];
        acc[key].push(product);
        return acc;
      }, {});

      return grouped;

    } catch (error) {
      logger.error('Failed to get low stock products:', error);
      throw error;
    }
  }

  // 🛠️ PRIVATE HELPER METHODS

  static async generateBatchId(productName, facilityId) {
    const prefix = productName.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'A');
    const lastBatch = await Product.findOne({
      facilityId,
      name: productName
    }).sort({ receivedDate: -1 });

    let batchNumber = 1;
    if (lastBatch && lastBatch.batchId.startsWith(prefix)) {
      const lastNumber = parseInt(lastBatch.batchId.split('-')[1]) || 0;
      batchNumber = lastNumber + 1;
    }

    return `${prefix}-${String(batchNumber).padStart(3, '0')}`;
  }

  static async generateSKU(batchId, facilityId) {
    const existingCount = await Product.countDocuments({
      facilityId,
      batchId
    });

    return `${batchId}-${String(existingCount + 1).padStart(3, '0')}`;
  }

  /**
   * Get comprehensive analytics for facility
   */
  static async getAnalytics(facilityId) {
    const now = new Date();
    
    // Revolutionary expiry tracking
    const expiringProducts = await Product.find({
      facilityId,
      'expiry.isTracked': true,
      'expiry.date': { 
        $gte: now, 
        $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) 
      }
    }).sort({ 'expiry.date': 1 });

    // Low stock alerts (items with quantity <= 5)
    const lowStockProducts = await Product.find({
      facilityId,
      quantity: { $lte: 5 },
      status: 'active'
    });

    // Batch analytics
    const batchAnalytics = await Product.aggregate([
      { $match: { facilityId } },
      { 
        $group: {
          _id: '$batchId',
          totalUnits: { $sum: '$quantity' },
          totalValue: { $sum: '$totalPrice' },
          products: { 
            $push: { 
              name: '$name', 
              sku: '$sku', 
              quantity: '$quantity' 
            } 
          }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);

    // Category distribution
    const categoryStats = await Product.aggregate([
      { $match: { facilityId } },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Recent activity
    const recentProducts = await Product.find({ facilityId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name sku quantity createdAt');

    // Summary calculations
    const totalValue = (await Product.aggregate([
      { $match: { facilityId } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]))[0]?.total || 0;

    return {
      summary: {
        totalProducts: await Product.countDocuments({ facilityId }),
        totalValue: Math.round(totalValue * 100) / 100,
        expiringCount: expiringProducts.length,
        lowStockCount: lowStockProducts.length
      },
      alerts: {
        expiring: expiringProducts.slice(0, 10),
        lowStock: lowStockProducts.slice(0, 10)
      },
      analytics: {
        batches: batchAnalytics,
        categories: categoryStats,
        recent: recentProducts
      }
    };
  }

  /**
   * FIFO Distribution System
   */
  static async distributeProducts(facilityId, productName, requestedQuantity, reason, userId) {
    // Find available products using FIFO (oldest first)
    const availableProducts = await Product.find({
      facilityId,
      name: productName,
      quantity: { $gt: 0 },
      status: 'active'
    }).sort({ receivedDate: 1 });

    const totalAvailable = availableProducts.reduce((sum, p) => sum + p.quantity, 0);
    
    if (totalAvailable < requestedQuantity) {
      throw new Error(`Insufficient inventory. Available: ${totalAvailable}, Requested: ${requestedQuantity}`);
    }

    let remaining = requestedQuantity;
    const distributedItems = [];
    const distributionDate = new Date();

    for (const product of availableProducts) {
      if (remaining <= 0) break;

      const quantityToTake = Math.min(product.quantity, remaining);
      
      // Update product quantity
      product.quantity -= quantityToTake;
      remaining -= quantityToTake;

      // Add distribution record
      product.distributions.push({
        quantity: quantityToTake,
        date: distributionDate,
        reason,
        destination: 'Customer Distribution',
        priceSent: product.pricePerUnit * quantityToTake,
        remainingQuantity: product.quantity
      });
      
      // Add to history
      product.addHistory('distributed', {
        distributedQuantity: quantityToTake,
        reason,
        fifoPosition: availableProducts.indexOf(product) + 1
      }, userId);

      await product.save();

      distributedItems.push({
        sku: product.sku,
        batchId: product.batchId,
        quantityDistributed: quantityToTake,
        remainingQuantity: product.quantity,
        expiryDate: product.expiry?.date,
        fifoPosition: availableProducts.indexOf(product) + 1
      });

      logger.info('Product distributed via FIFO', {
        facilityId,
        productId: product._id,
        sku: product.sku,
        quantity: quantityToTake,
        user: userId
      });
    }

    return {
      productName,
      requestedQuantity,
      distributedQuantity: requestedQuantity,
      distributedItems,
      distributionDate,
      fifoMethod: true
    };
  }
}

module.exports = ProductsService;
