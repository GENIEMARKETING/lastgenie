'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  DollarSign, 
  MousePointerClick, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  CreditCard,
  Download,
  RefreshCw
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface AffiliateApplication {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  reason: string;
  experience?: string;
  marketingChannels?: string;
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
  };
}

interface Affiliate {
  id: string;
  referralCode: string;
  status: 'active' | 'suspended' | 'inactive';
  commissionRate: number;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  payoutThreshold: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface Analytics {
  overview: {
    totalAffiliates: number;
    activeAffiliates: number;
    pendingApplications: number;
    totalClicks: number;
    totalConversions: number;
    totalCommissions: number;
    conversionRate: number;
  };
  recent: {
    recentClicks: number;
    recentConversions: number;
    recentCommissions: number;
    recentConversionRate: number;
  };
  topPerformers: Affiliate[];
}

interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'stripe_connect' | 'manual';
  stripeTransferId?: string;
  processedAt?: string;
  failureReason?: string;
  createdAt: string;
  affiliate: {
    id: string;
    referralCode: string;
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

export default function AdminAffiliatesPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'affiliates' | 'payouts'>('overview');
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<AffiliateApplication | null>(null);
  const [selectedAffiliates, setSelectedAffiliates] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [commissionRate, setCommissionRate] = useState(0.10);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        await fetchAnalytics();
      } else if (activeTab === 'applications') {
        await fetchApplications();
      } else if (activeTab === 'affiliates') {
        await fetchAffiliates();
      } else if (activeTab === 'payouts') {
        await fetchPayouts();
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    const response = await adminApi.getAffiliateAnalytics<Analytics>();
    if (response.success && response.data) {
      setAnalytics(response.data);
    }
  };

  const fetchApplications = async () => {
    const filters = {
      ...(statusFilter !== 'all' && { status: statusFilter })
    };
    
    const response = await adminApi.getAffiliateApplications<{
      applications: AffiliateApplication[];
    }>(filters);
    if (response.success && response.data) {
      setApplications(response.data.applications);
    }
  };

  const fetchAffiliates = async () => {
    const filters = {
      ...(searchTerm && { search: searchTerm })
    };
    
    const response = await adminApi.getAffiliates<{
      affiliates: Affiliate[];
    }>(filters);
    if (response.success && response.data) {
      setAffiliates(response.data.affiliates);
    }
  };

  const fetchPayouts = async () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.append('status', statusFilter);
    
    const response = await fetch(`/api/admin/affiliates/payouts?${params}`, {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      setPayouts(data.data.payouts);
    }
  };

  const handleReviewApplication = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/affiliates/applications/${applicationId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action,
          adminNotes: reviewNotes,
          ...(action === 'approve' && { commissionRate })
        })
      });

      if (response.ok) {
        setSelectedApplication(null);
        setReviewNotes('');
        setCommissionRate(0.10);
        fetchApplications();
        fetchAnalytics();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to review application');
      }
    } catch (err) {
      setError('Failed to review application');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedAffiliates.length === 0) return;

    try {
      const response = await fetch('/api/admin/affiliates/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: bulkAction,
          affiliateIds: selectedAffiliates
        })
      });

      if (response.ok) {
        setSelectedAffiliates([]);
        setBulkAction('');
        fetchAffiliates();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to perform bulk action');
      }
    } catch (err) {
      setError('Failed to perform bulk action');
    }
  };

  const handleCreatePayouts = async () => {
    if (selectedAffiliates.length === 0) return;

    try {
      const response = await fetch('/api/admin/affiliates/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          affiliateIds: selectedAffiliates,
          method: 'stripe_connect'
        })
      });

      if (response.ok) {
        setSelectedAffiliates([]);
        fetchPayouts();
        fetchAnalytics(); // Refresh analytics
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create payouts');
      }
    } catch (err) {
      setError('Failed to create payouts');
    }
  };

  const handleToggleAffiliate = (affiliateId: string) => {
    setSelectedAffiliates(prev => 
      prev.includes(affiliateId) 
        ? prev.filter(id => id !== affiliateId)
        : [...prev, affiliateId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">
          Affiliate Management
        </h1>
        <p className="text-text-secondary mt-2">
          Manage affiliate applications, partners, and program performance
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-border-default">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'applications', label: 'Applications', icon: Clock },
            { id: 'affiliates', label: 'Affiliates', icon: Users },
            { id: 'payouts', label: 'Payouts', icon: CreditCard }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
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
      {activeTab === 'overview' && analytics && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Affiliates</p>
                  <p className="text-3xl font-bold text-text-primary">{analytics.overview.totalAffiliates}</p>
                  <p className="text-sm text-green-600">{analytics.overview.activeAffiliates} active</p>
                </div>
                <Users className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Pending Applications</p>
                  <p className="text-3xl font-bold text-text-primary">{analytics.overview.pendingApplications}</p>
                </div>
                <Clock className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Clicks</p>
                  <p className="text-3xl font-bold text-text-primary">{analytics.overview.totalClicks.toLocaleString()}</p>
                  <p className="text-sm text-blue-600">{analytics.recent.recentClicks} recent</p>
                </div>
                <MousePointerClick className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Commissions</p>
                  <p className="text-3xl font-bold text-text-primary">${analytics.overview.totalCommissions.toFixed(2)}</p>
                  <p className="text-sm text-green-600">${analytics.recent.recentCommissions.toFixed(2)} recent</p>
                </div>
                <DollarSign className="h-12 w-12 text-primary opacity-20" />
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border-default rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Conversion Rates</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Overall</span>
                    <span className="font-semibold">{analytics.overview.conversionRate.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min(analytics.overview.conversionRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Recent (30 days)</span>
                    <span className="font-semibold">{analytics.recent.recentConversionRate.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{ width: `${Math.min(analytics.recent.recentConversionRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border-default rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Top Performers</h3>
              <div className="space-y-3">
                {analytics.topPerformers.slice(0, 5).map((affiliate, index) => (
                  <div key={affiliate.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center">
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
                      <p className="font-semibold text-text-primary">${affiliate.totalEarnings.toFixed(2)}</p>
                      <p className="text-sm text-text-secondary">{affiliate.totalConversions} sales</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border-default px-3 py-2 bg-surface"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <Button onClick={fetchApplications} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>

          {/* Applications Table */}
          <div className="bg-surface border border-border-default rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-border-default">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-text-primary">
                          {application.user.firstName} {application.user.lastName}
                        </p>
                        <p className="text-sm text-text-secondary">{application.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(application.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApplication(application)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Affiliates Tab */}
      {activeTab === 'affiliates' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  id="search"
                  placeholder="Search by email, name, or referral code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="affiliate-status-filter">Status</Label>
              <select
                id="affiliate-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border-default px-3 py-2 bg-surface"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <Button onClick={fetchAffiliates} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedAffiliates.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedAffiliates.length} affiliate{selectedAffiliates.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="rounded-md border border-border-default px-3 py-2 bg-surface text-sm"
                  >
                    <option value="">Select action...</option>
                    <option value="activate">Activate</option>
                    <option value="suspend">Suspend</option>
                    <option value="deactivate">Deactivate</option>
                  </select>
                  <Button size="sm" onClick={handleBulkAction} disabled={!bulkAction}>
                    Apply
                  </Button>
                  <Button size="sm" onClick={handleCreatePayouts} variant="outline">
                    <CreditCard className="h-4 w-4 mr-1" />
                    Create Payouts
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setSelectedAffiliates([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Affiliates Table */}
          <div className="bg-surface border border-border-default rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-border-default">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedAffiliates.length === affiliates.length && affiliates.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAffiliates(affiliates.map(a => a.id));
                        } else {
                          setSelectedAffiliates([]);
                        }
                      }}
                      className="rounded border-border-default"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedAffiliates.includes(affiliate.id)}
                        onChange={() => handleToggleAffiliate(affiliate.id)}
                        className="rounded border-border-default"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-text-primary">
                          {affiliate.user.firstName} {affiliate.user.lastName}
                        </p>
                        <p className="text-sm text-text-secondary">{affiliate.user.email}</p>
                        <p className="text-xs text-text-secondary font-mono">{affiliate.referralCode}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="text-text-primary">{affiliate.totalClicks} clicks</p>
                        <p className="text-text-secondary">{affiliate.totalConversions} conversions</p>
                        <p className="text-text-secondary">
                          {affiliate.totalClicks > 0 
                            ? ((affiliate.totalConversions / affiliate.totalClicks) * 100).toFixed(1)
                            : '0'
                          }% rate
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="text-text-primary font-medium">${affiliate.totalEarnings.toFixed(2)}</p>
                        <p className="text-yellow-600">${affiliate.pendingEarnings.toFixed(2)} pending</p>
                        <p className="text-green-600">${affiliate.paidEarnings.toFixed(2)} paid</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(affiliate.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(affiliate.status)}`}>
                          {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="payout-status-filter">Status</Label>
              <select
                id="payout-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border-default px-3 py-2 bg-surface"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <Button onClick={fetchPayouts} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Payouts Table */}
          <div className="bg-surface border border-border-default rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-border-default">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-text-primary">
                          {payout.affiliate.user.firstName} {payout.affiliate.user.lastName}
                        </p>
                        <p className="text-sm text-text-secondary">{payout.affiliate.user.email}</p>
                        <p className="text-xs text-text-secondary font-mono">{payout.affiliate.referralCode}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="font-semibold text-text-primary">${payout.amount.toFixed(2)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-text-secondary capitalize">
                        {payout.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payout.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payout.status)}`}>
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payout.status === 'pending' && (
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payouts.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">No payouts found</p>
            </div>
          )}
        </div>
      )}

      {/* Application Review Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-semibold text-text-primary">
                  Review Application
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-primary">Applicant Information</h3>
                  <p className="text-text-secondary">
                    {selectedApplication.user.firstName} {selectedApplication.user.lastName}
                  </p>
                  <p className="text-text-secondary">{selectedApplication.user.email}</p>
                  <p className="text-sm text-text-secondary">
                    Member since: {new Date(selectedApplication.user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-primary">Why they want to be an affiliate</h3>
                  <p className="text-text-secondary whitespace-pre-wrap">{selectedApplication.reason}</p>
                </div>

                {selectedApplication.experience && (
                  <div>
                    <h3 className="font-semibold text-text-primary">Previous Experience</h3>
                    <p className="text-text-secondary whitespace-pre-wrap">{selectedApplication.experience}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-text-primary">Marketing Channels</h3>
                  <p className="text-text-secondary whitespace-pre-wrap">{selectedApplication.marketingChannels}</p>
                </div>

                {selectedApplication.status === 'pending' && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <Label htmlFor="review-notes">Admin Notes (optional)</Label>
                      <Textarea
                        id="review-notes"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add any notes about this application..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="commission-rate">Commission Rate (for approval)</Label>
                      <Input
                        id="commission-rate"
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                      />
                      <p className="text-sm text-text-secondary mt-1">
                        Enter as decimal (e.g., 0.10 for 10%)
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleReviewApplication(selectedApplication.id, 'approve')}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReviewApplication(selectedApplication.id, 'reject')}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {selectedApplication.adminNotes && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-text-primary">Admin Notes</h3>
                    <p className="text-text-secondary whitespace-pre-wrap">{selectedApplication.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}