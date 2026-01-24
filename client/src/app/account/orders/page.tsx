'use client';

import { useState, useEffect } from 'react';
import { getOrders, Order, OrderStatus } from '@/lib/api/orders';
import { Package, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'delivered':
      return 'bg-success/10 text-success border-success';
    case 'shipped':
      return 'bg-primary/10 text-primary border-primary';
    case 'paid':
      return 'bg-blue-500/10 text-blue-500 border-blue-500';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500';
    case 'cancelled':
      return 'bg-error/10 text-error border-error';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        setError('');
        const response = await getOrders();
        if (response.success && response.data) {
          setOrders(response.data);
        } else {
          setError(response.error || 'Failed to load orders');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Orders</h1>
          <p className="text-text-secondary mt-2">View your order history</p>
        </div>
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <p className="text-text-secondary">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Orders</h1>
          <p className="text-text-secondary mt-2">View your order history</p>
        </div>
        <div className="bg-error/10 border border-error rounded-lg p-6">
          <p className="text-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">Orders</h1>
        <p className="text-text-secondary mt-2">View your order history</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface border border-border-default rounded-lg p-12 text-center">
          <Package className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-display font-semibold text-text-primary mb-2">
            No orders yet
          </h2>
          <p className="text-text-secondary">
            When you place an order, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <div
                key={order.id}
                className="bg-surface border border-border-default rounded-lg p-6 hover:border-primary transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-display font-semibold text-text-primary">
                        Order #{order.orderNumber}
                      </h3>
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium border',
                          getStatusColor(order.status)
                        )}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Package className="h-4 w-4" />
                        <span>
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-text-primary font-medium">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                    {order.trackingNumber && (
                      <div className="mt-3 text-sm text-text-secondary">
                        <span className="font-medium">Tracking:</span> {order.trackingNumber}
                        {order.shippingCarrier && ` (${order.shippingCarrier})`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border-default">
                  <h4 className="text-sm font-medium text-text-primary mb-2">Items:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          {item.product.imageUrl && (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="text-text-primary font-medium">{item.product.name}</p>
                            <p className="text-text-secondary text-xs">
                              Qty: {item.quantity} × {formatCurrency(item.pricePerUnit)}
                            </p>
                          </div>
                        </div>
                        <p className="text-text-primary font-medium">
                          {formatCurrency(item.pricePerUnit * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
