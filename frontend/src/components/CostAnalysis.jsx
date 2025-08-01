import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';

const CostAnalysis = () => {
  const { currentFacility } = useFacility();
  const [timeframe, setTimeframe] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [costData, setCostData] = useState({
    totalCosts: {
      current: 125000,
      previous: 118500,
      change: 5.5
    },
    breakdown: [
      { category: 'Storage & Handling', amount: 45000, percentage: 36, trend: 2.3 },
      { category: 'Transportation', amount: 32000, percentage: 25.6, trend: -1.2 },
      { category: 'Labor', amount: 28000, percentage: 22.4, trend: 4.1 },
      { category: 'Utilities', amount: 12000, percentage: 9.6, trend: 8.5 },
      { category: 'Insurance', amount: 5500, percentage: 4.4, trend: 0.8 },
      { category: 'Other', amount: 2500, percentage: 2.0, trend: -5.2 }
    ],
    forecast: [
      { month: 'Jan', actual: 118500, predicted: 120000 },
      { month: 'Feb', actual: 122000, predicted: 121500 },
      { month: 'Mar', actual: 125000, predicted: 124000 },
      { month: 'Apr', actual: null, predicted: 127500 },
      { month: 'May', actual: null, predicted: 129000 },
      { month: 'Jun', actual: null, predicted: 131200 }
    ]
  });

  const formatCurrency = (amount) => {
    return `₵${amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return '📈';
    if (trend < 0) return '📉';
    return '➡️';
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-red-600';
    if (trend < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Advanced Cost Analysis</h1>
                <p className="text-gray-600">Comprehensive cost tracking & forecasting - {currentFacility?.name}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {['week', 'month', 'quarter', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                    timeframe === period
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cost Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Costs</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(costData.totalCosts.current)}</p>
                <p className={`text-sm ${getTrendColor(costData.totalCosts.change)}`}>
                  {getTrendIcon(costData.totalCosts.change)} {Math.abs(costData.totalCosts.change)}% vs last {timeframe}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cost per Item</p>
                <p className="text-2xl font-bold text-gray-900">₵28.50</p>
                <p className="text-sm text-green-600">📉 -2.1% efficiency gain</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Variance</p>
                <p className="text-2xl font-bold text-gray-900">₵8,200</p>
                <p className="text-sm text-red-600">📈 +6.8% over budget</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Forecast Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">92.4%</p>
                <p className="text-sm text-green-600">📈 +1.2% improvement</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🔮</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cost Breakdown</h2>
            
            <div className="space-y-4">
              {costData.breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{item.category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">{formatCurrency(item.amount)}</span>
                        <span className={`text-sm ${getTrendColor(item.trend)}`}>
                          {getTrendIcon(item.trend)} {Math.abs(item.trend)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{item.percentage}% of total</span>
                      <span className="text-xs text-gray-500">₵{(item.amount/1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Forecast */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">6-Month Cost Forecast</h2>
            
            <div className="space-y-3">
              {costData.forecast.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                  <div className="font-semibold text-gray-700">{month.month} 2025</div>
                  <div className="flex space-x-4">
                    {month.actual && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Actual</p>
                        <p className="font-semibold text-green-600">{formatCurrency(month.actual)}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Predicted</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(month.predicted)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">🔮 AI Insights</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Transportation costs showing downward trend (-1.2%)</li>
                <li>• Utility costs rising due to seasonal changes (+8.5%)</li>
                <li>• Consider bulk purchasing to reduce handling costs</li>
                <li>• Labor efficiency improving (+4.1% productivity gain)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Cost Analysis</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost Center</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Month</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Previous Month</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Change</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Budget</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Variance</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {costData.breakdown.map((item, index) => {
                  const previous = item.amount / (1 + item.trend/100);
                  const budget = item.amount * 0.95; // Assume 5% under budget target
                  const variance = ((item.amount - budget) / budget) * 100;
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold">{item.category}</td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(item.amount)}</td>
                      <td className="py-3 px-4 font-mono text-gray-600">{formatCurrency(previous)}</td>
                      <td className={`py-3 px-4 font-semibold ${getTrendColor(item.trend)}`}>
                        {getTrendIcon(item.trend)} {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">{formatCurrency(budget)}</td>
                      <td className={`py-3 px-4 font-semibold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          variance > 10 ? 'bg-red-100 text-red-700' :
                          variance > 0 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {variance > 10 ? 'Over Budget' : variance > 0 ? 'Watch' : 'On Track'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostAnalysis;
