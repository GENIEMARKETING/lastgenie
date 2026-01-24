import { CartItem } from '@/types/cart';

// Default to localhost:3001 for development, will be overridden in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CheckoutSessionRequest {
  items: {
    productId: string;
    quantity: number;
    isSubscription?: boolean;
  }[];
  shippingAddress?: {
    name: string;
    street1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  referralCode?: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  data?: {
    sessionId: string;
    url: string;
    expiresAt: string;
    metadata?: any;
  };
  error?: string;
}

export interface CheckoutEstimateRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress?: {
    name: string;
    street1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface CheckoutEstimateResponse {
  success: boolean;
  data?: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    items: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }[];
  };
  error?: string;
}

export interface CheckoutSessionStatusResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    paymentStatus: string;
    customerEmail?: string;
    amountTotal?: number;
    currency?: string;
    metadata?: any;
  };
  error?: string;
}

/**
 * Create a checkout session
 */
export async function createCheckoutSession(
  request: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> {
  try {
    const response = await fetch(`${API_URL}/api/checkout/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    return data;
  } catch (error) {
    console.error('Create checkout session error:', error);
    throw error;
  }
}

/**
 * Estimate checkout total with shipping and tax
 */
export async function estimateCheckout(
  request: CheckoutEstimateRequest
): Promise<CheckoutEstimateResponse> {
  try {
    const response = await fetch(`${API_URL}/api/checkout/estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to estimate checkout');
    }

    return data;
  } catch (error) {
    console.error('Estimate checkout error:', error);
    throw error;
  }
}

/**
 * Get checkout session status
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<CheckoutSessionStatusResponse> {
  try {
    const response = await fetch(`${API_URL}/api/checkout/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get checkout session');
    }

    return data;
  } catch (error) {
    console.error('Get checkout session error:', error);
    throw error;
  }
}

/**
 * Helper to convert cart items to checkout items
 */
export function cartItemsToCheckoutItems(cartItems: CartItem[]) {
  return cartItems.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    isSubscription: item.isSubscription
  }));
}