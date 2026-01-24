// Default to localhost:3001 for development, will be overridden in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Testimonial {
  id: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  productName: string;
  productCategory: 'male' | 'female';
  isVerifiedPurchase: boolean;
  createdAt: string;
  relativeDate: string;
}

export interface TestimonialsResponse {
  success: boolean;
  data?: Testimonial[];
  meta?: {
    total: number;
    averageRating: number;
    count: number;
  };
  error?: string;
}

/**
 * Make an API request with credentials
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response) {
      throw new Error('Unable to connect to server. Please ensure the backend server is running on port 3001.');
    }

    let data: T;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error(`Server returned invalid response. Status: ${response.status}`);
    }

    if (!response.ok) {
      const errorData = data as any;
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please ensure the backend server is running on port 3001.');
    }
    throw error;
  }
}

/**
 * Get testimonials with optional filtering
 */
export async function getTestimonials(params?: {
  product?: 'male' | 'female';
  limit?: number;
}): Promise<TestimonialsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.product) {
    queryParams.append('product', params.product);
  }
  
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/testimonials${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<TestimonialsResponse>(endpoint);
}