"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const adminAuth_1 = require("../../middleware/adminAuth");
const product_1 = require("../../services/product");
const router = express_1.default.Router();
// Validation schemas
const createProductSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1, 'SKU is required'),
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    price: zod_1.z.number().positive('Price must be positive'),
    originalPrice: zod_1.z.number().positive().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    images: zod_1.z.array(zod_1.z.string().url()).optional(),
    category: zod_1.z.nativeEnum(client_1.ProductCategory),
    packageSize: zod_1.z.nativeEnum(client_1.PackageSize),
    isSubscribable: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
    isFeatured: zod_1.z.boolean().optional(),
    displayOrder: zod_1.z.number().int().min(0).optional(),
    metaTitle: zod_1.z.string().optional(),
    metaDescription: zod_1.z.string().optional(),
    initialStock: zod_1.z.number().int().min(0).optional(),
    lowStockThreshold: zod_1.z.number().int().min(0).optional()
});
const updateProductSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1).optional(),
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).optional(),
    price: zod_1.z.number().positive().optional(),
    originalPrice: zod_1.z.number().positive().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    images: zod_1.z.array(zod_1.z.string().url()).optional(),
    category: zod_1.z.nativeEnum(client_1.ProductCategory).optional(),
    packageSize: zod_1.z.nativeEnum(client_1.PackageSize).optional(),
    isSubscribable: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
    isFeatured: zod_1.z.boolean().optional(),
    displayOrder: zod_1.z.number().int().min(0).optional(),
    metaTitle: zod_1.z.string().optional(),
    metaDescription: zod_1.z.string().optional()
});
const bulkUpdateSchema = zod_1.z.object({
    updates: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().cuid(),
        data: updateProductSchema
    }))
});
const duplicateProductSchema = zod_1.z.object({
    newSku: zod_1.z.string().min(1, 'New SKU is required'),
    newName: zod_1.z.string().optional()
});
/**
 * GET /api/admin/products
 * Get all products with optional filters
 */
router.get('/', ...(0, adminAuth_1.requireAdminRead)('products'), async (req, res) => {
    try {
        const { category, packageSize, isActive, isFeatured, search, limit = '50', offset = '0', sortBy = 'displayOrder', sortOrder = 'asc' } = req.query;
        const filters = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            sortBy: sortBy,
            sortOrder: sortOrder
        };
        if (category)
            filters.category = category;
        if (packageSize)
            filters.packageSize = packageSize;
        if (isActive !== undefined)
            filters.isActive = isActive === 'true';
        if (isFeatured !== undefined)
            filters.isFeatured = isFeatured === 'true';
        if (search)
            filters.search = search;
        const products = await (0, product_1.getAllProducts)(filters);
        // Calculate average rating for each product
        const productsWithRatings = products.map(product => ({
            ...product,
            images: product.images ? JSON.parse(product.images) : [],
            averageRating: product.reviews.length > 0
                ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
                : 0,
            reviews: undefined // Remove detailed reviews from list view
        }));
        res.json({
            success: true,
            data: productsWithRatings
        });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
});
/**
 * GET /api/admin/products/stats
 * Get product statistics
 */
router.get('/stats', ...(0, adminAuth_1.requireAdminRead)('products'), async (req, res) => {
    try {
        const stats = await (0, product_1.getProductStats)();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching product stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product statistics'
        });
    }
});
/**
 * GET /api/admin/products/top-selling
 * Get top selling products
 */
router.get('/top-selling', ...(0, adminAuth_1.requireAdminRead)('products'), async (req, res) => {
    try {
        const { limit = '10' } = req.query;
        const products = await (0, product_1.getTopSellingProducts)(parseInt(limit));
        const productsWithRatings = products.map(product => ({
            ...product,
            images: product.images ? JSON.parse(product.images) : []
        }));
        res.json({
            success: true,
            data: productsWithRatings
        });
    }
    catch (error) {
        console.error('Error fetching top selling products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top selling products'
        });
    }
});
/**
 * GET /api/admin/products/low-stock
 * Get products with low stock
 */
router.get('/low-stock', ...(0, adminAuth_1.requireAdminRead)('products'), async (req, res) => {
    try {
        const products = await (0, product_1.getProductsWithLowStock)();
        const productsWithImages = products.map(product => ({
            ...product,
            images: product.images ? JSON.parse(product.images) : []
        }));
        res.json({
            success: true,
            data: productsWithImages
        });
    }
    catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch low stock products'
        });
    }
});
/**
 * GET /api/admin/products/:id
 * Get a single product by ID
 */
router.get('/:id', ...(0, adminAuth_1.requireAdminRead)('products'), async (req, res) => {
    try {
        const { id } = req.params;
        const product = await (0, product_1.getProductById)(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        const productWithImages = {
            ...product,
            images: product.images ? JSON.parse(product.images) : []
        };
        res.json({
            success: true,
            data: productWithImages
        });
    }
    catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product'
        });
    }
});
/**
 * POST /api/admin/products
 * Create a new product
 */
router.post('/', ...(0, adminAuth_1.requireAdminWrite)('products'), (0, adminAuth_1.auditAdminAction)('product_create', 'product'), async (req, res) => {
    try {
        const validatedData = createProductSchema.parse(req.body);
        const product = await (0, product_1.createProduct)(validatedData);
        const productWithImages = {
            ...product,
            images: product.images ? JSON.parse(product.images) : []
        };
        res.status(201).json({
            success: true,
            data: productWithImages,
            message: 'Product created successfully'
        });
    }
    catch (error) {
        console.error('Error creating product:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        if (error instanceof Error && error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create product'
        });
    }
});
/**
 * PUT /api/admin/products/:id
 * Update a product
 */
router.put('/:id', ...(0, adminAuth_1.requireAdminWrite)('products'), (0, adminAuth_1.auditAdminAction)('product_update', 'product'), async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateProductSchema.parse(req.body);
        const product = await (0, product_1.updateProduct)(id, validatedData);
        const productWithImages = {
            ...product,
            images: product.images ? JSON.parse(product.images) : []
        };
        res.json({
            success: true,
            data: productWithImages,
            message: 'Product updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating product:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        if (error instanceof Error && error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update product'
        });
    }
});
/**
 * DELETE /api/admin/products/:id
 * Soft delete a product (mark as inactive)
 */
router.delete('/:id', ...(0, adminAuth_1.requireAdminDelete)('products'), (0, adminAuth_1.auditAdminAction)('product_delete', 'product'), async (req, res) => {
    try {
        const { id } = req.params;
        const product = await (0, product_1.deleteProduct)(id);
        res.json({
            success: true,
            data: product,
            message: 'Product deactivated successfully'
        });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to delete product'
        });
    }
});
/**
 * DELETE /api/admin/products/:id/permanent
 * Permanently delete a product (use with extreme caution)
 */
router.delete('/:id/permanent', ...(0, adminAuth_1.requireAdminDelete)('products'), (0, adminAuth_1.auditAdminAction)('product_permanent_delete', 'product'), async (req, res) => {
    try {
        const { id } = req.params;
        // Only super admins can permanently delete products
        if (req.user?.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: 'Only super administrators can permanently delete products'
            });
        }
        await (0, product_1.permanentlyDeleteProduct)(id);
        res.json({
            success: true,
            message: 'Product permanently deleted'
        });
    }
    catch (error) {
        console.error('Error permanently deleting product:', error);
        if (error instanceof Error && error.message.includes('Cannot delete')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to permanently delete product'
        });
    }
});
/**
 * POST /api/admin/products/bulk-update
 * Bulk update multiple products
 */
router.post('/bulk-update', ...(0, adminAuth_1.requireAdminWrite)('products'), (0, adminAuth_1.auditAdminAction)('product_bulk_update', 'product'), async (req, res) => {
    try {
        const validatedData = bulkUpdateSchema.parse(req.body);
        const results = await (0, product_1.bulkUpdateProducts)(validatedData.updates);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        res.json({
            success: true,
            data: results,
            message: `Bulk update completed: ${successful} successful, ${failed} failed`
        });
    }
    catch (error) {
        console.error('Error bulk updating products:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to perform bulk update'
        });
    }
});
/**
 * POST /api/admin/products/:id/duplicate
 * Duplicate a product
 */
router.post('/:id/duplicate', ...(0, adminAuth_1.requireAdminWrite)('products'), (0, adminAuth_1.auditAdminAction)('product_duplicate', 'product'), async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = duplicateProductSchema.parse(req.body);
        const product = await (0, product_1.duplicateProduct)(id, validatedData.newSku, validatedData.newName);
        const productWithImages = {
            ...product,
            images: product.images ? JSON.parse(product.images) : []
        };
        res.status(201).json({
            success: true,
            data: productWithImages,
            message: 'Product duplicated successfully'
        });
    }
    catch (error) {
        console.error('Error duplicating product:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: 'Original product not found'
            });
        }
        if (error instanceof Error && error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to duplicate product'
        });
    }
});
exports.default = router;
