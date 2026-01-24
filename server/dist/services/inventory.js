"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductInventory = getProductInventory;
exports.getAllInventory = getAllInventory;
exports.getLowStockProducts = getLowStockProducts;
exports.initializeInventory = initializeInventory;
exports.updateInventory = updateInventory;
exports.recordStockMovement = recordStockMovement;
exports.bulkRestock = bulkRestock;
exports.getStockMovementHistory = getStockMovementHistory;
exports.getInventoryStats = getInventoryStats;
exports.reserveStock = reserveStock;
exports.confirmStockSale = confirmStockSale;
const prisma_1 = require("../lib/prisma");
const sse_1 = require("./sse");
/**
 * Get inventory for a specific product
 */
async function getProductInventory(productId) {
    return await prisma_1.prisma.inventory.findUnique({
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
async function getAllInventory(filters = {}) {
    const where = {};
    if (filters.activeProductsOnly) {
        where.product = { isActive: true };
    }
    if (filters.lowStockOnly) {
        where.currentStock = { lte: prisma_1.prisma.inventory.fields.lowStockThreshold };
    }
    return await prisma_1.prisma.inventory.findMany({
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
async function getLowStockProducts() {
    return await prisma_1.prisma.inventory.findMany({
        where: {
            OR: [
                { currentStock: { lte: prisma_1.prisma.inventory.fields.lowStockThreshold } },
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
async function initializeInventory(productId, initialStock = 0, lowStockThreshold = 10) {
    const existingInventory = await prisma_1.prisma.inventory.findUnique({
        where: { productId }
    });
    if (existingInventory) {
        throw new Error('Inventory already exists for this product');
    }
    return await prisma_1.prisma.inventory.create({
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
async function updateInventory(productId, data) {
    const inventory = await prisma_1.prisma.inventory.findUnique({
        where: { productId }
    });
    if (!inventory) {
        throw new Error('Inventory not found for this product');
    }
    return await prisma_1.prisma.inventory.update({
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
async function recordStockMovement(data) {
    await prisma_1.prisma.$transaction(async (tx) => {
        // Get current inventory
        const inventory = await tx.inventory.findUnique({
            where: { productId: data.productId }
        });
        if (!inventory) {
            throw new Error('Inventory not found for this product');
        }
        const previousStock = inventory.currentStock;
        let newStock = previousStock;
        let updateData = {};
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
        sse_1.sseManager.broadcastToAdmins(sse_1.SSEEvents.inventoryUpdate(data.productId, finalStock, isLowStock));
        // Emit specific events based on movement type
        if (data.type === 'restock') {
            sse_1.sseManager.broadcastToAdmins(sse_1.SSEEvents.stockRestock(data.productId, updatedInventory.product.name, Math.abs(data.quantity), finalStock));
        }
        // Emit low stock alert if applicable
        if (isLowStock && finalStock > 0) {
            sse_1.sseManager.broadcastToAdmins(sse_1.SSEEvents.lowStockAlert(data.productId, updatedInventory.product.name, finalStock, updatedInventory.lowStockThreshold));
        }
    });
}
/**
 * Bulk restock multiple products
 */
async function bulkRestock(restockData) {
    const results = [];
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
        }
        catch (error) {
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
async function getStockMovementHistory(productId, limit = 50) {
    return await prisma_1.prisma.stockMovement.findMany({
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
async function getInventoryStats() {
    const [totalProducts, lowStockCount, outOfStockCount, totalInventoryValue] = await Promise.all([
        prisma_1.prisma.inventory.count({
            where: { product: { isActive: true } }
        }),
        prisma_1.prisma.inventory.count({
            where: {
                currentStock: { lte: prisma_1.prisma.inventory.fields.lowStockThreshold },
                product: { isActive: true }
            }
        }),
        prisma_1.prisma.inventory.count({
            where: {
                currentStock: 0,
                product: { isActive: true }
            }
        }),
        prisma_1.prisma.inventory.aggregate({
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
async function reserveStock(orderId, items) {
    const results = [];
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
        }
        catch (error) {
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
async function confirmStockSale(orderId, items) {
    const results = [];
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
        }
        catch (error) {
            results.push({
                productId: item.productId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    return results;
}
