'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { User, getCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister, LoginData, RegisterData, ApiResponse } from './api/auth';
import { getProtectedRouteRedirect, extractReturnUrl, extractIntent, handleAuthenticatedUserRedirect } from './redirect-utils';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasRole: (role: string | string[]) => boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<ApiResponse<{ user: User }>>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: LoginData) => {
    try {
      const response = await apiLogin(data);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        // Don't redirect here - let the login page handle the redirect
        // This allows for proper returnUrl handling
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<ApiResponse<{ user: User }>> => {
    try {
      const response = await apiRegister(data);
      if (response.success && response.data?.user) {
        // Don't set user or redirect - user needs to verify email first
        // The signup page will show success message and verification URL
        return response;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if API call fails
      setUser(null);
      router.push('/');
    }
  };

  // Role-based helper functions
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  
  const hasRole = (role: string | string[]): boolean => {
    if (!user?.role) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        hasRole,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Protected route wrapper component
 */
function ProtectedRouteContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Get current path and create login URL with returnUrl
      const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      const loginUrl = getProtectedRouteRedirect(currentPath);
      router.push(loginUrl);
    }
  }, [isAuthenticated, isLoading, router, pathname, searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProtectedRouteContent>{children}</ProtectedRouteContent>
    </Suspense>
  );
}

/**
 * Admin route wrapper component
 * Requires user to be authenticated and have admin or super_admin role
 */
function AdminRouteContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated - redirect to login with return URL
        const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
        const loginUrl = getProtectedRouteRedirect(currentPath);
        router.push(loginUrl);
        return;
      }

      if (!user?.role || !['admin', 'super_admin'].includes(user.role)) {
        // Authenticated but not admin - redirect to account with error message
        router.push('/account?error=insufficient_permissions');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user?.role, router, pathname, searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!user?.role || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Access Denied</h1>
          <p className="text-text-secondary mb-4">
            You don't have permission to access the admin portal.
          </p>
          <button
            onClick={() => router.push('/account')}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminRouteContent>{children}</AdminRouteContent>
    </Suspense>
  );
}

/**
 * Auth page guard component
 * Prevents authenticated users from accessing login/signup pages
 */
function AuthPageGuardContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // User is authenticated and trying to access auth page
      const returnUrl = extractReturnUrl(searchParams);
      const intent = extractIntent(searchParams);
      
      console.log('Authenticated user accessing auth page, redirecting...', {
        returnUrl,
        intent,
        currentPath: pathname
      });
      
      // Redirect authenticated user away from auth pages
      handleAuthenticatedUserRedirect(router, returnUrl, intent);
    }
  }, [isAuthenticated, isLoading, router, searchParams, pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, don't show the auth page content
  // The useEffect above will handle the redirect
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // User is not authenticated, show the auth page
  return <>{children}</>;
}

export function AuthPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageGuardContent>{children}</AuthPageGuardContent>
    </Suspense>
  );
}