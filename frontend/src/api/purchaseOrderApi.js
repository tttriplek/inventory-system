import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/purchase-orders';

export const createPurchaseOrder = async (orderData) => {
  try {
    const response = await axios.post(BASE_URL, orderData);
    return response.data;
  } catch (error) {
    console.error('Purchase Order API Error:', error);
    throw error.response?.data?.details || error.response?.data?.error || error.message;
  }
};

export const getPurchaseOrders = async () => {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getProductPurchaseOrders = async (productName) => {
  try {
    const response = await axios.get(`${BASE_URL}/product/${encodeURIComponent(productName)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markOrderAsDelivered = async (orderId) => {
  try {
    const response = await axios.put(`${BASE_URL}/${orderId}/deliver`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const cancelOrder = async (orderId) => {
  try {
    const response = await axios.put(`${BASE_URL}/${orderId}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateDeliveryDate = async (orderId, expectedDeliveryDate) => {
  try {
    const response = await axios.put(`${BASE_URL}/${orderId}/update-delivery-date`, {
      expectedDeliveryDate
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
