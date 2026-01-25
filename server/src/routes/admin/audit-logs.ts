import express from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../../middleware/auth';

const router = express.Router();

// Validation schemas
const auditLogFiltersSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(50)
});

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering (admin only)
 */
router.get('/', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const validatedQuery = auditLogFiltersSchema.parse(req.query);
    const { userId, action, entity, entityId, startDate, endDate, page, limit } = validatedQuery;
    
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (action) {
      where.action = {
        contains: action,
        mode: 'insensitive'
      };
    }
    
    if (entity) {
      where.entity = {
        contains: entity,
        mode: 'insensitive'
      };
    }
    
    if (entityId) {
      where.entityId = entityId;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    
    const offset = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.auditLog.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

/**
 * GET /api/admin/audit-logs/stats
 * Get audit log statistics (admin only)
 */
router.get('/stats', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      totalLogs,
      logsLast24Hours,
      logsLast7Days,
      logsLast30Days,
      topActions,
      topEntities,
      topUsers
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: last24Hours
          }
        }
      }),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: last7Days
          }
        }
      }),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: last30Days
          }
        }
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: {
          action: true
        },
        orderBy: {
          _count: {
            action: 'desc'
          }
        },
        take: 10
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        _count: {
          entity: true
        },
        orderBy: {
          _count: {
            entity: 'desc'
          }
        },
        take: 10
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        where: {
          userId: {
            not: null
          }
        },
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 10
      })
    ]);
    
    // Get user details for top users
    const userIds = topUsers.map(u => u.userId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    const topUsersWithDetails = topUsers.map(stat => {
      const user = users.find(u => u.id === stat.userId);
      return {
        userId: stat.userId,
        count: stat._count.userId,
        user: user || null
      };
    });
    
    res.json({
      success: true,
      data: {
        totalLogs,
        logsLast24Hours,
        logsLast7Days,
        logsLast30Days,
        topActions: topActions.map(stat => ({
          action: stat.action,
          count: stat._count.action
        })),
        topEntities: topEntities.map(stat => ({
          entity: stat.entity,
          count: stat._count.entity
        })),
        topUsers: topUsersWithDetails
      }
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log statistics'
    });
  }
});

/**
 * GET /api/admin/audit-logs/:id
 * Get specific audit log entry (admin only)
 */
router.get('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const log = await prisma.auditLog.findUnique({
      where: { id: id as string },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log entry not found'
      });
    }
    
    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log entry'
    });
  }
});

export default router;