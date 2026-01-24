'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Package,
  UserCheck,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  Zap
} from 'lucide-react';
import { useAdmin } from '@/contexts/admin-context';
import AdminNotifications from '@/components/admin/notifications';
import ConnectionStatus from '@/components/admin/connection-status';

interface DashboardStats {
  users: {
    total: number;
    recent: number;
    growth: number;
  };
  orders: {
    total: number;
    recent: number;
    revenue: number;
    growth: number;
  };
  products: {
    total: number;
    lowStock: number;
  };
  affiliates: {
    total: number;
    pendingApplications: number;
    totalCommissions: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'order_placed' | 'affiliate_application' | 'product_update';
  description: string;
  timestamp: string;
  user?: {
    email: string;
    name?: string;
  };
}

export default function AdminDashboard() {
  const { state, actions } = useAdmin();
  const {
    dashboardStats,
    recentOrders,
    lowStockProducts,
    ordersNeedingAttention,
    isLoadingStats,
    isLoadingRecentOrders,
    error,
    isSSEConnected
  } = state;

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registration':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'order_placed':
        return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case 'affiliate_application':
        return <UserCheck className="h-4 w-4 text-purple-600" />;
      case 'product_update':
        return <Package className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoadingStats && !dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={actions.refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            disabled={isLoadingStats}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary">Welcome to the Genie admin portal</p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionStatus />
          <AdminNotifications />
          <button
            onClick={actions.refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            disabled={isLoadingStats}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users */}
        <Link href="/admin/users" className="block group">
          <div className="bg-surface border border-border-default rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Orders</p>
                <p className="text-3xl font-bold text-text-primary">{dashboardStats?.orders.totalOrders.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    {dashboardStats?.orders.todayOrders} today
                  </span>
                </div>
              </div>
              <Users className="h-12 w-12 text-primary opacity-20 group-hover:opacity-30 transition-opacity" />
            </div>
          </div>
        </Link>

        {/* Orders */}
        <Link href="/admin/orders" className="block group">
          <div className="bg-surface border border-border-default rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Pending Orders</p>
                <p className="text-3xl font-bold text-text-primary">{dashboardStats?.orders.pendingOrders.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-600">
                    Need attention
                  </span>
                </div>
              </div>
              <ShoppingCart className="h-12 w-12 text-primary opacity-20 group-hover:opacity-30 transition-opacity" />
            </div>
          </div>
        </Link>

        {/* Revenue */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Revenue</p>
              <p className="text-3xl font-bold text-text-primary">${dashboardStats?.orders.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">${dashboardStats?.orders.todayRevenue.toFixed(2)}</span>
                <span className="text-sm text-text-secondary">today</span>
              </div>
            </div>
            <DollarSign className="h-12 w-12 text-primary opacity-20" />
          </div>
        </div>

        {/* Products */}
        <Link href="/admin/products" className="block group">
          <div className="bg-surface border border-border-default rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Low Stock Items</p>
                <p className="text-3xl font-bold text-text-primary">{dashboardStats?.inventory.lowStockProducts}</p>
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-600">Need restocking</span>
                </div>
              </div>
              <Package className="h-12 w-12 text-primary opacity-20 group-hover:opacity-30 transition-opacity" />
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Recent Orders</h3>
            <Link href="/admin/orders" className="text-sm text-primary hover:text-primary/80">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {isLoadingRecentOrders ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-center text-text-secondary py-8">No recent orders</p>
            ) : (
              recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">
                      Order #{order.orderNumber}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {order.user.firstName} {order.user.lastName} • ${order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatTimeAgo(order.createdAt)}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'paid' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Low Stock Alert</h3>
            <Link href="/admin/inventory" className="text-sm text-primary hover:text-primary/80">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-text-secondary py-8">All products well stocked</p>
            ) : (
              lowStockProducts.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      SKU: {item.product.sku}
                    </p>
                    <p className="text-xs text-orange-600">
                      {item.currentStock} remaining (threshold: {item.lowStockThreshold})
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-surface border border-border-default rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            href="/admin/users"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:bg-background transition-colors"
          >
            <Users className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-text-primary">Manage Users</span>
          </Link>
          
          <Link
            href="/admin/products"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:bg-background transition-colors"
          >
            <Package className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-text-primary">Add Product</span>
          </Link>
          
          <Link
            href="/admin/orders"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:bg-background transition-colors"
          >
            <ShoppingCart className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-text-primary">View Orders</span>
          </Link>
          
          <Link
            href="/admin/affiliates"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:bg-background transition-colors"
          >
            <UserCheck className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-text-primary">Review Applications</span>
          </Link>
          
          <Link
            href="/admin/analytics"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:bg-background transition-colors"
          >
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-text-primary">View Analytics</span>
          </Link>
          
          <Link
            href="/admin/settings"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:bg-background transition-colors"
          >
            <AlertTriangle className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-text-primary">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}