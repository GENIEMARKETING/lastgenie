"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const stripe_1 = __importDefault(require("../services/stripe"));
const router = express_1.default.Router();
// Validation schemas
const createSessionSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string(),
        quantity: zod_1.z.number().min(1),
        isSubscription: zod_1.z.boolean().optional()
    })),
    shippingAddress: zod_1.z.object({
        name: zod_1.z.string(),
        street1: zod_1.z.string(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        postalCode: zod_1.z.string(),
        country: zod_1.z.string()
    }).optional(),
    referralCode: zod_1.z.string().optional() // Add referral code to schema
});
const estimateSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string(),
        quantity: zod_1.z.number().min(1)
    })),
    shippingAddress: zod_1.z.object({
        street1: zod_1.z.string(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        postalCode: zod_1.z.string(),
        country: zod_1.z.string()
    })
});
/**
 * POST /api/checkout/session
 * Create Stripe checkout session (STUB)
 * Requires user authentication and age verification
 */
router.post('/session', auth_1.authenticate, async (req, res) => {
    try {
        const validatedData = createSessionSchema.parse(req.body);
        // Check age verification status
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const user = await prisma_1.prisma.user.findUnique({
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
        // Get user details for customer creation
        const userDetails = await prisma_1.prisma.user.findUnique({
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
        // Include referral code in session metadata for affiliate tracking
        const sessionMetadata = {
            userId: req.user.id
        };
        if (validatedData.referralCode) {
            sessionMetadata.referralCode = validatedData.referralCode;
            console.log('Including referral code in checkout session:', validatedData.referralCode);
        }
        // Create Stripe checkout session
        const session = await stripe_1.default.createCheckoutSession({
            items: validatedData.items,
            customerEmail: userDetails.email,
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
        const products = await prisma_1.prisma.product.findMany({
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
                        const cheapestRate = shippingData.data.rates.reduce((min, rate) => parseFloat(rate.amount) < parseFloat(min.amount) ? rate : min);
                        shipping = parseFloat(cheapestRate.amount);
                    }
                }
            }
            catch (error) {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
        const session = await stripe_1.default.getCheckoutSession(sessionId);
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
    }
    catch (error) {
        console.error('Session status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch session status'
        });
    }
});
exports.default = router;
