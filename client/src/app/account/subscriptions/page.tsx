'use client';

import { useState, useEffect } from 'react';
import { getSubscriptions, Subscription, SubscriptionStatus } from '@/lib/api/subscriptions';
import { CreditCard, Calendar, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function getStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'bg-success/10 text-success border-success';
    case 'paused':
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

function formatInterval(interval: string): string {
  return interval === 'monthly' ? 'Monthly' : 'Every 2 Months';
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        setIsLoading(true);
        setError('');
        const response = await getSubscriptions();
        if (response.success && response.data) {
          setSubscriptions(response.data);
        } else {
          setError(response.error || 'Failed to load subscriptions');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptions();
  }, []);

  const handleManage = (subscriptionId: string) => {
    // TODO: Implement subscription management
    console.log('Manage subscription:', subscriptionId);
  };

  const handlePause = (subscriptionId: string) => {
    // TODO: Implement pause subscription
    console.log('Pause subscription:', subscriptionId);
  };

  const handleCancel = (subscriptionId: string) => {
    // TODO: Implement cancel subscription
    console.log('Cancel subscription:', subscriptionId);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Subscriptions</h1>
          <p className="text-text-secondary mt-2">Manage your active subscriptions</p>
        </div>
        <div className="bg-surface border border-border-default rounded-lg p-6">
          <p className="text-text-secondary">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Subscriptions</h1>
          <p className="text-text-secondary mt-2">Manage your active subscriptions</p>
        </div>
        <div className="bg-error/10 border border-error rounded-lg p-6">
          <p className="text-error">{error}</p>
        </div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');
  const inactiveSubscriptions = subscriptions.filter((sub) => sub.status !== 'active');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">Subscriptions</h1>
        <p className="text-text-secondary mt-2">Manage your active subscriptions</p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-surface border border-border-default rounded-lg p-12 text-center">
          <CreditCard className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-display font-semibold text-text-primary mb-2">
            No active subscriptions
          </h2>
          <p className="text-text-secondary">
            Subscribe to a 12-pack to save on recurring deliveries.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSubscriptions.length > 0 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
                Active Subscriptions
              </h2>
              <div className="space-y-4">
                {activeSubscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="bg-surface border border-border-default rounded-lg p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {subscription.product.imageUrl && (
                            <img
                              src={subscription.product.imageUrl}
                              alt={subscription.product.name}
                              className="h-16 w-16 rounded object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-display font-semibold text-text-primary">
                              {subscription.product.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span
                                className={cn(
                                  'px-2.5 py-1 rounded-full text-xs font-medium border',
                                  getStatusColor(subscription.status)
                                )}
                              >
                                {subscription.status.charAt(0).toUpperCase() +
                                  subscription.status.slice(1)}
                              </span>
                              <span className="text-sm text-text-secondary">
                                {formatInterval(subscription.interval)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                          <div className="flex items-center gap-2 text-text-secondary">
                            <Calendar className="h-4 w-4" />
                            <div>
                              <span className="font-medium">Next billing:</span>{' '}
                              {formatDate(subscription.nextBillingDate)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-text-secondary">
                            <Package className="h-4 w-4" />
                            <div>
                              <span className="font-medium">Started:</span>{' '}
                              {formatDate(subscription.startDate)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-sm text-text-secondary">
                          <p className="font-medium mb-1">Shipping Address:</p>
                          <p>
                            {subscription.shippingAddress.streetAddress},{' '}
                            {subscription.shippingAddress.city}, {subscription.shippingAddress.state}{' '}
                            {subscription.shippingAddress.zipCode}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 md:w-auto w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManage(subscription.id)}
                          className="w-full md:w-auto"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                        {subscription.status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePause(subscription.id)}
                              className="w-full md:w-auto"
                            >
                              Pause
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(subscription.id)}
                              className="w-full md:w-auto text-error hover:text-error"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactiveSubscriptions.length > 0 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
                Inactive Subscriptions
              </h2>
              <div className="space-y-4">
                {inactiveSubscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="bg-surface border border-border-default rounded-lg p-6 opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      {subscription.product.imageUrl && (
                        <img
                          src={subscription.product.imageUrl}
                          alt={subscription.product.name}
                          className="h-16 w-16 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-display font-semibold text-text-primary">
                          {subscription.product.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium border',
                              getStatusColor(subscription.status)
                            )}
                          >
                            {subscription.status.charAt(0).toUpperCase() +
                              subscription.status.slice(1)}
                          </span>
                          <span className="text-sm text-text-secondary">
                            Ended: {formatDate(subscription.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
