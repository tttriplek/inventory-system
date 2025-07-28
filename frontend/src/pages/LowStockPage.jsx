
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { createPurchaseOrder, getProductPurchaseOrders } from '../api/purchaseOrderApi';

// Fresh LowStockPage: shows products below a threshold, allows restock
const LowStockPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(() => {
    const saved = localStorage.getItem('lowstock_threshold');
    return saved ? Number(saved) : 5;
  });
  const [restockQty, setRestockQty] = useState(() => {
    const saved = localStorage.getItem('lowstock_restockQty');
    return saved ? JSON.parse(saved) : {};
  });
  const [pricePerUnit, setPricePerUnit] = useState(() => {
    const saved = localStorage.getItem('lowstock_pricePerUnit');
    return saved ? JSON.parse(saved) : {};
  });
  const [message, setMessage] = useState('');
  const [sortField, setSortField] = useState('totalQuantity');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(new Set());
  const [pendingOrders, setPendingOrders] = useState({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/products/low-stock?threshold=${threshold}`);
        
        // Extract unique categories
        const categorySet = new Set(res.data.map(p => p.sample?.category).filter(Boolean));
        setCategories(categorySet);

        // Load pending orders for each product
        const orderPromises = res.data.map(p => getProductPurchaseOrders(p.name));
        const ordersResults = await Promise.all(orderPromises);
        
        const pendingOrdersMap = {};
        res.data.forEach((product, index) => {
          const productOrders = ordersResults[index];
          if (productOrders && productOrders.length > 0) {
            pendingOrdersMap[product.name] = productOrders;
          }
        });
        setPendingOrders(pendingOrdersMap);

        // Show only products with totalQuantity < threshold
        const filtered = res.data.filter(p => typeof p.totalQuantity === 'number' && p.totalQuantity < threshold);
        const sorted = sortProducts(filtered);
        setProducts(sorted);
      } catch (err) {
        let msg = 'Error loading low stock products.';
        if (err.response && err.response.data && err.response.data.error) {
          msg += ` (${err.response.data.error})`;
        }
        setMessage(msg);
      }
      setLoading(false);
    };

    loadData();
  }, [threshold]);

  // Save values to localStorage when they change
  useEffect(() => {
    localStorage.setItem('lowstock_threshold', threshold);
  }, [threshold]);

  useEffect(() => {
    localStorage.setItem('lowstock_restockQty', JSON.stringify(restockQty));
  }, [restockQty]);

  useEffect(() => {
    localStorage.setItem('lowstock_pricePerUnit', JSON.stringify(pricePerUnit));
  }, [pricePerUnit]);

  const sortProducts = (items) => {
    return [...items].sort((a, b) => {
      let aValue = sortField === 'totalQuantity' ? (a[sortField] ?? 0) : 
                   sortField === 'name' ? a[sortField] :
                   sortField === 'category' ? (a.sample?.category ?? '') : '';
      
      let bValue = sortField === 'totalQuantity' ? (b[sortField] ?? 0) : 
                   sortField === 'name' ? b[sortField] :
                   sortField === 'category' ? (b.sample?.category ?? '') : '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filterProducts = (products) => {
    return products.filter(p => {
      const matchesCategory = !filterCategory || p.sample?.category === filterCategory;
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sample?.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRestock = async (id, name, category) => {
    const qty = Number(restockQty[name]);
    if (!qty || qty < 1) {
      setMessage('Error: Enter a valid quantity.');
      return;
    }
    try {
      const price = Number(pricePerUnit[name]) || 0;
      
      // Create a purchase order
      await createPurchaseOrder({
        productName: name,
        category,
        quantity: qty,
        pricePerUnit: price,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 1 week delivery
      });
      
      setMessage(`Created purchase order for ${name} with ${qty} units.`);
      const newRestockQty = { ...restockQty };
      delete newRestockQty[name];
      setRestockQty(newRestockQty);
      const newPricePerUnit = { ...pricePerUnit };
      delete newPricePerUnit[name];
      setPricePerUnit(newPricePerUnit);
      
      // Refresh data
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/products/low-stock?threshold=${threshold}`);
      const sorted = sortProducts(res.data);
      setProducts(sorted);
      
      // Refresh pending orders for this product
      const updatedOrders = await getProductPurchaseOrders(name);
      setPendingOrders(prev => ({
        ...prev,
        [name]: updatedOrders
      }));
      
      setLoading(false);
    } catch (err) {
      setMessage(`Error: Could not create purchase order. ${err}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Low Stock Products</h2>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <label>
          Alert Threshold:
          <input
            type="number"
            value={threshold}
            min={1}
            onChange={e => setThreshold(Number(e.target.value))}
            style={{ 
              marginLeft: '10px', 
              width: '60px',
              backgroundColor: '#3d3d3d',
              border: '1px solid #555',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          />
        </label>

        <label>
          Category:
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            style={{
              marginLeft: '10px',
              backgroundColor: '#3d3d3d',
              border: '1px solid #555',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            <option value="">All Categories</option>
            {[...categories].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label>
          Search:
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            style={{
              marginLeft: '10px',
              width: '200px',
              backgroundColor: '#3d3d3d',
              border: '1px solid #555',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          />
        </label>
      </div>
      {message && (
        <div style={{ margin: '12px 0', color: message.startsWith('Error') ? '#b71c1c' : '#388e3c', background: '#fffde7', padding: '10px', borderRadius: '6px', fontWeight: 'bold' }}>{message}</div>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : products.length === 0 ? (
        <div>No products below threshold.</div>
      ) : (
        <table style={{ 
            width: '100%', 
            marginTop: '20px',
            borderCollapse: 'collapse',
            boxShadow: '0 1px 3px rgba(255,255,255,0.2)',
            backgroundColor: '#2d2d2d',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #444'
          }}>
          <thead>
            <tr style={{ backgroundColor: '#3d3d3d' }}>
              <th 
                onClick={() => handleSort('name')}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #555', 
                  color: '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('totalQuantity')}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #555', 
                  color: '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Total Quantity {sortField === 'totalQuantity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('category')}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #555', 
                  color: '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #555', color: '#fff' }}>Sample SKU</th>
              <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #555', color: '#fff' }}>Pending Orders</th>
              <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #555', color: '#fff' }}>Restock</th>
            </tr>
          </thead>
          <tbody>
            {filterProducts(sortProducts(products)).map(p => {
              // Defensive: skip if products array is empty or undefined
              if (!Array.isArray(p.products) || p.products.length === 0) return null;
              const key = p.name + '-' + (p.sample?.sku || p.products[0]?._id || p.name);
              return (
                <tr key={key} style={{ 
                  background: p.totalQuantity <= threshold ? '#3d2020' : '#2d2d2d',
                  borderBottom: '1px solid #444',
                  transition: 'background-color 0.2s'
                }}>
                  <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#fff' }}>{p.name}</td>
                  <td style={{ padding: '12px 15px', color: p.totalQuantity <= threshold ? '#ff6b6b' : '#fff' }}>{p.totalQuantity}</td>
                  <td style={{ padding: '12px 15px', color: '#fff' }}>{p.sample?.category}</td>
                  <td style={{ padding: '12px 15px', fontFamily: 'monospace', color: '#fff' }}>{p.sample?.sku}</td>
                  <td style={{ padding: '12px 15px', color: '#fff' }}>
                    {pendingOrders[p.name]?.map((order, index) => (
                      <div key={order._id} style={{ 
                        marginBottom: index < pendingOrders[p.name].length - 1 ? '8px' : '0',
                        padding: '4px 8px',
                        backgroundColor: '#3d3d3d',
                        borderRadius: '4px',
                        fontSize: '0.9em'
                      }}>
                        {order.quantity} units ordered on {new Date(order.orderDate).toLocaleDateString()}
                        {order.expectedDeliveryDate && 
                          ` (Expected: ${new Date(order.expectedDeliveryDate).toLocaleDateString()})`}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: '12px 15px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input
                          type="number"
                          min={1}
                          value={restockQty[p.name] ?? ''}
                          onChange={e => setRestockQty(q => ({ ...q, [p.name]: e.target.value }))}
                          placeholder="Qty"
                          style={{ 
                            width: '60px',
                            backgroundColor: '#3d3d3d',
                            border: '1px solid #555',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={pricePerUnit[p.name] ?? ''}
                          onChange={e => setPricePerUnit(prev => ({ ...prev, [p.name]: e.target.value }))}
                          placeholder="Price"
                          style={{ 
                            width: '60px',
                            backgroundColor: '#3d3d3d',
                            border: '1px solid #555',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '16px',
                        fontSize: '0.8em',
                        color: '#aaa',
                        minWidth: '200px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '4px',
                          borderRight: '1px solid #555',
                          paddingRight: '16px'
                        }}>
                          <span style={{ color: '#888', fontWeight: 'bold' }}>Current:</span>
                          <span>Qty: {p.totalQuantity}</span>
                          <span>Price/Unit: ${p.sample?.pricePerUnit?.toFixed(2) || '0.00'}</span>
                          <span>Total: ${((p.totalQuantity || 0) * (p.sample?.pricePerUnit || 0)).toFixed(2)}</span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <span style={{ color: '#888', fontWeight: 'bold' }}>New:</span>
                          <span>Quantity</span>
                          <span>Price/Unit</span>
                          {(restockQty[p.name] && pricePerUnit[p.name]) && (
                            <span style={{ color: '#4caf50' }}>
                              Total: ${(Number(restockQty[p.name]) * Number(pricePerUnit[p.name])).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      </div>
                      <button
                      onClick={() => handleRestock(p.products[0]._id, p.name, p.sample?.category)}
                      style={{ 
                        background: '#2e7d32',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3d8b40'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2e7d32'}
                    >Restock</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LowStockPage;
