import axios from 'axios';

const defaultApiBaseUrl = 'https://swift-delivery.onrender.com/api';
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const authTokenStorageKey = 'swift-delivery-auth-token';
const authCustomerStorageKey = 'swift-delivery-auth-customer';
const selectedUniversityStorageKey = 'swift-delivery-selected-university';
export const customerSessionUpdatedEvent = 'customer-session-updated';
export const universitySelectionUpdatedEvent = 'university-selection-updated';

const publicAuthPaths = ['/auth/customer/login', '/auth/customer/signup'];

const isPublicAuthRequest = (requestUrl: string | undefined) => {
  if (!requestUrl) return false;

  const normalizedUrl = requestUrl.split('?')[0].replace(/\/+$/, '');
  return publicAuthPaths.some((path) => normalizedUrl.endsWith(path));
};

const removeStoredCustomerSession = () => {
  localStorage.removeItem(authTokenStorageKey);
  localStorage.removeItem(authCustomerStorageKey);
  localStorage.removeItem('cart');
  localStorage.removeItem('cartVendor');
  window.dispatchEvent(new Event(customerSessionUpdatedEvent));
  window.dispatchEvent(new Event('cart-updated'));
};

const api = axios.create({
  baseURL: (configuredApiBaseUrl || defaultApiBaseUrl).replace(/\/+$/, ''),
});

export const resolveApiMediaUrl = (mediaUrl: string | null | undefined) => {
  const trimmedMediaUrl = mediaUrl?.trim();

  if (!trimmedMediaUrl) return null;

  try {
    const browserOrigin = typeof window === 'undefined' ? defaultApiBaseUrl : window.location.origin;
    const apiUrl = new URL(api.defaults.baseURL || defaultApiBaseUrl, browserOrigin);
    return new URL(trimmedMediaUrl, `${apiUrl.origin}/`).toString();
  } catch {
    return trimmedMediaUrl;
  }
};

api.interceptors.request.use((config) => {
  if (isPublicAuthRequest(config.url)) {
    delete config.headers.Authorization;
    return config;
  }

  const token = localStorage.getItem(authTokenStorageKey);

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      removeStoredCustomerSession();
    }
    return Promise.reject(error);
  },
);

export interface UniversitySummary {
  id: number;
  name: string;
}

export interface University extends UniversitySummary {
  latitude: string;
  longitude: string;
  detection_radius_meters: number;
  is_active: boolean;
}

export interface UniversityDetectionResponse {
  university: University;
  distance_meters: number;
}

export type VendorType = 'cafeteria' | 'grills' | 'pastries' | 'drinks';

export interface VendorListItem {
  id: number;
  name: string;
  image: string | null;
  logo: string | null;
  vendor_type: VendorType;
  closing_time: string | null;
  university: number | null;
  average_rating: number | null;
  rating_count: number;
}

interface VendorFilters {
  universityId: number;
  vendorType?: VendorType;
}

export interface Customer {
  id: number;
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
  preferred_university: UniversitySummary | null;
  created_at: string;
}

export interface CustomerAuthResponse {
  token: string;
  customer: Customer;
}

export interface CustomerSignupPayload {
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface CartMenuItem {
  id: number;
  vendors: number[];
  name: string;
  price: number | string;
  available: boolean;
  image: string | null;
  category: number | null;
  category_name?: string;
}

export interface VendorDetails extends VendorListItem {
  menu_items: CartMenuItem[];
}

export interface FavoriteVendor {
  id?: number;
  vendor: number;
  vendor_detail: VendorListItem;
  created_at?: string;
}

export interface CustomerCartItem {
  id: number;
  menu_item: number;
  menu_item_detail: CartMenuItem;
  quantity: number;
  line_total: number | string;
  added_at: string;
  updated_at: string;
}

export interface CustomerCart {
  id: number;
  customer: number;
  items: CustomerCartItem[];
  notes: string;
  total_amount: number | string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface SavedCartNote {
  id: number;
  note: string;
  created_at: string;
  updated_at: string;
}

interface OrderItemPayload {
  menu_item: number;
  quantity: number;
}

export interface CreateOrderPayload {
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  delivery_notes?: string;
  order_items: OrderItemPayload[];
}

export interface CustomerOrderItem {
  id: number;
  menu_item: number;
  menu_item_name: string;
  price: number | string;
  quantity: number;
  order: number;
}

export interface CustomerOrder {
  id: number;
  items: CustomerOrderItem[];
  total_amount: number | string;
  customer: number | null;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  delivery_place_id: string | null;
  customer_address: number | null;
  delivery_latitude: string | null;
  delivery_longitude: string | null;
  university: number | null;
  delivery_notes: string;
  order_time: string;
}

// Fetch orders from the API
export const fetchOrders = async () => {
  const response = await api.get('/orders/');
  return response.data;
};

export const fetchCustomerOrderHistory = async (signal?: AbortSignal) => {
  const response = await api.get<CustomerOrder[]>('/orders/history/', { signal });
  return response.data;
};

// Create a new order
export const createOrder = async (orderData: CreateOrderPayload) => {
  const response = await api.post('/orders/', orderData);
  return response.data;
};

export const fetchMenuItems = async (cafeteriaId: number | string) => {
  const response = await api.get(`/cafeterias/${cafeteriaId}/`);
  return response.data.menu_items;
};

export const fetchCafeteriaDetails = async (cafeteriaId: number) => {
  const response = await api.get<VendorDetails>(`/cafeterias/${cafeteriaId}/`);
  return response.data;
};

export const fetchCafeterias = async () => {
  const response = await api.get('/cafeterias/');
  return response.data;
};

export const fetchVendors = async (
  { universityId, vendorType }: VendorFilters,
  signal?: AbortSignal,
) => {
  const response = await api.get<VendorListItem[]>('/vendors/', {
    params: {
      university_id: universityId,
      ...(vendorType ? { vendor_type: vendorType } : {}),
    },
    signal,
  });
  return response.data;
};

export const fetchFavoriteVendors = async (signal?: AbortSignal) => {
  const response = await api.get<FavoriteVendor[]>('/favorites/vendors/', { signal });
  return response.data;
};

export const addFavoriteVendor = async (vendorId: number) => {
  const response = await api.post<FavoriteVendor>('/favorites/vendors/', {
    vendor: vendorId,
  });
  return response.data;
};

export const removeFavoriteVendor = async (vendorId: number) => {
  await api.delete(`/favorites/vendors/${vendorId}/`);
};

export const fetchUniversities = async () => {
  const response = await api.get<University[]>('/universities/');
  return response.data;
};

export const detectUniversity = async (latitude: number, longitude: number) => {
  const response = await api.post<UniversityDetectionResponse>('/universities/detect/', {
    latitude,
    longitude,
  });
  return response.data;
};

export const updateCurrentCustomerUniversity = async (universityId: number) => {
  const response = await api.patch<Customer>('/auth/customer/me/', {
    preferred_university_id: universityId,
  });
  return response.data;
};

export const fetchCustomerCart = async () => {
  const response = await api.get<CustomerCart>('/cart/');
  return response.data;
};

export const updateCustomerCartNotes = async (notes: string) => {
  const response = await api.patch<CustomerCart>('/cart/', { notes });
  return response.data;
};

export const createSavedCartNote = async (note: string) => {
  const response = await api.post<SavedCartNote>('/cart/saved-notes/', { note });
  return response.data;
};

export const addOrReplaceCustomerCartItem = async (menuItemId: number, quantity: number) => {
  const response = await api.post<CustomerCart>('/cart/', {
    menu_item: menuItemId,
    quantity,
  });
  return response.data;
};

export const clearCustomerCart = async () => {
  const response = await api.delete<CustomerCart>('/cart/');
  return response.data;
};

export const updateCustomerCartItem = async (cartItemId: number, quantity: number) => {
  const response = await api.patch<CustomerCartItem>(`/cart/items/${cartItemId}/`, {
    quantity,
  });
  return response.data;
};

export const deleteCustomerCartItem = async (cartItemId: number) => {
  await api.delete(`/cart/items/${cartItemId}/`);
};

export const loginCustomer = async (phoneNumber: string) => {
  const response = await api.post<CustomerAuthResponse>('/auth/customer/login/', {
    phone_number: phoneNumber,
  });
  return response.data;
};

export const signupCustomer = async (payload: CustomerSignupPayload) => {
  const response = await api.post<CustomerAuthResponse>('/auth/customer/signup/', payload);
  return response.data;
};

export const logoutCustomer = async () => {
  try {
    await api.post<void>('/auth/customer/logout/');
  } catch (error: unknown) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      throw error;
    }
  }
};

export const saveStoredCustomer = (customer: Customer) => {
  localStorage.setItem(authCustomerStorageKey, JSON.stringify(customer));
  window.dispatchEvent(new Event(customerSessionUpdatedEvent));
};

export const saveCustomerSession = ({ token, customer }: CustomerAuthResponse) => {
  localStorage.setItem(authTokenStorageKey, token);
  saveStoredCustomer(customer);
};

export const clearCustomerSession = () => {
  removeStoredCustomerSession();
};

export const hasStoredAuthToken = () => Boolean(localStorage.getItem(authTokenStorageKey));

export const saveSelectedUniversity = (university: UniversitySummary) => {
  localStorage.setItem(selectedUniversityStorageKey, JSON.stringify(university));
  window.dispatchEvent(new Event(universitySelectionUpdatedEvent));
};

export const clearSelectedUniversity = () => {
  localStorage.removeItem(selectedUniversityStorageKey);
  window.dispatchEvent(new Event(universitySelectionUpdatedEvent));
};

export const getStoredSelectedUniversity = (): UniversitySummary | null => {
  const storedUniversity = localStorage.getItem(selectedUniversityStorageKey);

  if (!storedUniversity) return null;

  try {
    const university = JSON.parse(storedUniversity) as Partial<UniversitySummary>;
    return typeof university.id === 'number' && typeof university.name === 'string'
      ? university as UniversitySummary
      : null;
  } catch {
    return null;
  }
};

export const getStoredCustomer = (): Customer | null => {
  const storedCustomer = localStorage.getItem(authCustomerStorageKey);

  if (!storedCustomer) return null;

  try {
    const customer = JSON.parse(storedCustomer) as Partial<Customer>;

    if (
      typeof customer.first_name !== 'string'
      || typeof customer.last_name !== 'string'
      || typeof customer.phone_number !== 'string'
    ) {
      return null;
    }

    return customer as Customer;
  } catch {
    return null;
  }
};

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = 'Something went wrong. Please try again.',
) => {
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

  return fallbackMessage;
};

