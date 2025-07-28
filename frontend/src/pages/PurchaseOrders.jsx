import React, { useEffect, useState } from 'react';
import { getPurchaseOrders, markOrderAsDelivered, cancelOrder, updateDeliveryDate } from '../api/purchaseOrderApi';

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('orderDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDeliveryDate, setEditingDeliveryDate] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getPurchaseOrders();
      setOrders(data);
      setMessage('');
    } catch (err) {
      setMessage('Error: Could not load purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleMarkDelivered = async (orderId) => {
    try {
      await markOrderAsDelivered(orderId);
      setMessage('Order marked as delivered and stock updated.');
      loadOrders(); // Refresh the list
    } catch (err) {
      setMessage('Error: Could not mark order as delivered.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelOrder(orderId);
        setMessage('Order cancelled successfully.');
        loadOrders(); // Refresh the list
      } catch (err) {
        setMessage('Error: Could not cancel order.');
      }
    }
  };

  const handleUpdateDeliveryDate = async (orderId, newDate) => {
    try {
      await updateDeliveryDate(orderId, newDate);
      setMessage('Delivery date updated successfully.');
      setEditingDeliveryDate(null);
      loadOrders(); // Refresh the list
    } catch (err) {
      setMessage('Error: Could not update delivery date.');
    }
  };

  const sortOrders = (items) => {
    return [...items].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'orderDate' || sortField === 'expectedDeliveryDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortField === 'totalPrice' || sortField === 'quantity') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filterOrders = (orders) => {
    return orders.filter(order => {
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const matchesSearch = searchQuery === '' || 
        order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'ordered': return '#2196f3';
      case 'delivered': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Purchase Orders</h2>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <label>
          Status:
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              marginLeft: '10px',
              backgroundColor: '#3d3d3d',
              border: '1px solid #555',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            <option value="all">All Status</option>
            <option value="ordered">Ordered</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
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
        <div style={{ 
          margin: '12px 0', 
          color: message.startsWith('Error') ? '#b71c1c' : '#388e3c', 
          background: '#fffde7', 
          padding: '10px', 
          borderRadius: '6px', 
          fontWeight: 'bold' 
        }}>
          {message}
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : orders.length === 0 ? (
        <div>No purchase orders found.</div>
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
                onClick={() => handleSort('productName')}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #555', 
                  color: '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Product {sortField === 'productName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('quantity')}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #555', 
                  color: '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Quantity {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('totalPrice')}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #555', 
                  color: '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Total Price {sortField === 'totalPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('orderDate')}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #555', 
                  color: '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Order Date {sortField === 'orderDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('expectedDeliveryDate')}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #555', 
                  color: '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Expected Delivery {sortField === 'expectedDeliveryDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('status')}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #555', 
                  color: '#fff',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #555', color: '#fff' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filterOrders(sortOrders(orders)).map(order => (
              <tr key={order._id} style={{ 
                borderBottom: '1px solid #444',
                backgroundColor: order.status === 'cancelled' ? '#3d2020' : '#2d2d2d'
              }}>
                <td style={{ padding: '12px 15px', color: '#fff' }}>{order.productName}</td>
                <td style={{ padding: '12px 15px', color: '#fff' }}>{order.quantity}</td>
                <td style={{ padding: '12px 15px', color: '#fff' }}>${order.totalPrice.toFixed(2)}</td>
                <td style={{ padding: '12px 15px', color: '#fff' }}>
                  {new Date(order.orderDate).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 15px', color: '#fff' }}>
                  {editingDeliveryDate === order._id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="date"
                        defaultValue={order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleUpdateDeliveryDate(order._id, new Date(e.target.value))}
                        style={{
                          backgroundColor: '#3d3d3d',
                          border: '1px solid #555',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}
                      />
                      <button
                        onClick={() => setEditingDeliveryDate(null)}
                        style={{
                          background: '#666',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'Not set'}
                      {order.status === 'ordered' && (
                        <button
                          onClick={() => setEditingDeliveryDate(order._id)}
                          style={{
                            background: '#666',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            cursor: 'pointer',
                            fontSize: '0.8em'
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 15px' }}>
                  <span style={{
                    backgroundColor: getStatusColor(order.status),
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9em'
                  }}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td style={{ padding: '12px 15px' }}>
                  {order.status === 'ordered' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleMarkDelivered(order._id)}
                        style={{ 
                          background: '#2e7d32',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        Mark Delivered
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        style={{ 
                          background: '#c62828',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PurchaseOrders;
