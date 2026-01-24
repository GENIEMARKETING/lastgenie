"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuth_1 = require("../../middleware/adminAuth");
const order_1 = require("../../services/order");
const inventory_1 = require("../../services/inventory");
const product_1 = require("../../services/product");
const prisma_1 = require("../../lib/prisma");
const router = express_1.default.Router();
/**
 * GET /api/admin/dashboard/stats
 * Get comprehensive dashboard statistics
 */
router.get('/stats', ...(0, adminAuth_1.requireAdminRead)('dashboard'), async (req, res) => {
    try {
        // Get all stats in parallel
        const [orderStats, inventoryStats, productStats, userStats, affiliateStats] = await Promise.all([
            (0, order_1.getOrderStats)(),
            (0, inventory_1.getInventoryStats)(),
            (0, product_1.getProductStats)(),
            getUserStats(),
            getAffiliateStats()
        ]);
        const dashboardData = {
            orders: orderStats,
            inventory: inventoryStats,
            products: productStats,
            users: userStats,
            affiliates: affiliateStats,
            lastUpdated: new Date().toISOString()
        };
        res.json({
            success: true,
            data: dashboardData
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics'
        });
    }
});
/**
 * GET /api/admin/dashboard/recent-activity
 * Get recent activity across the platform
 */
router.get('/recent-activity', ...(0, adminAuth_1.requireAdminRead)('dashboard'), async (req, res) => {
    try {
        const { limit = '20' } = req.query;
        // Get recent activities from audit logs
        const recentActivities = await prisma_1.prisma.auditLog.findMany({
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        const formattedActivities = recentActivities.map(activity => ({
            id: activity.id,
            type: activity.action,
            description: formatActivityDescription(activity.action, activity.entity, activity.metadata),
            timestamp: activity.createdAt.toISOString(),
            user: activity.user ? {
                email: activity.user.email,
                name: activity.user.firstName && activity.user.lastName
                    ? `${activity.user.firstName} ${activity.user.lastName}`
                    : undefined
            } : undefined
        }));
        res.json({
            success: true,
            data: formattedActivities
        });
    }
    catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent activity'
        });
    }
});
// Helper functions
async function getUserStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [totalUsers, todayUsers, monthlyUsers] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.user.count({
            where: {
                createdAt: { gte: today }
            }
        }),
        prisma_1.prisma.user.count({
            where: {
                createdAt: { gte: thirtyDaysAgo }
            }
        })
    ]);
    return {
        totalUsers,
        todayUsers,
        monthlyUsers,
        growth: totalUsers > 0 ? ((monthlyUsers / totalUsers) * 100) : 0
    };
}
async function getAffiliateStats() {
    const [totalAffiliates, pendingApplications, totalCommissions] = await Promise.all([
        prisma_1.prisma.affiliate.count({ where: { status: 'active' } }),
        prisma_1.prisma.affiliateApplication.count({ where: { status: 'pending' } }),
        prisma_1.prisma.affiliate.aggregate({
            _sum: { totalEarnings: true }
        })
    ]);
    return {
        totalAffiliates,
        pendingApplications,
        totalCommissions: totalCommissions._sum.totalEarnings || 0
    };
}
function formatActivityDescription(action, entity, metadata) {
    switch (action) {
        case 'product_create':
            return `Created new product`;
        case 'product_update':
            return `Updated product details`;
        case 'inventory_restock':
            return `Restocked inventory`;
        case 'order_status_update':
            return `Updated order status`;
        case 'user_promoted_via_script':
            return `User promoted to admin`;
        default:
            return `${action.replace(/_/g, ' ')} on ${entity}`;
    }
}
exports.default = router;
