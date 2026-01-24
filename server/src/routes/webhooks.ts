import express from 'express';
import { processAffiliateConversion } from '../services/affiliate-tracking';
import stripeService from '../services/stripe';

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events (STUB)
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      return res.status(400).json({
        success: false,
        error: 'Missing stripe-signature header'
      });
    }

    console.log('Stripe webhook received:', {
      signature: sig ? 'present' : 'missing',
      bodyLength: req.body.length
    });

    // Verify and parse webhook event
    const event = await stripeService.handleWebhook(req.body, sig);
    
    // Handle checkout.session.completed event for affiliate tracking
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      
      // Process affiliate conversion if referral code exists
      if (session.metadata?.referralCode && session.metadata?.userId) {
        try {
          const conversionResult = await processAffiliateConversion(
            session.metadata.referralCode,
            {
              orderId: `order_${session.id}`, // This would be the actual order ID
              orderValue: session.amount_total / 100, // Convert cents to dollars
              userId: session.metadata.userId,
              ipAddress: req.ip || 'unknown'
            }
          );
          
          if (conversionResult.success) {
            console.log(`Affiliate conversion processed: $${conversionResult.commissionAmount?.toFixed(2)} commission`);
          } else {
            console.log(`Affiliate conversion failed: ${conversionResult.message}`);
          }
        } catch (error) {
          console.error('Error processing affiliate conversion:', error);
        }
      }
    }
    
    console.log('Stripe webhook processed successfully:', {
      type: event.type,
      id: event.id
    });
    
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

/**
 * POST /api/webhooks/shipstation
 * Handle ShipStation shipping notifications (STUB)
 */
router.post('/shipstation', express.text({ type: 'application/xml' }), async (req, res) => {
  try {
    // TODO: Implement ShipStation webhook handling
    // - Parse XML notification
    // - Extract order number and tracking info
    // - Update order status in database
    // - Send shipping confirmation email
    
    console.log('ShipStation webhook received:', {
      bodyLength: req.body.length,
      contentType: req.headers['content-type']
    });
    
    // Mock XML parsing
    console.log('Processing shipping notification for order: mock_order_123');
    console.log('Tracking number: 1Z999AA1234567890');
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('ShipStation webhook error:', error);
    res.status(500).send('Error processing notification');
  }
});

export default router;