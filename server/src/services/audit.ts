import { Request } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

interface AuditLogData {
  action: string;
  entity: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

class AuditService {
  /**
   * Log an audit event
   */
  async log(
    req: AuthRequest | Request,
    data: AuditLogData
  ): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      await prisma.auditLog.create({
        data: {
          userId: user?.id,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          oldValues: data.oldValues ? JSON.parse(JSON.stringify(data.oldValues)) : null,
          newValues: data.newValues ? JSON.parse(JSON.stringify(data.newValues)) : null,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
          ipAddress,
          userAgent
        }
      });

      console.log(`[AUDIT] ${data.action} on ${data.entity}:${data.entityId} by ${user?.email || 'anonymous'}`);
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log affiliate application review
   */
  async logAffiliateReview(
    req: AuthRequest,
    applicationId: string,
    action: 'approved' | 'rejected',
    oldData: any,
    newData: any,
    metadata?: any
  ): Promise<void> {
    await this.log(req, {
      action: `affiliate_application_${action}`,
      entity: 'affiliate_application',
      entityId: applicationId,
      oldValues: oldData,
      newValues: newData,
      metadata
    });
  }

  /**
   * Log affiliate status change
   */
  async logAffiliateStatusChange(
    req: AuthRequest,
    affiliateId: string,
    oldStatus: string,
    newStatus: string,
    metadata?: any
  ): Promise<void> {
    await this.log(req, {
      action: 'affiliate_status_changed',
      entity: 'affiliate',
      entityId: affiliateId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      metadata
    });
  }

  /**
   * Log payout creation
   */
  async logPayoutCreated(
    req: AuthRequest,
    payoutId: string,
    payoutData: any,
    metadata?: any
  ): Promise<void> {
    await this.log(req, {
      action: 'payout_created',
      entity: 'affiliate_payout',
      entityId: payoutId,
      newValues: payoutData,
      metadata
    });
  }

  /**
   * Log payout status change
   */
  async logPayoutStatusChange(
    req: AuthRequest,
    payoutId: string,
    oldStatus: string,
    newStatus: string,
    metadata?: any
  ): Promise<void> {
    await this.log(req, {
      action: 'payout_status_changed',
      entity: 'affiliate_payout',
      entityId: payoutId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      metadata
    });
  }

  /**
   * Log bulk affiliate action
   */
  async logBulkAffiliateAction(
    req: AuthRequest,
    action: string,
    affiliateIds: string[],
    metadata?: any
  ): Promise<void> {
    await this.log(req, {
      action: `bulk_affiliate_${action}`,
      entity: 'affiliate',
      entityId: affiliateIds.join(','),
      metadata: {
        ...metadata,
        affiliateCount: affiliateIds.length
      }
    });
  }

  /**
   * Log admin login
   */
  async logAdminLogin(
    req: Request,
    userId: string,
    email: string,
    metadata?: any
  ): Promise<void> {
    await this.log(req, {
      action: 'admin_login',
      entity: 'user',
      entityId: userId,
      metadata: {
        ...metadata,
        email
      }
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    req: Request,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any
  ): Promise<void> {
    await this.log(req, {
      action: `security_${eventType}`,
      entity: 'security',
      entityId: `${eventType}_${Date.now()}`,
      metadata: {
        severity,
        details
      }
    });
  }

  /**
   * Get audit logs with pagination
   */
  async getLogs(
    filters: {
      userId?: string;
      action?: string;
      entity?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.entity) where.entity = filters.entity;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, totalCount] = await Promise.all([
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
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }
}

export default new AuditService();