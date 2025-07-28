const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['warehouse', 'retail', 'distribution', 'manufacturing', 'cold-storage'],
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    manager: {
      type: String,
      trim: true
    }
  },
  features: {
    // Core features
    products: {
      type: Boolean,
      default: true
    },
    inventory: {
      type: Boolean,
      default: true
    },
    analytics: {
      type: Boolean,
      default: false
    },
    sections: {
      type: Boolean,
      default: false
    },
    expiry: {
      type: Boolean,
      default: false
    },
    temperature: {
      type: Boolean,
      default: false
    },
    // Additional features
    barcodeScanning: {
      type: Boolean,
      default: false
    },
    rfid: {
      type: Boolean,
      default: false
    },
    qualityControl: {
      type: Boolean,
      default: false
    },
    shipping: {
      type: Boolean,
      default: false
    },
    receiving: {
      type: Boolean,
      default: false
    }
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    },
    businessHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '17:00'
      },
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]
    }
  },
  capacity: {
    maxProducts: {
      type: Number
    },
    maxSections: {
      type: Number
    },
    totalArea: {
      value: Number,
      unit: {
        type: String,
        enum: ['sqft', 'sqm'],
        default: 'sqft'
      }
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
facilitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
facilitySchema.index({ code: 1 });
facilitySchema.index({ type: 1 });
facilitySchema.index({ status: 1 });
facilitySchema.index({ 'location.city': 1 });

// Virtual for full address
facilitySchema.virtual('fullAddress').get(function() {
  if (!this.location) return '';
  
  const parts = [];
  if (this.location.address) parts.push(this.location.address);
  if (this.location.city) parts.push(this.location.city);
  if (this.location.state) parts.push(this.location.state);
  if (this.location.postalCode) parts.push(this.location.postalCode);
  if (this.location.country) parts.push(this.location.country);
  
  return parts.join(', ');
});

// Instance method to get enabled features
facilitySchema.methods.getEnabledFeatures = function() {
  if (!this.features) return [];
  
  return Object.entries(this.features)
    .filter(([key, value]) => value === true)
    .map(([key]) => key);
};

// Instance method to check if a feature is enabled
facilitySchema.methods.hasFeature = function(featureName) {
  return this.features && this.features[featureName] === true;
};

// Static method to get facilities by type
facilitySchema.statics.findByType = function(type) {
  return this.find({ type: type, status: 'active' });
};

// Static method to get active facilities
facilitySchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

module.exports = mongoose.model('Facility', facilitySchema);
