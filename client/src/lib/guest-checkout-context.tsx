'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

const GUEST_CHECKOUT_STORAGE_KEY = 'lastgenie_guest_checkout';

interface ValidatedAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  addressType?: string;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface GuestCheckoutData {
  contactInfo: ContactInfo;
  shippingAddress: ValidatedAddress;
  billingAddress?: ValidatedAddress;
  sameAsBilling: boolean;
  updatedAt: string;
}

interface GuestCheckoutContextType {
  contactInfo: ContactInfo | null;
  shippingAddress: ValidatedAddress | null;
  billingAddress: ValidatedAddress | null;
  sameAsBilling: boolean;
  isLoading: boolean;
  setContactInfo: (info: ContactInfo) => void;
  setShippingAddress: (address: ValidatedAddress) => void;
  setBillingAddress: (address: ValidatedAddress | null) => void;
  setSameAsBilling: (same: boolean) => void;
  clearGuestData: () => void;
  hasRequiredData: () => boolean;
  getGuestDataForCheckout: () => GuestCheckoutData | null;
}

const GuestCheckoutContext = createContext<GuestCheckoutContextType | undefined>(undefined);

/**
 * Load guest checkout data from localStorage
 */
function loadGuestDataFromStorage(): GuestCheckoutData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(GUEST_CHECKOUT_STORAGE_KEY);
    if (!stored) return null;

    const data: GuestCheckoutData = JSON.parse(stored);
    // Check if data is expired (24 hours)
    const dataDate = new Date(data.updatedAt);
    const expiryDate = new Date(dataDate.getTime() + 24 * 60 * 60 * 1000);
    if (new Date() > expiryDate) {
      localStorage.removeItem(GUEST_CHECKOUT_STORAGE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error loading guest checkout data from storage:', error);
    return null;
  }
}

/**
 * Save guest checkout data to localStorage
 */
function saveGuestDataToStorage(data: Partial<GuestCheckoutData>): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = loadGuestDataFromStorage();
    const updated: GuestCheckoutData = {
      contactInfo: data.contactInfo || existing?.contactInfo || {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      },
      shippingAddress: data.shippingAddress || existing?.shippingAddress || {
        street1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      },
      billingAddress: data.billingAddress !== undefined ? data.billingAddress : existing?.billingAddress,
      sameAsBilling: data.sameAsBilling !== undefined ? data.sameAsBilling : existing?.sameAsBilling || true,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(GUEST_CHECKOUT_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving guest checkout data to storage:', error);
  }
}

export function GuestCheckoutProvider({ children }: { children: React.ReactNode }) {
  const [contactInfo, setContactInfoState] = useState<ContactInfo | null>(null);
  const [shippingAddress, setShippingAddressState] = useState<ValidatedAddress | null>(null);
  const [billingAddress, setBillingAddressState] = useState<ValidatedAddress | null>(null);
  const [sameAsBilling, setSameAsBillingState] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const data = loadGuestDataFromStorage();
    if (data) {
      setContactInfoState(data.contactInfo);
      setShippingAddressState(data.shippingAddress);
      setBillingAddressState(data.billingAddress || null);
      setSameAsBillingState(data.sameAsBilling);
    }
    setIsLoading(false);
  }, []);

  const setContactInfo = useCallback((info: ContactInfo) => {
    setContactInfoState(info);
    saveGuestDataToStorage({ contactInfo: info });
  }, []);

  const setShippingAddress = useCallback((address: ValidatedAddress) => {
    setShippingAddressState(address);
    saveGuestDataToStorage({ shippingAddress: address });
  }, []);

  const setBillingAddress = useCallback((address: ValidatedAddress | null) => {
    setBillingAddressState(address);
    saveGuestDataToStorage({ billingAddress: address });
  }, []);

  const setSameAsBilling = useCallback((same: boolean) => {
    setSameAsBillingState(same);
    if (same) {
      setBillingAddressState(null);
      saveGuestDataToStorage({ sameAsBilling: same, billingAddress: null });
    } else {
      saveGuestDataToStorage({ sameAsBilling: same });
    }
  }, []);

  const clearGuestData = useCallback(() => {
    setContactInfoState(null);
    setShippingAddressState(null);
    setBillingAddressState(null);
    setSameAsBillingState(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_CHECKOUT_STORAGE_KEY);
    }
  }, []);

  const hasRequiredData = useCallback((): boolean => {
    return !!(
      contactInfo?.firstName &&
      contactInfo?.lastName &&
      contactInfo?.email &&
      contactInfo?.phone &&
      shippingAddress?.street1 &&
      shippingAddress?.city &&
      shippingAddress?.state &&
      shippingAddress?.postalCode &&
      (sameAsBilling || billingAddress)
    );
  }, [contactInfo, shippingAddress, billingAddress, sameAsBilling]);

  const getGuestDataForCheckout = useCallback((): GuestCheckoutData | null => {
    if (!hasRequiredData()) return null;

    return {
      contactInfo: contactInfo!,
      shippingAddress: shippingAddress!,
      billingAddress: sameAsBilling ? undefined : billingAddress!,
      sameAsBilling,
      updatedAt: new Date().toISOString(),
    };
  }, [contactInfo, shippingAddress, billingAddress, sameAsBilling, hasRequiredData]);

  const value: GuestCheckoutContextType = {
    contactInfo,
    shippingAddress,
    billingAddress,
    sameAsBilling,
    isLoading,
    setContactInfo,
    setShippingAddress,
    setBillingAddress,
    setSameAsBilling,
    clearGuestData,
    hasRequiredData,
    getGuestDataForCheckout,
  };

  return (
    <GuestCheckoutContext.Provider value={value}>
      {children}
    </GuestCheckoutContext.Provider>
  );
}

export function useGuestCheckout() {
  const context = useContext(GuestCheckoutContext);
  if (context === undefined) {
    throw new Error('useGuestCheckout must be used within a GuestCheckoutProvider');
  }
  return context;
}

// Export types for use in other components
export type { ContactInfo, ValidatedAddress, GuestCheckoutData };