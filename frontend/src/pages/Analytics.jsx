import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import { useFeatures } from '../contexts/FeatureContext';

const Analytics = () => {
  const { currentFacility } = useFacility();
  const { isFeatureEnabled, loading: featuresLoading } = useFeatures();
  
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); // 1d, 7d, 30d, 90d
  const [activeTab, setActiveTab] = useState('overview');

  // Generate comprehensive analytics data based on facility type
  const generateAnalyticsData = () => {
    const facilityType = currentFacility?.type || 'retail';
    
    const baseData = {
      overview: {
        totalProducts: Math.floor(Math.random() * 1000) + 500,
        totalValue: Math.floor(Math.random() * 500000) + 100000,
        lowStockItems: Math.floor(Math.random() * 50) + 5,
        criticalItems: Math.floor(Math.random() * 10) + 1,
        turnoverRate: (Math.random() * 5 + 2).toFixed(1),
        accuracy: (Math.random() * 10 + 90).toFixed(1)
      },
      trends: {
        sales: [
          { date: '2025-01-24', value: Math.floor(Math.random() * 50000) + 10000 },
          { date: '2025-01-25', value: Math.floor(Math.random() * 50000) + 10000 },
          { date: '2025-01-26', value: Math.floor(Math.random() * 50000) + 10000 },
          { date: '2025-01-27', value: Math.floor(Math.random() * 50000) + 10000 },
          { date: '2025-01-28', value: Math.floor(Math.random() * 50000) + 10000 },
          { date: '2025-01-29', value: Math.floor(Math.random() * 50000) + 10000 },
          { date: '2025-01-30', value: Math.floor(Math.random() * 50000) + 10000 }
        ],
        inventory: [
          { date: '2025-01-24', inflow: Math.floor(Math.random() * 200) + 50, outflow: Math.floor(Math.random() * 180) + 40 },
          { date: '2025-01-25', inflow: Math.floor(Math.random() * 200) + 50, outflow: Math.floor(Math.random() * 180) + 40 },
          { date: '2025-01-26', inflow: Math.floor(Math.random() * 200) + 50, outflow: Math.floor(Math.random() * 180) + 40 },
          { date: '2025-01-27', inflow: Math.floor(Math.random() * 200) + 50, outflow: Math.floor(Math.random() * 180) + 40 },
          { date: '2025-01-28', inflow: Math.floor(Math.random() * 200) + 50, outflow: Math.floor(Math.random() * 180) + 40 },
          { date: '2025-01-29', inflow: Math.floor(Math.random() * 200) + 50, outflow: Math.floor(Math.random() * 180) + 40 },
          { date: '2025-01-30', inflow: Math.floor(Math.random() * 200) + 50, outflow: Math.floor(Math.random() * 180) + 40 }
        ]
      },
      categories: [
        { name: facilityType === 'retail' ? 'Electronics' : facilityType === 'manufacturing' ? 'Raw Materials' : 'General', value: 45, color: '#3B82F6' },
        { name: facilityType === 'retail' ? 'Accessories' : facilityType === 'manufacturing' ? 'Components' : 'Equipment', value: 30, color: '#10B981' },
        { name: facilityType === 'retail' ? 'Audio' : facilityType === 'manufacturing' ? 'Tools' : 'Supplies', value: 15, color: '#F59E0B' },
        { name: facilityType === 'retail' ? 'Other' : facilityType === 'manufacturing' ? 'Safety' : 'Miscellaneous', value: 10, color: '#EF4444' }
      ],
      performance: {
        efficiency: (Math.random() * 20 + 75).toFixed(1),
        accuracy: (Math.random() * 10 + 90).toFixed(1),
        speed: (Math.random() * 15 + 80).toFixed(1),
        cost: (Math.random() * 20 + 60).toFixed(1)
      },
      alerts: [
        { type: 'warning', message: 'Low stock alert for 5 items', time: '2 hours ago' },
        { type: 'error', message: 'Temperature sensor offline in Zone A', time: '4 hours ago' },
        { type: 'info', message: 'Bulk order completed successfully', time: '6 hours ago' },
        { type: 'success', message: 'Monthly inventory reconciliation completed', time: '1 day ago' }
      ]
    };

    // Facility-specific adjustments
    if (facilityType === 'manufacturing') {
      baseData.overview.productionRate = Math.floor(Math.random() * 100) + 50;
      baseData.overview.defectRate = (Math.random() * 3).toFixed(2);
      baseData.overview.rawMaterialStock = Math.floor(Math.random() * 500) + 200;
    } else if (facilityType === 'warehouse' || facilityType === 'distribution') {
      baseData.overview.throughputRate = Math.floor(Math.random() * 200) + 100;
      baseData.overview.shippingAccuracy = (Math.random() * 5 + 95).toFixed(1);
      baseData.overview.avgProcessingTime = (Math.random() * 10 + 15).toFixed(1);
    } else if (facilityType === 'cold-storage') {
      baseData.overview.temperatureCompliance = (Math.random() * 2 + 98).toFixed(1);
      baseData.overview.energyEfficiency = (Math.random() * 10 + 85).toFixed(1);
      baseData.overview.expiryItems = Math.floor(Math.random() * 20) + 3;
    }

    return baseData;
  };

  useEffect(() => {
    if (currentFacility && !featuresLoading) {
      const data = generateAnalyticsData();
      setAnalyticsData(data);
      setLoading(false);
    }
  }, [currentFacility, featuresLoading, timeRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (featuresLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading Analytics...</span>
      </div>
    );
  }

  if (!isFeatureEnabled('analyticsDashboard')) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Analytics Dashboard Not Enabled
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Analytics dashboard is not currently enabled for this facility.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights for {currentFacility?.name} ({currentFacility?.type})
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm text-sm"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <span className="text-sm text-gray-500">
              Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'trends', name: 'Trends', icon: '📈' },
              { id: 'performance', name: 'Performance', icon: '⚡' },
              { id: 'alerts', name: 'Alerts', icon: '🚨' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📦</span>
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Products</p>
                      <p className="text-2xl font-bold text-blue-900">{analyticsData.overview.totalProducts.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💰</span>
                    <div>
                      <p className="text-sm font-medium text-green-600">Total Value</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(analyticsData.overview.totalValue)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-orange-600">Low Stock</p>
                      <p className="text-2xl font-bold text-orange-900">{analyticsData.overview.lowStockItems}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🚨</span>
                    <div>
                      <p className="text-sm font-medium text-red-600">Critical Items</p>
                      <p className="text-2xl font-bold text-red-900">{analyticsData.overview.criticalItems}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Facility-Specific Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {currentFacility?.type === 'manufacturing' && (
                  <>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🏭</span>
                        <div>
                          <p className="text-sm font-medium text-purple-600">Production Rate</p>
                          <p className="text-2xl font-bold text-purple-900">{analyticsData.overview.productionRate}/hr</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🎯</span>
                        <div>
                          <p className="text-sm font-medium text-yellow-600">Defect Rate</p>
                          <p className="text-2xl font-bold text-yellow-900">{analyticsData.overview.defectRate}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🧱</span>
                        <div>
                          <p className="text-sm font-medium text-indigo-600">Raw Materials</p>
                          <p className="text-2xl font-bold text-indigo-900">{analyticsData.overview.rawMaterialStock}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {(currentFacility?.type === 'warehouse' || currentFacility?.type === 'distribution') && (
                  <>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🚚</span>
                        <div>
                          <p className="text-sm font-medium text-purple-600">Throughput Rate</p>
                          <p className="text-2xl font-bold text-purple-900">{analyticsData.overview.throughputRate}/day</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📋</span>
                        <div>
                          <p className="text-sm font-medium text-teal-600">Shipping Accuracy</p>
                          <p className="text-2xl font-bold text-teal-900">{analyticsData.overview.shippingAccuracy}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">⏱️</span>
                        <div>
                          <p className="text-sm font-medium text-cyan-600">Avg Processing</p>
                          <p className="text-2xl font-bold text-cyan-900">{analyticsData.overview.avgProcessingTime}min</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {currentFacility?.type === 'cold-storage' && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🌡️</span>
                        <div>
                          <p className="text-sm font-medium text-blue-600">Temperature Compliance</p>
                          <p className="text-2xl font-bold text-blue-900">{analyticsData.overview.temperatureCompliance}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">⚡</span>
                        <div>
                          <p className="text-sm font-medium text-green-600">Energy Efficiency</p>
                          <p className="text-2xl font-bold text-green-900">{analyticsData.overview.energyEfficiency}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📅</span>
                        <div>
                          <p className="text-sm font-medium text-orange-600">Near Expiry</p>
                          <p className="text-2xl font-bold text-orange-900">{analyticsData.overview.expiryItems}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Category Distribution */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analyticsData.categories.map((category, index) => (
                    <div key={index} className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="30"
                            stroke="#E5E7EB"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="30"
                            stroke={category.color}
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${(category.value / 100) * 188.5} 188.5`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-900">{category.value}%</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-600">{category.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
                  <div className="h-64 flex items-end space-x-2">
                    {analyticsData.trends.sales.map((point, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${(point.value / Math.max(...analyticsData.trends.sales.map(p => p.value))) * 200}px` }}
                        ></div>
                        <span className="text-xs text-gray-600 mt-2">{formatDate(point.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory Flow */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Flow</h3>
                  <div className="h-64 flex items-end space-x-2">
                    {analyticsData.trends.inventory.map((point, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full space-y-1">
                          <div
                            className="w-full bg-green-500 rounded-t"
                            style={{ height: `${(point.inflow / 200) * 100}px` }}
                          ></div>
                          <div
                            className="w-full bg-red-500 rounded-b"
                            style={{ height: `${(point.outflow / 200) * 100}px` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 mt-2">{formatDate(point.date)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-4 mt-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Inflow</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Outflow</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(analyticsData.performance).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-2 capitalize">{key}</h4>
                    <div className="relative">
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div
                          style={{ width: `${value}%` }}
                          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                            value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        ></div>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {analyticsData.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    alert.type === 'error' ? 'bg-red-50 border-red-200' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    alert.type === 'success' ? 'bg-green-50 border-green-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">
                        {alert.type === 'error' ? '🚨' : 
                         alert.type === 'warning' ? '⚠️' : 
                         alert.type === 'success' ? '✅' : 'ℹ️'}
                      </span>
                      <span className={`text-sm font-medium ${
                        alert.type === 'error' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-yellow-800' :
                        alert.type === 'success' ? 'text-green-800' :
                        'text-blue-800'
                      }`}>
                        {alert.message}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
