import { CartItem, AddToCartPayload } from '@/types/cart';
import { logApiRequest, logApiResponse, logApiError, API_CONFIG } from '../api-debug';

// Default to localhost:3001 for development, will be overridden in production
const API_URL = API_CONFIG.BASE_URL;

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
  const fullUrl = `${API_URL}${endpoint}`;
  
  try {
    logApiRequest(endpoint, options);
    
    const response = await fetch(fullUrl, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Add timeout for better error handling
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    // Handle network errors
    if (!response) {
      throw new Error('Network error: Unable to connect to server');
    }

    let data: ApiResponse<T>;
    try {
      data = await response.json();
      logApiResponse(endpoint, response, data);
    } catch (jsonError) {
      const errorMsg = `Server returned invalid response. Status: ${response.status}`;
      logApiError(endpoint, new Error(errorMsg));
      throw new Error(errorMsg);
    }

    if (!response.ok) {
      const errorMessage = data.error || `Request failed with status ${response.status}`;
      const apiError = new Error(errorMessage);
      logApiError(endpoint, apiError);
      throw apiError;
    }

    return data;
  } catch (error) {
    const apiError = error instanceof Error ? error : new Error(String(error));
    logApiError(endpoint, apiError);
    
    // Handle different types of errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    // Re-throw other errors as-is
    throw apiError;
  }
}

/**
 * Get user's cart (authenticated only)
 */
export async function getCart(): Promise<ApiResponse<{ items: CartItem[] }>> {
  return apiRequest<{ items: CartItem[] }>('/api/cart');
}

/**
 * Add item to cart
 */
export async function addToCart(
  payload: AddToCartPayload
): Promise<ApiResponse<{ item: CartItem }>> {
  return apiRequest<{ item: CartItem }>('/api/cart', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<ApiResponse<{ item: CartItem }>> {
  return apiRequest<{ item: CartItem }>(`/api/cart/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  itemId: string
): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/api/cart/${itemId}`, {
    method: 'DELETE',
  });
}

/**
 * Clear entire cart
 */
export async function clearCart(): Promise<ApiResponse<null>> {
  return apiRequest<null>('/api/cart', {
    method: 'DELETE',
  });
}
