import { ShippingRate, ShippingAddress, CartItem, AddressValidationResult } from '@/types/cart';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    // Preserve error details for better error handling
    const error: any = new Error(data.error || 'Request failed');
    error.details = data.details;
    error.response = data;
    throw error;
  }

  return data;
}

/**
 * Get shipping rates for cart items
 */
export async function getShippingRates(
  items: Array<{ productId: string; quantity: number }>,
  shippingAddress: ShippingAddress
): Promise<
  ApiResponse<{
    rates: ShippingRate[];
    fromAddress: {
      city: string;
      state: string;
      country: string;
    };
    toAddress: ShippingAddress;
    parcels?: Array<{
      dimensions: string;
      weight: string;
    }>;
  }>
> {
  return apiRequest<{
    rates: ShippingRate[];
    fromAddress: {
      city: string;
      state: string;
      country: string;
    };
    toAddress: ShippingAddress;
    parcels?: Array<{
      dimensions: string;
      weight: string;
    }>;
  }>('/api/shipping/rates', {
    method: 'POST',
    body: JSON.stringify({
      items,
      shippingAddress,
    }),
  });
}

/**
 * Validate shipping address
 */
export async function validateAddress(
  address: ShippingAddress
): Promise<ApiResponse<AddressValidationResult>> {
  return apiRequest<AddressValidationResult>('/api/shipping/validate-address', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}
