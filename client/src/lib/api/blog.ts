// Default to localhost:3001 for development, will be overridden in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
}

export interface CreateBlogPostRequest {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'published';
  publishedAt?: string;
}

export interface UpdateBlogPostRequest {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  status?: 'draft' | 'published';
  publishedAt?: string;
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
 * Get all published blog posts (public endpoint)
 */
export async function getBlogPosts(params?: {
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<BlogPost[]>> {
  const queryParams = new URLSearchParams();
  
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  if (params?.offset) {
    queryParams.append('offset', params.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/blog${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<BlogPost[]>(endpoint);
}

/**
 * Get blog post by slug (public endpoint)
 */
export async function getBlogPostBySlug(slug: string): Promise<ApiResponse<BlogPost>> {
  return apiRequest<BlogPost>(`/api/blog/${slug}`);
}

/**
 * Create new blog post (admin only)
 */
export async function createBlogPost(
  post: CreateBlogPostRequest
): Promise<ApiResponse<BlogPost>> {
  return apiRequest<BlogPost>('/api/blog', {
    method: 'POST',
    body: JSON.stringify(post),
  });
}

/**
 * Update blog post (admin only)
 */
export async function updateBlogPost(
  id: string,
  post: UpdateBlogPostRequest
): Promise<ApiResponse<BlogPost>> {
  return apiRequest<BlogPost>(`/api/blog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(post),
  });
}

/**
 * Delete blog post (admin only)
 */
export async function deleteBlogPost(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/api/blog/${id}`, {
    method: 'DELETE',
  });
}