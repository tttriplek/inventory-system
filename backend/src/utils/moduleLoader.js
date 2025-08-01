const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Professional Module Loader
 * 
 * Dynamically loads and registers feature modules based on
 * facility configuration. This enables the facility-first
 * architecture where features are loaded on demand.
 */
class ModuleLoader {
  
  static loadModules(app) {
    try {
      const modulesPath = path.join(__dirname, '../modules');
      
      if (!fs.existsSync(modulesPath)) {
        logger.warn('Modules directory not found, skipping module loading');
        return;
      }

      const modules = fs.readdirSync(modulesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      logger.info(`🔧 Loading ${modules.length} modules...`);

      modules.forEach(moduleName => {
        try {
          this.loadModule(app, moduleName);
        } catch (error) {
          logger.error(`Failed to load module '${moduleName}':`, error);
        }
      });

      logger.info('✅ Module loading completed');

    } catch (error) {
      logger.error('❌ Module loader failed:', error);
    }
  }

  static loadModule(app, moduleName) {
    const modulePath = path.join(__dirname, '../modules', moduleName);
    const routesFile = path.join(modulePath, `${moduleName}Routes.js`);
    const indexFile = path.join(modulePath, 'index.js');

    // Try to load routes file first, then index file
    let routeFile = null;
    
    if (fs.existsSync(routesFile)) {
      routeFile = routesFile;
    } else if (fs.existsSync(indexFile)) {
      routeFile = indexFile;
    }

    if (!routeFile) {
      logger.warn(`No routes file found for module '${moduleName}'`);
      return;
    }

    try {
      const moduleRoutes = require(routeFile);
      
      // Register the routes with facility-aware middleware
      app.use(`/api/${moduleName}`, this.createFacilityMiddleware(moduleName), moduleRoutes);
      
      logger.info(`📦 Module '${moduleName}' loaded successfully`);
      
    } catch (error) {
      logger.error(`Failed to load routes for module '${moduleName}':`, error);
      throw error;
    }
  }

  /**
   * Create middleware that checks if the feature is enabled for the facility
   */
  static createFacilityMiddleware(moduleName) {
    return async (req, res, next) => {
      try {
        // Skip facility check for health/status endpoints
        if (req.path.includes('/health') || req.path.includes('/status')) {
          return next();
        }

        const facilityId = req.facilityId;
        
        // If no facility ID provided, allow request (for setup scenarios)
        if (!facilityId) {
          logger.warn(`No facility ID provided for ${moduleName} request`);
          return next();
        }

        // Check if the feature is enabled for this facility
        const isEnabled = await this.isFeatureEnabledForFacility(facilityId, moduleName);
        
        if (!isEnabled) {
          return res.status(403).json({
            success: false,
            message: `Feature '${moduleName}' is not enabled for this facility`,
            code: 'FEATURE_DISABLED',
            facilityId
          });
        }

        // Log feature usage
        logger.logFeatureUsage(facilityId, moduleName, true, req.user?.id);
        
        next();
        
      } catch (error) {
        logger.error(`Facility middleware error for ${moduleName}:`, error);
        next(error);
      }
    };
  }

  /**
   * Check if a feature is enabled for a specific facility
   */
  static async isFeatureEnabledForFacility(facilityId, featureName) {
    try {
      const FacilityService = require('../core/facility/FacilityService');
      
      // Map module names to feature paths
      const featureMap = {
        'products': 'productManagement.enabled',
        'inventory': 'inventory.enabled', 
        'expiry': 'expiryTracking.enabled',
        'temperature': 'temperatureMonitoring.enabled',
        'sections': 'sectionManagement.enabled',
        'analytics': 'analytics.enabled',
        'storage': 'storageDesigner.enabled',
        // Enterprise features
        'notifications': 'smart-notifications.enabled',
        'financial': 'financial-tracking.enabled', 
        'audit': 'audit-trails.enabled'
      };

      const featurePath = featureMap[featureName];
      if (!featurePath) {
        logger.warn(`No feature mapping found for module '${featureName}'`);
        return true; // Allow access if no mapping found
      }

      console.log(`[DEBUG] Checking feature: ${featureName} -> ${featurePath} for facility: ${facilityId}`);
      const result = await FacilityService.isFeatureEnabled(facilityId, featurePath);
      console.log(`[DEBUG] Feature check result: ${result}`);

      return result;
      
    } catch (error) {
      logger.error(`Error checking feature status for ${featureName}:`, error);
      return false; // Deny access on error
    }
  }

  /**
   * Get all available modules
   */
  static getAvailableModules() {
    try {
      const modulesPath = path.join(__dirname, '../modules');
      
      if (!fs.existsSync(modulesPath)) {
        return [];
      }

      return fs.readdirSync(modulesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
          name: dirent.name,
          path: path.join(modulesPath, dirent.name),
          hasRoutes: fs.existsSync(path.join(modulesPath, dirent.name, `${dirent.name}Routes.js`)) ||
                     fs.existsSync(path.join(modulesPath, dirent.name, 'index.js'))
        }));
        
    } catch (error) {
      logger.error('Failed to get available modules:', error);
      return [];
    }
  }

  /**
   * Reload modules (useful for development)
   */
  static reloadModules(app) {
    logger.info('🔄 Reloading modules...');
    
    // Clear require cache for modules
    const modulesPath = path.join(__dirname, '../modules');
    Object.keys(require.cache).forEach(key => {
      if (key.includes(modulesPath)) {
        delete require.cache[key];
      }
    });

    // Reload all modules
    this.loadModules(app);
  }
}

module.exports = ModuleLoader;
