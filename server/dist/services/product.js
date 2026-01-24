"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = getAllProducts;
exports.getProductById = getProductById;
exports.getProductBySku = getProductBySku;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.permanentlyDeleteProduct = permanentlyDeleteProduct;
exports.bulkUpdateProducts = bulkUpdateProducts;
exports.getProductStats = getProductStats;
exports.getTopSellingProducts = getTopSellingProducts;
exports.getProductsWithLowStock = getProductsWithLowStock;
exports.duplicateProduct = duplicateProduct;
const prisma_1 = require("../lib/prisma");
/**
 * Get all products with optional filters
 */
async function getAllProducts(filters = {}) {
    const where = {};
    if (filters.category) {
        where.category = filters.category;
    }
    if (filters.packageSize) {
        where.packageSize = filters.packageSize;
    }
    if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
    }
    if (filters.isFeatured !== undefined) {
        where.isFeatured = filters.isFeatured;
    }
    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } }
        ];
    }
    const orderBy = {};
    if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder || 'asc';
    }
    else {
        orderBy.displayOrder = 'asc';
    }
    return await prisma_1.prisma.product.findMany({
        where,
        include: {
            inventory: true,
            reviews: {
                select: {
                    rating: true
                }
            },
            _count: {
                select: {
                    orderItems: true,
                    reviews: true
                }
            }
        },
        orderBy,
        take: filters.limit,
        skip: filters.offset
    });
}
/**
 * Get a single product by ID
 */
async function getProductById(id) {
    return await prisma_1.prisma.product.findUnique({
        where: { id },
        include: {
            inventory: true,
            reviews: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            _count: {
                select: {
                    orderItems: true,
                    reviews: true,
                    subscriptions: true
                }
            }
        }
    });
}
/**
 * Get a single product by SKU
 */
async function getProductBySku(sku) {
    return await prisma_1.prisma.product.findUnique({
        where: { sku },
        include: {
            inventory: true,
            reviews: true,
            _count: {
                select: {
                    orderItems: true,
                    reviews: true
                }
            }
        }
    });
}
/**
 * Create a new product
 */
async function createProduct(data) {
    return await prisma_1.prisma.$transaction(async (tx) => {
        // Check if SKU already exists
        const existingProduct = await tx.product.findUnique({
            where: { sku: data.sku }
        });
        if (existingProduct) {
            throw new Error('A product with this SKU already exists');
        }
        // Create the product
        const product = await tx.product.create({
            data: {
                sku: data.sku,
                name: data.name,
                description: data.description,
                price: data.price,
                originalPrice: data.originalPrice,
                imageUrl: data.imageUrl,
                images: data.images ? JSON.stringify(data.images) : null,
                category: data.category,
                packageSize: data.packageSize,
                isSubscribable: data.isSubscribable || false,
                isActive: data.isActive !== undefined ? data.isActive : true,
                isFeatured: data.isFeatured || false,
                displayOrder: data.displayOrder || 0,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription
            },
            include: {
                inventory: true
            }
        });
        // Initialize inventory if initial stock is provided
        if (data.initialStock !== undefined || data.lowStockThreshold !== undefined) {
            await tx.inventory.create({
                data: {
                    productId: product.id,
                    currentStock: data.initialStock || 0,
                    lowStockThreshold: data.lowStockThreshold || 10,
                    totalReceived: data.initialStock || 0,
                    lastRestocked: data.initialStock && data.initialStock > 0 ? new Date() : null
                }
            });
        }
        return product;
    });
}
/**
 * Update a product
 */
async function updateProduct(id, data) {
    // Check if SKU is being updated and if it conflicts
    if (data.sku) {
        const existingProduct = await prisma_1.prisma.product.findFirst({
            where: {
                sku: data.sku,
                NOT: { id }
            }
        });
        if (existingProduct) {
            throw new Error('A product with this SKU already exists');
        }
    }
    return await prisma_1.prisma.product.update({
        where: { id },
        data: {
            ...data,
            images: data.images ? JSON.stringify(data.images) : undefined,
            updatedAt: new Date()
        },
        include: {
            inventory: true,
            _count: {
                select: {
                    orderItems: true,
                    reviews: true
                }
            }
        }
    });
}
/**
 * Soft delete a product (mark as inactive)
 */
async function deleteProduct(id) {
    return await prisma_1.prisma.product.update({
        where: { id },
        data: {
            isActive: false,
            updatedAt: new Date()
        }
    });
}
/**
 * Permanently delete a product (use with caution)
 */
async function permanentlyDeleteProduct(id) {
    return await prisma_1.prisma.$transaction(async (tx) => {
        // Delete related records first
        await tx.inventory.deleteMany({
            where: { productId: id }
        });
        await tx.stockMovement.deleteMany({
            where: { productId: id }
        });
        // Note: We can't delete products that have orders or reviews
        // Check for existing orders
        const orderItems = await tx.orderItem.findFirst({
            where: { productId: id }
        });
        if (orderItems) {
            throw new Error('Cannot delete product that has been ordered');
        }
        // Delete reviews
        await tx.review.deleteMany({
            where: { productId: id }
        });
        // Finally delete the product
        return await tx.product.delete({
            where: { id }
        });
    });
}
/**
 * Bulk update products
 */
async function bulkUpdateProducts(updates) {
    const results = [];
    for (const update of updates) {
        try {
            const product = await updateProduct(update.id, update.data);
            results.push({ id: update.id, success: true, data: product });
        }
        catch (error) {
            results.push({
                id: update.id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    return results;
}
/**
 * Get product statistics
 */
async function getProductStats() {
    const [totalProducts, activeProducts, featuredProducts, inactiveProducts, avgPrice, totalSales] = await Promise.all([
        prisma_1.prisma.product.count(),
        prisma_1.prisma.product.count({ where: { isActive: true } }),
        prisma_1.prisma.product.count({ where: { isFeatured: true } }),
        prisma_1.prisma.product.count({ where: { isActive: false } }),
        prisma_1.prisma.product.aggregate({
            where: { isActive: true },
            _avg: { price: true }
        }),
        prisma_1.prisma.orderItem.aggregate({
            _sum: { quantity: true }
        })
    ]);
    return {
        totalProducts,
        activeProducts,
        featuredProducts,
        inactiveProducts,
        averagePrice: avgPrice._avg.price || 0,
        totalSales: totalSales._sum.quantity || 0
    };
}
/**
 * Get top selling products
 */
async function getTopSellingProducts(limit = 10) {
    return await prisma_1.prisma.product.findMany({
        where: { isActive: true },
        include: {
            inventory: true,
            _count: {
                select: {
                    orderItems: true
                }
            }
        },
        orderBy: {
            orderItems: {
                _count: 'desc'
            }
        },
        take: limit
    });
}
/**
 * Get products with low stock
 */
async function getProductsWithLowStock() {
    return await prisma_1.prisma.product.findMany({
        where: {
            isActive: true,
            inventory: {
                OR: [
                    { currentStock: { lte: prisma_1.prisma.inventory.fields.lowStockThreshold } },
                    { currentStock: 0 }
                ]
            }
        },
        include: {
            inventory: true
        },
        orderBy: {
            inventory: {
                currentStock: 'asc'
            }
        }
    });
}
/**
 * Duplicate a product
 */
async function duplicateProduct(id, newSku, newName) {
    const originalProduct = await getProductById(id);
    if (!originalProduct) {
        throw new Error('Original product not found');
    }
    // Check if new SKU already exists
    const existingProduct = await getProductBySku(newSku);
    if (existingProduct) {
        throw new Error('A product with this SKU already exists');
    }
    const duplicateData = {
        sku: newSku,
        name: newName || `${originalProduct.name} (Copy)`,
        description: originalProduct.description,
        price: originalProduct.price,
        originalPrice: originalProduct.originalPrice || undefined,
        imageUrl: originalProduct.imageUrl || undefined,
        images: originalProduct.images ? JSON.parse(originalProduct.images) : undefined,
        category: originalProduct.category,
        packageSize: originalProduct.packageSize,
        isSubscribable: originalProduct.isSubscribable,
        isActive: false, // Start as inactive for review
        isFeatured: false,
        displayOrder: originalProduct.displayOrder,
        metaTitle: originalProduct.metaTitle || undefined,
        metaDescription: originalProduct.metaDescription || undefined,
        initialStock: 0, // Start with no stock
        lowStockThreshold: originalProduct.inventory?.lowStockThreshold || 10
    };
    return await createProduct(duplicateData);
}
