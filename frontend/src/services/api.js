import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for basic setup
api.interceptors.request.use(
  (config) => {
    // Remove facility headers for now to avoid CORS issues
    // config.headers['X-Facility-ID'] = 'main-warehouse';
    // config.headers['X-Facility-Type'] = 'warehouse';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // System health check
  getHealth: () => api.get('/'),
  
  // Products endpoints
  getProducts: (facilityId = 'main-warehouse') => 
    api.get(`/products?facility=${facilityId}`),
  
  createProduct: (productData) => 
    api.post('/products', productData),
  
  updateProduct: (id, productData) => 
    api.put(`/products/${id}`, productData),
  
  deleteProduct: (id) => 
    api.delete(`/products/${id}`),
  
  // Analytics endpoints
  getAnalytics: (facilityId = 'main-warehouse') => 
    api.get(`/analytics?facility=${facilityId}`),
  
  getDashboardStats: (facilityId = 'main-warehouse') => 
    api.get(`/analytics/dashboard?facility=${facilityId}`),
  
  // Storage endpoints
  getStoragePlans: (facilityId = 'main-warehouse') => 
    api.get(`/storage?facility=${facilityId}`),
  
  getFifoDistribution: (facilityId = 'main-warehouse') => 
    api.get(`/storage/fifo?facility=${facilityId}`),
};

export default api;
