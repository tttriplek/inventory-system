/**
 * Revolutionary Inventory System - Feature Toggle Context
 * 
 * React context for managing feature toggles throughout the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const FeatureContext = createContext();

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

export const FeatureProvider = ({ children, facilityId = null }) => {
  const [features, setFeatures] = useState({});
  const [toggles, setToggles] = useState({});
  const [definitions, setDefinitions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch feature configuration
  const fetchFeatures = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch feature definitions first
      const definitionsResponse = await fetch('http://localhost:5000/api/features/definitions');
      if (!definitionsResponse.ok) {
        throw new Error(`Failed to fetch definitions: ${definitionsResponse.status}`);
      }
      const definitionsData = await definitionsResponse.json();
      
      // Fetch current toggles
      const endpoint = facilityId 
        ? `/api/features/facility/${facilityId}/toggles`
        : '/api/features/global/toggles';

      const response = await fetch(`http://localhost:5000${endpoint}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch toggles: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If facility-specific, also fetch enterprise features
      let enterpriseFeatures = {};
      if (facilityId) {
        try {
          const enterpriseResponse = await fetch(
            `http://localhost:5000/api/features/facility/${facilityId}/enterprise`,
            {
              headers: {
                'X-Facility-Code': facilityId
              }
            }
          );
          if (enterpriseResponse.ok) {
            const enterpriseData = await enterpriseResponse.json();
            enterpriseFeatures = enterpriseData.enterpriseFeatures || {};
          }
        } catch (enterpriseError) {
          console.warn('Failed to fetch enterprise features:', enterpriseError);
        }
      }
      
      if (data.success && definitionsData.success) {
        // Create definitions lookup by kebab-case ID
        const definitionsLookup = {};
        definitionsData.features.forEach(feature => {
          definitionsLookup[feature.id] = feature;
        });
        setDefinitions(definitionsLookup);
        
        // Extract config data
        const configData = data.config || {};
        
        // Merge regular features with enterprise features
        const allFeatures = { ...configData, ...enterpriseFeatures };
        
        // Create simple features object (kebab-case keys, boolean values)
        setFeatures(allFeatures);
        
        // Create toggles object with definitions for admin UI
        const togglesWithDefinitions = {};
        Object.keys(allFeatures).forEach(featureId => {
          const definition = definitionsLookup[featureId] || {
            id: featureId,
            name: featureId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: 'Feature description not available',
            category: 'core',
            dependencies: []
          };
          
          // Check if this is a core feature that can't be disabled in facility mode
          const isCoreFeature = facilityId && ['product-management', 'storage-designer'].includes(featureId);
          
          togglesWithDefinitions[featureId] = {
            enabled: configData[featureId],
            definition: definition,
            canToggle: !isCoreFeature // Core features can't be toggled off in facility mode
          };
        });
        
        setToggles(togglesWithDefinitions);
      } else {
        throw new Error('Failed to fetch features data');
      }
    } catch (err) {
      console.error('Error fetching features:', err);
      setError(err.message);
      
      // Simple fallback configuration
      const fallbackFeatures = {
        'product-management': true,
        'storage-designer': true,
        'analytics-dashboard': true,
        'temperature-monitoring': false,
        'quality-control': false,
        'purchase-orders': true,
        'activity-log': true,
        // Enterprise features fallback
        'smart-notifications': false,
        'financial-tracking': false,
        'multi-currency-support': false,
        'cost-analysis': false,
        'security-compliance': false,
        'insurance-integration': false,
        'audit-trails': false
      };
      setFeatures(fallbackFeatures);
      setToggles({});
    } finally {
      setLoading(false);
    }
  };

  // Check if a feature is enabled
  const isFeatureEnabled = (featureId) => {
    // Support both kebab-case and camelCase lookups
    if (features[featureId] !== undefined) {
      return Boolean(features[featureId]);
    }
    
    // Try converting camelCase to kebab-case
    const kebabCase = featureId.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (features[kebabCase] !== undefined) {
      return Boolean(features[kebabCase]);
    }
    
    return false;
  };

  // Check if a feature is enabled (with object structure support)
  const hasFeature = (featureId) => {
    return isFeatureEnabled(featureId);
  };

  // Toggle a feature (for admin UI)
  const toggleFeature = async (featureId, enabled, options = {}) => {
    try {
      const endpoint = facilityId 
        ? `/api/features/facility/${facilityId}/toggles/${featureId}`
        : `/api/features/global/toggles/${featureId}`;
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled,
          ...options
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh features after toggle
        await fetchFeatures();
        return data;
      } else {
        throw new Error(data.error || 'Failed to toggle feature');
      }
    } catch (err) {
      console.error('Error toggling feature:', err);
      throw err;
    }
  };

  // Bulk update features
  const bulkUpdateFeatures = async (updates, options = {}) => {
    try {
      const endpoint = facilityId 
        ? `/api/features/facility/${facilityId}/toggles`
        : '/api/features/global/toggles';
        
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          features: updates,
          ...options
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchFeatures();
        return data;
      } else {
        throw new Error(data.error || 'Failed to bulk update features');
      }
    } catch (err) {
      console.error('Error bulk updating features:', err);
      throw err;
    }
  };

  // Get feature definition
  const getFeatureDefinition = (featureId) => {
    return toggles[featureId]?.definition || null;
  };

  // Get features by category
  const getFeaturesByCategory = () => {
    const categories = {};
    
    Object.keys(toggles).forEach(featureId => {
      const toggle = toggles[featureId];
      const category = toggle.definition?.category || 'other';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push({
        id: featureId,
        ...toggle
      });
    });
    
    return categories;
  };

  // Check if component should be rendered
  const shouldRenderComponent = (featureId, componentName = null) => {
    if (!isFeatureEnabled(featureId)) {
      return false;
    }
    
    // Additional component-level checks can be added here
    const definition = getFeatureDefinition(featureId);
    if (componentName && definition?.components) {
      return definition.components.includes(componentName);
    }
    
    return true;
  };

  // Feature-gated wrapper component
  const FeatureGate = ({ feature, component, children, fallback = null }) => {
    const enabled = shouldRenderComponent(feature, component);
    return enabled ? children : fallback;
  };

  useEffect(() => {
    fetchFeatures();
  }, [facilityId]);

  const value = {
    // State
    features,
    toggles,
    definitions,
    loading,
    error,
    facilityId,
    
    // Methods
    isFeatureEnabled,
    hasFeature,
    toggleFeature,
    bulkUpdateFeatures,
    getFeatureDefinition,
    getFeaturesByCategory,
    shouldRenderComponent,
    fetchFeatures,
    
    // Components
    FeatureGate
  };

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
};

// Higher-order component for feature gating
export const withFeatureGate = (featureId, componentName = null) => {
  return (WrappedComponent) => {
    return (props) => {
      const { shouldRenderComponent } = useFeatures();
      
      if (!shouldRenderComponent(featureId, componentName)) {
        return null;
      }
      
      return <WrappedComponent {...props} />;
    };
  };
};

// Hook for conditional feature rendering
export const useFeatureGate = (featureId, componentName = null) => {
  const { shouldRenderComponent } = useFeatures();
  return shouldRenderComponent(featureId, componentName);
};

export default FeatureContext;
