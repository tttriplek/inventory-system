/**
 * Revolutionary Inventory System - Feature Manager
 * 
 * Central service for managing feature toggles at system and facility levels
 */

const { FEATURE_DEFINITIONS, FEATURE_CATEGORIES, resolveDependencies, validateFeatureConfig } = require('../config/feature-definitions');

class FeatureManager {
  constructor() {
    this.globalConfig = this.getDefaultGlobalConfig();
    this.facilityConfigs = new Map();
  }

  /**
   * Get default global configuration - all features enabled by default
   */
  getDefaultGlobalConfig() {
    const config = {};
    Object.keys(FEATURE_DEFINITIONS).forEach(featureId => {
      config[featureId] = FEATURE_DEFINITIONS[featureId].defaultEnabled;
    });
    return config;
  }

  /**
   * Get default facility configuration inheriting from global
   */
  getDefaultFacilityConfig(globalOverrides = {}) {
    const config = { ...this.globalConfig, ...globalOverrides };
    
    // Only include facility-level features
    const facilityConfig = {};
    Object.keys(config).forEach(featureId => {
      if (FEATURE_DEFINITIONS[featureId]?.facilityLevel) {
        facilityConfig[featureId] = config[featureId];
      }
    });
    
    return facilityConfig;
  }

  /**
   * Set global feature configuration
   */
  setGlobalConfig(config) {
    const validation = validateFeatureConfig(config);
    if (validation.errors.length > 0) {
      throw new Error(`Invalid global config: ${validation.errors.join(', ')}`);
    }
    
    this.globalConfig = { ...this.globalConfig, ...config };
    
    // Update all facility configs to inherit changes
    this.facilityConfigs.forEach((facilityConfig, facilityId) => {
      this.updateFacilityInheritance(facilityId);
    });

    return {
      success: true,
      warnings: validation.warnings,
      updatedFeatures: Object.keys(config)
    };
  }

  /**
   * Set facility-specific feature configuration
   */
  setFacilityConfig(facilityId, config) {
    // Merge with inherited global config
    const inheritedConfig = this.getEffectiveFacilityConfig(facilityId);
    const newConfig = { ...inheritedConfig, ...config };
    
    const validation = validateFeatureConfig(newConfig);
    if (validation.errors.length > 0) {
      throw new Error(`Invalid facility config: ${validation.errors.join(', ')}`);
    }
    
    this.facilityConfigs.set(facilityId, newConfig);
    
    return {
      success: true,
      warnings: validation.warnings,
      updatedFeatures: Object.keys(config)
    };
  }

  /**
   * Get effective configuration for a facility (global + facility overrides)
   */
  getEffectiveFacilityConfig(facilityId) {
    const facilityConfig = this.facilityConfigs.get(facilityId) || {};
    const effectiveConfig = {};
    
    // Start with global config for system-level features
    Object.keys(FEATURE_DEFINITIONS).forEach(featureId => {
      const feature = FEATURE_DEFINITIONS[featureId];
      
      if (feature.systemLevel && !feature.facilityLevel) {
        // System-only feature - use global setting
        effectiveConfig[featureId] = this.globalConfig[featureId];
      } else if (feature.facilityLevel) {
        // Facility-level feature - use facility override or global default
        effectiveConfig[featureId] = facilityConfig.hasOwnProperty(featureId) 
          ? facilityConfig[featureId] 
          : this.globalConfig[featureId];
      }
    });
    
    return effectiveConfig;
  }

  /**
   * Check if a feature is enabled for a facility
   */
  isFeatureEnabled(featureId, facilityId = null) {
    if (!FEATURE_DEFINITIONS[featureId]) {
      console.warn(`Unknown feature: ${featureId}`);
      return false;
    }
    
    if (facilityId) {
      const config = this.getEffectiveFacilityConfig(facilityId);
      return Boolean(config[featureId]);
    } else {
      return Boolean(this.globalConfig[featureId]);
    }
  }

  /**
   * Enable a feature and its dependencies
   */
  enableFeature(featureId, facilityId = null, options = {}) {
    const { autoEnableDependencies = true, force = false } = options;
    
    if (!FEATURE_DEFINITIONS[featureId]) {
      throw new Error(`Unknown feature: ${featureId}`);
    }
    
    const updates = {};
    
    if (autoEnableDependencies) {
      // Enable all dependencies
      const requiredFeatures = resolveDependencies(featureId);
      requiredFeatures.forEach(reqFeatureId => {
        updates[reqFeatureId] = true;
      });
    } else {
      updates[featureId] = true;
    }
    
    if (facilityId) {
      return this.setFacilityConfig(facilityId, updates);
    } else {
      return this.setGlobalConfig(updates);
    }
  }

  /**
   * Disable a feature and warn about dependents
   */
  disableFeature(featureId, facilityId = null, options = {}) {
    const { force = false } = options;
    
    if (!FEATURE_DEFINITIONS[featureId]) {
      throw new Error(`Unknown feature: ${featureId}`);
    }
    
    // Find features that depend on this one
    const dependents = this.findDependentFeatures(featureId, facilityId);
    
    if (dependents.length > 0 && !force) {
      return {
        success: false,
        error: `Cannot disable '${FEATURE_DEFINITIONS[featureId].name}' - required by: ${dependents.map(d => FEATURE_DEFINITIONS[d].name).join(', ')}`,
        dependents
      };
    }
    
    const updates = { [featureId]: false };
    
    if (facilityId) {
      return this.setFacilityConfig(facilityId, updates);
    } else {
      return this.setGlobalConfig(updates);
    }
  }

  /**
   * Find features that depend on the given feature
   */
  findDependentFeatures(featureId, facilityId = null) {
    const config = facilityId ? this.getEffectiveFacilityConfig(facilityId) : this.globalConfig;
    const dependents = [];
    
    Object.keys(config).forEach(otherFeatureId => {
      if (config[otherFeatureId] && FEATURE_DEFINITIONS[otherFeatureId]) {
        const deps = FEATURE_DEFINITIONS[otherFeatureId].dependencies;
        if (deps.includes(featureId)) {
          dependents.push(otherFeatureId);
        }
      }
    });
    
    return dependents;
  }

  /**
   * Get feature toggle status for UI components
   */
  getFeatureToggles(facilityId = null) {
    const config = facilityId ? this.getEffectiveFacilityConfig(facilityId) : this.globalConfig;
    const toggles = {};
    
    Object.keys(FEATURE_DEFINITIONS).forEach(featureId => {
      const feature = FEATURE_DEFINITIONS[featureId];
      toggles[featureId] = {
        enabled: Boolean(config[featureId]),
        definition: feature,
        canToggle: facilityId ? feature.facilityLevel : feature.systemLevel,
        dependents: this.findDependentFeatures(featureId, facilityId),
        missingDependencies: feature.dependencies.filter(dep => !config[dep])
      };
    });
    
    return toggles;
  }

  /**
   * Update facility inheritance when global config changes
   */
  updateFacilityInheritance(facilityId) {
    const facilityConfig = this.facilityConfigs.get(facilityId) || {};
    const newConfig = {};
    
    // Re-apply facility overrides on top of new global config
    Object.keys(FEATURE_DEFINITIONS).forEach(featureId => {
      const feature = FEATURE_DEFINITIONS[featureId];
      
      if (feature.facilityLevel) {
        newConfig[featureId] = facilityConfig.hasOwnProperty(featureId)
          ? facilityConfig[featureId]
          : this.globalConfig[featureId];
      }
    });
    
    this.facilityConfigs.set(facilityId, newConfig);
  }

  /**
   * Export configuration for persistence
   */
  exportConfig() {
    return {
      global: this.globalConfig,
      facilities: Object.fromEntries(this.facilityConfigs)
    };
  }

  /**
   * Import configuration from persistence
   */
  importConfig(configData) {
    if (configData.global) {
      this.globalConfig = configData.global;
    }
    
    if (configData.facilities) {
      this.facilityConfigs = new Map(Object.entries(configData.facilities));
    }
  }

  /**
   * Get comprehensive feature analysis
   */
  getFeatureAnalysis(facilityId = null) {
    const config = facilityId ? this.getEffectiveFacilityConfig(facilityId) : this.globalConfig;
    const enabled = Object.keys(config).filter(f => config[f]);
    const disabled = Object.keys(config).filter(f => !config[f]);
    
    // Group by category
    const byCategory = {};
    Object.values(FEATURE_CATEGORIES).forEach(cat => {
      byCategory[cat.name] = {
        total: 0,
        enabled: 0,
        features: []
      };
    });
    
    Object.keys(FEATURE_DEFINITIONS).forEach(featureId => {
      const feature = FEATURE_DEFINITIONS[featureId];
      const category = FEATURE_CATEGORIES[feature.category];
      if (category) {
        byCategory[category.name].total++;
        byCategory[category.name].features.push({
          id: featureId,
          name: feature.name,
          enabled: Boolean(config[featureId])
        });
        if (config[featureId]) {
          byCategory[category.name].enabled++;
        }
      }
    });
    
    return {
      summary: {
        total: Object.keys(FEATURE_DEFINITIONS).length,
        enabled: enabled.length,
        disabled: disabled.length,
        enabledPercentage: Math.round((enabled.length / Object.keys(FEATURE_DEFINITIONS).length) * 100)
      },
      byCategory,
      enabled,
      disabled
    };
  }
}

// Singleton instance
const featureManager = new FeatureManager();

module.exports = {
  FeatureManager,
  featureManager,
  FEATURE_DEFINITIONS,
  FEATURE_CATEGORIES
};
