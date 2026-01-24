// Default to localhost:3001 for development, will be overridden in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AffiliateApplication {
  reason: string;
  experience?: string;
  marketingChannels: string;
}

export interface AffiliateStatus {
  isAffiliate: boolean;
  application?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    reason: string;
    experience?: string;
    marketingChannels: string;
    createdAt: string;
    updatedAt: string;
  };
  affiliate?: {
    id: string;
    referralCode: string;
    commissionRate: number;
    isActive: boolean;
    createdAt: string;
  };
}

export interface AffiliateDashboard {
  stats: {
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    conversionRate: number;
    pendingCommissions: number;
    paidCommissions: number;
  };
  recentActivity: {
    clicks: Array<{
      id: string;
      createdAt: string;
      ipAddress?: string;
      userAgent?: string;
    }>;
    conversions: Array<{
      id: string;
      orderId: string;
      orderValue: number;
      commissionAmount: number;
      createdAt: string;
    }>;
  };
}

export interface AffiliateLinks {
  baseUrl: string;
  referralCode: string;
  links: Array<{
    name: string;
    url: string;
    description: string;
  }>;
}

export interface TrackClickRequest {
  referralCode: string;
  page?: string;
  userAgent?: string;
}

export interface PayoutSetup {
  method: 'stripe' | 'paypal';
  accountId: string;
  accountEmail?: string;
}

export interface PayoutStatus {
  hasPayoutMethod: boolean;
  method?: 'stripe' | 'paypal';
  accountEmail?: string;
  pendingAmount: number;
  nextPayoutDate?: string;
  recentPayouts: Array<{
    id: string;
    amount: number;
    status: 'pending' | 'processing' | 'paid' | 'failed';
    createdAt: string;
    paidAt?: string;
  }>;
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
 * Submit affiliate application (requires authentication)
 */
export async function submitAffiliateApplication(
  application: AffiliateApplication
): Promise<ApiResponse<{ applicationId: string }>> {
  return apiRequest<{ applicationId: string }>('/api/affiliate/apply', {
    method: 'POST',
    body: JSON.stringify(application),
  });
}

/**
 * Get affiliate status (requires authentication)
 */
export async function getAffiliateStatus(): Promise<ApiResponse<AffiliateStatus>> {
  return apiRequest<AffiliateStatus>('/api/affiliate/status');
}

/**
 * Get affiliate dashboard data (requires authentication)
 */
export async function getAffiliateDashboard(): Promise<ApiResponse<AffiliateDashboard>> {
  return apiRequest<AffiliateDashboard>('/api/affiliate/dashboard');
}

/**
 * Get affiliate links (requires authentication)
 */
export async function getAffiliateLinks(): Promise<ApiResponse<AffiliateLinks>> {
  return apiRequest<AffiliateLinks>('/api/affiliate/links');
}

/**
 * Track affiliate click (public endpoint)
 */
export async function trackAffiliateClick(
  request: TrackClickRequest
): Promise<ApiResponse<{ clickId: string }>> {
  return apiRequest<{ clickId: string }>('/api/affiliate/track-click', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Setup payout method (requires authentication)
 */
export async function setupPayouts(
  setup: PayoutSetup
): Promise<ApiResponse<{ setupComplete: boolean }>> {
  return apiRequest<{ setupComplete: boolean }>('/api/affiliate/setup-payouts', {
    method: 'POST',
    body: JSON.stringify(setup),
  });
}

/**
 * Get payout status (requires authentication)
 */
export async function getPayoutStatus(): Promise<ApiResponse<PayoutStatus>> {
  return apiRequest<PayoutStatus>('/api/affiliate/payout-status');
}