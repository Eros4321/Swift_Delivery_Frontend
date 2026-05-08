import axios from 'axios';

const defaultApiBaseUrl = 'https://swift-delivery.onrender.com/api';
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const api = axios.create({
  baseURL: (configuredApiBaseUrl || defaultApiBaseUrl).replace(/\/+$/, ''),
});

interface OrderItemPayload {
  menu_item: number;
  quantity: number;
}

export interface CreateOrderPayload {
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  order_items: OrderItemPayload[];
}

// Fetch orders from the API
export const fetchOrders = async () => {
  const response = await api.get('/orders/');
  return response.data;
};

// Create a new order
export const createOrder = async (orderData: CreateOrderPayload) => {
  const response = await api.post('/orders/', orderData);
  return response.data;
};

export const fetchMenuItems = async (cafeteriaId: any) => {
  const response = await api.get(`/cafeterias/${cafeteriaId}/`);
  return response.data.menu_items;
};

export const fetchCafeterias = async () => {
  const response = await api.get('/cafeterias/');
  return response.data;
};

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }

    const { data } = error.response;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data && typeof data === 'object') {
      const messages = Object.values(data).flatMap((value) => {
        if (Array.isArray(value)) {
          return value.map((item) => String(item));
        }

        if (value === null || value === undefined) {
          return [];
        }

        return [String(value)];
      });

      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to place your order right now. Please try again.';
};

