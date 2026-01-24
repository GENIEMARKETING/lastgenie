'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Package, CreditCard, Settings, ShoppingBag } from 'lucide-react';

export default function AccountPage() {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Total Orders',
      value: '0',
      icon: ShoppingBag,
      href: '/account/orders',
    },
    {
      name: 'Active Subscriptions',
      value: '0',
      icon: CreditCard,
      href: '/account/subscriptions',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-text-secondary mt-2">
          Manage your account, orders, and subscriptions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-surface border border-border-default rounded-lg p-6 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{stat.name}</p>
                  <p className="text-3xl font-bold text-text-primary mt-2">{stat.value}</p>
                </div>
                <Icon className="h-12 w-12 text-primary opacity-20" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-surface border border-border-default rounded-lg p-6">
        <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/account/profile">
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
          <Link href="/account/orders">
            <Button variant="outline" className="w-full justify-start">
              <Package className="h-4 w-4 mr-2" />
              View Orders
            </Button>
          </Link>
          <Link href="/account/subscriptions">
            <Button variant="outline" className="w-full justify-start">
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Subscriptions
            </Button>
          </Link>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-surface border border-border-default rounded-lg p-6">
        <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
          Account Information
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-text-secondary">Email</dt>
            <dd className="text-text-primary font-medium mt-1">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Name</dt>
            <dd className="text-text-primary font-medium mt-1">
              {user?.firstName} {user?.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Email Verified</dt>
            <dd className="text-text-primary font-medium mt-1">
              {user?.emailVerified ? 'Yes' : 'No'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Age Verified</dt>
            <dd className="text-text-primary font-medium mt-1">
              {user?.isAgeVerified ? 'Yes' : 'No'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}