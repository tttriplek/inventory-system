import React from 'react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Inventory Health</h2>
          </div>
          <div className="card-body">
            <p className="text-gray-600">Advanced analytics coming soon...</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Performance Metrics</h2>
          </div>
          <div className="card-body">
            <p className="text-gray-600">Performance tracking coming soon...</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Trends</h2>
          </div>
          <div className="card-body">
            <p className="text-gray-600">Trend analysis coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
