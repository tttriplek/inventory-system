import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';

const TemperatureMonitor = () => {
  const { currentFacility, hasFeature } = useFacility();
  const [temperatureData, setTemperatureData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasFeature('temperature')) {
      setLoading(false);
      return;
    }
    
    // Mock temperature data for demonstration
    const mockData = [
      {
        id: 1,
        zone: 'Cold Storage A',
        current: -18.5,
        target: -18,
        min: -20,
        max: -16,
        status: 'normal',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 2,
        zone: 'Freezer Section B',
        current: -15.2,
        target: -18,
        min: -20,
        max: -16,
        status: 'warning',
        lastUpdate: new Date(Date.now() - 5 * 60000).toISOString()
      },
      {
        id: 3,
        zone: 'Refrigerated Area C',
        current: 4.1,
        target: 4,
        min: 2,
        max: 6,
        status: 'normal',
        lastUpdate: new Date(Date.now() - 2 * 60000).toISOString()
      }
    ];

    const mockAlerts = [
      {
        id: 1,
        zone: 'Freezer Section B',
        message: 'Temperature above target range',
        severity: 'warning',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString()
      }
    ];

    setTimeout(() => {
      setTemperatureData(mockData);
      setAlerts(mockAlerts);
      setLoading(false);
    }, 1000);
  }, [hasFeature]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return '#28a745';
      case 'warning': return '#ffc107';
      case 'critical': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  if (!hasFeature('temperature')) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Temperature Monitor</h2>
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌡️</div>
          <h3>Temperature Monitoring Not Available</h3>
          <p>This facility ({currentFacility?.name}) does not have temperature monitoring enabled.</p>
          <p>Contact your administrator to enable this feature.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Temperature Monitor</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px' }}>⏳ Loading temperature data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>Temperature Monitor</h2>
        <div style={{
          background: '#e3f2fd',
          padding: '8px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#1976d2'
        }}>
          📍 {currentFacility?.name}
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#dc3545', marginBottom: '16px' }}>
            🚨 Active Alerts ({alerts.length})
          </h3>
          {alerts.map(alert => (
            <div key={alert.id} style={{
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>{alert.zone}</strong>: {alert.message}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Temperature Zones Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {temperatureData.map(zone => (
          <div key={zone.id} style={{
            background: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: 0, color: '#212529' }}>{zone.zone}</h4>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: getStatusColor(zone.status) + '20',
                padding: '4px 8px',
                borderRadius: '6px',
                color: getStatusColor(zone.status),
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {getStatusIcon(zone.status)} {zone.status.toUpperCase()}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: getStatusColor(zone.status),
                textAlign: 'center',
                marginBottom: '8px'
              }}>
                {zone.current}°C
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#6c757d'
              }}>
                Target: {zone.target}°C
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#6c757d',
              marginBottom: '12px'
            }}>
              <span>Min: {zone.min}°C</span>
              <span>Max: {zone.max}°C</span>
            </div>

            <div style={{
              height: '4px',
              background: '#e9ecef',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                height: '100%',
                background: getStatusColor(zone.status),
                width: `${Math.max(0, Math.min(100, ((zone.current - zone.min) / (zone.max - zone.min)) * 100))}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>

            <div style={{
              fontSize: '11px',
              color: '#6c757d',
              textAlign: 'right'
            }}>
              Last update: {new Date(zone.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div style={{
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
            {temperatureData.filter(z => z.status === 'normal').length}
          </div>
          <div style={{ fontSize: '14px', color: '#155724' }}>Normal Zones</div>
        </div>

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
            {temperatureData.filter(z => z.status === 'warning').length}
          </div>
          <div style={{ fontSize: '14px', color: '#856404' }}>Warning Zones</div>
        </div>

        <div style={{
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
            {temperatureData.filter(z => z.status === 'critical').length}
          </div>
          <div style={{ fontSize: '14px', color: '#721c24' }}>Critical Zones</div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureMonitor;
