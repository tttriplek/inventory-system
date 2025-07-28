import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useFacility } from '../contexts/FacilityContext';

function ExpiringProducts() {
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(3); // Default to 3 months
  const { hasFeature } = useFacility();
  
  // Ensure facility has expiry tracking enabled
  const showExpiryTracking = hasFeature('expiryDateTracking');
  console.log('Expiry tracking enabled:', showExpiryTracking);

  useEffect(() => {
    const loadExpiringProducts = async () => {
      try {
        console.log('Loading expiring products...');
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/products/expiring?months=${timeframe}`);
        console.log('Expiring products response:', response.data);
        setProducts(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (showExpiryTracking) {
      loadExpiringProducts();
    }
  }, [timeframe, showExpiryTracking]);

  if (!showExpiryTracking) {
    console.log('Expiry tracking is disabled');
    return <div style={{ padding: '20px' }}>
      <h2>Expiry Date Tracking</h2>
      <p>Expiry date tracking is not enabled for this facility. Please enable it in the facility settings.</p>
    </div>;
  }

  if (loading) {
    console.log('Loading state');
    return <div style={{ padding: '20px' }}>
      <h2>Expiring Products</h2>
      <p>Loading...</p>
    </div>;
  }

  if (error) {
    console.log('Error state:', error);
    return <div style={{ padding: '20px' }}>
      <h2>Expiring Products</h2>
      <p style={{ color: '#ff4444' }}>Error: {error}</p>
    </div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Expiring Products</h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(Number(e.target.value))}
          style={{ padding: '8px', borderRadius: '4px' }}
        >
          <option value={1}>Next Month</option>
          <option value={3}>Next 3 Months</option>
          <option value={6}>Next 6 Months</option>
          <option value={12}>Next Year</option>
        </select>
      </div>

      {Object.entries(products).map(([timeframe, items]) => (
        <div key={timeframe} style={{ marginBottom: '30px' }}>
          <h3 style={{ 
            color: timeframe === '1 month' ? '#ff4444' : 
                   timeframe === '3 months' ? '#ffbb33' : 
                   timeframe === '6 months' ? '#00C851' : '#33b5e5'
          }}>
            Expiring within {timeframe}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Product Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Batch ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Days Until Expiry</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Expiry Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr 
                  key={product._id} 
                  style={{ 
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: product.daysToExpiry <= 30 ? '#ffebee' :
                                   product.daysToExpiry <= 90 ? '#fff3e0' : 'transparent'
                  }}
                >
                  <td style={{ padding: '12px' }}>{product.name}</td>
                  <td style={{ padding: '12px' }}>{product.category}</td>
                  <td style={{ padding: '12px' }}>{product.batchId}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      color: product.daysToExpiry <= 30 ? '#d32f2f' : 
                             product.daysToExpiry <= 90 ? '#f57c00' : '#388e3c'
                    }}>
                      {product.daysToExpiry} days
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{new Date(product.expiry.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>{product.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default ExpiringProducts;
