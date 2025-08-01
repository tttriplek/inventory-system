/**
 * Revolutionary Inventory System - Feature Checker Middleware
 * Middleware functions for checking feature availability
 */

const FeatureManager = require('./FeatureManager');

/**
 * Middleware to check if a feature is enabled for the current facility
 * @param {string} featureKey - The feature key to check
 * @returns {Function} Express middleware function
 */
function checkFeature(featureKey) {
    return async (req, res, next) => {
        try {
            // Extract facility ID from various possible sources
            const facilityId = req.params.facilityId || 
                              req.body.facilityId || 
                              req.query.facilityId ||
                              req.headers['x-facility-id'];

            // If no facility ID provided, allow request (for setup scenarios)
            if (!facilityId) {
                console.warn(`No facility ID provided for ${featureKey} request`);
                return next();
            }

            // Initialize feature manager
            const featureManager = new FeatureManager();
            
            // Check if the feature is enabled for this facility
            const isEnabled = await featureManager.isFeatureEnabled(facilityId, featureKey);
            
            if (!isEnabled) {
                return res.status(403).json({
                    success: false,
                    message: `Feature '${featureKey}' is not enabled for this facility`,
                    code: 'FEATURE_DISABLED',
                    facilityId,
                    feature: featureKey
                });
            }

            // Feature is enabled, continue to the route handler
            next();
            
        } catch (error) {
            console.error(`Feature check error for ${featureKey}:`, error);
            
            // In case of error, allow the request to proceed (fail open)
            // You might want to change this behavior for production
            next();
        }
    };
}

/**
 * Check if multiple features are enabled
 * @param {string[]} featureKeys - Array of feature keys to check
 * @returns {Function} Express middleware function
 */
function checkFeatures(featureKeys) {
    return async (req, res, next) => {
        try {
            const facilityId = req.params.facilityId || 
                              req.body.facilityId || 
                              req.query.facilityId ||
                              req.headers['x-facility-id'];

            if (!facilityId) {
                console.warn(`No facility ID provided for features check: ${featureKeys.join(', ')}`);
                return next();
            }

            const featureManager = new FeatureManager();
            
            // Check all features
            const enabledFeatures = [];
            const disabledFeatures = [];
            
            for (const featureKey of featureKeys) {
                const isEnabled = await featureManager.isFeatureEnabled(facilityId, featureKey);
                if (isEnabled) {
                    enabledFeatures.push(featureKey);
                } else {
                    disabledFeatures.push(featureKey);
                }
            }

            // If any required features are disabled, block the request
            if (disabledFeatures.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: `Required features are not enabled: ${disabledFeatures.join(', ')}`,
                    code: 'FEATURES_DISABLED',
                    facilityId,
                    enabledFeatures,
                    disabledFeatures
                });
            }

            // All features are enabled
            next();
            
        } catch (error) {
            console.error(`Features check error for ${featureKeys.join(', ')}:`, error);
            next();
        }
    };
}

/**
 * Optional feature check - doesn't block if feature is disabled
 * @param {string} featureKey - The feature key to check
 * @returns {Function} Express middleware function
 */
function optionalFeature(featureKey) {
    return async (req, res, next) => {
        try {
            const facilityId = req.params.facilityId || 
                              req.body.facilityId || 
                              req.query.facilityId ||
                              req.headers['x-facility-id'];

            if (facilityId) {
                const featureManager = new FeatureManager();
                const isEnabled = await featureManager.isFeatureEnabled(facilityId, featureKey);
                
                // Add feature status to request for route handler to use
                req.featureEnabled = isEnabled;
                req.featureKey = featureKey;
            } else {
                req.featureEnabled = false;
                req.featureKey = featureKey;
            }

            next();
            
        } catch (error) {
            console.error(`Optional feature check error for ${featureKey}:`, error);
            req.featureEnabled = false;
            req.featureKey = featureKey;
            next();
        }
    };
}

module.exports = {
    checkFeature,
    checkFeatures,
    optionalFeature
};
