import React, { createContext, useContext, useState, useEffect } from 'react';

const FacilityContext = createContext();

export const useFacility = () => {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error('useFacility must be used within a FacilityProvider');
  }
  return context;
};

export const FacilityProvider = ({ children }) => {
  const [currentFacility, setCurrentFacility] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load saved facility from localStorage on mount
  useEffect(() => {
    const savedFacilityId = localStorage.getItem('selectedFacilityId');
    if (savedFacilityId) {
      fetchFacilities().then(() => {
        // The facility will be set in the facilities effect
      });
    } else {
      fetchFacilities();
    }
  }, []);

  // Set the current facility when facilities are loaded
  useEffect(() => {
    if (facilities.length > 0 && !currentFacility) {
      const savedFacilityId = localStorage.getItem('selectedFacilityId');
      let facilityToSelect = null;

      if (savedFacilityId) {
        facilityToSelect = facilities.find(f => f._id === savedFacilityId);
      }

      // If no saved facility or saved facility not found, select the first one
      if (!facilityToSelect) {
        facilityToSelect = facilities[0];
      }

      if (facilityToSelect) {
        setCurrentFacility(facilityToSelect);
        localStorage.setItem('selectedFacilityId', facilityToSelect._id);
      }
    }
  }, [facilities, currentFacility]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/facilities');
      if (!response.ok) {
        throw new Error('Failed to fetch facilities');
      }
      const data = await response.json();
      // Handle both response formats: {facilities: [...]} or {data: [...]} or direct array
      const facilitiesArray = data.facilities || data.data || data;
      setFacilities(Array.isArray(facilitiesArray) ? facilitiesArray : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeFacility = (facility) => {
    setCurrentFacility(facility);
    localStorage.setItem('selectedFacilityId', facility._id);
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('facilityChanged', {
      detail: { facility }
    }));
  };

  const refreshFacilities = () => {
    fetchFacilities();
  };

  const value = {
    currentFacility,
    facilities,
    loading,
    error,
    changeFacility,
    refreshFacilities,
    
    // Helper functions
    getCurrentFacilityId: () => currentFacility?._id,
    getCurrentFacilityCode: () => currentFacility?.code,
    getCurrentFacilityType: () => currentFacility?.type,
    getCurrentFacilityFeatures: () => currentFacility?.features || {},
    
    // Feature checking helpers
    hasFeature: (featureName) => {
      if (!currentFacility?.features) return false;
      return currentFacility.features[featureName] === true;
    },
    
    // Quick feature checks
    hasAnalytics: () => currentFacility?.features?.analytics === true,
    hasInventory: () => currentFacility?.features?.inventory === true,
    hasSections: () => currentFacility?.features?.sections === true,
    hasExpiry: () => currentFacility?.features?.expiry === true,
    hasTemperature: () => currentFacility?.features?.temperature === true,
  };

  return (
    <FacilityContext.Provider value={value}>
      {children}
    </FacilityContext.Provider>
  );
};

export default FacilityContext;
