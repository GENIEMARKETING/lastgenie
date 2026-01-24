// Default to localhost:3001 for development, will be overridden in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Address {
  id: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
}

export interface CreateAddressRequest {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  type: 'shipping' | 'billing';
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  type?: 'shipping' | 'billing';
  isDefault?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make an API request with credentials
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const fullUrl = `${API_URL}${endpoint}`;
  const method = options.method || 'GET';
  
  try {
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', {
        url: fullUrl,
        method,
        endpoint,
        hasCredentials: true,
        timestamp: new Date().toISOString()
      });
    }

    const response = await fetch(fullUrl, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Log response details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API Response:', {
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });
    }

    if (!response) {
      const errorMsg = 'Unable to connect to server. Please ensure the backend server is running on port 3001.';
      console.error('❌ API Error:', errorMsg);
      throw new Error(errorMsg);
    }

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch (jsonError) {
      const errorMsg = `Server returned invalid response. Status: ${response.status}`;
      console.error('❌ JSON Parse Error:', {
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        error: jsonError
      });
      throw new Error(errorMsg);
    }

    if (!response.ok) {
      const errorMsg = `${data.error || 'Request failed'} (Status: ${response.status})`;
      console.error('❌ API Error Response:', {
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        serverError: data.error,
        serverMessage: data.message,
        fullResponse: data
      });
      throw new Error(errorMsg);
    }

    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Success:', {
        url: fullUrl,
        dataType: Array.isArray(data.data) ? `array[${data.data.length}]` : typeof data.data,
        success: data.success
      });
    }

    return data;
  } catch (error) {
    // Enhanced error logging
    console.error('❌ API Request Failed:', {
      url: fullUrl,
      method,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof TypeError ? 'Network/Fetch Error' : 'Other Error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please ensure the backend server is running on port 3001.');
    }
    throw error;
  }
}

/**
 * Get user's addresses (requires authentication)
 */
export async function getAddresses(type?: 'shipping' | 'billing'): Promise<ApiResponse<Address[]>> {
  const queryParams = new URLSearchParams();
  
  if (type) {
    queryParams.append('type', type);
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/addresses${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<Address[]>(endpoint);
}

/**
 * Create new address (requires authentication)
 */
export async function createAddress(
  address: CreateAddressRequest
): Promise<ApiResponse<Address>> {
  return apiRequest<Address>('/api/addresses', {
    method: 'POST',
    body: JSON.stringify(address),
  });
}

/**
 * Update address (requires authentication)
 */
export async function updateAddress(
  id: string,
  address: UpdateAddressRequest
): Promise<ApiResponse<Address>> {
  return apiRequest<Address>(`/api/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(address),
  });
}

/**
 * Delete address (requires authentication)
 */
export async function deleteAddress(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/api/addresses/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Set address as default (requires authentication)
 */
export async function setDefaultAddress(id: string): Promise<ApiResponse<Address>> {
  return apiRequest<Address>(`/api/addresses/${id}/set-default`, {
    method: 'POST',
  });
}