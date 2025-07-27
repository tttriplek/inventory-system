const mongoose = require('mongoose');

/**
 * Professional Product Schema - Facility-Aware Design
 * 
 * This schema is designed to work with our facility-first architecture.
 * Features are conditionally available based on facility configuration.
 */
const productSchema = new mongoose.Schema({
  // Basic Product Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    index: true
  },

  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true,
    index: true
  },

  // 🏢 Facility Association
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true,
    index: true
  },

  // Inventory Information
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },

  batchId: {
    type: String,
    required: true,
    index: true
  },

  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },

  initialQuantity: {
    type: Number,
    required: true,
    min: [1, 'Initial quantity must be at least 1']
  },

  // Pricing
  pricePerUnit: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },

  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },

  // Physical Properties
  size: {
    weight: { type: Number, min: 0 },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, enum: ['cm', 'inches'], default: 'cm' }
    },
    volume: { type: Number, min: 0 }
  },

  // 📅 EXPIRY TRACKING (Feature-Dependent)
  expiry: {
    isTracked: { type: Boolean, default: false },
    date: { type: Date },
    alertDays: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['fresh', 'expiring', 'expired'],
      default: 'fresh'
    }
  },

  // 🌡️ TEMPERATURE MONITORING (Feature-Dependent)
  temperature: {
    isMonitored: { type: Boolean, default: false },
    current: { type: Number },
    min: { type: Number },
    max: { type: Number },
    unit: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' },
    alerts: [{
      timestamp: { type: Date, default: Date.now },
      temperature: Number,
      alertType: { type: String, enum: ['high', 'low', 'critical'] },
      resolved: { type: Boolean, default: false }
    }]
  },

  // Location & Placement
  placement: {
    section: { type: String },
    aisle: { type: String },
    shelf: { type: String },
    position: { type: String }
  },

  // Supply Chain
  origin: {
    supplier: { type: String },
    country: { type: String },
    region: { type: String }
  },

  // Dates
  receivedDate: { type: Date, default: Date.now },
  lastMovedDate: { type: Date },

  // Distribution History
  distributions: [{
    destination: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceSent: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    }
  }],

  // Activity History
  history: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: String, default: 'system' },
    details: { type: mongoose.Schema.Types.Mixed }
  }],

  // Quality Control (Feature-Dependent)
  quality: {
    score: { type: Number, min: 0, max: 100 },
    inspections: [{
      date: { type: Date, default: Date.now },
      inspector: { type: String },
      score: { type: Number, min: 0, max: 100 },
      notes: { type: String },
      passed: { type: Boolean, default: true }
    }],
    defects: [{
      type: { type: String },
      severity: { type: String, enum: ['minor', 'major', 'critical'] },
      description: { type: String },
      reportedDate: { type: Date, default: Date.now }
    }]
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'reserved', 'damaged', 'expired', 'recalled'],
    default: 'active',
    index: true
  },

  // Metadata
  tags: [{ type: String, trim: true }],
  notes: { type: String, maxlength: 1000 },

  // Audit Fields
  createdBy: { type: String, default: 'system' },
  updatedBy: { type: String, default: 'system' }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔥 PROFESSIONAL MIDDLEWARE & METHODS

// Virtual for days until expiry
productSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiry.isTracked || !this.expiry.date) return null;
  
  const now = new Date();
  const expiryDate = new Date(this.expiry.date);
  const diffTime = expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for total value
productSchema.virtual('totalValue').get(function() {
  return this.quantity * this.pricePerUnit;
});

// Virtual for availability status
productSchema.virtual('availability').get(function() {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= 5) return 'low_stock';
  return 'in_stock';
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Update expiry status
  if (this.expiry.isTracked && this.expiry.date) {
    const daysUntil = this.daysUntilExpiry;
    if (daysUntil < 0) {
      this.expiry.status = 'expired';
    } else if (daysUntil <= (this.expiry.alertDays || 30)) {
      this.expiry.status = 'expiring';
    } else {
      this.expiry.status = 'fresh';
    }
  }

  // Update last moved date if placement changed
  if (this.isModified('placement')) {
    this.lastMovedDate = new Date();
  }

  next();
});

// Instance methods
productSchema.methods.addHistory = function(action, details, userId) {
  this.history.push({
    action,
    details,
    userId,
    timestamp: new Date()
  });
};

productSchema.methods.distribute = function(destination, quantity, userId) {
  if (quantity > this.quantity) {
    throw new Error('Insufficient quantity for distribution');
  }

  const distribution = {
    destination,
    quantity,
    priceSent: quantity * this.pricePerUnit,
    date: new Date()
  };

  this.distributions.push(distribution);
  this.quantity -= quantity;
  this.addHistory('distribute', distribution, userId);

  return distribution;
};

productSchema.methods.addTemperatureReading = function(temperature, alertType = null) {
  if (!this.temperature.isMonitored) return;

  this.temperature.current = temperature;

  if (alertType) {
    this.temperature.alerts.push({
      temperature,
      alertType,
      timestamp: new Date()
    });
  }
};

// Static methods
productSchema.statics.findByFacility = function(facilityId, filters = {}) {
  return this.find({ facilityId, ...filters });
};

productSchema.statics.findExpiring = function(facilityId, days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    facilityId,
    'expiry.isTracked': true,
    'expiry.date': {
      $exists: true,
      $ne: null,
      $lte: futureDate
    },
    status: 'active'
  }).sort({ 'expiry.date': 1 });
};

productSchema.statics.findLowStock = function(facilityId, threshold = 10) {
  return this.find({
    facilityId,
    quantity: { $lte: threshold },
    status: 'active'
  }).sort({ quantity: 1 });
};

// Indexes for performance
productSchema.index({ facilityId: 1, category: 1 });
productSchema.index({ facilityId: 1, 'expiry.date': 1 });
productSchema.index({ facilityId: 1, quantity: 1 });
productSchema.index({ facilityId: 1, status: 1 });
productSchema.index({ batchId: 1 });
productSchema.index({ sku: 1 });

module.exports = mongoose.model('Product', productSchema);
