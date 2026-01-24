'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, X, Loader2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useGuestCheckout } from '@/lib/guest-checkout-context';
import { useAffiliate } from '@/lib/affiliate-context';
import { createLoginUrl } from '@/lib/redirect-utils';
import { getShippingRates, validateAddress } from '@/lib/api/shipping';
import { ShippingRate, ShippingAddress, AddressValidationResult, AddressType } from '@/types/cart';
import { AddressConfirmationModal } from '@/components/ui/address-confirmation-modal';
import { ContactInfoForm } from '@/components/checkout/contact-info-form';
import { BillingAddressForm } from '@/components/checkout/billing-address-form';
import { SavedAddressSelector } from '@/components/checkout/saved-address-selector';
import { createCheckoutSession, cartItemsToCheckoutItems } from '@/lib/api/checkout';
import { ValidatedAddress, ContactInfo } from '@/lib/guest-checkout-context';
import { createAddress, getAddresses } from '@/lib/api/addresses';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  // Track if we've initialized the saved addresses view for authenticated users
  const hasInitialized = useRef(false);
  const {
    items: cartItems,
    isLoading: cartLoading,
    updateQuantity,
    removeFromCart,
    getCartTotal,
  } = useCart();
  const {
    contactInfo,
    shippingAddress: guestShippingAddress,
    billingAddress: guestBillingAddress,
    sameAsBilling,
    setContactInfo,
    setShippingAddress: setGuestShippingAddress,
    setBillingAddress: setGuestBillingAddress,
    setSameAsBilling,
    hasRequiredData,
    getGuestDataForCheckout,
  } = useGuestCheckout();
  const { referralCode } = useAffiliate();

  // Address and shipping state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });
  const [addressType, setAddressType] = useState<AddressType | ''>('');
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<ShippingRate | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAddressValidated, setIsAddressValidated] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  // UI state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState<'address' | 'contact' | 'billing' | 'review'>('address');
  const [saveAddress, setSaveAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressSaveError, setAddressSaveError] = useState<string | null>(null);
  const [addressSaveSuccess, setAddressSaveSuccess] = useState(false);
  const [isAddressAlreadySaved, setIsAddressAlreadySaved] = useState(false);
  const [addressRefreshKey, setAddressRefreshKey] = useState(0);

  // Check age verification when user is authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !user.isAgeVerified) {
      router.push('/verify-age?return=' + encodeURIComponent('/cart'));
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Show saved addresses for authenticated users initially (only on first load)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasInitialized.current) {
      setShowSavedAddresses(true);
      hasInitialized.current = true;
    }
  }, [authLoading, isAuthenticated]);

  // Initialize contact info from user profile for authenticated users
  useEffect(() => {
    if (isAuthenticated && user && !contactInfo) {
      const userContactInfo: ContactInfo = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      };
      setContactInfo(userContactInfo);
    }
  }, [isAuthenticated, user, contactInfo, setContactInfo]);

  // Check if current address is already saved whenever address changes
  useEffect(() => {
    const checkAddress = async () => {
      if (isAuthenticated && isAddressComplete(shippingAddress)) {
        const alreadySaved = await checkIfAddressAlreadySaved();
        setIsAddressAlreadySaved(alreadySaved);
        // If address is already saved, uncheck the save checkbox
        if (alreadySaved && saveAddress) {
          setSaveAddress(false);
        }
      } else {
        setIsAddressAlreadySaved(false);
      }
    };

    checkAddress();
  }, [shippingAddress, isAuthenticated, addressRefreshKey]);

  // Sync shipping address with guest context
  useEffect(() => {
    if (guestShippingAddress && guestShippingAddress.street1) {
      const addr: ShippingAddress = {
        street1: guestShippingAddress.street1,
        street2: guestShippingAddress.street2,
        city: guestShippingAddress.city,
        state: guestShippingAddress.state,
        postalCode: guestShippingAddress.postalCode,
        country: guestShippingAddress.country,
        addressType: guestShippingAddress.addressType as AddressType,
      };
      setShippingAddress(addr);
      setAddressType((guestShippingAddress.addressType as AddressType) || '');
    }
  }, [guestShippingAddress]);

  // Calculate totals
  const subtotal = getCartTotal();
  const shipping = selectedShippingRate ? parseFloat(selectedShippingRate.amount) : 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  // Helper functions
  const isAddressComplete = (address: ShippingAddress): boolean => {
    return !!(
      address.street1?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      address.postalCode?.trim() &&
      address.country?.trim()
    );
  };

  const addressesAreDifferent = (addr1: ShippingAddress, addr2: ShippingAddress): boolean => {
    if (!addr1 || !addr2) return false;
    return (
      (addr1.street1 || '').toLowerCase().trim() !== (addr2.street1 || '').toLowerCase().trim() ||
      (addr1.street2 || '').toLowerCase().trim() !== (addr2.street2 || '').toLowerCase().trim() ||
      (addr1.city || '').toLowerCase().trim() !== (addr2.city || '').toLowerCase().trim() ||
      (addr1.state || '').toUpperCase().trim() !== (addr2.state || '').toUpperCase().trim() ||
      (addr1.postalCode || '').trim() !== (addr2.postalCode || '').trim() ||
      (addr1.country || 'US').toUpperCase().trim() !== (addr2.country || 'US').toUpperCase().trim()
    );
  };

  // Fetch shipping rates
  const fetchShippingRates = useCallback(async (address: ShippingAddress) => {
    if (cartItems.length === 0) return;

    setIsLoadingShipping(true);
    setShippingError(null);

    try {
      const response = await getShippingRates(
        cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        address
      );

      if (response.success && response.data) {
        setShippingRates(response.data.rates || []);
        if (response.data.rates && response.data.rates.length > 0) {
          setSelectedShippingRate(response.data.rates[0]);
        }
      } else {
        setShippingError(response.error || 'Failed to get shipping rates');
      }
    } catch (error: any) {
      console.error('Error fetching shipping rates:', error);
      setShippingError('Failed to get shipping rates. Please try again.');
    } finally {
      setIsLoadingShipping(false);
    }
  }, [cartItems]);

  // Address validation with debounce
  const validateAddressDebounced = useCallback(
    debounce(async (address: ShippingAddress) => {
      if (!isAddressComplete(address)) return;

      setIsValidatingAddress(true);
      setValidationError(null);

      try {
        const response = await validateAddress({
          street1: address.street1,
          street2: address.street2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          addressType: address.addressType,
        });

        if (response.success && response.data) {
          setAddressValidation(response.data);
          setIsAddressValidated(response.data.isValid);
          
          // Open modal if there are suggestions or corrections needed
          if (response.data.suggestions && response.data.suggestions.length > 0) {
            setShowAddressModal(true);
          } else if (!response.data.isValid) {
            setShowAddressModal(true);
          }
          
          if (response.data.isValid && (!response.data.suggestions || response.data.suggestions.length === 0)) {
            await fetchShippingRates(address);
          }
        } else {
          setValidationError(response.error || 'Address validation failed');
        }
      } catch (error: any) {
        console.error('Error validating address:', error);
        setValidationError('Address validation service unavailable');
      } finally {
        setIsValidatingAddress(false);
      }
    }, 1000),
    [fetchShippingRates]
  );

  // Event handlers
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId);
    } else {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
      await removeFromCart(itemId);
    }
  };

  const handleSavedAddressSelect = (address: ValidatedAddress) => {
    const shippingAddr: ShippingAddress = {
      street1: address.street1,
      street2: address.street2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    };
    
    setShippingAddress(shippingAddr);
    setGuestShippingAddress(address);
    setShowSavedAddresses(false);
    validateAddressDebounced(shippingAddr);
  };

  const handleNewAddressClick = () => {
    setShowSavedAddresses(false);
    setSelectedSavedAddressId(undefined);
  };

  // Check if current address already exists in saved addresses
  const checkIfAddressAlreadySaved = async () => {
    if (!isAuthenticated || !isAddressComplete(shippingAddress)) {
      return false;
    }

    try {
      const existingAddresses = await getAddresses('shipping');
      if (existingAddresses.success && existingAddresses.data) {
        return existingAddresses.data.some(addr => 
          addr.streetAddress.toLowerCase().trim() === shippingAddress.street1.toLowerCase().trim() &&
          addr.city.toLowerCase().trim() === shippingAddress.city.toLowerCase().trim() &&
          addr.state === shippingAddress.state &&
          addr.zipCode === shippingAddress.postalCode &&
          (addr.country || 'US') === (shippingAddress.country || 'US')
        );
      }
    } catch (error) {
      console.error('Error checking for existing addresses:', error);
    }
    return false;
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    const updatedAddress = { ...shippingAddress, [field]: value };
    setShippingAddress(updatedAddress);
    
    // Update guest context
    const guestAddr: ValidatedAddress = {
      street1: updatedAddress.street1,
      street2: updatedAddress.street2,
      city: updatedAddress.city,
      state: updatedAddress.state,
      postalCode: updatedAddress.postalCode,
      country: updatedAddress.country,
      addressType: updatedAddress.addressType,
    };
    setGuestShippingAddress(guestAddr);

    // Validate address
    if (isAddressComplete(updatedAddress)) {
      validateAddressDebounced(updatedAddress);
    }
  };

  const handleContactInfoChange = (info: ContactInfo) => {
    setContactInfo(info);
  };

  const handleBillingAddressChange = (address: ValidatedAddress | null) => {
    setGuestBillingAddress(address);
  };

  const handleAcceptSuggestedAddress = async (suggestedAddress: ShippingAddress) => {
    // Update address state
    setShippingAddress(suggestedAddress);
    
    const guestAddr: ValidatedAddress = {
      street1: suggestedAddress.street1,
      street2: suggestedAddress.street2,
      city: suggestedAddress.city,
      state: suggestedAddress.state,
      postalCode: suggestedAddress.postalCode,
      country: suggestedAddress.country,
      addressType: suggestedAddress.addressType,
    };
    setGuestShippingAddress(guestAddr);

    // Mark as validated and close modal
    setIsAddressValidated(true);
    setShowAddressModal(false);
    
    // Clear previous validation result to prevent confusion
    setAddressValidation(null);
    
    // Fetch shipping rates with the accepted address
    await fetchShippingRates(suggestedAddress);
  };

  const handleSaveAddress = async () => {
    if (!isAuthenticated) {
      setAddressSaveError('Please log in to save addresses');
      return;
    }

    if (!isAddressComplete(shippingAddress)) {
      setAddressSaveError('Please complete the address before saving');
      return;
    }

    setIsSavingAddress(true);
    setAddressSaveError(null);
    setAddressSaveSuccess(false);

    try {
      // Check for duplicate addresses before saving
      const existingAddresses = await getAddresses('shipping');
      
      if (existingAddresses.success && existingAddresses.data) {
        const isDuplicate = existingAddresses.data.some(addr => 
          addr.streetAddress.toLowerCase().trim() === shippingAddress.street1.toLowerCase().trim() &&
          addr.city.toLowerCase().trim() === shippingAddress.city.toLowerCase().trim() &&
          addr.state === shippingAddress.state &&
          addr.zipCode === shippingAddress.postalCode &&
          (addr.country || 'US') === (shippingAddress.country || 'US')
        );
        
        if (isDuplicate) {
          setAddressSaveError('This address is already saved in your account');
          setIsSavingAddress(false);
          return;
        }
      }

      const response = await createAddress({
        streetAddress: shippingAddress.street1,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'US',
        phone: contactInfo?.phone,
        type: 'shipping',
        isDefault: false, // User can set as default later if needed
      });

      if (response.success) {
        setAddressSaveSuccess(true);
        setSaveAddress(false);
        // Refresh saved addresses by incrementing refresh key
        setAddressRefreshKey(prev => prev + 1);
        setShowSavedAddresses(true);
        setTimeout(() => {
          setAddressSaveSuccess(false);
        }, 3000);
      } else {
        setAddressSaveError(response.error || 'Failed to save address');
      }
    } catch (error: any) {
      console.error('Error saving address:', error);
      setAddressSaveError(error.message || 'Failed to save address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCheckout = async () => {
    // Check if all required data is provided
    if (!hasRequiredData()) {
      alert('Please fill in all required information before proceeding to checkout.');
      return;
    }

    // Check authentication first
    if (!isAuthenticated) {
      const checkoutLoginUrl = createLoginUrl('/cart', 'checkout');
      router.push(checkoutLoginUrl);
      return;
    }

    // Check age verification
    if (!user?.isAgeVerified) {
      router.push('/verify-age?return=' + encodeURIComponent('/cart'));
      return;
    }

    setIsCheckingOut(true);
    try {
      const guestData = getGuestDataForCheckout();
      const checkoutRequest = {
        items: cartItemsToCheckoutItems(cartItems),
        ...(guestData && { guestInfo: guestData }),
        ...(referralCode && { referralCode })
      };

      const response = await createCheckoutSession(checkoutRequest);
      
      if (response.success && response.data?.url) {
        window.location.href = response.data.url;
      } else {
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to proceed to checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cartLoading || authLoading) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-8">
          Your Cart
        </h1>

        {cartItems.length === 0 ? (
          // Empty cart state
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-gray-300 rounded-lg"></div>
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-4">
              Your cart is empty
            </h2>
            <p className="text-text-secondary mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Shopping <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items and Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cart Items */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-surface border border-border-default rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary mb-1">
                          {item.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="p-1 rounded-lg border border-border-default hover:bg-background transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-medium text-text-primary min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="p-1 rounded-lg border border-border-default hover:bg-background transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-text-primary">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-text-secondary hover:text-error transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address Section */}
              <div className="bg-surface border border-border-default rounded-xl p-6">
                <h3 className="font-semibold text-text-primary mb-4">
                  Shipping Address
                </h3>

                {/* Saved Address Selector for Authenticated Users */}
                {isAuthenticated && showSavedAddresses && (
                  <SavedAddressSelector
                    addressType="shipping"
                    onAddressSelect={handleSavedAddressSelect}
                    onNewAddress={handleNewAddressClick}
                    selectedAddressId={selectedSavedAddressId}
                    className="mb-6"
                    refreshKey={addressRefreshKey}
                  />
                )}

                {/* Manual Address Entry Form */}
                {(!isAuthenticated || !showSavedAddresses) && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Enter shipping address</span>
                      {isAuthenticated && (
                        <button
                          onClick={() => setShowSavedAddresses(true)}
                          className="text-sm text-primary hover:text-primary/80 font-medium"
                        >
                          Use saved address
                        </button>
                      )}
                    </div>

                    {/* Address Type */}
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Address Type <span className="text-text-secondary">(optional)</span>
                      </label>
                      <select
                        value={addressType}
                        onChange={(e) => {
                          const newType = e.target.value as AddressType | '';
                          setAddressType(newType);
                          handleAddressChange('addressType', newType);
                        }}
                        className="w-full px-3 py-2 border border-border-default rounded-lg bg-background text-text-primary"
                      >
                        <option value="">Select address type...</option>
                        <option value="house">House (Single-family home)</option>
                        <option value="apartment">Apartment</option>
                        <option value="condo">Condo</option>
                        <option value="townhouse">Townhouse</option>
                        <option value="business">Business/Commercial</option>
                        <option value="residential_complex">Residential Complex</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Address Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.street1}
                          onChange={(e) => handleAddressChange('street1', e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded-lg bg-background text-text-primary"
                          placeholder="123 Main St"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Apartment, suite, etc. (optional)
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.street2 || ''}
                          onChange={(e) => handleAddressChange('street2', e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded-lg bg-background text-text-primary"
                          placeholder="Apt 4B"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded-lg bg-background text-text-primary"
                          placeholder="New York"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded-lg bg-background text-text-primary"
                          placeholder="NY"
                          maxLength={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.postalCode}
                          onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded-lg bg-background text-text-primary"
                          placeholder="10001"
                        />
                      </div>
                    </div>

                    {/* Address Validation Status */}
                    {isValidatingAddress && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Validating address...</span>
                      </div>
                    )}

                    {/* Address Validation Results */}
                    {!isValidatingAddress && addressValidation && (
                      <div className="space-y-3">
                        {/* Show suggestions first if they exist */}
                        {addressValidation.suggestions && addressValidation.suggestions.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                  Address suggestions available
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                                  We found suggested addresses that may be more accurate:
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {addressValidation.suggestions.map((suggestion, index) => (
                                <div key={index} className="p-4 bg-surface border border-border-default rounded-lg">
                                  <div className="text-sm text-text-secondary space-y-1 mb-3">
                                    <p className="font-medium text-text-primary">{suggestion.street1}</p>
                                    {suggestion.street2 && <p>{suggestion.street2}</p>}
                                    <p>{suggestion.city}, {suggestion.state} {suggestion.postalCode}</p>
                                  </div>
                                  <button
                                    onClick={() => handleAcceptSuggestedAddress(suggestion)}
                                    className="w-full bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                  >
                                    Use This Address
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Show success message only if valid AND no suggestions */}
                        {addressValidation.isValid && (!addressValidation.suggestions || addressValidation.suggestions.length === 0) && (
                          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Address validated successfully
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Save Address Option for Authenticated Users */}
                    {isAuthenticated && isAddressComplete(shippingAddress) && (
                      <div className="space-y-2 pt-2 border-t border-border-default">
                        {isAddressAlreadySaved ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span>This address is already saved in your account</span>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={saveAddress}
                                onChange={(e) => {
                                  setSaveAddress(e.target.checked);
                                  setAddressSaveError(null);
                                  setAddressSaveSuccess(false);
                                  if (e.target.checked) {
                                    handleSaveAddress();
                                  }
                                }}
                                className="h-4 w-4 text-primary focus:ring-primary border-border-default rounded"
                                disabled={isSavingAddress}
                              />
                              {isSavingAddress && (
                                <Loader2 className="h-3 w-3 animate-spin absolute -top-0.5 -right-0.5 text-primary" />
                              )}
                            </div>
                            <span className="text-sm text-text-secondary">
                              {isSavingAddress ? 'Saving address...' : 'Save this address for future orders'}
                            </span>
                          </label>
                        )}
                        
                        {addressSaveSuccess && (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                            <CheckCircle className="h-4 w-4" />
                            <span>Address saved successfully! You can now select it from your saved addresses.</span>
                          </div>
                        )}
                        
                        {addressSaveError && (
                          <div className="flex items-center gap-2 text-sm text-error bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <span>{addressSaveError}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Information Section */}
              <div className="bg-surface border border-border-default rounded-xl p-6">
                <h3 className="font-semibold text-text-primary mb-4">
                  Contact Information
                </h3>
                <ContactInfoForm
                  initialData={contactInfo}
                  onChange={handleContactInfoChange}
                />
              </div>

              {/* Billing Address Section */}
              <div className="bg-surface border border-border-default rounded-xl p-6">
                <h3 className="font-semibold text-text-primary mb-4">
                  Billing Address
                </h3>
                <BillingAddressForm
                  shippingAddress={guestShippingAddress}
                  initialBillingAddress={guestBillingAddress}
                  sameAsShipping={sameAsBilling}
                  onSameAsShippingChange={setSameAsBilling}
                  onBillingAddressChange={handleBillingAddressChange}
                />
              </div>

              {/* Shipping Rates */}
              {shippingRates.length > 0 && (
                <div className="bg-surface border border-border-default rounded-xl p-6">
                  <h3 className="font-semibold text-text-primary mb-4">
                    Shipping Options
                  </h3>
                  <div className="space-y-3">
                    {shippingRates.map((rate, index) => (
                      <label
                        key={index}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedShippingRate?.serviceName === rate.serviceName
                            ? 'border-primary bg-primary/5'
                            : 'border-border-default hover:bg-background'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingRate"
                            checked={selectedShippingRate?.serviceName === rate.serviceName}
                            onChange={() => setSelectedShippingRate(rate)}
                            className="h-4 w-4 text-primary focus:ring-primary border-border-default"
                          />
                          <div>
                            <div className="font-medium text-text-primary">
                              {rate.serviceName}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {rate.carrier} • {rate.estimatedDays} days
                            </div>
                          </div>
                        </div>
                        <div className="font-semibold text-text-primary">
                          ${parseFloat(rate.amount).toFixed(2)}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Continue Shopping */}
              <div>
                <Link
                  href="/shop"
                  className="text-primary hover:text-primary/80 font-semibold flex items-center gap-2"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-surface border border-border-default rounded-xl p-6 sticky top-8">
                <h2 className="font-display text-xl font-bold text-text-primary mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subtotal</span>
                    <span className="text-text-primary">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Shipping</span>
                    <span className="text-text-primary">
                      {isLoadingShipping ? (
                        <Loader2 className="h-4 w-4 animate-spin inline" />
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tax</span>
                    <span className="text-text-primary">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border-default pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold text-text-primary">Total</span>
                      <span className="font-bold text-xl text-text-primary">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkout Requirements Status */}
                <div className="mb-6 p-3 bg-background rounded-lg">
                  <h4 className="text-sm font-medium text-text-primary mb-2">Checkout Requirements</h4>
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-2 ${isAddressComplete(shippingAddress) ? 'text-green-600' : 'text-text-secondary'}`}>
                      {isAddressComplete(shippingAddress) ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 border border-current rounded-full" />}
                      <span>Shipping address</span>
                    </div>
                    <div className={`flex items-center gap-2 ${contactInfo?.firstName && contactInfo?.lastName && contactInfo?.email && contactInfo?.phone ? 'text-green-600' : 'text-text-secondary'}`}>
                      {contactInfo?.firstName && contactInfo?.lastName && contactInfo?.email && contactInfo?.phone ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 border border-current rounded-full" />}
                      <span>Contact information</span>
                    </div>
                    <div className={`flex items-center gap-2 ${sameAsBilling || guestBillingAddress ? 'text-green-600' : 'text-text-secondary'}`}>
                      {sameAsBilling || guestBillingAddress ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 border border-current rounded-full" />}
                      <span>Billing address</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || cartItems.length === 0 || !hasRequiredData()}
                  className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                {!hasRequiredData() && (
                  <p className="text-xs text-text-secondary text-center mt-2">
                    Please fill in all required information above
                  </p>
                )}

                {/* Security Badge */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-text-secondary mb-2">Secure checkout powered by</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded text-white text-xs font-bold flex items-center justify-center">
                      S
                    </div>
                    <span className="text-sm font-semibold text-text-secondary">Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Confirmation Modal */}
      {addressValidation && (
        <AddressConfirmationModal
          open={showAddressModal}
          onOpenChange={(open) => {
            setShowAddressModal(open);
            // Remove the automatic rate fetching since handleAcceptSuggestedAddress handles it
          }}
          originalAddress={shippingAddress}
          validationResult={addressValidation}
          onAccept={handleAcceptSuggestedAddress}
          onKeepOriginal={() => {
            setIsAddressValidated(true);
            fetchShippingRates(shippingAddress);
            setShowAddressModal(false);
          }}
        />
      )}
    </div>
  );
}
