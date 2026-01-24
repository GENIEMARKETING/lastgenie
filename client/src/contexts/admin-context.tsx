'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useSSE } from '@/lib/sse-client';
import { useErrorHandler } from '@/components/error-boundary';
import adminApi from '@/lib/admin-api';

interface DashboardStats {
  orders: {
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    todayOrders: number;
    todayRevenue: number;
  };
  inventory: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalInventoryValue: number;
  };
  products: {
    totalProducts: number;
    activeProducts: number;
    featuredProducts: number;
    inactiveProducts: number;
    averagePrice: number;
    totalSales: number;
  };
  users: {
    totalUsers: number;
    todayUsers: number;
    monthlyUsers: number;
    growth: number;
  };
  affiliates: {
    totalAffiliates: number;
    pendingApplications: number;
    totalCommissions: number;
  };
  lastUpdated: string;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  user: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  items: Array<{
    quantity: number;
    product: {
      name: string;
      sku: string;
    };
  }>;
}

interface LowStockProduct {
  id: string;
  productId: string;
  currentStock: number;
  lowStockThreshold: number;
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    category: string;
  };
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface AdminState {
  // Dashboard data
  dashboardStats: DashboardStats | null;
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
  ordersNeedingAttention: RecentOrder[];
  
  // Real-time notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  
  // Connection status
  isSSEConnected: boolean;
  connectionStatus: string;
  
  // Loading states
  isLoadingStats: boolean;
  isLoadingRecentOrders: boolean;
  isLoadingLowStock: boolean;
  
  // Error states
  error: string | null;
}

type AdminAction =
  | { type: 'SET_LOADING'; payload: { key: keyof AdminState; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DASHBOARD_STATS'; payload: DashboardStats }
  | { type: 'SET_RECENT_ORDERS'; payload: RecentOrder[] }
  | { type: 'SET_LOW_STOCK_PRODUCTS'; payload: LowStockProduct[] }
  | { type: 'SET_ORDERS_NEEDING_ATTENTION'; payload: RecentOrder[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_SSE_CONNECTION'; payload: { connected: boolean; status: string } }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; newStatus: string } }
  | { type: 'UPDATE_INVENTORY'; payload: { productId: string; newStock: number } }
  | { type: 'ADD_NEW_ORDER'; payload: RecentOrder };

const initialState: AdminState = {
  dashboardStats: null,
  recentOrders: [],
  lowStockProducts: [],
  ordersNeedingAttention: [],
  notifications: [],
  unreadNotificationCount: 0,
  isSSEConnected: false,
  connectionStatus: 'disconnected',
  isLoadingStats: false,
  isLoadingRecentOrders: false,
  isLoadingLowStock: false,
  error: null,
};

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        [action.payload.key]: action.payload.value,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_DASHBOARD_STATS':
      return {
        ...state,
        dashboardStats: action.payload,
        isLoadingStats: false,
      };

    case 'SET_RECENT_ORDERS':
      return {
        ...state,
        recentOrders: action.payload,
        isLoadingRecentOrders: false,
      };

    case 'SET_LOW_STOCK_PRODUCTS':
      return {
        ...state,
        lowStockProducts: action.payload,
        isLoadingLowStock: false,
      };

    case 'SET_ORDERS_NEEDING_ATTENTION':
      return {
        ...state,
        ordersNeedingAttention: action.payload,
      };

    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadNotificationCount: newNotifications.filter(n => !n.read).length,
      };

    case 'MARK_NOTIFICATION_READ':
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadNotificationCount: updatedNotifications.filter(n => !n.read).length,
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadNotificationCount: 0,
      };

    case 'SET_SSE_CONNECTION':
      return {
        ...state,
        isSSEConnected: action.payload.connected,
        connectionStatus: action.payload.status,
      };

    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        recentOrders: state.recentOrders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.newStatus }
            : order
        ),
      };

    case 'UPDATE_INVENTORY':
      return {
        ...state,
        lowStockProducts: state.lowStockProducts.map(item =>
          item.productId === action.payload.productId
            ? { ...item, currentStock: action.payload.newStock }
            : item
        ),
      };

    case 'ADD_NEW_ORDER':
      return {
        ...state,
        recentOrders: [action.payload, ...state.recentOrders.slice(0, 9)], // Keep only 10 most recent
      };

    default:
      return state;
  }
}

interface AdminContextType {
  state: AdminState;
  actions: {
    loadDashboardData: () => Promise<void>;
    loadRecentOrders: () => Promise<void>;
    loadLowStockProducts: () => Promise<void>;
    loadOrdersNeedingAttention: () => Promise<void>;
    markNotificationRead: (id: string) => void;
    clearNotifications: () => void;
    refreshData: () => Promise<void>;
  };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const { isConnected, connectionStatus, addEventListener } = useSSE();
  const handleError = useErrorHandler();

  // Update SSE connection status
  useEffect(() => {
    dispatch({
      type: 'SET_SSE_CONNECTION',
      payload: { connected: isConnected, status: connectionStatus }
    });
  }, [isConnected, connectionStatus]);

  // Set up SSE event listeners
  useEffect(() => {
    // New order notifications
    const handleNewOrder = (event: any) => {
      const { orderId, orderNumber, totalAmount, customerEmail } = event.data;
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `new-order-${orderId}`,
          type: 'info',
          title: 'New Order Received',
          message: `Order ${orderNumber} from ${customerEmail} - $${totalAmount.toFixed(2)}`,
          timestamp: new Date(),
          read: false,
        },
      });
    };

    // Low stock alerts
    const handleLowStockAlert = (event: any) => {
      const { productId, productName, currentStock, threshold } = event.data;
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `low-stock-${productId}`,
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${productName} is running low (${currentStock} remaining, threshold: ${threshold})`,
          timestamp: new Date(),
          read: false,
        },
      });
    };

    // Order status updates
    const handleOrderStatusUpdate = (event: any) => {
      const { orderId, orderNumber, newStatus } = event.data;
      
      dispatch({
        type: 'UPDATE_ORDER_STATUS',
        payload: { orderId, newStatus }
      });

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `order-status-${orderId}`,
          type: 'success',
          title: 'Order Status Updated',
          message: `Order ${orderNumber} status changed to ${newStatus}`,
          timestamp: new Date(),
          read: false,
        },
      });
    };

    // Inventory updates
    const handleInventoryUpdate = (event: any) => {
      const { productId, currentStock } = event.data;
      
      dispatch({
        type: 'UPDATE_INVENTORY',
        payload: { productId, newStock: currentStock }
      });
    };

    // Stock restock notifications
    const handleStockRestock = (event: any) => {
      const { productName, addedQuantity, newStock } = event.data;
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `restock-${Date.now()}`,
          type: 'success',
          title: 'Stock Restocked',
          message: `${productName}: +${addedQuantity} units (now ${newStock} in stock)`,
          timestamp: new Date(),
          read: false,
        },
      });
    };

    // Register event listeners
    addEventListener('new_order', handleNewOrder);
    addEventListener('low_stock_alert', handleLowStockAlert);
    addEventListener('order_status_update', handleOrderStatusUpdate);
    addEventListener('inventory_update', handleInventoryUpdate);
    addEventListener('stock_restock', handleStockRestock);

    // Cleanup is handled by the useSSE hook
  }, [addEventListener]);

  // Actions
  const loadDashboardData = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'isLoadingStats', value: true } });
    
    try {
      const response = await adminApi.getDashboardStats<DashboardStats>();
      if (response.success && response.data) {
        dispatch({ type: 'SET_DASHBOARD_STATS', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load dashboard stats' });
      }
    } catch (error) {
      console.error('Dashboard loading error:', error);
      handleError(error instanceof Error ? error : new Error('Dashboard loading failed'));
      dispatch({ type: 'SET_ERROR', payload: 'Network error or authentication failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'isLoadingStats', value: false } });
    }
  };

  const loadRecentOrders = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'isLoadingRecentOrders', value: true } });
    
    try {
      const response = await adminApi.getRecentOrders<any>(10);
      if (response.success && response.data) {
        dispatch({ type: 'SET_RECENT_ORDERS', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load recent orders' });
      }
    } catch (error) {
      console.error('Recent orders loading error:', error);
      handleError(error instanceof Error ? error : new Error('Recent orders loading failed'));
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load recent orders' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'isLoadingRecentOrders', value: false } });
    }
  };

  const loadLowStockProducts = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'isLoadingLowStock', value: true } });
    
    try {
      const response = await adminApi.getLowStockProducts<any>();
      if (response.success && response.data) {
        dispatch({ type: 'SET_LOW_STOCK_PRODUCTS', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load low stock products' });
      }
    } catch (error) {
      console.error('Low stock products loading error:', error);
      handleError(error instanceof Error ? error : new Error('Low stock products loading failed'));
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load low stock products' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'isLoadingLowStock', value: false } });
    }
  };

  const loadOrdersNeedingAttention = async () => {
    try {
      const response = await adminApi.getOrdersNeedingAttention<any>();
      if (response.success && response.data) {
        dispatch({ type: 'SET_ORDERS_NEEDING_ATTENTION', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to load orders needing attention:', error);
      handleError(error instanceof Error ? error : new Error('Orders needing attention loading failed'));
    }
  };

  const markNotificationRead = (id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  };

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  const refreshData = async () => {
    await Promise.all([
      loadDashboardData(),
      loadRecentOrders(),
      loadLowStockProducts(),
      loadOrdersNeedingAttention(),
    ]);
  };

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  const contextValue: AdminContextType = {
    state,
    actions: {
      loadDashboardData,
      loadRecentOrders,
      loadLowStockProducts,
      loadOrdersNeedingAttention,
      markNotificationRead,
      clearNotifications,
      refreshData,
    },
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

export default AdminContext;