/**
 * Cart Type Definitions
 * Defines types for cart items, cart state, and shipping rates
 */

export interface CartItem {
  id: string; // Unique cart item ID
  productId: string; // Product SKU/ID
  name: string;
  price: number;
  quantity: number;
  image: string;
  isSubscription: boolean;
  subscriptionDiscount?: number; // e.g., 0.15 for 15% off
}

export interface Cart {
  items: CartItem[];
  updatedAt: string; // ISO timestamp
}

export type AddressType = 
  | 'house' 
  | 'apartment' 
  | 'condo' 
  | 'townhouse' 
  | 'business' 
  | 'residential_complex' 
  | 'other';

export interface ShippingRate {
  id: string;
  provider: string;
  serviceName: string;
  amount: string;
  currency: string;
  estimatedDays: string;
  attributes?: string[]; // e.g., ['CHEAPEST', 'FASTEST']
}

export interface ShippingAddress {
  name?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType?: AddressType;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
  isSubscription?: boolean;
  name: string;
  price: number;
  image: string;
  subscriptionDiscount?: number;
}

export interface AddressValidationResult {
  isValid: boolean;
  validatedAddress?: ShippingAddress;
  suggestions?: ShippingAddress[];
  confidence?: 'exact' | 'high' | 'medium' | 'low';
  messages?: string[];
  originalAddress: ShippingAddress;
  requiresUnitNumber?: boolean;
}
