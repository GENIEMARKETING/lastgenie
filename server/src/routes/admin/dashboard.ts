import express from 'express';
import { requireAdminRead } from '../../middleware/adminAuth';
import { getOrderStats } from '../../services/order';
import { getInventoryStats } from '../../services/inventory';
import { getProductStats } from '../../services/product';
import { prisma } from '../../lib/prisma';

const router = express.Router();

/**
 * GET /api/admin/dashboard/stats
 * Get comprehensive dashboard statistics
 */
router.get('/stats', ...requireAdminRead('dashboard'), async (req, res) => {
  try {
    // Get all stats in parallel
    const [orderStats, inventoryStats, productStats, userStats, affiliateStats] = await Promise.all([
      getOrderStats(),
      getInventoryStats(),
      getProductStats(),
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
  } catch (error) {
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
router.get('/recent-activity', ...requireAdminRead('dashboard'), async (req, res) => {
  try {
    const { limit = '20' } = req.query;
    
    // Get recent activities from audit logs
    const recentActivities = await prisma.auditLog.findMany({
      take: parseInt(limit as string),
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
  } catch (error) {
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
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: { gte: today }
      }
    }),
    prisma.user.count({
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
    prisma.affiliate.count({ where: { status: 'active' } }),
    prisma.affiliateApplication.count({ where: { status: 'pending' } }),
    prisma.affiliate.aggregate({
      _sum: { totalEarnings: true }
    })
  ]);

  return {
    totalAffiliates,
    pendingApplications,
    totalCommissions: totalCommissions._sum.totalEarnings || 0
  };
}

function formatActivityDescription(action: string, entity: string, metadata: any): string {
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

export default router;