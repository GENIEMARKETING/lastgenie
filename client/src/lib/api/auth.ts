// Default to localhost:3001 for development, will be overridden in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: 'customer' | 'admin' | 'super_admin';
  emailVerified: Date | null;
  isAgeVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T & { verificationUrl?: string; devMode?: boolean };
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
 * Register a new user
 */
export async function register(data: RegisterData): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Login user
 */
export async function login(data: LoginData): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Logout user
 */
export async function logout(): Promise<ApiResponse<null>> {
  return apiRequest<null>('/api/auth/logout', {
    method: 'POST',
  });
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiRequest<User>('/api/auth/me');
}

/**
 * Request password reset
 */
export async function forgotPassword(email: string): Promise<ApiResponse<null>> {
  return apiRequest<null>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Update user profile
 */
export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}): Promise<ApiResponse<User>> {
  return apiRequest<User>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Change password
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResponse<null>> {
  return apiRequest<null>('/api/auth/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Verify email with token (GET request)
 */
export async function verifyEmailWithToken(token: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

/**
 * Manual email verification (POST request)
 */
export async function manualVerifyEmail(data: {
  email: string;
  verificationCode: string;
}): Promise<ApiResponse<null>> {
  return apiRequest<null>('/api/auth/manual-verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}