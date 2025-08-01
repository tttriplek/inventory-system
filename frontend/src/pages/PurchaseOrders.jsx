import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import { useFeatures } from '../contexts/FeatureContext';

const PurchaseOrders = () => {
  const { currentFacility } = useFacility();
  const { isFeatureEnabled, loading: featuresLoading } = useFeatures();
  
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Check if purchase orders feature is enabled
  const isPurchaseOrdersEnabled = isFeatureEnabled('purchase-orders') || isFeatureEnabled('purchaseOrders');

  // Show not enabled message if feature is disabled
  if (featuresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isPurchaseOrdersEnabled) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-blue-600 text-4xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Purchase Orders Not Enabled</h2>
          <p className="text-blue-700">
            Purchase Orders feature is not enabled for this facility. 
            Contact your administrator to enable this feature.
          </p>
        </div>
      </div>
    );
  }

  // Check if facility type typically uses purchase orders
  const facilityUsesPurchaseOrders = () => {
    if (!currentFacility) return false;
    
    // Based on our analysis:
    // - Retail: Essential for stock replenishment from suppliers
    // - Manufacturing: Critical for raw materials procurement
    // - Warehouse: Important for inventory management and supplier coordination
    // - Distribution: Moderate need, mainly for equipment/packaging supplies
    // - Hybrid: Essential for complex supply chain needs
    
    const supportedTypes = ['retail', 'manufacturing', 'warehouse', 'hybrid'];
    return supportedTypes.includes(currentFacility.type);
  };

  // Generate purchase orders based on facility type
  const generatePurchaseOrderData = () => {
    const facilityType = currentFacility?.type || 'retail';
    const orders = [];

    if (facilityType === 'retail') {
      orders.push(
        {
          id: 'PO-2025-001',
          supplier: 'Organic Farms Ltd.',
          status: 'pending_approval',
          priority: 'high',
          orderDate: '2025-01-31',
          expectedDelivery: '2025-02-05',
          totalAmount: 4250.00,
          currency: 'USD',
          items: [
            { product: 'Organic Milk 1L', quantity: 144, unit_price: 4.99, total: 718.56 },
            { product: 'Free Range Eggs', quantity: 96, unit_price: 6.99, total: 671.04 },
            { product: 'Organic Bread', quantity: 48, unit_price: 3.99, total: 191.52 }
          ],
          requestedBy: 'Store Manager',
          reason: 'Low stock alert triggered - fast-moving items',
          department: 'Grocery',
          notes: 'Rush delivery needed for weekend promotion'
        },
        {
          id: 'PO-2025-002',
          supplier: 'Beauty Co.',
          status: 'approved',
          priority: 'medium',
          orderDate: '2025-01-29',
          expectedDelivery: '2025-02-03',
          totalAmount: 3200.00,
          currency: 'USD',
          items: [
            { product: 'Face Cream SPF 30', quantity: 60, unit_price: 18.50, total: 1110.00 },
            { product: 'Moisturizer', quantity: 40, unit_price: 22.00, total: 880.00 },
            { product: 'Sunscreen SPF 50', quantity: 35, unit_price: 34.00, total: 1190.00 }
          ],
          requestedBy: 'Beauty Department Lead',
          reason: 'Seasonal demand increase',
          department: 'Beauty',
          notes: 'Summer season preparation'
        },
        {
          id: 'PO-2025-003',
          supplier: 'Health Plus Inc.',
          status: 'delivered',
          priority: 'low',
          orderDate: '2025-01-25',
          expectedDelivery: '2025-01-30',
          actualDelivery: '2025-01-30',
          totalAmount: 1890.00,
          currency: 'USD',
          items: [
            { product: 'Vitamin C Tablets', quantity: 120, unit_price: 12.99, total: 1558.80 },
            { product: 'Multivitamins', quantity: 24, unit_price: 13.80, total: 331.20 }
          ],
          requestedBy: 'Pharmacy Manager',
          reason: 'Regular restock',
          department: 'Pharmacy',
          notes: 'Delivered on time'
        }
      );
    } else if (facilityType === 'manufacturing') {
      orders.push(
        {
          id: 'PO-2025-004',
          supplier: 'ChemCorp Industries',
          status: 'urgent',
          priority: 'critical',
          orderDate: '2025-01-31',
          expectedDelivery: '2025-02-02',
          totalAmount: 15750.00,
          currency: 'USD',
          items: [
            { product: 'Industrial Adhesive 5L', quantity: 50, unit_price: 125.00, total: 6250.00 },
            { product: 'Catalyst Agent X-200', quantity: 25, unit_price: 280.00, total: 7000.00 },
            { product: 'Safety Solvent', quantity: 30, unit_price: 83.33, total: 2500.00 }
          ],
          requestedBy: 'Production Manager',
          reason: 'Production line requirements',
          department: 'Manufacturing',
          notes: 'Critical for Product Line A - expedite delivery'
        },
        {
          id: 'PO-2025-005',
          supplier: 'Food Colors Ltd.',
          status: 'pending_approval',
          priority: 'medium',
          orderDate: '2025-01-30',
          expectedDelivery: '2025-02-07',
          totalAmount: 2250.00,
          currency: 'USD',
          items: [
            { product: 'Food Grade Red Coloring', quantity: 25, unit_price: 45.00, total: 1125.00 },
            { product: 'Food Grade Blue Coloring', quantity: 25, unit_price: 45.00, total: 1125.00 }
          ],
          requestedBy: 'QC Manager',
          reason: 'Food production batch requirements',
          department: 'Quality Control',
          notes: 'Standard monthly order'
        }
      );
    } else if (facilityType === 'warehouse') {
      orders.push(
        {
          id: 'PO-2025-006',
          supplier: 'Packaging Solutions Inc.',
          status: 'approved',
          priority: 'medium',
          orderDate: '2025-01-29',
          expectedDelivery: '2025-02-08',
          totalAmount: 5400.00,
          currency: 'USD',
          items: [
            { product: 'Cardboard Boxes (Large)', quantity: 500, unit_price: 3.20, total: 1600.00 },
            { product: 'Bubble Wrap Rolls', quantity: 40, unit_price: 25.00, total: 1000.00 },
            { product: 'Shipping Labels', quantity: 2000, unit_price: 0.45, total: 900.00 },
            { product: 'Pallets (Standard)', quantity: 20, unit_price: 95.00, total: 1900.00 }
          ],
          requestedBy: 'Warehouse Supervisor',
          reason: 'Packaging supplies replenishment',
          department: 'Operations',
          notes: 'Monthly supply order'
        }
      );
    } else if (facilityType === 'hybrid') {
      // Mix of retail and manufacturing orders
      orders.push(
        ...orders.slice(0, 1), // Some retail orders
        {
          id: 'PO-2025-007',
          supplier: 'Industrial & Retail Supply Co.',
          status: 'pending_approval',
          priority: 'medium',
          orderDate: '2025-01-31',
          expectedDelivery: '2025-02-06',
          totalAmount: 8950.00,
          currency: 'USD',
          items: [
            { product: 'Multi-purpose Cleaner (Bulk)', quantity: 100, unit_price: 8.99, total: 899.00 },
            { product: 'Industrial Equipment Parts', quantity: 15, unit_price: 320.00, total: 4800.00 },
            { product: 'Office Supplies Bundle', quantity: 10, unit_price: 125.10, total: 1251.00 },
            { product: 'Safety Equipment', quantity: 20, unit_price: 100.00, total: 2000.00 }
          ],
          requestedBy: 'Operations Manager',
          reason: 'Mixed operational requirements',
          department: 'General Operations',
          notes: 'Hybrid facility procurement'
        }
      );
    }

    return orders;
  };

  useEffect(() => {
    if (currentFacility && !featuresLoading) {
      if (facilityUsesPurchaseOrders()) {
        const mockData = generatePurchaseOrderData();
        setPurchaseOrders(mockData);
      } else {
        setPurchaseOrders([]);
      }
      setLoading(false);
    }
  }, [currentFacility, featuresLoading]);

  const filteredOrders = purchaseOrders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false;
    if (supplierFilter !== 'all' && order.supplier !== supplierFilter) return false;
    return true;
  }).sort((a, b) => {
    // Sort by priority then by date
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.orderDate) - new Date(a.orderDate);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'urgent': return 'URGENT';
      case 'pending_approval': return 'Pending Approval';
      case 'approved': return 'Approved';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (featuresLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading Purchase Orders...</span>
      </div>
    );
  }

  if (!facilityUsesPurchaseOrders()) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="text-2xl mr-4">ℹ️</div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Purchase Orders Limited Applicability
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Purchase Orders have limited applicability for <strong>{currentFacility?.type}</strong> facilities.</p>
              <div className="mt-3">
                <p className="font-medium">Facility Type Analysis:</p>
                <ul className="mt-1 space-y-1">
                  <li>• <strong>Retail Stores:</strong> ✅ Essential for stock replenishment from suppliers</li>
                  <li>• <strong>Manufacturing:</strong> ✅ Critical for raw materials procurement</li>
                  <li>• <strong>Warehouses:</strong> ✅ Important for packaging and operational supplies</li>
                  <li>• <strong>Distribution Centers:</strong> Limited need - mainly equipment/packaging</li>
                  <li>• <strong>Hybrid:</strong> ✅ Essential for complex supply chain management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Temporarily disable feature check to debug
  const featureEnabled = true; // isFeatureEnabled('purchaseOrders');
  
  if (!featureEnabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Purchase Orders Not Enabled
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Purchase order management is not currently enabled for this facility.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalOrderValue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending_approval');
  const urgentOrders = filteredOrders.filter(order => order.status === 'urgent');
  const deliveredOrders = filteredOrders.filter(order => order.status === 'delivered');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-1">
              Manage procurement and supplier orders for {currentFacility?.type} operations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Purchase Order
            </button>
            <span className="text-sm text-gray-500">
              Facility: {currentFacility?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🚨</span>
            <div>
              <p className="text-sm font-medium text-red-600">Urgent Orders</p>
              <p className="text-2xl font-bold text-red-900">{urgentOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⏳</span>
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <p className="text-sm font-medium text-green-600">Delivered</p>
              <p className="text-2xl font-bold text-green-900">{deliveredOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💰</span>
            <div>
              <p className="text-sm font-medium text-blue-600">Total Value</p>
              <p className="text-2xl font-bold text-blue-900">${totalOrderValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="urgent">Urgent</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">All Suppliers</option>
              {[...new Set(purchaseOrders.map(order => order.supplier))].map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Purchase Orders ({filteredOrders.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      <div className="text-sm text-gray-500">{order.department}</div>
                      <div className="text-sm text-gray-500">{order.items.length} items</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.supplier}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <br />
                      <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(order.priority)}`}>
                        {order.priority.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>Ordered: {new Date(order.orderDate).toLocaleDateString()}</div>
                      <div>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</div>
                      {order.actualDelivery && (
                        <div>Delivered: {new Date(order.actualDelivery).toLocaleDateString()}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${order.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">{order.currency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.requestedBy}</div>
                    <div className="text-sm text-gray-500">{order.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="space-y-1">
                      <button className="text-blue-600 hover:text-blue-900 block">
                        View Details
                      </button>
                      {order.status === 'pending_approval' && (
                        <button className="text-green-600 hover:text-green-900 block">
                          Approve
                        </button>
                      )}
                      {order.status === 'approved' && (
                        <button className="text-purple-600 hover:text-purple-900 block">
                          Track Delivery
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              <span className="text-4xl mb-4 block">📋</span>
              <h3 className="text-lg font-medium mb-2">No purchase orders found</h3>
              <p className="text-sm">Create a new purchase order to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;
