'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, AuthPageGuard } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractReturnUrl, extractIntent, handlePostAuthRedirect, createSignupUrl } from '@/lib/redirect-utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = extractReturnUrl(searchParams);
  const intent = extractIntent(searchParams);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      // Handle redirect after successful login with intent support
      handlePostAuthRedirect(router, returnUrl, intent);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      
      // Provide specific guidance for email verification issues
      if (errorMessage.includes('Email not verified') || errorMessage.includes('verify your email')) {
        setError('Please verify your email address before logging in. Check your inbox for the verification link, or use the manual verification option on the verification page.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageGuard>
      <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-surface border border-border-default rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Welcome Back</h1>
        <p className="text-text-secondary mb-8">Sign in to your account to continue</p>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">{error}</p>
            {error.includes('verify your email') && (
              <div className="mt-2">
                <Link 
                  href="/verify-email" 
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Go to Email Verification →
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" required>
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link 
              href={createSignupUrl(returnUrl || undefined, intent || undefined)} 
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
      </div>
    </AuthPageGuard>
  );
}