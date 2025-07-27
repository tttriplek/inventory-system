import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Current facility ID - in a real app, this would come from auth/context
const FACILITY_ID = '68866e9ef5f2215902022394';

// Add request interceptor to include facility ID
api.interceptors.request.use(
  (config) => {
    // Add facility ID header to all requests
    config.headers['X-Facility-ID'] = FACILITY_ID;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  // Get all products with pagination and filtering
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get single product by ID
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create new product(s)
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Get analytics dashboard data
  getAnalytics: async () => {
    const response = await api.get('/products/analytics');
    return response.data;
  },

  // Distribute products using FIFO
  distributeProducts: async (distributionData) => {
    const response = await api.post('/products/distribute', distributionData);
    return response.data;
  },

  // Get expiring products
  getExpiringProducts: async (days = 30) => {
    const response = await api.get('/products/expiring', { params: { days } });
    return response.data;
  },

  // Get low stock products
  getLowStockProducts: async (threshold = 10) => {
    const response = await api.get('/products/low-stock', { params: { threshold } });
    return response.data;
  },
};

// Facilities API (for future expansion)
export const facilitiesApi = {
  // Get all facilities
  getFacilities: async () => {
    const response = await api.get('/facilities');
    return response.data;
  },

  // Get current facility
  getCurrentFacility: async () => {
    const response = await api.get(`/facilities/${FACILITY_ID}`);
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
