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
import ActivityLog from './pages/ActivityLog';
import LowStock from './pages/LowStock';
import ExpiringProducts from './pages/ExpiringProducts';
import PurchaseOrders from './pages/PurchaseOrders';
import FeatureToggleAdmin from './components/FeatureToggleAdmin';
import FeatureMatrix from './components/FeatureMatrix';
import FeatureMatrixPage from './pages/FeatureMatrixPage';
import FacilityFeatureDemo from './pages/FacilityFeatureDemo';

// Import new enterprise components
import NotificationCenter from './components/NotificationCenter';
import AuditDashboard from './components/AuditDashboard';
import FinancialTracker from './components/FinancialTracker';
import MultiCurrencySupport from './components/MultiCurrencySupport';
import CostAnalysis from './components/CostAnalysis';
import SecurityCompliance from './components/SecurityCompliance';
import InsuranceIntegration from './components/InsuranceIntegration';

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
          <Route path="/low-stock" element={<LowStock />} />
          <Route path="/expiring-products" element={<ExpiringProducts />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/activity" element={<ActivityLog />} />
          <Route path="/admin/features" element={<FeatureToggleAdmin mode="facility" facilityId={facilityId} />} />
          <Route path="/admin/features/global" element={<FeatureToggleAdmin mode="global" />} />
          <Route path="/admin/feature-matrix" element={<FeatureMatrix />} />
          <Route path="/feature-matrix" element={<FeatureMatrixPage />} />
          <Route path="/facility-feature-demo" element={<FacilityFeatureDemo />} />
          
          {/* Enterprise Features Routes */}
          <Route path="/notifications" element={<NotificationCenter />} />
          <Route path="/audit" element={<AuditDashboard />} />
          <Route path="/financial" element={<FinancialTracker />} />
          <Route path="/multi-currency" element={<MultiCurrencySupport />} />
          <Route path="/cost-analysis" element={<CostAnalysis />} />
          <Route path="/security" element={<SecurityCompliance />} />
          <Route path="/insurance" element={<InsuranceIntegration />} />
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