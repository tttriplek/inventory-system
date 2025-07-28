import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFacility } from '../contexts/FacilityContext';

const RequireNoFacility = ({ children }) => {
  const { config, loading } = useFacility();

  if (loading) {
    return <div>Loading...</div>;
  }

  // If there's already a facility config, redirect to dashboard
  if (config && !config.error) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, show the facility setup page
  return children;
};

export default RequireNoFacility;
