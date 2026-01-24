'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { useAgeVerification } from '@/lib/age-verification-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AgeVerificationModal() {
  const { showModal, verifyAge, isChecking } = useAgeVerification();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  // Calculate max date (18 years ago)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Calculate min date (150 years ago for validation)
  const minDate = new Date(today.getFullYear() - 150, today.getMonth(), today.getDate());
  const minDateString = minDate.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      await verifyAge(dateOfBirth);
      // Modal will close automatically via context state update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if not showing or still checking
  if (!showModal || isChecking) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop overlay - blocks all interaction */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-surface rounded-2xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-text-primary mb-4">
              Age Verification Required
            </h1>
            <p className="text-text-secondary">
              To comply with legal requirements, we need to verify that you are 18 years or older to access this website.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="modal-dateOfBirth" required>
                Date of Birth
              </Label>
              <Input
                id="modal-dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={maxDateString}
                min={minDateString}
                required
                className="mt-1"
                placeholder="YYYY-MM-DD"
                autoFocus
              />
              <p className="mt-2 text-sm text-text-secondary">
                You must be 18 or older to continue
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Verification Failed</p>
                  <div className="text-sm text-red-700 mt-1">
                    {error.includes('\n') ? (
                      <div className="space-y-1">
                        {error.split('\n').map((line, index) => {
                          // Check if line looks like a numbered instruction
                          const isInstruction = /^\d+\.\s/.test(line);
                          return (
                            <p 
                              key={index} 
                              className={isInstruction ? 'font-mono text-xs pl-4' : ''}
                            >
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <p>{error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Privacy Notice:</strong> Your date of birth is used solely for age verification purposes. 
                We do not store your full date of birth, only your verification status.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              disabled={!dateOfBirth || isSubmitting}
            >
              Verify Age
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
