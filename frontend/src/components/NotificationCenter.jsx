import React, { useState, useEffect } from 'react';
import { useFacility } from '../contexts/FacilityContext';

const NotificationCenter = () => {
  const { currentFacility } = useFacility();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChannel, setSelectedChannel] = useState('all');

  const [notificationData, setNotificationData] = useState({
    overview: {
      totalSent: 2847,
      deliveryRate: 96.8,
      activeChannels: 5,
      unreadCount: 12,
      monthlyGrowth: 15.3
    },
    recentNotifications: [
      {
        id: 'NOT-001',
        type: 'Low Stock Alert',
        title: 'Low Stock: Samsung Galaxy A54 📱',
        message: 'Only 5 units remaining. Reorder recommended.',
        recipient: 'inventory@company.com',
        channel: 'Email + SMS',
        status: 'Delivered',
        timestamp: '2025-08-01 15:30',
        priority: 'High',
        cost: '₵2.50'
      },
      {
        id: 'NOT-002',
        type: 'Financial Alert',
        title: 'Daily Sales Report 📊',
        message: 'Today\'s sales: ₵125,450 (+12% from yesterday)',
        recipient: 'management@company.com',
        channel: 'Email + WhatsApp',
        status: 'Delivered',
        timestamp: '2025-08-01 14:00',
        priority: 'Medium',
        cost: '₵1.80'
      },
      {
        id: 'NOT-003',
        type: 'Security Alert',
        title: 'Unauthorized Access Attempt 🚨',
        message: 'Failed login attempt detected from IP: 192.168.1.45',
        recipient: 'security@company.com',
        channel: 'SMS + Push',
        status: 'Delivered',
        timestamp: '2025-08-01 14:30',
        priority: 'Critical',
        cost: '₵3.20'
      }
    ],
    channels: [
      {
        name: 'Email',
        icon: '📧',
        status: 'Active',
        sent: 1250,
        delivered: 1205,
        deliveryRate: 96.4,
        cost: '₵0.50',
        provider: 'Ghana Post Digital Services'
      },
      {
        name: 'SMS',
        icon: '📱',
        status: 'Active',
        sent: 890,
        delivered: 875,
        deliveryRate: 98.3,
        cost: '₵1.20',
        provider: 'MTN Ghana / Vodafone'
      },
      {
        name: 'WhatsApp Business',
        icon: '💬',
        status: 'Active',
        sent: 450,
        delivered: 438,
        deliveryRate: 97.3,
        cost: '₵0.80',
        provider: 'WhatsApp Business API'
      },
      {
        name: 'Push Notifications',
        icon: '🔔',
        status: 'Active',
        sent: 234,
        delivered: 228,
        deliveryRate: 97.4,
        cost: '₵0.10',
        provider: 'Firebase / Native'
      },
      {
        name: 'Slack',
        icon: '💼',
        status: 'Inactive',
        sent: 23,
        delivered: 23,
        deliveryRate: 100,
        cost: '₵0.00',
        provider: 'Slack Workspace'
      }
    ],
    templates: [
      {
        id: 'TEMP-001',
        name: 'Low Stock Alert',
        type: 'Inventory',
        subject: 'Low Stock Alert: {{product_name}}',
        usage: 156,
        languages: ['English', 'Twi'],
        channels: ['Email', 'SMS', 'WhatsApp']
      },
      {
        id: 'TEMP-002',
        name: 'Daily Sales Report',
        type: 'Financial',
        subject: 'Daily Sales Summary - {{date}}',
        usage: 89,
        languages: ['English'],
        channels: ['Email', 'WhatsApp']
      },
      {
        id: 'TEMP-003',
        name: 'Security Alert',
        type: 'Security',
        subject: 'Security Alert: {{alert_type}}',
        usage: 45,
        languages: ['English'],
        channels: ['SMS', 'Email', 'Push']
      }
    ]
  });

  const [newNotification, setNewNotification] = useState({
    type: 'info',
    title: '',
    message: '',
    channels: [],
    priority: 'medium',
    recipients: '',
    language: 'en',
    scheduled: false,
    scheduleTime: ''
  });

  const formatCurrency = (amount) => {
    return `₵${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'send', label: 'Send Notification', icon: '📤' },
    { id: 'history', label: 'History', icon: '📋' },
    { id: 'channels', label: 'Channels', icon: '📡' },
    { id: 'templates', label: 'Templates', icon: '📝' }
  ];

  const sendNotification = async () => {
    // Simulate sending notification
    console.log('Sending notification:', newNotification);
    
    // Add to recent notifications
    const notification = {
      id: `NOT-${Date.now()}`,
      type: newNotification.type,
      title: newNotification.title,
      message: newNotification.message,
      recipient: newNotification.recipients,
      channel: newNotification.channels.join(' + '),
      status: 'Delivered',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      priority: newNotification.priority,
      cost: formatCurrency(newNotification.channels.length * 1.5)
    };

    setNotificationData(prev => ({
      ...prev,
      recentNotifications: [notification, ...prev.recentNotifications.slice(0, 9)]
    }));

    // Reset form
    setNewNotification({
      type: 'info',
      title: '',
      message: '',
      channels: [],
      priority: 'medium',
      recipients: '',
      language: 'en',
      scheduled: false,
      scheduleTime: ''
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-2xl">🔔</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Smart Notification Center</h1>
                <p className="text-gray-600">Multi-channel communication for Ghana - {currentFacility?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Delivery Rate</p>
                <p className="text-2xl font-bold text-green-600">{notificationData.overview.deliveryRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Sent</p>
                <p className="text-2xl font-bold text-blue-600">{notificationData.overview.totalSent.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-xl font-bold text-blue-600">{notificationData.overview.totalSent.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">📤</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivery Rate</p>
                <p className="text-xl font-bold text-green-600">{notificationData.overview.deliveryRate}%</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Channels</p>
                <p className="text-xl font-bold text-purple-600">{notificationData.overview.activeChannels}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">📡</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-xl font-bold text-yellow-600">{notificationData.overview.unreadCount}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-lg">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Growth</p>
                <p className="text-xl font-bold text-indigo-600">+{notificationData.overview.monthlyGrowth}%</p>
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
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Ghana Communication Networks */}
                <div className="bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🇬🇭</span>
                    Ghana Communication Networks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">MTN Ghana</p>
                          <p className="text-sm text-gray-600">SMS Delivery Rate</p>
                          <p className="text-lg font-bold text-green-600">98.5%</p>
                        </div>
                        <span className="text-green-500 text-xl">📱</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">Vodafone Ghana</p>
                          <p className="text-sm text-gray-600">SMS Delivery Rate</p>
                          <p className="text-lg font-bold text-green-600">97.8%</p>
                        </div>
                        <span className="text-green-500 text-xl">📱</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">AirtelTigo</p>
                          <p className="text-sm text-gray-600">SMS Delivery Rate</p>
                          <p className="text-lg font-bold text-green-600">96.2%</p>
                        </div>
                        <span className="text-green-500 text-xl">📱</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Notifications */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Notifications</h3>
                  <div className="space-y-3">
                    {notificationData.recentNotifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(notification.status)}`}>
                                {notification.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>📧 {notification.recipient}</span>
                              <span>📡 {notification.channel}</span>
                              <span>🕒 {notification.timestamp}</span>
                              <span>💰 {notification.cost}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Send Notification Tab */}
            {activeTab === 'send' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Send New Notification</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={newNotification.type}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="info">Information</option>
                        <option value="alert">Alert</option>
                        <option value="warning">Warning</option>
                        <option value="success">Success</option>
                        <option value="error">Error</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={newNotification.title}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter notification title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                      <textarea
                        value={newNotification.message}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter notification message"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={newNotification.priority}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
                      <div className="space-y-2">
                        {notificationData.channels.filter(ch => ch.status === 'Active').map((channel) => (
                          <label key={channel.name} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newNotification.channels.includes(channel.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewNotification(prev => ({ 
                                    ...prev, 
                                    channels: [...prev.channels, channel.name] 
                                  }));
                                } else {
                                  setNewNotification(prev => ({ 
                                    ...prev, 
                                    channels: prev.channels.filter(ch => ch !== channel.name) 
                                  }));
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="mr-2">{channel.icon}</span>
                            <span>{channel.name} ({channel.cost})</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                      <textarea
                        value={newNotification.recipients}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, recipients: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter email addresses or phone numbers, separated by commas"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={newNotification.language}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="tw">Twi</option>
                        <option value="ga">Ga</option>
                        <option value="ee">Ewe</option>
                      </select>
                    </div>

                    <button
                      onClick={sendNotification}
                      disabled={!newNotification.title || !newNotification.message || newNotification.channels.length === 0}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      🚀 Send Notification
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Notification History</h3>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">All Channels</option>
                    {notificationData.channels.map(channel => (
                      <option key={channel.name} value={channel.name}>{channel.name}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Channel</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Recipient</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notificationData.recentNotifications.map((notification) => (
                        <tr key={notification.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-sm">{notification.id}</td>
                          <td className="py-3 px-4 font-semibold">{notification.title}</td>
                          <td className="py-3 px-4">{notification.channel}</td>
                          <td className="py-3 px-4 text-sm">{notification.recipient}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(notification.status)}`}>
                              {notification.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-green-600">{notification.cost}</td>
                          <td className="py-3 px-4 font-mono text-sm">{notification.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Channels Tab */}
            {activeTab === 'channels' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Communication Channels</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notificationData.channels.map((channel) => (
                    <div key={channel.name} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{channel.icon}</span>
                          <div>
                            <h4 className="font-bold text-gray-900">{channel.name}</h4>
                            <p className="text-sm text-gray-600">{channel.provider}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(channel.status)}`}>
                          {channel.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Sent:</span>
                          <span className="font-semibold">{channel.sent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Delivered:</span>
                          <span className="font-semibold text-green-600">{channel.delivered.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Rate:</span>
                          <span className="font-semibold text-blue-600">{channel.deliveryRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cost:</span>
                          <span className="font-semibold text-purple-600">{channel.cost}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Notification Templates</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    + Create Template
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notificationData.templates.map((template) => (
                    <div key={template.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.type}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                          {template.usage} uses
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-4">{template.subject}</p>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-600">Languages:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.languages.map((lang) => (
                              <span key={lang} className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">Channels:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.channels.map((channel) => (
                              <span key={channel} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                                {channel}
                              </span>
                            ))}
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

export default NotificationCenter;
