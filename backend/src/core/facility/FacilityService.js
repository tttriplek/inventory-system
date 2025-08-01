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
   * Check if a specific feature is enabled by facility key (new approach)
   */
  static async isFeatureEnabledByKey(facilityKey, featurePath) {
    try {
      // For standard facility types, find any facility with that key
      // For custom facilities, find the specific facility
      const facility = await Facility.findOne({ facilityKey });
      return facility ? facility.isFeatureEnabled(featurePath) : false;
    } catch (error) {
      logger.error('Failed to check feature status by key:', error);
      return false;
    }
  }

  /**
   * Get facility by key (could be standard type or custom)
   */
  static async getFacilityByKey(facilityKey) {
    try {
      return await Facility.findOne({ facilityKey });
    } catch (error) {
      logger.error('Failed to find facility by key:', error);
      return null;
    }
  }

  /**
   * Create shared feature configuration for standard facility types
   */
  static async createOrUpdateStandardFacilityFeatures(facilityType, features) {
    try {
      const facilityKey = `facility_${facilityType}`;
      
      // Find or create a representative facility for this type
      let facility = await Facility.findOne({ facilityKey });
      
      if (!facility) {
        // Create a template facility for this type
        facility = new Facility({
          name: `${facilityType.charAt(0).toUpperCase() + facilityType.slice(1)} Template`,
          code: `${facilityType.toUpperCase()}TMPL`,
          type: facilityType,
          facilityKey,
          isCustomFacility: false,
          features: { ...this.getDefaultFeaturesByType(facilityType), ...features },
          location: {
            address: 'Template Location',
            city: 'Template City',
            country: 'Template Country'
          }
        });
        
        await facility.save();
        logger.info(`Created standard facility template: ${facilityType}`);
      } else {
        // Update existing template
        facility.features = this.deepMerge(facility.features, features);
        await facility.save();
        logger.info(`Updated standard facility template: ${facilityType}`);
      }
      
      return facility;
    } catch (error) {
      logger.error('Failed to create/update standard facility features:', error);
      throw error;
    }
  }

  /**
   * Check if a specific feature is enabled for a facility (flat key)
   */
  static async isFeatureEnabledFlat(facilityId, featureKey) {
    try {
      const facility = await Facility.findById(facilityId);
      if (!facility) {
        console.log(`[DEBUG] Facility not found: ${facilityId}`);
        return false;
      }
      
      console.log(`[DEBUG] Checking feature '${featureKey}' in facility features:`, facility.features);
      const result = facility.features[featureKey] === true;
      console.log(`[DEBUG] Feature check result: ${result}`);
      return result;
    } catch (error) {
      logger.error('Failed to check flat feature status:', error);
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
        // Core warehouse features
        productManagement: { enabled: true, batchTracking: true, skuGeneration: true, categoryManagement: true },
        inventory: { enabled: true, realTimeTracking: true, lowStockAlerts: false, stockThreshold: 100 }, // Warehouses don't need low stock alerts
        sectionManagement: { enabled: true, maxSections: 200 },
        distribution: { enabled: true, fifoEnforcement: true, trackDestinations: true },
        analytics: { enabled: true, realTimeMetrics: true, historicalReports: true },
        storageDesigner: { enabled: true, layoutDesign: true, utilizationTracking: true },
        // Warehouse-specific features
        temperatureMonitoring: { enabled: true, alertSystem: true },
        expiryTracking: { enabled: false }, // Warehouses typically don't need expiry tracking
        qualityControl: { enabled: true, inspectionRequired: true },
        advanced: { barcodeScanning: true, rfidTracking: true }
      },
      
      retail: {
        // Core retail features
        productManagement: { enabled: true, categoryManagement: true, skuGeneration: true },
        inventory: { enabled: true, lowStockAlerts: true, stockThreshold: 5, automaticReordering: true }, // Critical for retail
        expiryTracking: { enabled: true, alertDays: 7, autoRemoval: false }, // Essential for retail
        analytics: { enabled: true, customDashboards: true, predictiveAnalytics: true },
        sectionManagement: { enabled: true, maxSections: 50 },
        storageDesigner: { enabled: true, layoutDesign: true },
        // Retail doesn't need heavy distribution features
        distribution: { enabled: false },
        temperatureMonitoring: { enabled: false }, // Usually not needed in retail
        qualityControl: { enabled: false },
        advanced: { barcodeScanning: true }
      },
      
      distribution: {
        // Core distribution features  
        productManagement: { enabled: true, batchTracking: true },
        inventory: { enabled: true, realTimeTracking: true, lowStockAlerts: false }, // Distribution doesn't hold stock long
        distribution: { enabled: true, fifoEnforcement: true, trackDestinations: true, requireApproval: true },
        temperatureMonitoring: { enabled: true, alertSystem: true }, // Important for cold chain
        analytics: { enabled: true, predictiveAnalytics: true, realTimeMetrics: true },
        sectionManagement: { enabled: true, maxSections: 100 },
        storageDesigner: { enabled: true, spaceOptimization: true },
        // Distribution centers don't need retail features
        expiryTracking: { enabled: false }, // Items move too quickly
        qualityControl: { enabled: true, inspectionRequired: true },
        advanced: { rfidTracking: true, iotIntegration: true }
      },
      
      manufacturing: {
        // Core manufacturing features
        productManagement: { enabled: true, batchTracking: true, skuGeneration: true },
        inventory: { enabled: true, realTimeTracking: true, lowStockAlerts: true, stockThreshold: 20 }, // Raw materials
        qualityControl: { enabled: true, inspectionRequired: true, qualityScoring: true, defectTracking: true },
        temperatureMonitoring: { enabled: true, criticalThresholds: { min: -10, max: 35 } },
        analytics: { enabled: true, realTimeMetrics: true, historicalReports: true },
        sectionManagement: { enabled: true, maxSections: 150 },
        storageDesigner: { enabled: true, layoutDesign: true },
        expiryTracking: { enabled: true, alertDays: 14 }, // Raw materials can expire
        distribution: { enabled: true, fifoEnforcement: true },
        advanced: { iotIntegration: true, aiPredictions: true }
      },
      
      hybrid: {
        // Combination of warehouse + retail features
        productManagement: { enabled: true, batchTracking: true, skuGeneration: true, categoryManagement: true },
        inventory: { enabled: true, realTimeTracking: true, lowStockAlerts: true, stockThreshold: 10 },
        expiryTracking: { enabled: true, alertDays: 14 },
        distribution: { enabled: true, fifoEnforcement: true, trackDestinations: true },
        temperatureMonitoring: { enabled: true },
        analytics: { enabled: true, realTimeMetrics: true, customDashboards: true },
        sectionManagement: { enabled: true, maxSections: 100 },
        storageDesigner: { enabled: true, layoutDesign: true, utilizationTracking: true },
        qualityControl: { enabled: true },
        advanced: { barcodeScanning: true, rfidTracking: true }
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
