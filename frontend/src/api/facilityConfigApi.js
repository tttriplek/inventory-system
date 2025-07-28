import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/facility-config';

export const getFacilityConfig = async () => {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createFacilityConfig = async (config) => {
  try {
    const response = await axios.post(BASE_URL, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateFacilityConfig = async (id, updates) => {
  try {
    const response = await axios.patch(`${BASE_URL}/${id}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
