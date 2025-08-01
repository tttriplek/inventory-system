import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import { useFeatures } from '../contexts/FeatureContext';

const FinancialDashboard = () => {
  const { currentFacility } = useFacility();
  const { isFeatureEnabled, loading: featuresLoading } = useFeatures();
  
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Check if financial features are enabled
  const isFinancialTrackingEnabled = isFeatureEnabled('financial-tracking');
  const isMultiCurrencyEnabled = isFeatureEnabled('multi-currency-support');
  const isCostAnalysisEnabled = isFeatureEnabled('cost-analysis');

  // Show not enabled message if feature is disabled
  if (featuresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isFinancialTrackingEnabled) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-blue-600 text-4xl mb-4">💰</div>
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Financial Tracking Not Enabled</h2>
          <p className="text-blue-700 mb-4">
            Financial tracking features are not enabled for this facility. 
            Enable financial tracking to access comprehensive cost analysis and inventory valuation.
          </p>
          <div className="text-sm text-blue-600">
            Available in Financial Hub and Enterprise facility types
          </div>
        </div>
      </div>
    );
  }

  // Mock financial data - in real app, this would come from backend
  const mockFinancialData = {
    summary: {
      totalInventoryValue: 2456789.50,
      monthlyTurnover: 345678.90,
      averageCostPerUnit: 145.67,
      profitMargin: 23.5,
      lastUpdated: new Date()
    },
    breakdown: {
      byCategory: [
        { category: 'Jewelry', value: 1800000, percentage: 73.2, items: 156 },
        { category: 'Precious Metals', value: 450000, percentage: 18.3, items: 89 },
        { category: 'Gemstones', value: 150000, percentage: 6.1, items: 234 },
        { category: 'Watches', value: 56789.50, percentage: 2.4, items: 45 }
      ],
      byLocation: [
        { location: 'Vault A', value: 1200000, securityLevel: 'Maximum' },
        { location: 'Display Cases', value: 800000, securityLevel: 'High' },
        { location: 'Processing Area', value: 300000, securityLevel: 'Medium' },
        { location: 'Quality Control', value: 156789.50, securityLevel: 'High' }
      ]
    },
    costing: {
      method: 'Specific Identification',
      lastRecalculation: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      accuracy: 99.8,
      totalCostLayers: 1247
    },
    alerts: [
      {
        type: 'valuation',
        severity: 'warning',
        message: 'Gold prices increased 2.3% - Consider revaluation',
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        type: 'insurance',
        severity: 'info',
        message: 'Insurance coverage review due in 15 days',
        timestamp: new Date(Date.now() - 1000 * 60 * 60)
      }
    ],
    trends: {
      dailyValues: [
        { date: '2025-07-25', value: 2400000 },
        { date: '2025-07-26', value: 2420000 },
        { date: '2025-07-27', value: 2435000 },
        { date: '2025-07-28', value: 2445000 },
        { date: '2025-07-29', value: 2456789.50 }
      ]
    }
  };

  useEffect(() => {
    if (currentFacility && isFinancialTrackingEnabled) {
      // Simulate API call
      setTimeout(() => {
        setFinancialData(mockFinancialData);
        setLoading(false);
      }, 1000);
    }
  }, [currentFacility, isFinancialTrackingEnabled]);

  const formatCurrency = (amount, currency = selectedCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading Financial Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="text-3xl mr-3">💰</span>
              Financial Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Advanced inventory valuation and cost analysis for {currentFacility?.name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {isMultiCurrencyEnabled && (
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            )}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Inventory Value</p>
              <p className="text-2xl font-bold">
                {formatCurrency(financialData.summary.totalInventoryValue)}
              </p>
            </div>
            <span className="text-3xl">💎</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Monthly Turnover</p>
              <p className="text-2xl font-bold">
                {formatCurrency(financialData.summary.monthlyTurnover)}
              </p>
            </div>
            <span className="text-3xl">🔄</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Cost Per Unit</p>
              <p className="text-2xl font-bold">
                {formatCurrency(financialData.summary.averageCostPerUnit)}
              </p>
            </div>
            <span className="text-3xl">📊</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Profit Margin</p>
              <p className="text-2xl font-bold">{financialData.summary.profitMargin}%</p>
            </div>
            <span className="text-3xl">📈</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {financialData.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Alerts</h3>
          <div className="space-y-3">
            {financialData.alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{alert.message}</span>
                  <span className="text-sm">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Value by Category</h3>
          <div className="space-y-4">
            {financialData.breakdown.byCategory.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(item.value)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{item.items} items</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Value by Location */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Value by Location</h3>
          <div className="space-y-4">
            {financialData.breakdown.byLocation.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{item.location}</div>
                  <div className="text-sm text-gray-500">Security: {item.securityLevel}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Costing Information */}
      {isCostAnalysisEnabled && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{financialData.costing.method}</div>
              <div className="text-sm text-gray-500">Costing Method</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{financialData.costing.accuracy}%</div>
              <div className="text-sm text-gray-500">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{financialData.costing.totalCostLayers}</div>
              <div className="text-sm text-gray-500">Cost Layers</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Last recalculation: {new Date(financialData.costing.lastRecalculation).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;
