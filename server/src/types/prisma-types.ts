/**
 * Prisma enum types as TypeScript string unions
 * These are used when the Prisma client types are not available
 */

export type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type StockMovementType = 
  | 'purchase'
  | 'sale'
  | 'adjustment'
  | 'return'
  | 'transfer'
  | 'restock'
  | 'damaged'
  | 'expired'
  | 'reserved'
  | 'unreserved';

export type ProductCategory = 
  | 'male'
  | 'female';

export type PackageSize = 
  | 'single'
  | 'pack_12';

export type UserRole = 
  | 'customer'
  | 'admin'
  | 'super_admin';
