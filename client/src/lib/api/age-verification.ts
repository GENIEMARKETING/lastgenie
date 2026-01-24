const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface VerificationResponse {
  verified: boolean;
  message: string;
}

export interface VerificationStatus {
  userId: string;
  isVerified: boolean;
  verificationDate: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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

    // Check if response exists and parse JSON
    let data: ApiResponse<T>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, response might be empty or not JSON
      throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // Handle network errors (CORS, server down, etc.)
    if (
      error instanceof TypeError ||
      (error instanceof Error && (
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Network request failed')
      ))
    ) {
      let errorMessage = `Unable to connect to server at ${API_URL}`;
      
      if (process.env.NODE_ENV === 'development') {
        errorMessage += `\n\nTo start the backend server:\n`;
        errorMessage += `1. Navigate to the server directory: cd server\n`;
        errorMessage += `2. Install dependencies: npm install\n`;
        errorMessage += `3. Copy .env file: cp env.example .env\n`;
        errorMessage += `4. Set PORT=3001 in .env file\n`;
        errorMessage += `5. Start the server: npm run dev\n\n`;
        errorMessage += `The server should be running on port 3001.`;
        
        console.error('Network error:', error);
        console.error('API URL:', API_URL);
        console.error('Endpoint:', endpoint);
      } else {
        errorMessage += `. Please contact support if this issue persists.`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Re-throw other errors with their original message
    throw error;
  }
}

/**
 * Verify user's age using date of birth
 * @param userId - User ID
 * @param dateOfBirth - Date of birth in YYYY-MM-DD format
 */
export async function verifyAge(
  userId: string,
  dateOfBirth: string
): Promise<ApiResponse<VerificationResponse>> {
  return apiRequest<VerificationResponse>('/api/age-verification/verify', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      dateOfBirth,
    }),
  });
}

/**
 * Get user's age verification status
 * @param userId - User ID
 */
export async function getVerificationStatus(
  userId: string
): Promise<ApiResponse<VerificationStatus>> {
  return apiRequest<VerificationStatus>(`/api/age-verification/status/${userId}`);
}

/**
 * Verify age for guest users (non-authenticated)
 * @param dateOfBirth - Date of birth in YYYY-MM-DD format
 */
export async function verifyAgeGuest(
  dateOfBirth: string
): Promise<ApiResponse<VerificationResponse>> {
  return apiRequest<VerificationResponse>('/api/age-verification/verify-guest', {
    method: 'POST',
    body: JSON.stringify({
      dateOfBirth,
    }),
  });
}
