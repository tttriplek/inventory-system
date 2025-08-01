const { featureDefinitions } = require('./feature-definitions');

class FeatureManager {
  constructor() {
    this.globalConfig = new Map();
    this.facilityConfigs = new Map();
    this.initializeDefaults();
  }

  initializeDefaults() {
    // Initialize global configuration with default values
    Object.keys(featureDefinitions).forEach(featureId => {
      const feature = featureDefinitions[featureId];
      this.globalConfig.set(featureId, feature.defaultEnabled);
    });
  }

  // Global feature management
  setGlobalFeature(featureId, enabled) {
    if (!featureDefinitions[featureId]) {
      throw new Error(`Unknown feature: ${featureId}`);
    }
    
    this.globalConfig.set(featureId, enabled);
    return this.validateAndFixDependencies('global');
  }

  getGlobalFeature(featureId) {
    return this.globalConfig.get(featureId) || false;
  }

  getGlobalConfig() {
    const config = {};
    this.globalConfig.forEach((enabled, featureId) => {
      config[featureId] = enabled;
    });
    return config;
  }

  // Facility-specific feature management
  setFacilityFeature(facilityId, featureId, enabled) {
    if (!featureDefinitions[featureId]) {
      throw new Error(`Unknown feature: ${featureId}`);
    }

    if (!this.facilityConfigs.has(facilityId)) {
      this.facilityConfigs.set(facilityId, new Map());
    }

    this.facilityConfigs.get(facilityId).set(featureId, enabled);
    return this.validateAndFixDependencies(facilityId);
  }

  getFacilityFeature(facilityId, featureId) {
    const facilityConfig = this.facilityConfigs.get(facilityId);
    if (facilityConfig && facilityConfig.has(featureId)) {
      return facilityConfig.get(featureId);
    }
    // Fall back to global configuration
    return this.getGlobalFeature(featureId);
  }

  getFacilityConfig(facilityId) {
    const config = {};
    
    // Start with global config
    this.globalConfig.forEach((enabled, featureId) => {
      config[featureId] = enabled;
    });

    // Override with facility-specific config
    const facilityConfig = this.facilityConfigs.get(facilityId);
    if (facilityConfig) {
      facilityConfig.forEach((enabled, featureId) => {
        config[featureId] = enabled;
      });
    }

    return config;
  }

  // Bulk operations
  setMultipleFeatures(facilityId, features) {
    const results = [];
    const errors = [];

    Object.entries(features).forEach(([featureId, enabled]) => {
      try {
        if (facilityId === 'global') {
          this.setGlobalFeature(featureId, enabled);
        } else {
          this.setFacilityFeature(facilityId, featureId, enabled);
        }
        results.push({ featureId, enabled, success: true });
      } catch (error) {
        errors.push({ featureId, error: error.message });
        results.push({ featureId, enabled, success: false, error: error.message });
      }
    });

    return { results, errors };
  }

  // Dependency validation and auto-fix
  validateAndFixDependencies(facilityId) {
    const config = facilityId === 'global' ? 
      this.getGlobalConfig() : 
      this.getFacilityConfig(facilityId);

    const enabledFeatures = Object.keys(config).filter(id => config[id]);
    const changes = [];

    // Check each enabled feature's dependencies
    enabledFeatures.forEach(featureId => {
      const feature = featureDefinitions[featureId];
      if (feature && feature.dependencies) {
        feature.dependencies.forEach(dependencyId => {
          if (!config[dependencyId]) {
            // Auto-enable dependency
            if (facilityId === 'global') {
              this.globalConfig.set(dependencyId, true);
            } else {
              if (!this.facilityConfigs.has(facilityId)) {
                this.facilityConfigs.set(facilityId, new Map());
              }
              this.facilityConfigs.get(facilityId).set(dependencyId, true);
            }
            changes.push({
              type: 'dependency_enabled',
              featureId: dependencyId,
              reason: `Required by ${featureId}`
            });
          }
        });
      }
    });

    return changes;
  }

  // Feature analysis
  getFeatureAnalysis(facilityId) {
    const config = facilityId === 'global' ? 
      this.getGlobalConfig() : 
      this.getFacilityConfig(facilityId);

    const analysis = {
      totalFeatures: Object.keys(featureDefinitions).length,
      enabledFeatures: Object.keys(config).filter(id => config[id]).length,
      disabledFeatures: Object.keys(config).filter(id => !config[id]).length,
      byCategory: {},
      dependencyIssues: []
    };

    // Analyze by category
    Object.values(featureDefinitions).forEach(feature => {
      if (!analysis.byCategory[feature.category]) {
        analysis.byCategory[feature.category] = {
          total: 0,
          enabled: 0,
          disabled: 0
        };
      }
      
      analysis.byCategory[feature.category].total++;
      if (config[feature.id]) {
        analysis.byCategory[feature.category].enabled++;
      } else {
        analysis.byCategory[feature.category].disabled++;
      }
    });

    // Check for dependency issues
    Object.keys(config).forEach(featureId => {
      if (config[featureId]) {
        const feature = featureDefinitions[featureId];
        if (feature && feature.dependencies) {
          feature.dependencies.forEach(depId => {
            if (!config[depId]) {
              analysis.dependencyIssues.push({
                feature: featureId,
                missingDependency: depId
              });
            }
          });
        }
      }
    });

    return analysis;
  }

  // Reset configurations
  resetToDefaults(facilityId) {
    if (facilityId === 'global') {
      this.initializeDefaults();
    } else {
      this.facilityConfigs.delete(facilityId);
    }
  }

  // Export/Import configurations
  exportConfig(facilityId) {
    return {
      facilityId,
      timestamp: new Date().toISOString(),
      config: facilityId === 'global' ? 
        this.getGlobalConfig() : 
        this.getFacilityConfig(facilityId)
    };
  }

  importConfig(facilityId, configData) {
    const results = this.setMultipleFeatures(facilityId, configData.config);
    return results;
  }
}

// Singleton instance
const featureManager = new FeatureManager();

module.exports = featureManager;
