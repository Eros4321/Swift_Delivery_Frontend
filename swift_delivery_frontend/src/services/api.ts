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

export interface UniversityDeliveryArea {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export interface University extends UniversitySummary {
  google_place_id: string | null;
  latitude: string;
  longitude: string;
  detection_radius_meters: number;
  delivery_fee: number | string;
  delivery_area: UniversityDeliveryArea | null;
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

export interface CustomerAddress {
  id: number;
  customer: number;
  university: number;
  label: string;
  address: string;
  provider_place_id: string;
  latitude: string;
  longitude: string;
  delivery_instructions: string;
  is_default: boolean;
}

export interface DeliveryLocation {
  place_id: string;
  name: string | null;
  formatted_address: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
}

export interface ReverseGeocodeDeliveryLocationResponse extends DeliveryLocation {
  university: number;
}

export const normalizeGooglePlaceId = (value?: string | null) => {
  const normalizedValue = value?.trim().replace(/^places\//, '') || '';
  return normalizedValue || null;
};

export const getDeliveryLocationName = (location: DeliveryLocation) => (
  location.name?.trim() || location.formatted_address.trim()
);

export const getDeliveryLocationDisplayText = (location: DeliveryLocation) => {
  const name = location.name?.trim() || '';
  const formattedAddress = location.formatted_address.trim();

  return [name, formattedAddress]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(', ');
};

export const getCustomerAddressDisplayText = (address: CustomerAddress) => {
  const label = address.label.trim();
  const formattedAddress = address.address.trim();

  return [label, formattedAddress]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(', ');
};

interface DeliveryLocationSearchResponse {
  university: number;
  results: DeliveryLocation[];
}

export interface CreateCustomerAddressPayload {
  university: number;
  label: string;
  address: string;
  provider_place_id: string;
  latitude: string;
  longitude: string;
  delivery_instructions: string;
  is_default: boolean;
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
  vendor_notes: string;
  delivery_notes: string;
  /** @deprecated Use vendor_notes. This alias never contains delivery instructions. */
  notes: string;
  subtotal_amount: number | string;
  /** @deprecated This remains a subtotal alias until the cart API migration is complete. */
  total_amount: number | string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export type CartNoteType = 'vendor' | 'delivery';

export interface SavedCartNote {
  id: number;
  note: string;
  note_type: CartNoteType;
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
  delivery_place_id?: string;
  customer_address?: number;
  delivery_latitude?: string;
  delivery_longitude?: string;
  university?: number;
  vendor_notes?: string;
  delivery_notes?: string;
  order_items: OrderItemPayload[];
}

export interface DeliveryQuotePayload {
  university?: number;
  delivery_latitude?: string;
  delivery_longitude?: string;
  delivery_place_id?: string;
  customer_address?: number;
}

export interface DeliveryQuote {
  currency: 'NGN' | string;
  item_count: number;
  subtotal_amount: string;
  delivery_fee: string;
  total_amount: string;
  university: number;
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
  order_id: string;
  items: CustomerOrderItem[];
  subtotal_amount: number | string;
  delivery_fee: number | string;
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
  vendor_notes: string;
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
  const response = await api.get<VendorDetails[]>('/vendors/', {
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

export const fetchUniversities = async (signal?: AbortSignal) => {
  const response = await api.get<University[]>('/universities/', { signal });
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

export const fetchCustomerAddresses = async (signal?: AbortSignal) => {
  const response = await api.get<CustomerAddress[]>('/addresses/', { signal });
  return response.data;
};

export const searchDeliveryLocations = async (
  query: string,
  universityId: number,
  signal?: AbortSignal,
) => {
  const response = await api.get<DeliveryLocationSearchResponse>('/locations/search/', {
    params: {
      query,
      university_id: universityId,
    },
    signal,
  });
  return response.data.results;
};

export const reverseGeocodeDeliveryLocation = async (
  latitude: number,
  longitude: number,
  universityId: number,
  placeId?: string | null,
  signal?: AbortSignal,
) => {
  const response = await api.post<ReverseGeocodeDeliveryLocationResponse>(
    '/locations/reverse-geocode/',
    {
      latitude,
      longitude,
      university_id: universityId,
      ...(placeId ? { place_id: placeId } : {}),
    },
    { signal },
  );
  return response.data;
};

export const createCustomerAddress = async (payload: CreateCustomerAddressPayload) => {
  const response = await api.post<CustomerAddress>('/addresses/', payload);
  return response.data;
};

export const updateCustomerAddress = async (
  addressId: number,
  payload: CreateCustomerAddressPayload,
) => {
  const response = await api.patch<CustomerAddress>(`/addresses/${addressId}/`, payload);
  return response.data;
};

export const deleteCustomerAddress = async (addressId: number) => {
  await api.delete(`/addresses/${addressId}/`);
};

export const fetchCustomerCart = async () => {
  const response = await api.get<CustomerCart>('/cart/');
  return response.data;
};

export const updateCustomerCartInstruction = async (
  noteType: CartNoteType,
  instruction: string,
) => {
  const field = noteType === 'vendor' ? 'vendor_notes' : 'delivery_notes';
  const response = await api.patch<CustomerCart>('/cart/', { [field]: instruction });
  return response.data;
};

export const createSavedCartNote = async (note: string, noteType: CartNoteType) => {
  const response = await api.post<SavedCartNote>('/cart/saved-notes/', {
    note,
    note_type: noteType,
  });
  return response.data;
};

export const fetchSavedCartNotes = async (
  noteType: CartNoteType,
  signal?: AbortSignal,
) => {
  const response = await api.get<SavedCartNote[]>('/cart/saved-notes/', {
    params: { type: noteType },
    signal,
  });
  return response.data;
};

export const deleteSavedCartNote = async (savedNoteId: number) => {
  await api.delete(`/cart/saved-notes/${savedNoteId}/`);
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

export const fetchDeliveryQuote = async (
  payload: DeliveryQuotePayload,
  signal?: AbortSignal,
) => {
  const response = await api.post<DeliveryQuote>('/delivery/quote/', payload, { signal });
  return response.data;
};

export const loginCustomer = async (phoneNumber: string) => {
  const response = await api.post<CustomerAuthResponse>('/auth/customer/login/', {
    phone_number: phoneNumber,
  });
  return response.data;
};

export const fetchCurrentCustomer = async (signal?: AbortSignal) => {
  const response = await api.get<Customer>('/auth/customer/me/', { signal });
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

