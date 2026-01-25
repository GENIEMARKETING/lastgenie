import { prisma } from '../lib/prisma';
import { StockMovementType } from '../types/prisma-types';
import { sseManager, SSEEvents } from './sse';

export interface InventoryUpdateData {
  currentStock?: number;
  reservedStock?: number;
  lowStockThreshold?: number;
}

export interface StockMovementData {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  orderId?: string;
  adminUserId?: string;
  metadata?: any;
}

/**
 * Get inventory for a specific product
 */
export async function getProductInventory(productId: string) {
  return await prisma.inventory.findUnique({
    where: { productId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          isActive: true
        }
      }
    }
  });
}

/**
 * Get all inventory records with optional filters
 */
export async function getAllInventory(filters: {
  lowStockOnly?: boolean;
  activeProductsOnly?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const where: any = {};
  
  if (filters.activeProductsOnly) {
    where.product = { isActive: true };
  }
  
  if (filters.lowStockOnly) {
    where.currentStock = { lte: prisma.inventory.fields.lowStockThreshold };
  }

  return await prisma.inventory.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          isActive: true,
          price: true,
          category: true
        }
      }
    },
    orderBy: [
      { currentStock: 'asc' }, // Show low stock items first
      { product: { name: 'asc' } }
    ],
    take: filters.limit,
    skip: filters.offset
  });
}

/**
 * Get low stock products
 */
export async function getLowStockProducts() {
  return await prisma.inventory.findMany({
    where: {
      OR: [
        { currentStock: { lte: prisma.inventory.fields.lowStockThreshold } },
        { currentStock: 0 }
      ],
      product: { isActive: true }
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          category: true
        }
      }
    },
    orderBy: { currentStock: 'asc' }
  });
}

/**
 * Initialize inventory for a product
 */
export async function initializeInventory(productId: string, initialStock: number = 0, lowStockThreshold: number = 10) {
  const existingInventory = await prisma.inventory.findUnique({
    where: { productId }
  });

  if (existingInventory) {
    throw new Error('Inventory already exists for this product');
  }

  return await prisma.inventory.create({
    data: {
      productId,
      currentStock: initialStock,
      lowStockThreshold,
      totalReceived: initialStock,
      lastRestocked: initialStock > 0 ? new Date() : null
    }
  });
}

/**
 * Update inventory levels
 */
export async function updateInventory(productId: string, data: InventoryUpdateData) {
  const inventory = await prisma.inventory.findUnique({
    where: { productId }
  });

  if (!inventory) {
    throw new Error('Inventory not found for this product');
  }

  return await prisma.inventory.update({
    where: { productId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

/**
 * Record a stock movement and update inventory
 */
export async function recordStockMovement(data: StockMovementData): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Get current inventory
    const inventory = await tx.inventory.findUnique({
      where: { productId: data.productId }
    });

    if (!inventory) {
      throw new Error('Inventory not found for this product');
    }

    const previousStock = inventory.currentStock;
    let newStock = previousStock;
    let updateData: any = {};

    // Calculate new stock based on movement type
    switch (data.type) {
      case 'restock':
        newStock = previousStock + Math.abs(data.quantity);
        updateData = {
          currentStock: newStock,
          totalReceived: inventory.totalReceived + Math.abs(data.quantity),
          lastRestocked: new Date()
        };
        break;

      case 'sale':
        newStock = Math.max(0, previousStock - Math.abs(data.quantity));
        updateData = {
          currentStock: newStock,
          totalSold: inventory.totalSold + Math.abs(data.quantity)
        };
        break;

      case 'adjustment':
        newStock = previousStock + data.quantity; // Can be positive or negative
        newStock = Math.max(0, newStock);
        updateData = { currentStock: newStock };
        break;

      case 'return':
        newStock = previousStock + Math.abs(data.quantity);
        updateData = { currentStock: newStock };
        break;

      case 'damaged':
      case 'expired':
        newStock = Math.max(0, previousStock - Math.abs(data.quantity));
        updateData = { currentStock: newStock };
        break;

      case 'reserved':
        updateData = {
          reservedStock: inventory.reservedStock + Math.abs(data.quantity)
        };
        newStock = previousStock; // Current stock doesn't change, only reserved
        break;

      case 'unreserved':
        updateData = {
          reservedStock: Math.max(0, inventory.reservedStock - Math.abs(data.quantity))
        };
        newStock = previousStock; // Current stock doesn't change, only reserved
        break;

      default:
        throw new Error(`Unknown stock movement type: ${data.type}`);
    }

    // Update inventory
    const updatedInventory = await tx.inventory.update({
      where: { productId: data.productId },
      data: updateData,
      include: {
        product: {
          select: {
            name: true
          }
        }
      }
    });

    // Record the movement
    await tx.stockMovement.create({
      data: {
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        previousStock,
        newStock: data.type === 'reserved' || data.type === 'unreserved' ? previousStock : newStock,
        reason: data.reason,
        orderId: data.orderId,
        adminUserId: data.adminUserId,
        metadata: data.metadata
      }
    });

    // Emit SSE events for real-time updates
    const finalStock = data.type === 'reserved' || data.type === 'unreserved' ? previousStock : newStock;
    const isLowStock = finalStock <= updatedInventory.lowStockThreshold;

    // Emit inventory update event
    sseManager.broadcastToAdmins(SSEEvents.inventoryUpdate(
      data.productId,
      finalStock,
      isLowStock
    ));

    // Emit specific events based on movement type
    if (data.type === 'restock') {
      sseManager.broadcastToAdmins(SSEEvents.stockRestock(
        data.productId,
        updatedInventory.product.name,
        Math.abs(data.quantity),
        finalStock
      ));
    }

    // Emit low stock alert if applicable
    if (isLowStock && finalStock > 0) {
      sseManager.broadcastToAdmins(SSEEvents.lowStockAlert(
        data.productId,
        updatedInventory.product.name,
        finalStock,
        updatedInventory.lowStockThreshold
      ));
    }
  });
}

/**
 * Bulk restock multiple products
 */
export async function bulkRestock(restockData: Array<{
  productId: string;
  quantity: number;
  reason?: string;
  adminUserId: string;
}>) {
  const results: any[] = [];
  
  for (const item of restockData) {
    try {
      await recordStockMovement({
        productId: item.productId,
        type: 'restock',
        quantity: item.quantity,
        reason: item.reason || 'Bulk restock',
        adminUserId: item.adminUserId
      });
      results.push({ productId: item.productId, success: true });
    } catch (error) {
      results.push({ 
        productId: item.productId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Get stock movement history for a product
 */
export async function getStockMovementHistory(productId: string, limit: number = 50) {
  return await prisma.stockMovement.findMany({
    where: { productId },
    include: {
      adminUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      product: {
        select: {
          name: true,
          sku: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Get inventory statistics
 */
export async function getInventoryStats() {
  const [
    totalProducts,
    lowStockCount,
    outOfStockCount,
    totalInventoryValue
  ] = await Promise.all([
    prisma.inventory.count({
      where: { product: { isActive: true } }
    }),
    prisma.inventory.count({
      where: {
        currentStock: { lte: prisma.inventory.fields.lowStockThreshold },
        product: { isActive: true }
      }
    }),
    prisma.inventory.count({
      where: {
        currentStock: 0,
        product: { isActive: true }
      }
    }),
    prisma.inventory.aggregate({
      where: { product: { isActive: true } },
      _sum: { currentStock: true }
    })
  ]);

  return {
    totalProducts,
    lowStockCount,
    outOfStockCount,
    totalInventoryValue: totalInventoryValue._sum.currentStock || 0
  };
}

/**
 * Reserve stock for an order
 */
export async function reserveStock(orderId: string, items: Array<{ productId: string; quantity: number }>) {
  const results: any[] = [];

  for (const item of items) {
    try {
      await recordStockMovement({
        productId: item.productId,
        type: 'reserved',
        quantity: item.quantity,
        reason: `Reserved for order ${orderId}`,
        orderId
      });
      results.push({ productId: item.productId, success: true });
    } catch (error) {
      results.push({
        productId: item.productId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Confirm stock sale (convert reserved to sold)
 */
export async function confirmStockSale(orderId: string, items: Array<{ productId: string; quantity: number }>) {
  const results: any[] = [];

  for (const item of items) {
    try {
      // First unreserve the stock
      await recordStockMovement({
        productId: item.productId,
        type: 'unreserved',
        quantity: item.quantity,
        reason: `Unreserved for completed order ${orderId}`,
        orderId
      });

      // Then record the sale
      await recordStockMovement({
        productId: item.productId,
        type: 'sale',
        quantity: item.quantity,
        reason: `Sold in order ${orderId}`,
        orderId
      });

      results.push({ productId: item.productId, success: true });
    } catch (error) {
      results.push({
        productId: item.productId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}