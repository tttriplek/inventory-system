import React, { useState, useEffect } from 'react';
import './AuditDashboard.css';

const AuditDashboard = () => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [complianceReports, setComplianceReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [facilityId, setFacilityId] = useState('');
    const [dateFilter, setDateFilter] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [actionFilter, setActionFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('');

    useEffect(() => {
        if (facilityId) {
            loadAuditData();
        }
    }, [facilityId, dateFilter, actionFilter, userFilter]);

    const loadAuditData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                facilityId,
                startDate: dateFilter.startDate,
                endDate: dateFilter.endDate,
                ...(actionFilter !== 'all' && { action: actionFilter }),
                ...(userFilter && { userId: userFilter })
            });

            const [logsRes, reportsRes] = await Promise.all([
                fetch(`/api/audit/logs?${params}`),
                fetch(`/api/audit/compliance-reports/${facilityId}`)
            ]);

            const [logsData, reportsData] = await Promise.all([
                logsRes.json(),
                reportsRes.json()
            ]);

            setAuditLogs(logsData.data || []);
            setComplianceReports(reportsData.data || []);
        } catch (error) {
            console.error('Error loading audit data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateComplianceReport = async (standard) => {
        try {
            const response = await fetch('/api/audit/generate-compliance-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    facilityId,
                    standard,
                    startDate: dateFilter.startDate,
                    endDate: dateFilter.endDate
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(`${standard} compliance report generated successfully!`);
                loadAuditData(); // Refresh the data
            } else {
                alert('Error generating report: ' + result.message);
            }
        } catch (error) {
            console.error('Error generating compliance report:', error);
            alert('Error generating compliance report');
        }
    };

    const exportAuditLogs = async () => {
        try {
            const params = new URLSearchParams({
                facilityId,
                startDate: dateFilter.startDate,
                endDate: dateFilter.endDate,
                ...(actionFilter !== 'all' && { action: actionFilter }),
                ...(userFilter && { userId: userFilter })
            });

            const response = await fetch(`/api/audit/export?${params}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `audit_logs_${facilityId}_${dateFilter.startDate}_${dateFilter.endDate}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Error exporting audit logs');
            }
        } catch (error) {
            console.error('Error exporting audit logs:', error);
            alert('Error exporting audit logs');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString() + ' ' + 
               new Date(dateString).toLocaleTimeString();
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return '#28a745';
            case 'UPDATE': return '#ffc107';
            case 'DELETE': return '#dc3545';
            case 'ACCESS': return '#17a2b8';
            case 'LOGIN': return '#6f42c1';
            case 'LOGOUT': return '#6c757d';
            default: return '#007bff';
        }
    };

    const getRiskLevel = (score) => {
        if (score >= 90) return { level: 'Low', color: '#28a745' };
        if (score >= 70) return { level: 'Medium', color: '#ffc107' };
        if (score >= 50) return { level: 'High', color: '#fd7e14' };
        return { level: 'Critical', color: '#dc3545' };
    };

    const getUniqueActions = () => {
        const actions = [...new Set(auditLogs.map(log => log.action))];
        return actions.sort();
    };

    const getUniqueUsers = () => {
        const users = [...new Set(auditLogs.map(log => log.userId))];
        return users.sort();
    };

    const getActivityStats = () => {
        const stats = {
            totalActions: auditLogs.length,
            uniqueUsers: getUniqueUsers().length,
            actionBreakdown: {},
            userActivity: {},
            recentActivity: auditLogs.slice(0, 10)
        };

        auditLogs.forEach(log => {
            stats.actionBreakdown[log.action] = (stats.actionBreakdown[log.action] || 0) + 1;
            stats.userActivity[log.userId] = (stats.userActivity[log.userId] || 0) + 1;
        });

        return stats;
    };

    const stats = getActivityStats();

    if (loading && facilityId) {
        return (
            <div className="audit-dashboard">
                <div className="loading">Loading audit data...</div>
            </div>
        );
    }

    return (
        <div className="audit-dashboard">
            <div className="audit-header">
                <h2>🔒 Audit & Compliance Dashboard</h2>
                <div className="facility-selector">
                    <label>Facility ID:</label>
                    <input
                        type="text"
                        value={facilityId}
                        onChange={(e) => setFacilityId(e.target.value)}
                        placeholder="Enter facility ID"
                        className="facility-input"
                    />
                </div>
            </div>

            {!facilityId ? (
                <div className="no-facility">
                    <p>Please enter a facility ID to access audit features</p>
                </div>
            ) : (
                <>
                    <div className="audit-controls">
                        <div className="filters">
                            <div className="filter-group">
                                <label>Start Date:</label>
                                <input
                                    type="date"
                                    value={dateFilter.startDate}
                                    onChange={(e) => setDateFilter({
                                        ...dateFilter,
                                        startDate: e.target.value
                                    })}
                                />
                            </div>
                            <div className="filter-group">
                                <label>End Date:</label>
                                <input
                                    type="date"
                                    value={dateFilter.endDate}
                                    onChange={(e) => setDateFilter({
                                        ...dateFilter,
                                        endDate: e.target.value
                                    })}
                                />
                            </div>
                            <div className="filter-group">
                                <label>Action:</label>
                                <select
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                >
                                    <option value="all">All Actions</option>
                                    {getUniqueActions().map(action => (
                                        <option key={action} value={action}>{action}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>User:</label>
                                <select
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                >
                                    <option value="">All Users</option>
                                    {getUniqueUsers().map(user => (
                                        <option key={user} value={user}>{user}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="export-controls">
                            <button onClick={exportAuditLogs} className="export-button">
                                📊 Export Logs
                            </button>
                        </div>
                    </div>

                    <div className="audit-tabs">
                        <button 
                            className={activeTab === 'overview' ? 'active' : ''}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button 
                            className={activeTab === 'logs' ? 'active' : ''}
                            onClick={() => setActiveTab('logs')}
                        >
                            Audit Logs
                        </button>
                        <button 
                            className={activeTab === 'compliance' ? 'active' : ''}
                            onClick={() => setActiveTab('compliance')}
                        >
                            Compliance
                        </button>
                        <button 
                            className={activeTab === 'analytics' ? 'active' : ''}
                            onClick={() => setActiveTab('analytics')}
                        >
                            Analytics
                        </button>
                    </div>

                    <div className="audit-content">
                        {activeTab === 'overview' && (
                            <div className="audit-overview">
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <h3>Total Actions</h3>
                                        <div className="stat-number">{stats.totalActions}</div>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Active Users</h3>
                                        <div className="stat-number">{stats.uniqueUsers}</div>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Compliance Reports</h3>
                                        <div className="stat-number">{complianceReports.length}</div>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Date Range</h3>
                                        <div className="stat-text">
                                            {Math.ceil((new Date(dateFilter.endDate) - new Date(dateFilter.startDate)) / (1000 * 60 * 60 * 24))} days
                                        </div>
                                    </div>
                                </div>

                                <div className="recent-activity">
                                    <h3>Recent Activity</h3>
                                    <div className="activity-list">
                                        {stats.recentActivity.map(log => (
                                            <div key={log.id} className="activity-item">
                                                <div className="activity-info">
                                                    <span 
                                                        className="action-badge"
                                                        style={{ backgroundColor: getActionColor(log.action) }}
                                                    >
                                                        {log.action}
                                                    </span>
                                                    <span className="activity-description">
                                                        {log.description || `${log.action} performed on ${log.entityType}`}
                                                    </span>
                                                    <span className="activity-user">by {log.userId}</span>
                                                </div>
                                                <div className="activity-time">
                                                    {formatDate(log.timestamp)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <div className="audit-logs">
                                <h3>Audit Logs ({auditLogs.length} entries)</h3>
                                <div className="logs-table">
                                    <div className="table-header">
                                        <div>Timestamp</div>
                                        <div>Action</div>
                                        <div>User</div>
                                        <div>Entity</div>
                                        <div>Description</div>
                                        <div>IP Address</div>
                                    </div>
                                    {auditLogs.map(log => (
                                        <div key={log.id} className="table-row">
                                            <div className="log-time">{formatDate(log.timestamp)}</div>
                                            <div>
                                                <span 
                                                    className="action-badge small"
                                                    style={{ backgroundColor: getActionColor(log.action) }}
                                                >
                                                    {log.action}
                                                </span>
                                            </div>
                                            <div className="log-user">{log.userId}</div>
                                            <div className="log-entity">
                                                {log.entityType}
                                                {log.entityId && <small>#{log.entityId}</small>}
                                            </div>
                                            <div className="log-description">
                                                {log.description || 'No description'}
                                            </div>
                                            <div className="log-ip">{log.ipAddress || 'N/A'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'compliance' && (
                            <div className="compliance-section">
                                <h3>Compliance Management</h3>
                                
                                <div className="compliance-standards">
                                    <h4>Generate Compliance Reports</h4>
                                    <div className="standards-grid">
                                        {['SOX', 'GDPR', 'HIPAA', 'ISO27001'].map(standard => (
                                            <div key={standard} className="standard-card">
                                                <h5>{standard}</h5>
                                                <p>Generate compliance report for {standard} standards</p>
                                                <button 
                                                    onClick={() => generateComplianceReport(standard)}
                                                    className="generate-button"
                                                >
                                                    Generate {standard} Report
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="existing-reports">
                                    <h4>Existing Compliance Reports</h4>
                                    {complianceReports.length === 0 ? (
                                        <p>No compliance reports generated yet.</p>
                                    ) : (
                                        <div className="reports-list">
                                            {complianceReports.map(report => {
                                                const risk = getRiskLevel(report.complianceScore);
                                                return (
                                                    <div key={report.id} className="report-item">
                                                        <div className="report-header">
                                                            <h5>{report.standard} Report</h5>
                                                            <div 
                                                                className="risk-badge"
                                                                style={{ backgroundColor: risk.color }}
                                                            >
                                                                {risk.level} Risk
                                                            </div>
                                                        </div>
                                                        <div className="report-details">
                                                            <p><strong>Compliance Score:</strong> {report.complianceScore}%</p>
                                                            <p><strong>Generated:</strong> {formatDate(report.generatedAt)}</p>
                                                            <p><strong>Period:</strong> {report.startDate} to {report.endDate}</p>
                                                            <p><strong>Findings:</strong> {report.findings?.length || 0} issues identified</p>
                                                        </div>
                                                        {report.findings && report.findings.length > 0 && (
                                                            <div className="report-findings">
                                                                <h6>Key Findings:</h6>
                                                                <ul>
                                                                    {report.findings.slice(0, 3).map((finding, index) => (
                                                                        <li key={index}>{finding}</li>
                                                                    ))}
                                                                    {report.findings.length > 3 && (
                                                                        <li>... and {report.findings.length - 3} more</li>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="audit-analytics">
                                <h3>Audit Analytics</h3>
                                
                                <div className="analytics-grid">
                                    <div className="analytics-card">
                                        <h4>Action Breakdown</h4>
                                        <div className="breakdown-list">
                                            {Object.entries(stats.actionBreakdown)
                                                .sort(([,a], [,b]) => b - a)
                                                .map(([action, count]) => (
                                                <div key={action} className="breakdown-item">
                                                    <span 
                                                        className="action-badge small"
                                                        style={{ backgroundColor: getActionColor(action) }}
                                                    >
                                                        {action}
                                                    </span>
                                                    <span className="breakdown-count">{count}</span>
                                                    <div className="breakdown-bar">
                                                        <div 
                                                            className="breakdown-fill"
                                                            style={{ 
                                                                width: `${(count / stats.totalActions) * 100}%`,
                                                                backgroundColor: getActionColor(action)
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="analytics-card">
                                        <h4>User Activity</h4>
                                        <div className="user-activity-list">
                                            {Object.entries(stats.userActivity)
                                                .sort(([,a], [,b]) => b - a)
                                                .slice(0, 10)
                                                .map(([user, count]) => (
                                                <div key={user} className="user-activity-item">
                                                    <span className="user-name">{user}</span>
                                                    <span className="activity-count">{count} actions</span>
                                                    <div className="activity-bar">
                                                        <div 
                                                            className="activity-fill"
                                                            style={{ 
                                                                width: `${(count / Math.max(...Object.values(stats.userActivity))) * 100}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="time-analysis">
                                    <h4>Activity Timeline</h4>
                                    <p>Detailed timeline analysis would be displayed here with charts showing activity patterns over time.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AuditDashboard;
