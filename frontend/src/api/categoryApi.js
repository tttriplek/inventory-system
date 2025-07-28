import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/products';

export const getProductCategories = async () => {
  const res = await axios.get(API_BASE);
  const products = res.data;
  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  return categories;
};
