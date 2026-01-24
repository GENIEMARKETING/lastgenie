"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuth_1 = require("../../middleware/adminAuth");
const prisma_1 = require("../../lib/prisma");
const router = express_1.default.Router();
/**
 * GET /api/admin/analytics/overview
 * Get analytics overview data
 */
router.get('/overview', ...(0, adminAuth_1.requireAdminRead)('analytics'), async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        // Get comprehensive analytics data
        const [totalRevenue, periodRevenue, totalOrders, periodOrders, totalUsers, periodUsers, conversionRate, averageOrderValue, topProducts, revenueByDay, ordersByStatus, userGrowth] = await Promise.all([
            getTotalRevenue(),
            getRevenueForPeriod(startDate),
            getTotalOrders(),
            getOrdersForPeriod(startDate),
            getTotalUsers(),
            getUsersForPeriod(startDate),
            getConversionRate(startDate),
            getAverageOrderValue(startDate),
            getTopProducts(startDate, 5),
            getRevenueByDay(startDate),
            getOrdersByStatus(startDate),
            getUserGrowthData(startDate)
        ]);
        const analytics = {
            overview: {
                totalRevenue,
                periodRevenue,
                totalOrders,
                periodOrders,
                totalUsers,
                periodUsers,
                conversionRate,
                averageOrderValue,
                period: days
            },
            charts: {
                revenueByDay,
                ordersByStatus,
                userGrowth,
                topProducts
            },
            lastUpdated: new Date().toISOString()
        };
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics data'
        });
    }
});
/**
 * GET /api/admin/analytics/sales
 * Get detailed sales analytics
 */
router.get('/sales', ...(0, adminAuth_1.requireAdminRead)('analytics'), async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const [salesByProduct, salesByCategory, salesTrends, refundData] = await Promise.all([
            getSalesByProduct(startDate),
            getSalesByCategory(startDate),
            getSalesTrends(startDate),
            getRefundData(startDate)
        ]);
        res.json({
            success: true,
            data: {
                salesByProduct,
                salesByCategory,
                salesTrends,
                refundData,
                period: days
            }
        });
    }
    catch (error) {
        console.error('Error fetching sales analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sales analytics'
        });
    }
});
/**
 * GET /api/admin/analytics/customers
 * Get customer analytics
 */
router.get('/customers', ...(0, adminAuth_1.requireAdminRead)('analytics'), async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const [customerAcquisition, customerRetention, customerLifetimeValue, customerSegments] = await Promise.all([
            getCustomerAcquisition(startDate),
            getCustomerRetention(startDate),
            getCustomerLifetimeValue(),
            getCustomerSegments()
        ]);
        res.json({
            success: true,
            data: {
                customerAcquisition,
                customerRetention,
                customerLifetimeValue,
                customerSegments,
                period: days
            }
        });
    }
    catch (error) {
        console.error('Error fetching customer analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer analytics'
        });
    }
});
// Helper functions
async function getTotalRevenue() {
    const result = await prisma_1.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['paid', 'shipped', 'delivered'] } }
    });
    return result._sum.totalAmount || 0;
}
async function getRevenueForPeriod(startDate) {
    const result = await prisma_1.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
            status: { in: ['paid', 'shipped', 'delivered'] },
            createdAt: { gte: startDate }
        }
    });
    return result._sum.totalAmount || 0;
}
async function getTotalOrders() {
    return prisma_1.prisma.order.count();
}
async function getOrdersForPeriod(startDate) {
    return prisma_1.prisma.order.count({
        where: { createdAt: { gte: startDate } }
    });
}
async function getTotalUsers() {
    return prisma_1.prisma.user.count({
        where: { role: 'customer' }
    });
}
async function getUsersForPeriod(startDate) {
    return prisma_1.prisma.user.count({
        where: {
            role: 'customer',
            createdAt: { gte: startDate }
        }
    });
}
async function getConversionRate(startDate) {
    const [visitors, orders] = await Promise.all([
        // For now, we'll use users as a proxy for visitors
        getUsersForPeriod(startDate),
        getOrdersForPeriod(startDate)
    ]);
    return visitors > 0 ? (orders / visitors) * 100 : 0;
}
async function getAverageOrderValue(startDate) {
    const result = await prisma_1.prisma.order.aggregate({
        _avg: { totalAmount: true },
        where: {
            status: { in: ['paid', 'shipped', 'delivered'] },
            createdAt: { gte: startDate }
        }
    });
    return result._avg.totalAmount || 0;
}
async function getTopProducts(startDate, limit) {
    const topProducts = await prisma_1.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        _count: { productId: true },
        where: {
            order: {
                createdAt: { gte: startDate },
                status: { in: ['paid', 'shipped', 'delivered'] }
            }
        },
        orderBy: { _sum: { quantity: 'desc' } },
        take: limit
    });
    // Get product details
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma_1.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true, price: true }
    });
    return topProducts.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
            productId: item.productId,
            name: product?.name || 'Unknown Product',
            sku: product?.sku || '',
            price: product?.price || 0,
            totalSold: item._sum.quantity || 0,
            orderCount: item._count.productId
        };
    });
}
async function getRevenueByDay(startDate) {
    const orders = await prisma_1.prisma.order.findMany({
        where: {
            createdAt: { gte: startDate },
            status: { in: ['paid', 'shipped', 'delivered'] }
        },
        select: {
            createdAt: true,
            totalAmount: true
        }
    });
    // Group by day
    const revenueByDay = orders.reduce((acc, order) => {
        const day = order.createdAt.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + order.totalAmount;
        return acc;
    }, {});
    return Object.entries(revenueByDay).map(([date, revenue]) => ({
        date,
        revenue
    }));
}
async function getOrdersByStatus(startDate) {
    const ordersByStatus = await prisma_1.prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { createdAt: { gte: startDate } }
    });
    return ordersByStatus.map(item => ({
        status: item.status,
        count: item._count.status
    }));
}
async function getUserGrowthData(startDate) {
    const users = await prisma_1.prisma.user.findMany({
        where: {
            role: 'customer',
            createdAt: { gte: startDate }
        },
        select: { createdAt: true }
    });
    // Group by day
    const usersByDay = users.reduce((acc, user) => {
        const day = user.createdAt.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {});
    return Object.entries(usersByDay).map(([date, count]) => ({
        date,
        newUsers: count
    }));
}
async function getSalesByProduct(startDate) {
    return getTopProducts(startDate, 10);
}
async function getSalesByCategory(startDate) {
    const salesByCategory = await prisma_1.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: {
            order: {
                createdAt: { gte: startDate },
                status: { in: ['paid', 'shipped', 'delivered'] }
            }
        }
    });
    // Get product categories
    const productIds = salesByCategory.map(s => s.productId);
    const products = await prisma_1.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, category: true }
    });
    // Group by category
    const categoryTotals = salesByCategory.reduce((acc, sale) => {
        const product = products.find(p => p.id === sale.productId);
        if (product) {
            acc[product.category] = (acc[product.category] || 0) + (sale._sum.quantity || 0);
        }
        return acc;
    }, {});
    return Object.entries(categoryTotals).map(([category, total]) => ({
        category,
        totalSold: total
    }));
}
async function getSalesTrends(startDate) {
    return getRevenueByDay(startDate);
}
async function getRefundData(startDate) {
    const refundedOrders = await prisma_1.prisma.order.findMany({
        where: {
            status: 'cancelled',
            createdAt: { gte: startDate }
        },
        select: {
            totalAmount: true,
            createdAt: true
        }
    });
    const totalRefunded = refundedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const refundCount = refundedOrders.length;
    return {
        totalRefunded,
        refundCount,
        refundsByDay: refundedOrders.reduce((acc, order) => {
            const day = order.createdAt.toISOString().split('T')[0];
            acc[day] = (acc[day] || 0) + order.totalAmount;
            return acc;
        }, {})
    };
}
async function getCustomerAcquisition(startDate) {
    return getUserGrowthData(startDate);
}
async function getCustomerRetention(startDate) {
    // Simple retention calculation - customers who made more than one order
    const repeatCustomers = await prisma_1.prisma.user.findMany({
        where: {
            role: 'customer',
            orders: {
                some: {
                    createdAt: { gte: startDate }
                }
            }
        },
        include: {
            _count: {
                select: { orders: true }
            }
        }
    });
    const totalCustomers = repeatCustomers.length;
    const returningCustomers = repeatCustomers.filter(customer => customer._count.orders > 1).length;
    return {
        totalCustomers,
        returningCustomers,
        retentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0
    };
}
async function getCustomerLifetimeValue() {
    const customers = await prisma_1.prisma.user.findMany({
        where: { role: 'customer' },
        include: {
            orders: {
                where: { status: { in: ['paid', 'shipped', 'delivered'] } },
                select: { totalAmount: true }
            }
        }
    });
    const lifetimeValues = customers.map(customer => {
        const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
        return totalSpent;
    });
    const averageLTV = lifetimeValues.length > 0
        ? lifetimeValues.reduce((sum, ltv) => sum + ltv, 0) / lifetimeValues.length
        : 0;
    return {
        averageLTV,
        totalCustomers: customers.length,
        distribution: {
            low: lifetimeValues.filter(ltv => ltv < 50).length,
            medium: lifetimeValues.filter(ltv => ltv >= 50 && ltv < 200).length,
            high: lifetimeValues.filter(ltv => ltv >= 200).length
        }
    };
}
async function getCustomerSegments() {
    const segments = await prisma_1.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
        where: { role: 'customer' }
    });
    return segments.map(segment => ({
        segment: segment.role,
        count: segment._count.role
    }));
}
exports.default = router;
