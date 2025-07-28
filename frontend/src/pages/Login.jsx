// src/pages/Login.jsx
import { useNavigate } from 'react-router-dom';
import { useFacility } from '../contexts/FacilityContext';
import { useEffect } from 'react';
import { getFacilityConfig } from '../api/facilityConfigApi';

function Login() {
  const navigate = useNavigate();
  const { loading } = useFacility();

useEffect(() => {
  const checkFacility = async () => {
    try {
      console.log('Checking facility configuration...');
      const config = await getFacilityConfig();
      console.log('Facility config response:', config);
      
      if (!config || config.error || !config.facilityType) {
        console.log('No facility configuration found, redirecting to setup');
        navigate('/facility-setup');
        return;
      }
      
      console.log('Facility exists, redirecting to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.log('Error checking facility config:', error);
      navigate('/facility-setup');
    }
  };
  
  if (!loading) {
    checkFacility();
  }
}, [loading, navigate]);

  const handleLogin = async () => {
    try {
      console.log('Login button clicked, checking facility config...');
      const config = await getFacilityConfig();
      console.log('Login facility config response:', config);
      
      if (!config || config.error || !config.facilityType) {
        console.log('No facility configuration found on login, redirecting to setup');
        navigate('/facility-setup');
      } else {
        console.log('Facility exists, proceeding to dashboard');
        navigate('/dashboard');
      }
    } catch (error) {
      console.log('Error on login:', error);
      navigate('/facility-setup');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Login</h2>
      <button onClick={handleLogin} style={{ padding: '10px 20px', marginTop: '20px' }}>
        Login
      </button>
    </div>
  );
}

export default Login;
