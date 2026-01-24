'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  RefreshCw,
  Eye,
  Edit,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdmin } from '@/contexts/admin-context';
import adminApi from '@/lib/admin-api';

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAmount?: number;
  taxAmount?: number;
  shippingCarrier?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  shippingAddress: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: Array<{
    quantity: number;
    pricePerUnit: number;
    product: {
      id: string;
      name: string;
      sku: string;
      imageUrl?: string;
      category: string;
    };
  }>;
  subscription?: {
    id: string;
    status: string;
    interval: string;
  };
  affiliateConversion?: {
    affiliate: {
      referralCode: string;
      user: {
        email: string;
        firstName?: string;
        lastName?: string;
      };
    };
  };
}

interface OrderStats {
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
}

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdate: (orderId: string, status: string, trackingInfo?: { shippingCarrier?: string; trackingNumber?: string }) => void;
}

function StatusUpdateModal({ isOpen, onClose, order, onUpdate }: StatusUpdateModalProps) {
  const [status, setStatus] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setShippingCarrier(order.shippingCarrier || '');
      setTrackingNumber(order.trackingNumber || '');
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsSubmitting(true);
    try {
      const trackingInfo = status === 'shipped' || status === 'delivered' ? {
        shippingCarrier: shippingCarrier || undefined,
        trackingNumber: trackingNumber || undefined
      } : undefined;

      await onUpdate(order.id, status, trackingInfo);
      onClose();
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface border border-border-default rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Update Order Status
        </h3>
        
        <div className="mb-4 p-3 bg-background rounded-lg">
          <p className="text-sm text-text-secondary">Order: {order.orderNumber}</p>
          <p className="text-sm text-text-secondary">Customer: {order.user.firstName} {order.user.lastName}</p>
          <p className="text-sm text-text-secondary">Total: ${order.totalAmount.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="status">Order Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-border-default px-3 py-2 bg-surface"
              required
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {(status === 'shipped' || status === 'delivered') && (
            <>
              <div>
                <Label htmlFor="shippingCarrier">Shipping Carrier</Label>
                <Input
                  id="shippingCarrier"
                  value={shippingCarrier}
                  onChange={(e) => setShippingCarrier(e.target.value)}
                  placeholder="e.g., FedEx, UPS, USPS"
                />
              </div>

              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { state } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getOrders({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminApi.getDashboardStats();
      if (response.success && response.data?.orders) {
        setStats(response.data.orders);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string, trackingInfo?: { shippingCarrier?: string; trackingNumber?: string }) => {
    try {
      const response = await adminApi.updateOrderStatus(orderId, status, trackingInfo);
      
      if (response.success) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: status as any,
                shippingCarrier: trackingInfo?.shippingCarrier || order.shippingCarrier,
                trackingNumber: trackingInfo?.trackingNumber || order.trackingNumber
              }
            : order
        ));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'paid':
        return <DollarSign className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${order.user.firstName} ${order.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Order Management</h1>
          <p className="text-text-secondary">Track and manage customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              loadOrders();
              loadStats();
            }}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Orders</p>
                <p className="text-3xl font-bold text-text-primary">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600 opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Shipped</p>
                <p className="text-3xl font-bold text-purple-600">{stats.shippedOrders}</p>
              </div>
              <Truck className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Delivered</p>
                <p className="text-3xl font-bold text-green-600">{stats.deliveredOrders}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Revenue</p>
                <p className="text-3xl font-bold text-text-primary">${stats.totalRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface border border-border-default rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search Orders</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                id="search"
                type="text"
                placeholder="Search by order number, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status-filter">Status Filter</Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border-default px-3 py-2 bg-surface"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border-default">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Order</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Items</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                
                return (
                  <tr key={order.id} className="border-b border-border-default hover:bg-background/50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-text-primary">#{order.orderNumber}</div>
                        {order.trackingNumber && (
                          <div className="text-sm text-text-secondary">
                            Tracking: {order.trackingNumber}
                          </div>
                        )}
                        {order.affiliateConversion && (
                          <div className="text-xs text-purple-600">
                            Affiliate: {order.affiliateConversion.affiliate.referralCode}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-text-primary">
                          {order.user.firstName} {order.user.lastName}
                        </div>
                        <div className="text-sm text-text-secondary">{order.user.email}</div>
                        <div className="text-xs text-text-secondary">
                          {order.shippingAddress.city}, {order.shippingAddress.state}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-text-secondary">
                            {item.quantity}x {item.product.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="font-semibold text-text-primary">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                      {order.shippingAmount && (
                        <div className="text-sm text-text-secondary">
                          +${order.shippingAmount.toFixed(2)} shipping
                        </div>
                      )}
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="text-sm text-text-secondary">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowStatusModal(true);
                          }}
                          className="flex items-center gap-1 bg-primary text-white"
                        >
                          <Edit className="h-3 w-3" />
                          Update
                        </Button>
                        
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto text-text-secondary opacity-50 mb-4" />
          <p className="text-text-secondary">
            {searchTerm ? 'No orders found matching your search.' : 'No orders found.'}
          </p>
        </div>
      )}

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdate={handleStatusUpdate}
      />
    </div>
  );
}