const mongoose = require('mongoose');

/**
 * Professional Facility Schema - The Foundation of Our System
 * 
 * This schema defines the complete facility configuration that drives
 * every aspect of the inventory system. Each facility can enable/disable
 * features, configure business rules, and customize the entire experience.
 */
const facilitySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Facility name is required'],
    trim: true,
    maxlength: [100, 'Facility name cannot exceed 100 characters']
  },
  
  code: {
    type: String,
    required: [true, 'Facility code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]{3,10}$/, 'Facility code must be 3-10 uppercase alphanumeric characters']
  },
  
  type: {
    type: String,
    required: true,
    enum: {
      values: ['warehouse', 'retail', 'distribution', 'manufacturing', 'hybrid', 'financial-hub', 'custom'],
      message: 'Invalid facility type'
    }
  },

  // Facility Key - for feature management across facilities
  facilityKey: {
    type: String,
    required: true,
    index: true
  },

  // Whether this is a custom facility (unique key) or standard type (shared key)
  isCustomFacility: {
    type: Boolean,
    default: false
  },

  // Location & Contact
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    zipCode: { type: String },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },

  contact: {
    phone: String,
    email: { 
      type: String, 
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'] 
    },
    manager: String
  },

  // 🎯 FEATURE CONFIGURATION - The Core of Our System
  features: {
    // Product Management Features
    productManagement: {
      enabled: { type: Boolean, default: true },
      batchTracking: { type: Boolean, default: true },
      skuGeneration: { type: Boolean, default: true },
      categoryManagement: { type: Boolean, default: true }
    },

    // Inventory Features
    inventory: {
      enabled: { type: Boolean, default: true },
      realTimeTracking: { type: Boolean, default: true },
      lowStockAlerts: { type: Boolean, default: true },
      stockThreshold: { type: Number, default: 10 },
      automaticReordering: { type: Boolean, default: false }
    },

    // Expiry Date Tracking
    expiryTracking: {
      enabled: { type: Boolean, default: false },
      alertDays: { type: Number, default: 30 },
      autoRemoval: { type: Boolean, default: false },
      reportingEnabled: { type: Boolean, default: true }
    },

    // Temperature Monitoring
    temperatureMonitoring: {
      enabled: { type: Boolean, default: false },
      criticalThresholds: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 25 }
      },
      alertSystem: { type: Boolean, default: true },
      logInterval: { type: Number, default: 15 } // minutes
    },

    // Section Management
    sectionManagement: {
      enabled: { type: Boolean, default: true },
      maxSections: { type: Number, default: 50 },
      categoryRestrictions: { type: Boolean, default: true },
      autoPlacement: { type: Boolean, default: false }
    },

    // Distribution & Logistics
    distribution: {
      enabled: { type: Boolean, default: true },
      fifoEnforcement: { type: Boolean, default: true },
      trackDestinations: { type: Boolean, default: true },
      requireApproval: { type: Boolean, default: false }
    },

    // Analytics & Reporting
    analytics: {
      enabled: { type: Boolean, default: true },
      realTimeMetrics: { type: Boolean, default: true },
      historicalReports: { type: Boolean, default: true },
      predictiveAnalytics: { type: Boolean, default: false },
      customDashboards: { type: Boolean, default: true }
    },

    // Quality Control
    qualityControl: {
      enabled: { type: Boolean, default: false },
      inspectionRequired: { type: Boolean, default: false },
      qualityScoring: { type: Boolean, default: false },
      defectTracking: { type: Boolean, default: false }
    },

    // Advanced Features
    advanced: {
      barcodeScanning: { type: Boolean, default: false },
      rfidTracking: { type: Boolean, default: false },
      iotIntegration: { type: Boolean, default: false },
      aiPredictions: { type: Boolean, default: false },
      blockchainTracking: { type: Boolean, default: false }
    },

    // Storage Designer Features
    storageDesigner: {
      enabled: { type: Boolean, default: true },
      layoutDesign: { type: Boolean, default: true },
      utilizationTracking: { type: Boolean, default: true },
      spaceOptimization: { type: Boolean, default: true }
    },

    // Enterprise Features
    'smart-notifications': {
      enabled: { type: Boolean, default: false },
      channels: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        slack: { type: Boolean, default: false }
      },
      realTimeAlerts: { type: Boolean, default: true },
      digestReports: { type: Boolean, default: true }
    },

    'financial-tracking': {
      enabled: { type: Boolean, default: false },
      realTimeValuation: { type: Boolean, default: true },
      costAnalysis: { type: Boolean, default: true },
      profitability: { type: Boolean, default: true },
      budgetTracking: { type: Boolean, default: true }
    },

    'multi-currency-support': {
      enabled: { type: Boolean, default: false },
      baseCurrency: { type: String, default: 'USD' },
      supportedCurrencies: [{ type: String }],
      autoConversion: { type: Boolean, default: true },
      rateUpdateFrequency: { type: String, default: 'daily' }
    },

    'cost-analysis': {
      enabled: { type: Boolean, default: false },
      detailedBreakdown: { type: Boolean, default: true },
      trendAnalysis: { type: Boolean, default: true },
      benchmarking: { type: Boolean, default: true },
      forecastAccuracy: { type: Boolean, default: true }
    },

    'security-compliance': {
      enabled: { type: Boolean, default: false },
      accessLogging: { type: Boolean, default: true },
      dataEncryption: { type: Boolean, default: true },
      complianceReporting: { type: Boolean, default: true },
      riskAssessment: { type: Boolean, default: true }
    },

    'insurance-integration': {
      enabled: { type: Boolean, default: false },
      coverageTracking: { type: Boolean, default: true },
      claimsManagement: { type: Boolean, default: true },
      riskAssessment: { type: Boolean, default: true },
      premiumCalculation: { type: Boolean, default: true }
    },

    'audit-trails': {
      enabled: { type: Boolean, default: false },
      detailedLogging: { type: Boolean, default: true },
      complianceReporting: { type: Boolean, default: true },
      userActivityTracking: { type: Boolean, default: true },
      dataIntegrityChecks: { type: Boolean, default: true }
    }
  },

  // Business Rules & Settings
  businessRules: {
    workingHours: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '17:00' },
      timezone: { type: String, default: 'UTC' }
    },
    
    currency: {
      code: { type: String, default: 'USD' },
      symbol: { type: String, default: '$' }
    },

    measurements: {
      weight: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
      volume: { type: String, enum: ['liters', 'gallons'], default: 'liters' },
      temperature: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' }
    },

    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true }
    }
  },

  // System Configuration
  systemConfig: {
    apiRateLimit: { type: Number, default: 1000 }, // requests per hour
    dataRetentionDays: { type: Number, default: 365 },
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    maintenanceWindow: { type: String, default: '02:00-04:00' }
  },

  // Status & Metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'suspended'],
    default: 'active'
  },

  setupCompleted: { type: Boolean, default: false },
  setupSteps: {
    basicInfo: { type: Boolean, default: false },
    features: { type: Boolean, default: false },
    sections: { type: Boolean, default: false },
    users: { type: Boolean, default: false },
    testing: { type: Boolean, default: false }
  },

  // Audit Fields
  createdBy: { type: String, default: 'system' },
  updatedBy: { type: String, default: 'system' },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔥 PROFESSIONAL MIDDLEWARE & METHODS

// Pre-save validation
facilitySchema.pre('save', function(next) {
  // Auto-generate facility code if not provided
  if (!this.code && this.name) {
    this.code = this.name.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  
  // Generate facility key based on type
  if (!this.facilityKey) {
    if (this.type === 'custom' || this.isCustomFacility) {
      // Custom facilities get unique keys
      this.facilityKey = `custom_${this._id || new mongoose.Types.ObjectId()}`;
      this.isCustomFacility = true;
    } else {
      // Standard facility types share keys
      const standardKeys = {
        'warehouse': 'facility_warehouse',
        'retail': 'facility_retail', 
        'distribution': 'facility_distribution',
        'manufacturing': 'facility_manufacturing',
        'hybrid': 'facility_hybrid'
      };
      this.facilityKey = standardKeys[this.type] || 'facility_default';
      this.isCustomFacility = false;
    }
  }
  
  // Ensure at least basic features are enabled
  if (!this.features.productManagement.enabled && !this.features.inventory.enabled) {
    return next(new Error('At least Product Management or Inventory must be enabled'));
  }
  
  next();
});

// Instance methods
facilitySchema.methods.isFeatureEnabled = function(featurePath) {
  const keys = featurePath.split('.');
  let current = this.features;
  
  for (const key of keys) {
    // Handle both dot notation and bracket notation for hyphenated keys
    if (current && typeof current === 'object' && current.hasOwnProperty(key)) {
      current = current[key];
    } else {
      return false;
    }
  }
  
  return current === true;
};

facilitySchema.methods.getEnabledFeatures = function() {
  const enabled = [];
  
  const checkFeatures = (obj, path = '') => {
    Object.keys(obj).forEach(key => {
      const fullPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'boolean' && value) {
        enabled.push(fullPath);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        checkFeatures(value, fullPath);
      }
    });
  };
  
  checkFeatures(this.features);
  return enabled;
};

facilitySchema.methods.updateSetupProgress = function() {
  const steps = this.setupSteps;
  const completed = Object.values(steps).filter(Boolean).length;
  const total = Object.keys(steps).length;
  
  this.setupCompleted = completed === total;
  return { completed, total, percentage: Math.round((completed / total) * 100) };
};

// Static methods
facilitySchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

facilitySchema.statics.getActiveWithFeature = function(featurePath) {
  const query = { status: 'active' };
  query[`features.${featurePath}`] = true;
  return this.find(query);
};

// Indexes for performance
facilitySchema.index({ code: 1 });
facilitySchema.index({ status: 1 });
facilitySchema.index({ 'features.expiryTracking.enabled': 1 });
facilitySchema.index({ 'features.temperatureMonitoring.enabled': 1 });

module.exports = mongoose.model('Facility', facilitySchema);
