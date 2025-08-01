import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import { useFeatures } from '../contexts/FeatureContext';

const LowStock = () => {
  const { currentFacility } = useFacility();
  const { isFeatureEnabled, loading: featuresLoading } = useFeatures();
  
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [thresholdFilter, setThresholdFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgency'); // urgency, quantity, name

  // Check if facility type should have low stock alerts
  const facilitySupportsLowStock = () => {
    if (!currentFacility) return false;
    
    // Based on our analysis:
    // - Retail: Critical (needs reordering)
    // - Manufacturing: Important (raw materials)
    // - Hybrid: Important (both retail and storage)
    // - Warehouse: Not needed (receives to distribute)
    // - Distribution: Not needed (items move quickly)
    
    const supportedTypes = ['retail', 'manufacturing', 'hybrid'];
    return supportedTypes.includes(currentFacility.type);
  };

  // Mock low stock data based on facility type
  const generateLowStockData = () => {
    const facilityType = currentFacility?.type || 'retail';
    
    const baseItems = [
      {
        id: 'PROD-001',
        name: 'iPhone 14 Pro',
        sku: 'IPHONE14P-128',
        category: 'Electronics',
        currentStock: 3,
        threshold: 10,
        reorderPoint: 25,
        cost: 999,
        supplier: 'Apple Inc.',
        location: 'Zone A - Aisle 1 - Bin 5',
        lastOrdered: '2025-01-20',
        averageDailySales: 2.5,
        daysUntilEmpty: 1.2
      },
      {
        id: 'PROD-002',
        name: 'Samsung Galaxy S24',
        sku: 'GALAXY-S24-256',
        category: 'Electronics',
        currentStock: 7,
        threshold: 15,
        reorderPoint: 30,
        cost: 899,
        supplier: 'Samsung Electronics',
        location: 'Zone A - Aisle 2 - Bin 3',
        lastOrdered: '2025-01-18',
        averageDailySales: 1.8,
        daysUntilEmpty: 3.9
      }
    ];

    // Add facility-specific items
    if (facilityType === 'retail') {
      baseItems.push(
        {
          id: 'PROD-003',
          name: 'Wireless Earbuds',
          sku: 'EARBUDS-WL-001',
          category: 'Audio',
          currentStock: 2,
          threshold: 20,
          reorderPoint: 50,
          cost: 129,
          supplier: 'Audio Tech Ltd.',
          location: 'Zone B - Aisle 1 - Bin 8',
          lastOrdered: '2025-01-15',
          averageDailySales: 3.2,
          daysUntilEmpty: 0.6
        },
        {
          id: 'PROD-004',
          name: 'Phone Cases',
          sku: 'CASE-UNIV-001',
          category: 'Accessories',
          currentStock: 8,
          threshold: 25,
          reorderPoint: 100,
          cost: 19.99,
          supplier: 'Case Masters',
          location: 'Zone C - Aisle 3 - Bin 12',
          lastOrdered: '2025-01-22',
          averageDailySales: 5.1,
          daysUntilEmpty: 1.6
        }
      );
    } else if (facilityType === 'manufacturing') {
      baseItems.push(
        {
          id: 'RAW-001',
          name: 'Steel Sheets (2mm)',
          sku: 'STEEL-2MM-4X8',
          category: 'Raw Materials',
          currentStock: 45,
          threshold: 100,
          reorderPoint: 200,
          cost: 125,
          supplier: 'Steel Works Inc.',
          location: 'Warehouse 1 - Bay A',
          lastOrdered: '2025-01-10',
          averageDailySales: 15.3,
          daysUntilEmpty: 2.9
        },
        {
          id: 'RAW-002',
          name: 'Industrial Screws M6',
          sku: 'SCREW-M6-25MM',
          category: 'Hardware',
          currentStock: 850,
          threshold: 2000,
          reorderPoint: 5000,
          cost: 0.15,
          supplier: 'Hardware Solutions',
          location: 'Warehouse 2 - Bin 15',
          lastOrdered: '2025-01-25',
          averageDailySales: 423,
          daysUntilEmpty: 2.0
        }
      );
    }

    return baseItems;
  };

  useEffect(() => {
    if (currentFacility && !featuresLoading) {
      if (facilitySupportsLowStock()) {
        const mockData = generateLowStockData();
        setLowStockItems(mockData);
      } else {
        setLowStockItems([]);
      }
      setLoading(false);
    }
  }, [currentFacility, featuresLoading]);

  const filteredItems = lowStockItems.filter(item => {
    // Threshold filter
    if (thresholdFilter === 'critical' && item.daysUntilEmpty > 1) return false;
    if (thresholdFilter === 'low' && item.daysUntilEmpty <= 1) return false;
    
    // Category filter
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'urgency':
        return a.daysUntilEmpty - b.daysUntilEmpty;
      case 'quantity':
        return a.currentStock - b.currentStock;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const getUrgencyColor = (daysUntilEmpty) => {
    if (daysUntilEmpty <= 1) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntilEmpty <= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysUntilEmpty <= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getUrgencyLabel = (daysUntilEmpty) => {
    if (daysUntilEmpty <= 1) return 'Critical';
    if (daysUntilEmpty <= 3) return 'Urgent';
    if (daysUntilEmpty <= 7) return 'Low';
    return 'Monitor';
  };

  if (featuresLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading Low Stock Analysis...</span>
      </div>
    );
  }

  if (!facilitySupportsLowStock()) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="text-2xl mr-4">ℹ️</div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Low Stock Monitoring Not Applicable
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Low stock monitoring is not enabled for <strong>{currentFacility?.type}</strong> facilities.</p>
              <div className="mt-3">
                <p className="font-medium">Facility Type Analysis:</p>
                <ul className="mt-1 space-y-1">
                  <li>• <strong>Warehouses:</strong> Receive items to distribute, don't hold retail inventory</li>
                  <li>• <strong>Distribution Centers:</strong> Items move quickly, no long-term storage</li>
                  <li>• <strong>Retail Stores:</strong> ✅ Need reorder alerts for customer demand</li>
                  <li>• <strong>Manufacturing:</strong> ✅ Need raw material monitoring</li>
                  <li>• <strong>Hybrid:</strong> ✅ Combination of retail and storage needs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isFeatureEnabled('inventoryAlerts')) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Low Stock Alerts Not Enabled
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Low stock monitoring is not currently enabled for this facility.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Low Stock Monitor</h1>
            <p className="text-gray-600 mt-1">
              Track inventory levels and reorder alerts for {currentFacility?.type} operations
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
            <span className="text-2xl mr-3">🚨</span>
            <div>
              <p className="text-sm font-medium text-red-600">Critical</p>
              <p className="text-2xl font-bold text-red-900">
                {filteredItems.filter(item => item.daysUntilEmpty <= 1).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="text-sm font-medium text-orange-600">Urgent</p>
              <p className="text-2xl font-bold text-orange-900">
                {filteredItems.filter(item => item.daysUntilEmpty > 1 && item.daysUntilEmpty <= 3).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📊</span>
            <div>
              <p className="text-sm font-medium text-yellow-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-900">
                {filteredItems.filter(item => item.daysUntilEmpty > 3 && item.daysUntilEmpty <= 7).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💰</span>
            <div>
              <p className="text-sm font-medium text-green-600">Total Value at Risk</p>
              <p className="text-2xl font-bold text-green-900">
                ${filteredItems.reduce((sum, item) => sum + (item.currentStock * item.cost), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
            <select
              value={thresholdFilter}
              onChange={(e) => setThresholdFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">All Items</option>
              <option value="critical">Critical (≤1 day)</option>
              <option value="low">Low Stock (&gt;1 day)</option>
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
              {[...new Set(lowStockItems.map(item => item.category))].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="urgency">Urgency (Days Until Empty)</option>
              <option value="quantity">Current Stock</option>
              <option value="name">Product Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Low Stock Items */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Low Stock Items ({filteredItems.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Until Empty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      <div className="text-sm text-gray-500">Category: {item.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.currentStock}</div>
                    <div className="text-sm text-gray-500">Reorder at: {item.reorderPoint}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.threshold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getUrgencyColor(item.daysUntilEmpty)}`}>
                      {getUrgencyLabel(item.daysUntilEmpty)} - {item.daysUntilEmpty.toFixed(1)} days
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      Create Order
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              <span className="text-4xl mb-4 block">✅</span>
              <h3 className="text-lg font-medium mb-2">No low stock items</h3>
              <p className="text-sm">All inventory levels are above their thresholds</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowStock;
