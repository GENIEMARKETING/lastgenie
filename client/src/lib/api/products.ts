// Default to localhost:3001 for development, will be overridden in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: 'male' | 'female';
  packageSize: 'single' | 'twelve_pack';
  isActive: boolean;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface ProductDetail extends Product {
  originalPrice?: number;
  images?: string[];
  isSubscribable: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: {
    firstName: string;
    lastName?: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewRequest {
  rating: number;
  title: string;
  body: string;
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
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please ensure the backend server is running on port 3001.');
    }
    throw error;
  }
}

/**
 * Get all products
 */
export async function getProducts(activeOnly: boolean = false): Promise<ApiResponse<Product[]>> {
  const queryParam = activeOnly ? '?active=true' : '';
  return apiRequest<Product[]>(`/api/products${queryParam}`);
}

/**
 * Get product by SKU
 */
export async function getProductBySku(sku: string): Promise<ApiResponse<ProductDetail>> {
  return apiRequest<ProductDetail>(`/api/products/${sku}`);
}

/**
 * Get product reviews
 */
export async function getProductReviews(sku: string): Promise<ApiResponse<{
  reviews: Review[];
  stats: ReviewStats;
}>> {
  return apiRequest<{
    reviews: Review[];
    stats: ReviewStats;
  }>(`/api/products/${sku}/reviews`);
}

/**
 * Create a product review (requires authentication)
 */
export async function createProductReview(
  sku: string,
  review: CreateReviewRequest
): Promise<ApiResponse<Review>> {
  return apiRequest<Review>(`/api/products/${sku}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  });
}