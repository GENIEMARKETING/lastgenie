'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Crown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  Download,
  Mail
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'customer' | 'admin' | 'super_admin';
  emailVerified: Date | null;
  isAgeVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
  };
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  customerUsers: number;
  verifiedUsers: number;
  recentUsers: number;
  verificationRate: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promotionReason, setPromotionReason] = useState('');
  const [targetRole, setTargetRole] = useState<'admin' | 'super_admin'>('admin');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const filters = {
        page: currentPage,
        limit: 20,
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await adminApi.getUsers<{
        users: User[];
        pagination: {
          totalPages: number;
        };
      }>(filters);

      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        throw new Error(response.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getUserStats<UserStats>();

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const handlePromoteUser = async () => {
    if (!selectedUser || !promotionReason.trim()) return;

    try {
      const response = await adminApi.promoteUser(selectedUser.id, targetRole as 'admin' | 'super_admin');

      if (response.success) {
        setShowPromoteModal(false);
        setSelectedUser(null);
        setPromotionReason('');
        fetchUsers();
        fetchStats();
      } else {
        setError(response.error || 'Failed to promote user');
      }
    } catch (err) {
      setError('Failed to promote user');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string, reason: string) => {
    try {
      const response = await adminApi.updateUser(userId, {
        role: newRole as 'customer' | 'admin' | 'super_admin'
      });

      if (response.success) {
        fetchUsers();
        fetchStats();
      } else {
        setError(response.error || 'Failed to update user role');
      }
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-blue-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && users.length === 0) {
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
          <h1 className="text-3xl font-bold text-text-primary">User Management</h1>
          <p className="text-text-secondary">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchUsers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Users</p>
                <p className="text-3xl font-bold text-text-primary">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-blue-600">{stats.recentUsers} recent</p>
              </div>
              <Users className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Admin Users</p>
                <p className="text-3xl font-bold text-text-primary">{stats.adminUsers}</p>
                <p className="text-sm text-text-secondary">{stats.customerUsers} customers</p>
              </div>
              <ShieldCheck className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Verified Users</p>
                <p className="text-3xl font-bold text-text-primary">{stats.verifiedUsers}</p>
                <p className="text-sm text-green-600">{(stats.verificationRate || 0).toFixed(1)}% rate</p>
              </div>
              <CheckCircle className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-surface border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">New This Month</p>
                <p className="text-3xl font-bold text-text-primary">{stats.recentUsers}</p>
                <p className="text-sm text-text-secondary">30 days</p>
              </div>
              <UserPlus className="h-12 w-12 text-primary opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface border border-border-default rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                id="search"
                type="text"
                placeholder="Search by email, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role-filter">Role Filter</Label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border-default px-3 py-2 bg-surface"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface border border-border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border-default">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">User</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Orders</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Joined</th>
                <th className="text-left py-3 px-4 font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border-default hover:bg-background/50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-text-primary">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : 'No name'
                        }
                      </div>
                      <div className="text-sm text-text-secondary">{user.email}</div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {user.emailVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          {user.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      {user.isAgeVerified && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-600">Age Verified</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <span className="text-text-primary font-medium">{user._count.orders}</span>
                  </td>
                  
                  <td className="py-4 px-4">
                    <span className="text-text-secondary">{formatDate(user.createdAt)}</span>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {user.role === 'customer' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPromoteModal(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Promote
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-default">
            <div className="text-sm text-text-secondary">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Promote User Modal */}
      {showPromoteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border-default rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Promote User to Admin
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-secondary">User:</p>
                <p className="font-medium text-text-primary">
                  {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                </p>
              </div>
              
              <div>
                <Label htmlFor="target-role">Target Role</Label>
                <select
                  id="target-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as 'admin' | 'super_admin')}
                  className="mt-1 block w-full rounded-md border border-border-default px-3 py-2 bg-surface"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="promotion-reason">Reason for Promotion</Label>
                <Textarea
                  id="promotion-reason"
                  value={promotionReason}
                  onChange={(e) => setPromotionReason(e.target.value)}
                  placeholder="Enter reason for promoting this user..."
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPromoteModal(false);
                  setSelectedUser(null);
                  setPromotionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePromoteUser}
                disabled={!promotionReason.trim()}
                className="bg-primary text-white"
              >
                Promote User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}