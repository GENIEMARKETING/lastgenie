'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ValidatedAddress } from '@/lib/guest-checkout-context';
import { getAddresses, deleteAddress } from '@/lib/api/addresses';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createLoginUrl } from '@/lib/redirect-utils';
import { useRouter } from 'next/navigation';

interface Address {
  id: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
}

interface SavedAddressSelectorProps {
  addressType: 'shipping' | 'billing';
  onAddressSelect: (address: ValidatedAddress) => void;
  onNewAddress: () => void;
  selectedAddressId?: string;
  className?: string;
  refreshKey?: number; // Key to force refresh when changed
}

export function SavedAddressSelector({
  addressType,
  onAddressSelect,
  onNewAddress,
  selectedAddressId,
  className,
  refreshKey = 0
}: SavedAddressSelectorProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'auth' | 'server' | 'unknown'>('unknown');
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  useEffect(() => {
    // Only load addresses if user is authenticated
    if (!authLoading) {
      if (!isAuthenticated) {
        setIsLoading(false);
        setError('Please log in to view saved addresses');
        setErrorType('auth');
      } else {
        loadAddresses();
      }
    }
  }, [addressType, refreshKey, isAuthenticated, authLoading]);

  const loadAddresses = async () => {
    // Don't attempt to load if not authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      setError('Please log in to view saved addresses');
      setErrorType('auth');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setErrorType('unknown');
      const response = await getAddresses(addressType);
      if (response.success && response.data) {
        setAddresses(response.data);
      } else {
        // Determine error type based on response
        if (response.error?.toLowerCase().includes('unauthorized') || 
            response.error?.toLowerCase().includes('authentication')) {
          setErrorType('auth');
          setError('Please log in to view saved addresses');
        } else {
          setErrorType('server');
          setError(response.error || 'Failed to load saved addresses');
        }
      }
    } catch (err: any) {
      console.error('Error loading addresses:', err);
      
      // Determine error type from exception
      if (err.message?.includes('connect') || err.message?.includes('network')) {
        setErrorType('network');
        setError('Unable to connect to server. Please check your connection and try again.');
      } else if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
        setErrorType('auth');
        setError('Please log in to view saved addresses');
      } else {
        setErrorType('server');
        setError(err.message || 'Failed to load saved addresses. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSelect = (address: Address) => {
    const validatedAddress: ValidatedAddress = {
      street1: address.streetAddress,
      street2: '', // We don't have street2 in the current Address model
      city: address.city,
      state: address.state,
      postalCode: address.zipCode,
      country: address.country,
      phone: address.phone,
    };
    onAddressSelect(validatedAddress);
  };

  const handleDelete = async (addressId: string, event: React.MouseEvent) => {
    // Prevent the click from bubbling up to the address selection
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this address?')) {
      setDeletingAddressId(addressId);
      try {
        const response = await deleteAddress(addressId);
        if (response.success) {
          // Refresh the addresses list
          await loadAddresses();
          // If the deleted address was selected, clear the selection
          if (selectedAddressId === addressId) {
            setSelectedAddressId(undefined);
          }
        } else {
          setError(response.error || 'Failed to delete address');
          setErrorType('server');
        }
      } catch (error: any) {
        console.error('Error deleting address:', error);
        setError(error.message || 'Failed to delete address. Please try again.');
        setErrorType('network');
      } finally {
        setDeletingAddressId(null);
      }
    }
  };

  // Show loading state while checking authentication or loading addresses
  if (authLoading || isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-background rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-background rounded"></div>
            <div className="h-20 bg-background rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    // Special handling for authentication errors - show login prompt instead of error
    if (errorType === 'auth') {
      return (
        <div className={cn('space-y-4', className)}>
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Log in to view saved addresses
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {error}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                const loginUrl = createLoginUrl('/cart', 'checkout');
                router.push(loginUrl);
              }}
              variant="default"
              size="sm"
            >
              Log In
            </Button>
            <Button onClick={onNewAddress} variant="outline" size="sm">
              Enter New Address
            </Button>
          </div>
        </div>
      );
    }

    // Other errors (network, server, etc.)
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              Failed to load saved addresses
            </p>
            <p className="text-xs text-red-600 dark:text-red-300 mb-2">
              {error}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs text-red-500">
                <summary className="cursor-pointer hover:text-red-700 mb-1">
                  Show technical details
                </summary>
                <div className="mt-1 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs space-y-1">
                  <div><strong>Error Type:</strong> {errorType}</div>
                  <div><strong>Auth Status:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</div>
                  <div><strong>Auth Loading:</strong> {authLoading ? '⏳ Loading' : '✅ Loaded'}</div>
                  <div><strong>Address Type:</strong> {addressType}</div>
                  <div><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</div>
                  <div><strong>Endpoint:</strong> /api/addresses?type={addressType}</div>
                  <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
                </div>
              </details>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadAddresses} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button onClick={onNewAddress} variant="outline" size="sm">
            Enter New Address
          </Button>
        </div>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <p className="text-text-secondary text-sm">
          No saved {addressType} addresses found.
        </p>
        <Button onClick={onNewAddress} variant="outline">
          Enter New Address
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Label className="text-base font-medium">
        Select a saved {addressType} address
      </Label>

      <div className="space-y-3">
        {addresses.map((address) => (
          <div
            key={address.id}
            className={cn(
              'p-4 border rounded-lg cursor-pointer transition-colors',
              'hover:bg-background',
              selectedAddressId === address.id
                ? 'border-primary bg-primary/5'
                : 'border-border-default'
            )}
            onClick={() => handleAddressSelect(address)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <input
                    type="radio"
                    checked={selectedAddressId === address.id}
                    onChange={() => handleAddressSelect(address)}
                    className="h-4 w-4 text-primary focus:ring-primary border-border-default"
                  />
                  <div className="text-sm font-medium text-text-primary">
                    {address.streetAddress}
                  </div>
                  {address.isDefault && (
                    <span className="px-2 py-1 text-xs bg-primary text-white rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="ml-6 text-sm text-text-secondary">
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                  {address.phone && <p>Phone: {address.phone}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDelete(address.id, e)}
                  disabled={deletingAddressId === address.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete address"
                >
                  {deletingAddressId === address.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 flex items-center justify-between">
        <Button onClick={onNewAddress} variant="outline" size="sm">
          + Use a different address
        </Button>
        <Button 
          onClick={loadAddresses} 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
          title="Refresh addresses"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}