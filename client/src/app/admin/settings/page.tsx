'use client';

import { useState, useEffect } from 'react';
import adminApi from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Shield,
  ShieldCheck,
  Crown,
  Users,
  Mail,
  Globe,
  Database,
  Key,
  Bell,
  Palette,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
  };
  security: {
    requireEmailVerification: boolean;
    requireAgeVerification: boolean;
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  notifications: {
    emailNotifications: boolean;
    orderNotifications: boolean;
    affiliateNotifications: boolean;
    systemAlerts: boolean;
  };
  affiliate: {
    defaultCommissionRate: number;
    minimumPayout: number;
    payoutSchedule: string;
    autoApproval: boolean;
  };
}

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'super_admin';
  createdAt: string;
  lastLogin?: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'affiliate' | 'admins'>('general');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin');
  const [promotionReason, setPromotionReason] = useState('');

  // Mock settings data
  const mockSettings: SystemSettings = {
    general: {
      siteName: 'Genie',
      siteDescription: 'Premium sexual wellness drinks for enhanced vitality and connection',
      contactEmail: 'contact@genie.com',
      supportEmail: 'support@genie.com',
      maintenanceMode: false
    },
    security: {
      requireEmailVerification: true,
      requireAgeVerification: true,
      passwordMinLength: 8,
      sessionTimeout: 30,
      maxLoginAttempts: 5
    },
    notifications: {
      emailNotifications: true,
      orderNotifications: true,
      affiliateNotifications: true,
      systemAlerts: true
    },
    affiliate: {
      defaultCommissionRate: 0.10,
      minimumPayout: 50.00,
      payoutSchedule: 'monthly',
      autoApproval: false
    }
  };

  const mockAdminUsers: AdminUser[] = [
    {
      id: 'admin-1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'Test',
      role: 'admin',
      createdAt: '2026-01-22T20:00:26.962Z',
      lastLogin: '2026-01-22T19:30:00Z'
    },
    {
      id: 'admin-2',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      createdAt: '2026-01-22T19:24:38.014Z',
      lastLogin: '2026-01-22T18:45:00Z'
    },
    {
      id: 'admin-3',
      email: 'vinny@fatdogspirits.com',
      firstName: 'Vinny',
      lastName: 'Test',
      role: 'admin',
      createdAt: '2026-01-22T17:58:26.172Z',
      lastLogin: '2026-01-22T17:00:00Z'
    }
  ];

  useEffect(() => {
    fetchSettings();
    fetchAdminUsers();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setSettings(mockSettings);
    } catch (err) {
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await adminApi.getUsers<{
        users: any[];
      }>({
        role: 'admin',
        limit: 100
      });
      
      if (response.success && response.data?.users) {
        // Filter to only admin and super_admin users
        const adminUsers = response.data.users.filter((user: any) => 
          ['admin', 'super_admin'].includes(user.role)
        );
        setAdminUsers(adminUsers);
      } else {
        setError('Failed to fetch admin users');
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      setError('Failed to fetch admin users');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would POST to /api/admin/settings
      setSuccess('Settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePromoteUser = async () => {
    if (!newAdminEmail.trim() || !promotionReason.trim()) return;

    try {
      // First, find the user by email
      const usersResponse = await adminApi.getUsers<{
        users: any[];
      }>({
        search: newAdminEmail,
        limit: 1
      });

      if (!usersResponse.success || !usersResponse.data?.users?.length) {
        setError('User not found with that email address');
        return;
      }

      const user = usersResponse.data.users[0];

      // Promote the user
      const response = await adminApi.promoteUser(user.id, newAdminRole);

      if (response.success) {
        setShowAddAdminModal(false);
        setNewAdminEmail('');
        setPromotionReason('');
        fetchAdminUsers();
        setSuccess(`User promoted to ${newAdminRole} successfully`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to promote user');
      }
    } catch (err) {
      console.error('Error promoting user:', err);
      setError('Failed to promote user');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await adminApi.deleteUser(userId);

      if (response.success) {
        fetchAdminUsers();
        setSuccess('User deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    });
  };

  const getRoleIcon = (role: string) => {
    return role === 'super_admin' ? (
      <Crown className="h-4 w-4 text-yellow-600" />
    ) : (
      <ShieldCheck className="h-4 w-4 text-blue-600" />
    );
  };

  const getRoleBadge = (role: string) => {
    return role === 'super_admin'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">System Settings</h1>
          <p className="text-text-secondary">Configure system preferences and admin users</p>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-border-default">
        <nav className="flex space-x-8">
          {[
            { key: 'general', label: 'General', icon: Globe },
            { key: 'security', label: 'Security', icon: Shield },
            { key: 'notifications', label: 'Notifications', icon: Bell },
            { key: 'affiliate', label: 'Affiliate', icon: Users },
            { key: 'admins', label: 'Admin Users', icon: ShieldCheck }
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

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-surface border border-border-default rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-text-primary">General Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                value={settings.general.siteName}
                onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={settings.general.contactEmail}
                onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="site-description">Site Description</Label>
            <Textarea
              id="site-description"
              value={settings.general.siteDescription}
              onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="support-email">Support Email</Label>
            <Input
              id="support-email"
              type="email"
              value={settings.general.supportEmail}
              onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="maintenance-mode"
              checked={settings.general.maintenanceMode}
              onChange={(e) => updateSetting('general', 'maintenanceMode', e.target.checked)}
              className="rounded border-border-default"
            />
            <Label htmlFor="maintenance-mode" className="text-sm">
              Enable Maintenance Mode
            </Label>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="bg-surface border border-border-default rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-text-primary">Security Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="email-verification"
                checked={settings.security.requireEmailVerification}
                onChange={(e) => updateSetting('security', 'requireEmailVerification', e.target.checked)}
                className="rounded border-border-default"
              />
              <Label htmlFor="email-verification" className="text-sm">
                Require Email Verification
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="age-verification"
                checked={settings.security.requireAgeVerification}
                onChange={(e) => updateSetting('security', 'requireAgeVerification', e.target.checked)}
                className="rounded border-border-default"
              />
              <Label htmlFor="age-verification" className="text-sm">
                Require Age Verification
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="password-length">Minimum Password Length</Label>
              <Input
                id="password-length"
                type="number"
                min="6"
                max="20"
                value={settings.security.passwordMinLength}
                onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                min="5"
                max="480"
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
              <Input
                id="max-login-attempts"
                type="number"
                min="3"
                max="10"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-surface border border-border-default rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-text-primary">Notification Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="email-notifications"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
                className="rounded border-border-default"
              />
              <Label htmlFor="email-notifications" className="text-sm">
                Enable Email Notifications
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="order-notifications"
                checked={settings.notifications.orderNotifications}
                onChange={(e) => updateSetting('notifications', 'orderNotifications', e.target.checked)}
                className="rounded border-border-default"
              />
              <Label htmlFor="order-notifications" className="text-sm">
                Order Notifications
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="affiliate-notifications"
                checked={settings.notifications.affiliateNotifications}
                onChange={(e) => updateSetting('notifications', 'affiliateNotifications', e.target.checked)}
                className="rounded border-border-default"
              />
              <Label htmlFor="affiliate-notifications" className="text-sm">
                Affiliate Notifications
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="system-alerts"
                checked={settings.notifications.systemAlerts}
                onChange={(e) => updateSetting('notifications', 'systemAlerts', e.target.checked)}
                className="rounded border-border-default"
              />
              <Label htmlFor="system-alerts" className="text-sm">
                System Alerts
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Settings */}
      {activeTab === 'affiliate' && (
        <div className="bg-surface border border-border-default rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-text-primary">Affiliate Program Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="commission-rate">Default Commission Rate (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                min="0"
                max="50"
                step="0.01"
                value={settings.affiliate.defaultCommissionRate * 100}
                onChange={(e) => updateSetting('affiliate', 'defaultCommissionRate', parseFloat(e.target.value) / 100)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="minimum-payout">Minimum Payout ($)</Label>
              <Input
                id="minimum-payout"
                type="number"
                min="1"
                step="0.01"
                value={settings.affiliate.minimumPayout}
                onChange={(e) => updateSetting('affiliate', 'minimumPayout', parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="payout-schedule">Payout Schedule</Label>
            <select
              id="payout-schedule"
              value={settings.affiliate.payoutSchedule}
              onChange={(e) => updateSetting('affiliate', 'payoutSchedule', e.target.value)}
              className="mt-1 block w-full rounded-md border border-border-default px-3 py-2 bg-surface"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="auto-approval"
              checked={settings.affiliate.autoApproval}
              onChange={(e) => updateSetting('affiliate', 'autoApproval', e.target.checked)}
              className="rounded border-border-default"
            />
            <Label htmlFor="auto-approval" className="text-sm">
              Auto-approve Affiliate Applications
            </Label>
          </div>
        </div>
      )}

      {/* Admin Users */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Admin Users</h3>
            <Button
              onClick={() => setShowAddAdminModal(true)}
              className="flex items-center gap-2 bg-primary text-white"
            >
              <Plus className="h-4 w-4" />
              Add Admin
            </Button>
          </div>

          <div className="bg-surface border border-border-default rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-background border-b border-border-default">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Created</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Last Login</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((admin) => (
                  <tr key={admin.id} className="border-b border-border-default hover:bg-background/50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-text-primary">
                          {admin.firstName && admin.lastName
                            ? `${admin.firstName} ${admin.lastName}`
                            : 'No name'
                          }
                        </div>
                        <div className="text-sm text-text-secondary">{admin.email}</div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(admin.role)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(admin.role)}`}>
                          {admin.role.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className="text-text-secondary">{formatDate(admin.createdAt)}</span>
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className="text-text-secondary">
                        {admin.lastLogin ? formatDateTime(admin.lastLogin) : 'Never'}
                      </span>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNewAdminEmail(admin.email);
                            setNewAdminRole(admin.role === 'super_admin' ? 'super_admin' : 'admin');
                            setShowAddAdminModal(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        
                        {admin.role !== 'super_admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(admin.id, admin.email)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border-default rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Promote User to Admin
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-email">User Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Enter user email to promote..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="admin-role">Target Role</Label>
                <select
                  id="admin-role"
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'super_admin')}
                  className="mt-1 block w-full rounded-md border border-border-default px-3 py-2 bg-surface"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="admin-reason">Reason for Promotion</Label>
                <Textarea
                  id="admin-reason"
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
                  setShowAddAdminModal(false);
                  setNewAdminEmail('');
                  setPromotionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePromoteUser}
                disabled={!newAdminEmail.trim() || !promotionReason.trim()}
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