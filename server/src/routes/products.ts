import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schema for creating reviews
const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(2000),
});

// Mock product data (will be replaced with database)
const mockProducts = [
  {
    id: 'genie-for-him',
    name: 'Genie for Him',
    slug: 'genie-for-him',
    description: 'Boost confidence and vitality with our male-focused formula.',
    price: 10.00,
    category: 'male',
    packageSize: 'single',
    isSubscribable: false,
    imageUrl: '/placeholder-male.jpg',
    ingredients: ['L-Arginine', 'Tribulus Terrestris', 'Ginseng Extract', 'Maca Root', 'Zinc'],
    rating: 4.8,
    reviewCount: 234
  },
  {
    id: 'genie-for-her',
    name: 'Genie for Her',
    slug: 'genie-for-her',
    description: 'Empowering wellness for women with our female-focused formula.',
    price: 10.00,
    category: 'female',
    packageSize: 'single',
    isSubscribable: false,
    imageUrl: '/placeholder-female.jpg',
    ingredients: ['Damiana Leaf', 'Maca Root', 'Ginkgo Biloba', 'Red Clover', 'Vitamin E'],
    rating: 4.9,
    reviewCount: 312
  },
  {
    id: 'genie-for-him-12pack',
    name: 'Genie for Him - 12 Pack',
    slug: 'genie-for-him',
    description: 'Stock up and save with our male formula 12-pack.',
    price: 99.00,
    category: 'male',
    packageSize: '12-pack',
    isSubscribable: true,
    imageUrl: '/placeholder-male-pack.jpg',
    ingredients: ['L-Arginine', 'Tribulus Terrestris', 'Ginseng Extract', 'Maca Root', 'Zinc'],
    rating: 4.8,
    reviewCount: 234
  },
  {
    id: 'genie-for-her-12pack',
    name: 'Genie for Her - 12 Pack',
    slug: 'genie-for-her',
    description: 'Stock up and save with our female formula 12-pack.',
    price: 99.00,
    category: 'female',
    packageSize: '12-pack',
    isSubscribable: true,
    imageUrl: '/placeholder-female-pack.jpg',
    ingredients: ['Damiana Leaf', 'Maca Root', 'Ginkgo Biloba', 'Red Clover', 'Vitamin E'],
    rating: 4.9,
    reviewCount: 312
  }
];

/**
 * GET /api/products
 * Get all products
 */
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    
    const products = await prisma.product.findMany({
      where: active === 'true' ? { isActive: true } : {},
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        category: true,
        packageSize: true,
        isActive: true,
        isFeatured: true,
        metaTitle: true,
        metaDescription: true
      }
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

/**
 * GET /api/products/:productSku
 * Get product by SKU
 */
router.get('/:productSku', async (req, res) => {
  try {
    const { productSku } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { sku: productSku },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        imageUrl: true,
        category: true,
        packageSize: true,
        isActive: true,
        isFeatured: true,
        metaTitle: true,
        metaDescription: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

/**
 * GET /api/products/:sku/reviews
 * Get reviews for a specific product by SKU
 */
router.get('/:productSku/reviews', async (req, res) => {
  try {
    const { productSku } = req.params;
    const { limit = '10', offset = '0' } = req.query;
    
    // Find product by SKU
    const product = await prisma.product.findUnique({
      where: { sku: productSku },
      select: { id: true }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Get reviews from database
    const reviews = await prisma.review.findMany({
      where: { productSku: productSku, approved: true },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Format reviews for response
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.content,
      isVerifiedPurchase: review.verified,
      createdAt: review.createdAt.toISOString(),
      user: {
        firstName: review.user?.firstName || (review.guestName ? review.guestName.split(' ')[0] : 'Anonymous'),
        lastName: review.user?.lastName || (review.guestName ? review.guestName.split(' ')[1] : undefined)
      }
    }));

    // Get review statistics
    const reviewStats = await prisma.review.aggregate({
      where: { productSku: productSku, approved: true },
      _avg: { rating: true },
      _count: { id: true }
    });

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        stats: {
          averageRating: reviewStats._avg.rating || 0,
          totalReviews: reviewStats._count.id || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

/**
 * POST /api/products/:productSku/reviews
 * Create a review for a product
 */
router.post('/:productSku/reviews', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { productSku } = req.params;
    const validatedData = createReviewSchema.parse(req.body);

    // Find product by SKU
    const product = await prisma.product.findUnique({
      where: { sku: productSku },
      select: { id: true, name: true }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productSku: productSku,
        userId: req.user.id
      }
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: 'You have already reviewed this product'
      });
    }

    // Check if user has purchased this product (for verified purchase)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        product: { sku: productSku as string },
        order: {
          userId: req.user.id,
          status: 'delivered' // Only count delivered orders
        }
      }
    });

    // Create the review
    const review = await prisma.review.create({
      data: {
        productSku: productSku,
        userId: req.user.id,
        rating: validatedData.rating,
        title: validatedData.title,
        content: validatedData.content,
        verified: !!hasPurchased
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    // Format response
    const formattedReview = {
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.content,
      isVerifiedPurchase: review.verified,
      createdAt: review.createdAt.toISOString(),
      user: {
        firstName: review.user?.firstName || 'Anonymous',
        lastName: review.user?.lastName
      }
    };

    res.status(201).json({
      success: true,
      data: formattedReview,
      message: 'Review created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues
      });
    }

    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create review'
    });
  }
});

export default router;