import React, { useState, useEffect } from 'react';
import './FeatureMatrix.css';

const FeatureMatrix = () => {
  const [matrix, setMatrix] = useState({});

  // Define facility types
  const facilityTypes = [
    { type: 'warehouse', name: 'Warehouse' },
    { type: 'retail', name: 'Retail Store' },
    { type: 'distribution', name: 'Distribution Center' },
    { type: 'manufacturing', name: 'Manufacturing' },
    { type: 'hybrid', name: 'Hybrid' },
    { type: 'financial-hub', name: 'Financial Hub' },
    { type: 'enterprise-warehouse', name: 'Enterprise Warehouse' },
    { type: 'enterprise-retail', name: 'Enterprise Retail' }
  ];

  // Define all features with categories
  const allFeatures = [
    // Core Features
    { id: 'product-management', name: 'Product Management', category: 'Core' },
    { id: 'section-management', name: 'Section Management', category: 'Core' },
    { id: 'storage-designer', name: 'Storage Designer', category: 'Core' },
    { id: 'analytics-dashboard', name: 'Analytics Dashboard', category: 'Core' },
    { id: 'rule-engine', name: 'Rule Engine', category: 'Core' },
    { id: 'purchase-orders', name: 'Purchase Orders', category: 'Core' },
    { id: 'activity-log', name: 'Activity Log', category: 'Core' },
    
    // Business Features
    { id: 'expiry-management', name: 'Expiry Management', category: 'Business' },
    { id: 'temperature-monitoring', name: 'Temperature Monitoring', category: 'Business' },
    { id: 'inventory-alerts', name: 'Inventory Alerts', category: 'Business' },
    { id: 'batch-operations', name: 'Batch Operations', category: 'Business' },
    { id: 'barcode-scanning', name: 'Barcode Scanning', category: 'Business' },
    { id: 'feature-toggle-admin', name: 'Feature Toggle Admin', category: 'Business' },
    
    // Enterprise Features
    { id: 'smart-notifications', name: 'Smart Notifications', category: 'Enterprise' },
    { id: 'financial-tracking', name: 'Financial Tracking', category: 'Enterprise' },
    { id: 'audit-trails', name: 'Audit Trails', category: 'Enterprise' },
    { id: 'multi-currency-support', name: 'Multi-Currency Support', category: 'Enterprise' },
    { id: 'cost-analysis', name: 'Cost Analysis', category: 'Enterprise' },
    { id: 'security-compliance', name: 'Security & Compliance', category: 'Enterprise' },
    { id: 'insurance-integration', name: 'Insurance Integration', category: 'Enterprise' }
  ];

  // Feature availability matrix
  const getFeatureAvailability = (facilityType, featureId) => {
    const featureMatrix = {
      warehouse: {
        // Core Features
        'product-management': 'core',
        'section-management': 'core',
        'storage-designer': 'core',
        'analytics-dashboard': 'optional',
        'rule-engine': 'core',
        'purchase-orders': 'core',
        'activity-log': 'core',
        
        // Business Features
        'expiry-management': 'core',
        'temperature-monitoring': 'optional',
        'inventory-alerts': 'core',
        'batch-operations': 'core',
        'barcode-scanning': 'core',
        'feature-toggle-admin': 'core',
        
        // Enterprise Features
        'smart-notifications': 'optional',
        'financial-tracking': 'optional',
        'audit-trails': 'optional',
        'multi-currency-support': 'unavailable',
        'cost-analysis': 'optional',
        'security-compliance': 'optional',
        'insurance-integration': 'optional'
      },

      retail: {
        // Core Features
        'product-management': 'core',
        'section-management': 'core',
        'storage-designer': 'optional',
        'analytics-dashboard': 'core',
        'rule-engine': 'core',
        'purchase-orders': 'core',
        'activity-log': 'core',
        
        // Business Features
        'expiry-management': 'core',
        'temperature-monitoring': 'optional',
        'inventory-alerts': 'core',
        'batch-operations': 'optional',
        'barcode-scanning': 'core',
        'feature-toggle-admin': 'core',
        
        // Enterprise Features
        'smart-notifications': 'optional',
        'financial-tracking': 'core',
        'audit-trails': 'optional',
        'multi-currency-support': 'optional',
        'cost-analysis': 'core',
        'security-compliance': 'optional',
        'insurance-integration': 'optional'
      },

      distribution: {
        // Core Features
        'product-management': 'core',
        'section-management': 'core',
        'storage-designer': 'core',
        'analytics-dashboard': 'core',
        'rule-engine': 'core',
        'purchase-orders': 'core',
        'activity-log': 'core',
        
        // Business Features
        'expiry-management': 'unavailable',
        'temperature-monitoring': 'core',
        'inventory-alerts': 'core',
        'batch-operations': 'core',
        'barcode-scanning': 'core',
        'feature-toggle-admin': 'core',
        
        // Enterprise Features
        'smart-notifications': 'optional',
        'financial-tracking': 'optional',
        'audit-trails': 'optional',
        'multi-currency-support': 'unavailable',
        'cost-analysis': 'optional',
        'security-compliance': 'optional',
        'insurance-integration': 'unavailable'
      },

      manufacturing: {
        // Core Features
        'product-management': 'core',
        'section-management': 'core',
        'storage-designer': 'core',
        'analytics-dashboard': 'core',
        'rule-engine': 'core',
        'purchase-orders': 'core',
        'activity-log': 'core',
        
        // Business Features
        'expiry-management': 'core',
        'temperature-monitoring': 'optional',
        'inventory-alerts': 'core',
        'batch-operations': 'core',
        'barcode-scanning': 'core',
        'feature-toggle-admin': 'core',
        
        // Enterprise Features
        'smart-notifications': 'optional',
        'financial-tracking': 'optional',
        'audit-trails': 'core',
        'multi-currency-support': 'unavailable',
        'cost-analysis': 'core',
        'security-compliance': 'core',
        'insurance-integration': 'optional'
      },

      hybrid: {
        // Core Features - All available
        'product-management': 'core',
        'section-management': 'core',
        'storage-designer': 'core',
        'analytics-dashboard': 'core',
        'rule-engine': 'core',
        'purchase-orders': 'core',
        'activity-log': 'core',
        
        // Business Features
        'expiry-management': 'core',
        'temperature-monitoring': 'optional',
        'inventory-alerts': 'core',
        'batch-operations': 'core',
        'barcode-scanning': 'core',
        'feature-toggle-admin': 'core',
        
        // Enterprise Features
        'smart-notifications': 'optional',
        'financial-tracking': 'optional',
        'audit-trails': 'optional',
        'multi-currency-support': 'optional',
        'cost-analysis': 'optional',
        'security-compliance': 'optional',
        'insurance-integration': 'optional'
      },

      'financial-hub': {
        // Core Features
        'product-management': 'optional',
        'section-management': 'optional',
        'storage-designer': 'unavailable',
        'analytics-dashboard': 'core',
        'rule-engine': 'core',
        'purchase-orders': 'core',
        'activity-log': 'core',
        
        // Business Features
        'expiry-management': 'unavailable',
        'temperature-monitoring': 'unavailable',
        'inventory-alerts': 'core',
        'batch-operations': 'unavailable',
        'barcode-scanning': 'unavailable',
        'feature-toggle-admin': 'core',
        
        // Enterprise Features - All essential for financial operations
        'smart-notifications': 'core',
        'financial-tracking': 'core',
        'audit-trails': 'core',
        'multi-currency-support': 'core',
        'cost-analysis': 'core',
        'security-compliance': 'core',
        'insurance-integration': 'core'
      },

      'enterprise-warehouse': {
        // Core Features - All essential for large-scale operations
        'product-management': 'core',
        'section-management': 'core',
        'storage-designer': 'core',
        'analytics-dashboard': 'core',
        'rule-engine': 'core',
        'purchase-orders': 'core',
        'activity-log': 'core',
        
        // Business Features - Enhanced capabilities
        'expiry-management': 'optional',
        'temperature-monitoring': 'optional',
        'inventory-alerts': 'core',
        'batch-operations': 'core',
        'barcode-scanning': 'core',
        'feature-toggle-admin': 'core',
        
        // Enterprise Features - All available for enterprise
        'smart-notifications': 'core',
        'financial-tracking': 'optional',
        'audit-trails': 'core',
        'multi-currency-support': 'optional',
        'cost-analysis': 'optional',
        'security-compliance': 'core',
        'insurance-integration': 'optional'
      },

      'enterprise-retail': {
        // Core Features - All essential for large retail
        'product-management': 'core',
        'section-management': 'optional',
        'storage-designer': 'optional',
        'analytics-dashboard': 'core',
        'rule-engine': 'core',
        'purchase-orders': 'core',
        'activity-log': 'core',
        
        // Business Features - Enhanced retail capabilities
        'expiry-management': 'core',
        'temperature-monitoring': 'optional',
        'inventory-alerts': 'core',
        'batch-operations': 'optional',
        'barcode-scanning': 'core',
        'feature-toggle-admin': 'core',
        
        // Enterprise Features - All essential for enterprise retail
        'smart-notifications': 'core',
        'financial-tracking': 'core',
        'audit-trails': 'core',
        'multi-currency-support': 'core',
        'cost-analysis': 'core',
        'security-compliance': 'core',
        'insurance-integration': 'core'
      }
    };

    return featureMatrix[facilityType]?.[featureId] || 'unavailable';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'core': return '✅'; // Green check - always enabled, cannot be disabled
      case 'optional': return '🟡'; // Yellow - can be enabled/disabled
      case 'unavailable': return '❌'; // Red X - not available for this facility type
      default: return '❓';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'core': return 'Core Feature';
      case 'optional': return 'Optional';
      case 'unavailable': return 'Not Available';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'core': return '#28a745'; // Green
      case 'optional': return '#ffc107'; // Yellow
      case 'unavailable': return '#dc3545'; // Red
      default: return '#6c757d'; // Gray
    }
  };

  useEffect(() => {
    // Build the matrix
    const newMatrix = {};
    facilityTypes.forEach(facility => {
      newMatrix[facility.type] = {};
      allFeatures.forEach(feature => {
        newMatrix[facility.type][feature.id] = getFeatureAvailability(facility.type, feature.id);
      });
    });
    setMatrix(newMatrix);
  }, []);

  // Group features by category
  const featuresByCategory = allFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {});

  return (
    <div className="feature-matrix-container">
      <div className="feature-matrix-header">
        <h2>Feature Availability Matrix</h2>
        <p>This matrix shows which features are available for each facility type:</p>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-icon">✅</span>
            <span>Core Feature - Always enabled, cannot be disabled</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🟡</span>
            <span>Optional - Can be enabled/disabled</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">❌</span>
            <span>Not Available - Feature not supported for this facility type</span>
          </div>
        </div>
      </div>

      <div className="feature-matrix-wrapper">
        <table className="feature-matrix-table">
          <thead>
            <tr>
              <th className="feature-header">Feature</th>
              <th className="category-header">Category</th>
              {facilityTypes.map(facility => (
                <th key={facility.type} className="facility-header">
                  {facility.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(featuresByCategory).map(([category, features]) => (
              <React.Fragment key={category}>
                <tr className="category-separator">
                  <td colSpan={facilityTypes.length + 2} className="category-title">
                    {category} Features
                  </td>
                </tr>
                {features.map(feature => (
                  <tr key={feature.id} className="feature-row">
                    <td className="feature-name">{feature.name}</td>
                    <td className="feature-category">{feature.category}</td>
                    {facilityTypes.map(facility => {
                      const status = matrix[facility.type]?.[feature.id] || 'unavailable';
                      return (
                        <td
                          key={facility.type}
                          className={`status-cell status-${status}`}
                          style={{ color: getStatusColor(status) }}
                          title={`${feature.name} is ${getStatusText(status)} for ${facility.name}`}
                        >
                          <span className="status-icon">{getStatusIcon(status)}</span>
                          <span className="status-text">{getStatusText(status)}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="matrix-summary">
        <h3>Summary</h3>
        <div className="summary-stats">
          {facilityTypes.map(facility => {
            const facilityMatrix = matrix[facility.type] || {};
            const coreCount = Object.values(facilityMatrix).filter(status => status === 'core').length;
            const optionalCount = Object.values(facilityMatrix).filter(status => status === 'optional').length;
            const unavailableCount = Object.values(facilityMatrix).filter(status => status === 'unavailable').length;
            
            return (
              <div key={facility.type} className="facility-summary">
                <h4>{facility.name}</h4>
                <div className="summary-counts">
                  <span className="core-count">✅ Core: {coreCount}</span>
                  <span className="optional-count">🟡 Optional: {optionalCount}</span>
                  <span className="unavailable-count">❌ Unavailable: {unavailableCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeatureMatrix;
