// Feature definitions for the Revolutionary Inventory System
const featureDefinitions = {
  'product-management': {
    id: 'product-management',
    name: 'Product Management',
    description: 'Core product CRUD operations and inventory tracking',
    category: 'core',
    dependencies: [],
    defaultEnabled: true,
    components: ['ProductTable', 'ProductForm', 'ProductDetail'],
    apiRoutes: ['/api/products/*']
  },
  'storage-designer': {
    id: 'storage-designer',
    name: 'Storage Designer',
    description: 'Advanced warehouse layout design and management tools',
    category: 'storage',
    dependencies: ['product-management'],
    defaultEnabled: true,
    components: ['StorageDesigner', 'LayoutCanvas', 'StorageAnalytics'],
    apiRoutes: ['/api/storage/*', '/api/sections/*']
  },
  'analytics-dashboard': {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Business intelligence and reporting features',
    category: 'analytics',
    dependencies: ['product-management'],
    defaultEnabled: true,
    components: ['Analytics', 'Dashboard', 'Reports'],
    apiRoutes: ['/api/analytics/*', '/api/reports/*']
  },
  'rule-engine': {
    id: 'rule-engine',
    name: 'Rule Engine',
    description: 'Automated business rule processing and validation',
    category: 'automation',
    dependencies: ['product-management'],
    defaultEnabled: true,
    components: ['RuleManager', 'RuleEditor'],
    apiRoutes: ['/api/rules/*']
  },
  'section-management': {
    id: 'section-management',
    name: 'Section Management',
    description: 'Warehouse section organization and capacity management',
    category: 'storage',
    dependencies: ['product-management', 'storage-designer'],
    defaultEnabled: true,
    components: ['SectionManager', 'SectionAnalytics'],
    apiRoutes: ['/api/sections/*']
  },
  'temperature-monitoring': {
    id: 'temperature-monitoring',
    name: 'Temperature Monitoring',
    description: 'Environmental monitoring and alerts for temperature-sensitive items',
    category: 'monitoring',
    dependencies: ['product-management'],
    defaultEnabled: false,
    components: ['TemperatureMonitor', 'TemperatureAlerts'],
    apiRoutes: ['/api/temperature/*']
  },
  'expiry-management': {
    id: 'expiry-management',
    name: 'Expiry Management',
    description: 'Track and manage product expiration dates and alerts',
    category: 'compliance',
    dependencies: ['product-management'],
    defaultEnabled: true,
    components: ['ExpiryTracker', 'ExpiryAlerts'],
    apiRoutes: ['/api/expiry/*']
  },
  'inventory-alerts': {
    id: 'inventory-alerts',
    name: 'Inventory Alerts',
    description: 'Smart notifications for low stock, overstock, and reorder points',
    category: 'alerts',
    dependencies: ['product-management'],
    defaultEnabled: true,
    components: ['AlertCenter', 'AlertSettings'],
    apiRoutes: ['/api/alerts/*']
  },
  'barcode-scanning': {
    id: 'barcode-scanning',
    name: 'Barcode Scanning',
    description: 'Mobile barcode scanning for quick product identification',
    category: 'mobile',
    dependencies: ['product-management'],
    defaultEnabled: false,
    components: ['BarcodeScanner', 'ScanHistory'],
    apiRoutes: ['/api/scan/*']
  },
  'batch-operations': {
    id: 'batch-operations',
    name: 'Batch Operations',
    description: 'Bulk operations for product management and data import/export',
    category: 'productivity',
    dependencies: ['product-management'],
    defaultEnabled: true,
    components: ['BatchProcessor', 'ImportExport'],
    apiRoutes: ['/api/batch/*']
  },
  'feature-toggle-admin': {
    id: 'feature-toggle-admin',
    name: 'Feature Toggle Admin',
    description: 'Administrative interface for managing feature toggles',
    category: 'admin',
    dependencies: [],
    defaultEnabled: true,
    components: ['FeatureToggleAdmin', 'FeatureSettings'],
    apiRoutes: ['/api/features/*']
  },
  'purchase-orders': {
    id: 'purchase-orders',
    name: 'Purchase Orders',
    description: 'Create, manage, and track purchase orders from suppliers',
    category: 'core',
    dependencies: ['product-management'],
    defaultEnabled: true,
    components: ['PurchaseOrders', 'PurchaseOrderForm', 'SupplierManagement'],
    apiRoutes: ['/api/purchase-orders/*']
  },
  'activity-log': {
    id: 'activity-log',
    name: 'Activity Log',
    description: 'Comprehensive audit trail and activity monitoring',
    category: 'monitoring',
    dependencies: ['product-management'],
    defaultEnabled: true,
    components: ['ActivityLog', 'AuditTrail', 'UserActions'],
    apiRoutes: ['/api/activity-logs/*']
  },
  'financial-tracking': {
    id: 'financial-tracking',
    name: 'Financial Tracking',
    description: 'Advanced cost tracking, inventory valuation, and financial analytics',
    category: 'finance',
    dependencies: ['product-management'],
    defaultEnabled: false,
    components: ['FinancialDashboard', 'CostAnalysis', 'ValuationReports'],
    apiRoutes: ['/api/financial/*', '/api/costing/*'],
    icon: '💰',
    enterpriseFeature: true
  },
  'multi-currency-support': {
    id: 'multi-currency-support',
    name: 'Multi-Currency Support',
    description: 'Support for multiple currencies with real-time exchange rates',
    category: 'finance',
    dependencies: ['financial-tracking'],
    defaultEnabled: false,
    components: ['CurrencyManager', 'ExchangeRateTracker'],
    apiRoutes: ['/api/currency/*'],
    icon: '🌍',
    enterpriseFeature: true
  },
  'cost-analysis': {
    id: 'cost-analysis',
    name: 'Advanced Cost Analysis',
    description: 'FIFO/LIFO costing, landed cost calculations, profitability analysis',
    category: 'finance',
    dependencies: ['financial-tracking'],
    defaultEnabled: false,
    components: ['CostAnalyzer', 'ProfitabilityReports', 'CostingMethods'],
    apiRoutes: ['/api/costing/*', '/api/profitability/*'],
    icon: '📊',
    enterpriseFeature: true
  },
  'smart-notifications': {
    id: 'smart-notifications',
    name: 'Smart Notifications',
    description: 'Intelligent email, SMS, and webhook notifications with escalation workflows',
    category: 'communication',
    dependencies: [],
    defaultEnabled: false,
    components: ['NotificationCenter', 'EscalationWorkflows', 'MessageTemplates'],
    apiRoutes: ['/api/notifications/*', '/api/messaging/*'],
    icon: '🔔',
    enterpriseFeature: true
  },
  'security-compliance': {
    id: 'security-compliance',
    name: 'Security & Compliance',
    description: 'Advanced security protocols, compliance tracking, and audit controls',
    category: 'compliance',
    dependencies: ['activity-log'],
    defaultEnabled: false,
    components: ['SecurityManager', 'ComplianceTracker', 'AuditControls'],
    apiRoutes: ['/api/security/*', '/api/compliance/*'],
    icon: '🔒',
    enterpriseFeature: true
  },
  'insurance-integration': {
    id: 'insurance-integration',
    name: 'Insurance Integration',
    description: 'Integration with insurance providers for coverage tracking and claims',
    category: 'finance',
    dependencies: ['financial-tracking', 'security-compliance'],
    defaultEnabled: false,
    components: ['InsuranceManager', 'ClaimsTracker', 'CoverageAnalysis'],
    apiRoutes: ['/api/insurance/*'],
    icon: '🛡️',
    enterpriseFeature: true
  },
  'audit-trails': {
    id: 'audit-trails',
    name: 'Enhanced Audit Trails',
    description: 'Comprehensive audit trails with compliance reporting and forensic analysis',
    category: 'compliance',
    dependencies: ['activity-log'],
    defaultEnabled: false,
    components: ['AuditTrailManager', 'ForensicAnalysis', 'ComplianceReports'],
    apiRoutes: ['/api/audit-trails/*'],
    icon: '📋',
    enterpriseFeature: true
  }
};

module.exports = {
  featureDefinitions,
  
  // Helper functions
  getFeature: (featureId) => featureDefinitions[featureId],
  
  getAllFeatures: () => Object.values(featureDefinitions),
  
  getFeaturesByCategory: (category) => 
    Object.values(featureDefinitions).filter(feature => feature.category === category),
  
  getFeatureDependencies: (featureId) => {
    const feature = featureDefinitions[featureId];
    return feature ? feature.dependencies : [];
  },
  
  validateFeatureDependencies: (enabledFeatures) => {
    const errors = [];
    
    for (const featureId of enabledFeatures) {
      const feature = featureDefinitions[featureId];
      if (feature && feature.dependencies) {
        for (const dependency of feature.dependencies) {
          if (!enabledFeatures.includes(dependency)) {
            errors.push(`Feature '${featureId}' requires '${dependency}' to be enabled`);
          }
        }
      }
    }
    
    return errors;
  }
};
