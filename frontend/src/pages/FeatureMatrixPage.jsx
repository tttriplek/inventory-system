import React from 'react';
import FeatureMatrix from '../components/FeatureMatrix';

const FeatureMatrixPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feature Compatibility Matrix</h1>
          <p className="mt-2 text-lg text-gray-600">
            Comprehensive overview of feature availability across all facility types
          </p>
        </div>

        {/* Feature Matrix Component */}
        <FeatureMatrix />
      </div>
    </div>
  );
};

export default FeatureMatrixPage;
