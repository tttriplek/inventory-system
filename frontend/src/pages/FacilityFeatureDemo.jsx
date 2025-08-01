import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import FeatureToggleAdmin from '../components/FeatureToggleAdmin';
import FacilitySwitcher from '../components/FacilitySwitcher';

const FacilityFeatureDemo = () => {
  const { currentFacility, changeFacility } = useFacility();
  const [lastFacilityChange, setLastFacilityChange] = useState(null);

  // Track facility changes
  useEffect(() => {
    if (currentFacility) {
      setLastFacilityChange(new Date().toLocaleTimeString());
    }
  }, [currentFacility]);

  const getFacilityIcon = (type) => {
    const icons = {
      'warehouse': '🏭',
      'retail': '🏪',
      'distribution': '📦',
      'manufacturing': '🏗️',
      'hybrid': '🔄',
      'financial-hub': '💰',
      'enterprise-warehouse': '🏛️',
      'enterprise-retail': '🛍️'
    };
    return icons[type] || '🏢';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Demo Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔗 Facility-Feature Integration Demo
          </h1>
          <p className="text-gray-600 mb-4">
            Use the facility switcher below to see how features automatically adjust based on the selected facility type.
          </p>
          
          {/* Current Facility Status */}
          {currentFacility && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getFacilityIcon(currentFacility.type)}</span>
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Current Facility: {currentFacility.name}
                  </h3>
                  <p className="text-blue-700">
                    Type: {currentFacility.type} | Code: {currentFacility.code}
                  </p>
                  {lastFacilityChange && (
                    <p className="text-sm text-blue-600">
                      Last switched: {lastFacilityChange}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Facility Switcher Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🏢 Facility Switcher
          </h2>
          <p className="text-gray-600 mb-4">
            Select a different facility to see how the feature toggles below automatically adjust:
          </p>
          
          <div className="max-w-md">
            <FacilitySwitcher 
              currentFacilityId={currentFacility?._id}
              onFacilityChange={changeFacility}
            />
          </div>

          {/* Feature Matrix Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Feature Types:</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Core Features (always enabled)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span>Optional Features (can be toggled)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>Unavailable Features (hidden/disabled)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Toggle Admin */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              ⚙️ Feature Toggle Administration
            </h2>
            <p className="text-gray-600 mt-1">
              Features are automatically adjusted when you switch facilities above.
            </p>
          </div>
          
          <div className="p-6">
            <FeatureToggleAdmin 
              mode="facility" 
              facilityId={currentFacility?._id} 
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">
            🧪 How to Test the Integration:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-800">
            <li>Switch between different facility types using the facility switcher above</li>
            <li>Watch how the feature list changes - core features are enabled, unavailable ones are hidden</li>
            <li>Try different facility types (warehouse, retail, financial-hub) to see different feature sets</li>
            <li>Notice the automatic adjustments logged in the browser console</li>
            <li>Core features cannot be disabled (buttons are locked)</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default FacilityFeatureDemo;
