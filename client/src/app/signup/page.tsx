'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, AuthPageGuard } from '@/lib/auth-context';
import { useGuestCheckout } from '@/lib/guest-checkout-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractReturnUrl, extractIntent, createLoginUrl } from '@/lib/redirect-utils';
import { updateProfile } from '@/lib/api/auth';
import { createAddress } from '@/lib/api/addresses';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { 
    contactInfo, 
    shippingAddress: guestShippingAddress, 
    billingAddress: guestBillingAddress,
    clearGuestData 
  } = useGuestCheckout();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = extractReturnUrl(searchParams);
  const intent = extractIntent(searchParams);

  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; text: string } => {
    if (pwd.length < 8) return { strength: 'weak', text: 'Too short' };
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return { strength: 'strong', text: 'Strong' };
    }
    if (pwd.length >= 8 && (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd))) {
      return { strength: 'medium', text: 'Medium' };
    }
    return { strength: 'weak', text: 'Weak' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  // Auto-populate form with guest checkout data
  useEffect(() => {
    if (contactInfo && intent === 'checkout') {
      setFirstName(contactInfo.firstName || '');
      setLastName(contactInfo.lastName || '');
      setEmail(contactInfo.email || '');
    }
  }, [contactInfo, intent]);

  // Save guest checkout data to user profile and address book
  const saveGuestDataToProfile = async () => {
    try {
      // Update user profile with contact info
      if (contactInfo?.phone) {
        await updateProfile({
          phone: contactInfo.phone,
        });
      }

      // Save shipping address
      if (guestShippingAddress && guestShippingAddress.street1) {
        await createAddress({
          streetAddress: guestShippingAddress.street1 + (guestShippingAddress.street2 ? ` ${guestShippingAddress.street2}` : ''),
          city: guestShippingAddress.city,
          state: guestShippingAddress.state,
          zipCode: guestShippingAddress.postalCode,
          country: guestShippingAddress.country,
          phone: guestShippingAddress.phone,
          type: 'shipping',
          isDefault: true,
        });
      }

      // Save billing address if different from shipping
      if (guestBillingAddress && guestBillingAddress.street1) {
        await createAddress({
          streetAddress: guestBillingAddress.street1 + (guestBillingAddress.street2 ? ` ${guestBillingAddress.street2}` : ''),
          city: guestBillingAddress.city,
          state: guestBillingAddress.state,
          zipCode: guestBillingAddress.postalCode,
          country: guestBillingAddress.country,
          phone: guestBillingAddress.phone,
          type: 'billing',
          isDefault: true,
        });
      }

      // Clear guest data after successful save
      clearGuestData();
    } catch (error) {
      console.error('Failed to save guest data to profile:', error);
      // Don't throw error - this is not critical for signup success
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({ firstName, lastName, email, password });
      setRegisteredEmail(email);
      setSuccess(true);
      
      // Store verification URL if provided (dev mode)
      if (response.data?.verificationUrl) {
        setVerificationUrl(response.data.verificationUrl);
        console.log('Verification URL received:', response.data.verificationUrl);
      } else {
        console.log('No verification URL in response:', {
          hasData: !!response.data,
          hasVerificationUrl: !!response.data?.verificationUrl,
          devMode: response.data?.devMode,
        });
      }

      // Save guest checkout data to profile if this is a checkout signup
      if (intent === 'checkout') {
        await saveGuestDataToProfile();
      }
      
      // Clear form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageGuard>
      <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-surface border border-border-default rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Create Account</h1>
        <p className="text-text-secondary mb-8">Sign up to get started with Genie</p>

        {success && (
          <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg">
            <p className="text-sm text-success font-medium mb-2">
              Registration successful!
            </p>
            <p className="text-sm text-text-secondary mb-3">
              We've sent a verification email to <strong>{registeredEmail}</strong>. 
              Please check your inbox and click the verification link to activate your account.
            </p>
            {verificationUrl && (
              <div className="mt-4 p-3 bg-surface border border-border-default rounded">
                <p className="text-xs text-text-secondary mb-2 font-medium">
                  Development Mode - Verification Link:
                </p>
                <a
                  href={verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary/80 break-all underline"
                >
                  {verificationUrl}
                </a>
                <p className="text-xs text-text-secondary mt-2">
                  Click the link above to verify your email address.
                </p>
              </div>
            )}
            <div className="mt-4 text-center">
              <Link 
                href={createLoginUrl(returnUrl || undefined, intent || undefined)}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Continue to Sign In →
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Guest Checkout Data Indicator */}
        {intent === 'checkout' && contactInfo && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
              Checkout Information Detected
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              We've pre-filled your information from the checkout form. Your address and contact details will be saved to your account.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" required>
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                autoComplete="given-name"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="lastName" required>
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                autoComplete="family-name"
                disabled={isLoading}
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
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              disabled={isLoading}
            />
            {password && passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-border-default rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength.strength === 'weak'
                          ? 'bg-error w-1/3'
                          : passwordStrength.strength === 'medium'
                          ? 'bg-warning w-2/3'
                          : 'bg-success w-full'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-text-secondary">{passwordStrength.text}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword" required>
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Already have an account?{' '}
            <Link 
              href={createLoginUrl(returnUrl || undefined, intent || undefined)} 
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
      </div>
    </AuthPageGuard>
  );
}