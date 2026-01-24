---
name: Stripe API Key Permissions Configuration
overview: "Determine and document the required Stripe API key permissions based on the project's payment processing needs: one-time payments, subscriptions, customer management, and webhook handling."
todos:
  - id: document-stripe-permissions
    content: Create documentation file listing required Stripe permissions with explanations
    status: pending
---

# Stripe API Key Permissions Configuration

## Project Payment Requirements

Based on the codebase analysis, the project needs:

1. **One-time payments** - Single bottles ($10) and 12-packs ($99)
2. **Recurring subscriptions** - "Subscribe & Save" for 12-packs with monthly billing
3. **Customer management** - Link Stripe customers to user accounts
4. **Webhook handling** - Process payment events, subscription renewals, cancellations
5. **Subscription management** - Allow customers to manage subscriptions via Stripe Customer Portal

## Required Stripe API Key Permissions

### Core Payment Processing (REQUIRED - Write)

1. **Checkout Sessions** - **Write**

- Required for: Creating checkout sessions for both one-time payments and subscriptions
- Used in: `server/src/routes/checkout.ts` - `POST /api/checkout/session`
- Purpose: Generate secure payment links for customers

2. **Payment Intents** - **Read** (optional, but recommended)

- Required for: Viewing payment details if using Payment Intents
- Purpose: Track payment status and handle 3D Secure authentication

3. **Charges** - **Read**

- Required for: Viewing charge details, processing refunds
- Purpose: Order history, customer support, refund processing

### Customer Management (REQUIRED - Write)

4. **Customers** - **Write**

- Required for: Creating and managing Stripe customer records
- Used in: `server/src/services/stripe.ts` - `createCustomer()` method
- Purpose: Link Stripe customers to user accounts, store `stripeCustomerId` in database

5. **Payment Methods** - **Write**

- Required for: Saving payment methods for recurring subscriptions
- Purpose: Enable automatic billing for subscriptions

### Subscription Management (REQUIRED - Write)

6. **Subscriptions** - **Write**

- Required for: Creating and managing recurring subscriptions
- Used in: `server/src/services/stripe.ts` - `createSubscription()` method
- Purpose: Handle "Subscribe & Save" recurring billing

7. **Invoices** - **Read**

- Required for: Tracking subscription billing cycles
- Used in: Webhook handler for `invoice.payment_succeeded` and `invoice.payment_failed` events
- Purpose: Monitor subscription renewals and payment failures

8. **Customer Portal** - **Write**

- Required for: Allowing customers to manage subscriptions
- Purpose: Enable customers to pause, cancel, or modify subscriptions from their account

### Product Catalog (REQUIRED - Write)

9. **Products** - **Write**

- Required for: Managing product catalog in Stripe
- Purpose: Create products for "Genie for Him", "Genie for Her", 12-packs

10. **Prices** - **Write**

- Required for: Creating one-time prices ($10, $99) and recurring prices for subscriptions
- Purpose: Define pricing for both one-time and subscription purchases

### Webhook & Event Management (REQUIRED - Read)

11. **Webhook Endpoints** - **Read**

- Required for: Viewing and managing webhook configuration
- Purpose: Verify webhook setup, view event logs

12. **Events** - **Read**

- Required for: Viewing webhook events for debugging
- Purpose: Troubleshoot payment issues, verify webhook delivery

### Optional but Recommended

13. **Refunds** - **Write** (if you need to process refunds)

- Purpose: Handle customer refunds for orders

14. **Disputes** - **Read** (for chargeback management)

- Purpose: Monitor and respond to chargebacks

15. **Coupons** - **Read** (if you plan to offer discount codes)

- Purpose: Apply promotional codes during checkout

## Permission Summary Table

| Resource | Permission Level | Required For | Priority |
|----------|-----------------|-------------|----------|
| Checkout Sessions | **Write** | Creating payment links | Critical |
| Customers | **Write** | Customer management | Critical |
| Subscriptions | **Write** | Recurring billing | Critical |
| Payment Methods | **Write** | Saving cards for subscriptions | Critical |
| Products | **Write** | Product catalog | Critical |
| Prices | **Write** | Pricing configuration | Critical |
| Invoices | **Read** | Subscription billing tracking | Critical |
| Customer Portal | **Write** | Subscription self-service | Critical |
| Charges | **Read** | Payment history | High |
| Payment Intents | **Read** | Payment status tracking | Medium |
| Webhook Endpoints | **Read** | Webhook management | Medium |
| Events | **Read** | Debugging webhooks | Medium |
| Refunds | **Write** | Refund processing | Optional |
| Disputes | **Read** | Chargeback management | Optional |

## Implementation Notes

### For Development/Testing

- Use **Test Mode** keys from Stripe Dashboard
- All permissions can be set to **Write** for development to avoid permission issues
- Test webhook events using Stripe CLI: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`

### For Production

- Use **Restricted API Key** with only the permissions listed above
- Follow principle of least privilege
- Separate keys for different environments (development, staging, production)

### Key Configuration Steps

1. In Stripe Dashboard, go to **Developers > API keys**
2. Click **"Create restricted key"**
3. Name the key (e.g., "lastgenie-production")
4. Set permissions as specified above
5. Copy the secret key to your `.env` file as `STRIPE_SECRET_KEY`

## Webhook Events to Subscribe To

When configuring webhooks in Stripe Dashboard, subscribe to these events:

- `checkout.session.completed` - One-time and subscription initial payments
- `invoice.payment_succeeded` - Subscription renewal payments
- `invoice.payment_failed` - Failed subscription payments
- `customer.subscription.deleted` - Subscription cancellations
- `customer.subscription.updated` - Subscription modifications

These events are handled in `server/src/routes/webhooks.ts` and `server/src/services/stripe.ts`.