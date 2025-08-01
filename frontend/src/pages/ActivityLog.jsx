import React, { useState, useEffect, useCallback } from 'react';
import { useFacility } from '../contexts/FacilityContext';
import { useFeatures } from '../contexts/FeatureContext';

const ActivityLog = () => {
  const { currentFacility } = useFacility();
  const { isFeatureEnabled, loading: featuresLoading } = useFeatures();
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedContent, setCopiedContent] = useState('');

  // Check if activity log feature is enabled
  const isActivityLogEnabled = isFeatureEnabled('activity-log') || isFeatureEnabled('activityLog');

  // Show not enabled message if feature is disabled
  if (featuresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isActivityLogEnabled) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-blue-600 text-4xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Activity Log Not Enabled</h2>
          <p className="text-blue-700">
            Activity Log feature is not enabled for this facility. 
            Contact your administrator to enable this feature.
          </p>
        </div>
      </div>
    );
  }
  // Mock activity data - in real app, this would come from backend
  const mockActivities = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      type: 'product_movement',
      action: 'MOVED',
      entity: 'Product',
      entityId: 'PROD-001',
      entityName: 'iPhone 14 Pro',
      details: {
        from: 'Warehouse A - Zone 1 - Aisle 3 - Bin 12',
        to: 'Warehouse A - Zone 2 - Aisle 1 - Bin 5',
        quantity: 25,
        reason: 'Stock reorganization'
      },
      user: 'John Doe',
      facilityId: currentFacility?._id,
      severity: 'info'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      type: 'batch_movement',
      action: 'INBOUND',
      entity: 'Batch',
      entityId: 'BATCH-2024-001',
      entityName: 'Samsung Galaxy S24 - Batch 001',
      details: {
        from: 'External Supplier',
        to: 'Warehouse A - Zone 1 - Aisle 1 - Bin 8',
        quantity: 100,
        batchId: 'BATCH-2024-001',
        expiryDate: '2025-12-31'
      },
      user: 'Sarah Smith',
      facilityId: currentFacility?._id,
      severity: 'success'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      type: 'product_movement',
      action: 'OUTBOUND',
      entity: 'Product',
      entityId: 'PROD-002',
      entityName: 'MacBook Pro M3',
      details: {
        from: 'Warehouse A - Zone 2 - Aisle 2 - Bin 15',
        to: 'Customer Order #12345',
        quantity: 5,
        reason: 'Customer fulfillment'
      },
      user: 'Mike Johnson',
      facilityId: currentFacility?._id,
      severity: 'info'
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
      type: 'system_alert',
      action: 'ALERT',
      entity: 'Storage',
      entityId: 'BIN-025',
      entityName: 'Warehouse A - Zone 1 - Aisle 5 - Bin 25',
      details: {
        alertType: 'capacity_exceeded',
        currentUtilization: 95,
        threshold: 85,
        message: 'Storage bin exceeded capacity threshold'
      },
      user: 'System',
      facilityId: currentFacility?._id,
      severity: 'warning'
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      type: 'batch_movement',
      action: 'EXPIRED',
      entity: 'Batch',
      entityId: 'BATCH-2023-089',
      entityName: 'Organic Milk - Batch 089',
      details: {
        location: 'Warehouse A - Zone 3 - Aisle 1 - Bin 2',
        quantity: 12,
        expiryDate: '2025-01-30',
        daysOverdue: 1,
        action_taken: 'Removed from inventory'
      },
      user: 'Emily Davis',
      facilityId: currentFacility?._id,
      severity: 'error'
    },
    {
      id: 6,
      timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
      type: 'storage_change',
      action: 'CREATED',
      entity: 'Storage Section',
      entityId: 'SECTION-NEW-001',
      entityName: 'Warehouse B - Zone 1',
      details: {
        sectionType: 'zone',
        capacity: 500,
        parentSection: 'Warehouse B',
        configuration: 'Electronics storage zone'
      },
      user: 'Admin User',
      facilityId: currentFacility?._id,
      severity: 'info'
    }
  ];

  useEffect(() => {
    if (currentFacility && !featuresLoading) {
      // In real app, fetch activities from backend
      setActivities(mockActivities);
      setLoading(false);
    }
  }, [currentFacility, featuresLoading]);

  const filteredActivities = activities.filter(activity => {
    // Filter by type
    if (filter !== 'all' && activity.type !== filter) return false;
    
    // Filter by time range
    const now = new Date();
    const activityTime = new Date(activity.timestamp);
    const diffHours = (now - activityTime) / (1000 * 60 * 60);
    
    switch (timeRange) {
      case '1h':
        if (diffHours > 1) return false;
        break;
      case '24h':
        if (diffHours > 24) return false;
        break;
      case '7d':
        if (diffHours > 168) return false; // 7 days
        break;
      case '30d':
        if (diffHours > 720) return false; // 30 days
        break;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        activity.entityName.toLowerCase().includes(searchLower) ||
        activity.action.toLowerCase().includes(searchLower) ||
        activity.user.toLowerCase().includes(searchLower) ||
        JSON.stringify(activity.details).toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const handleCopyActivities = () => {
    const activitiesText = filteredActivities.map(activity => {
      const timestamp = new Date(activity.timestamp).toLocaleString();
      const details = JSON.stringify(activity.details, null, 2);
      return `[${timestamp}] ${activity.action} - ${activity.entityName}\nUser: ${activity.user}\nDetails: ${details}\n${'='.repeat(80)}`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(activitiesText).then(() => {
      setCopiedContent('Activities copied to clipboard!');
      setTimeout(() => setCopiedContent(''), 3000);
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'product_movement': return '📦';
      case 'batch_movement': return '🔄';
      case 'system_alert': return '⚠️';
      case 'storage_change': return '🏗️';
      case 'user_action': return '👤';
      default: return '📋';
    }
  };

  if (featuresLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading Activity Log...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-gray-600 mt-1">Complete audit trail of all facility operations</p>
          </div>
          <div className="flex items-center space-x-3">
            {copiedContent && (
              <span className="text-green-600 text-sm">{copiedContent}</span>
            )}
            <button
              onClick={handleCopyActivities}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              📋 Copy Activities
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Activity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">All Activities</option>
              <option value="product_movement">Product Movement</option>
              <option value="batch_movement">Batch Movement</option>
              <option value="system_alert">System Alerts</option>
              <option value="storage_change">Storage Changes</option>
              <option value="user_action">User Actions</option>
            </select>
          </div>

          {/* Time Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search activities, products, users..."
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📊</span>
            <div>
              <p className="text-sm font-medium text-blue-600">Total Activities</p>
              <p className="text-2xl font-bold text-blue-900">{filteredActivities.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <p className="text-sm font-medium text-green-600">Successful</p>
              <p className="text-2xl font-bold text-green-900">
                {filteredActivities.filter(a => a.severity === 'success' || a.severity === 'info').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-600">Warnings</p>
              <p className="text-2xl font-bold text-yellow-900">
                {filteredActivities.filter(a => a.severity === 'warning').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">❌</span>
            <div>
              <p className="text-sm font-medium text-red-600">Errors</p>
              <p className="text-2xl font-bold text-red-900">
                {filteredActivities.filter(a => a.severity === 'error').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Activity Timeline ({filteredActivities.length} activities)
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredActivities.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <span className="text-4xl mb-4 block">📋</span>
              <h3 className="text-lg font-medium mb-2">No activities found</h3>
              <p className="text-sm">Adjust your filters to see more activities</p>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4">
                <div className="flex items-start space-x-4">
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          {activity.action} - {activity.entityName}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(activity.severity)}`}>
                          {activity.severity.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">User:</span> {activity.user} • 
                      <span className="font-medium"> Type:</span> {activity.type.replace('_', ' ')}
                    </p>
                    
                    {/* Activity Details */}
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">Details</h5>
                      <div className="space-y-1 text-sm">
                        {Object.entries(activity.details).map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="font-medium text-gray-700 w-24 capitalize">
                              {key.replace('_', ' ')}:
                            </span>
                            <span className="text-gray-600 flex-1">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
