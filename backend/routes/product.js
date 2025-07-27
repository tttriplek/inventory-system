const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const logActivity = require('../utils/logActivity');

// GET /api/products/expiring - Get products expiring within specified months
router.get('/expiring', async (req, res) => {
  try {
    console.log('Expiring products request received');
    const { months } = req.query;
    const monthsNum = Number(months) || 3; // Default to 3 months if not specified
    console.log('Looking for products expiring in next', monthsNum, 'months');
    
    // Calculate the date range
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(today.getMonth() + monthsNum);

    // Find products that:
    // 1. Have expiry tracking enabled
    // 2. Have an expiry date set
    // 3. Expiry date falls within the range
    const products = await Product.find({
      'expiry.isTracked': true,
      'expiry.date': {
        $exists: true,
        $ne: null,
        $gte: today,
        $lte: futureDate
      }
    }).sort({ 'expiry.date': 1 }); // Sort by expiry date ascending

    console.log('Found products:', products.length);

    // Group products by expiry timeframe
    const groupedProducts = products.reduce((acc, product) => {
      const monthsToExpiry = Math.floor((product.expiry.date - today) / (30 * 24 * 60 * 60 * 1000));
      const key = monthsToExpiry <= 1 ? '1 month' : 
                 monthsToExpiry <= 3 ? '3 months' :
                 monthsToExpiry <= 6 ? '6 months' : 'over 6 months';
      
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        ...product.toObject(),
        daysToExpiry: Math.ceil((product.expiry.date - today) / (24 * 60 * 60 * 1000))
      });
      return acc;
    }, {});

    res.json(groupedProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/analytics - Revolutionary Analytics Dashboard
router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Revolutionary expiry tracking
    const expiringProducts = await Product.find({
      facilityId: req.facilityId,
      'expiry.isTracked': true,
      'expiry.date': { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }
    }).sort({ 'expiry.date': 1 });

    // Low stock alerts
    const lowStockProducts = await Product.find({
      facilityId: req.facilityId,
      quantity: { $lte: 5 }
    });

    // Batch analytics
    const batchAnalytics = await Product.aggregate([
      { $match: { facilityId: req.facilityId } },
      { 
        $group: {
          _id: '$batchId',
          totalUnits: { $sum: '$quantity' },
          totalValue: { $sum: '$totalPrice' },
          products: { $push: { name: '$name', sku: '$sku', quantity: '$quantity' } }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Category distribution
    const categoryStats = await Product.aggregate([
      { $match: { facilityId: req.facilityId } },
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
    const recentProducts = await Product.find({ facilityId: req.facilityId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name sku quantity createdAt');

    const analytics = {
      summary: {
        totalProducts: await Product.countDocuments({ facilityId: req.facilityId }),
        totalValue: (await Product.aggregate([
          { $match: { facilityId: req.facilityId } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]))[0]?.total || 0,
        expiringCount: expiringProducts.length,
        lowStockCount: lowStockProducts.length
      },
      alerts: {
        expiring: expiringProducts.slice(0, 10),
        lowStock: lowStockProducts.slice(0, 10)
      },
      analytics: {
        batches: batchAnalytics.slice(0, 10),
        categories: categoryStats,
        recent: recentProducts
      }
    };

    await logActivity({
      action: 'analytics-view',
      entity: 'Product',
      user: req.user?.username || 'system',
      details: { alertsCount: analytics.alerts.expiring.length + analytics.alerts.lowStock.length }
    });

    res.json({
      success: true,
      data: analytics,
      message: 'Revolutionary analytics retrieved successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/products/move-batch - move all products in a batch to a new section
router.put('/move-batch', async (req, res) => {
  try {
    const { batchId, sectionId } = req.body;
    if (!batchId || !sectionId) {
      return res.status(400).json({ error: 'batchId and sectionId are required' });
    }
    // Find all products in the batch
    const products = await Product.find({ batchId });
    if (products.length === 0) {
      return res.status(404).json({ error: 'No products found for this batch' });
    }
    // Get the target section and check allowedCategories
    const Section = require('../models/Section');
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    const allowedCategories = section.allowedCategories || [];
    const acceptsAll = allowedCategories.includes('All');
    const updates = [];
    for (const product of products) {
      const categoryMatches = acceptsAll || allowedCategories.includes(product.category);
      console.log(`[MOVE BATCH] Checking category for product '${product.name}' (category: '${product.category}') in section '${section.name}' (allowed: [${allowedCategories.join(', ')}]): ${categoryMatches ? 'MATCH' : 'NO MATCH'}`);
      if (!categoryMatches) {
        // Skip placement and log
        updates.push({ _id: product._id, name: product.name, status: 'Categories do not match' });
        continue;
      }
      // Remove all previous placements
      product.placements = [];
      // Add new placement (move all quantity to new section)
      product.placements.push({ section: section.name, quantity: product.quantity });
      await product.save();
      await logActivity({
        action: 'move-batch',
        entity: 'Product',
        entityId: product._id.toString(),
        user: req.user?.username || 'system',
        details: { batchId, sectionId }
      });
      updates.push(product);
    }
    res.json({ message: 'Batch moved', updated: updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products - Get all products with facility-aware filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const products = await Product.find({ facilityId: req.facilityId })
      .populate('facilityId', 'name code')
      .sort({ receivedDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ facilityId: req.facilityId });

    res.json({ 
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'Products retrieved successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products/distribute - Revolutionary FIFO Distribution
router.post('/distribute', async (req, res) => {
  try {
    const { productName, requestedQuantity, distributionReason = 'General Distribution' } = req.body;

    if (!productName || !requestedQuantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Product name and requested quantity are required' 
      });
    }

    // Find products using FIFO (oldest first)
    const availableProducts = await Product.find({
      facilityId: req.facilityId,
      name: productName,
      quantity: { $gt: 0 },
      status: 'active'
    }).sort({ receivedDate: 1 }); // FIFO - oldest first

    let totalAvailable = availableProducts.reduce((sum, p) => sum + p.quantity, 0);
    
    if (totalAvailable < requestedQuantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient inventory. Available: ${totalAvailable}, Requested: ${requestedQuantity}`
      });
    }

    let remainingToDistribute = requestedQuantity;
    const distributedItems = [];
    const distributionDate = new Date();

    for (const product of availableProducts) {
      if (remainingToDistribute <= 0) break;

      const quantityToTake = Math.min(product.quantity, remainingToDistribute);
      
      // Update product quantity
      product.quantity -= quantityToTake;
      remainingToDistribute -= quantityToTake;

      // Add distribution record
      const distributionRecord = {
        quantity: quantityToTake,
        date: distributionDate,
        reason: distributionReason,
        remainingQuantity: product.quantity
      };

      product.distributions.push(distributionRecord);
      
      // Add to history
      product.history.push({
        action: 'distributed',
        timestamp: distributionDate,
        userId: req.user?.username || 'system',
        details: `Distributed ${quantityToTake} units via FIFO`
      });

      await product.save();

      distributedItems.push({
        sku: product.sku,
        batchId: product.batchId,
        quantityDistributed: quantityToTake,
        remainingQuantity: product.quantity,
        expiryDate: product.expiry?.date
      });

      await logActivity({
        action: 'distribute-fifo',
        entity: 'Product',
        entityId: product._id.toString(),
        user: req.user?.username || 'system',
        details: { quantityDistributed: quantityToTake, distributionReason }
      });
    }

    res.json({
      success: true,
      data: {
        productName,
        requestedQuantity,
        distributedQuantity: requestedQuantity,
        distributedItems,
        distributionDate
      },
      message: `Successfully distributed ${requestedQuantity} units of ${productName} using FIFO method`
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Create product with batch and SKUs
router.post('/', async (req, res) => {
  try {
    const { name, category, quantity, size, pricePerUnit, totalPrice, origin } = req.body;

    if (!name || !quantity) {
      return res.status(400).json({ error: 'Name and quantity are required' });
    }
    const prefix = name.slice(0, 2).toUpperCase(); // e.g., MO
    const lastBatch = await Product.find({ name }).sort({ receivedDate: -1 }).limit(1);
    let batchNumber = 1;

    if (lastBatch.length > 0 && lastBatch[0].batchId?.startsWith(prefix)) {
      const last = parseInt(lastBatch[0].batchId.split('-')[1]) || 1;
      batchNumber = last + 1;
    }

    const batchId = `${prefix}-${String(batchNumber).padStart(3, '0')}`;
    const receivedDate = new Date();

    // Create one product document per unit, each with a unique SKU
    const productsToCreate = [];
    for (let i = 1; i <= Number(quantity); i++) {
      const sku = `${batchId}-${String(i).padStart(2, '0')}`;
      productsToCreate.push({
        name,
        category,
        quantity: 1,
        initialQuantity: 1,
        size,
        pricePerUnit,
        totalPrice: pricePerUnit, // Each unit gets its own price
        sku,
        batchId,
        origin,
        receivedDate
      });
    }
    const createdProducts = await Product.insertMany(productsToCreate);
    for (const created of createdProducts) {
      await logActivity({
        action: 'create',
        entity: 'Product',
        entityId: created._id.toString(),
        user: req.user?.username || 'system',
        details: created
      });
    }
    res.status(201).json(createdProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/low-stock - fetch products below threshold
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = Number(req.query.threshold);
    if (isNaN(threshold) || threshold < 1) {
      return res.status(400).json({ error: 'Invalid threshold value' });
    }
    // Aggregate by product name and sum quantity
    const agg = await Product.aggregate([
      {
        $group: {
          _id: '$name',
          totalQuantity: { $sum: '$quantity' },
          products: { $push: '$$ROOT' }
        }
      },
      {
        $match: { totalQuantity: { $lte: threshold } }
      }
    ]);
    // Return summary: name, totalQuantity, and sample product info
    const result = agg.map(g => ({
      name: g._id,
      totalQuantity: g.totalQuantity,
      sample: g.products[0],
      products: g.products
    }));
    res.json(result);
  } catch (err) {
    console.error('Low stock route error:', err);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// ✅ Get products (all or by name or prefix)
router.get('/', async (req, res) => {
  try {
    const { name, prefix } = req.query;

    if (name) {
      const products = await Product.find({ name });
      return res.json(products);
    }

    if (prefix) {
      const products = await Product.find({
        sku: { $regex: `^${prefix}-`, $options: 'i' },
      });
      return res.json(products);
    }

    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update product
router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logActivity({
      action: 'update',
      entity: 'Product',
      entityId: req.params.id,
      user: req.user?.username || 'system',
      details: req.body
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete product
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await logActivity({
      action: 'delete',
      entity: 'Product',
      entityId: req.params.id,
      user: req.user?.username || 'system',
      details: {}
    });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Add history (legacy feature, optional)
router.put('/:id/add-history', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (!Array.isArray(product.history)) product.history = [];
    product.history.push(req.body);
    await product.save();

    res.json({ message: 'History added', product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Distribute product to destination (FIFO)
router.post('/distribute', async (req, res) => {
  try {
    const { name, destination, quantity } = req.body;
    let qtyRemaining = quantity;

    console.log(`🔄 Starting distribution for: ${name}`);
    console.log(`➡️ Destination: ${destination}, Quantity: ${quantity}`);

    const products = await Product.find({ name }).sort({ receivedDate: 1 });
    console.log(`📦 Found ${products.length} batch(es) for '${name}'`);

    for (const product of products) {
      if (qtyRemaining <= 0) break;

      const availableQty = product.quantity || 0;
      const useQty = Math.min(qtyRemaining, availableQty);

      if (useQty > 0) {
        product.distributions = product.distributions || [];

        product.distributions.push({
          destination,
          quantity: useQty,
          priceSent: useQty * (product.pricePerUnit || 0),
          date: new Date()
        });

        product.quantity -= useQty;

        await product.save();
        await logActivity({
          action: 'distribute',
          entity: 'Product',
          entityId: product._id.toString(),
          user: req.user?.username || 'system',
          details: {
            destination,
            quantity: useQty,
            batchId: product.batchId
          }
        });

        console.log(`✅ Batch ${product.batchId}: Sent ${useQty} to ${destination}`);
        qtyRemaining -= useQty;
      }
    }

    if (qtyRemaining > 0) {
      console.warn(`⚠️ Insufficient stock. ${qtyRemaining} unit(s) left undistributed.`);
    }

    const updated = await Product.find({ name });
    res.json(updated);
  } catch (err) {
    console.error("❌ Distribution error:", err);
    res.status(500).json({ error: "Failed to distribute" });
  }
});

// ...existing code...

// POST /api/products/bulk-update - bulk update products
router.post('/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body; // [{ id, data }, ...]
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'Updates must be an array' });
    const results = [];
    for (const { id, data } of updates) {
      const updated = await Product.findByIdAndUpdate(id, data, { new: true });
      results.push(updated);
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/bulk-delete - bulk delete products
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body; // [id1, id2, ...]
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs must be an array' });
    const result = await Product.deleteMany({ _id: { $in: ids } });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
