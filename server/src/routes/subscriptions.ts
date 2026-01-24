import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * GET /api/subscriptions
 * Fetch all subscriptions for authenticated user
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            imageUrl: true,
            price: true,
            category: true,
          },
        },
        shippingAddress: {
          select: {
            streetAddress: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions',
    });
  }
});

export default router;
