import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';

const InsuranceIntegration = () => {
  const { currentFacility } = useFacility();
  const [activeTab, setActiveTab] = useState('coverage');

  const [insuranceData, setInsuranceData] = useState({
    overview: {
      totalCoverage: 15000000, // 15M GHS
      premiumsPaid: 185000,
      activeClaims: 2,
      claimsThisYear: 8,
      coverageUtilization: 78
    },
    policies: [
      {
        id: 'POL-001',
        provider: 'SIC Insurance Company Ltd',
        type: 'Property Insurance',
        coverage: 8000000,
        premium: 85000,
        deductible: 50000,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'Active',
        country: '🇬🇭 Ghana'
      },
      {
        id: 'POL-002',
        provider: 'Enterprise Insurance',
        type: 'Cargo Insurance',
        coverage: 5000000,
        premium: 65000,
        deductible: 25000,
        startDate: '2025-02-15',
        endDate: '2026-02-15',
        status: 'Active',
        country: '🇬🇭 Ghana'
      },
      {
        id: 'POL-003',
        provider: 'Ghana Union Assurance',
        type: 'Business Interruption',
        coverage: 2000000,
        premium: 35000,
        deductible: 15000,
        startDate: '2024-12-01',
        endDate: '2025-11-30',
        status: 'Expiring Soon',
        country: '🇬🇭 Ghana'
      }
    ],
    claims: [
      {
        id: 'CLM-2025-001',
        type: 'Water Damage',
        amount: 45000,
        status: 'Under Review',
        dateReported: '2025-07-20',
        estimatedSettlement: '2025-08-15',
        description: 'Inventory damage due to roof leak in Section A',
        adjuster: 'Kwame Asante - SIC Insurance'
      },
      {
        id: 'CLM-2025-002',
        type: 'Theft',
        amount: 12500,
        status: 'Approved',
        dateReported: '2025-07-10',
        estimatedSettlement: '2025-08-05',
        description: 'Missing electronics from warehouse',
        adjuster: 'Ama Osei - Enterprise Insurance'
      }
    ],
    riskAssessment: {
      overallRisk: 'Medium',
      factors: [
        { factor: 'Location Risk', score: 7, trend: 'stable' },
        { factor: 'Inventory Value', score: 8, trend: 'increasing' },
        { factor: 'Security Measures', score: 9, trend: 'improving' },
        { factor: 'Weather Exposure', score: 6, trend: 'seasonal' },
        { factor: 'Staff Training', score: 8, trend: 'stable' }
      ]
    }
  });

  const formatCurrency = (amount) => {
    return `₵${amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'expiring soon': return 'bg-yellow-100 text-yellow-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'under review': return 'bg-blue-100 text-blue-700';
      case 'denied': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRiskColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const tabs = [
    { id: 'coverage', label: 'Coverage Overview', icon: '🛡️' },
    { id: 'policies', label: 'Active Policies', icon: '📋' },
    { id: 'claims', label: 'Claims Management', icon: '📄' },
    { id: 'risk', label: 'Risk Assessment', icon: '⚖️' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-2xl">🛡️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Insurance Integration</h1>
                <p className="text-gray-600">Comprehensive insurance management for Ghana - {currentFacility?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Coverage</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(insuranceData.overview.totalCoverage)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Active Claims</p>
                <p className="text-2xl font-bold text-yellow-600">{insuranceData.overview.activeClaims}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Coverage</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(insuranceData.overview.totalCoverage)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">🛡️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Premiums Paid</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(insuranceData.overview.premiumsPaid)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Claims</p>
                <p className="text-xl font-bold text-yellow-600">{insuranceData.overview.activeClaims}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-lg">📄</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Claims This Year</p>
                <p className="text-xl font-bold text-purple-600">{insuranceData.overview.claimsThisYear}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coverage Usage</p>
                <p className="text-xl font-bold text-indigo-600">{insuranceData.overview.coverageUtilization}%</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 text-lg">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Coverage Overview Tab */}
            {activeTab === 'coverage' && (
              <div className="space-y-6">
                {/* Ghana Insurance Companies */}
                <div className="bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🇬🇭</span>
                    Ghana Insurance Partners
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">SIC Insurance</p>
                          <p className="text-sm text-gray-600">Property & Asset Coverage</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(8000000)}</p>
                        </div>
                        <span className="text-green-500 text-xl">✅</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">Enterprise Insurance</p>
                          <p className="text-sm text-gray-600">Cargo & Transit</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(5000000)}</p>
                        </div>
                        <span className="text-green-500 text-xl">✅</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">Ghana Union Assurance</p>
                          <p className="text-sm text-gray-600">Business Interruption</p>
                          <p className="text-lg font-bold text-yellow-600">{formatCurrency(2000000)}</p>
                        </div>
                        <span className="text-yellow-500 text-xl">⚠️</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coverage Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Coverage by Type</h4>
                    {insuranceData.policies.map((policy, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg mb-3">
                        <div>
                          <p className="font-semibold">{policy.type}</p>
                          <p className="text-sm text-gray-600">{policy.provider}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{formatCurrency(policy.coverage)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(policy.status)}`}>
                            {policy.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Monthly Premium Breakdown</h4>
                    {insuranceData.policies.map((policy, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg mb-3">
                        <div>
                          <p className="font-semibold">{policy.type}</p>
                          <p className="text-sm text-gray-600">Monthly Premium</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{formatCurrency(policy.premium / 12)}</p>
                          <p className="text-xs text-gray-500">Annual: {formatCurrency(policy.premium)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active Policies Tab */}
            {activeTab === 'policies' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Active Insurance Policies</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    + Add New Policy
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Policy ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Provider</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Coverage</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Premium</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Expires</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insuranceData.policies.map((policy) => (
                        <tr key={policy.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-sm">{policy.id}</td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold">{policy.provider}</p>
                              <p className="text-sm text-gray-600">{policy.country}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">{policy.type}</td>
                          <td className="py-3 px-4 font-semibold text-blue-600">{formatCurrency(policy.coverage)}</td>
                          <td className="py-3 px-4 font-semibold text-purple-600">{formatCurrency(policy.premium)}</td>
                          <td className="py-3 px-4 font-mono text-sm">{policy.endDate}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(policy.status)}`}>
                              {policy.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Claims Management Tab */}
            {activeTab === 'claims' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Claims Management</h3>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">
                    + File New Claim
                  </button>
                </div>

                {insuranceData.claims.map((claim) => (
                  <div key={claim.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{claim.type} - {claim.id}</h4>
                        <p className="text-sm text-gray-600">Reported: {claim.dateReported} | Expected Settlement: {claim.estimatedSettlement}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Claim Amount</p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(claim.amount)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(claim.status)}`}>
                          {claim.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-gray-700 mb-2"><strong>Description:</strong> {claim.description}</p>
                      <p className="text-gray-700"><strong>Adjuster:</strong> {claim.adjuster}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Risk Assessment Tab */}
            {activeTab === 'risk' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Risk Assessment</h3>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-4xl">⚖️</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{insuranceData.riskAssessment.overallRisk}</p>
                      <p className="text-sm text-gray-600">Risk Level</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insuranceData.riskAssessment.factors.map((factor, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{factor.factor}</p>
                          <p className="text-sm text-gray-600 capitalize">{factor.trend}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getRiskColor(factor.score)}`}>{factor.score}/10</p>
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                factor.score >= 8 ? 'bg-green-500' :
                                factor.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${factor.score * 10}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceIntegration;
