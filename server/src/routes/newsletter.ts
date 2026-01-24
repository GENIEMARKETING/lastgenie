import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional()
});

router.post('/subscribe', async (req, res) => {
  try {
    const { email, source } = subscribeSchema.parse(req.body);
    
    // Check if email already exists
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email }
    });
    
    if (existing) {
      if (existing.isActive) {
        return res.json({ 
          success: true, 
          message: 'Already subscribed',
          alreadySubscribed: true 
        });
      } else {
        // Reactivate subscription
        await prisma.newsletterSubscription.update({
          where: { email },
          data: { isActive: true, subscribedAt: new Date() }
        });
      }
    } else {
      // Create new subscription
      await prisma.newsletterSubscription.create({
        data: { email, source: source || 'homepage' }
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address' 
      });
    }
    
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to subscribe to newsletter' 
    });
  }
});

// Get newsletter statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.newsletterSubscription.count({
      where: { isActive: true }
    });
    
    const recent = await prisma.newsletterSubscription.count({
      where: {
        isActive: true,
        subscribedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        totalSubscribers: total,
        recentSubscribers: recent
      }
    });
  } catch (error) {
    console.error('Newsletter stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch newsletter statistics' 
    });
  }
});

export default router;