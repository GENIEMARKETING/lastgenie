'use client';

import { useState, useEffect } from 'react';
import adminApi from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  UserCheck,
  MousePointerClick,
  RefreshCw,
  Calendar,
  Download,
  Filter,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Globe
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
    totalUsers: number;
    usersGrowth: number;
    conversionRate: number;
    conversionGrowth: number;
  };
  sales: {
    daily: { date: string; revenue: number; orders: number }[];
    monthly: { month: string; revenue: number; orders: number }[];
    topProducts: { name: string; sales: number; revenue: number }[];
  };
  users: {
    newUsers: { date: string; count: number }[];
    usersBySource: { source: string; count: number; percentage: number }[];
    retentionRate: number;
  };
  affiliates: {
    totalAffiliates: number;
    activeAffiliates: number;
    totalClicks: number;
    totalConversions: number;
    totalCommissions: number;
    conversionRate: number;
    topPerformers: {
      id: string;
      referralCode: string;
      user: { firstName?: string; lastName?: string };
      totalEarnings: number;
      totalConversions: number;
    }[];
  };
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'users' | 'affiliates'>('overview');

  // Mock analytics data
  const mockAnalyticsData: AnalyticsData = {
    overview: {
      totalRevenue: 42350.75,
      revenueGrowth: 12.5,
      totalOrders: 856,
      ordersGrowth: 8.3,
      totalUsers: 1247,
      usersGrowth: 15.2,
      conversionRate: 3.4,
      conversionGrowth: -2.1
    },
    sales: {
      daily: [
        { date: '2026-01-15', revenue: 1250.00, orders: 25 },
        { date: '2026-01-16', revenue: 1380.50, orders: 28 },
        { date: '2026-01-17', revenue: 1120.75, orders: 22 },
        { date: '2026-01-18', revenue: 1450.25, orders: 31 },
        { date: '2026-01-19', revenue: 1680.00, orders: 34 },
        { date: '2026-01-20', revenue: 1520.50, orders: 29 },
        { date: '2026-01-21', revenue: 1750.25, orders: 36 },
        { date: '2026-01-22', revenue: 1890.75, orders: 38 }
      ],
      monthly: [
        { month: 'Oct 2025', revenue: 35200.00, orders: 720 },
        { month: 'Nov 2025', revenue: 38750.50, orders: 785 },
        { month: 'Dec 2025', revenue: 41200.75, orders: 834 },
        { month: 'Jan 2026', revenue: 42350.75, orders: 856 }
      ],
      topProducts: [
        { name: 'Genie for Him - Single Bottle', sales: 245, revenue: 2450.00 },
        { name: 'Genie for Her - Single Bottle', sales: 189, revenue: 1890.00 },
        { name: 'Genie for Him - 12 Pack', sales: 67, revenue: 6633.00 },
        { name: 'Genie for Her - 12 Pack', sales: 52, revenue: 5148.00 },
        { name: 'Genie Starter Kit', sales: 23, revenue: 414.00 }
      ]
    },
    users: {
      newUsers: [
        { date: '2026-01-15', count: 12 },
        { date: '2026-01-16', count: 15 },
        { date: '2026-01-17', count: 8 },
        { date: '2026-01-18', count: 18 },
        { date: '2026-01-19', count: 22 },
        { date: '2026-01-20', count: 19 },
        { date: '2026-01-21', count: 25 },
        { date: '2026-01-22', count: 23 }
      ],
      usersBySource: [
        { source: 'Organic Search', count: 456, percentage: 36.6 },
        { source: 'Social Media', count: 312, percentage: 25.0 },
        { source: 'Affiliate Links', count: 234, percentage: 18.8 },
        { source: 'Direct', count: 156, percentage: 12.5 },
        { source: 'Email', count: 89, percentage: 7.1 }
      ],
      retentionRate: 68.5
    },
    affiliates: {
      totalAffiliates: 45,
      activeAffiliates: 32,
      totalClicks: 12450,
      totalConversions: 234,
      totalCommissions: 8750.25,
      conversionRate: 1.88,
      topPerformers: [
        {
          id: '1',
          referralCode: 'HEALTH123',
          user: { firstName: 'Sarah', lastName: 'Johnson' },
          totalEarnings: 1250.75,
          totalConversions: 45
        },
        {
          id: '2',
          referralCode: 'FITNESS456',
          user: { firstName: 'Mike', lastName: 'Chen' },
          totalEarnings: 980.50,
          totalConversions: 38
        },
        {
          id: '3',
          referralCode: 'WELLNESS789',
          user: { firstName: 'Emma', lastName: 'Davis' },
          totalEarnings: 756.25,
          totalConversions: 29
        }
      ]
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const period = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 30;
      
      // Fetch all analytics data in parallel
      const [overviewResponse, salesResponse, customerResponse] = await Promise.all([
        adminApi.getAnalyticsOverview(period),
        adminApi.getSalesAnalytics(period),
        adminApi.getCustomerAnalytics(period)
      ]);

      if (!overviewResponse.success || !salesResponse.success || !customerResponse.success) {
        throw new Error('Failed to fetch analytics data');
      }

      // Transform API data to match component interface
      const transformedData: AnalyticsData = {
        overview: {
          totalRevenue: overviewResponse.data.overview.totalRevenue,
          revenueGrowth: calculateGrowth(overviewResponse.data.overview.totalRevenue, overviewResponse.data.overview.periodRevenue),
          totalOrders: overviewResponse.data.overview.totalOrders,
          ordersGrowth: calculateGrowth(overviewResponse.data.overview.totalOrders, overviewResponse.data.overview.periodOrders),
          totalUsers: overviewResponse.data.overview.totalUsers,
          usersGrowth: calculateGrowth(overviewResponse.data.overview.totalUsers, overviewResponse.data.overview.periodUsers),
          conversionRate: overviewResponse.data.overview.conversionRate,
          conversionGrowth: 0 // TODO: Calculate based on previous period
        },
        sales: {
          daily: overviewResponse.data.charts.revenueByDay.map((item: any) => ({
            date: item.date,
            revenue: item.revenue,
            orders: 0 // TODO: Add order count per day
          })),
          monthly: [], // TODO: Implement monthly aggregation
          topProducts: overviewResponse.data.charts.topProducts.map((item: any) => ({
            name: item.name,
            sales: item.totalSold,
            revenue: item.totalSold * item.price
          }))
        },
        users: {
          newUsers: overviewResponse.data.charts.userGrowth.map((item: any) => ({
            date: item.date,
            count: item.newUsers
          })),
          usersBySource: [
            { source: 'Direct', count: Math.floor(overviewResponse.data.overview.periodUsers * 0.4), percentage: 40 },
            { source: 'Organic Search', count: Math.floor(overviewResponse.data.overview.periodUsers * 0.3), percentage: 30 },
            { source: 'Social Media', count: Math.floor(overviewResponse.data.overview.periodUsers * 0.2), percentage: 20 },
            { source: 'Other', count: Math.floor(overviewResponse.data.overview.periodUsers * 0.1), percentage: 10 }
          ],
          retentionRate: customerResponse.data.customerRetention.retentionRate
        },
        affiliates: {
          totalAffiliates: overviewResponse.data.affiliates?.totalAffiliates || 0,
          activeAffiliates: overviewResponse.data.affiliates?.totalAffiliates || 0,
          totalClicks: 0, // TODO: Implement click tracking
          totalConversions: 0, // TODO: Implement conversion tracking
          totalCommissions: overviewResponse.data.affiliates?.totalCommissions || 0,
          conversionRate: 0,
          topPerformers: [] // TODO: Implement top performers
        }
      };

      setAnalyticsData(transformedData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data');
      // Fallback to mock data if API fails
      setAnalyticsData(mockAnalyticsData);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (total: number, period: number): number => {
    if (total === 0) return 0;
    const previous = total - period;
    if (previous === 0) return period > 0 ? 100 : 0;
    return ((period - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error || 'Failed to load analytics data'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Analytics Dashboard</h1>
          <p className="text-text-secondary">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border border-border-default px-3 py-2 bg-surface"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            onClick={fetchAnalyticsData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border-default">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'sales', label: 'Sales', icon: DollarSign },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'affiliates', label: 'Affiliates', icon: UserCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Revenue</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {formatCurrency(analyticsData.overview.totalRevenue)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(analyticsData.overview.revenueGrowth)}
                    <span className={`text-sm ${getGrowthColor(analyticsData.overview.revenueGrowth)}`}>
                      {formatPercentage(analyticsData.overview.revenueGrowth)}
                    </span>
                  </div>
                </div>
                <DollarSign className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Orders</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {analyticsData.overview.totalOrders.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(analyticsData.overview.ordersGrowth)}
                    <span className={`text-sm ${getGrowthColor(analyticsData.overview.ordersGrowth)}`}>
                      {formatPercentage(analyticsData.overview.ordersGrowth)}
                    </span>
                  </div>
                </div>
                <ShoppingCart className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Users</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {analyticsData.overview.totalUsers.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(analyticsData.overview.usersGrowth)}
                    <span className={`text-sm ${getGrowthColor(analyticsData.overview.usersGrowth)}`}>
                      {formatPercentage(analyticsData.overview.usersGrowth)}
                    </span>
                  </div>
                </div>
                <Users className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Conversion Rate</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {analyticsData.overview.conversionRate}%
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(analyticsData.overview.conversionGrowth)}
                    <span className={`text-sm ${getGrowthColor(analyticsData.overview.conversionGrowth)}`}>
                      {formatPercentage(analyticsData.overview.conversionGrowth)}
                    </span>
                  </div>
                </div>
                <Target className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border-default rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue Trend</h3>
              <div className="h-64 flex items-center justify-center text-text-secondary">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Revenue chart will be implemented with a charting library</p>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">User Growth</h3>
              <div className="h-64 flex items-center justify-center text-text-secondary">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>User growth chart will be implemented with a charting library</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border-default rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Top Selling Products</h3>
            <div className="space-y-3">
              {analyticsData.sales.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-primary text-white text-sm rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-text-primary">{product.name}</p>
                      <p className="text-sm text-text-secondary">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-primary">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Sales Performance</h3>
            <div className="h-64 flex items-center justify-center text-text-secondary">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Sales performance charts will be implemented with a charting library</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border-default rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">User Acquisition Sources</h3>
              <div className="space-y-3">
                {analyticsData.users.usersBySource.map((source) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-text-primary">{source.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary font-medium">{source.count}</span>
                      <span className="text-sm text-text-secondary">({source.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">User Retention</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{analyticsData.users.retentionRate}%</div>
                <p className="text-text-secondary">30-day retention rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Affiliates Tab */}
      {activeTab === 'affiliates' && (
        <div className="space-y-6">
          {/* Affiliate Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Affiliates</p>
                  <p className="text-3xl font-bold text-text-primary">{analyticsData.affiliates.totalAffiliates}</p>
                  <p className="text-sm text-green-600">{analyticsData.affiliates.activeAffiliates} active</p>
                </div>
                <UserCheck className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Clicks</p>
                  <p className="text-3xl font-bold text-text-primary">{analyticsData.affiliates.totalClicks.toLocaleString()}</p>
                  <p className="text-sm text-blue-600">{analyticsData.affiliates.totalConversions} conversions</p>
                </div>
                <MousePointerClick className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Commissions</p>
                  <p className="text-3xl font-bold text-text-primary">{formatCurrency(analyticsData.affiliates.totalCommissions)}</p>
                  <p className="text-sm text-green-600">paid out</p>
                </div>
                <DollarSign className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Conversion Rate</p>
                  <p className="text-3xl font-bold text-text-primary">{analyticsData.affiliates.conversionRate}%</p>
                  <p className="text-sm text-text-secondary">click to sale</p>
                </div>
                <Target className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-surface border border-border-default rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Top Performing Affiliates</h3>
            <div className="space-y-3">
              {analyticsData.affiliates.topPerformers.map((affiliate, index) => (
                <div key={affiliate.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-primary text-white text-sm rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-text-primary">
                        {affiliate.user.firstName} {affiliate.user.lastName}
                      </p>
                      <p className="text-sm text-text-secondary">{affiliate.referralCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-primary">{formatCurrency(affiliate.totalEarnings)}</p>
                    <p className="text-sm text-text-secondary">{affiliate.totalConversions} conversions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}