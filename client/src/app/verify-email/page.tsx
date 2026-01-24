'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Mail, Key } from 'lucide-react';
import { createLoginUrl, extractReturnUrl, extractIntent, handlePostAuthRedirect } from '@/lib/redirect-utils';
import { verifyEmailWithToken, manualVerifyEmail } from '@/lib/api/auth';

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [showManualVerification, setShowManualVerification] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const returnUrl = extractReturnUrl(searchParams);
  const intent = extractIntent(searchParams);

  useEffect(() => {
    // Handle automatic verification from email link
    if (token) {
      verifyToken(token);
    } else if (success === 'true') {
      setVerificationResult({
        success: true,
        message: 'Your email has been verified successfully! You can now log in to your account.'
      });
    } else if (error) {
      setVerificationResult({
        success: false,
        message: getErrorMessage(error)
      });
    }
  }, [token, success, error]);

  const verifyToken = async (verificationToken: string, isManual = false) => {
    setIsVerifying(true);
    try {
      let response;
      
      if (isManual) {
        // For manual verification, we need email + verification code
        // Since we don't have email here, we'll use the token-based verification for now
        response = await verifyEmailWithToken(verificationToken);
      } else {
        // Use regular verification endpoint
        response = await verifyEmailWithToken(verificationToken);
      }

      if (response.success) {
        setVerificationResult({
          success: true,
          message: 'Your email has been verified successfully! You can now log in to your account.'
        });
        
        // If verification was successful and we have auth cookies, redirect immediately
        // This handles the case where verification sets auth cookies
        setTimeout(() => {
          handlePostAuthRedirect(router, returnUrl, intent);
        }, 1500);
      } else {
        setVerificationResult({
          success: false,
          message: response.error || 'Verification failed. Please try again.'
        });
      }
    } catch (error) {
      setVerificationResult({
        success: false,
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    
    await verifyToken(manualToken.trim(), true);
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'verification_failed':
        return 'Email verification failed. The link may be expired or invalid.';
      case 'already_verified':
        return 'Your email is already verified. You can log in to your account.';
      default:
        return 'An error occurred during verification. Please try again.';
    }
  };

  if (isVerifying) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="bg-surface border border-border-default rounded-lg p-8 shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
            Verifying Email
          </h1>
          <p className="text-text-secondary">
            Please wait while we verify your email address...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-surface border border-border-default rounded-lg p-8 shadow-sm">
        {verificationResult ? (
          <div className="text-center">
            <div className="mb-6">
              {verificationResult.success ? (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              )}
              <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
                {verificationResult.success ? 'Email Verified!' : 'Verification Failed'}
              </h1>
              <p className="text-text-secondary">
                {verificationResult.message}
              </p>
            </div>

            <div className="space-y-4">
              {verificationResult.success ? (
                <Link href={createLoginUrl(returnUrl || undefined, intent || undefined)}>
                  <Button variant="primary" className="w-full">
                    Continue to Login
                  </Button>
                </Link>
              ) : (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowManualVerification(true)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Try Manual Verification
                  </Button>
                  <Link href={createLoginUrl(returnUrl || undefined, intent || undefined)}>
                    <Button variant="outline" className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Mail className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
              Verify Your Email
            </h1>
            <p className="text-text-secondary mb-8">
              We've sent a verification link to your email address. Click the link in your email to verify your account.
            </p>

            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowManualVerification(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                Manual Verification (Development)
              </Button>
              <Link href={createLoginUrl(returnUrl || undefined, intent || undefined)}>
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Manual Verification Form (Development Only) */}
        {showManualVerification && (
          <div className="mt-8 pt-8 border-t border-border-default">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Development Mode:</strong> Enter your verification token manually if email delivery is not working.
              </p>
            </div>
            
            <form onSubmit={handleManualVerification} className="space-y-4">
              <div>
                <Label htmlFor="token">Verification Token</Label>
                <Input
                  id="token"
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Enter verification token from server logs"
                  required
                />
                <p className="text-xs text-text-secondary mt-1">
                  Check your server console logs for the verification token
                </p>
              </div>
              
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full"
                disabled={!manualToken.trim()}
              >
                Verify Email
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}