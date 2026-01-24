import express from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import stripeService from '../services/stripe';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

// Conditional authentication middleware for guest checkout
const conditionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // If guest info is provided, skip authentication
  if (req.body.guestInfo) {
    // Set user to null for guest checkout
    (req as AuthRequest).user = null;
    next();
  } else {
    // Require authentication for regular checkout
    authenticate(req, res, next);
  }
};

// Validation schemas
const guestInfoSchema = z.object({
  contactInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
  shippingAddress: z.object({
    street1: z.string().min(1),
    street2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().optional(),
    addressType: z.string().optional(),
  }),
  billingAddress: z.object({
    street1: z.string().min(1),
    street2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().optional(),
  }).optional(),
  sameAsBilling: z.boolean(),
});

const createSessionSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    isSubscription: z.boolean().optional()
  })),
  shippingAddress: z.object({
    name: z.string(),
    street1: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }).optional(),
  guestInfo: guestInfoSchema.optional(), // Add guest checkout data
  referralCode: z.string().optional() // Add referral code to schema
});

const estimateSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1)
  })),
  shippingAddress: z.object({
    street1: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  })
});

/**
 * POST /api/checkout/session
 * Create Stripe checkout session
 * Supports both authenticated users and guest checkout
 */
router.post('/session', conditionalAuth, async (req: AuthRequest, res) => {
  try {
    const validatedData = createSessionSchema.parse(req.body);
    
    // For authenticated users, check age verification
    if (req.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          isAgeVerified: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (!user.isAgeVerified) {
        return res.status(403).json({
          success: false,
          error: 'Age verification required',
          message: 'You must verify your age before proceeding to checkout'
        });
      }
    }
    
    // For guest checkout, validate required guest info
    if (!req.user?.id && !validatedData.guestInfo) {
      return res.status(400).json({
        success: false,
        error: 'Guest checkout requires contact information'
      });
    }
    
    // Get user details for customer creation
    let customerEmail: string;
    let customerName: string;
    
    if (validatedData.guestInfo) {
      // Use guest checkout data
      customerEmail = validatedData.guestInfo.contactInfo.email;
      customerName = `${validatedData.guestInfo.contactInfo.firstName} ${validatedData.guestInfo.contactInfo.lastName}`;
    } else {
      // Use authenticated user data
      const userDetails = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!userDetails) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      customerEmail = userDetails.email;
      customerName = `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim();
    }

    // Include session metadata for both authenticated and guest users
    const sessionMetadata: any = {
      userId: req.user?.id || 'guest'
    };
    
    if (validatedData.referralCode) {
      sessionMetadata.referralCode = validatedData.referralCode;
      console.log('Including referral code in checkout session:', validatedData.referralCode);
    }
    
    // Store complete guest checkout data in metadata for webhook processing
    if (validatedData.guestInfo) {
      sessionMetadata.guestCheckoutData = JSON.stringify({
        contactInfo: validatedData.guestInfo.contactInfo,
        shippingAddress: validatedData.guestInfo.shippingAddress,
        billingAddress: validatedData.guestInfo.billingAddress,
        sameAsBilling: validatedData.guestInfo.sameAsBilling
      });
    }

    // Create Stripe checkout session
    const session = await stripeService.createCheckoutSession({
      items: validatedData.items,
      customerEmail,
      customerName,
      guestInfo: validatedData.guestInfo,
      successUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/cart`,
      metadata: sessionMetadata,
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        expiresAt: new Date(session.expires_at * 1000).toISOString(),
        metadata: sessionMetadata
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
    
    console.error('Checkout session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

/**
 * POST /api/checkout/estimate
 * Estimate cart total with shipping (STUB)
 */
router.post('/estimate', async (req, res) => {
  try {
    const validatedData = estimateSchema.parse(req.body);
    
    // Get actual product prices from database
    const products = await prisma.product.findMany({
      where: {
        sku: { in: validatedData.items.map(item => item.productId) }
      },
      select: {
        sku: true,
        price: true,
        name: true,
      }
    });

    // Calculate subtotal with real prices
    let subtotal = 0;
    const itemDetails = [];
    
    for (const item of validatedData.items) {
      const product = products.find(p => p.sku === item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product not found: ${item.productId}`
        });
      }
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      itemDetails.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }
    
    // Get real shipping rates (use standard shipping as default)
    let shipping = 8.50; // Default fallback
    
    if (validatedData.shippingAddress) {
      try {
        const shippingRequest = {
          items: validatedData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          shippingAddress: {
            name: validatedData.shippingAddress.name || 'Customer',
            street1: validatedData.shippingAddress.street1,
            street2: validatedData.shippingAddress.street2,
            city: validatedData.shippingAddress.city,
            state: validatedData.shippingAddress.state,
            postalCode: validatedData.shippingAddress.postalCode,
            country: validatedData.shippingAddress.country || 'US'
          }
        };
        
        // Make internal request to shipping rates endpoint
        const shippingResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/shipping/rates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shippingRequest)
        });
        
        if (shippingResponse.ok) {
          const shippingData = await shippingResponse.json();
          if (shippingData.success && shippingData.data.rates.length > 0) {
            // Use the cheapest rate
            const cheapestRate = shippingData.data.rates.reduce((min, rate) => 
              parseFloat(rate.amount) < parseFloat(min.amount) ? rate : min
            );
            shipping = parseFloat(cheapestRate.amount);
          }
        }
      } catch (error) {
        console.error('Error fetching shipping rates:', error);
        // Keep default shipping cost
      }
    }
    
    // Calculate tax (8% for now, should be based on shipping address)
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;
    
    res.json({
      success: true,
      data: {
        subtotal,
        shipping,
        tax,
        total,
        currency: 'USD',
        items: itemDetails,
        shippingOptions: [
          {
            id: 'standard',
            name: 'Standard Shipping',
            price: 8.50,
            estimatedDays: '5-7 business days'
          },
          {
            id: 'express',
            name: 'Express Shipping',
            price: 15.99,
            estimatedDays: '2-3 business days'
          }
        ]
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
    
    console.error('Cart estimation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate cart total'
    });
  }
});

/**
 * GET /api/checkout/session/:sessionId
 * Get checkout session status (STUB)
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Retrieve session from Stripe
    const session = await stripeService.getCheckoutSession(sessionId);
    
    res.json({
      success: true,
      data: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email || session.customer_email,
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata
      }
    });
  } catch (error) {
    console.error('Session status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session status'
    });
  }
});

export default router;