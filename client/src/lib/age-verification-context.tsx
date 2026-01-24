'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { verifyAge, getVerificationStatus, verifyAgeGuest } from './api/age-verification';
import { 
  getAgeVerificationCookie, 
  setAgeVerificationCookie, 
  hasValidAgeVerificationCookie 
} from './cookies';

interface AgeVerificationContextType {
  isVerified: boolean;
  isChecking: boolean;
  showModal: boolean;
  verifyAge: (dateOfBirth: string) => Promise<void>;
}

const AgeVerificationContext = createContext<AgeVerificationContextType | undefined>(undefined);

export function AgeVerificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  /**
   * Check verification status on mount and when auth state changes
   */
  useEffect(() => {
    const checkVerificationStatus = async () => {
      // Skip checking if we just verified to prevent immediate re-checking
      if (justVerified) {
        setJustVerified(false);
        return;
      }

      setIsChecking(true);

      // Check cookie first
      const hasCookie = hasValidAgeVerificationCookie();

      if (hasCookie) {
        // If authenticated, also check database status
        if (isAuthenticated && user?.id) {
          try {
            const response = await getVerificationStatus(user.id);
            if (response.success && response.data?.isVerified) {
              // Verified in both cookie and database
              setIsVerified(true);
              setShowModal(false);
              setIsChecking(false);
              return;
            } else {
              // Database says not verified, but cookie exists
              // For authenticated users, database is source of truth
              // Clear cookie and show modal
              setIsVerified(false);
              setShowModal(true);
              setIsChecking(false);
              return;
            }
          } catch (error) {
            // If API call fails, trust cookie for now
            setIsVerified(true);
            setShowModal(false);
            setIsChecking(false);
            return;
          }
        } else {
          // Not authenticated, trust cookie
          setIsVerified(true);
          setShowModal(false);
          setIsChecking(false);
          return;
        }
      }

      // No cookie - check database if authenticated
      if (isAuthenticated && user?.id) {
        try {
          const response = await getVerificationStatus(user.id);
          if (response.success && response.data?.isVerified) {
            // Verified in database, set cookie
            setAgeVerificationCookie();
            setIsVerified(true);
            setShowModal(false);
            setIsChecking(false);
            return;
          }
        } catch (error) {
          console.error('Failed to check verification status:', error);
        }
      }

      // Not verified - show modal
      setIsVerified(false);
      setShowModal(true);
      setIsChecking(false);
    };

    // Wait for auth to finish loading before checking
    if (!authLoading) {
      checkVerificationStatus();
    }
    }, [user, isAuthenticated, authLoading, justVerified]);

  /**
   * Verify age function
   */
  const handleVerifyAge = useCallback(async (dateOfBirth: string) => {
    try {
      let response;

      if (isAuthenticated && user?.id) {
        // Authenticated user - update database
        response = await verifyAge(user.id, dateOfBirth);
      } else {
        // Guest user - verify only (no database update)
        response = await verifyAgeGuest(dateOfBirth);
      }

      if (response.success && response.data?.verified) {
        // Set cookie for all users
        setAgeVerificationCookie();
        
        // Update state
        setIsVerified(true);
        setShowModal(false);
        setJustVerified(true);
        
        // Refresh user data if authenticated to get updated isAgeVerified status
        if (isAuthenticated && user?.id) {
          await refreshUser();
        }
      } else {
        throw new Error(response.error || response.message || 'Age verification failed');
      }
    } catch (error) {
      throw error;
    }
  }, [isAuthenticated, user, refreshUser]);

  return (
    <AgeVerificationContext.Provider
      value={{
        isVerified,
        isChecking,
        showModal,
        verifyAge: handleVerifyAge,
      }}
    >
      {children}
    </AgeVerificationContext.Provider>
  );
}

export function useAgeVerification() {
  const context = useContext(AgeVerificationContext);
  if (context === undefined) {
    throw new Error('useAgeVerification must be used within an AgeVerificationProvider');
  }
  return context;
}
