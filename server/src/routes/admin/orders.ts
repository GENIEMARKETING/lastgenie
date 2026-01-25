import express from 'express';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import {
  requireAdminRead,
  requireAdminWrite,
  auditAdminAction
} from '../../middleware/adminAuth';
import {
  getAllOrders,
  getOrderById,
  getOrderByNumber,
  updateOrder,
  bulkUpdateOrderStatus,
  getOrderStats,
  getRecentOrders,
  getOrdersNeedingAttention,
  getRevenueData,
  cancelOrder,
  getOrdersByUser
} from '../../services/order';

const router = express.Router();

// Validation schemas
const updateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  shippingCarrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingAmount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional()
});

const bulkUpdateSchema = z.object({
  orderIds: z.array(z.string().cuid()),
  status: z.nativeEnum(OrderStatus),
  trackingInfo: z.object({
    carrier: z.string().optional(),
    trackingNumber: z.string().optional()
  }).optional()
});

const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required')
});

/**
 * GET /api/admin/orders
 * Get all orders with optional filters
 */
router.get('/', ...requireAdminRead('orders'), async (req, res) => {
  try {
    const {
      status,
      userId,
      dateFrom,
      dateTo,
      search,
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    if (status) filters.status = status as OrderStatus;
    if (userId) filters.userId = userId as string;
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);
    if (search) filters.search = search as string;

    const orders = await getAllOrders(filters);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * GET /api/admin/orders/stats
 * Get order statistics
 */
router.get('/stats', ...requireAdminRead('orders'), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const filters: { dateFrom?: Date; dateTo?: Date } = {};
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);

    const stats = await getOrderStats(filters.dateFrom, filters.dateTo);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order statistics'
    });
  }
});

/**
 * GET /api/admin/orders/recent
 * Get recent orders
 */
router.get('/recent', ...requireAdminRead('orders'), async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const orders = await getRecentOrders(parseInt(limit as string));

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent orders'
    });
  }
});

/**
 * GET /api/admin/orders/attention
 * Get orders that need attention
 */
router.get('/attention', ...requireAdminRead('orders'), async (req, res) => {
  try {
    const orders = await getOrdersNeedingAttention();

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders needing attention:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders needing attention'
    });
  }
});

/**
 * GET /api/admin/orders/revenue-data
 * Get revenue data for charts
 */
router.get('/revenue-data', ...requireAdminRead('orders'), async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const revenueData = await getRevenueData(parseInt(days as string));

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue data'
    });
  }
});

/**
 * GET /api/admin/orders/by-user/:userId
 * Get orders by user ID
 */
router.get('/by-user/:userId', ...requireAdminRead('orders'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const orders = await getOrdersByUser(
      userId as string, 
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user orders'
    });
  }
});

/**
 * GET /api/admin/orders/number/:orderNumber
 * Get order by order number
 */
router.get('/number/:orderNumber', ...requireAdminRead('orders'), async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await getOrderByNumber(orderNumber as string);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order by number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

/**
 * GET /api/admin/orders/:id
 * Get a single order by ID
 */
router.get('/:id', ...requireAdminRead('orders'), async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id as string);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Parse product images if they exist
    const orderWithImages = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          images: item.product.images ? JSON.parse(item.product.images as string) : []
        }
      }))
    };

    res.json({
      success: true,
      data: orderWithImages
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

/**
 * PUT /api/admin/orders/:id
 * Update an order
 */
router.put('/:id',
  ...requireAdminWrite('orders'),
  auditAdminAction('order_update', 'order'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateOrderSchema.parse(req.body);

      const order = await updateOrder(id as string, validatedData, req.user!.id);

      res.json({
        success: true,
        data: order,
        message: 'Order updated successfully'
      });
    } catch (error) {
      console.error('Error updating order:', error);

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
          error: 'Order not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update order'
      });
    }
  }
);

/**
 * PUT /api/admin/orders/:id/status
 * Update order status
 */
router.put('/:id/status',
  ...requireAdminWrite('orders'),
  auditAdminAction('order_status_update', 'order'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, shippingCarrier, trackingNumber } = req.body;

      if (!status || !Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status is required'
        });
      }

      const updateData: any = { status };
      if (shippingCarrier) updateData.shippingCarrier = shippingCarrier;
      if (trackingNumber) updateData.trackingNumber = trackingNumber;

      const order = await updateOrder(id as string, updateData, req.user!.id);

      res.json({
        success: true,
        data: order,
        message: `Order status updated to ${status}`
      });
    } catch (error) {
      console.error('Error updating order status:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }
  }
);

/**
 * POST /api/admin/orders/bulk-update-status
 * Bulk update order statuses
 */
router.post('/bulk-update-status',
  ...requireAdminWrite('orders'),
  auditAdminAction('order_bulk_status_update', 'order'),
  async (req, res) => {
    try {
      const validatedData = bulkUpdateSchema.parse(req.body);

      const results = await bulkUpdateOrderStatus(
        validatedData.orderIds,
        validatedData.status,
        req.user!.id,
        validatedData.trackingInfo
      );

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      res.json({
        success: true,
        data: results,
        message: `Bulk status update: ${successful} successful, ${failed} failed`
      });
    } catch (error) {
      console.error('Error bulk updating order status:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to bulk update order statuses'
      });
    }
  }
);

/**
 * POST /api/admin/orders/:id/cancel
 * Cancel an order
 */
router.post('/:id/cancel',
  ...requireAdminWrite('orders'),
  auditAdminAction('order_cancel', 'order'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = cancelOrderSchema.parse(req.body);

      const order = await cancelOrder(id as string, validatedData.reason, req.user!.id);

      res.json({
        success: true,
        data: order,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling order:', error);

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
          error: 'Order not found'
        });
      }

      if (error instanceof Error && (
        error.message.includes('Cannot cancel') || 
        error.message.includes('already cancelled')
      )) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to cancel order'
      });
    }
  }
);

/**
 * POST /api/admin/orders/:id/add-tracking
 * Add tracking information to an order
 */
router.post('/:id/add-tracking',
  ...requireAdminWrite('orders'),
  auditAdminAction('order_add_tracking', 'order'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { shippingCarrier, trackingNumber } = req.body;

      if (!shippingCarrier || !trackingNumber) {
        return res.status(400).json({
          success: false,
          error: 'Shipping carrier and tracking number are required'
        });
      }

      const order = await updateOrder(id as string, {
        shippingCarrier,
        trackingNumber,
        status: 'shipped' // Automatically mark as shipped when tracking is added
      }, req.user!.id);

      res.json({
        success: true,
        data: order,
        message: 'Tracking information added successfully'
      });
    } catch (error) {
      console.error('Error adding tracking information:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to add tracking information'
      });
    }
  }
);

export default router;