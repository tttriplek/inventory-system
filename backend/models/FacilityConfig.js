const mongoose = require('mongoose');

const facilityConfigSchema = new mongoose.Schema({
  facilityType: {
    type: String,
    enum: ['warehouse', 'distribution_center', 'retail_store', 'supermarket', 'mini_market', 'dark_store'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  features: {
    // Inventory Features
    batchTracking: { type: Boolean, default: true },
    individualItemTracking: { type: Boolean, default: true },
    expiryDateTracking: { type: Boolean, default: true },
    
    // Order Management
    canCreatePurchaseOrders: { type: Boolean, default: true },
    canReceiveTransfers: { type: Boolean, default: true },
    canInitiateTransfers: { type: Boolean, default: true },
    
    // Sales
    pointOfSale: { type: Boolean, default: false },
    b2bSales: { type: Boolean, default: false },
    b2cSales: { type: Boolean, default: false },
    
    // Storage
    locationTracking: { type: Boolean, default: true },
    zoneManagement: { type: Boolean, default: false },
    temperatureMonitoring: { type: Boolean, default: false },
    
    // Additional Features
    crossDocking: { type: Boolean, default: false },
    qualityControl: { type: Boolean, default: false },
    returnProcessing: { type: Boolean, default: true }
  },
  defaultSettings: {
    lowStockThreshold: { type: Number, default: 5 },
    orderLeadTime: { type: Number, default: 7 }, // days
    batchSize: { type: Number, default: 1 },
    autoReorder: { type: Boolean, default: false }
  },
  terminology: {
    stockUnit: { type: String, default: 'item' }, // item, pallet, case, etc.
    storage: { type: String, default: 'shelf' }, // shelf, rack, bay, etc.
    transfer: { type: String, default: 'transfer' } // transfer, shipment, delivery, etc.
  }
}, {
  timestamps: true
});

// Pre-defined configurations for different facility types
facilityConfigSchema.statics.getDefaultConfig = function(type) {
  const defaults = {
    warehouse: {
      features: {
        batchTracking: true,
        individualItemTracking: false,
        expiryDateTracking: true,
        canCreatePurchaseOrders: false,
        canReceiveTransfers: true,
        canInitiateTransfers: true,
        pointOfSale: false,
        b2bSales: false,
        b2cSales: false,
        locationTracking: true,
        zoneManagement: true,
        temperatureMonitoring: true,
        crossDocking: true,
        qualityControl: true,
        returnProcessing: true
      },
      defaultSettings: {
        lowStockThreshold: 50,
        orderLeadTime: 14,
        batchSize: 100,
        autoReorder: false
      },
      terminology: {
        stockUnit: 'pallet',
        storage: 'bay',
        transfer: 'shipment'
      }
    },
    retail_store: {
      features: {
        batchTracking: true,
        individualItemTracking: true,
        expiryDateTracking: true,
        canCreatePurchaseOrders: true,
        canReceiveTransfers: true,
        canInitiateTransfers: true,
        pointOfSale: true,
        b2bSales: true,
        b2cSales: true,
        locationTracking: true,
        zoneManagement: false,
        temperatureMonitoring: false,
        crossDocking: false,
        qualityControl: true,
        returnProcessing: true
      },
      defaultSettings: {
        lowStockThreshold: 5,
        orderLeadTime: 7,
        batchSize: 10,
        autoReorder: true
      },
      terminology: {
        stockUnit: 'item',
        storage: 'shelf',
        transfer: 'delivery'
      }
    },
    // Add more facility types as needed
  };
  
  return defaults[type] || defaults.retail_store;
};

const FacilityConfig = mongoose.model('FacilityConfig', facilityConfigSchema);

module.exports = FacilityConfig;
