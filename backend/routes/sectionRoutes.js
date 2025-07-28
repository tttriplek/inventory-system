const express = require('express');
const router = express.Router();
const Section = require('../models/Section');

// Bulk direct placement: send all products to a specific section
router.post('/bulk-direct-place', async (req, res) => {
  try {
    const { products, sectionId } = req.body; // Array of product objects and target sectionId
    if (!Array.isArray(products) || products.length === 0 || !sectionId) {
      return res.status(400).json({ error: 'Missing products or sectionId' });
    }
    const Product = require('../models/Product');
    const Section = require('../models/Section');
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    const results = [];
    for (const product of products) {
      const dbProduct = await Product.findById(product._id);
      if (!dbProduct) {
        results.push({ id: product._id, error: 'Product not found' });
        continue;
      }
      // Check if already placed in this section
      const alreadyPlaced = dbProduct.placements && dbProduct.placements.some(p => p.section === section.name);
      if (alreadyPlaced) {
        results.push({ id: dbProduct._id, name: dbProduct.name, status: 'Already placed in section' });
        continue;
      }
      // Check if section accepts the product's category
      const allowedCategories = section.allowedCategories || [];
      const acceptsAll = allowedCategories.includes('All');
      const categoryMatches = acceptsAll || allowedCategories.includes(dbProduct.category);
      console.log(`Checking category for product '${dbProduct.name}' (category: '${dbProduct.category}') in section '${section.name}' (allowed: [${allowedCategories.join(', ')}]): ${categoryMatches ? 'MATCH' : 'NO MATCH'}`);
      if (!categoryMatches) {
        results.push({ id: dbProduct._id, name: dbProduct.name, status: 'Categories do not match' });
        continue;
      }
      // Check if section fits product
      const fits = Number(section.length) >= Number(dbProduct.size.length) &&
                  Number(section.width) >= Number(dbProduct.size.width) &&
                  Number(section.height) >= Number(dbProduct.size.height);
      if (!fits) {
        results.push({ id: dbProduct._id, name: dbProduct.name, status: 'Section too small' });
        continue;
      }
      // Place product in section
      const placed = await Product.findOneAndUpdate(
        { _id: dbProduct._id },
        {
          $push: {
            placements: {
              section: section.name,
              quantity: dbProduct.quantity
            }
          }
        },
        { new: true }
      );
      results.push({ id: dbProduct._id, name: dbProduct.name, status: 'Placed', section: section.name });
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk place selected products
router.post('/bulk-place', async (req, res) => {
  try {
    const { productIds } = req.body; // Array of product _ids
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'No products selected for placement' });
    }
    const Product = require('../models/Product');
    const Section = require('../models/Section');
    const sections = await Section.find();
    const results = [];
    for (const id of productIds) {
      const product = await Product.findById(id);
      if (!product) {
        results.push({ id, error: 'Product not found' });
        continue;
      }
      if (product.placements && product.placements.length > 0) {
        results.push({ id, name: product.name, status: 'Already placed' });
        continue;
      }
      // Find a fitting section (check allowedCategories and size)
      let fittingSection = null;
      for (const s of sections) {
        const allowedCategories = s.allowedCategories || [];
        const acceptsAll = allowedCategories.includes('All');
        const categoryMatches = acceptsAll || allowedCategories.includes(product.category);
        console.log(`[CATEGORY CHECK] Product '${product.name}' (category: '${product.category}') in section '${s.name}' (allowed: [${allowedCategories.join(', ')}]): ${categoryMatches ? 'MATCH' : 'NO MATCH'}`);
        if (!categoryMatches) continue;
        const fits = Number(s.length) >= Number(product.size.length) &&
                    Number(s.width) >= Number(product.size.width) &&
                    Number(s.height) >= Number(product.size.height);
        if (fits) {
          fittingSection = s;
          break;
        }
      }
      if (!fittingSection) {
        results.push({ id, name: product.name, status: 'No section with enough space or matching category found' });
        continue;
      }
      // Place product
      const placed = await Product.findOneAndUpdate(
        { _id: product._id },
        {
          $push: {
            placements: {
              section: fittingSection.name,
              quantity: product.quantity
            }
          }
        },
        { new: true }
      );
      results.push({ id, name: product.name, status: 'Placed', section: fittingSection.name });
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Fill remaining space with product (auto-placement)
router.post('/fill-space', async (req, res) => {
  try {
    const { product } = req.body;
    // Find a section with enough space for the product
    const sections = await Section.find();
    // Pick the first section with enough rack space and matching category
    let fittingSection = null;
    for (const s of sections) {
      const allowedCategories = s.allowedCategories || [];
      const acceptsAll = allowedCategories.includes('All');
      const categoryMatches = acceptsAll || allowedCategories.includes(product.category);
      console.log(`[CATEGORY CHECK] Product '${product.name}' (category: '${product.category}') in section '${s.name}' (allowed: [${allowedCategories.join(', ')}]): ${categoryMatches ? 'MATCH' : 'NO MATCH'}`);
      if (!categoryMatches) continue;
      const fits = Number(s.length) >= Number(product.size.length) &&
                  Number(s.width) >= Number(product.size.width) &&
                  Number(s.height) >= Number(product.size.height);
      if (fits) {
        fittingSection = s;
        break;
      }
    }
    if (!fittingSection) {
      return res.status(404).json({ error: 'No section with enough space or matching category found' });
    }
    // Update product placement in Product model
    const Product = require('../models/Product');
    const placed = await Product.findOneAndUpdate(
      { _id: product._id },
      {
        $push: {
          placements: {
            section: fittingSection.name,
            quantity: product.quantity
          }
        }
      },
      { new: true }
    );
    res.json({ sectionId: fittingSection._id, section: fittingSection, placed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Select exact placement for product (manual)
router.post('/select-placement', async (req, res) => {
  try {
    const { product, sectionId, position } = req.body;
    // Validate section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    // Update product placement in Product model
    const Product = require('../models/Product');
    const placed = await Product.findOneAndUpdate(
      { _id: product._id },
      {
        $push: {
          placements: {
            section: section.name,
            quantity: product.quantity
          }
        }
      },
      { new: true }
    );
    res.json({ sectionId, placed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new section
router.post('/', async (req, res) => {
  try {
    const { name, allowedCategories, rackCount, length, width, height } = req.body;
    if (
      typeof name !== 'string' || name.trim() === '' ||
      !Array.isArray(allowedCategories) ||
      rackCount === undefined || rackCount === null || isNaN(Number(rackCount)) || Number(rackCount) <= 0 ||
      length === undefined || length === null || isNaN(Number(length)) || Number(length) <= 0 ||
      width === undefined || width === null || isNaN(Number(width)) || Number(width) <= 0 ||
      height === undefined || height === null || isNaN(Number(height)) || Number(height) <= 0
    ) {
      return res.status(400).json({ error: 'Missing or invalid required section fields' });
    }
    const section = new Section({ name, allowedCategories, rackCount, length, width, height });
    await section.save();
    res.status(201).json(section);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all sections
router.get('/', async (req, res) => {
  try {
    const sections = await Section.find();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update section
router.put('/:id', async (req, res) => {
  try {
    const updated = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// Delete section
router.delete('/:id', async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.json({ message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
});


module.exports = router;
