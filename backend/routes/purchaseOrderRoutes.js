const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const orders = await PurchaseOrder.find().sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching purchase orders' });
  }
});

// Create new purchase order
router.post('/', async (req, res) => {
  try {
    const order = new PurchaseOrder({
      ...req.body,
      totalPrice: req.body.quantity * req.body.pricePerUnit // Ensure totalPrice is calculated
    });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error('Purchase Order Error:', err);
    res.status(400).json({ 
      error: 'Error creating purchase order',
      details: err.message 
    });
  }
});

// Mark order as delivered and create product batch
router.put('/:id/deliver', async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get the next batch number for this product
    const prefix = order.productName.slice(0, 2).toUpperCase();
    const lastBatch = await Product.find({ name: order.productName }).sort({ receivedDate: -1 }).limit(1);
    let batchNumber = 1;
    if (lastBatch.length > 0 && lastBatch[0].batchId?.startsWith(prefix)) {
      const lastNum = parseInt(lastBatch[0].batchId.split('-')[1]);
      if (!isNaN(lastNum)) {
        batchNumber = lastNum + 1;
      }
    }
    const batchId = `${prefix}-${String(batchNumber).padStart(3, '0')}`;

    // Create individual products for each unit with sequential SKUs
    const products = [];
    for (let i = 1; i <= order.quantity; i++) {
      const sku = `${batchId}-${String(i).padStart(2, '0')}`;
      products.push(new Product({
        name: order.productName,
        category: order.category,
        quantity: 1,
        initialQuantity: 1,
        pricePerUnit: order.pricePerUnit,
        origin: 'Purchase Order',
        receivedDate: new Date(),
        batchId: batchId,
        sku: sku
      }));
    }
    
    // Save all products
    await Product.insertMany(products);
    
    // Update order status
    order.status = 'delivered';
    order.actualDeliveryDate = new Date();
    await order.save();
    
    res.json({ order, products });
  } catch (err) {
    console.error('Error delivering order:', err);
    res.status(400).json({ error: err.message || 'Error delivering order' });
  }
});

// Cancel order
router.put('/:id/cancel', async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = 'cancelled';
    await order.save();
    
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: 'Error cancelling order' });
  }
});

// Update expected delivery date
router.put('/:id/update-delivery-date', async (req, res) => {
  try {
    const { expectedDeliveryDate } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.expectedDeliveryDate = expectedDeliveryDate;
    await order.save();
    
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: 'Error updating delivery date' });
  }
});

// Get pending orders for a product
router.get('/product/:name', async (req, res) => {
  try {
    const orders = await PurchaseOrder.find({
      productName: req.params.name,
      status: 'ordered'
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

module.exports = router;
