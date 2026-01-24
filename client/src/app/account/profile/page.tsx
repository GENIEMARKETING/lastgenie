'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { updateProfile, changePassword } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsProfileLoading(true);

    try {
      const response = await updateProfile(profileData);
      if (response.success) {
        setProfileSuccess('Profile updated successfully');
        await refreshUser();
      } else {
        setProfileError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setIsPasswordLoading(true);

    try {
      const response = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (response.success) {
        setPasswordSuccess('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setPasswordError(response.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">Profile Settings</h1>
        <p className="text-text-secondary mt-2">Manage your account information</p>
      </div>

      {/* Profile Information */}
      <div className="bg-surface border border-border-default rounded-lg p-6">
        <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
          Profile Information
        </h2>

        {profileSuccess && (
          <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg">
            <p className="text-sm text-success">{profileSuccess}</p>
          </div>
        )}

        {profileError && (
          <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">{profileError}</p>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName" required>
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                value={profileData.firstName}
                onChange={(e) =>
                  setProfileData({ ...profileData, firstName: e.target.value })
                }
                required
                disabled={isProfileLoading}
              />
            </div>

            <div>
              <Label htmlFor="lastName" required>
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                value={profileData.lastName}
                onChange={(e) =>
                  setProfileData({ ...profileData, lastName: e.target.value })
                }
                required
                disabled={isProfileLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" required>
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              required
              disabled={isProfileLoading}
            />
            <p className="mt-1 text-sm text-text-secondary">
              Changing your email will require verification
            </p>
          </div>

          <Button type="submit" variant="primary" isLoading={isProfileLoading}>
            Save Changes
          </Button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-surface border border-border-default rounded-lg p-6">
        <h2 className="text-xl font-display font-semibold text-text-primary mb-6">
          Change Password
        </h2>

        {passwordSuccess && (
          <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg">
            <p className="text-sm text-success">{passwordSuccess}</p>
          </div>
        )}

        {passwordError && (
          <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">{passwordError}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div>
            <Label htmlFor="currentPassword" required>
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              required
              autoComplete="current-password"
              disabled={isPasswordLoading}
            />
          </div>

          <div>
            <Label htmlFor="newPassword" required>
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              required
              autoComplete="new-password"
              disabled={isPasswordLoading}
            />
            <p className="mt-1 text-sm text-text-secondary">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword" required>
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              required
              autoComplete="new-password"
              disabled={isPasswordLoading}
            />
          </div>

          <Button type="submit" variant="primary" isLoading={isPasswordLoading}>
            Change Password
          </Button>
        </form>
      </div>
    </div>
  );
}