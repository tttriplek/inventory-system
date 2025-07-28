import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FacilityProvider, useFacility } from './contexts/FacilityContext';
import { FeatureProvider } from './contexts/FeatureContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetailNew from './pages/ProductDetailNew';
import Analytics from './pages/Analytics';
import StorageDesigner from './pages/StorageDesigner';
import TemperatureMonitor from './pages/TemperatureMonitor';
import FeatureToggleAdmin from './components/FeatureToggleAdmin';

// App content with both contexts
function AppContent() {
  const { getCurrentFacilityId } = useFacility();
  const facilityId = getCurrentFacilityId();

  return (
    <FeatureProvider facilityId={facilityId}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<ProductDetailNew />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/storage-designer" element={<StorageDesigner />} />
          <Route path="/temperature-monitor" element={<TemperatureMonitor />} />
          <Route path="/admin/features" element={<FeatureToggleAdmin mode="facility" facilityId={facilityId} />} />
          <Route path="/admin/features/global" element={<FeatureToggleAdmin mode="global" />} />
        </Routes>
      </Layout>
    </FeatureProvider>
  );
}

function App() {
  return (
    <FacilityProvider>
      <AppContent />
    </FacilityProvider>
  );
}

export default App;