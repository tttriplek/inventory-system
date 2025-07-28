// src/api/productApi.js
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/products';

export const getProducts = () => axios.get(API_BASE);
export const getProductPlacements = () => axios.get(API_BASE + '?placements=true');
export const createProduct = async (data) => {
  try {
    return await axios.post(API_BASE, data);
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message);
  }
};

export const updateProduct = (id, data) => axios.put(`${API_BASE}/${id}`, data);
export const deleteProduct = (id) => axios.delete(`${API_BASE}/${id}`);
