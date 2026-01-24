'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useAuth } from './auth-context';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
} from './api/cart';
import {
  CartItem,
  AddToCartPayload,
  Cart,
} from '@/types/cart';

const CART_STORAGE_KEY = 'lastgenie_cart';

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (payload: AddToCartPayload) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Load cart from localStorage
 */
function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];

    const cart: Cart = JSON.parse(stored);
    // Check if cart is expired (30 days)
    const cartDate = new Date(cart.updatedAt);
    const expiryDate = new Date(cartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (new Date() > expiryDate) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }

    return cart.items || [];
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return [];
  }
}

/**
 * Save cart to localStorage
 */
function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    const cart: Cart = {
      items,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
}

/**
 * Generate unique cart item ID
 */
function generateCartItemId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  /**
   * Load cart from server (for authenticated users) or localStorage (for guests)
   */
  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated && user) {
        // Load from server for authenticated users
        try {
          console.log('Loading cart from server for authenticated user:', user.id);
          const response = await getCart();
          if (response.success && response.data) {
            console.log('Cart loaded successfully from server:', response.data.items?.length || 0, 'items');
            setItems(response.data.items || []);
            // Also sync to localStorage for offline access
            saveCartToStorage(response.data.items || []);
          } else {
            console.warn('Cart API returned unsuccessful response:', response);
            // Fall back to localStorage
            const localItems = loadCartFromStorage();
            setItems(localItems);
          }
        } catch (error) {
          // If API fails, fall back to localStorage
          console.error('Failed to load cart from server, falling back to localStorage:', error);
          const localItems = loadCartFromStorage();
          setItems(localItems);
          
          // Show user-friendly error message
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('Unable to connect')) {
            console.warn('Server unavailable - using offline cart');
          }
        }
      } else {
        // Load from localStorage for guest users
        console.log('Loading cart from localStorage for guest user');
        const localItems = loadCartFromStorage();
        setItems(localItems);
      }
    } catch (error) {
      console.error('Critical error loading cart:', error);
      // Always ensure we have a valid cart state
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Merge localStorage cart with server cart on login
   */
  const mergeCarts = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    const localItems = loadCartFromStorage();
    if (localItems.length === 0) {
      console.log('No local cart items to merge');
      return;
    }

    try {
      console.log('Merging local cart with server cart:', localItems.length, 'local items');
      
      // Get server cart
      let serverItems: CartItem[] = [];
      try {
        const response = await getCart();
        serverItems = response.success && response.data ? response.data.items : [];
        console.log('Server cart loaded for merge:', serverItems.length, 'items');
      } catch (error) {
        console.warn('Could not load server cart for merge, proceeding with local items only:', error);
      }

      // Merge logic: combine items, preferring server items for duplicates
      const mergedMap = new Map<string, CartItem>();

      // Add server items first
      serverItems.forEach((item) => {
        mergedMap.set(item.productId, item);
      });

      // Add local items that don't exist on server
      const itemsToSync: CartItem[] = [];
      localItems.forEach((item) => {
        if (!mergedMap.has(item.productId)) {
          mergedMap.set(item.productId, item);
          itemsToSync.push(item);
        }
      });

      console.log('Items to sync to server:', itemsToSync.length);

      // Sync items to server with error handling
      if (itemsToSync.length > 0) {
        const syncPromises = itemsToSync.map(async (item) => {
          try {
            await apiAddToCart({
              productId: item.productId,
              quantity: item.quantity,
              isSubscription: item.isSubscription,
              name: item.name,
              price: item.price,
              image: item.image,
              subscriptionDiscount: item.subscriptionDiscount,
            });
            console.log('Successfully synced item to server:', item.productId);
          } catch (error) {
            // Handle "Product not found" gracefully
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('Product not found')) {
              console.warn(`Skipping invalid cart item: ${item.productId} - Product not found`);
              // Remove from merged map since it's invalid
              mergedMap.delete(item.productId);
            } else {
              // Log other errors but don't throw
              console.error('Error adding cart item to server:', error);
              // Keep the item in local storage for retry later
            }
          }
        });

        // Wait for all sync operations to complete
        await Promise.allSettled(syncPromises);
      }

      const mergedItems = Array.from(mergedMap.values());
      console.log('Cart merge completed:', mergedItems.length, 'total items');
      setItems(mergedItems);
      saveCartToStorage(mergedItems);
    } catch (error) {
      console.error('Error merging carts:', error);
      // On error, just use local items
      setItems(localItems);
    }
  }, [isAuthenticated, user]);

  // Load cart on mount and when auth state changes
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Merge carts when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      mergeCarts();
    }
  }, [isAuthenticated, user, mergeCarts]);

  /**
   * Add item to cart
   */
  const addToCart = useCallback(
    async (payload: AddToCartPayload) => {
      try {
        // Check if item already exists
        const existingItem = items.find(
          (item) =>
            item.productId === payload.productId &&
            item.isSubscription === payload.isSubscription
        );

        if (existingItem) {
          // Update quantity instead
          await updateQuantity(
            existingItem.id,
            existingItem.quantity + payload.quantity
          );
          return;
        }

        // Create new cart item
        const newItem: CartItem = {
          id: generateCartItemId(),
          ...payload,
        };

        // Optimistic update
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        saveCartToStorage(updatedItems);

        // Sync to server if authenticated
        if (isAuthenticated && user) {
          try {
            await apiAddToCart(payload);
          } catch (error) {
            // Rollback on error
            setItems(items);
            saveCartToStorage(items);
            
            // Enhanced error handling
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Cart sync error:', {
              error: errorMessage,
              payload,
              userId: user.id
            });
            
            // Provide user-friendly error messages
            if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
              throw new Error('Please log in again to add items to your cart.');
            } else if (errorMessage.includes('Product not found') || errorMessage.includes('404')) {
              throw new Error('This product is no longer available. Please refresh the page and try again.');
            } else if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
              throw new Error('Unable to connect to server. Please check your internet connection and try again.');
            } else {
              throw new Error('Failed to add item to cart. Please try again.');
            }
          }
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
      }
    },
    [items, isAuthenticated, user]
  );

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback(
    async (itemId: string) => {
      try {
        const itemToRemove = items.find((item) => item.id === itemId);
        if (!itemToRemove) return;

        // Optimistic update
        const updatedItems = items.filter((item) => item.id !== itemId);
        setItems(updatedItems);
        saveCartToStorage(updatedItems);

        // Sync to server if authenticated
        if (isAuthenticated && user) {
          try {
            await apiRemoveFromCart(itemId);
          } catch (error) {
            // Rollback on error
            setItems(items);
            saveCartToStorage(items);
            throw error;
          }
        }
      } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }
    },
    [items, isAuthenticated, user]
  );

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) {
        await removeFromCart(itemId);
        return;
      }

      try {
        const currentItems = items;
        // Optimistic update
        const updatedItems = currentItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        setItems(updatedItems);
        saveCartToStorage(updatedItems);

        // Sync to server if authenticated
        if (isAuthenticated && user) {
          try {
            await apiUpdateCartItem(itemId, quantity);
          } catch (error) {
            // Rollback on error
            setItems(currentItems);
            saveCartToStorage(currentItems);
            throw error;
          }
        }
      } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
      }
    },
    [items, isAuthenticated, user, removeFromCart]
  );

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(async () => {
    try {
      // Optimistic update
      setItems([]);
      saveCartToStorage([]);

      // Sync to server if authenticated
      if (isAuthenticated && user) {
        try {
          await apiClearCart();
        } catch (error) {
          // Reload cart on error
          await loadCart();
          throw error;
        }
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }, [isAuthenticated, user, loadCart]);

  /**
   * Calculate cart total
   */
  const getCartTotal = useCallback((): number => {
    return items.reduce((total, item) => {
      const price = item.isSubscription
        ? item.price * (1 - (item.subscriptionDiscount || 0))
        : item.price;
      return total + price * item.quantity;
    }, 0);
  }, [items]);

  /**
   * Get total item count
   */
  const getItemCount = useCallback((): number => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const value: CartContextType = {
    items,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook to use cart context
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
