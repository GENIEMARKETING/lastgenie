import express from 'express';
import { z } from 'zod';
import { 
  adminAuthenticate, 
  requireAdminRead, 
  requireAdminWrite,
  auditAdminAction 
} from '../../middleware/adminAuth';
import {
  getAllInventory,
  getProductInventory,
  getLowStockProducts,
  initializeInventory,
  updateInventory,
  recordStockMovement,
  bulkRestock,
  getStockMovementHistory,
  getInventoryStats,
  reserveStock,
  confirmStockSale
} from '../../services/inventory';
import { StockMovementType } from '@prisma/client';

const router = express.Router();

// Validation schemas
const restockSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  reason: z.string().optional()
});

const bulkRestockSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive(),
    reason: z.string().optional()
  }))
});

const updateInventorySchema = z.object({
  currentStock: z.number().int().min(0).optional(),
  reservedStock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional()
});

const stockMovementSchema = z.object({
  productId: z.string().cuid(),
  type: z.nativeEnum(StockMovementType),
  quantity: z.number().int(),
  reason: z.string().optional(),
  orderId: z.string().optional()
});

const reserveStockSchema = z.object({
  orderId: z.string(),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive()
  }))
});

/**
 * GET /api/admin/inventory
 * Get all inventory records with optional filters
 */
router.get('/', ...requireAdminRead('inventory'), async (req, res) => {
  try {
    const { 
      lowStockOnly = 'false', 
      activeProductsOnly = 'true', 
      limit = '50', 
      offset = '0' 
    } = req.query;

    const inventory = await getAllInventory({
      lowStockOnly: lowStockOnly === 'true',
      activeProductsOnly: activeProductsOnly === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory'
    });
  }
});

/**
 * GET /api/admin/inventory/stats
 * Get inventory statistics
 */
router.get('/stats', ...requireAdminRead('inventory'), async (req, res) => {
  try {
    const stats = await getInventoryStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory statistics'
    });
  }
});

/**
 * GET /api/admin/inventory/low-stock
 * Get products with low stock
 */
router.get('/low-stock', ...requireAdminRead('inventory'), async (req, res) => {
  try {
    const lowStockProducts = await getLowStockProducts();

    res.json({
      success: true,
      data: lowStockProducts
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
 * GET /api/admin/inventory/:productId
 * Get inventory for a specific product
 */
router.get('/:productId', ...requireAdminRead('inventory'), async (req, res) => {
  try {
    const { productId } = req.params;
    const inventory = await getProductInventory(productId);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory not found for this product'
      });
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product inventory'
    });
  }
});

/**
 * GET /api/admin/inventory/:productId/movements
 * Get stock movement history for a product
 */
router.get('/:productId/movements', ...requireAdminRead('inventory'), async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = '50' } = req.query;

    const movements = await getStockMovementHistory(productId, parseInt(limit as string));

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock movements'
    });
  }
});

/**
 * POST /api/admin/inventory/initialize
 * Initialize inventory for a product
 */
router.post('/initialize', 
  ...requireAdminWrite('inventory'),
  auditAdminAction('inventory_initialize', 'inventory'),
  async (req, res) => {
    try {
      const { productId, initialStock = 0, lowStockThreshold = 10 } = req.body;

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }

      const inventory = await initializeInventory(productId, initialStock, lowStockThreshold);

      res.status(201).json({
        success: true,
        data: inventory,
        message: 'Inventory initialized successfully'
      });
    } catch (error) {
      console.error('Error initializing inventory:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to initialize inventory'
      });
    }
  }
);

/**
 * POST /api/admin/inventory/restock
 * Add stock to a product
 */
router.post('/restock',
  ...requireAdminWrite('inventory'),
  auditAdminAction('inventory_restock', 'inventory'),
  async (req, res) => {
    try {
      const validatedData = restockSchema.parse(req.body);
      
      await recordStockMovement({
        ...validatedData,
        type: 'restock',
        adminUserId: req.user!.id,
        reason: validatedData.reason || 'Manual restock'
      });

      res.json({
        success: true,
        message: 'Stock added successfully'
      });
    } catch (error) {
      console.error('Error restocking:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to add stock'
      });
    }
  }
);

/**
 * POST /api/admin/inventory/bulk-restock
 * Add stock to multiple products
 */
router.post('/bulk-restock',
  ...requireAdminWrite('inventory'),
  auditAdminAction('inventory_bulk_restock', 'inventory'),
  async (req, res) => {
    try {
      const validatedData = bulkRestockSchema.parse(req.body);
      
      const restockData = validatedData.items.map(item => ({
        ...item,
        adminUserId: req.user!.id
      }));

      const results = await bulkRestock(restockData);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      res.json({
        success: true,
        data: results,
        message: `Bulk restock completed: ${successful} successful, ${failed} failed`
      });
    } catch (error) {
      console.error('Error bulk restocking:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to perform bulk restock'
      });
    }
  }
);

/**
 * PUT /api/admin/inventory/:productId
 * Update inventory settings for a product
 */
router.put('/:productId',
  ...requireAdminWrite('inventory'),
  auditAdminAction('inventory_update', 'inventory'),
  async (req, res) => {
    try {
      const { productId } = req.params;
      const validatedData = updateInventorySchema.parse(req.body);

      const updatedInventory = await updateInventory(productId, validatedData);

      res.json({
        success: true,
        data: updatedInventory,
        message: 'Inventory updated successfully'
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      
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
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update inventory'
      });
    }
  }
);

/**
 * POST /api/admin/inventory/movement
 * Record a stock movement
 */
router.post('/movement',
  ...requireAdminWrite('inventory'),
  auditAdminAction('stock_movement', 'inventory'),
  async (req, res) => {
    try {
      const validatedData = stockMovementSchema.parse(req.body);
      
      await recordStockMovement({
        ...validatedData,
        adminUserId: req.user!.id
      });

      res.json({
        success: true,
        message: 'Stock movement recorded successfully'
      });
    } catch (error) {
      console.error('Error recording stock movement:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to record stock movement'
      });
    }
  }
);

/**
 * POST /api/admin/inventory/reserve
 * Reserve stock for an order
 */
router.post('/reserve',
  ...requireAdminWrite('inventory'),
  auditAdminAction('stock_reserve', 'inventory'),
  async (req, res) => {
    try {
      const validatedData = reserveStockSchema.parse(req.body);
      
      const results = await reserveStock(validatedData.orderId, validatedData.items);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      res.json({
        success: true,
        data: results,
        message: `Stock reservation: ${successful} successful, ${failed} failed`
      });
    } catch (error) {
      console.error('Error reserving stock:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to reserve stock'
      });
    }
  }
);

/**
 * POST /api/admin/inventory/confirm-sale
 * Confirm stock sale (convert reserved to sold)
 */
router.post('/confirm-sale',
  ...requireAdminWrite('inventory'),
  auditAdminAction('stock_sale_confirm', 'inventory'),
  async (req, res) => {
    try {
      const validatedData = reserveStockSchema.parse(req.body);
      
      const results = await confirmStockSale(validatedData.orderId, validatedData.items);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      res.json({
        success: true,
        data: results,
        message: `Stock sale confirmation: ${successful} successful, ${failed} failed`
      });
    } catch (error) {
      console.error('Error confirming stock sale:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to confirm stock sale'
      });
    }
  }
);

export default router;