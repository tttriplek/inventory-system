import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';

const SecurityCompliance = () => {
  const { currentFacility } = useFacility();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('week');

  const [securityData, setSecurityData] = useState({
    overview: {
      securityScore: 94,
      complianceScore: 89,
      activeThreats: 2,
      lastAudit: '2025-07-15',
      certificationsExpiring: 1
    },
    threats: [
      { 
        id: 1, 
        type: 'Unauthorized Access Attempt', 
        severity: 'High', 
        status: 'Active', 
        timestamp: '2025-08-01 14:30',
        source: 'External IP: 192.168.1.45',
        action: 'Login blocked, admin notified'
      },
      { 
        id: 2, 
        type: 'Unusual Data Export', 
        severity: 'Medium', 
        status: 'Investigating', 
        timestamp: '2025-08-01 09:15',
        source: 'User: john.doe@company.com',
        action: 'Export flagged for review'
      }
    ],
    compliance: [
      { 
        standard: 'ISO 27001', 
        status: 'Compliant', 
        lastAudit: '2025-06-15', 
        nextAudit: '2025-12-15', 
        score: 95,
        requirements: { total: 114, compliant: 108, pending: 6 }
      },
      { 
        standard: 'GDPR', 
        status: 'Compliant', 
        lastAudit: '2025-07-01', 
        nextAudit: '2026-01-01', 
        score: 92,
        requirements: { total: 28, compliant: 26, pending: 2 }
      },
      { 
        standard: 'SOX', 
        status: 'Partial', 
        lastAudit: '2025-05-20', 
        nextAudit: '2025-11-20', 
        score: 78,
        requirements: { total: 45, compliant: 35, pending: 10 }
      }
    ],
    accessLogs: [
      { user: 'admin@company.com', action: 'Login Success', timestamp: '2025-08-01 15:45', ip: '192.168.1.10' },
      { user: 'jane.smith@company.com', action: 'Data Export', timestamp: '2025-08-01 15:30', ip: '192.168.1.25' },
      { user: 'system', action: 'Backup Completed', timestamp: '2025-08-01 15:00', ip: 'localhost' },
      { user: 'unknown', action: 'Failed Login', timestamp: '2025-08-01 14:30', ip: '192.168.1.45' }
    ]
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'compliant': return 'bg-green-100 text-green-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'non-compliant': return 'bg-red-100 text-red-700';
      case 'active': return 'bg-red-100 text-red-700';
      case 'investigating': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Security Overview', icon: '🛡️' },
    { id: 'threats', label: 'Threat Detection', icon: '⚠️' },
    { id: 'compliance', label: 'Compliance Status', icon: '📋' },
    { id: 'access', label: 'Access Logs', icon: '🔍' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-2xl">🛡️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Security & Compliance</h1>
                <p className="text-gray-600">Advanced security monitoring & compliance tracking - {currentFacility?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Security Score</p>
                <p className="text-2xl font-bold text-green-600">{securityData.overview.securityScore}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Compliance Score</p>
                <p className="text-2xl font-bold text-blue-600">{securityData.overview.complianceScore}%</p>
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
                      ? 'border-red-500 text-red-600'
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
            {/* Security Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Security Score</p>
                        <p className="text-2xl font-bold text-green-700">{securityData.overview.securityScore}%</p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 text-lg">🛡️</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Compliance Score</p>
                        <p className="text-2xl font-bold text-blue-700">{securityData.overview.complianceScore}%</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 text-lg">📋</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-600 font-medium">Active Threats</p>
                        <p className="text-2xl font-bold text-red-700">{securityData.overview.activeThreats}</p>
                      </div>
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-600 text-lg">⚠️</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">Expiring Certs</p>
                        <p className="text-2xl font-bold text-yellow-700">{securityData.overview.certificationsExpiring}</p>
                      </div>
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-yellow-600 text-lg">📜</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ghana-specific Compliance */}
                <div className="bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🇬🇭</span>
                    Ghana Regulatory Compliance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">GIPC Compliance</p>
                          <p className="text-lg font-bold text-green-600">100%</p>
                        </div>
                        <span className="text-green-500 text-xl">✅</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">GRA Tax Compliance</p>
                          <p className="text-lg font-bold text-green-600">98%</p>
                        </div>
                        <span className="text-green-500 text-xl">✅</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Data Protection Act</p>
                          <p className="text-lg font-bold text-yellow-600">85%</p>
                        </div>
                        <span className="text-yellow-500 text-xl">⚠️</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Threat Detection Tab */}
            {activeTab === 'threats' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Active Security Threats</h3>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700">
                    🚨 Emergency Protocol
                  </button>
                </div>
                
                {securityData.threats.map((threat) => (
                  <div key={threat.id} className={`border-l-4 ${
                    threat.severity === 'High' ? 'border-red-500 bg-red-50' :
                    threat.severity === 'Medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-green-500 bg-green-50'
                  } p-4 rounded-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">{threat.type}</h4>
                        <p className="text-sm text-gray-600">{threat.timestamp} - {threat.source}</p>
                        <p className="text-sm text-gray-700 mt-1">{threat.action}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(threat.severity)}`}>
                          {threat.severity}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(threat.status)}`}>
                          {threat.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Compliance Tab */}
            {activeTab === 'compliance' && (
              <div className="space-y-6">
                {securityData.compliance.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{item.standard}</h4>
                        <p className="text-sm text-gray-600">Last audit: {item.lastAudit} | Next: {item.nextAudit}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Compliance Score</p>
                          <p className="text-2xl font-bold text-blue-600">{item.score}%</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-2xl font-bold text-gray-900">{item.requirements.total}</p>
                        <p className="text-sm text-gray-600">Total Requirements</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-2xl font-bold text-green-600">{item.requirements.compliant}</p>
                        <p className="text-sm text-gray-600">Compliant</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-2xl font-bold text-red-600">{item.requirements.pending}</p>
                        <p className="text-sm text-gray-600">Pending</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Access Logs Tab */}
            {activeTab === 'access' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Access Activity</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">IP Address</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityData.accessLogs.map((log, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold">{log.user}</td>
                          <td className="py-3 px-4">{log.action}</td>
                          <td className="py-3 px-4 font-mono text-sm">{log.timestamp}</td>
                          <td className="py-3 px-4 font-mono text-sm">{log.ip}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              log.action.includes('Failed') ? 'bg-red-100 text-red-700' :
                              log.action.includes('Success') ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {log.action.includes('Failed') ? 'Failed' : 'Success'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityCompliance;
