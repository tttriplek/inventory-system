import axios from 'axios';

const BASE = 'http://localhost:5000/api/sections';

export const getSections = () => axios.get(BASE);
export const createSection = (data) => axios.post(BASE, data);
export const updateSection = (id, data) => axios.put(`${BASE}/${id}`, data);
export const deleteSection = (id) => axios.delete(`${BASE}/${id}`);

export const fillSectionSpace = (product) => axios.post(`${BASE}/fill-space`, { product });
export const selectSectionPlacement = (product, sectionId, position) => axios.post(`${BASE}/select-placement`, { product, sectionId, position });
export const bulkPlaceProducts = (productIds) => axios.post(`${BASE}/bulk-place`, { productIds });

// Bulk auto-placement: fill all remaining space for all products
export const fillSectionSpaceBulk = (products) =>
  axios.post(`${BASE}/bulk-place`, { productIds: products.map(p => p._id) });

// Bulk direct placement: send all products to a specific section
export const directBulkPlacement = (products, sectionId) =>
  axios.post(`${BASE}/bulk-direct-place`, { products, sectionId });
