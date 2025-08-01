/**
 * Revolutionary Inventory System - Master Feature Configuration
 * 
 * This defines ALL features in the system with their dependencies,
 * components they control, and default states.
 */

const FEATURE_DEFINITIONS = {
  // Core Inventory Features
  productManagement: {
    id: 'productManagement',
    name: 'Product Management',
    description: 'Create, edit, view, and manage products',
    category: 'core',
    icon: '📦',
    version: '2.0.0',
    dependencies: [],
    components: [
      'ProductForm',
      'ProductTable', 
      'ProductDetail',
      'ProductCard'
    ],
    pages: [
      '/products',
      '/products/:id'
    ],
    api: [
      'GET /api/products',
      'POST /api/products',
      'PUT /api/products/:id',
      'DELETE /api/products/:id'
    ],
    defaultEnabled: true,
    systemLevel: true, // Available globally
    facilityLevel: true // Can be toggled per facility
  },

  batchManagement: {
    id: 'batchManagement',
    name: 'Batch Management',
    description: 'Track products by batches with expiry dates',
    category: 'inventory',
    icon: '📋',
    version: '2.0.0',
    dependencies: ['productManagement'],
    components: [
      'BatchTab',
      'BatchForm',
      'BatchTable',
      'ExpiryAlerts'
    ],
    tabs: [
      'batches' // in ProductDetail
    ],
    api: [
      'GET /api/products/:id/batches',
      'POST /api/products/:id/batches'
    ],
    defaultEnabled: true,
    systemLevel: true,
    facilityLevel: true
  },

  storageDesigner: {
    id: 'storageDesigner',
    name: 'Storage Designer',
    description: 'Visual warehouse layout designer with product placement',
    category: 'advanced',
    icon: '🏗️',
    version: '3.0.0',
    dependencies: ['productManagement', 'sectionManagement'],
    components: [
      'StorageDesigner',
      'PlacementTab',
      'Storage2DCanvas',
      'ProductPlacementPanel'
    ],
    pages: [
      '/storage-designer'
    ],
    tabs: [
      'placement' // in ProductDetail
    ],
    sidebar: ['storage-designer'],
    api: [
      'GET /api/storage/layout',
      'PUT /api/storage/layout',
      'PUT /api/storage/products/:id/location'
    ],
    defaultEnabled: true,
    systemLevel: true,
    facilityLevel: true
  },

  sectionManagement: {
    id: 'sectionManagement',
    name: 'Section Management',
    description: 'Organize warehouse into sections and zones',
    category: 'warehouse',
    icon: '🗂️',
    version: '2.0.0',
    dependencies: ['productManagement'],
    components: [
      'SectionManager',
      'SectionForm',
      'SectionList'
    ],
    pages: [
      '/section-manager'
    ],
    sidebar: ['section-manager'],
    api: [
      'GET /api/sections',
      'POST /api/sections',
      'PUT /api/sections/:id'
    ],
    defaultEnabled: true,
    systemLevel: true,
    facilityLevel: true
  },

  analytics: {
    id: 'analytics',
    name: 'Analytics & Reporting',
    description: 'Advanced analytics, charts, and business intelligence',
    category: 'business',
    icon: '📈',
    version: '2.0.0',
    dependencies: ['productManagement'],
    components: [
      'Analytics',
      'AnalyticsTab',
      'Charts',
      'Reports'
    ],
    pages: [
      '/analytics'
    ],
    tabs: [
      'analytics' // in ProductDetail
    ],
    sidebar: ['analytics'],
    api: [
      'GET /api/analytics/summary',
      'GET /api/analytics/trends'
    ],
    defaultEnabled: true,
    systemLevel: true,
    facilityLevel: true
  },

  temperatureMonitoring: {
    id: 'temperatureMonitoring',
    name: 'Temperature Monitoring',
    description: 'Real-time temperature tracking and alerts',
    category: 'monitoring',
    icon: '🌡️',
    version: '1.5.0',
    dependencies: ['productManagement'],
    components: [
      'TemperatureMonitor',
      'TemperatureAlerts',
      'TemperatureHistory'
    ],
    pages: [
      '/temperature-monitor'
    ],
    sidebar: ['temperature-monitor'],
    api: [
      'GET /api/temperature/current',
      'GET /api/temperature/history'
    ],
    defaultEnabled: false, // Premium feature
    systemLevel: true,
    facilityLevel: true
  },

  qualityControl: {
    id: 'qualityControl',
    name: 'Quality Control',
    description: 'Product quality inspections and defect tracking',
    category: 'quality',
    icon: '✅',
    version: '1.8.0',
    dependencies: ['productManagement', 'batchManagement'],
    components: [
      'QualityInspections',
      'DefectTracking',
      'QualityReports'
    ],
    tabs: [
      'quality' // in ProductDetail
    ],
    api: [
      'GET /api/quality/inspections',
      'POST /api/quality/inspections'
    ],
    defaultEnabled: false, // Premium feature
    systemLevel: true,
    facilityLevel: true
  },

  distributionManagement: {
    id: 'distributionManagement',
    name: 'Distribution Management',
    description: 'Track product distribution and shipments',
    category: 'logistics',
    icon: '🚚',
    version: '2.0.0',
    dependencies: ['productManagement', 'batchManagement'],
    components: [
      'DistributionForm',
      'ShipmentTracking',
      'DeliveryStatus'
    ],
    forms: [
      'distributionForm' // in ProductDetail
    ],
    api: [
      'POST /api/products/:id/distribute',
      'GET /api/shipments'
    ],
    defaultEnabled: true,
    systemLevel: true,
    facilityLevel: true
  },

  inventoryTracking: {
    id: 'inventoryTracking',
    name: 'Inventory Tracking',
    description: 'Real-time inventory levels and stock management',
    category: 'core',
    icon: '📊',
    version: '2.0.0',
    dependencies: ['productManagement'],
    components: [
      'InventoryDashboard',
      'StockAlerts',
      'ReorderManagement'
    ],
    features: [
      'lowStockAlerts',
      'automaticReordering',
      'stockThresholds'
    ],
    api: [
      'GET /api/inventory/levels',
      'POST /api/inventory/adjust'
    ],
    defaultEnabled: true,
    systemLevel: true,
    facilityLevel: true
  },

  purchaseOrders: {
    id: 'purchaseOrders',
    name: 'Purchase Orders',
    description: 'Create and manage purchase orders from suppliers',
    category: 'procurement',
    icon: '🛒',
    version: '1.6.0',
    dependencies: ['productManagement'],
    components: [
      'PurchaseOrderForm',
      'PurchaseOrderList',
      'SupplierManagement'
    ],
    api: [
      'GET /api/purchase-orders',
      'POST /api/purchase-orders'
    ],
    defaultEnabled: true,
    systemLevel: true,
    facilityLevel: true
  },

  activityLogging: {
    id: 'activityLogging',
    name: 'Activity Logging',
    description: 'System activity logs and audit trails',
    category: 'security',
    icon: '📝',
    version: '1.4.0',
    dependencies: [],
    components: [
      'ActivityLogs',
      'AuditTrail',
      'UserActions'
    ],
    api: [
      'GET /api/activity-logs',
      'POST /api/activity-logs'
    ],
    defaultEnabled: true,
    systemLevel: true,
    facilityLevel: false // Always enabled for security
  }
};

// Feature Categories for UI organization
const FEATURE_CATEGORIES = {
  core: {
    name: 'Core Features',
    description: 'Essential inventory management features',
    icon: '⚡',
    color: 'blue'
  },
  inventory: {
    name: 'Inventory Management',
    description: 'Advanced inventory tracking and management',
    icon: '📦',
    color: 'green'
  },
  warehouse: {
    name: 'Warehouse Management',
    description: 'Physical warehouse and storage management',
    icon: '🏭',
    color: 'purple'
  },
  advanced: {
    name: 'Advanced Features',
    description: 'Cutting-edge functionality for power users',
    icon: '🚀',
    color: 'indigo'
  },
  business: {
    name: 'Business Intelligence',
    description: 'Analytics, reporting, and insights',
    icon: '📈',
    color: 'yellow'
  },
  monitoring: {
    name: 'Monitoring & Alerts',
    description: 'Real-time monitoring and notification systems',
    icon: '👁️',
    color: 'red'
  },
  quality: {
    name: 'Quality Assurance',
    description: 'Quality control and inspection features',
    icon: '✅',
    color: 'emerald'
  },
  logistics: {
    name: 'Logistics & Distribution',
    description: 'Shipping, distribution, and logistics management',
    icon: '🚚',
    color: 'orange'
  },
  procurement: {
    name: 'Procurement',
    description: 'Purchasing and supplier management',
    icon: '🛒',
    color: 'teal'
  },
  security: {
    name: 'Security & Compliance',
    description: 'Security, auditing, and compliance features',
    icon: '🔒',
    color: 'gray'
  }
};

// Dependency resolver
const resolveDependencies = (featureId, enabled = new Set()) => {
  const feature = FEATURE_DEFINITIONS[featureId];
  if (!feature) return enabled;
  
  // Add dependencies first
  for (const dep of feature.dependencies) {
    if (!enabled.has(dep)) {
      resolveDependencies(dep, enabled);
    }
  }
  
  // Add the feature itself
  enabled.add(featureId);
  return enabled;
};

// Validate feature configuration
const validateFeatureConfig = (config) => {
  const errors = [];
  const warnings = [];
  
  for (const [featureId, isEnabled] of Object.entries(config)) {
    if (isEnabled && FEATURE_DEFINITIONS[featureId]) {
      const feature = FEATURE_DEFINITIONS[featureId];
      
      // Check dependencies
      for (const dep of feature.dependencies) {
        if (!config[dep]) {
          errors.push(`Feature '${feature.name}' requires '${FEATURE_DEFINITIONS[dep]?.name}' to be enabled`);
        }
      }
    }
  }
  
  return { errors, warnings };
};

module.exports = {
  FEATURE_DEFINITIONS,
  FEATURE_CATEGORIES,
  resolveDependencies,
  validateFeatureConfig
};
