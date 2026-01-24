import { prisma } from '../lib/prisma';

export interface AddressInput {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface GuestAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/**
 * Normalize address for comparison
 */
export function normalizeAddress(address: AddressInput | GuestAddress): AddressInput {
  // Handle both guest address format and standard address format
  const streetAddress = 'streetAddress' in address 
    ? address.streetAddress 
    : `${address.street1}${address.street2 ? ` ${address.street2}` : ''}`;
  
  const zipCode = 'zipCode' in address ? address.zipCode : address.postalCode;

  return {
    streetAddress: streetAddress.trim().toLowerCase(),
    city: address.city.trim().toLowerCase(),
    state: address.state.trim().toLowerCase(),
    zipCode: zipCode.trim().toLowerCase(),
    country: address.country.trim().toLowerCase(),
    phone: address.phone?.trim() || undefined
  };
}

/**
 * Check if two addresses are the same
 */
export function addressesMatch(addr1: AddressInput, addr2: AddressInput): boolean {
  const normalized1 = normalizeAddress(addr1);
  const normalized2 = normalizeAddress(addr2);

  return (
    normalized1.streetAddress === normalized2.streetAddress &&
    normalized1.city === normalized2.city &&
    normalized1.state === normalized2.state &&
    normalized1.zipCode === normalized2.zipCode &&
    normalized1.country === normalized2.country
  );
}

/**
 * Find duplicate address for a user
 */
export async function findDuplicateAddress(
  userId: string,
  address: AddressInput | GuestAddress,
  type: 'shipping' | 'billing'
): Promise<any | null> {
  const normalizedAddress = normalizeAddress(address);
  
  // Get all user addresses of the specified type
  const userAddresses = await prisma.address.findMany({
    where: {
      userId,
      type
    }
  });

  // Check each address for a match
  for (const userAddress of userAddresses) {
    const userAddressInput: AddressInput = {
      streetAddress: userAddress.streetAddress,
      city: userAddress.city,
      state: userAddress.state,
      zipCode: userAddress.zipCode,
      country: userAddress.country,
      phone: userAddress.phone || undefined
    };

    if (addressesMatch(normalizedAddress, userAddressInput)) {
      return userAddress;
    }
  }

  return null;
}

/**
 * Save address only if it's not a duplicate
 */
export async function saveUniqueAddress(
  userId: string,
  address: AddressInput | GuestAddress,
  type: 'shipping' | 'billing',
  setAsDefault: boolean = false
): Promise<any> {
  // Check for duplicate
  const duplicate = await findDuplicateAddress(userId, address, type);
  if (duplicate) {
    // If we want to set as default and it's not already default
    if (setAsDefault && !duplicate.isDefault) {
      // Unset other defaults first
      await prisma.address.updateMany({
        where: {
          userId,
          type,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });

      // Set this one as default
      return await prisma.address.update({
        where: { id: duplicate.id },
        data: { isDefault: true }
      });
    }
    return duplicate;
  }

  // Convert guest address format to standard format
  const normalizedAddress = normalizeAddress(address);
  
  // If setting as default, unset other defaults first
  if (setAsDefault) {
    await prisma.address.updateMany({
      where: {
        userId,
        type,
        isDefault: true
      },
      data: {
        isDefault: false
      }
    });
  }

  // Create new address
  return await prisma.address.create({
    data: {
      userId,
      streetAddress: normalizedAddress.streetAddress,
      city: normalizedAddress.city,
      state: normalizedAddress.state,
      zipCode: normalizedAddress.zipCode,
      country: normalizedAddress.country,
      phone: normalizedAddress.phone,
      type,
      isDefault: setAsDefault
    }
  });
}

/**
 * Save checkout addresses (both shipping and billing if provided)
 */
export async function saveCheckoutAddresses(
  userId: string,
  guestCheckoutData: {
    shippingAddress: GuestAddress;
    billingAddress?: GuestAddress;
    sameAsBilling: boolean;
  }
): Promise<{ shipping: any; billing?: any }> {
  const results: { shipping: any; billing?: any } = {
    shipping: null
  };

  // Check if user has any addresses (to determine if this should be default)
  const existingAddresses = await prisma.address.findMany({
    where: { userId },
    select: { id: true }
  });
  const isFirstAddress = existingAddresses.length === 0;

  // Save shipping address
  results.shipping = await saveUniqueAddress(
    userId,
    guestCheckoutData.shippingAddress,
    'shipping',
    isFirstAddress // Set as default if it's the user's first address
  );

  // Save billing address if different from shipping
  if (!guestCheckoutData.sameAsBilling && guestCheckoutData.billingAddress) {
    results.billing = await saveUniqueAddress(
      userId,
      guestCheckoutData.billingAddress,
      'billing',
      isFirstAddress // Set as default if it's the user's first address
    );
  }

  return results;
}