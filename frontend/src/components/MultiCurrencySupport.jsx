import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';

const MultiCurrencySupport = () => {
  const { currentFacility } = useFacility();
  const [exchangeRates, setExchangeRates] = useState({
    'GHS': { rate: 1.0, symbol: '₵', name: 'Ghana Cedi', flag: '🇬🇭' },
    'USD': { rate: 0.082, symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    'EUR': { rate: 0.075, symbol: '€', name: 'Euro', flag: '🇪🇺' },
    'GBP': { rate: 0.065, symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    'NGN': { rate: 128.50, symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
    'ZAR': { rate: 1.52, symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
    'KES': { rate: 10.75, symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
    'JPY': { rate: 12.10, symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    'CNY': { rate: 0.59, symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  });

  const [baseCurrency, setBaseCurrency] = useState('GHS');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [amount, setAmount] = useState(1000);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [inventoryValues, setInventoryValues] = useState({
    totalValue: 2847650.00, // In GHS
    categories: [
      { name: 'Electronics', value: 1250000.00, items: 1250 },
      { name: 'Clothing', value: 850000.00, items: 2100 },
      { name: 'Food & Beverages', value: 450000.00, items: 890 },
      { name: 'Home & Garden', value: 297650.00, items: 675 }
    ]
  });

  const convertAmount = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to base currency (GHS) first
    const baseAmount = fromCurrency === 'GHS' ? amount : amount / exchangeRates[fromCurrency].rate;
    
    // Convert from base to target currency
    const convertedAmount = toCurrency === 'GHS' ? baseAmount : baseAmount * exchangeRates[toCurrency].rate;
    
    return convertedAmount;
  };

  const formatCurrency = (amount, currency) => {
    const currencyInfo = exchangeRates[currency];
    return `${currencyInfo.symbol}${amount.toLocaleString('en-GH', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const updateExchangeRates = () => {
    // Simulate live rate updates (in real app, this would call an API)
    setExchangeRates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(currency => {
        if (currency !== 'GHS') {
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          updated[currency].rate = Math.max(0.001, prev[currency].rate * (1 + variation));
        }
      });
      return updated;
    });
    setLastUpdated(new Date());
  };

  useEffect(() => {
    if (autoUpdate) {
      const interval = setInterval(updateExchangeRates, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoUpdate]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-yellow-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-2xl">💱</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Multi-Currency Support</h1>
                <p className="text-gray-600">Powered by Ghana Cedi (₵) - {currentFacility?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-semibold">{lastUpdated.toLocaleTimeString('en-GH')}</p>
              </div>
              <button
                onClick={() => setAutoUpdate(!autoUpdate)}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  autoUpdate 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {autoUpdate ? '🔄 Auto Update ON' : '⏸️ Auto Update OFF'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Currency Converter */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Currency Converter</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {Object.entries(exchangeRates).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.flag} {code} - {info.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <select
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {Object.entries(exchangeRates).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.flag} {code} - {info.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Converted Amount</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(convertAmount(amount, baseCurrency, targetCurrency), targetCurrency)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      1 {baseCurrency} = {formatCurrency(convertAmount(1, baseCurrency, targetCurrency), targetCurrency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rates Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Live Exchange Rates (Base: GHS ₵)</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Currency</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rate</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">1 GHS =</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">1000 GHS =</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(exchangeRates).map(([code, info]) => (
                      <tr key={code} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="text-2xl mr-2">{info.flag}</span>
                            <div>
                              <p className="font-semibold">{code}</p>
                              <p className="text-sm text-gray-600">{info.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            code === 'GHS' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {code === 'GHS' ? 'Base' : info.rate.toFixed(4)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {code === 'GHS' ? '₵1.00' : `${info.symbol}${info.rate.toFixed(4)}`}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          {formatCurrency(code === 'GHS' ? 1000 : 1000 * info.rate, code)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Valuation in Multiple Currencies */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory Valuation by Currency</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {['GHS', 'USD', 'EUR', 'GBP'].map((currency) => (
              <div key={currency} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(convertAmount(inventoryValues.totalValue, 'GHS', currency), currency)}
                    </p>
                  </div>
                  <span className="text-2xl">{exchangeRates[currency].flag}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">GHS (₵)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">USD ($)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">EUR (€)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">GBP (£)</th>
                </tr>
              </thead>
              <tbody>
                {inventoryValues.categories.map((category, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">{category.name}</td>
                    <td className="py-3 px-4 text-gray-600">{category.items.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">{formatCurrency(category.value, 'GHS')}</td>
                    <td className="py-3 px-4 font-mono">{formatCurrency(convertAmount(category.value, 'GHS', 'USD'), 'USD')}</td>
                    <td className="py-3 px-4 font-mono">{formatCurrency(convertAmount(category.value, 'GHS', 'EUR'), 'EUR')}</td>
                    <td className="py-3 px-4 font-mono">{formatCurrency(convertAmount(category.value, 'GHS', 'GBP'), 'GBP')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiCurrencySupport;