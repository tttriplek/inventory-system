/**
 * Revolutionary Inventory System - Feature Configuration
 * 
 * This file defines the features available across different facilities.
 * Features can be enabled/disabled per facility for maximum flexibility.
 */

const features = {
  // Core inventory management
  products: {
    enabled: true,
    description: "Product management with CRUD operations",
    version: "2.0.0",
    endpoints: [
      "GET /api/products",
      "POST /api/products", 
      "PUT /api/products/:id",
      "DELETE /api/products/:id",
      "GET /api/products/analytics"
    ]
  },

  // Advanced analytics and reporting
  analytics: {
    enabled: true,
    description: "Advanced analytics dashboard with real-time metrics",
    version: "2.0.0",
    endpoints: [
      "GET /api/products/analytics",
      "GET /api/analytics/summary",
      "GET /api/analytics/trends"
    ]
  },

  // Inventory tracking and management
  inventory: {
    enabled: true,
    description: "Real-time inventory tracking and stock management",
    version: "2.0.0",
    endpoints: [
      "GET /api/inventory",
      "POST /api/inventory/adjust",
      "GET /api/inventory/low-stock"
    ]
  },

  // Section and location management
  sections: {
    enabled: true,
    description: "Warehouse sections and location management",
    version: "1.5.0",
    endpoints: [
      "GET /api/sections",
      "POST /api/sections",
      "PUT /api/sections/:id",
      "DELETE /api/sections/:id"
    ]
  },

  // Expiry date tracking
  expiry: {
    enabled: true,
    description: "Product expiry tracking and alerts",
    version: "1.8.0",
    endpoints: [
      "GET /api/products/expiring",
      "GET /api/expiry/alerts",
      "POST /api/expiry/notifications"
    ]
  },

  // Temperature monitoring
  temperature: {
    enabled: true,
    description: "Temperature monitoring for sensitive products",
    version: "1.3.0",
    endpoints: [
      "GET /api/temperature/readings",
      "POST /api/temperature/alerts",
      "GET /api/temperature/history"
    ]
  },

  // Purchase order management
  purchaseOrders: {
    enabled: true,
    description: "Purchase order creation and tracking",
    version: "1.6.0",
    endpoints: [
      "GET /api/purchase-orders",
      "POST /api/purchase-orders",
      "PUT /api/purchase-orders/:id"
    ]
  },

  // Activity logging and audit trails
  activityLogs: {
    enabled: true,
    description: "System activity logging and audit trails",
    version: "1.4.0",
    endpoints: [
      "GET /api/activity-logs",
      "POST /api/activity-logs"
    ]
  },

  // Multi-facility management
  facilities: {
    enabled: true,
    description: "Multi-facility support and management",
    version: "2.0.0",
    endpoints: [
      "GET /api/facilities",
      "POST /api/facilities",
      "PUT /api/facilities/:id",
      "GET /api/facility-config"
    ]
  },

  // Storage Designer (Warehouse Layout Management)
  storageDesigner: {
    enabled: true,
    description: "Visual warehouse layout designer with drag-and-drop product placement",
    version: "3.0.0",
    requiresFeatures: ["sections", "products"],
    endpoints: [
      "GET /api/storage/layout",
      "PUT /api/storage/layout",
      "PUT /api/storage/products/:id/location",
      "GET /api/storage/location/:id/products",
      "GET /api/storage/utilization",
      "GET /api/storage/search"
    ],
    capabilities: {
      "2d_view": "2D warehouse layout visualization",
      "3d_view": "3D warehouse layout visualization (future)",
      "drag_drop": "Drag and drop product placement",
      "bulk_assignment": "Bulk product location assignment",
      "utilization_analytics": "Storage utilization reporting",
      "location_search": "Advanced location-based product search"
    }
  }
};

// Facility-specific feature overrides
const facilityOverrides = {
  // Cold Storage Facility - Temperature monitoring is critical
  "cold-storage": {
    temperature: { enabled: true, priority: "critical" },
    expiry: { enabled: true, priority: "high" }
  },

  // Main Warehouse - Full feature set
  "main-warehouse": {
    // All features enabled by default
  },

  // Retail Store - Simplified feature set
  "retail-store": {
    sections: { enabled: false },
    temperature: { enabled: false }
  }
};

// Feature dependencies
const dependencies = {
  analytics: ["products", "inventory"],
  expiry: ["products"],
  temperature: ["products", "sections"],
  purchaseOrders: ["products", "inventory"]
};

// System metadata
const systemInfo = {
  name: "Revolutionary Inventory System",
  version: "2.0.0",
  architecture: "Facility-First Modular Design",
  features: Object.keys(features).length,
  lastUpdated: new Date().toISOString()
};

module.exports = {
  features,
  facilityOverrides,
  dependencies,
  systemInfo,
  
  // Helper functions
  isFeatureEnabled: (featureName, facilityType = null) => {
    if (!features[featureName]) return false;
    
    const baseEnabled = features[featureName].enabled;
    
    if (facilityType && facilityOverrides[facilityType] && facilityOverrides[facilityType][featureName]) {
      return facilityOverrides[facilityType][featureName].enabled !== false;
    }
    
    return baseEnabled;
  },

  getEnabledFeatures: (facilityType = null) => {
    return Object.keys(features).filter(feature => 
      module.exports.isFeatureEnabled(feature, facilityType)
    );
  },

  getFeatureEndpoints: (featureName) => {
    return features[featureName]?.endpoints || [];
  }
};
