"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const adminAuth_1 = require("../../middleware/adminAuth");
const order_1 = require("../../services/order");
const router = express_1.default.Router();
// Validation schemas
const updateOrderSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.OrderStatus).optional(),
    shippingCarrier: zod_1.z.string().optional(),
    trackingNumber: zod_1.z.string().optional(),
    shippingAmount: zod_1.z.number().min(0).optional(),
    taxAmount: zod_1.z.number().min(0).optional()
});
const bulkUpdateSchema = zod_1.z.object({
    orderIds: zod_1.z.array(zod_1.z.string().cuid()),
    status: zod_1.z.nativeEnum(client_1.OrderStatus),
    trackingInfo: zod_1.z.object({
        carrier: zod_1.z.string().optional(),
        trackingNumber: zod_1.z.string().optional()
    }).optional()
});
const cancelOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Cancellation reason is required')
});
/**
 * GET /api/admin/orders
 * Get all orders with optional filters
 */
router.get('/', ...(0, adminAuth_1.requireAdminRead)('orders'), async (req, res) => {
    try {
        const { status, userId, dateFrom, dateTo, search, limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const filters = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            sortBy: sortBy,
            sortOrder: sortOrder
        };
        if (status)
            filters.status = status;
        if (userId)
            filters.userId = userId;
        if (dateFrom)
            filters.dateFrom = new Date(dateFrom);
        if (dateTo)
            filters.dateTo = new Date(dateTo);
        if (search)
            filters.search = search;
        const orders = await (0, order_1.getAllOrders)(filters);
        res.json({
            success: true,
            data: orders
        });
    }
    catch (error) {
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
router.get('/stats', ...(0, adminAuth_1.requireAdminRead)('orders'), async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        const filters = {};
        if (dateFrom)
            filters.dateFrom = new Date(dateFrom);
        if (dateTo)
            filters.dateTo = new Date(dateTo);
        const stats = await (0, order_1.getOrderStats)(filters.dateFrom, filters.dateTo);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
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
router.get('/recent', ...(0, adminAuth_1.requireAdminRead)('orders'), async (req, res) => {
    try {
        const { limit = '10' } = req.query;
        const orders = await (0, order_1.getRecentOrders)(parseInt(limit));
        res.json({
            success: true,
            data: orders
        });
    }
    catch (error) {
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
router.get('/attention', ...(0, adminAuth_1.requireAdminRead)('orders'), async (req, res) => {
    try {
        const orders = await (0, order_1.getOrdersNeedingAttention)();
        res.json({
            success: true,
            data: orders
        });
    }
    catch (error) {
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
router.get('/revenue-data', ...(0, adminAuth_1.requireAdminRead)('orders'), async (req, res) => {
    try {
        const { days = '30' } = req.query;
        const revenueData = await (0, order_1.getRevenueData)(parseInt(days));
        res.json({
            success: true,
            data: revenueData
        });
    }
    catch (error) {
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
router.get('/by-user/:userId', ...(0, adminAuth_1.requireAdminRead)('orders'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit } = req.query;
        const orders = await (0, order_1.getOrdersByUser)(userId, limit ? parseInt(limit) : undefined);
        res.json({
            success: true,
            data: orders
        });
    }
    catch (error) {
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
router.get('/number/:orderNumber', ...(0, adminAuth_1.requireAdminRead)('orders'), async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const order = await (0, order_1.getOrderByNumber)(orderNumber);
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
    }
    catch (error) {
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
router.get('/:id', ...(0, adminAuth_1.requireAdminRead)('orders'), async (req, res) => {
    try {
        const { id } = req.params;
        const order = await (0, order_1.getOrderById)(id);
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
                    images: item.product.images ? JSON.parse(item.product.images) : []
                }
            }))
        };
        res.json({
            success: true,
            data: orderWithImages
        });
    }
    catch (error) {
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
router.put('/:id', ...(0, adminAuth_1.requireAdminWrite)('orders'), (0, adminAuth_1.auditAdminAction)('order_update', 'order'), async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateOrderSchema.parse(req.body);
        const order = await (0, order_1.updateOrder)(id, validatedData, req.user.id);
        res.json({
            success: true,
            data: order,
            message: 'Order updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating order:', error);
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
                error: 'Order not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update order'
        });
    }
});
/**
 * PUT /api/admin/orders/:id/status
 * Update order status
 */
router.put('/:id/status', ...(0, adminAuth_1.requireAdminWrite)('orders'), (0, adminAuth_1.auditAdminAction)('order_status_update', 'order'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, shippingCarrier, trackingNumber } = req.body;
        if (!status || !Object.values(client_1.OrderStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Valid status is required'
            });
        }
        const updateData = { status };
        if (shippingCarrier)
            updateData.shippingCarrier = shippingCarrier;
        if (trackingNumber)
            updateData.trackingNumber = trackingNumber;
        const order = await (0, order_1.updateOrder)(id, updateData, req.user.id);
        res.json({
            success: true,
            data: order,
            message: `Order status updated to ${status}`
        });
    }
    catch (error) {
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
});
/**
 * POST /api/admin/orders/bulk-update-status
 * Bulk update order statuses
 */
router.post('/bulk-update-status', ...(0, adminAuth_1.requireAdminWrite)('orders'), (0, adminAuth_1.auditAdminAction)('order_bulk_status_update', 'order'), async (req, res) => {
    try {
        const validatedData = bulkUpdateSchema.parse(req.body);
        const results = await (0, order_1.bulkUpdateOrderStatus)(validatedData.orderIds, validatedData.status, req.user.id, validatedData.trackingInfo);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        res.json({
            success: true,
            data: results,
            message: `Bulk status update: ${successful} successful, ${failed} failed`
        });
    }
    catch (error) {
        console.error('Error bulk updating order status:', error);
        if (error instanceof zod_1.z.ZodError) {
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
});
/**
 * POST /api/admin/orders/:id/cancel
 * Cancel an order
 */
router.post('/:id/cancel', ...(0, adminAuth_1.requireAdminWrite)('orders'), (0, adminAuth_1.auditAdminAction)('order_cancel', 'order'), async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = cancelOrderSchema.parse(req.body);
        const order = await (0, order_1.cancelOrder)(id, validatedData.reason, req.user.id);
        res.json({
            success: true,
            data: order,
            message: 'Order cancelled successfully'
        });
    }
    catch (error) {
        console.error('Error cancelling order:', error);
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
                error: 'Order not found'
            });
        }
        if (error instanceof Error && (error.message.includes('Cannot cancel') ||
            error.message.includes('already cancelled'))) {
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
});
/**
 * POST /api/admin/orders/:id/add-tracking
 * Add tracking information to an order
 */
router.post('/:id/add-tracking', ...(0, adminAuth_1.requireAdminWrite)('orders'), (0, adminAuth_1.auditAdminAction)('order_add_tracking', 'order'), async (req, res) => {
    try {
        const { id } = req.params;
        const { shippingCarrier, trackingNumber } = req.body;
        if (!shippingCarrier || !trackingNumber) {
            return res.status(400).json({
                success: false,
                error: 'Shipping carrier and tracking number are required'
            });
        }
        const order = await (0, order_1.updateOrder)(id, {
            shippingCarrier,
            trackingNumber,
            status: 'shipped' // Automatically mark as shipped when tracking is added
        }, req.user.id);
        res.json({
            success: true,
            data: order,
            message: 'Tracking information added successfully'
        });
    }
    catch (error) {
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
});
exports.default = router;
