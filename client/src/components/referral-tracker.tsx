'use client';

import { useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useAffiliate } from '@/lib/affiliate-context';

export function ReferralTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { setReferralCode } = useAffiliate();

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
      
      // Clean up URL by removing the ref parameter
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('ref');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, pathname, setReferralCode]);

  return null; // This component doesn't render anything
}