import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FacilityProvider } from './contexts/FacilityContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Analytics from './pages/Analytics';
import Storage from './pages/Storage';
import TemperatureMonitor from './pages/TemperatureMonitor';

function App() {
  return (
    <FacilityProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/temperature-monitor" element={<TemperatureMonitor />} />
        </Routes>
      </Layout>
    </FacilityProvider>
  );
}

export default App;