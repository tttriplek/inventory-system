// Facility Configuration System
// This defines how different facilities want their product management to work

const facilityConfigurations = {
  // Default configuration
  default: {
    id: 'default',
    name: 'Default Configuration',
    productView: {
      primaryKey: 'name_sku', // Use name + SKU as primary grouping
      showBatchDetails: true,
      showPlacement: true,
      showDistribution: true,
      showAnalytics: true,
      allowBatchMerging: false,
      batchTrackingLevel: 'full', // 'full', 'simple', 'none'
      displayMode: 'grouped' // 'grouped', 'individual', 'both'
    },
    fields: {
      required: ['name', 'sku', 'category', 'quantity', 'pricePerUnit'],
      optional: ['description', 'location', 'supplier', 'expiryDate'],
      custom: []
    },
    validation: {
      allowDuplicateNames: true, // Allow same product name with different SKUs
      skuFormat: null, // No specific format required
      batchIdFormat: 'auto', // Auto-generate batch IDs
      locationRequired: false
    },
    inventory: {
      trackIndividualUnits: true,
      autoGenerateBatchIds: true,
      fifoDistribution: true,
      lowStockAlerts: true,
      expiryTracking: true
    }
  },

  // Warehouse facility configuration
  warehouse_001: {
    id: 'warehouse_001',
    name: 'Main Warehouse',
    extends: 'default',
    productView: {
      primaryKey: 'name_sku',
      showBatchDetails: true,
      showPlacement: true,
      showDistribution: true,
      showAnalytics: true,
      allowBatchMerging: true,
      batchTrackingLevel: 'full',
      displayMode: 'grouped'
    },
    fields: {
      required: ['name', 'sku', 'category', 'quantity', 'pricePerUnit', 'location.warehouse', 'location.zone'],
      optional: ['description', 'supplier', 'expiryDate', 'location.aisle', 'location.shelf'],
      custom: [
        { name: 'hazardous', type: 'boolean', label: 'Hazardous Material' },
        { name: 'temperature', type: 'select', label: 'Storage Temperature', options: ['ambient', 'cold', 'frozen'] }
      ]
    },
    validation: {
      allowDuplicateNames: true,
      skuFormat: /^[A-Z]{2}-\d{3}-\d{3}$/, // Format: AB-123-456
      batchIdFormat: 'sku_sequence', // Use SKU + sequence number
      locationRequired: true
    }
  },

  // Retail store configuration
  retail_001: {
    id: 'retail_001',
    name: 'Downtown Store',
    extends: 'default',
    productView: {
      primaryKey: 'name_sku',
      showBatchDetails: false, // Simpler view for retail
      showPlacement: true,
      showDistribution: false, // No distribution from retail
      showAnalytics: true,
      allowBatchMerging: false,
      batchTrackingLevel: 'simple',
      displayMode: 'grouped'
    },
    fields: {
      required: ['name', 'sku', 'category', 'quantity', 'pricePerUnit'],
      optional: ['description', 'location.section'],
      custom: [
        { name: 'displayPrice', type: 'number', label: 'Display Price' },
        { name: 'promotion', type: 'text', label: 'Current Promotion' }
      ]
    },
    validation: {
      allowDuplicateNames: false, // Retail typically doesn't want duplicate product names
      skuFormat: /^[0-9]{8,12}$/, // UPC/EAN format
      batchIdFormat: 'simple', // Simple batch tracking
      locationRequired: false
    }
  },

  // Manufacturing facility configuration
  manufacturing_001: {
    id: 'manufacturing_001',
    name: 'Production Facility',
    extends: 'default',
    productView: {
      primaryKey: 'name_sku',
      showBatchDetails: true,
      showPlacement: true,
      showDistribution: true,
      showAnalytics: true,
      allowBatchMerging: false, // Manufacturing needs strict batch separation
      batchTrackingLevel: 'full',
      displayMode: 'individual' // Show individual units for manufacturing
    },
    fields: {
      required: ['name', 'sku', 'category', 'quantity', 'pricePerUnit', 'batchId', 'productionDate'],
      optional: ['description', 'location', 'supplier', 'expiryDate', 'qualityGrade'],
      custom: [
        { name: 'lotNumber', type: 'text', label: 'Lot Number' },
        { name: 'qualityControl', type: 'select', label: 'QC Status', options: ['pending', 'passed', 'failed'] },
        { name: 'productionLine', type: 'text', label: 'Production Line' }
      ]
    },
    validation: {
      allowDuplicateNames: true,
      skuFormat: /^MFG-[A-Z0-9]{6}-[0-9]{4}$/, // Manufacturing format
      batchIdFormat: 'lot_based', // Based on lot numbers
      locationRequired: true
    }
  },

  // Enterprise Facility Configurations
  'enterprise-financial-hub': {
    id: 'enterprise-financial-hub',
    name: 'Enterprise Financial Hub',
    extends: 'default',
    features: {
      'financial-tracking': { enabled: true },
      'multi-currency-support': { enabled: true },
      'cost-analysis': { enabled: true },
      'smart-notifications': { enabled: true },
      'security-compliance': { enabled: true },
      'insurance-integration': { enabled: true },
      'audit-trails': { enabled: true }
    },
    productView: {
      primaryKey: 'name_sku',
      showBatchDetails: true,
      showPlacement: true,
      showDistribution: true,
      showAnalytics: true,
      showFinancialMetrics: true,
      allowBatchMerging: false,
      batchTrackingLevel: 'full',
      displayMode: 'grouped'
    },
    fields: {
      required: ['name', 'sku', 'category', 'quantity', 'pricePerUnit', 'acquisitionCost'],
      optional: ['description', 'location', 'supplier', 'expiryDate', 'insuranceValue', 'depreciationRate'],
      custom: [
        { name: 'acquisitionCost', type: 'currency', label: 'Acquisition Cost', required: true },
        { name: 'currentValue', type: 'currency', label: 'Current Market Value' },
        { name: 'insuranceValue', type: 'currency', label: 'Insurance Value' },
        { name: 'depreciationRate', type: 'percentage', label: 'Annual Depreciation Rate' },
        { name: 'riskLevel', type: 'select', label: 'Risk Level', options: ['low', 'medium', 'high', 'critical'] },
        { name: 'complianceStatus', type: 'select', label: 'Compliance Status', options: ['compliant', 'pending', 'non-compliant'] }
      ]
    },
    validation: {
      allowDuplicateNames: true,
      skuFormat: /^FIN-[A-Z0-9]{8}-[0-9]{4}$/, // Financial hub format
      batchIdFormat: 'uuid', // UUID-based for security
      locationRequired: true,
      financialValidation: true
    }
  },

  'enterprise-warehouse': {
    id: 'enterprise-warehouse',
    name: 'Enterprise Warehouse',
    extends: 'default',
    features: {
      'smart-notifications': { enabled: true },
      'audit-trails': { enabled: true },
      'security-compliance': { enabled: true }
    },
    validation: {
      skuFormat: /^WHS-[A-Z0-9]{6}-[0-9]{4}$/,
      locationRequired: true
    }
  },

  'enterprise-manufacturing': {
    id: 'enterprise-manufacturing',
    name: 'Enterprise Manufacturing',
    extends: 'default',
    features: {
      'smart-notifications': { enabled: true },
      'audit-trails': { enabled: true },
      'security-compliance': { enabled: true }
    },
    validation: {
      skuFormat: /^MFG-[A-Z0-9]{6}-[0-9]{4}$/,
      locationRequired: true
    }
  },

  'enterprise-retail': {
    id: 'enterprise-retail',
    name: 'Enterprise Retail',
    extends: 'default',
    features: {
      'smart-notifications': { enabled: true },
      'audit-trails': { enabled: true }
    },
    validation: {
      skuFormat: /^RTL-[A-Z0-9]{6}-[0-9]{4}$/
    }
  },

  'enterprise-cold-storage': {
    id: 'enterprise-cold-storage',
    name: 'Enterprise Cold Storage',
    extends: 'default',
    features: {
      'smart-notifications': { enabled: true },
      'audit-trails': { enabled: true },
      'security-compliance': { enabled: true }
    },
    validation: {
      skuFormat: /^COLD-[A-Z0-9]{6}-[0-9]{4}$/,
      locationRequired: true
    }
  },

  'enterprise-distribution': {
    id: 'enterprise-distribution',
    name: 'Enterprise Distribution',
    extends: 'default',
    features: {
      'smart-notifications': { enabled: true },
      'audit-trails': { enabled: true }
    },
    validation: {
      skuFormat: /^DIST-[A-Z0-9]{6}-[0-9]{4}$/,
      locationRequired: true
    }
  }
};

/**
 * Get configuration for a facility
 * @param {string} facilityId - The facility ID
 * @returns {object} The facility configuration
 */
const getFacilityConfiguration = (facilityId) => {
  const config = facilityConfigurations[facilityId] || facilityConfigurations.default;
  
  // If configuration extends another, merge them
  if (config.extends) {
    const baseConfig = facilityConfigurations[config.extends];
    return mergeConfigurations(baseConfig, config);
  }
  
  return config;
};

/**
 * Merge two configurations
 * @param {object} baseConfig - Base configuration
 * @param {object} extendingConfig - Configuration that extends the base
 * @returns {object} Merged configuration
 */
const mergeConfigurations = (baseConfig, extendingConfig) => {
  return {
    ...baseConfig,
    ...extendingConfig,
    productView: { ...baseConfig.productView, ...extendingConfig.productView },
    fields: {
      required: extendingConfig.fields?.required || baseConfig.fields.required,
      optional: extendingConfig.fields?.optional || baseConfig.fields.optional,
      custom: [...(baseConfig.fields.custom || []), ...(extendingConfig.fields?.custom || [])]
    },
    validation: { ...baseConfig.validation, ...extendingConfig.validation },
    inventory: { ...baseConfig.inventory, ...extendingConfig.inventory }
  };
};

/**
 * Get the primary key format for a facility
 * @param {string} facilityId - The facility ID
 * @returns {string} The primary key format
 */
const getPrimaryKeyFormat = (facilityId) => {
  const config = getFacilityConfiguration(facilityId);
  return config.productView.primaryKey;
};

/**
 * Generate a composite key based on facility configuration
 * @param {object} product - The product object
 * @param {string} facilityId - The facility ID
 * @returns {string} The composite key
 */
const generateCompositeKey = (product, facilityId) => {
  const config = getFacilityConfiguration(facilityId);
  const keyFormat = config.productView.primaryKey;
  
  switch (keyFormat) {
    case 'name_sku':
      return `${product.name}_${product.sku}`;
    case 'sku_only':
      return product.sku;
    case 'name_only':
      return product.name;
    case 'name_category_sku':
      return `${product.name}_${product.category}_${product.sku}`;
    default:
      return `${product.name}_${product.sku}`;
  }
};

/**
 * Validate product data based on facility configuration
 * @param {object} product - The product data to validate
 * @param {string} facilityId - The facility ID
 * @returns {object} Validation result { isValid: boolean, errors: string[] }
 */
const validateProductData = (product, facilityId) => {
  const config = getFacilityConfiguration(facilityId);
  const errors = [];
  
  // Check required fields
  config.fields.required.forEach(field => {
    if (field.includes('.')) {
      // Nested field check
      const fieldPath = field.split('.');
      let value = product;
      for (const path of fieldPath) {
        value = value?.[path];
      }
      if (!value) {
        errors.push(`${field} is required`);
      }
    } else {
      if (!product[field] && product[field] !== 0) {
        errors.push(`${field} is required`);
      }
    }
  });
  
  // Validate SKU format if specified
  if (config.validation.skuFormat && product.sku) {
    if (!config.validation.skuFormat.test(product.sku)) {
      errors.push(`SKU format is invalid for facility ${facilityId}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  facilityConfigurations,
  getFacilityConfiguration,
  getPrimaryKeyFormat,
  generateCompositeKey,
  validateProductData,
  mergeConfigurations
};
