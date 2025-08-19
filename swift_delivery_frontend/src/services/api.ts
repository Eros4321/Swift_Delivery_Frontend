import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/', 
});

// Fetch orders from the API
export const fetchOrders = async () => {
  const response = await api.get('/orders/');
  return response.data;
};

// Create a new order
export const createOrder = async (orderData: any) => {
  const response = await api.post('/orders/', orderData);
  return response.data;
};

export const fetchMenuItems = async (cafeteriaId: string) => {
  const response = await api.get(`api/cafeterias/${cafeteriaId}/`);  // Assuming your menu items endpoint is "/menu-items/"
  return response.data.menu_items;
};

export const fetchCafeterias = async () => {
  const response = await api.get('api/cafeterias/');
  return response.data;
};

