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
   * Get existing SKU prefix for a product name, or generate a new one
   */
  static async getOrCreatePrefix(name, facilityId) {
    const trimmedName = name.trim();
    
    // First, check if there's already a product with this exact name
    const existingProduct = await Product.findOne({ 
      facilityId, 
      name: { $regex: `^${trimmedName}$`, $options: 'i' }
    });
    
    if (existingProduct && existingProduct.batchId) {
      // Extract prefix from existing batchId (everything before the first hyphen)
      const prefix = existingProduct.batchId.split('-')[0];
      console.log(`Reusing existing prefix "${prefix}" for product "${trimmedName}"`);
      return prefix;
    }
    
    // If no existing product, generate a new unique prefix
    console.log(`Generating new prefix for product "${trimmedName}"`);
    return await this.generateUniquePrefix(trimmedName, facilityId);
  }

  /**
   * Generate a unique SKU prefix from product name, avoiding collisions
   */
  static async generateUniquePrefix(name, facilityId) {
    const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Rule 1: If name is 3 letters or less, use the whole name
    if (cleanName.length <= 3) {
      const prefix = cleanName;
      // Check if this prefix is already used
      const existing = await Product.findOne({ 
        facilityId, 
        batchId: { $regex: `^${prefix}-` } 
      });
      
      if (!existing) {
        return prefix;
      }
    }
    
    // Rule 2: For longer names, try first 3 letters
    let prefix = cleanName.slice(0, 3);
    let existing = await Product.findOne({ 
      facilityId, 
      batchId: { $regex: `^${prefix}-` } 
    });
    
    // Rule 3: If collision, try different combinations
    if (existing) {
      // Try first 2 + last 1
      const alt1 = cleanName.slice(0, 2) + cleanName.slice(-1);
      existing = await Product.findOne({ 
        facilityId, 
        batchId: { $regex: `^${alt1}-` } 
      });
      
      if (!existing && alt1.length === 3) {
        return alt1;
      }
      
      // Try first 1 + middle 1 + last 1  
      if (cleanName.length >= 3) {
        const mid = Math.floor(cleanName.length / 2);
        const alt2 = cleanName[0] + cleanName[mid] + cleanName.slice(-1);
        existing = await Product.findOne({ 
          facilityId, 
          batchId: { $regex: `^${alt2}-` } 
        });
        
        if (!existing) {
          return alt2;
        }
      }
      
      // Rule 4: Add numbers if still collision
      for (let i = 1; i <= 9; i++) {
        const numberedPrefix = prefix.slice(0, 2) + i;
        existing = await Product.findOne({ 
          facilityId, 
          batchId: { $regex: `^${numberedPrefix}-` } 
        });
        
        if (!existing) {
          return numberedPrefix;
        }
      }
    }
    
    return prefix;
  }

  /**
   * Get the next sequential batch number for a product
   */
  static async getNextBatchNumber(productName, facilityId) {
    try {
      // Get existing prefix for this product name
      const prefix = await this.getOrCreatePrefix(productName, facilityId);
      
      // Find all existing batches with this prefix
      const existingBatches = await Product.find({
        facilityId,
        name: { $regex: `^${productName}$`, $options: 'i' },
        batchId: { $regex: `^${prefix}-\\d+$` }
      }).sort({ batchId: 1 });

      if (existingBatches.length === 0) {
        // First batch for this product
        return `${prefix}-001`;
      }

      // Extract batch numbers and find the highest
      const batchNumbers = existingBatches
        .map(product => {
          const match = product.batchId.match(new RegExp(`^${prefix}-(\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));

      const maxBatchNumber = Math.max(...batchNumbers);
      const nextBatchNumber = maxBatchNumber + 1;
      
      // Format with leading zeros (001, 002, etc.)
      return `${prefix}-${String(nextBatchNumber).padStart(3, '0')}`;
      
    } catch (error) {
      console.error('Error getting next batch number:', error);
      // Fallback to timestamp-based if there's an error
      const prefix = await this.getOrCreatePrefix(productName, facilityId);
      const timestamp = Date.now();
      const batchNumber = String(timestamp).slice(-3);
      return `${prefix}-${batchNumber}`;
    }
  }

  /**
   * Create individual products for each unit (batch creation)
   */
  static async createProduct(productData, facilityId, userId) {
    try {
      const { name, category, quantity, pricePerUnit, description } = productData;
      
      console.log('Creating individual products:', { name, quantity, category, pricePerUnit });
      
      // Get existing prefix for this product name, or generate new unique one
      const batchId = await this.getNextBatchNumber(name, facilityId);
      
      const quantityNum = Number(quantity);
      const createdProducts = [];
      
      console.log(`Creating ${quantityNum} individual products with batchId: ${batchId}`);
      
      // Create individual product records - one for each unit
      for (let i = 1; i <= quantityNum; i++) {
        const sku = `${batchId}-${String(i).padStart(3, '0')}`; // Unique SKU for each unit
        
        const productDoc = new Product({
          name,
          sku,
          batchId,
          description: description || '',
          facilityId,
          category: category || 'General',
          // Each individual product has quantity 1
          quantity: 1,
          initialQuantity: 1,
          pricePerUnit: pricePerUnit || 0,
          totalPrice: pricePerUnit || 0, // Price for this single unit
          // Status
          status: 'active',
          createdBy: userId,
          updatedBy: userId
        });

        productDoc.addHistory('created', { 
          batch: batchId,
          quantity: 1,
          unit: i
        }, userId);

        console.log(`Creating product ${i}/${quantityNum} with SKU: ${sku}`);
        const createdProduct = await productDoc.save();
        createdProducts.push(createdProduct);
      }

      console.log(`✅ SUCCESS: Created ${quantityNum} individual products in batch ${batchId}`);
      logger.info(`Products created: ${quantityNum} units of ${name}`);
      
      return createdProducts;

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
   * Get products grouped by name and SKU prefix for display
   * This groups individual products to save space in the UI
   */
  static async getGroupedProducts(facilityId, filters = {}, options = {}) {
    try {
      // First get all individual products
      const { products } = await this.getProducts(facilityId, filters, { 
        ...options, 
        limit: 1000 // Get more products for grouping
      });

      // Group products by name and SKU prefix (batchId without the number part)
      const groups = {};
      
      products.forEach(product => {
        // Extract prefix from batchId (e.g., "GUN-123" -> "GUN")
        const prefix = product.batchId?.split('-')[0] || 'UNKNOWN';
        const groupKey = `${product.name}_${prefix}`;
        
        if (!groups[groupKey]) {
          groups[groupKey] = {
            groupId: groupKey,
            name: product.name,
            skuPrefix: prefix,
            category: product.category,
            pricePerUnit: product.pricePerUnit,
            description: product.description,
            status: product.status,
            totalQuantity: 0,
            totalValue: 0,
            individualProducts: [],
            batches: {},
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
          };
        }
        
        const group = groups[groupKey];
        group.totalQuantity += product.quantity || 1;
        group.totalValue += (product.pricePerUnit || 0) * (product.quantity || 1);
        group.individualProducts.push(product);
        
        // Track batches within the group
        if (product.batchId) {
          if (!group.batches[product.batchId]) {
            group.batches[product.batchId] = {
              batchId: product.batchId,
              quantity: 0,
              products: []
            };
          }
          group.batches[product.batchId].quantity += product.quantity || 1;
          group.batches[product.batchId].products.push(product);
        }
        
        // Keep the most recent dates
        if (product.createdAt < group.createdAt) group.createdAt = product.createdAt;
        if (product.updatedAt > group.updatedAt) group.updatedAt = product.updatedAt;
      });

      // Convert to array and sort
      const groupedProducts = Object.values(groups).sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      return {
        groups: groupedProducts,
        totalGroups: groupedProducts.length,
        totalIndividualProducts: products.length
      };

    } catch (error) {
      logger.error('Failed to get grouped products:', error);
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

  /**
   * Get products by composite key (name + SKU pattern)
   */
  static async getProductsByCompositeKey(productName, productSku, facilityId) {
    try {
      const products = await Product.find({
        name: productName,
        facilityId: facilityId,
        $or: [
          { sku: productSku },
          { sku: { $regex: `^${productSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` } }
        ]
      }).sort({ createdAt: -1 });

      return products;
    } catch (error) {
      logger.error('Error getting products by composite key:', error);
      throw error;
    }
  }

  /**
   * Group products by batch
   */
  static groupProductsByBatch(products) {
    const groups = {};
    
    products.forEach(product => {
      const batchId = product.batchId || this.extractBatchFromSku(product.sku);
      
      if (!groups[batchId]) {
        groups[batchId] = {
          batchId,
          products: [],
          totalQuantity: 0,
          totalValue: 0,
          locations: new Set(),
          status: 'active',
          createdDate: product.createdAt,
          expiryDate: product.expiryDate,
          receivedDate: product.receivedDate
        };
      }
      
      groups[batchId].products.push(product);
      groups[batchId].totalQuantity += (product.quantity || 1);
      groups[batchId].totalValue += (product.totalPrice || product.pricePerUnit || 0);
      
      if (product.placement?.section) {
        groups[batchId].locations.add(product.placement.section);
      }
    });
    
    // Convert locations Set to Array
    Object.values(groups).forEach(batch => {
      batch.locations = Array.from(batch.locations);
    });
    
    return Object.values(groups);
  }

  /**
   * Extract batch ID from SKU
   */
  static extractBatchFromSku(sku) {
    if (!sku) return 'unknown';
    const parts = sku.split('-');
    return parts.length > 2 ? parts.slice(0, -1).join('-') : sku;
  }
}

module.exports = ProductsService;
