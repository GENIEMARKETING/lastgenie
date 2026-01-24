const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type SubscriptionInterval = 'monthly' | 'bimonthly';

export interface ShippingAddress {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  price: number;
  category: string;
}

export interface Subscription {
  id: string;
  userId: string;
  productId: string;
  shippingAddressId: string;
  status: SubscriptionStatus;
  interval: SubscriptionInterval;
  startDate: string;
  nextBillingDate: string;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
  product: Product;
  shippingAddress: ShippingAddress;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: Array<{ path: string[]; message: string }>;
}

/**
 * Make an API request with credentials
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle network errors
    if (!response) {
      throw new Error('Unable to connect to server. Please ensure the backend server is running on port 3001.');
    }

    // Try to parse JSON, but handle errors gracefully
    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error(`Server returned invalid response. Status: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    // Handle network errors (server not running, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please ensure the backend server is running on port 3001.');
    }
    throw error;
  }
}

/**
 * Get all subscriptions for the current user
 */
export async function getSubscriptions(): Promise<ApiResponse<Subscription[]>> {
  return apiRequest<Subscription[]>('/api/subscriptions');
}
