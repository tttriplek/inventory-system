const Facility = require('./Facility');
const logger = require('../../utils/logger');

/**
 * Professional Facility Service
 * 
 * Handles all business logic for facility management including
 * feature control, setup workflows, and configuration management.
 */
class FacilityService {
  
  /**
   * Create a new facility with intelligent defaults
   */
  static async createFacility(facilityData, userId) {
    try {
      // Set intelligent defaults based on facility type
      const defaultFeatures = this.getDefaultFeaturesByType(facilityData.type);
      
      const facility = new Facility({
        ...facilityData,
        features: { ...defaultFeatures, ...facilityData.features },
        createdBy: userId,
        updatedBy: userId
      });

      await facility.save();
      
      logger.info(`Facility created: ${facility.name} (${facility.code})`);
      return facility;
      
    } catch (error) {
      logger.error('Facility creation failed:', error);
      throw error;
    }
  }

  /**
   * Get facility configuration with feature flags
   */
  static async getFacilityConfig(facilityId) {
    try {
      const facility = await Facility.findById(facilityId);
      if (!facility) {
        throw new Error('Facility not found');
      }

      return {
        id: facility._id,
        name: facility.name,
        code: facility.code,
        type: facility.type,
        features: facility.features,
        businessRules: facility.businessRules,
        setupProgress: facility.updateSetupProgress(),
        enabledFeatures: facility.getEnabledFeatures()
      };
      
    } catch (error) {
      logger.error('Failed to get facility config:', error);
      throw error;
    }
  }

  /**
   * Update facility features (with validation)
   */
  static async updateFeatures(facilityId, featureUpdates, userId) {
    try {
      const facility = await Facility.findById(facilityId);
      if (!facility) {
        throw new Error('Facility not found');
      }

      // Validate feature dependencies
      this.validateFeatureDependencies(featureUpdates);

      // Deep merge feature updates
      facility.features = this.deepMerge(facility.features, featureUpdates);
      facility.updatedBy = userId;

      await facility.save();
      
      logger.info(`Facility features updated: ${facility.code}`);
      return facility;
      
    } catch (error) {
      logger.error('Failed to update facility features:', error);
      throw error;
    }
  }

  /**
   * Check if a specific feature is enabled for a facility
   */
  static async isFeatureEnabled(facilityId, featurePath) {
    try {
      const facility = await Facility.findById(facilityId);
      return facility ? facility.isFeatureEnabled(featurePath) : false;
    } catch (error) {
      logger.error('Failed to check feature status:', error);
      return false;
    }
  }

  /**
   * Get all facilities with a specific feature enabled
   */
  static async getFacilitiesWithFeature(featurePath) {
    try {
      return await Facility.getActiveWithFeature(featurePath);
    } catch (error) {
      logger.error('Failed to get facilities with feature:', error);
      return [];
    }
  }

  /**
   * Complete facility setup step
   */
  static async completeSetupStep(facilityId, stepName, userId) {
    try {
      const facility = await Facility.findById(facilityId);
      if (!facility) {
        throw new Error('Facility not found');
      }

      if (!facility.setupSteps.hasOwnProperty(stepName)) {
        throw new Error(`Invalid setup step: ${stepName}`);
      }

      facility.setupSteps[stepName] = true;
      facility.updatedBy = userId;
      
      const progress = facility.updateSetupProgress();
      await facility.save();

      logger.info(`Setup step completed: ${stepName} for facility ${facility.code}`);
      
      return {
        facility,
        progress,
        nextStep: this.getNextSetupStep(facility.setupSteps)
      };
      
    } catch (error) {
      logger.error('Failed to complete setup step:', error);
      throw error;
    }
  }

  /**
   * Get facility dashboard metrics
   */
  static async getFacilityMetrics(facilityId) {
    try {
      const facility = await Facility.findById(facilityId);
      if (!facility) {
        throw new Error('Facility not found');
      }

      // This will integrate with other modules later
      return {
        facility: {
          name: facility.name,
          code: facility.code,
          status: facility.status
        },
        features: {
          total: this.countTotalFeatures(facility.features),
          enabled: facility.getEnabledFeatures().length
        },
        setup: facility.updateSetupProgress(),
        lastUpdated: facility.updatedAt
      };
      
    } catch (error) {
      logger.error('Failed to get facility metrics:', error);
      throw error;
    }
  }

  // 🛠️ PRIVATE HELPER METHODS

  static getDefaultFeaturesByType(type) {
    const defaults = {
      warehouse: {
        productManagement: { enabled: true, batchTracking: true, skuGeneration: true },
        inventory: { enabled: true, realTimeTracking: true, lowStockAlerts: true },
        sectionManagement: { enabled: true, maxSections: 100 },
        distribution: { enabled: true, fifoEnforcement: true },
        analytics: { enabled: true, realTimeMetrics: true }
      },
      retail: {
        productManagement: { enabled: true, categoryManagement: true },
        inventory: { enabled: true, lowStockAlerts: true, stockThreshold: 5 },
        expiryTracking: { enabled: true, alertDays: 7 },
        analytics: { enabled: true, customDashboards: true }
      },
      distribution: {
        productManagement: { enabled: true, batchTracking: true },
        inventory: { enabled: true, realTimeTracking: true },
        distribution: { enabled: true, fifoEnforcement: true, trackDestinations: true },
        temperatureMonitoring: { enabled: true },
        analytics: { enabled: true, predictiveAnalytics: true }
      }
    };

    return defaults[type] || defaults.warehouse;
  }

  static validateFeatureDependencies(features) {
    // Example: Expiry tracking requires product management
    if (features.expiryTracking?.enabled && !features.productManagement?.enabled) {
      throw new Error('Expiry tracking requires product management to be enabled');
    }

    // Temperature monitoring requires inventory
    if (features.temperatureMonitoring?.enabled && !features.inventory?.enabled) {
      throw new Error('Temperature monitoring requires inventory to be enabled');
    }
  }

  static deepMerge(target, source) {
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }

  static getNextSetupStep(setupSteps) {
    const stepOrder = ['basicInfo', 'features', 'sections', 'users', 'testing'];
    return stepOrder.find(step => !setupSteps[step]) || null;
  }

  static countTotalFeatures(features, count = 0) {
    Object.values(features).forEach(value => {
      if (typeof value === 'boolean') {
        count++;
      } else if (typeof value === 'object' && value !== null) {
        count = this.countTotalFeatures(value, count);
      }
    });
    return count;
  }
}

module.exports = FacilityService;
