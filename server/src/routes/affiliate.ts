import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { 
  affiliateClickRateLimit, 
  affiliateApplicationRateLimit,
  createUserRateLimit 
} from '../middleware/rate-limit';
import { 
  sanitizeInput, 
  validateReferralCodeParam,
  affiliateTrackingCORS 
} from '../middleware/security';
import stripeService from '../services/stripe';

const router = express.Router();

// Apply security middleware to all routes
router.use(sanitizeInput);

// Apply CORS for tracking endpoint
router.use('/track-click', affiliateTrackingCORS);

// Validation schemas
const affiliateApplicationSchema = z.object({
  reason: z.string().min(10, 'Please provide at least 10 characters explaining why you want to be an affiliate'),
  experience: z.string().optional(),
  marketingChannels: z.string().min(5, 'Please describe how you plan to promote our products'),
});

/**
 * POST /api/affiliate/apply
 * Submit affiliate application
 */
router.post('/apply', affiliateApplicationRateLimit, authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const validatedData = affiliateApplicationSchema.parse(req.body);

    // Check if user already has an application
    const existingApplication = await prisma.affiliateApplication.findUnique({
      where: { userId: req.user.id }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted an affiliate application',
        data: {
          status: existingApplication.status,
          submittedAt: existingApplication.createdAt
        }
      });
    }

    // Check if user is already an affiliate
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (existingAffiliate) {
      return res.status(400).json({
        success: false,
        error: 'You are already an approved affiliate'
      });
    }

    // Create application
    const application = await prisma.affiliateApplication.create({
      data: {
        userId: req.user.id,
        reason: validatedData.reason,
        experience: validatedData.experience,
        marketingChannels: validatedData.marketingChannels,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Affiliate application submitted successfully! We will review it within 3-5 business days.',
      data: {
        application: {
          id: application.id,
          status: application.status,
          submittedAt: application.createdAt
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues
      });
    }

    console.error('Affiliate application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit affiliate application'
    });
  }
});

/**
 * GET /api/affiliate/status
 * Get user's affiliate status and application
 */
router.get('/status', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Check for existing affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
        referralCode: true,
        status: true,
        commissionRate: true,
        totalClicks: true,
        totalConversions: true,
        totalEarnings: true,
        pendingEarnings: true,
        paidEarnings: true,
        payoutThreshold: true,
        createdAt: true
      }
    });

    if (affiliate) {
      return res.json({
        success: true,
        data: {
          isAffiliate: true,
          affiliate
        }
      });
    }

    // Check for pending application
    const application = await prisma.affiliateApplication.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        adminNotes: true
      }
    });

    res.json({
      success: true,
      data: {
        isAffiliate: false,
        application
      }
    });
  } catch (error) {
    console.error('Affiliate status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliate status'
    });
  }
});

/**
 * GET /api/affiliate/dashboard
 * Get affiliate dashboard data
 */
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    // Get recent clicks (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentClicks = await prisma.affiliateClick.count({
      where: {
        affiliateId: affiliate.id,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get recent conversions (last 30 days)
    const recentConversions = await prisma.affiliateConversion.count({
      where: {
        affiliateId: affiliate.id,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get recent earnings (last 30 days)
    const recentEarningsResult = await prisma.affiliateConversion.aggregate({
      where: {
        affiliateId: affiliate.id,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _sum: {
        commissionAmount: true
      }
    });

    const recentEarnings = recentEarningsResult._sum.commissionAmount || 0;

    // Get conversion history for chart (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const conversionHistory = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliate.id,
        createdAt: {
          gte: twelveMonthsAgo
        }
      },
      select: {
        commissionAmount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({
      success: true,
      data: {
        affiliate: {
          id: affiliate.id,
          referralCode: affiliate.referralCode,
          status: affiliate.status,
          commissionRate: affiliate.commissionRate,
          totalClicks: affiliate.totalClicks,
          totalConversions: affiliate.totalConversions,
          totalEarnings: affiliate.totalEarnings,
          pendingEarnings: affiliate.pendingEarnings,
          paidEarnings: affiliate.paidEarnings,
          payoutThreshold: affiliate.payoutThreshold
        },
        stats: {
          recentClicks,
          recentConversions,
          recentEarnings,
          conversionRate: affiliate.totalClicks > 0 ? (affiliate.totalConversions / affiliate.totalClicks * 100).toFixed(2) : '0.00'
        },
        conversionHistory
      }
    });
  } catch (error) {
    console.error('Affiliate dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliate dashboard data'
    });
  }
});

/**
 * GET /api/affiliate/links
 * Get affiliate referral links
 */
router.get('/links', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const referralCode = affiliate.referralCode;

    const links = {
      homepage: `${baseUrl}?ref=${referralCode}`,
      shop: `${baseUrl}/shop?ref=${referralCode}`,
      maleProduct: `${baseUrl}/shop/genie-for-him?ref=${referralCode}`,
      femaleProduct: `${baseUrl}/shop/genie-for-her?ref=${referralCode}`,
      customizable: `${baseUrl}/[PAGE]?ref=${referralCode}`
    };

    res.json({
      success: true,
      data: {
        referralCode,
        links
      }
    });
  } catch (error) {
    console.error('Affiliate links error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch affiliate links'
    });
  }
});

/**
 * POST /api/affiliate/track-click
 * Track affiliate click (called when someone visits with referral code)
 */
router.post('/track-click', affiliateClickRateLimit, validateReferralCodeParam, async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        error: 'Referral code is required'
      });
    }

    // Find affiliate by referral code
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode }
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Invalid referral code'
      });
    }

    if (affiliate.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Affiliate is not active'
      });
    }

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const referer = req.get('Referer');

    // Check for duplicate clicks from same IP in last hour (basic fraud prevention)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentClick = await prisma.affiliateClick.findFirst({
      where: {
        affiliateId: affiliate.id,
        ipAddress,
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentClick) {
      return res.json({
        success: true,
        message: 'Click already tracked recently'
      });
    }

    // Create click record
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress,
        userAgent,
        referer
      }
    });

    // Update affiliate total clicks
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        totalClicks: {
          increment: 1
        }
      }
    });

    res.json({
      success: true,
      message: 'Click tracked successfully',
      data: {
        cookieDuration: affiliate.cookieDuration
      }
    });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track click'
    });
  }
});

/**
 * POST /api/affiliate/setup-payouts
 * Setup Stripe Connect for affiliate payouts
 */
router.post('/setup-payouts', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id },
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
      // Account already exists, create new onboarding link
      const accountLink = await stripeService.createAccountLink(
        affiliate.stripeConnectId,
        `${process.env.CLIENT_URL}/account/affiliate/setup-payouts`,
        `${process.env.CLIENT_URL}/account/affiliate`
      );

      return res.json({
        success: true,
        message: 'Continue Stripe Connect setup',
        data: {
          onboardingUrl: accountLink.url
        }
      });
    }

    // Create new Stripe Connect account
    const account = await stripeService.createConnectAccount(
      affiliate.user.email,
      affiliate.user.firstName,
      affiliate.user.lastName
    );

    // Update affiliate with Stripe Connect ID
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        stripeConnectId: account.id
      }
    });

    // Create account link for onboarding
    const accountLink = await stripeService.createAccountLink(
      account.id,
      `${process.env.CLIENT_URL}/account/affiliate/setup-payouts`,
      `${process.env.CLIENT_URL}/account/affiliate`
    );

    res.json({
      success: true,
      message: 'Stripe Connect account created',
      data: {
        onboardingUrl: accountLink.url
      }
    });
  } catch (error) {
    console.error('Setup payouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup payouts'
    });
  }
});

/**
 * GET /api/affiliate/payout-status
 * Get affiliate payout setup status
 */
router.get('/payout-status', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: req.user.id }
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
          payoutsEnabled: false,
          setupRequired: true
        }
      });
    }

    // Get Connect account status from Stripe
    const account = await stripeService.getConnectAccount(affiliate.stripeConnectId);

    res.json({
      success: true,
      data: {
        payoutsEnabled: account.payouts_enabled,
        setupRequired: !account.details_submitted,
        chargesEnabled: account.charges_enabled
      }
    });
  } catch (error) {
    console.error('Get payout status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payout status'
    });
  }
});

export default router;