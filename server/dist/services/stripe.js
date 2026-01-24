"use strict";
/**
 * Stripe Service - Payment Processing
 *
 * This service handles all Stripe-related operations including:
 * - Creating checkout sessions
 * - Managing subscriptions
 * - Processing webhooks
 * - Handling customer data
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const prisma_1 = require("../lib/prisma");
const email_1 = require("./email");
class StripeService {
    constructor() {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY environment variable is required');
        }
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia'
        });
    }
    /**
     * Create a Stripe checkout session
     */
    async createCheckoutSession(data) {
        try {
            // Fetch product details from database
            const products = await prisma_1.prisma.product.findMany({
                where: {
                    sku: { in: data.items.map(item => item.productId) }
                }
            });
            // Create line items for Stripe
            const lineItems = [];
            for (const item of data.items) {
                const product = products.find(p => p.sku === item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                if (item.isSubscription && product.isSubscribable) {
                    // For subscription items, we'll create a price on-the-fly or use existing price
                    const priceData = {
                        currency: 'usd',
                        product_data: {
                            name: product.name,
                            description: product.description,
                            images: product.imageUrl ? [`${process.env.CLIENT_URL || 'http://localhost:3000'}${product.imageUrl}`] : undefined,
                        },
                        unit_amount: Math.round(product.price * 100), // Convert to cents
                        recurring: {
                            interval: 'month',
                        },
                    };
                    lineItems.push({
                        price_data: priceData,
                        quantity: item.quantity,
                    });
                }
                else {
                    // One-time payment
                    const priceData = {
                        currency: 'usd',
                        product_data: {
                            name: product.name,
                            description: product.description,
                            images: product.imageUrl ? [`${process.env.CLIENT_URL || 'http://localhost:3000'}${product.imageUrl}`] : undefined,
                        },
                        unit_amount: Math.round(product.price * 100), // Convert to cents
                    };
                    lineItems.push({
                        price_data: priceData,
                        quantity: item.quantity,
                    });
                }
            }
            const sessionParams = {
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: data.items.some(item => item.isSubscription) ? 'subscription' : 'payment',
                success_url: data.successUrl,
                cancel_url: data.cancelUrl,
                metadata: data.metadata || {},
                shipping_address_collection: {
                    allowed_countries: ['US', 'CA'],
                },
                billing_address_collection: 'required',
            };
            // Add customer email if provided
            if (data.customerEmail) {
                sessionParams.customer_email = data.customerEmail;
            }
            const session = await this.stripe.checkout.sessions.create(sessionParams);
            console.log('Stripe checkout session created:', {
                sessionId: session.id,
                url: session.url,
                mode: session.mode,
                lineItems: lineItems.length
            });
            return session;
        }
        catch (error) {
            console.error('Stripe checkout session creation failed:', error);
            throw new Error('Failed to create checkout session');
        }
    }
    /**
     * Create a subscription
     */
    async createSubscription(data) {
        try {
            const subscription = await this.stripe.subscriptions.create({
                customer: data.customerId,
                items: [{
                        price: data.priceId,
                        quantity: data.quantity || 1,
                    }],
                metadata: data.metadata || {},
            });
            console.log('Stripe subscription created:', {
                subscriptionId: subscription.id,
                status: subscription.status,
                customerId: data.customerId
            });
            return subscription;
        }
        catch (error) {
            console.error('Stripe subscription creation failed:', error);
            throw new Error('Failed to create subscription');
        }
    }
    /**
     * Retrieve a checkout session
     */
    async getCheckoutSession(sessionId) {
        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['line_items', 'customer']
            });
            console.log('Retrieved Stripe session:', {
                sessionId: session.id,
                paymentStatus: session.payment_status,
                status: session.status
            });
            return session;
        }
        catch (error) {
            console.error('Stripe session retrieval failed:', error);
            throw new Error('Failed to retrieve session');
        }
    }
    /**
     * Handle Stripe webhook events
     */
    async handleWebhook(payload, signature) {
        try {
            if (!process.env.STRIPE_WEBHOOK_SECRET) {
                throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
            }
            const event = this.stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
            console.log('Webhook event verified:', {
                type: event.type,
                id: event.id
            });
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutCompleted(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }
            return event;
        }
        catch (error) {
            console.error('Stripe webhook processing failed:', error);
            throw new Error('Webhook processing failed');
        }
    }
    /**
     * Handle successful checkout completion
     */
    async handleCheckoutCompleted(session) {
        console.log('Processing checkout completion:', session.id);
        try {
            const userId = session.metadata?.userId;
            if (!userId) {
                throw new Error('No user ID found in session metadata');
            }
            // Get user details
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            });
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }
            // Create shipping address from session
            const shippingDetails = session.shipping_details || session.customer_details;
            if (!shippingDetails?.address) {
                throw new Error('No shipping address found in session');
            }
            const address = await prisma_1.prisma.address.create({
                data: {
                    userId: user.id,
                    streetAddress: shippingDetails.address.line1 || '',
                    city: shippingDetails.address.city || '',
                    state: shippingDetails.address.state || '',
                    zipCode: shippingDetails.address.postal_code || '',
                    country: shippingDetails.address.country || 'US',
                    type: 'shipping',
                },
            });
            // Generate order number
            const orderNumber = `LG-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            // Create order
            const order = await prisma_1.prisma.order.create({
                data: {
                    orderNumber,
                    userId: user.id,
                    shippingAddressId: address.id,
                    status: 'paid',
                    totalAmount: (session.amount_total || 0) / 100, // Convert from cents
                    shippingAmount: (session.shipping_cost?.amount_total || 0) / 100,
                    taxAmount: (session.total_details?.amount_tax || 0) / 100,
                    stripeSessionId: session.id,
                },
            });
            // Get line items from session
            const lineItems = await this.stripe.checkout.sessions.listLineItems(session.id, {
                expand: ['data.price.product'],
            });
            // Create order items
            for (const lineItem of lineItems.data) {
                const priceId = lineItem.price?.id;
                const productName = lineItem.description;
                // Find matching product by name (since we created prices on-the-fly)
                const product = await prisma_1.prisma.product.findFirst({
                    where: { name: productName },
                });
                if (product) {
                    await prisma_1.prisma.orderItem.create({
                        data: {
                            orderId: order.id,
                            productId: product.id,
                            quantity: lineItem.quantity || 1,
                            pricePerUnit: (lineItem.amount_total || 0) / 100 / (lineItem.quantity || 1),
                        },
                    });
                    // Update inventory
                    await this.updateInventory(product.id, lineItem.quantity || 1, order.id);
                }
            }
            // Clear user's cart after successful order
            await prisma_1.prisma.cartItem.deleteMany({
                where: {
                    cart: {
                        userId: user.id,
                    },
                },
            });
            console.log('Order created successfully:', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                userId: user.id,
                totalAmount: order.totalAmount,
            });
            // Send order confirmation email
            try {
                const orderItems = await prisma_1.prisma.orderItem.findMany({
                    where: { orderId: order.id },
                    include: {
                        product: {
                            select: { name: true }
                        }
                    }
                });
                const emailOrderDetails = {
                    orderNumber: order.orderNumber,
                    customerName: `${user.firstName} ${user.lastName}`.trim() || 'Customer',
                    customerEmail: user.email,
                    items: orderItems.map(item => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        price: item.pricePerUnit,
                        total: item.pricePerUnit * item.quantity
                    })),
                    subtotal: order.totalAmount - (order.shippingAmount || 0) - (order.taxAmount || 0),
                    shipping: order.shippingAmount || 0,
                    tax: order.taxAmount || 0,
                    total: order.totalAmount,
                    shippingAddress: {
                        street1: address.streetAddress,
                        street2: undefined,
                        city: address.city,
                        state: address.state,
                        zipCode: address.zipCode
                    }
                };
                await (0, email_1.sendOrderConfirmationEmail)(emailOrderDetails);
            }
            catch (emailError) {
                console.error('Failed to send order confirmation email:', emailError);
                // Don't fail the order creation if email fails
            }
            // TODO: Trigger fulfillment process
        }
        catch (error) {
            console.error('Error processing checkout completion:', error);
            throw error;
        }
    }
    /**
     * Update inventory after order
     */
    async updateInventory(productId, quantity, orderId) {
        const inventory = await prisma_1.prisma.inventory.findUnique({
            where: { productId },
        });
        if (inventory) {
            const newStock = inventory.currentStock - quantity;
            await prisma_1.prisma.inventory.update({
                where: { productId },
                data: {
                    currentStock: newStock,
                    totalSold: inventory.totalSold + quantity,
                },
            });
            // Create stock movement record
            await prisma_1.prisma.stockMovement.create({
                data: {
                    productId,
                    type: 'sale',
                    quantity: -quantity,
                    previousStock: inventory.currentStock,
                    newStock,
                    reason: 'Order fulfillment',
                    orderId,
                    metadata: {
                        source: 'stripe_checkout',
                        sessionId: orderId,
                    },
                },
            });
        }
    }
    /**
     * Handle successful subscription payment
     */
    async handlePaymentSucceeded(invoice) {
        console.log('Processing successful payment:', invoice.id);
        // TODO: Implement subscription renewal logic
        // - Update subscription status
        // - Create renewal order
        // - Send receipt email
    }
    /**
     * Handle failed subscription payment
     */
    async handlePaymentFailed(invoice) {
        console.log('Processing failed payment:', invoice.id);
        // TODO: Implement payment failure logic
        // - Update subscription status
        // - Send payment failure notification
        // - Handle dunning management
    }
    /**
     * Handle subscription cancellation
     */
    async handleSubscriptionDeleted(subscription) {
        console.log('Processing subscription cancellation:', subscription.id);
        // TODO: Implement cancellation logic
        // - Update subscription status in database
        // - Send cancellation confirmation
        // - Handle final billing
    }
    /**
     * Create or retrieve a Stripe customer
     */
    async createCustomer(email, name) {
        try {
            // Check if customer already exists
            const existingCustomers = await this.stripe.customers.list({
                email: email,
                limit: 1,
            });
            if (existingCustomers.data.length > 0) {
                console.log('Found existing Stripe customer:', existingCustomers.data[0].id);
                return existingCustomers.data[0];
            }
            // Create new customer
            const customer = await this.stripe.customers.create({
                email,
                name: name || undefined,
            });
            console.log('Created new Stripe customer:', customer.id);
            return customer;
        }
        catch (error) {
            console.error('Stripe customer creation failed:', error);
            throw new Error('Failed to create customer');
        }
    }
    /**
     * Create a Stripe Connect Express account for affiliate
     */
    async createConnectAccount(email, firstName, lastName) {
        try {
            // TODO: Implement Stripe Connect account creation
            console.log('Creating Stripe Connect account:', email);
            // Mock implementation
            return {
                id: `acct_mock_${Date.now()}`,
                email,
                details_submitted: false,
                charges_enabled: false,
                payouts_enabled: false
            };
        }
        catch (error) {
            console.error('Stripe Connect account creation failed:', error);
            throw new Error('Failed to create Connect account');
        }
    }
    /**
     * Create an account link for Connect onboarding
     */
    async createAccountLink(accountId, refreshUrl, returnUrl) {
        try {
            // TODO: Implement Stripe Connect account link creation
            console.log('Creating account link for:', accountId);
            // Mock implementation
            return {
                object: 'account_link',
                created: Math.floor(Date.now() / 1000),
                expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes
                url: `https://connect.stripe.com/express/onboarding/${accountId}`
            };
        }
        catch (error) {
            console.error('Account link creation failed:', error);
            throw new Error('Failed to create account link');
        }
    }
    /**
     * Create a transfer to affiliate's Connect account
     */
    async createTransfer(amount, connectAccountId, metadata) {
        try {
            // TODO: Implement Stripe transfer creation
            console.log('Creating transfer:', { amount, connectAccountId, metadata });
            // Mock implementation
            return {
                id: `tr_mock_${Date.now()}`,
                object: 'transfer',
                amount,
                currency: 'usd',
                destination: connectAccountId,
                metadata: metadata || {},
                created: Math.floor(Date.now() / 1000)
            };
        }
        catch (error) {
            console.error('Transfer creation failed:', error);
            throw new Error('Failed to create transfer');
        }
    }
    /**
     * Get Connect account information
     */
    async getConnectAccount(accountId) {
        try {
            // TODO: Implement Stripe Connect account retrieval
            console.log('Retrieving Connect account:', accountId);
            // Mock implementation
            return {
                id: accountId,
                object: 'account',
                business_profile: {
                    name: 'Affiliate Business'
                },
                capabilities: {
                    transfers: 'active'
                },
                charges_enabled: true,
                details_submitted: true,
                payouts_enabled: true,
                type: 'express'
            };
        }
        catch (error) {
            console.error('Connect account retrieval failed:', error);
            throw new Error('Failed to retrieve Connect account');
        }
    }
    /**
     * Get transfer information
     */
    async getTransfer(transferId) {
        try {
            // TODO: Implement Stripe transfer retrieval
            console.log('Retrieving transfer:', transferId);
            // Mock implementation
            return {
                id: transferId,
                object: 'transfer',
                amount: 1000,
                currency: 'usd',
                created: Math.floor(Date.now() / 1000),
                destination: 'acct_mock_123',
                metadata: {}
            };
        }
        catch (error) {
            console.error('Transfer retrieval failed:', error);
            throw new Error('Failed to retrieve transfer');
        }
    }
}
exports.default = new StripeService();
