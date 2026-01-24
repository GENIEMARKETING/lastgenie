'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLoginUrl } from '@/lib/redirect-utils';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await forgotPassword(email);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-surface border border-border-default rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Reset Password</h1>
        <p className="text-text-secondary mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div className="space-y-6">
            <div className="p-4 bg-success/10 border border-success rounded-lg">
              <p className="text-sm text-success">
                If an account with that email exists, a password reset link has been sent. Please check your email.
              </p>
            </div>
            <Link href={createLoginUrl()}>
              <Button variant="primary" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
                <p className="text-sm text-error">{error}</p>
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

              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href={createLoginUrl()}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}