"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
// Validation schemas
const auditLogFiltersSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    action: zod_1.z.string().optional(),
    entity: zod_1.z.string().optional(),
    entityId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('50')
});
/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering (admin only)
 */
router.get('/', auth_1.authenticate, (0, auth_1.requireRole)(['admin', 'super_admin']), async (req, res) => {
    try {
        const validatedQuery = auditLogFiltersSchema.parse(req.query);
        const { userId, action, entity, entityId, startDate, endDate, page, limit } = validatedQuery;
        const where = {};
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
            prisma_1.prisma.auditLog.findMany({
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
            prisma_1.prisma.auditLog.count({ where })
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
    }
    catch (error) {
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
router.get('/stats', auth_1.authenticate, (0, auth_1.requireRole)(['admin', 'super_admin']), async (req, res) => {
    try {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [totalLogs, logsLast24Hours, logsLast7Days, logsLast30Days, topActions, topEntities, topUsers] = await Promise.all([
            prisma_1.prisma.auditLog.count(),
            prisma_1.prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: last24Hours
                    }
                }
            }),
            prisma_1.prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: last7Days
                    }
                }
            }),
            prisma_1.prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: last30Days
                    }
                }
            }),
            prisma_1.prisma.auditLog.groupBy({
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
            prisma_1.prisma.auditLog.groupBy({
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
            prisma_1.prisma.auditLog.groupBy({
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
        const userIds = topUsers.map(u => u.userId).filter(Boolean);
        const users = await prisma_1.prisma.user.findMany({
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
    }
    catch (error) {
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
router.get('/:id', auth_1.authenticate, (0, auth_1.requireRole)(['admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const log = await prisma_1.prisma.auditLog.findUnique({
            where: { id },
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
    }
    catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit log entry'
        });
    }
});
exports.default = router;
