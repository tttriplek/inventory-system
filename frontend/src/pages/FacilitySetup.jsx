import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFacilityConfig, getFacilityConfig } from '../api/facilityConfigApi';

const FacilitySetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    facilityType: '',
    name: '',
    features: {},
    defaultSettings: {},
    terminology: {}
  });
  
  // Define features for each facility type
  const facilityFeatures = {
    warehouse: {
      core: [
        { id: 'batchTracking', label: 'Batch Tracking', description: 'Track products by batch number' },
        { id: 'locationTracking', label: 'Location Tracking', description: 'Track precise product locations' },
        { id: 'zoneManagement', label: 'Zone Management', description: 'Manage storage zones' }
      ],
      optional: [
        { id: 'temperatureMonitoring', label: 'Temperature Monitoring', description: 'Monitor storage temperatures' },
        { id: 'crossDocking', label: 'Cross Docking', description: 'Direct transfer between receiving and shipping' }
      ]
    },
    retail_store: {
      core: [
        { id: 'pointOfSale', label: 'Point of Sale', description: 'Process customer transactions' },
        { id: 'b2cSales', label: 'B2C Sales', description: 'Direct to consumer sales' },
        { id: 'returnProcessing', label: 'Return Processing', description: 'Handle customer returns' }
      ],
      optional: [
        { id: 'batchTracking', label: 'Batch Tracking', description: 'Track products by batch number' },
        { id: 'expiryDateTracking', label: 'Expiry Tracking', description: 'Track product expiration dates' }
      ]
    },
    distribution_center: {
      core: [
        { id: 'batchTracking', label: 'Batch Tracking', description: 'Track products by batch number' },
        { id: 'crossDocking', label: 'Cross Docking', description: 'Direct transfer between receiving and shipping' },
        { id: 'canInitiateTransfers', label: 'Transfer Management', description: 'Manage product transfers' }
      ],
      optional: [
        { id: 'temperatureMonitoring', label: 'Temperature Monitoring', description: 'Monitor storage temperatures' },
        { id: 'qualityControl', label: 'Quality Control', description: 'Product quality inspection' }
      ]
    },
    supermarket: {
      core: [
        { id: 'pointOfSale', label: 'Point of Sale', description: 'Process customer transactions' },
        { id: 'expiryDateTracking', label: 'Expiry Tracking', description: 'Track product expiration dates' },
        { id: 'returnProcessing', label: 'Return Processing', description: 'Handle customer returns' }
      ],
      optional: [
        { id: 'temperatureMonitoring', label: 'Temperature Monitoring', description: 'Monitor storage temperatures' },
        { id: 'batchTracking', label: 'Batch Tracking', description: 'Track products by batch number' }
      ]
    },
    mini_market: {
      core: [
        { id: 'pointOfSale', label: 'Point of Sale', description: 'Process customer transactions' },
        { id: 'b2cSales', label: 'B2C Sales', description: 'Direct to consumer sales' }
      ],
      optional: [
        { id: 'expiryDateTracking', label: 'Expiry Tracking', description: 'Track product expiration dates' },
        { id: 'returnProcessing', label: 'Return Processing', description: 'Handle customer returns' }
      ]
    },
    dark_store: {
      core: [
        { id: 'b2cSales', label: 'B2C Sales', description: 'Direct to consumer sales' },
        { id: 'locationTracking', label: 'Location Tracking', description: 'Track precise product locations' },
        { id: 'zoneManagement', label: 'Zone Management', description: 'Manage storage zones' }
      ],
      optional: [
        { id: 'batchTracking', label: 'Batch Tracking', description: 'Track products by batch number' },
        { id: 'temperatureMonitoring', label: 'Temperature Monitoring', description: 'Monitor storage temperatures' }
      ]
    }
  };

  const facilityTypes = [
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'distribution_center', label: 'Distribution Center' },
    { value: 'retail_store', label: 'Retail Store' },
    { value: 'supermarket', label: 'Supermarket' },
    { value: 'mini_market', label: 'Mini Market' },
    { value: 'dark_store', label: 'Dark Store' }
  ];

  useEffect(() => {
    // Skip the check and just set loading to false
    setLoading(false);
  }, []);

  // Update features when facility type changes
  useEffect(() => {
    if (form.facilityType && facilityFeatures[form.facilityType]) {
      const coreFeatures = {};
      facilityFeatures[form.facilityType].core.forEach(feature => {
        coreFeatures[feature.id] = true;
      });
      setForm(prev => ({
        ...prev,
        features: coreFeatures
      }));
    }
  }, [form.facilityType]);

  const handleFeatureToggle = (featureId, isCore = false) => {
    // Don't allow toggling core features off
    if (isCore && form.features[featureId]) {
      return;
    }
    
    setForm(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureId]: !prev.features[featureId]
      }
    }));
  };

  const validateFeatures = () => {
    // Check if all core features are enabled
    const coreFeatures = facilityFeatures[form.facilityType].core;
    const missingCore = coreFeatures.filter(feature => !form.features[feature.id]);
    
    if (missingCore.length > 0) {
      return `Core features are required: ${missingCore.map(f => f.label).join(', ')}`;
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateFeatures();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      const config = {
        facilityType: form.facilityType,
        name: form.name,
        features: form.features,
        // Add default settings based on facility type
        defaultSettings: {
          lowStockThreshold: form.facilityType === 'warehouse' ? 50 : 5,
          orderLeadTime: form.facilityType === 'warehouse' ? 14 : 7,
          batchSize: form.facilityType === 'warehouse' ? 100 : 10,
          autoReorder: false
        },
        // Add terminology based on facility type
        terminology: {
          stockUnit: form.facilityType === 'warehouse' ? 'pallet' : 'item',
          storage: form.facilityType === 'warehouse' ? 'bay' : 'shelf',
          transfer: form.facilityType === 'warehouse' ? 'shipment' : 'transfer'
        }
      };

      await createFacilityConfig(config);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating facility:', error);
      alert(`Failed to create facility configuration: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <h1>Facility Setup</h1>
      <p>Welcome to the inventory system! Let's set up your facility.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Facility Name:
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Facility Type:
            <select
              value={form.facilityType}
              onChange={(e) => setForm({ ...form, facilityType: e.target.value })}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">Select a facility type</option>
              {facilityTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {form.facilityType && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h3>Core Features</h3>
              <p style={{ color: '#666', marginBottom: '10px' }}>These features are essential for your facility type:</p>
              <div style={{ display: 'grid', gap: '10px' }}>
                {facilityFeatures[form.facilityType].core.map(feature => (
                  <div key={feature.id} style={{ 
                    padding: '10px', 
                    border: '1px solid #00796b',
                    borderRadius: '4px',
                    background: '#e0f2f1'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={form.features[feature.id] ?? true}
                        onChange={() => handleFeatureToggle(feature.id, true)}
                        disabled={form.features[feature.id] ?? true}
                        style={{ marginRight: '10px', cursor: 'not-allowed' }}
                      />
                      <div>
                        <strong>{feature.label}</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '0.9em', color: '#666' }}>
                          {feature.description}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3>Optional Features</h3>
              <p style={{ color: '#666', marginBottom: '10px' }}>Additional features that may be useful:</p>
              <div style={{ display: 'grid', gap: '10px' }}>
                {facilityFeatures[form.facilityType].optional.map(feature => (
                  <div key={feature.id} style={{ 
                    padding: '10px', 
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#f5f5f5'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={form.features[feature.id] ?? false}
                        onChange={() => handleFeatureToggle(feature.id)}
                        style={{ marginRight: '10px' }}
                      />
                      <div>
                        <strong>{feature.label}</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '0.9em', color: '#666' }}>
                          {feature.description}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          style={{
            background: '#00796b',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Create Facility
        </button>
      </form>
    </div>
  );
};

export default FacilitySetup;
