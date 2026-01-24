import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * Helper function to format date as relative time
 */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}


/**
 * GET /api/testimonials
 * Get all testimonials from reviews
 * 
 * Query params (optional):
 * - product: filter by product category ('male' | 'female')
 * - limit: limit number of results
 */
router.get('/', async (req, res) => {
  try {
    const { product, limit } = req.query;
    
    // Build where clause for filtering
    const where: any = {
      // Only include reviews that are suitable as testimonials (4+ stars)
      rating: {
        gte: 4
      }
    };
    
    // Filter by product category if specified
    if (product === 'male' || product === 'female') {
      where.product = {
        category: product
      };
    }
    
    // Parse limit
    let limitNum: number | undefined;
    if (limit && typeof limit === 'string') {
      const parsed = parseInt(limit, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limitNum = parsed;
      }
    }
    
    // Fetch reviews from database
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        product: {
          select: {
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limitNum
    });
    
    // Format testimonials with relative dates and anonymized user names
    const formattedTestimonials = reviews.map(review => ({
      id: review.id,
      userName: `${review.user.firstName} ${review.user.lastName?.charAt(0) || ''}.`,
      rating: review.rating,
      title: review.title,
      body: review.content,
      productName: review.product.name,
      productCategory: review.product.category,
      isVerifiedPurchase: review.verified,
      createdAt: review.createdAt.toISOString(),
      relativeDate: formatRelativeDate(review.createdAt)
    }));
    
    // Calculate aggregate rating
    const totalRating = formattedTestimonials.reduce((sum, t) => sum + t.rating, 0);
    const averageRating = formattedTestimonials.length > 0 
      ? (totalRating / formattedTestimonials.length).toFixed(1)
      : '0.0';
    
    res.json({
      success: true,
      data: formattedTestimonials,
      meta: {
        total: formattedTestimonials.length,
        averageRating: parseFloat(averageRating),
        count: formattedTestimonials.length
      }
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch testimonials'
    });
  }
});

export default router;