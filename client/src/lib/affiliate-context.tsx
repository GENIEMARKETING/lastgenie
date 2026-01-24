'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCookie, setCookie } from './cookies';
import { trackAffiliateClick } from './api/affiliate';

interface AffiliateContextType {
  referralCode: string | null;
  setReferralCode: (code: string | null) => void;
  trackClick: (code: string) => Promise<boolean>;
}

const AffiliateContext = createContext<AffiliateContextType | undefined>(undefined);

export function AffiliateProvider({ children }: { children: React.ReactNode }) {
  const [referralCode, setReferralCodeState] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing referral cookie on mount
    const existingCode = getCookie('affiliate_ref');
    if (existingCode) {
      setReferralCodeState(existingCode);
    }

    // Check URL parameters for new referral code (only on client side)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');
      
      if (refParam && validateReferralCode(refParam)) {
        setReferralCode(refParam);
      }
    }
  }, []);

  const validateReferralCode = (code: string): boolean => {
    // GENIE followed by 8 uppercase alphanumeric chars
    const pattern = /^GENIE[A-Z0-9]{8}$/;
    return pattern.test(code);
  };

  const setReferralCode = async (code: string | null) => {
    if (code && validateReferralCode(code)) {
      // Track the click
      const tracked = await trackClick(code);
      if (tracked) {
        setReferralCodeState(code);
        // Set cookie with 30-day expiration (will be updated by server response)
        setCookie('affiliate_ref', code, 30);
      }
    } else if (code === null) {
      setReferralCodeState(null);
      // Remove cookie
      setCookie('affiliate_ref', '', -1);
    }
  };

  const trackClick = async (code: string): Promise<boolean> => {
    try {
      const response = await trackAffiliateClick({
        referralCode: code,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      });

      if (response.success) {
        // Update cookie duration based on server response (assuming 30 days default)
        setCookie('affiliate_ref', code, 30);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
      return false;
    }
  };

  return (
    <AffiliateContext.Provider value={{
      referralCode,
      setReferralCode,
      trackClick
    }}>
      {children}
    </AffiliateContext.Provider>
  );
}

export function useAffiliate() {
  const context = useContext(AffiliateContext);
  if (context === undefined) {
    throw new Error('useAffiliate must be used within an AffiliateProvider');
  }
  return context;
}