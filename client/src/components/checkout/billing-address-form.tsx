'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ValidatedAddress } from '@/lib/guest-checkout-context';
import { cn } from '@/lib/utils';

interface BillingAddressFormProps {
  shippingAddress: ValidatedAddress | null;
  initialBillingAddress?: ValidatedAddress | null;
  sameAsShipping: boolean;
  onSameAsShippingChange: (same: boolean) => void;
  onBillingAddressChange: (address: ValidatedAddress | null) => void;
  className?: string;
}

interface FormErrors {
  street1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export function BillingAddressForm({
  shippingAddress,
  initialBillingAddress,
  sameAsShipping,
  onSameAsShippingChange,
  onBillingAddressChange,
  className
}: BillingAddressFormProps) {
  const [formData, setFormData] = useState<ValidatedAddress>({
    street1: initialBillingAddress?.street1 || '',
    street2: initialBillingAddress?.street2 || '',
    city: initialBillingAddress?.city || '',
    state: initialBillingAddress?.state || '',
    postalCode: initialBillingAddress?.postalCode || '',
    country: initialBillingAddress?.country || 'US',
    phone: initialBillingAddress?.phone || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update form data when initialBillingAddress changes
  useEffect(() => {
    if (initialBillingAddress && !sameAsShipping) {
      setFormData(initialBillingAddress);
    }
  }, [initialBillingAddress, sameAsShipping]);

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
    }
  };

  // Validation functions
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'street1':
        return value.trim() ? undefined : 'Street address is required';
      case 'city':
        return value.trim() ? undefined : 'City is required';
      case 'state':
        return value.trim() ? undefined : 'State is required';
      case 'postalCode':
        if (!value.trim()) return 'ZIP code is required';
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return zipRegex.test(value) ? undefined : 'Please enter a valid ZIP code';
      case 'phone':
        if (!value.trim()) return undefined; // Phone is optional for billing
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length >= 10 ? undefined : 'Please enter a valid phone number';
      default:
        return undefined;
    }
  };

  const handleSameAsShippingChange = (checked: boolean) => {
    onSameAsShippingChange(checked);
    if (checked) {
      onBillingAddressChange(null);
    } else {
      onBillingAddressChange(formData);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    let processedValue = value;
    
    // Special handling for phone number formatting
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }

    const updatedData = { ...formData, [field]: processedValue };
    setFormData(updatedData);

    // Validate field if it has been touched
    if (touched[field]) {
      const error = validateField(field, processedValue);
      setErrors(prev => ({ ...prev, [field]: error }));
    }

    // Call onChange with updated data if not same as shipping
    if (!sameAsShipping) {
      onBillingAddressChange(updatedData);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof ValidatedAddress] || '');
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const isFormValid = () => {
    if (sameAsShipping) return true;
    
    const requiredFields = ['street1', 'city', 'state', 'postalCode'];
    return requiredFields.every(field => formData[field as keyof ValidatedAddress]?.toString().trim()) &&
           Object.values(errors).every(error => !error);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center space-x-2">
        <input
          id="sameAsShipping"
          type="checkbox"
          checked={sameAsShipping}
          onChange={(e) => handleSameAsShippingChange(e.target.checked)}
          className="h-4 w-4 text-primary focus:ring-primary border-border-default rounded"
        />
        <Label htmlFor="sameAsShipping" className="mb-0 cursor-pointer">
          Billing address is the same as shipping address
        </Label>
      </div>

      {!sameAsShipping && (
        <div className="space-y-4 p-4 border border-border-default rounded-lg bg-surface">
          <h3 className="text-lg font-medium text-text-primary">Billing Address</h3>
          
          <div>
            <Label htmlFor="billingStreet1" required>
              Street Address
            </Label>
            <Input
              id="billingStreet1"
              type="text"
              value={formData.street1}
              onChange={(e) => handleFieldChange('street1', e.target.value)}
              onBlur={() => handleFieldBlur('street1')}
              error={touched.street1 ? errors.street1 : undefined}
              placeholder="123 Main St"
              autoComplete="billing street-address"
            />
          </div>

          <div>
            <Label htmlFor="billingStreet2">
              Apartment, suite, etc. (optional)
            </Label>
            <Input
              id="billingStreet2"
              type="text"
              value={formData.street2}
              onChange={(e) => handleFieldChange('street2', e.target.value)}
              placeholder="Apt 4B"
              autoComplete="billing address-line2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="billingCity" required>
                City
              </Label>
              <Input
                id="billingCity"
                type="text"
                value={formData.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                onBlur={() => handleFieldBlur('city')}
                error={touched.city ? errors.city : undefined}
                placeholder="New York"
                autoComplete="billing address-level2"
              />
            </div>

            <div>
              <Label htmlFor="billingState" required>
                State
              </Label>
              <select
                id="billingState"
                value={formData.state}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                onBlur={() => handleFieldBlur('state')}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg bg-surface text-text-primary',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  errors.state && touched.state ? 'border-error' : 'border-border-default'
                )}
                autoComplete="billing address-level1"
              >
                <option value="">Select State</option>
                {US_STATES.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.state && touched.state && (
                <p className="mt-1 text-sm text-error" role="alert">
                  {errors.state}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="billingPostalCode" required>
                ZIP Code
              </Label>
              <Input
                id="billingPostalCode"
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                onBlur={() => handleFieldBlur('postalCode')}
                error={touched.postalCode ? errors.postalCode : undefined}
                placeholder="12345"
                autoComplete="billing postal-code"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="billingPhone">
              Phone Number (optional)
            </Label>
            <Input
              id="billingPhone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              onBlur={() => handleFieldBlur('phone')}
              error={touched.phone ? errors.phone : undefined}
              placeholder="(555) 123-4567"
              autoComplete="billing tel"
            />
          </div>

          {/* Form validation status indicator */}
          <div className="text-sm text-text-secondary">
            {isFormValid() ? (
              <span className="text-green-600">✓ Billing address complete</span>
            ) : (
              <span>Please fill in all required fields</span>
            )}
          </div>
        </div>
      )}

      {sameAsShipping && shippingAddress && (
        <div className="p-4 bg-background border border-border-default rounded-lg">
          <h3 className="text-sm font-medium text-text-primary mb-2">Billing Address</h3>
          <div className="text-sm text-text-secondary">
            <p>{shippingAddress.street1}</p>
            {shippingAddress.street2 && <p>{shippingAddress.street2}</p>}
            <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
            {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
          </div>
        </div>
      )}
    </div>
  );
}