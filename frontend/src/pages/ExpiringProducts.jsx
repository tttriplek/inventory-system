import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import { useFeatures } from '../contexts/FeatureContext';

const ExpiringProducts = () => {
  const { currentFacility } = useFacility();
  const { isFeatureEnabled, loading: featuresLoading } = useFeatures();
  
  const [expiringItems, setExpiringItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRangeFilter, setTimeRangeFilter] = useState('30'); // days
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all'); // all, action_required, monitored

  // Check if facility type should track expiry dates
  const facilitySupportsExpiryTracking = () => {
    if (!currentFacility) return false;
    
    // Based on our analysis:
    // - Retail: Critical (food, medicine, beauty products)
    // - Manufacturing: Important (raw materials, chemicals)
    // - Hybrid: Important (retail + manufacturing aspects)
    // - Warehouse: Not typically needed (items move quickly)
    // - Distribution: Not needed (fast movement, cold chain handled separately)
    
    const supportedTypes = ['retail', 'manufacturing', 'hybrid'];
    return supportedTypes.includes(currentFacility.type);
  };

  // Generate expiring items based on facility type
  const generateExpiringData = () => {
    const facilityType = currentFacility?.type || 'retail';
    
    const baseItems = [];

    if (facilityType === 'retail') {
      baseItems.push(
        {
          id: 'BATCH-001',
          productName: 'Organic Milk 1L',
          sku: 'MILK-ORG-1L',
          batchId: 'BATCH-2025-001',
          category: 'Dairy',
          expiryDate: '2025-02-02',
          daysToExpiry: 2,
          quantity: 24,
          location: 'Refrigerated Zone - Shelf A',
          supplier: 'Organic Farms Ltd.',
          cost: 4.99,
          retail_price: 7.99,
          action_required: true,
          recommended_action: 'Discount 50% immediately'
        },
        {
          id: 'BATCH-002',
          productName: 'Fresh Bread Loaves',
          sku: 'BREAD-FRESH-600G',
          batchId: 'BATCH-2025-007',
          category: 'Bakery',
          expiryDate: '2025-02-01',
          daysToExpiry: 1,
          quantity: 12,
          location: 'Bakery Section - Shelf B',
          supplier: 'Local Bakery Co.',
          cost: 2.50,
          retail_price: 4.99,
          action_required: true,
          recommended_action: 'Mark down 70% or donate'
        },
        {
          id: 'BATCH-003',
          productName: 'Vitamin C Tablets',
          sku: 'VIT-C-1000MG',
          batchId: 'BATCH-2024-189',
          category: 'Health',
          expiryDate: '2025-02-15',
          daysToExpiry: 15,
          quantity: 48,
          location: 'Pharmacy Section - Shelf 3',
          supplier: 'Health Plus Inc.',
          cost: 12.99,
          retail_price: 24.99,
          action_required: false,
          recommended_action: 'Monitor - adequate time for sale'
        },
        {
          id: 'BATCH-004',
          productName: 'Face Cream SPF 30',
          sku: 'CREAM-SPF30-50ML',
          batchId: 'BATCH-2024-156',
          category: 'Beauty',
          expiryDate: '2025-02-08',
          daysToExpiry: 8,
          quantity: 15,
          location: 'Beauty Section - Shelf 2',
          supplier: 'Beauty Co.',
          cost: 18.50,
          retail_price: 34.99,
          action_required: true,
          recommended_action: 'Promote with 30% discount'
        }
      );
    } else if (facilityType === 'manufacturing') {
      baseItems.push(
        {
          id: 'RAW-001',
          productName: 'Industrial Adhesive',
          sku: 'ADHESIVE-IND-5L',
          batchId: 'RAW-2024-445',
          category: 'Chemicals',
          expiryDate: '2025-02-05',
          daysToExpiry: 5,
          quantity: 8,
          location: 'Chemical Storage - Bay 3',
          supplier: 'ChemCorp Industries',
          cost: 125.00,
          retail_price: null,
          action_required: true,
          recommended_action: 'Use in production immediately'
        },
        {
          id: 'RAW-002',
          productName: 'Food Grade Coloring',
          sku: 'COLOR-RED-E129',
          batchId: 'RAW-2024-332',
          category: 'Food Additives',
          expiryDate: '2025-02-12',
          daysToExpiry: 12,
          quantity: 25,
          location: 'Additives Storage - Shelf 5',
          supplier: 'Food Colors Ltd.',
          cost: 45.00,
          retail_price: null,
          action_required: false,
          recommended_action: 'Schedule for upcoming production runs'
        },
        {
          id: 'RAW-003',
          productName: 'Catalytic Agent X-200',
          sku: 'CATALYST-X200-1KG',
          batchId: 'RAW-2024-278',
          category: 'Catalysts',
          expiryDate: '2025-02-03',
          daysToExpiry: 3,
          quantity: 12,
          location: 'Catalyst Storage - Controlled Zone',
          supplier: 'Chemical Solutions Inc.',
          cost: 280.00,
          retail_price: null,
          action_required: true,
          recommended_action: 'Priority use - high value material'
        }
      );
    } else if (facilityType === 'hybrid') {
      // Mix of retail and manufacturing items
      baseItems.push(
        {
          id: 'HYBRID-001',
          productName: 'Cleaning Solution',
          sku: 'CLEAN-MULTI-2L',
          batchId: 'HYBRID-2024-091',
          category: 'Cleaning',
          expiryDate: '2025-02-10',
          daysToExpiry: 10,
          quantity: 35,
          location: 'Storage Zone C - Shelf 8',
          supplier: 'Clean Pro Ltd.',
          cost: 8.99,
          retail_price: 15.99,
          action_required: false,
          recommended_action: 'Normal monitoring'
        }
      );
    }

    return baseItems;
  };

  useEffect(() => {
    if (currentFacility && !featuresLoading) {
      if (facilitySupportsExpiryTracking()) {
        const mockData = generateExpiringData();
        setExpiringItems(mockData);
      } else {
        setExpiringItems([]);
      }
      setLoading(false);
    }
  }, [currentFacility, featuresLoading]);

  const filteredItems = expiringItems.filter(item => {
    // Time range filter
    if (timeRangeFilter !== 'all' && item.daysToExpiry > parseInt(timeRangeFilter)) return false;
    
    // Category filter
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    
    // Action filter
    if (actionFilter === 'action_required' && !item.action_required) return false;
    if (actionFilter === 'monitored' && item.action_required) return false;
    
    return true;
  }).sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  const getExpiryUrgencyColor = (daysToExpiry) => {
    if (daysToExpiry <= 0) return 'bg-red-600 text-white border-red-600';
    if (daysToExpiry <= 2) return 'bg-red-100 text-red-800 border-red-200';
    if (daysToExpiry <= 7) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysToExpiry <= 14) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getExpiryLabel = (daysToExpiry) => {
    if (daysToExpiry <= 0) return 'EXPIRED';
    if (daysToExpiry <= 2) return 'Critical';
    if (daysToExpiry <= 7) return 'Urgent';
    if (daysToExpiry <= 14) return 'Monitor';
    return 'Normal';
  };

  if (featuresLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading Expiry Analysis...</span>
      </div>
    );
  }

  if (!facilitySupportsExpiryTracking()) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="text-2xl mr-4">ℹ️</div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Expiry Tracking Not Applicable
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Expiry date tracking is not typically needed for <strong>{currentFacility?.type}</strong> facilities.</p>
              <div className="mt-3">
                <p className="font-medium">Facility Type Analysis:</p>
                <ul className="mt-1 space-y-1">
                  <li>• <strong>Warehouses:</strong> Items move quickly, expiry managed by recipients</li>
                  <li>• <strong>Distribution Centers:</strong> Fast throughput, cold chain handled separately</li>
                  <li>• <strong>Retail Stores:</strong> ✅ Critical for food, medicine, beauty products</li>
                  <li>• <strong>Manufacturing:</strong> ✅ Raw materials and chemicals can expire</li>
                  <li>• <strong>Hybrid:</strong> ✅ Combination of retail and manufacturing needs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isFeatureEnabled('expiryManagement')) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Expiry Management Not Enabled
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Expiry date tracking is not currently enabled for this facility.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalValue = filteredItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  const criticalItems = filteredItems.filter(item => item.daysToExpiry <= 2);
  const expiredItems = filteredItems.filter(item => item.daysToExpiry <= 0);
  const actionRequiredItems = filteredItems.filter(item => item.action_required);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expiring Products</h1>
            <p className="text-gray-600 mt-1">
              Monitor expiry dates and manage time-sensitive inventory for {currentFacility?.type} operations
            </p>
          </div>
          <div className="flex items-center space-x-3">
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
            <span className="text-2xl mr-3">💀</span>
            <div>
              <p className="text-sm font-medium text-red-600">Expired</p>
              <p className="text-2xl font-bold text-red-900">{expiredItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🚨</span>
            <div>
              <p className="text-sm font-medium text-orange-600">Critical (≤2 days)</p>
              <p className="text-2xl font-bold text-orange-900">{criticalItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚡</span>
            <div>
              <p className="text-sm font-medium text-yellow-600">Action Required</p>
              <p className="text-2xl font-bold text-yellow-900">{actionRequiredItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💰</span>
            <div>
              <p className="text-sm font-medium text-green-600">Total Value at Risk</p>
              <p className="text-2xl font-bold text-green-900">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">All Items</option>
              <option value="7">Next 7 days</option>
              <option value="14">Next 14 days</option>
              <option value="30">Next 30 days</option>
              <option value="60">Next 60 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">All Categories</option>
              {[...new Set(expiringItems.map(item => item.category))].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Status</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">All Items</option>
              <option value="action_required">Action Required</option>
              <option value="monitored">Monitoring Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expiring Items Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Expiring Items ({filteredItems.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      <div className="text-sm text-gray-500">Category: {item.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Batch: {item.batchId}</div>
                    <div className="text-sm text-gray-500">Expires: {new Date(item.expiryDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getExpiryUrgencyColor(item.daysToExpiry)}`}>
                      {getExpiryLabel(item.daysToExpiry)}
                      {item.daysToExpiry > 0 && ` - ${item.daysToExpiry} days`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity} units</div>
                    <div className="text-sm text-gray-500">
                      Value: ${(item.quantity * item.cost).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {item.recommended_action}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {item.action_required ? (
                      <div className="space-y-1">
                        <button className="text-red-600 hover:text-red-900 block">
                          Take Action
                        </button>
                        <button className="text-blue-600 hover:text-blue-900 block">
                          Mark as Handled
                        </button>
                      </div>
                    ) : (
                      <button className="text-gray-600 hover:text-gray-900">
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              <span className="text-4xl mb-4 block">✅</span>
              <h3 className="text-lg font-medium mb-2">No expiring items found</h3>
              <p className="text-sm">All items are within acceptable expiry timeframes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpiringProducts;
