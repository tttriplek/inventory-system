import React, { useState, useEffect } from 'react';
import './FacilitySwitcher.css';

const FacilitySwitcher = ({ currentFacilityId, onFacilityChange }) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  console.log('FacilitySwitcher render:', { 
    currentFacilityId, 
    facilitiesCount: facilities.length, 
    loading, 
    error 
  });

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/facilities');
      if (!response.ok) {
        throw new Error('Failed to fetch facilities');
      }
      const data = await response.json();
      // Handle both response formats: {facilities: [...]} or direct array
      const facilitiesArray = data.facilities || data.data || data;
      setFacilities(Array.isArray(facilitiesArray) ? facilitiesArray : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFacilitySelect = (facility) => {
    onFacilityChange(facility);
    setIsOpen(false);
  };

  const currentFacility = facilities.find(f => f._id === currentFacilityId);

  const getFacilityIcon = (type) => {
    switch (type) {
      case 'retail':
        return '🏪';
      case 'warehouse':
        return '🏭';
      case 'distribution':
        return '📦';
      default:
        return '🏢';
    }
  };

  const getFacilityFeatures = (facility) => {
    if (!facility.features) return [];
    return Object.entries(facility.features)
      .filter(([key, value]) => value && key !== 'products')
      .map(([key]) => key);
  };

  if (loading) {
    return (
      <div className="facility-switcher loading">
        <div className="current-facility">
          <span className="loading-spinner">⏳</span>
          Loading facilities...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="facility-switcher error">
        <div className="current-facility error">
          <span className="error-icon">❌</span>
          Error loading facilities
        </div>
      </div>
    );
  }

  return (
    <div className={`facility-switcher ${isOpen ? 'open' : ''}`}>
      <div 
        className="current-facility"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to switch facilities"
      >
        <div className="facility-info">
          <span className="facility-icon">
            {currentFacility ? getFacilityIcon(currentFacility.type) : '🏢'}
          </span>
          <div className="facility-details">
            <div className="facility-name">
              {currentFacility ? currentFacility.name : 'Select Facility'}
            </div>
            <div className="facility-code">
              {currentFacility ? currentFacility.code : 'No facility selected'}
            </div>
          </div>
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'up' : 'down'}`}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div className="facility-dropdown">
          <div className="facility-list">
            {facilities.map((facility) => (
              <div
                key={facility._id}
                className={`facility-option ${facility._id === currentFacilityId ? 'active' : ''}`}
                onClick={() => handleFacilitySelect(facility)}
              >
                <div className="facility-header">
                  <span className="facility-icon">
                    {getFacilityIcon(facility.type)}
                  </span>
                  <div className="facility-info">
                    <div className="facility-name">{facility.name}</div>
                    <div className="facility-meta">
                      <span className="facility-code">{facility.code}</span>
                      <span className="facility-type">{facility.type}</span>
                    </div>
                  </div>
                  {facility._id === currentFacilityId && (
                    <span className="current-indicator">✓</span>
                  )}
                </div>
                
                {facility.features && (
                  <div className="facility-features">
                    {getFacilityFeatures(facility).map((feature) => (
                      <span key={feature} className={`feature-tag ${feature}`}>
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                  </div>
                )}
                
                {facility.location && (
                  <div className="facility-location">
                    📍 {facility.location.address || 'Location not specified'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitySwitcher;
