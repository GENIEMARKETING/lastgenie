/**
 * Stripe Service - Payment Processing
 * 
 * This service handles all Stripe-related operations including:
 * - Creating checkout sessions
 * - Managing subscriptions
 * - Processing webhooks
 * - Handling customer data
 */

import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { sendOrderConfirmationEmail } from './email';
import { saveCheckoutAddresses } from './address-utils';

interface GuestInfo {
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    addressType?: string;
  };
  billingAddress?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  sameAsBilling: boolean;
}

interface CheckoutSessionData {
  items: Array<{
    productId: string;
    quantity: number;
    isSubscription?: boolean;
  }>;
  customerEmail?: string;
  customerName?: string;
  guestInfo?: GuestInfo;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

interface SubscriptionData {
  customerId: string;
  priceId: string;
  quantity?: number;
  metadata?: Record<string, string>;
}

class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  /**
   * Create a Stripe checkout session
   */
  async createCheckoutSession(data: CheckoutSessionData): Promise<Stripe.Checkout.Session> {
    try {
      // Fetch product details from database
      const products = await prisma.product.findMany({
        where: {
          sku: { in: data.items.map(item => item.productId) }
        }
      });

      // Create line items for Stripe
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      
      for (const item of data.items) {
        const product = products.find(p => p.sku === item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (item.isSubscription && product.isSubscribable) {
          // For subscription items, we'll create a price on-the-fly or use existing price
          const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
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
        } else {
          // One-time payment
          const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
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

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
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

      // Pre-populate addresses with guest checkout data
      if (data.guestInfo) {
        const { contactInfo, shippingAddress, billingAddress, sameAsBilling } = data.guestInfo;
        
        // Pre-populate shipping address
        sessionParams.shipping_options = [{
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0, // Will be calculated by Stripe
              currency: 'usd',
            },
            display_name: 'Standard Shipping',
          }
        }];

        // Set customer details
        if (data.customerName) {
          sessionParams.customer_creation = 'always';
        }

        // Add phone number to metadata for order processing
        if (contactInfo.phone) {
          sessionParams.metadata = {
            ...sessionParams.metadata,
            customerPhone: contactInfo.phone,
          };
        }

        // Add address details to metadata for order processing
        sessionParams.metadata = {
          ...sessionParams.metadata,
          shippingStreet1: shippingAddress.street1,
          shippingStreet2: shippingAddress.street2 || '',
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          shippingPostalCode: shippingAddress.postalCode,
          shippingCountry: shippingAddress.country,
          shippingPhone: shippingAddress.phone || '',
        };

        if (!sameAsBilling && billingAddress) {
          sessionParams.metadata = {
            ...sessionParams.metadata,
            billingStreet1: billingAddress.street1,
            billingStreet2: billingAddress.street2 || '',
            billingCity: billingAddress.city,
            billingState: billingAddress.state,
            billingPostalCode: billingAddress.postalCode,
            billingCountry: billingAddress.country,
            billingPhone: billingAddress.phone || '',
          };
        }
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);
      
      console.log('Stripe checkout session created:', {
        sessionId: session.id,
        url: session.url,
        mode: session.mode,
        lineItems: lineItems.length
      });

      return session;
    } catch (error) {
      console.error('Stripe checkout session creation failed:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(data: SubscriptionData): Promise<Stripe.Subscription> {
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
    } catch (error) {
      console.error('Stripe subscription creation failed:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Retrieve a checkout session
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
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
    } catch (error) {
      console.error('Stripe session retrieval failed:', error);
      throw new Error('Failed to retrieve session');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: string, signature: string): Promise<Stripe.Event> {
    try {
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('Webhook event verified:', {
        type: event.type,
        id: event.id
      });

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return event;
    } catch (error) {
      console.error('Stripe webhook processing failed:', error);
      throw new Error('Webhook processing failed');
    }
  }

  /**
   * Handle successful checkout completion
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('Processing checkout completion:', session.id);
    
    try {
      const userId = session.metadata?.userId;
      if (!userId || userId === 'guest') {
        throw new Error('No valid user ID found in session metadata');
      }

      // Get user details
      let user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Extract guest checkout data if available
      const guestCheckoutData = session.metadata?.guestCheckoutData 
        ? JSON.parse(session.metadata.guestCheckoutData) 
        : null;

      // Update user profile if fields are missing and guest data is available
      if (guestCheckoutData) {
        const profileUpdates: any = {};
        
        if (!user.firstName && guestCheckoutData.contactInfo?.firstName) {
          profileUpdates.firstName = guestCheckoutData.contactInfo.firstName;
        }
        if (!user.lastName && guestCheckoutData.contactInfo?.lastName) {
          profileUpdates.lastName = guestCheckoutData.contactInfo.lastName;
        }
        if (!user.phone && guestCheckoutData.contactInfo?.phone) {
          profileUpdates.phone = guestCheckoutData.contactInfo.phone;
        }

        if (Object.keys(profileUpdates).length > 0) {
          user = await prisma.user.update({
            where: { id: userId },
            data: profileUpdates,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          });
          console.log('Updated user profile with checkout data:', profileUpdates);
        }
      }

      // Save addresses from guest checkout data or create from session
      let shippingAddress;
      
      if (guestCheckoutData) {
        // Use guest checkout addresses with deduplication
        const savedAddresses = await saveCheckoutAddresses(user.id, guestCheckoutData);
        shippingAddress = savedAddresses.shipping;
        console.log('Saved checkout addresses:', { 
          shipping: savedAddresses.shipping.id, 
          billing: savedAddresses.billing?.id 
        });
      } else {
        // Fallback to creating address from Stripe session data
        const shippingDetails = (session as any).shipping_details || (session as any).customer_details;
        if (!shippingDetails?.address) {
          throw new Error('No shipping address found in session');
        }

        shippingAddress = await prisma.address.create({
          data: {
            userId: user.id,
            streetAddress: shippingDetails.address?.line1 || '',
            city: shippingDetails.address?.city || '',
            state: shippingDetails.address?.state || '',
            zipCode: shippingDetails.address?.postal_code || '',
            country: shippingDetails.address?.country || 'US',
            type: 'shipping',
          },
        });
      }

      // Generate order number
      const orderNumber = `LG-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: user.id,
          shippingAddressId: shippingAddress.id,
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
        const product = await prisma.product.findFirst({
          where: { name: productName || undefined },
        });

        if (product) {
          await prisma.orderItem.create({
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
      await prisma.cartItem.deleteMany({
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
        const orderItems = await prisma.orderItem.findMany({
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
            street1: shippingAddress?.streetAddress || '',
            street2: undefined,
            city: shippingAddress?.city || '',
            state: shippingAddress?.state || '',
            zipCode: shippingAddress?.zipCode || ''
          }
        };

        await sendOrderConfirmationEmail(emailOrderDetails);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the order creation if email fails
      }

      // TODO: Trigger fulfillment process
    } catch (error) {
      console.error('Error processing checkout completion:', error);
      throw error;
    }
  }

  /**
   * Update inventory after order
   */
  private async updateInventory(productId: string, quantity: number, orderId: string): Promise<void> {
    const inventory = await prisma.inventory.findUnique({
      where: { productId },
    });

    if (inventory) {
      const newStock = inventory.currentStock - quantity;
      
      await prisma.inventory.update({
        where: { productId },
        data: {
          currentStock: newStock,
          totalSold: inventory.totalSold + quantity,
        },
      });

      // Create stock movement record
      await prisma.stockMovement.create({
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
  private async handlePaymentSucceeded(invoice: any): Promise<void> {
    console.log('Processing successful payment:', invoice.id);
    
    // TODO: Implement subscription renewal logic
    // - Update subscription status
    // - Create renewal order
    // - Send receipt email
  }

  /**
   * Handle failed subscription payment
   */
  private async handlePaymentFailed(invoice: any): Promise<void> {
    console.log('Processing failed payment:', invoice.id);
    
    // TODO: Implement payment failure logic
    // - Update subscription status
    // - Send payment failure notification
    // - Handle dunning management
  }

  /**
   * Handle subscription cancellation
   */
  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    console.log('Processing subscription cancellation:', subscription.id);
    
    // TODO: Implement cancellation logic
    // - Update subscription status in database
    // - Send cancellation confirmation
    // - Handle final billing
  }

  /**
   * Create or retrieve a Stripe customer
   */
  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
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
    } catch (error) {
      console.error('Stripe customer creation failed:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create a Stripe Connect Express account for affiliate
   */
  async createConnectAccount(email: string, firstName?: string, lastName?: string): Promise<any> {
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
    } catch (error) {
      console.error('Stripe Connect account creation failed:', error);
      throw new Error('Failed to create Connect account');
    }
  }

  /**
   * Create an account link for Connect onboarding
   */
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<any> {
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
    } catch (error) {
      console.error('Account link creation failed:', error);
      throw new Error('Failed to create account link');
    }
  }

  /**
   * Create a transfer to affiliate's Connect account
   */
  async createTransfer(amount: number, connectAccountId: string, metadata?: Record<string, string>): Promise<any> {
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
    } catch (error) {
      console.error('Transfer creation failed:', error);
      throw new Error('Failed to create transfer');
    }
  }

  /**
   * Get Connect account information
   */
  async getConnectAccount(accountId: string): Promise<any> {
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
    } catch (error) {
      console.error('Connect account retrieval failed:', error);
      throw new Error('Failed to retrieve Connect account');
    }
  }

  /**
   * Get transfer information
   */
  async getTransfer(transferId: string): Promise<any> {
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
    } catch (error) {
      console.error('Transfer retrieval failed:', error);
      throw new Error('Failed to retrieve transfer');
    }
  }
}

export default new StripeService();