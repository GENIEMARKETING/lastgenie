'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { verifyAge } from '@/lib/api/age-verification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VerifyAgePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const returnUrl = searchParams.get('return') || '/cart';

  useEffect(() => {
    // Redirect if already verified
    if (!authLoading && user?.isAgeVerified) {
      router.push(returnUrl);
    }
  }, [user, authLoading, router, returnUrl]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?return=${encodeURIComponent('/verify-age' + (returnUrl !== '/cart' ? `?return=${encodeURIComponent(returnUrl)}` : ''))}`);
    }
  }, [authLoading, isAuthenticated, router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user?.id) {
      setError('You must be logged in to verify your age');
      return;
    }

    if (!dateOfBirth) {
      setError('Please enter your date of birth');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      setError('Please enter a valid date in YYYY-MM-DD format');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyAge(user.id, dateOfBirth);

      if (response.success && response.data?.verified) {
        setIsVerified(true);
        // Refresh user data to get updated verification status
        await refreshUser();
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push(returnUrl);
        }, 2000);
      } else {
        setError(response.error || response.message || 'Age verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate max date (18 years ago)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Calculate min date (150 years ago for validation)
  const minDate = new Date(today.getFullYear() - 150, today.getMonth(), today.getDate());
  const minDateString = minDate.toISOString().split('T')[0];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-surface rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="font-display text-3xl font-bold text-text-primary mb-4">
              Age Verified Successfully
            </h1>
            <p className="text-text-secondary mb-6">
              Your age has been verified. Redirecting you back...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-surface rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-text-primary mb-4">
              Age Verification Required
            </h1>
            <p className="text-text-secondary">
              To comply with legal requirements, we need to verify that you are 18 years or older to purchase our products.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="dateOfBirth" required>
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={maxDateString}
                min={minDateString}
                required
                className="mt-1"
                placeholder="YYYY-MM-DD"
              />
              <p className="mt-2 text-sm text-text-secondary">
                You must be 18 or older to purchase
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Verification Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Privacy Notice:</strong> Your date of birth is used solely for age verification purposes. 
                We do not store your full date of birth, only your verification status.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={isSubmitting}
                disabled={!dateOfBirth || isSubmitting}
              >
                Verify Age
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
