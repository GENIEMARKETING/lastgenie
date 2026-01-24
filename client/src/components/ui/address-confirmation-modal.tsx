'use client';

import { Dialog } from './dialog';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { ShippingAddress, AddressValidationResult } from '@/types/cart';

interface AddressConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalAddress: ShippingAddress;
  validationResult: AddressValidationResult;
  onAccept: (address: ShippingAddress) => void;
  onKeepOriginal: () => void;
}

export function AddressConfirmationModal({
  open,
  onOpenChange,
  originalAddress,
  validationResult,
  onAccept,
  onKeepOriginal,
}: AddressConfirmationModalProps) {
  // Helper function to check if two addresses are different
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

  const hasCorrection = validationResult.validatedAddress && 
    addressesAreDifferent(originalAddress, validationResult.validatedAddress);
  
  const addressToShow = validationResult.validatedAddress || originalAddress;

  const handleAccept = () => {
    if (validationResult.validatedAddress) {
      onAccept(validationResult.validatedAddress);
    } else {
      onAccept(originalAddress);
    }
    onOpenChange(false);
  };

  const handleKeepOriginal = () => {
    onKeepOriginal();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        validationResult.requiresUnitNumber
          ? 'Unit Number Required'
          : validationResult.suggestions && validationResult.suggestions.length > 1
          ? 'Select Your Unit Number'
          : hasCorrection
          ? 'Address Correction Available'
          : 'Confirm Shipping Address'
      }
      footer={
        validationResult.requiresUnitNumber ? null : (
          validationResult.suggestions && validationResult.suggestions.length > 1 ? null : (
            <div className="flex gap-3 justify-end">
              {hasCorrection && (
                <button
                  onClick={handleKeepOriginal}
                  className="px-4 py-2 border border-border-default rounded-lg text-sm font-medium text-text-primary hover:bg-background transition-colors"
                >
                  Keep Original
                </button>
              )}
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {hasCorrection ? 'Accept Corrected Address' : 'Confirm Address'}
              </button>
            </div>
          )
        )
      }
    >
      <div className="space-y-4">
        {/* Validation Status */}
        {(() => {
          // Check if there are warning messages that should prevent showing success
          const hasWarningMessages = validationResult.messages?.some((msg: string) =>
            msg.toLowerCase().includes('not configured') ||
            msg.toLowerCase().includes('unavailable') ||
            msg.toLowerCase().includes('verify manually') ||
            msg.toLowerCase().includes('unexpected response')
          );

          // Check if validation service is unavailable
          const isServiceUnavailable = validationResult.messages?.some((msg: string) =>
            msg.toLowerCase().includes('not configured') || 
            msg.toLowerCase().includes('unavailable')
          );

          // Only show success if truly valid and no warnings
          if (isServiceUnavailable) {
            return (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Address validation service unavailable
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                    {validationResult.messages?.[0] || 'Please verify your address manually.'}
                  </p>
                </div>
              </div>
            );
          } else if (validationResult.isValid && !hasWarningMessages) {
            return (
              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Address validated successfully
                  </p>
                </div>
              </div>
            );
          } else {
            return (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Address validation completed
                  </p>
                  {hasWarningMessages && validationResult.messages && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                      {validationResult.messages[0]}
                    </p>
                  )}
                </div>
              </div>
            );
          }
        })()}

        {/* Unit Number Required */}
        {validationResult.requiresUnitNumber ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">Standardized Address:</p>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-text-primary">
                <p>{addressToShow.street1 || 'N/A'}</p>
                <p>
                  {addressToShow.city || 'N/A'}, {addressToShow.state || 'N/A'} {addressToShow.postalCode || 'N/A'}
                </p>
                {addressToShow.country && <p>{addressToShow.country}</p>}
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Unit Number Required
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    {validationResult.messages?.[0] || 'This address requires a unit, apartment, or suite number.'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                Please close this dialog and enter your unit number in the address form above. We will validate the complete address once you provide it.
              </p>
            </div>
          </div>
        ) : validationResult.suggestions && validationResult.suggestions.length > 0 ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">Your Original Address:</p>
              <div className="p-3 bg-background border border-border-default rounded-lg text-sm text-text-primary">
                <p>{originalAddress.street1 || 'N/A'}</p>
                {originalAddress.street2 && <p>{originalAddress.street2}</p>}
                <p>
                  {originalAddress.city || 'N/A'}, {originalAddress.state || 'N/A'} {originalAddress.postalCode || 'N/A'}
                </p>
                {originalAddress.country && <p>{originalAddress.country}</p>}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-text-secondary mb-3">
                Multiple addresses found at this location. Please select your unit number:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {validationResult.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 bg-surface border border-border-default rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      onAccept(suggestion);
                      onOpenChange(false);
                    }}
                  >
                    <div className="text-sm text-text-primary">
                      <p className="font-medium">{suggestion.street1}</p>
                      {suggestion.street2 && (
                        <p className="text-primary font-medium">{suggestion.street2}</p>
                      )}
                      <p className="text-text-secondary">
                        {suggestion.city}, {suggestion.state} {suggestion.postalCode}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : hasCorrection ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">Your Original Address:</p>
              <div className="p-3 bg-background border border-border-default rounded-lg text-sm text-text-primary">
                <p>{originalAddress.street1 || 'N/A'}</p>
                {originalAddress.street2 && <p>{originalAddress.street2}</p>}
                <p>
                  {originalAddress.city || 'N/A'}, {originalAddress.state || 'N/A'} {originalAddress.postalCode || 'N/A'}
                </p>
                {originalAddress.country && <p>{originalAddress.country}</p>}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">Corrected Address:</p>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-text-primary">
                <p>{addressToShow.street1 || 'N/A'}</p>
                {addressToShow.street2 && <p>{addressToShow.street2}</p>}
                <p>
                  {addressToShow.city || 'N/A'}, {addressToShow.state || 'N/A'} {addressToShow.postalCode || 'N/A'}
                </p>
                {addressToShow.country && <p>{addressToShow.country}</p>}
              </div>
              <p className="text-xs text-text-secondary mt-2">
                We recommend using the corrected address for better delivery accuracy.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">Shipping Address:</p>
            <div className="p-3 bg-background border border-border-default rounded-lg text-sm text-text-primary">
              <p>{addressToShow.street1 || 'N/A'}</p>
              {addressToShow.street2 && <p>{addressToShow.street2}</p>}
              <p>
                {addressToShow.city || 'N/A'}, {addressToShow.state || 'N/A'} {addressToShow.postalCode || 'N/A'}
              </p>
              {addressToShow.country && <p>{addressToShow.country}</p>}
            </div>
          </div>
        )}

        {/* Messages */}
        {validationResult.messages && validationResult.messages.length > 0 && (
          <div className="text-xs text-text-secondary space-y-1">
            {validationResult.messages.map((msg, idx) => (
              <p key={idx}>{msg}</p>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
