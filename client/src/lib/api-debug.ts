/**
 * API Debug Utilities
 * Provides debugging information for API connections and requests
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

/**
 * Log API request details for debugging
 */
export function logApiRequest(endpoint: string, options: RequestInit = {}) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
    console.log('Full URL:', `${API_CONFIG.BASE_URL}${endpoint}`);
    console.log('Options:', {
      method: options.method || 'GET',
      headers: options.headers,
      credentials: options.credentials,
      body: options.body ? 'Present' : 'None'
    });
    console.groupEnd();
  }
}

/**
 * Log API response details for debugging
 */
export function logApiResponse(endpoint: string, response: Response, data: any) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`📡 API Response: ${response.status} ${endpoint}`);
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Data:', data);
    console.groupEnd();
  }
}

/**
 * Log API error details for debugging
 */
export function logApiError(endpoint: string, error: Error) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`❌ API Error: ${endpoint}`);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('API Config:', API_CONFIG);
    console.groupEnd();
  }
}

/**
 * Test API connectivity
 */
export async function testApiConnection(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return { connected: true, latency };
    } else {
      return { 
        connected: false, 
        error: `Server responded with ${response.status}` 
      };
    }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get current environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: API_CONFIG.BASE_URL,
    isClient: typeof window !== 'undefined',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    timestamp: new Date().toISOString(),
  };
}