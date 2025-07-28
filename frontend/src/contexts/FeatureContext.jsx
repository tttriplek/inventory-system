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

      // Fetch feature definitions
      const definitionsResponse = await fetch('http://localhost:5000/api/features/definitions');
      if (!definitionsResponse.ok) {
        throw new Error(`HTTP error! status: ${definitionsResponse.status}`);
      }
      const definitionsData = await definitionsResponse.json();
      
      // Fetch current toggles
      const endpoint = facilityId 
        ? `/api/features/facility/${facilityId}/toggles`
        : '/api/features/global/toggles';

      const response = await fetch(`http://localhost:5000${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && definitionsData.success) {
        // Create definitions lookup
        const definitionsLookup = {};
        definitionsData.features.forEach(feature => {
          definitionsLookup[feature.id] = feature;
        });
        setDefinitions(definitionsLookup);
        
        // Create toggles with definitions and metadata
        const togglesWithDefinitions = {};
        Object.keys(data.config).forEach(featureId => {
          const definition = definitionsLookup[featureId] || {
            id: featureId,
            name: featureId,
            description: 'No description available',
            category: 'core',
            dependencies: [],
            components: [],
            icon: '⚙️' // Default icon
          };
          
          togglesWithDefinitions[featureId] = {
            enabled: data.config[featureId],
            definition: definition,
            dependents: [], // Calculate dependents
            missingDependencies: [], // Calculate missing dependencies
            canToggle: true // Default to true, can be updated based on dependencies
          };
        });
        
        // Calculate dependents for each feature
        Object.keys(togglesWithDefinitions).forEach(featureId => {
          const toggle = togglesWithDefinitions[featureId];
          const definition = toggle.definition;
          
          // Find features that depend on this one
          toggle.dependents = Object.keys(togglesWithDefinitions).filter(otherId => {
            const otherDefinition = togglesWithDefinitions[otherId].definition;
            return otherDefinition.dependencies && otherDefinition.dependencies.includes(featureId);
          });
          
          // Calculate missing dependencies
          if (definition.dependencies) {
            toggle.missingDependencies = definition.dependencies.filter(depId => {
              const depToggle = togglesWithDefinitions[depId];
              return !depToggle || !depToggle.enabled;
            });
          }
          
          // Can't toggle off if other features depend on it
          toggle.canToggle = toggle.dependents.length === 0 || !toggle.enabled;
        });
        
        setToggles(togglesWithDefinitions);
        
        // Convert config to simple enabled/disabled map
        const featureMap = {};
        Object.keys(data.config).forEach(featureId => {
          featureMap[featureId] = data.config[featureId];
        });
        setFeatures(featureMap);
      } else {
        throw new Error(data.error || 'Failed to fetch features');
      }
    } catch (err) {
      console.error('Error fetching features:', err);
      setError(err.message);
      
      // Fallback to all features enabled for development
      console.warn('Using fallback feature configuration - all enabled');
      const fallbackFeatures = {
        productManagement: true,
        batchManagement: true,
        storageDesigner: true,
        sectionManagement: true,
        analytics: true,
        temperatureMonitoring: false,
        qualityControl: false,
        distributionManagement: true,
        inventoryTracking: true,
        purchaseOrders: true,
        activityLogging: true
      };
      setFeatures(fallbackFeatures);
    } finally {
      setLoading(false);
    }
  };

  // Check if a feature is enabled
  const isFeatureEnabled = (featureId) => {
    return Boolean(features[featureId]);
  };

  // Check if a feature is enabled (with object structure support)
  const hasFeature = (featureId) => {
    const feature = features[featureId];
    
    // Handle both boolean and object structures
    if (typeof feature === 'boolean') {
      return feature;
    }
    
    if (typeof feature === 'object' && feature !== null) {
      return Boolean(feature.enabled);
    }
    
    return false;
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
