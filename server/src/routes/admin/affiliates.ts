import express from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';
import { createUserRateLimit } from '../../middleware/rate-limit';
import { sanitizeInput, sanitizeSearchParams } from '../../middleware/security';
import stripeService from '../../services/stripe';
import auditService from '../../services/audit';
import cacheService, { CacheKeys } from '../../services/cache';

const router = express.Router();

// Apply security middleware to all admin routes
router.use(sanitizeInput);
router.use(sanitizeSearchParams);

// Rate limiting for admin operations (more lenient than public endpoints)
const adminRateLimit = createUserRateLimit(
  60 * 1000, // 1 minute window
  60, // 60 requests per minute per admin user
  'Too many admin requests, please slow down.'
);
router.use(adminRateLimit);

// Apply admin authentication to all routes
router.use(authenticate);
router.use(requireAdmin);

// Validation schemas
const reviewApplicationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  adminNotes: z.string().optional(),
  commissionRate: z.number().min(0).max(1).optional(), // Only for approval
});

const updateAffiliateSchema = z.object({
  status: z.enum(['active', 'suspended', 'inactive']).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  payoutThreshold: z.number().min(0).optional(),
});

const createPayoutSchema = z.object({
  affiliateIds: z.array(z.string()),
  amount: z.number().min(0).optional(), // If not provided, use pending earnings
  method: z.enum(['stripe_connect', 'manual']).default('stripe_connect'),
});

const updatePayoutSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  failureReason: z.string().optional(),
});

/**
 * GET /api/admin/affiliates/applications
 * Get all affiliate applications with pagination
 */
router.get('/applications', async (req: AuthRequest, res) => {
  try {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      where.status = status;
    }

    const [applications, totalCount] = await Promise.all([
      prisma.affiliateApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.affiliateApplication.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
});

/**
 * POST /api/admin/affiliates/applications/:id/review
 * Approve or reject affiliate application
 */
router.post('/applications/:id/review', async (req: AuthRequest, res) => {
  try {

    const { id } = req.params;
    const validatedData = reviewApplicationSchema.parse(req.body);

    // Find the application
    const application = await prisma.affiliateApplication.findUnique({
      where: { id: id as string },
      include: {
        user: true
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Application has already been reviewed'
      });
    }

    if (validatedData.action === 'approve') {
      // Check if user already has an affiliate record
      const existingAffiliate = await prisma.affiliate.findUnique({
        where: { userId: application.userId }
      });

      if (existingAffiliate) {
        return res.status(400).json({
          success: false,
          error: 'User is already an affiliate'
        });
      }

      // Generate unique referral code
      const generateReferralCode = () => {
        const userId = application.userId.slice(-4).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `GENIE${userId}${random}`;
      };

      let referralCode = generateReferralCode();
      
      // Ensure referral code is unique
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.affiliate.findUnique({
          where: { referralCode }
        });
        if (!existing) break;
        referralCode = generateReferralCode();
        attempts++;
      }

      if (attempts >= 10) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate unique referral code'
        });
      }

      // Create affiliate record and update application in transaction
      const [newAffiliate, updatedApplication] = await prisma.$transaction([
        prisma.affiliate.create({
          data: {
            userId: application.userId,
            referralCode,
            commissionRate: validatedData.commissionRate || 0.10,
            status: 'active'
          }
        }),
        prisma.affiliateApplication.update({
          where: { id: id as string },
          data: {
            status: 'approved',
            adminNotes: validatedData.adminNotes,
            reviewedBy: req.user!.id,
            reviewedAt: new Date()
          }
        })
      ]);

      // Log audit event
      await auditService.logAffiliateReview(
        req,
        id as string,
        'approved',
        { status: 'pending' },
        { status: 'approved', referralCode },
        { commissionRate: validatedData.commissionRate || 0.10 }
      );

      // Invalidate relevant caches
      cacheService.invalidatePattern('affiliate:.*');

      res.json({
        success: true,
        message: 'Application approved successfully',
        data: {
          referralCode
        }
      });
    } else {
      // Reject application
      await prisma.affiliateApplication.update({
        where: { id: id as string },
        data: {
          status: 'rejected',
          adminNotes: validatedData.adminNotes,
          reviewedBy: req.user!.id,
          reviewedAt: new Date()
        }
      });

      // Log audit event
      await auditService.logAffiliateReview(
        req,
        id as string,
        'rejected',
        { status: 'pending' },
        { status: 'rejected' },
        { adminNotes: validatedData.adminNotes }
      );

      // Invalidate relevant caches
      cacheService.invalidatePattern('affiliate:.*');

      res.json({
        success: true,
        message: 'Application rejected'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues
      });
    }

    console.error('Review application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review application'
    });
  }
});

/**
 * GET /api/admin/affiliates
 * Get all affiliates with pagination and filtering
 */
router.get('/', async (req: AuthRequest, res) => {
  try {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && ['active', 'suspended', 'inactive'].includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          referralCode: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            firstName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const [affiliates, totalCount] = await Promise.all([
      prisma.affiliate.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.affiliate.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        affiliates,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get affiliates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliates'
    });
  }
});

/**
 * PUT /api/admin/affiliates/:id
 * Update affiliate settings
 */
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const validatedData = updateAffiliateSchema.parse(req.body);

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: id as string },
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

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    const updatedAffiliate = await prisma.affiliate.update({
      where: { id: id as string },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Affiliate updated successfully',
      data: updatedAffiliate
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues
      });
    }

    console.error('Update affiliate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update affiliate'
    });
  }
});

/**
 * GET /api/admin/affiliates/analytics
 * Get affiliate program analytics
 */
router.get('/analytics', async (req: AuthRequest, res) => {
  try {
    // Try to get cached analytics data (cache for 5 minutes)
    const cachedData = await cacheService.getOrSet(
      CacheKeys.affiliateAnalytics(),
      async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalAffiliates,
      activeAffiliates,
      pendingApplications,
      totalClicks,
      totalConversions,
      totalCommissions,
      recentClicks,
      recentConversions,
      recentCommissions,
      topPerformers
    ] = await Promise.all([
      prisma.affiliate.count(),
      prisma.affiliate.count({ where: { status: 'active' } }),
      prisma.affiliateApplication.count({ where: { status: 'pending' } }),
      prisma.affiliateClick.count(),
      prisma.affiliateConversion.count(),
      prisma.affiliateConversion.aggregate({
        _sum: { commissionAmount: true }
      }),
      prisma.affiliateClick.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.affiliateConversion.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.affiliateConversion.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo } },
        _sum: { commissionAmount: true }
      }),
      prisma.affiliate.findMany({
        select: {
          id: true,
          referralCode: true,
          totalClicks: true,
          totalConversions: true,
          totalEarnings: true,
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          totalEarnings: 'desc'
        },
        take: 10
      })
    ]);

        const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;
        const recentConversionRate = recentClicks > 0 ? (recentConversions / recentClicks * 100) : 0;

        return {
          overview: {
            totalAffiliates,
            activeAffiliates,
            pendingApplications,
            totalClicks,
            totalConversions,
            totalCommissions: totalCommissions._sum.commissionAmount || 0,
            conversionRate: parseFloat(conversionRate.toFixed(2))
          },
          recent: {
            recentClicks,
            recentConversions,
            recentCommissions: recentCommissions._sum.commissionAmount || 0,
            recentConversionRate: parseFloat(recentConversionRate.toFixed(2))
          },
          topPerformers
        };
      },
      300 // Cache for 5 minutes
    );

    res.json({
      success: true,
      data: cachedData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

/**
 * POST /api/admin/affiliates/bulk-actions
 * Perform bulk actions on affiliates
 */
router.post('/bulk-actions', async (req: AuthRequest, res) => {
  try {

    const { action, affiliateIds } = req.body;

    if (!action || !Array.isArray(affiliateIds) || affiliateIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Action and affiliate IDs are required'
      });
    }

    let result;
    switch (action) {
      case 'activate':
        result = await prisma.affiliate.updateMany({
          where: { id: { in: affiliateIds } },
          data: { status: 'active' }
        });
        break;
      case 'suspend':
        result = await prisma.affiliate.updateMany({
          where: { id: { in: affiliateIds } },
          data: { status: 'suspended' }
        });
        break;
      case 'deactivate':
        result = await prisma.affiliate.updateMany({
          where: { id: { in: affiliateIds } },
          data: { status: 'inactive' }
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    // Log audit event
    await auditService.logBulkAffiliateAction(
      req,
      action,
      affiliateIds,
      { updatedCount: result.count }
    );

    // Invalidate relevant caches
    cacheService.invalidatePattern('affiliate:.*');

    res.json({
      success: true,
      message: `Successfully ${action}d ${result.count} affiliates`,
      data: { updatedCount: result.count }
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk action'
    });
  }
});

/**
 * GET /api/admin/affiliates/payouts
 * Get all affiliate payouts with pagination
 */
router.get('/payouts', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      where.status = status;
    }

    const [payouts, totalCount] = await Promise.all([
      prisma.affiliatePayout.findMany({
        where,
        include: {
          affiliate: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.affiliatePayout.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        payouts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payouts'
    });
  }
});

/**
 * POST /api/admin/affiliates/payouts
 * Create payouts for affiliates
 */
router.post('/payouts', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const validatedData = createPayoutSchema.parse(req.body);

    // Get affiliates with their pending earnings
    const affiliates = await prisma.affiliate.findMany({
      where: {
        id: { in: validatedData.affiliateIds },
        pendingEarnings: { gt: 0 }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (affiliates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No affiliates found with pending earnings'
      });
    }

    // Create payout records
    const payoutPromises = affiliates.map(affiliate => {
      const payoutAmount = validatedData.amount || affiliate.pendingEarnings;
      
      if (payoutAmount > affiliate.pendingEarnings) {
        throw new Error(`Payout amount exceeds pending earnings for affiliate ${affiliate.referralCode}`);
      }

      return prisma.affiliatePayout.create({
        data: {
          affiliateId: affiliate.id,
          amount: payoutAmount,
          method: validatedData.method,
          status: 'pending'
        }
      });
    });

    const payouts = await Promise.all(payoutPromises);

    // If using Stripe Connect, initiate transfers
    if (validatedData.method === 'stripe_connect') {
      for (const payout of payouts) {
        const affiliate = affiliates.find(a => a.id === payout.affiliateId);
        if (affiliate?.stripeConnectId) {
          try {
            const transfer = await stripeService.createTransfer(
              Math.round(payout.amount * 100), // Convert to cents
              affiliate.stripeConnectId,
              {
                affiliateId: affiliate.id,
                payoutId: payout.id,
                referralCode: affiliate.referralCode
              }
            );

            // Update payout with Stripe transfer ID
            await prisma.affiliatePayout.update({
              where: { id: payout.id },
              data: {
                stripeTransferId: transfer.id,
                status: 'processing'
              }
            });
          } catch (error) {
            console.error(`Failed to create transfer for payout ${payout.id}:`, error);
            // Update payout status to failed
            await prisma.affiliatePayout.update({
              where: { id: payout.id },
              data: {
                status: 'failed',
                failureReason: 'Stripe transfer creation failed'
              }
            });
          }
        } else {
          // No Stripe Connect account, mark as failed
          await prisma.affiliatePayout.update({
            where: { id: payout.id },
            data: {
              status: 'failed',
              failureReason: 'No Stripe Connect account configured'
            }
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Created ${payouts.length} payouts`,
      data: { payouts }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues
      });
    }

    console.error('Create payouts error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payouts'
    });
  }
});

/**
 * PUT /api/admin/affiliates/payouts/:id
 * Update payout status
 */
router.put('/payouts/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const validatedData = updatePayoutSchema.parse(req.body);

    const payout = await prisma.affiliatePayout.findUnique({
      where: { id: id as string },
      include: {
        affiliate: true
      }
    });

    if (!payout) {
      return res.status(404).json({
        success: false,
        error: 'Payout not found'
      });
    }

    // Update payout status
    const updatedPayout = await prisma.affiliatePayout.update({
      where: { id: id as string },
      data: {
        status: validatedData.status,
        failureReason: validatedData.failureReason,
        processedAt: validatedData.status === 'completed' ? new Date() : undefined
      },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // If payout is completed, update affiliate earnings
    if (validatedData.status === 'completed' && payout.status !== 'completed') {
      await prisma.affiliate.update({
        where: { id: payout.affiliateId },
        data: {
          pendingEarnings: {
            decrement: payout.amount
          },
          paidEarnings: {
            increment: payout.amount
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Payout updated successfully',
      data: updatedPayout
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues
      });
    }

    console.error('Update payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payout'
    });
  }
});

/**
 * GET /api/admin/affiliates/:id/performance
 * Get detailed performance metrics for a specific affiliate
 */
router.get('/:id/performance', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: id as string },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    const [
      recentClicks,
      recentConversions,
      clickHistory,
      conversionHistory,
      topReferringSources
    ] = await Promise.all([
      prisma.affiliateClick.count({
        where: {
          affiliateId: id as string,
          createdAt: { gte: startDate }
        }
      }),
      prisma.affiliateConversion.count({
        where: {
          affiliateId: id as string,
          createdAt: { gte: startDate }
        }
      }),
      prisma.affiliateClick.groupBy({
        by: ['createdAt'],
        where: {
          affiliateId: id as string,
          createdAt: { gte: startDate }
        },
        _count: true,
        orderBy: {
          createdAt: 'asc'
        }
      }),
      prisma.affiliateConversion.groupBy({
        by: ['createdAt'],
        where: {
          affiliateId: id as string,
          createdAt: { gte: startDate }
        },
        _count: true,
        _sum: {
          commissionAmount: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      prisma.affiliateClick.groupBy({
        by: ['referer'],
        where: {
          affiliateId: id as string,
          createdAt: { gte: startDate },
          referer: { not: null }
        },
        _count: true,
        orderBy: {
          _count: {
            referer: 'desc'
          }
        },
        take: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        affiliate,
        metrics: {
          recentClicks,
          recentConversions,
          recentConversionRate: recentClicks > 0 ? (recentConversions / recentClicks * 100) : 0
        },
        history: {
          clicks: clickHistory,
          conversions: conversionHistory
        },
        topReferringSources
      }
    });
  } catch (error) {
    console.error('Get affiliate performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliate performance'
    });
  }
});

/**
 * POST /api/admin/affiliates/:id/connect-account
 * Create Stripe Connect account for affiliate
 */
router.post('/:id/connect-account', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: id as string },
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

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    if (affiliate.stripeConnectId) {
      return res.status(400).json({
        success: false,
        error: 'Stripe Connect account already exists'
      });
    }

    // Create Stripe Connect account
    const account = await stripeService.createConnectAccount(
      affiliate.user.email,
      affiliate.user.firstName || '',
      affiliate.user.lastName || ''
    );

    // Update affiliate with Stripe Connect ID
    const updatedAffiliate = await prisma.affiliate.update({
      where: { id: id as string },
      data: {
        stripeConnectId: account.id
      }
    });

    // Create account link for onboarding
    const accountLink = await stripeService.createAccountLink(
      account.id,
      `${process.env.CLIENT_URL}/admin/affiliates/${id}/connect-refresh`,
      `${process.env.CLIENT_URL}/admin/affiliates/${id}/connect-return`
    );

    res.json({
      success: true,
      message: 'Stripe Connect account created',
      data: {
        accountId: account.id,
        onboardingUrl: accountLink.url
      }
    });
  } catch (error) {
    console.error('Create Connect account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Connect account'
    });
  }
});

/**
 * GET /api/admin/affiliates/:id/connect-status
 * Get Stripe Connect account status
 */
router.get('/:id/connect-status', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: id as string }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    if (!affiliate.stripeConnectId) {
      return res.json({
        success: true,
        data: {
          hasConnectAccount: false
        }
      });
    }

    // Get Connect account status from Stripe
    const account = await stripeService.getConnectAccount(affiliate.stripeConnectId);

    res.json({
      success: true,
      data: {
        hasConnectAccount: true,
        accountId: account.id,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled
      }
    });
  } catch (error) {
    console.error('Get Connect status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Connect status'
    });
  }
});

/**
 * GET /api/admin/affiliates/audit-logs
 * Get audit logs for affiliate-related actions
 */
router.get('/audit-logs', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const userId = req.query.userId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const filters: any = {
      entity: ['affiliate', 'affiliate_application', 'affiliate_payout']
    };

    if (action) filters.action = action;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await auditService.getLogs(filters, { page, limit });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

export default router;