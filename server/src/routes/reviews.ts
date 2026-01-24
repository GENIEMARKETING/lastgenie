import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

// Get reviews for a product
router.get('/product/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { page = 1, limit = 10, rating, sortBy = 'createdAt' } = req.query;

    const reviews = await prisma.review.findMany({
      where: {
        productSku: sku,
        approved: true,
        ...(rating && { rating: parseInt(rating as string) })
      },
      orderBy: {
        [sortBy as string]: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        product: {
          select: { name: true, sku: true }
        }
      }
    });

    const total = await prisma.review.count({
      where: { productSku: sku, approved: true }
    });

    const averageRating = await prisma.review.aggregate({
      where: { productSku: sku, approved: true },
      _avg: { rating: true }
    });

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      averageRating: averageRating._avg.rating || 0
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get all reviews (for testimonials page)
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 12, rating, sortBy = 'createdAt' } = req.query;

    const reviews = await prisma.review.findMany({
      where: {
        approved: true,
        ...(rating && { rating: parseInt(rating as string) })
      },
      orderBy: {
        [sortBy as string]: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        product: {
          select: { name: true, sku: true }
        }
      }
    });

    const total = await prisma.review.count({
      where: { 
        approved: true,
        ...(rating && { rating: parseInt(rating as string) })
      }
    });

    const averageRating = await prisma.review.aggregate({
      where: { approved: true },
      _avg: { rating: true },
      _count: { rating: true }
    });

    // Get rating breakdown for filter buttons
    const ratingBreakdown = await prisma.review.groupBy({
      by: ['rating'],
      where: { approved: true },
      _count: { rating: true },
      orderBy: { rating: 'desc' }
    });

    // Format rating breakdown
    const ratingCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    ratingBreakdown.forEach(item => {
      ratingCounts[item.rating as keyof typeof ratingCounts] = item._count.rating;
    });

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      averageRating: averageRating._avg.rating || 0,
      totalReviews: averageRating._count.rating || 0,
      ratingCounts
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Submit new review
const reviewSchema = z.object({
  productSku: z.string(),
  rating: z.number().min(1).max(5),
  content: z.string().min(10).max(1000),
  title: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional()
});

router.post('/', async (req, res) => {
  try {
    const data = reviewSchema.parse(req.body);
    
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { sku: data.productSku }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const review = await prisma.review.create({
      data: {
        ...data,
        userId: req.user?.id, // If authenticated
        approved: true // Auto-approve for now
      },
      include: {
        product: {
          select: { name: true, sku: true }
        }
      }
    });

    res.status(201).json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid review data',
        details: error.errors
      });
    }
    
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Get review statistics for a product
router.get('/stats/:sku', async (req, res) => {
  try {
    const { sku } = req.params;

    const stats = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productSku: sku,
        approved: true
      },
      _count: {
        rating: true
      },
      orderBy: {
        rating: 'desc'
      }
    });

    const total = await prisma.review.count({
      where: { productSku: sku, approved: true }
    });

    const averageRating = await prisma.review.aggregate({
      where: { productSku: sku, approved: true },
      _avg: { rating: true }
    });

    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    stats.forEach(stat => {
      ratingBreakdown[stat.rating as keyof typeof ratingBreakdown] = stat._count.rating;
    });

    res.json({
      totalReviews: total,
      averageRating: averageRating._avg.rating || 0,
      ratingBreakdown
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
});

export default router;