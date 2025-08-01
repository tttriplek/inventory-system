import React, { useState, useEffect } from 'react';
import './FinancialTracker.css';

const FinancialTracker = () => {
    const [financialData, setFinancialData] = useState({
        summary: null,
        analysis: null,
        valuation: null,
        costBreakdown: null,
        ghanaMetrics: null,
        taxAnalysis: null,
        bankingIntegration: null
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [facilityId, setFacilityId] = useState('');
    const [currency, setCurrency] = useState('GHS'); // Ghana Cedi as default
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [alertThresholds, setAlertThresholds] = useState({
        highValue: 50000, // ₵50,000 for Ghana market
        lowStock: 5,
        depreciation: 20,
        vatThreshold: 200000, // Ghana VAT threshold
        currencyExposure: 15 // USD exposure alert at 15%
    });

    // Ghana-specific financial configurations
    const [ghanaConfig, setGhanaConfig] = useState({
        vatRate: 12.5, // Ghana VAT rate
        nhilRate: 2.5, // NHIL rate
        getfundRate: 2.5, // GETFUND rate
        covidLevyRate: 1.0, // COVID-19 levy
        currencyPairs: [
            { code: 'GHS', name: 'Ghana Cedi', symbol: '₵', rate: 1.0, flag: '🇬🇭' },
            { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.084, flag: '🇺🇸' },
            { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.076, flag: '🇪🇺' },
            { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.066, flag: '🇬🇧' },
            { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 63.2, flag: '🇳🇬' },
            { code: 'XOF', name: 'CFA Franc', symbol: 'CFA', rate: 50.8, flag: '🌍' }
        ],
        bankingPartners: [
            { name: 'GCB Bank', code: 'GCB', apiStatus: 'active', fees: 0.5 },
            { name: 'Ecobank Ghana', code: 'ECO', apiStatus: 'active', fees: 0.75 },
            { name: 'Stanbic Bank', code: 'SBG', apiStatus: 'active', fees: 0.6 },
            { name: 'Fidelity Bank', code: 'FBG', apiStatus: 'active', fees: 0.55 },
            { name: 'CAL Bank', code: 'CAL', apiStatus: 'active', fees: 0.65 },
            { name: 'Access Bank', code: 'ABG', apiStatus: 'active', fees: 0.7 }
        ],
        paymentMethods: [
            { name: 'Mobile Money (MTN)', fees: 1.0, dailyLimit: 10000 },
            { name: 'Mobile Money (Vodafone)', fees: 1.0, dailyLimit: 10000 },
            { name: 'Mobile Money (AirtelTigo)', fees: 1.2, dailyLimit: 8000 },
            { name: 'Bank Transfer (GH-Link)', fees: 0.25, dailyLimit: 50000 },
            { name: 'Cheque Payment', fees: 5.0, processingDays: 3 }
        ]
    });

    useEffect(() => {
        if (facilityId) {
            loadFinancialData();
            loadGhanaSpecificData();
        }
    }, [facilityId, currency, dateRange]);

    const loadFinancialData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                facilityId,
                currency,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                includeGhanaMetrics: 'true',
                vatRate: ghanaConfig.vatRate,
                region: 'ghana'
            });

            const [summaryRes, analysisRes, valuationRes, costRes, ghanaRes, taxRes, bankingRes] = await Promise.all([
                fetch(`/api/financial/summary?${params}`),
                fetch(`/api/financial/analysis?${params}`),
                fetch(`/api/financial/valuation?${params}`),
                fetch(`/api/financial/cost-breakdown?${params}`),
                fetch(`/api/financial/ghana-metrics?${params}`),
                fetch(`/api/financial/tax-analysis?${params}`),
                fetch(`/api/financial/banking-integration?${params}`)
            ]);

            const [summaryData, analysisData, valuationData, costData, ghanaData, taxData, bankingData] = await Promise.all([
                summaryRes.json(),
                analysisRes.json(),
                valuationRes.json(),
                costRes.json(),
                ghanaRes.json(),
                taxRes.json(),
                bankingRes.json()
            ]);

            setFinancialData({
                summary: summaryData.data,
                analysis: analysisData.data,
                valuation: valuationData.data,
                costBreakdown: costData.data,
                ghanaMetrics: ghanaData.data,
                taxAnalysis: taxData.data,
                bankingIntegration: bankingData.data
            });
        } catch (error) {
            console.error('Error loading financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGhanaSpecificData = async () => {
        try {
            // Load real-time exchange rates
            const exchangeRes = await fetch('/api/financial/exchange-rates?base=GHS');
            const exchangeData = await exchangeRes.json();
            
            if (exchangeData.success) {
                setGhanaConfig(prev => ({
                    ...prev,
                    currencyPairs: prev.currencyPairs.map(pair => ({
                        ...pair,
                        rate: exchangeData.rates[pair.code] || pair.rate,
                        lastUpdated: exchangeData.timestamp
                    }))
                }));
            }
        } catch (error) {
            console.error('Error loading Ghana-specific data:', error);
        }
    };

    const generateReport = async (reportType) => {
        try {
            const response = await fetch('/api/financial/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    facilityId,
                    reportType,
                    currency,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    ghanaCompliant: true,
                    includeVAT: true,
                    language: 'en', // Can be extended to 'tw' (Twi), 'ga' (Ga)
                    bankingPartner: ghanaConfig.bankingPartners[0]?.code
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(`${reportType} report generated successfully! Ghana tax compliance included.`);
                if (result.downloadUrl) {
                    window.open(result.downloadUrl, '_blank');
                }
            } else {
                alert('Error generating report: ' + result.message);
            }
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error generating report');
        }
    };

    const processPayment = async (paymentMethod, amount) => {
        try {
            const response = await fetch('/api/financial/process-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    facilityId,
                    paymentMethod,
                    amount,
                    currency,
                    includeVAT: true,
                    vatRate: ghanaConfig.vatRate
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Payment processed successfully through ' + paymentMethod);
                loadFinancialData();
            } else {
                alert('Payment failed: ' + result.message);
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Payment processing error');
        }
    };

    const updateThresholds = async () => {
        try {
            const response = await fetch('/api/financial/alert-thresholds', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    facilityId,
                    thresholds: alertThresholds,
                    ghanaCompliance: {
                        vatThreshold: alertThresholds.vatThreshold,
                        currencyExposureLimit: alertThresholds.currencyExposure
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Alert thresholds updated successfully with Ghana compliance!');
            } else {
                alert('Error updating thresholds: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating thresholds:', error);
            alert('Error updating thresholds');
        }
    };

    const formatCurrency = (amount, currencyCode = currency) => {
        const currencyInfo = ghanaConfig.currencyPairs.find(c => c.code === currencyCode);
        const symbol = currencyInfo?.symbol || currencyCode;
        
        if (currencyCode === 'GHS') {
            return `₵${(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const convertCurrency = (amount, fromCurrency, toCurrency) => {
        if (fromCurrency === toCurrency) return amount;
        
        const fromRate = ghanaConfig.currencyPairs.find(c => c.code === fromCurrency)?.rate || 1;
        const toRate = ghanaConfig.currencyPairs.find(c => c.code === toCurrency)?.rate || 1;
        
        return (amount / fromRate) * toRate;
    };

    const calculateGhanaTax = (amount) => {
        const vat = amount * (ghanaConfig.vatRate / 100);
        const nhil = amount * (ghanaConfig.nhilRate / 100);
        const getfund = amount * (ghanaConfig.getfundRate / 100);
        const covidLevy = amount * (ghanaConfig.covidLevyRate / 100);
        
        return {
            vat,
            nhil,
            getfund,
            covidLevy,
            total: vat + nhil + getfund + covidLevy,
            netAmount: amount + vat + nhil + getfund + covidLevy
        };
    };

    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(2)}%`;
    };

    const getTrendColor = (trend) => {
        if (trend > 0) return '#28a745';
        if (trend < 0) return '#dc3545';
        return '#6c757d';
    };

    const getTrendIcon = (trend) => {
        if (trend > 0) return '📈';
        if (trend < 0) return '📉';
        return '➡️';
    };

    if (loading && facilityId) {
        return (
            <div className="financial-tracker">
                <div className="loading">Loading financial data...</div>
            </div>
        );
    }

    return (
        <div className="financial-tracker ghana-enhanced">
            <div className="financial-header">
                <h2>💰 Ghana Financial Tracking & Analysis</h2>
                <div className="ghana-flag">🇬🇭</div>
                <div className="controls">
                    <div className="control-group">
                        <label>Facility ID:</label>
                        <input
                            type="text"
                            value={facilityId}
                            onChange={(e) => setFacilityId(e.target.value)}
                            placeholder="Enter facility ID"
                            className="facility-input"
                        />
                    </div>
                    <div className="control-group">
                        <label>Currency:</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="currency-select"
                        >
                            {ghanaConfig.currencyPairs.map(curr => (
                                <option key={curr.code} value={curr.code}>
                                    {curr.flag} {curr.symbol} {curr.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="control-group">
                        <label>Banking Partner:</label>
                        <select className="bank-select">
                            {ghanaConfig.bankingPartners.map(bank => (
                                <option key={bank.code} value={bank.code}>
                                    {bank.name} (Fees: {bank.fees}%)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {!facilityId ? (
                <div className="no-facility">
                    <div className="ghana-welcome">
                        <h3>Akwaaba! Welcome to Ghana Financial Tracking</h3>
                        <p>Please enter a facility ID to access comprehensive financial tracking with Ghana Cedi (₵) support</p>
                        <div className="feature-highlights">
                            <div className="highlight">✅ VAT & Tax Compliance</div>
                            <div className="highlight">✅ Mobile Money Integration</div>
                            <div className="highlight">✅ Multi-Currency Support</div>
                            <div className="highlight">✅ Banking API Integration</div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="date-controls ghana-style">
                        <div className="date-group">
                            <label>Start Date:</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({
                                    ...dateRange,
                                    startDate: e.target.value
                                })}
                            />
                        </div>
                        <div className="date-group">
                            <label>End Date:</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({
                                    ...dateRange,
                                    endDate: e.target.value
                                })}
                            />
                        </div>
                        <button onClick={loadFinancialData} className="refresh-button">
                            🔄 Refresh Data
                        </button>
                        <div className="exchange-rate-display">
                            <small>1 USD = ₵{(1/ghanaConfig.currencyPairs.find(c => c.code === 'USD')?.rate || 0.084).toFixed(2)}</small>
                        </div>
                    </div>

                    <div className="financial-tabs ghana-tabs">
                        <button 
                            className={activeTab === 'overview' ? 'active' : ''}
                            onClick={() => setActiveTab('overview')}
                        >
                            📊 Overview
                        </button>
                        <button 
                            className={activeTab === 'valuation' ? 'active' : ''}
                            onClick={() => setActiveTab('valuation')}
                        >
                            💎 Valuation
                        </button>
                        <button 
                            className={activeTab === 'costs' ? 'active' : ''}
                            onClick={() => setActiveTab('costs')}
                        >
                            📈 Cost Analysis
                        </button>
                        <button 
                            className={activeTab === 'taxes' ? 'active' : ''}
                            onClick={() => setActiveTab('taxes')}
                        >
                            🏛️ Tax Compliance
                        </button>
                        <button 
                            className={activeTab === 'payments' ? 'active' : ''}
                            onClick={() => setActiveTab('payments')}
                        >
                            💳 Payments & Banking
                        </button>
                        <button 
                            className={activeTab === 'alerts' ? 'active' : ''}
                            onClick={() => setActiveTab('alerts')}
                        >
                            🚨 Alerts & Thresholds
                        </button>
                        <button 
                            className={activeTab === 'reports' ? 'active' : ''}
                            onClick={() => setActiveTab('reports')}
                        >
                            📄 Reports
                        </button>
                    </div>

                    <div className="financial-content ghana-content">
                        {activeTab === 'overview' && (
                            <div className="financial-overview ghana-overview">
                                {/* Ghana Economic Indicators */}
                                <div className="ghana-indicators">
                                    <h3>🇬🇭 Ghana Economic Overview</h3>
                                    <div className="indicators-grid">
                                        <div className="indicator">
                                            <span>BoG Policy Rate:</span>
                                            <strong>{financialData.ghanaMetrics?.policyRate || '30.0'}%</strong>
                                        </div>
                                        <div className="indicator">
                                            <span>Inflation Rate:</span>
                                            <strong>{financialData.ghanaMetrics?.inflationRate || '23.6'}%</strong>
                                        </div>
                                        <div className="indicator">
                                            <span>USD/GHS Rate:</span>
                                            <strong>₵{(1/ghanaConfig.currencyPairs.find(c => c.code === 'USD')?.rate || 0.084).toFixed(2)}</strong>
                                        </div>
                                        <div className="indicator">
                                            <span>GSE Index:</span>
                                            <strong>{financialData.ghanaMetrics?.gseIndex || '3,156.2'}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="overview-grid ghana-grid">
                                    <div className="overview-card total-value ghana-card">
                                        <h3>Total Inventory Value</h3>
                                        <div className="card-value">
                                            {formatCurrency(financialData.summary?.totalValue)}
                                        </div>
                                        <div className="usd-equivalent">
                                            <small>≈ ${convertCurrency(financialData.summary?.totalValue || 0, currency, 'USD').toLocaleString()}</small>
                                        </div>
                                        <div className="card-trend">
                                            <span style={{ color: getTrendColor(financialData.summary?.valueChange) }}>
                                                {getTrendIcon(financialData.summary?.valueChange)}
                                                {formatPercentage(financialData.summary?.valueChange)}
                                            </span>
                                            <small>vs last period</small>
                                        </div>
                                    </div>

                                    <div className="overview-card acquisition-cost ghana-card">
                                        <h3>Total Acquisition Cost</h3>
                                        <div className="card-value">
                                            {formatCurrency(financialData.summary?.totalCost)}
                                        </div>
                                        <div className="tax-breakdown">
                                            <small>VAT Paid: {formatCurrency((financialData.summary?.totalCost || 0) * 0.125)}</small>
                                        </div>
                                        <div className="card-trend">
                                            <span style={{ color: getTrendColor(financialData.summary?.costChange) }}>
                                                {getTrendIcon(financialData.summary?.costChange)}
                                                {formatPercentage(financialData.summary?.costChange)}
                                            </span>
                                            <small>vs last period</small>
                                        </div>
                                    </div>

                                    <div className="overview-card depreciation ghana-card">
                                        <h3>Total Depreciation</h3>
                                        <div className="card-value">
                                            {formatCurrency(financialData.summary?.totalDepreciation)}
                                        </div>
                                        <div className="depreciation-note">
                                            <small>Tax deductible per Ghana Revenue Authority</small>
                                        </div>
                                        <div className="card-trend">
                                            <span style={{ color: getTrendColor(financialData.summary?.depreciationRate) }}>
                                                {formatPercentage(financialData.summary?.depreciationRate)}
                                            </span>
                                            <small>rate</small>
                                        </div>
                                    </div>

                                    <div className="overview-card roi ghana-card">
                                        <h3>Return on Investment</h3>
                                        <div className="card-value">
                                            {formatPercentage(financialData.summary?.roi)}
                                        </div>
                                        <div className="benchmark">
                                            <small>BoG Rate: 30.0% | GSE Return: 12.4%</small>
                                        </div>
                                        <div className="card-trend">
                                            <span style={{ color: getTrendColor(financialData.summary?.roiChange) }}>
                                                {getTrendIcon(financialData.summary?.roiChange)}
                                                {formatPercentage(Math.abs(financialData.summary?.roiChange))}
                                            </span>
                                            <small>vs last period</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Currency Exposure Analysis */}
                                <div className="currency-exposure">
                                    <h4>💱 Multi-Currency Exposure</h4>
                                    <div className="exposure-grid">
                                        {ghanaConfig.currencyPairs.slice(0, 4).map(curr => (
                                            <div key={curr.code} className="exposure-item">
                                                <div className="currency-header">
                                                    <span className="flag">{curr.flag}</span>
                                                    <span className="currency-name">{curr.code}</span>
                                                </div>
                                                <div className="exposure-value">
                                                    {formatCurrency(
                                                        convertCurrency(financialData.summary?.totalValue || 0, currency, curr.code),
                                                        curr.code
                                                    )}
                                                </div>
                                                <div className="exposure-percentage">
                                                    {curr.code === currency ? '100%' : 
                                                     `${((financialData.analysis?.currencyExposure?.[curr.code] || 0) * 100).toFixed(1)}%`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Ghana Banking Integration Status */}
                                <div className="banking-integration">
                                    <h4>🏦 Banking Integration Status</h4>
                                    <div className="bank-status-grid">
                                        {ghanaConfig.bankingPartners.slice(0, 3).map(bank => (
                                            <div key={bank.code} className="bank-status">
                                                <div className="bank-info">
                                                    <h5>{bank.name}</h5>
                                                    <span className={`status ${bank.apiStatus}`}>
                                                        {bank.apiStatus === 'active' ? '🟢' : '🔴'} {bank.apiStatus}
                                                    </span>
                                                </div>
                                                <div className="bank-fees">
                                                    <span>Transaction Fee: {bank.fees}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Mobile Money Integration */}
                                <div className="mobile-money">
                                    <h4>📱 Mobile Money Integration</h4>
                                    <div className="momo-providers">
                                        {ghanaConfig.paymentMethods.slice(0, 3).map((method, index) => (
                                            <div key={index} className="momo-provider">
                                                <div className="provider-info">
                                                    <span className="provider-name">{method.name}</span>
                                                    <span className="provider-fees">Fee: {method.fees}%</span>
                                                </div>
                                                <div className="daily-limit">
                                                    <small>Daily Limit: {formatCurrency(method.dailyLimit)}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="financial-charts ghana-charts">
                                    <div className="chart-section">
                                        <h4>Value Distribution by Category (Ghana Cedi)</h4>
                                        <div className="category-breakdown">
                                            {financialData.analysis?.categoryBreakdown?.map(category => (
                                                <div key={category.name} className="category-item ghana-category">
                                                    <div className="category-info">
                                                        <span className="category-name">{category.name}</span>
                                                        <span className="category-value">
                                                            {formatCurrency(category.value)}
                                                        </span>
                                                    </div>
                                                    <div className="category-bar">
                                                        <div 
                                                            className="category-fill"
                                                            style={{ 
                                                                width: `${category.percentage}%`,
                                                                backgroundColor: category.color || '#28a745'
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="category-percentage">
                                                        {formatPercentage(category.percentage)}
                                                    </span>
                                                    <div className="tax-implications">
                                                        <small>VAT: {formatCurrency(category.value * 0.125)}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="chart-section">
                                        <h4>High-Value Items (₵50,000+)</h4>
                                        <div className="high-value-items ghana-items">
                                            {financialData.analysis?.highValueItems?.map(item => (
                                                <div key={item.id} className="high-value-item ghana-item">
                                                    <div className="item-info">
                                                        <h5>{item.name}</h5>
                                                        <p>{item.category}</p>
                                                        <span className="item-location">📍 {item.location || 'Accra Warehouse'}</span>
                                                    </div>
                                                    <div className="item-values">
                                                        <div className="current-value">
                                                            <strong>{formatCurrency(item.currentValue)}</strong>
                                                            <small>Current Value</small>
                                                        </div>
                                                        <div className="acquisition-cost">
                                                            <span>{formatCurrency(item.acquisitionCost)}</span>
                                                            <small>Acquisition Cost</small>
                                                        </div>
                                                        <div className="tax-paid">
                                                            <span>{formatCurrency(item.acquisitionCost * 0.125)}</span>
                                                            <small>VAT Paid</small>
                                                        </div>
                                                    </div>
                                                    <div className="item-change">
                                                        <span style={{ color: getTrendColor(item.valueChange) }}>
                                                            {getTrendIcon(item.valueChange)}
                                                            {formatPercentage(Math.abs(item.valueChange))}
                                                        </span>
                                                    </div>
                                                    <div className="compliance-status">
                                                        <small className="gra-compliant">✅ GRA Compliant</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'taxes' && (
                            <div className="taxes-section ghana-taxes">
                                <h3>🏛️ Ghana Tax Compliance & Analysis</h3>
                                
                                {/* Tax Summary */}
                                <div className="tax-summary">
                                    <div className="tax-overview-grid">
                                        <div className="tax-card vat-card">
                                            <h4>VAT (12.5%)</h4>
                                            <div className="tax-amount">
                                                {formatCurrency((financialData.summary?.totalValue || 0) * (ghanaConfig.vatRate / 100))}
                                            </div>
                                            <small>Value Added Tax</small>
                                        </div>
                                        <div className="tax-card nhil-card">
                                            <h4>NHIL (2.5%)</h4>
                                            <div className="tax-amount">
                                                {formatCurrency((financialData.summary?.totalValue || 0) * (ghanaConfig.nhilRate / 100))}
                                            </div>
                                            <small>National Health Insurance Levy</small>
                                        </div>
                                        <div className="tax-card getfund-card">
                                            <h4>GETFUND (2.5%)</h4>
                                            <div className="tax-amount">
                                                {formatCurrency((financialData.summary?.totalValue || 0) * (ghanaConfig.getfundRate / 100))}
                                            </div>
                                            <small>Ghana Education Trust Fund</small>
                                        </div>
                                        <div className="tax-card covid-card">
                                            <h4>COVID-19 Levy (1.0%)</h4>
                                            <div className="tax-amount">
                                                {formatCurrency((financialData.summary?.totalValue || 0) * (ghanaConfig.covidLevyRate / 100))}
                                            </div>
                                            <small>COVID-19 Health Recovery Levy</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Tax Compliance Status */}
                                <div className="compliance-status">
                                    <h4>Compliance Status</h4>
                                    <div className="compliance-grid">
                                        <div className="compliance-item">
                                            <span className="compliance-label">VAT Registration:</span>
                                            <span className="status-badge compliant">✅ Registered</span>
                                            <small>TIN: GHA-123456789</small>
                                        </div>
                                        <div className="compliance-item">
                                            <span className="compliance-label">Monthly VAT Returns:</span>
                                            <span className="status-badge compliant">✅ Up to Date</span>
                                            <small>Last Filed: December 2024</small>
                                        </div>
                                        <div className="compliance-item">
                                            <span className="compliance-label">PAYE Compliance:</span>
                                            <span className="status-badge compliant">✅ Current</span>
                                            <small>Staff taxes current</small>
                                        </div>
                                        <div className="compliance-item">
                                            <span className="compliance-label">Social Security:</span>
                                            <span className="status-badge warning">⚠️ Review Needed</span>
                                            <small>SSNIT contributions due</small>
                                        </div>
                                    </div>
                                </div>

                                {/* VAT Calculator */}
                                <div className="vat-calculator">
                                    <h4>VAT Calculator</h4>
                                    <div className="calculator-form">
                                        <div className="calc-input-group">
                                            <label>Amount (₵):</label>
                                            <input
                                                type="number"
                                                placeholder="Enter amount"
                                                className="calc-input"
                                                onChange={(e) => {
                                                    const amount = parseFloat(e.target.value) || 0;
                                                    const taxes = calculateGhanaTax(amount);
                                                    // Update display
                                                }}
                                            />
                                        </div>
                                        <div className="calc-results">
                                            <div className="calc-result">
                                                <span>VAT (12.5%):</span>
                                                <strong>₵0.00</strong>
                                            </div>
                                            <div className="calc-result">
                                                <span>NHIL (2.5%):</span>
                                                <strong>₵0.00</strong>
                                            </div>
                                            <div className="calc-result">
                                                <span>GETFUND (2.5%):</span>
                                                <strong>₵0.00</strong>
                                            </div>
                                            <div className="calc-result total">
                                                <span>Total with Taxes:</span>
                                                <strong>₵0.00</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GRA Integration */}
                                <div className="gra-integration">
                                    <h4>Ghana Revenue Authority Integration</h4>
                                    <div className="gra-services">
                                        <div className="gra-service">
                                            <div className="service-icon">🏛️</div>
                                            <div className="service-info">
                                                <h5>Automated VAT Filing</h5>
                                                <p>Direct integration with GRA systems for seamless VAT return filing</p>
                                                <button className="service-button">Configure GRA API</button>
                                            </div>
                                        </div>
                                        <div className="gra-service">
                                            <div className="service-icon">📊</div>
                                            <div className="service-info">
                                                <h5>Real-time Tax Calculation</h5>
                                                <p>Automatic calculation of all applicable taxes for inventory transactions</p>
                                                <button className="service-button active">✅ Active</button>
                                            </div>
                                        </div>
                                        <div className="gra-service">
                                            <div className="service-icon">📋</div>
                                            <div className="service-info">
                                                <h5>Compliance Monitoring</h5>
                                                <p>Continuous monitoring of tax compliance and deadline reminders</p>
                                                <button className="service-button active">✅ Active</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tax Reports */}
                                <div className="tax-reports">
                                    <h4>Tax Reports & Documents</h4>
                                    <div className="report-options">
                                        <button 
                                            onClick={() => generateReport('vat-return')}
                                            className="tax-report-button"
                                        >
                                            📄 Generate VAT Return
                                        </button>
                                        <button 
                                            onClick={() => generateReport('tax-summary')}
                                            className="tax-report-button"
                                        >
                                            📊 Monthly Tax Summary
                                        </button>
                                        <button 
                                            onClick={() => generateReport('compliance-report')}
                                            className="tax-report-button"
                                        >
                                            ✅ Compliance Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="payments-section ghana-payments">
                                <h3>💳 Ghana Banking & Payment Systems</h3>

                                {/* Banking Overview */}
                                <div className="banking-overview">
                                    <h4>Connected Banking Partners</h4>
                                    <div className="banks-grid">
                                        {ghanaConfig.bankingPartners.map(bank => (
                                            <div key={bank.code} className="bank-card">
                                                <div className="bank-header">
                                                    <h5>{bank.name}</h5>
                                                    <span className={`bank-status ${bank.apiStatus}`}>
                                                        {bank.apiStatus === 'active' ? '🟢' : '🔴'}
                                                    </span>
                                                </div>
                                                <div className="bank-details">
                                                    <div className="bank-fee">
                                                        <span>Transaction Fee:</span>
                                                        <strong>{bank.fees}%</strong>
                                                    </div>
                                                    <div className="bank-actions">
                                                        <button className="bank-action-btn">
                                                            💰 Make Payment
                                                        </button>
                                                        <button className="bank-action-btn">
                                                            📊 View Transactions
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Mobile Money Integration */}
                                <div className="mobile-money-section">
                                    <h4>📱 Mobile Money Integration</h4>
                                    <div className="momo-grid">
                                        {ghanaConfig.paymentMethods.filter(method => method.name.includes('Mobile Money')).map((method, index) => (
                                            <div key={index} className="momo-card">
                                                <div className="momo-header">
                                                    <div className="momo-icon">
                                                        {method.name.includes('MTN') ? '🟡' : 
                                                         method.name.includes('Vodafone') ? '🔴' : '🟠'}
                                                    </div>
                                                    <h5>{method.name}</h5>
                                                </div>
                                                <div className="momo-details">
                                                    <div className="momo-info">
                                                        <span>Transaction Fee: {method.fees}%</span>
                                                        <span>Daily Limit: {formatCurrency(method.dailyLimit)}</span>
                                                    </div>
                                                    <div className="momo-actions">
                                                        <button 
                                                            onClick={() => processPayment(method.name, 1000)}
                                                            className="momo-pay-btn"
                                                        >
                                                            Send Payment
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Processing */}
                                <div className="payment-processing">
                                    <h4>Process New Payment</h4>
                                    <form className="payment-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Payment Method:</label>
                                                <select className="payment-method-select">
                                                    <optgroup label="Mobile Money">
                                                        <option value="mtn-momo">MTN Mobile Money</option>
                                                        <option value="vodafone-cash">Vodafone Cash</option>
                                                        <option value="airteltigo-money">AirtelTigo Money</option>
                                                    </optgroup>
                                                    <optgroup label="Banking">
                                                        <option value="gh-link">GH-Link Transfer</option>
                                                        <option value="bank-transfer">Direct Bank Transfer</option>
                                                        <option value="cheque">Cheque Payment</option>
                                                    </optgroup>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Amount (₵):</label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter amount"
                                                    className="amount-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Recipient:</label>
                                                <input
                                                    type="text"
                                                    placeholder="Phone number or account number"
                                                    className="recipient-input"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Purpose:</label>
                                                <select className="purpose-select">
                                                    <option value="inventory-purchase">Inventory Purchase</option>
                                                    <option value="supplier-payment">Supplier Payment</option>
                                                    <option value="operating-expense">Operating Expense</option>
                                                    <option value="tax-payment">Tax Payment</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="tax-calculation">
                                            <h5>Tax Breakdown:</h5>
                                            <div className="tax-breakdown">
                                                <span>VAT (12.5%): ₵0.00</span>
                                                <span>NHIL (2.5%): ₵0.00</span>
                                                <span>Total: ₵0.00</span>
                                            </div>
                                        </div>
                                        <button type="submit" className="process-payment-btn">
                                            💳 Process Payment
                                        </button>
                                    </form>
                                </div>

                                {/* Recent Transactions */}
                                <div className="recent-transactions">
                                    <h4>Recent Transactions</h4>
                                    <div className="transactions-list">
                                        {financialData.bankingIntegration?.recentTransactions?.map((transaction, index) => (
                                            <div key={index} className="transaction-item">
                                                <div className="transaction-info">
                                                    <h5>{transaction.description}</h5>
                                                    <span className="transaction-method">{transaction.method}</span>
                                                </div>
                                                <div className="transaction-amount">
                                                    <strong className={transaction.type === 'credit' ? 'credit' : 'debit'}>
                                                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                    </strong>
                                                    <small>{new Date(transaction.date).toLocaleDateString()}</small>
                                                </div>
                                                <div className="transaction-status">
                                                    <span className={`status ${transaction.status}`}>
                                                        {transaction.status === 'completed' ? '✅' : 
                                                         transaction.status === 'pending' ? '⏳' : '❌'}
                                                    </span>
                                                </div>
                                            </div>
                                        )) || (
                                            <div className="no-transactions">
                                                <p>No recent transactions found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'valuation' && (
                            <div className="valuation-section">
                                <div className="valuation-summary">
                                    <h3>Real-time Inventory Valuation</h3>
                                    <div className="valuation-grid">
                                        <div className="valuation-card">
                                            <h4>Market Value</h4>
                                            <div className="valuation-amount">
                                                {formatCurrency(financialData.valuation?.marketValue)}
                                            </div>
                                            <small>Based on current market prices</small>
                                        </div>
                                        <div className="valuation-card">
                                            <h4>Book Value</h4>
                                            <div className="valuation-amount">
                                                {formatCurrency(financialData.valuation?.bookValue)}
                                            </div>
                                            <small>Accounting book value</small>
                                        </div>
                                        <div className="valuation-card">
                                            <h4>Replacement Cost</h4>
                                            <div className="valuation-amount">
                                                {formatCurrency(financialData.valuation?.replacementCost)}
                                            </div>
                                            <small>Cost to replace inventory</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="valuation-details">
                                    <h4>Valuation Methodology</h4>
                                    <div className="methodology-list">
                                        <div className="methodology-item">
                                            <h5>FIFO (First In, First Out)</h5>
                                            <p>Current value: {formatCurrency(financialData.valuation?.fifoValue)}</p>
                                        </div>
                                        <div className="methodology-item">
                                            <h5>LIFO (Last In, First Out)</h5>
                                            <p>Current value: {formatCurrency(financialData.valuation?.lifoValue)}</p>
                                        </div>
                                        <div className="methodology-item">
                                            <h5>Weighted Average</h5>
                                            <p>Current value: {formatCurrency(financialData.valuation?.avgValue)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="insurance-section">
                                    <h4>Insurance Coverage Analysis</h4>
                                    <div className="insurance-grid">
                                        <div className="insurance-item">
                                            <span>Total Coverage Amount:</span>
                                            <strong>{formatCurrency(financialData.valuation?.insuranceCoverage)}</strong>
                                        </div>
                                        <div className="insurance-item">
                                            <span>Coverage Ratio:</span>
                                            <strong>{formatPercentage(financialData.valuation?.coverageRatio)}</strong>
                                        </div>
                                        <div className="insurance-item">
                                            <span>Underinsured Amount:</span>
                                            <strong className="risk-amount">
                                                {formatCurrency(financialData.valuation?.underinsuredAmount)}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'costs' && (
                            <div className="costs-section">
                                <h3>Cost Analysis</h3>
                                <div className="cost-breakdown">
                                    <div className="cost-category">
                                        <h4>Storage Costs</h4>
                                        <div className="cost-details">
                                            <div className="cost-item">
                                                <span>Facility Rent/Lease:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.facilityRent)}</strong>
                                            </div>
                                            <div className="cost-item">
                                                <span>Utilities:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.utilities)}</strong>
                                            </div>
                                            <div className="cost-item">
                                                <span>Security:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.security)}</strong>
                                            </div>
                                            <div className="cost-total">
                                                <span>Total Storage Costs:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.totalStorageCosts)}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="cost-category">
                                        <h4>Operational Costs</h4>
                                        <div className="cost-details">
                                            <div className="cost-item">
                                                <span>Labor:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.labor)}</strong>
                                            </div>
                                            <div className="cost-item">
                                                <span>Transportation:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.transportation)}</strong>
                                            </div>
                                            <div className="cost-item">
                                                <span>Maintenance:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.maintenance)}</strong>
                                            </div>
                                            <div className="cost-total">
                                                <span>Total Operational Costs:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.totalOperationalCosts)}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="cost-category">
                                        <h4>Carrying Costs</h4>
                                        <div className="cost-details">
                                            <div className="cost-item">
                                                <span>Insurance:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.insurance)}</strong>
                                            </div>
                                            <div className="cost-item">
                                                <span>Taxes:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.taxes)}</strong>
                                            </div>
                                            <div className="cost-item">
                                                <span>Obsolescence:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.obsolescence)}</strong>
                                            </div>
                                            <div className="cost-total">
                                                <span>Total Carrying Costs:</span>
                                                <strong>{formatCurrency(financialData.costBreakdown?.totalCarryingCosts)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="cost-per-unit">
                                    <h4>Cost Per Unit Analysis</h4>
                                    <div className="cost-efficiency">
                                        <div className="efficiency-metric">
                                            <span>Storage Cost per Item:</span>
                                            <strong>{formatCurrency(financialData.costBreakdown?.costPerItem)}</strong>
                                        </div>
                                        <div className="efficiency-metric">
                                            <span>Storage Cost per Cubic Foot:</span>
                                            <strong>{formatCurrency(financialData.costBreakdown?.costPerCubicFoot)}</strong>
                                        </div>
                                        <div className="efficiency-metric">
                                            <span>Turnover Rate:</span>
                                            <strong>{formatPercentage(financialData.costBreakdown?.turnoverRate)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'alerts' && (
                            <div className="alerts-section ghana-alerts">
                                <h3>🚨 Financial Alerts & Ghana Compliance Thresholds</h3>
                                <div className="threshold-settings">
                                    <h4>Configure Alert Thresholds</h4>
                                    <div className="threshold-form">
                                        <div className="threshold-group">
                                            <label>High Value Threshold:</label>
                                            <input
                                                type="number"
                                                value={alertThresholds.highValue}
                                                onChange={(e) => setAlertThresholds({
                                                    ...alertThresholds,
                                                    highValue: parseFloat(e.target.value)
                                                })}
                                                className="threshold-input"
                                            />
                                            <span className="threshold-currency">{currency}</span>
                                        </div>
                                        <div className="threshold-group">
                                            <label>Low Stock Alert (units):</label>
                                            <input
                                                type="number"
                                                value={alertThresholds.lowStock}
                                                onChange={(e) => setAlertThresholds({
                                                    ...alertThresholds,
                                                    lowStock: parseInt(e.target.value)
                                                })}
                                                className="threshold-input"
                                            />
                                        </div>
                                        <div className="threshold-group">
                                            <label>Depreciation Alert (%):</label>
                                            <input
                                                type="number"
                                                value={alertThresholds.depreciation}
                                                onChange={(e) => setAlertThresholds({
                                                    ...alertThresholds,
                                                    depreciation: parseFloat(e.target.value)
                                                })}
                                                className="threshold-input"
                                            />
                                            <span className="threshold-percent">%</span>
                                        </div>
                                        <button onClick={updateThresholds} className="update-button">
                                            Update Thresholds
                                        </button>
                                    </div>
                                </div>

                                <div className="active-alerts">
                                    <h4>Active Financial Alerts</h4>
                                    <div className="alerts-list">
                                        {financialData.analysis?.alerts?.map((alert, index) => (
                                            <div key={index} className={`alert-item ${alert.severity}`}>
                                                <div className="alert-icon">
                                                    {alert.severity === 'critical' ? '🚨' : 
                                                     alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                                                </div>
                                                <div className="alert-content">
                                                    <h5>{alert.title}</h5>
                                                    <p>{alert.message}</p>
                                                    <small>{alert.timestamp}</small>
                                                </div>
                                                <div className="alert-value">
                                                    <strong>{alert.value}</strong>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="reports-section ghana-reports">
                                <h3>📄 Ghana Financial Reports & Compliance Documents</h3>
                                
                                <div className="report-categories">
                                    {/* Ghana Tax Reports */}
                                    <div className="report-category">
                                        <h4>🏛️ Ghana Tax & Compliance Reports</h4>
                                        <div className="report-types">
                                            <div className="report-type ghana-tax-report">
                                                <div className="report-icon">📊</div>
                                                <div className="report-info">
                                                    <h5>VAT Return Report</h5>
                                                    <p>Monthly VAT return ready for GRA submission with supporting documentation</p>
                                                    <div className="report-features">
                                                        <span>✅ GRA Format</span>
                                                        <span>✅ Auto-calculated</span>
                                                        <span>✅ Supporting docs</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => generateReport('vat-return')}
                                                    className="generate-report-button ghana-button"
                                                >
                                                    Generate VAT Return
                                                </button>
                                            </div>

                                            <div className="report-type ghana-tax-report">
                                                <div className="report-icon">🏛️</div>
                                                <div className="report-info">
                                                    <h5>PAYE & SSNIT Report</h5>
                                                    <p>Employee tax and social security contributions report</p>
                                                    <div className="report-features">
                                                        <span>✅ SSNIT Format</span>
                                                        <span>✅ Employee breakdown</span>
                                                        <span>✅ Contribution summary</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => generateReport('paye-ssnit')}
                                                    className="generate-report-button ghana-button"
                                                >
                                                    Generate PAYE Report
                                                </button>
                                            </div>

                                            <div className="report-type ghana-tax-report">
                                                <div className="report-icon">📋</div>
                                                <div className="report-info">
                                                    <h5>Tax Compliance Certificate</h5>
                                                    <p>Comprehensive tax compliance status report for business licensing</p>
                                                    <div className="report-features">
                                                        <span>✅ All taxes covered</span>
                                                        <span>✅ Compliance status</span>
                                                        <span>✅ Official format</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => generateReport('tax-compliance')}
                                                    className="generate-report-button ghana-button"
                                                >
                                                    Generate Certificate
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Analysis Reports */}
                                    <div className="report-category">
                                        <h4>💰 Financial Analysis Reports</h4>
                                        <div className="report-types">
                                            <div className="report-type ghana-financial-report">
                                                <div className="report-icon">💎</div>
                                                <div className="report-info">
                                                    <h5>Inventory Valuation Report (Ghana Cedi)</h5>
                                                    <p>Comprehensive inventory valuation with Ghana Cedi as base currency</p>
                                                    <div className="report-features">
                                                        <span>✅ Multiple methodologies</span>
                                                        <span>✅ Exchange rate impact</span>
                                                        <span>✅ Tax implications</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => generateReport('valuation')}
                                                    className="generate-report-button ghana-button"
                                                >
                                                    Generate Valuation
                                                </button>
                                            </div>

                                            <div className="report-type ghana-financial-report">
                                                <div className="report-icon">📈</div>
                                                <div className="report-info">
                                                    <h5>Cost Analysis Report</h5>
                                                    <p>Detailed cost breakdown including Ghana-specific operational costs</p>
                                                    <div className="report-features">
                                                        <span>✅ Local cost factors</span>
                                                        <span>✅ Currency exposure</span>
                                                        <span>✅ Tax breakdown</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => generateReport('cost-analysis')}
                                                    className="generate-report-button ghana-button"
                                                >
                                                    Generate Cost Analysis
                                                </button>
                                            </div>

                                            <div className="report-type ghana-financial-report">
                                                <div className="report-icon">🎯</div>
                                                <div className="report-info">
                                                    <h5>ROI Analysis Report</h5>
                                                    <p>Return on investment analysis benchmarked against Ghana economic indicators</p>
                                                    <div className="report-features">
                                                        <span>✅ BoG rate comparison</span>
                                                        <span>✅ GSE benchmarks</span>
                                                        <span>✅ Inflation adjusted</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => generateReport('roi-analysis')}
                                                    className="generate-report-button ghana-button"
                                                >
                                                    Generate ROI Report
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Banking & Payment Reports */}
                                    <div className="report-category">
                                        <h4>🏦 Banking & Payment Reports</h4>
                                        <div className="report-types">
                                            <div className="report-type ghana-banking-report">
                                                <div className="report-icon">💳</div>
                                                <div className="report-info">
                                                    <h5>Banking Transaction Summary</h5>
                                                    <p>Comprehensive report of all banking transactions across Ghana banks</p>
                                                    <div className="report-features">
                                                        <span>✅ Multi-bank support</span>
                                                        <span>✅ Transaction analysis</span>
                                                        <span>✅ Fee breakdown</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => generateReport('banking-summary')}
                                                    className="generate-report-button ghana-button"
                                                >
                                                    Generate Banking Report
                                                </button>
                                            </div>

                                            <div className="report-type ghana-banking-report">
                                                <div className="report-icon">📱</div>
                                                <div className="report-info">
                                                    <h5>Mobile Money Transaction Report</h5>
                                                    <p>Analysis of Mobile Money transactions across MTN, Vodafone, and AirtelTigo</p>
                                                    <div className="report-features">
                                                        <span>✅ All networks</span>
                                                        <span>✅ Cost optimization</span>
                                                        <span>✅ Usage patterns</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => generateReport('mobile-money')}
                                                    className="generate-report-button ghana-button"
                                                >
                                                    Generate MoMo Report
                                                </button>
                                            </div>

                                            <div className="report-type ghana-banking-report">
                                                <div className="report-icon">💱</div>
                                                <div className="report-info">
                                                    <h5>Currency Exposure Report</h5>
                                                    <p>Multi-currency exposure analysis with risk assessment</p>
                                                    <div className="report-features">
                                                        <span>✅ Exchange rate risk</span>
                                                        <span>✅ Hedging recommendations</span>
                                                        <span>✅ Impact analysis</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => generateReport('currency-exposure')}
                                                    className="generate-report-button ghana-button"
                                                >
                                                    Generate FX Report
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Report Settings */}
                                <div className="report-settings">
                                    <h4>⚙️ Report Configuration</h4>
                                    <div className="settings-grid">
                                        <div className="setting-group">
                                            <label>Language:</label>
                                            <select className="setting-select">
                                                <option value="en">English</option>
                                                <option value="tw">Twi</option>
                                                <option value="ga">Ga</option>
                                            </select>
                                        </div>
                                        <div className="setting-group">
                                            <label>Currency Display:</label>
                                            <select className="setting-select">
                                                <option value="GHS">Ghana Cedi (₵)</option>
                                                <option value="dual">Dual Currency (₵ & $)</option>
                                                <option value="USD">US Dollar ($)</option>
                                            </select>
                                        </div>
                                        <div className="setting-group">
                                            <label>Tax Compliance:</label>
                                            <select className="setting-select">
                                                <option value="full">Full Ghana Compliance</option>
                                                <option value="basic">Basic Reporting</option>
                                            </select>
                                        </div>
                                        <div className="setting-group">
                                            <label>Banking Integration:</label>
                                            <select className="setting-select">
                                                <option value="all">All Connected Banks</option>
                                                <option value="primary">Primary Bank Only</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="quick-actions">
                                    <h4>🚀 Quick Actions</h4>
                                    <div className="action-buttons">
                                        <button 
                                            onClick={() => generateReport('monthly-summary')}
                                            className="quick-action-btn primary"
                                        >
                                            📊 Monthly Summary
                                        </button>
                                        <button 
                                            onClick={() => generateReport('tax-package')}
                                            className="quick-action-btn tax"
                                        >
                                            🏛️ Complete Tax Package
                                        </button>
                                        <button 
                                            onClick={() => generateReport('management-dashboard')}
                                            className="quick-action-btn management"
                                        >
                                            📈 Management Dashboard
                                        </button>
                                        <button 
                                            onClick={() => generateReport('compliance-audit')}
                                            className="quick-action-btn audit"
                                        >
                                            ✅ Compliance Audit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default FinancialTracker;
