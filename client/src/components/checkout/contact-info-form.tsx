'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContactInfo } from '@/lib/guest-checkout-context';
import { cn } from '@/lib/utils';

interface ContactInfoFormProps {
  initialData?: ContactInfo | null;
  onChange: (contactInfo: ContactInfo) => void;
  className?: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export function ContactInfoForm({ initialData, onChange, className }: ContactInfoFormProps) {
  const [formData, setFormData] = useState<ContactInfo>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof ContactInfo, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Validation functions
  const validateField = (field: keyof ContactInfo, value: string): string | undefined => {
    switch (field) {
      case 'firstName':
        return value.trim() ? undefined : 'First name is required';
      case 'lastName':
        return value.trim() ? undefined : 'Last name is required';
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? undefined : 'Please enter a valid email address';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        // Remove all non-digit characters for validation
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length >= 10 ? undefined : 'Please enter a valid phone number';
      default:
        return undefined;
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
    }
  };

  const handleFieldChange = (field: keyof ContactInfo, value: string) => {
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

    // Call onChange with updated data
    onChange(updatedData);
  };

  const handleFieldBlur = (field: keyof ContactInfo) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim()) &&
           Object.values(errors).every(error => !error);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" required>
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            onBlur={() => handleFieldBlur('firstName')}
            error={touched.firstName ? errors.firstName : undefined}
            placeholder="Enter your first name"
            autoComplete="given-name"
          />
        </div>

        <div>
          <Label htmlFor="lastName" required>
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            onBlur={() => handleFieldBlur('lastName')}
            error={touched.lastName ? errors.lastName : undefined}
            placeholder="Enter your last name"
            autoComplete="family-name"
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
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          onBlur={() => handleFieldBlur('email')}
          error={touched.email ? errors.email : undefined}
          placeholder="Enter your email address"
          autoComplete="email"
        />
      </div>

      <div>
        <Label htmlFor="phone" required>
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleFieldChange('phone', e.target.value)}
          onBlur={() => handleFieldBlur('phone')}
          error={touched.phone ? errors.phone : undefined}
          placeholder="(555) 123-4567"
          autoComplete="tel"
        />
      </div>

      {/* Form validation status indicator */}
      <div className="text-sm text-text-secondary">
        {isFormValid() ? (
          <span className="text-green-600">✓ Contact information complete</span>
        ) : (
          <span>Please fill in all required fields</span>
        )}
      </div>
    </div>
  );
}