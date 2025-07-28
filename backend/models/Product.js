const mongoose = require('mongoose');

// Sub-schemas for complex nested data
const batchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  manufacturedDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    index: true
  },
  supplierBatchId: {
    type: String,
    index: true
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'Rejected'],
    default: 'A'
  },
  location: {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section'
    },
    zone: String,
    shelf: String,
    position: String
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold', 'expired', 'damaged', 'recalled'],
    default: 'available',
    index: true
  },
  temperature: {
    current: Number,
    min: Number,
    max: Number,
    unit: {
      type: String,
      enum: ['C', 'F'],
      default: 'C'
    }
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    index: true
  },
  contact: {
    email: String,
    phone: String,
    address: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  isPreferred: {
    type: Boolean,
    default: false
  }
});

const pricingSchema = new mongoose.Schema({
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  margin: {
    type: Number,
    min: 0,
    max: 100
  },
  discountRules: [{
    minQuantity: Number,
    discountPercent: Number,
    validFrom: Date,
    validTo: Date
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const complianceSchema = new mongoose.Schema({
  certifications: [{
    name: String,
    number: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    documentUrl: String
  }],
  regulations: [{
    type: String, // FDA, USDA, etc.
    requirement: String,
    status: {
      type: String,
      enum: ['compliant', 'pending', 'non-compliant'],
      default: 'pending'
    },
    lastChecked: Date
  }],
  restrictions: [{
    type: String, // export, import, storage, etc.
    description: String,
    countries: [String],
    validUntil: Date
  }]
});

const nutritionSchema = new mongoose.Schema({
  servingSize: {
    amount: Number,
    unit: String
  },
  calories: Number,
  macronutrients: {
    protein: { amount: Number, unit: String },
    carbohydrates: { amount: Number, unit: String },
    fat: { amount: Number, unit: String },
    fiber: { amount: Number, unit: String },
    sugar: { amount: Number, unit: String }
  },
  micronutrients: [{
    name: String,
    amount: Number,
    unit: String,
    dailyValue: Number
  }],
  allergens: [{
    type: String,
    enum: ['milk', 'eggs', 'fish', 'shellfish', 'tree-nuts', 'peanuts', 'wheat', 'soybeans', 'sesame']
  }],
  dietaryInfo: [{
    type: String,
    enum: ['vegan', 'vegetarian', 'gluten-free', 'organic', 'non-gmo', 'kosher', 'halal']
  }]
});

// Main Product Schema
const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  upc: {
    type: String,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Facility Association
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true,
    index: true
  },
  
  // Category and Classification
  category: {
    primary: {
      type: String,
      required: true,
      index: true
    },
    secondary: String,
    tags: [String]
  },
  brand: {
    name: String,
    code: String,
    manufacturer: String
  },
  
  // Physical Properties
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    unit: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    }
  },
  packaging: {
    type: {
      type: String,
      enum: ['box', 'bottle', 'can', 'bag', 'tube', 'jar', 'pouch', 'other'],
      default: 'box'
    },
    material: String,
    isRecyclable: Boolean,
    unitsPerPackage: {
      type: Number,
      default: 1
    }
  },
  
  // Inventory Management
  batches: [batchSchema],
  totalQuantity: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  availableQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  maxStockLevel: {
    type: Number,
    default: 1000
  },
  
  // Supply Chain
  suppliers: [supplierSchema],
  primarySupplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  leadTime: {
    min: Number, // days
    max: Number,
    average: Number
  },
  
  // Pricing
  pricing: pricingSchema,
  
  // Quality & Compliance
  compliance: complianceSchema,
  qualityMetrics: {
    defectRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    returnRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    customerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    lastQualityCheck: Date
  },
  
  // Storage Requirements
  storage: {
    temperatureRange: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['C', 'F'],
        default: 'C'
      }
    },
    humidityRange: {
      min: Number,
      max: Number
    },
    specialRequirements: [String], // 'refrigerated', 'frozen', 'hazmat', etc.
    stackable: {
      type: Boolean,
      default: true
    },
    maxStackHeight: Number
  },
  
  // Nutrition (for food products)
  nutrition: nutritionSchema,
  
  // Media and Documentation
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean,
    uploadedAt: Date
  }],
  documents: [{
    name: String,
    type: String, // 'msds', 'spec-sheet', 'certificate', etc.
    url: String,
    uploadedAt: Date
  }],
  
  // Analytics & Tracking
  analytics: {
    totalSold: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    profitMargin: Number,
    turnoverRate: Number,
    seasonality: [{
      month: {
        type: Number,
        min: 1,
        max: 12
      },
      demandMultiplier: Number
    }],
    trends: [{
      period: String, // 'daily', 'weekly', 'monthly'
      sales: Number,
      profit: Number,
      date: Date
    }]
  },
  
  // Status and Lifecycle
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'pending-approval', 'recalled'],
    default: 'active',
    index: true
  },
  lifecycle: {
    introduced: Date,
    maturity: Date,
    decline: Date,
    discontinued: Date
  },
  
  // Metadata
  createdBy: {
    type: String,
    default: 'system'
  },
  updatedBy: String,
  version: {
    type: Number,
    default: 1
  },
  changeLog: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
productSchema.index({ facilityId: 1, status: 1 });
productSchema.index({ facilityId: 1, 'category.primary': 1 });
productSchema.index({ facilityId: 1, totalQuantity: 1 });
productSchema.index({ facilityId: 1, 'batches.expiryDate': 1 });
productSchema.index({ facilityId: 1, reorderLevel: 1, totalQuantity: 1 });
productSchema.index({ sku: 1, facilityId: 1 });
productSchema.index({ name: 'text', description: 'text', sku: 'text' });

// Virtual fields
productSchema.virtual('isLowStock').get(function() {
  return this.totalQuantity <= this.reorderLevel;
});

productSchema.virtual('profitPerUnit').get(function() {
  if (!this.pricing) return 0;
  return this.pricing.sellingPrice - this.pricing.cost;
});

productSchema.virtual('expiringBatches').get(function() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return this.batches.filter(batch => 
    batch.expiryDate && 
    batch.expiryDate <= thirtyDaysFromNow &&
    batch.status === 'available'
  );
});

// Instance Methods
productSchema.methods.addBatch = function(batchData) {
  const batch = {
    ...batchData,
    batchNumber: batchData.batchNumber || this.generateBatchNumber()
  };
  
  this.batches.push(batch);
  this.recalculateQuantities();
  this.updatedAt = new Date();
  
  return batch;
};

productSchema.methods.removeBatch = function(batchNumber) {
  const batchIndex = this.batches.findIndex(b => b.batchNumber === batchNumber);
  if (batchIndex > -1) {
    this.batches.splice(batchIndex, 1);
    this.recalculateQuantities();
    this.updatedAt = new Date();
    return true;
  }
  return false;
};

productSchema.methods.updateBatch = function(batchNumber, updateData) {
  const batch = this.batches.find(b => b.batchNumber === batchNumber);
  if (batch) {
    Object.assign(batch, updateData);
    batch.updatedAt = new Date();
    this.recalculateQuantities();
    this.updatedAt = new Date();
    return batch;
  }
  return null;
};

productSchema.methods.recalculateQuantities = function() {
  const available = this.batches
    .filter(b => b.status === 'available')
    .reduce((sum, b) => sum + b.quantity, 0);
    
  const reserved = this.batches
    .filter(b => b.status === 'reserved')
    .reduce((sum, b) => sum + b.quantity, 0);
    
  this.availableQuantity = available;
  this.reservedQuantity = reserved;
  this.totalQuantity = available + reserved;
};

productSchema.methods.generateBatchNumber = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `${this.sku}-${timestamp}-${random}`;
};

productSchema.methods.reserveQuantity = function(quantity, reason = 'manual') {
  let remaining = quantity;
  const reservedBatches = [];
  
  // Reserve from available batches (FIFO - oldest expiry first)
  const availableBatches = this.batches
    .filter(b => b.status === 'available' && b.quantity > 0)
    .sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate - b.expiryDate;
    });
  
  for (const batch of availableBatches) {
    if (remaining <= 0) break;
    
    const toReserve = Math.min(remaining, batch.quantity);
    batch.quantity -= toReserve;
    
    // Create reservation entry
    reservedBatches.push({
      batchNumber: batch.batchNumber,
      quantity: toReserve,
      reason
    });
    
    remaining -= toReserve;
  }
  
  this.recalculateQuantities();
  return { reserved: quantity - remaining, reservedBatches };
};

productSchema.methods.logChange = function(field, oldValue, newValue, changedBy, reason) {
  this.changeLog.push({
    field,
    oldValue,
    newValue,
    changedBy,
    reason,
    changedAt: new Date()
  });
  
  // Keep only last 100 changes
  if (this.changeLog.length > 100) {
    this.changeLog = this.changeLog.slice(-100);
  }
};

// Static Methods
productSchema.statics.findByFacility = function(facilityId, filters = {}) {
  return this.find({ facilityId, ...filters });
};

productSchema.statics.findLowStock = function(facilityId) {
  return this.find({
    facilityId,
    status: 'active',
    $expr: { $lte: ['$totalQuantity', '$reorderLevel'] }
  });
};

productSchema.statics.findExpiringSoon = function(facilityId, days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    facilityId,
    status: 'active',
    'batches.expiryDate': { $lte: futureDate },
    'batches.status': 'available'
  });
};

productSchema.statics.searchProducts = function(facilityId, query, options = {}) {
  const searchQuery = {
    facilityId,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { sku: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { 'category.primary': { $regex: query, $options: 'i' } },
      { 'brand.name': { $regex: query, $options: 'i' } }
    ]
  };
  
  let queryBuilder = this.find(searchQuery);
  
  if (options.category) {
    queryBuilder = queryBuilder.where('category.primary').equals(options.category);
  }
  
  if (options.status) {
    queryBuilder = queryBuilder.where('status').equals(options.status);
  }
  
  if (options.sortBy) {
    queryBuilder = queryBuilder.sort(options.sortBy);
  }
  
  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  return queryBuilder;
};

// Pre-save middleware
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-calculate profit margin
  if (this.pricing && this.pricing.cost && this.pricing.sellingPrice) {
    this.pricing.margin = ((this.pricing.sellingPrice - this.pricing.cost) / this.pricing.cost) * 100;
  }
  
  // Ensure quantities are correct
  this.recalculateQuantities();
  
  next();
});

// Post-save middleware for analytics
productSchema.post('save', function(doc) {
  // Update facility-level statistics (could be done in background)
  console.log(`Product ${doc.sku} updated in facility ${doc.facilityId}`);
});

module.exports = mongoose.model('Product', productSchema);


