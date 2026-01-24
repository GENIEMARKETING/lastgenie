import express from 'express';
import { z } from 'zod';
import { ProductCategory, PackageSize } from '@prisma/client';
import {
  requireAdminRead,
  requireAdminWrite,
  requireAdminDelete,
  auditAdminAction
} from '../../middleware/adminAuth';
import {
  getAllProducts,
  getProductById,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
  permanentlyDeleteProduct,
  bulkUpdateProducts,
  getProductStats,
  getTopSellingProducts,
  getProductsWithLowStock,
  duplicateProduct
} from '../../services/product';

const router = express.Router();

// Validation schemas
const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  category: z.nativeEnum(ProductCategory),
  packageSize: z.nativeEnum(PackageSize),
  isSubscribable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  initialStock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional()
});

const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  category: z.nativeEnum(ProductCategory).optional(),
  packageSize: z.nativeEnum(PackageSize).optional(),
  isSubscribable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional()
});

const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.string().cuid(),
    data: updateProductSchema
  }))
});

const duplicateProductSchema = z.object({
  newSku: z.string().min(1, 'New SKU is required'),
  newName: z.string().optional()
});

/**
 * GET /api/admin/products
 * Get all products with optional filters
 */
router.get('/', ...requireAdminRead('products'), async (req, res) => {
  try {
    const {
      category,
      packageSize,
      isActive,
      isFeatured,
      search,
      limit = '50',
      offset = '0',
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    if (category) filters.category = category as ProductCategory;
    if (packageSize) filters.packageSize = packageSize as PackageSize;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';
    if (search) filters.search = search as string;

    const products = await getAllProducts(filters);

    // Calculate average rating for each product
    const productsWithRatings = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images as string) : [],
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0,
      reviews: undefined // Remove detailed reviews from list view
    }));

    res.json({
      success: true,
      data: productsWithRatings
    });
  } catch (error) {
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
router.get('/stats', ...requireAdminRead('products'), async (req, res) => {
  try {
    const stats = await getProductStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
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
router.get('/top-selling', ...requireAdminRead('products'), async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const products = await getTopSellingProducts(parseInt(limit as string));

    const productsWithRatings = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images as string) : []
    }));

    res.json({
      success: true,
      data: productsWithRatings
    });
  } catch (error) {
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
router.get('/low-stock', ...requireAdminRead('products'), async (req, res) => {
  try {
    const products = await getProductsWithLowStock();

    const productsWithImages = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images as string) : []
    }));

    res.json({
      success: true,
      data: productsWithImages
    });
  } catch (error) {
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
router.get('/:id', ...requireAdminRead('products'), async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const productWithImages = {
      ...product,
      images: product.images ? JSON.parse(product.images as string) : []
    };

    res.json({
      success: true,
      data: productWithImages
    });
  } catch (error) {
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
router.post('/',
  ...requireAdminWrite('products'),
  auditAdminAction('product_create', 'product'),
  async (req, res) => {
    try {
      const validatedData = createProductSchema.parse(req.body);
      const product = await createProduct(validatedData);

      const productWithImages = {
        ...product,
        images: product.images ? JSON.parse(product.images as string) : []
      };

      res.status(201).json({
        success: true,
        data: productWithImages,
        message: 'Product created successfully'
      });
    } catch (error) {
      console.error('Error creating product:', error);

      if (error instanceof z.ZodError) {
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
  }
);

/**
 * PUT /api/admin/products/:id
 * Update a product
 */
router.put('/:id',
  ...requireAdminWrite('products'),
  auditAdminAction('product_update', 'product'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateProductSchema.parse(req.body);

      const product = await updateProduct(id, validatedData);

      const productWithImages = {
        ...product,
        images: product.images ? JSON.parse(product.images as string) : []
      };

      res.json({
        success: true,
        data: productWithImages,
        message: 'Product updated successfully'
      });
    } catch (error) {
      console.error('Error updating product:', error);

      if (error instanceof z.ZodError) {
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
  }
);

/**
 * DELETE /api/admin/products/:id
 * Soft delete a product (mark as inactive)
 */
router.delete('/:id',
  ...requireAdminDelete('products'),
  auditAdminAction('product_delete', 'product'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const product = await deleteProduct(id);

      res.json({
        success: true,
        data: product,
        message: 'Product deactivated successfully'
      });
    } catch (error) {
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
  }
);

/**
 * DELETE /api/admin/products/:id/permanent
 * Permanently delete a product (use with extreme caution)
 */
router.delete('/:id/permanent',
  ...requireAdminDelete('products'),
  auditAdminAction('product_permanent_delete', 'product'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Only super admins can permanently delete products
      if (req.user?.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only super administrators can permanently delete products'
        });
      }

      await permanentlyDeleteProduct(id);

      res.json({
        success: true,
        message: 'Product permanently deleted'
      });
    } catch (error) {
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
  }
);

/**
 * POST /api/admin/products/bulk-update
 * Bulk update multiple products
 */
router.post('/bulk-update',
  ...requireAdminWrite('products'),
  auditAdminAction('product_bulk_update', 'product'),
  async (req, res) => {
    try {
      const validatedData = bulkUpdateSchema.parse(req.body);
      const results = await bulkUpdateProducts(validatedData.updates);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      res.json({
        success: true,
        data: results,
        message: `Bulk update completed: ${successful} successful, ${failed} failed`
      });
    } catch (error) {
      console.error('Error bulk updating products:', error);

      if (error instanceof z.ZodError) {
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
  }
);

/**
 * POST /api/admin/products/:id/duplicate
 * Duplicate a product
 */
router.post('/:id/duplicate',
  ...requireAdminWrite('products'),
  auditAdminAction('product_duplicate', 'product'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = duplicateProductSchema.parse(req.body);

      const product = await duplicateProduct(id, validatedData.newSku, validatedData.newName);

      const productWithImages = {
        ...product,
        images: product.images ? JSON.parse(product.images as string) : []
      };

      res.status(201).json({
        success: true,
        data: productWithImages,
        message: 'Product duplicated successfully'
      });
    } catch (error) {
      console.error('Error duplicating product:', error);

      if (error instanceof z.ZodError) {
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
  }
);

export default router;