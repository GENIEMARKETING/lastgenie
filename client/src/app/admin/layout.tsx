'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminRoute } from '@/lib/auth-context';
import { AdminProvider } from '@/contexts/admin-context';
import { AdminErrorBoundary } from '@/components/error-boundary';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BarChart3,
  Settings,
  Package,
  ShoppingCart,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Inventory', href: '/admin/inventory', icon: Archive },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Affiliates', href: '/admin/affiliates', icon: UserCheck },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AdminRoute>
      <AdminErrorBoundary>
        <AdminProvider>
          <div className="min-h-screen bg-background">
        {/* Admin Header */}
        <header className="bg-surface border-b border-border-default">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin" className="text-2xl font-display font-bold text-primary">
                  Genie Admin
                </Link>
                <span className="text-sm text-text-secondary bg-primary/10 px-2 py-1 rounded">
                  Admin Panel
                </span>
              </div>
              <Link 
                href="/account" 
                className="text-sm text-text-secondary hover:text-primary transition-colors"
              >
                Back to Account
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <nav className="bg-surface border border-border-default rounded-lg p-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href !== '/admin' && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-text-primary hover:bg-background'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
          </div>
        </AdminProvider>
      </AdminErrorBoundary>
    </AdminRoute>
  );
}