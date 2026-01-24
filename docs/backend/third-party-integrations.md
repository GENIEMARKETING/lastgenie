Of course. Here is the comprehensive Third-Party Integrations documentation for the `lastgenie` project, formatted in Markdown as requested.

***

# Third-Party Integrations

*   **Document Type**: Technical Specification
*   **Project**: `lastgenie`
*   **Category**: Backend

## 1. Introduction

This document provides a comprehensive guide for integrating essential third-party services into the `lastgenie` backend. The backend, built with Node.js and Express, will serve as the central hub for managing payments, marketing automation, ad conversion tracking, and order fulfillment.

The following services will be integrated:

1.  **Stripe**: For secure payment processing, including one-time purchases and recurring subscriptions.
2.  **Klaviyo**: For advanced email and SMS marketing, customer segmentation, and lifecycle automation.
3.  **Social Media Pixels & Conversion APIs**: For tracking ad performance and retargeting on platforms like Meta (Facebook/Instagram) and TikTok.
4.  **ShipStation**: For streamlined order fulfillment, shipping label generation, and inventory management.

## 2. General Best Practices

All integrations must adhere to the following principles to ensure security, scalability, and maintainability.

*   **Environment Variables**: All API keys, secrets, and other sensitive credentials **must** be stored as environment variables (e.g., in a `.env` file) and accessed via `process.env`. Never hard-code credentials in the source code.
*   **Asynchronous Operations**: All calls to external APIs are asynchronous. Use `async/await` syntax for clean, readable, and non-blocking code.
*   **Error Handling**: Implement robust `try...catch` blocks for all API calls. Log errors and design graceful failure modes (e.g., if Klaviyo is down, the order should still be processed).
*   **Webhook Security**: All incoming webhooks must be verified using the signature provided by the third-party service. This prevents fraudulent requests and ensures data integrity.
*   **Data Validation**: Validate and sanitize all data received from clients or webhooks before processing or storing it in the database.

---

## 3. Stripe Integration (Payment Processing)

**Purpose**: To handle all financial transactions, including single product sales and the "Subscribe and Save" model for 12-packs. We will use Stripe Checkout for a secure, PCI-compliant, and optimized user experience.

**Backend Tech**: `stripe` Node.js library.
`npm install stripe`

### 3.1. Environment Variables

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3.2. Configuration

Before implementation, configure the following in the Stripe Dashboard:
1.  **Products**:
    *   Genie - Male Sexual Enhancer
    *   Genie - Female Sexual Enhancer
    *   Genie - 12 Pack (Male)
    *   Genie - 12 Pack (Female)
2.  **Prices**:
    *   One-time price of `$10.00` for single bottles.
    *   One-time price of `$99.00` for 12-packs.
    *   A **recurring price** for the 12-packs to support the "Subscribe and Save" feature. Note the Price ID (e.g., `price_1L...`).

### 3.3. Creating Checkout Sessions (API Endpoint)

This endpoint will be called by the frontend to initiate a payment flow. It dynamically creates a Stripe Checkout session based on the items in the user's cart.

`POST /api/payments/create-checkout-session`

```javascript
// src/routes/paymentRoutes.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
    const { line_items, isSubscription } = req.body; // line_items sent from frontend

    // line_items format: [{ price: 'price_1L...', quantity: 1 }]

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: isSubscription ? 'subscription' : 'payment',
            success_url: `${process.env.CLIENT_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/cart`,
            // For subscriptions, you can add trial periods or other settings
            ...(isSubscription && {
                subscription_data: {
                    // E.g., trial_period_days: 7 (if applicable)
                },
            })
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Stripe session creation failed:', error);
        res.status(500).json({ error: 'Failed to create checkout session.' });
    }
});

module.exports = router;
```

### 3.4. Handling Webhooks

This is the most critical part of the integration. Stripe sends events to this endpoint to notify our application about payment status, subscription updates, etc. This is where we will create an `Order` in our database.

`POST /api/webhooks/stripe`

```javascript
// src/routes/webhookRoutes.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { prisma } = require('../db/prisma'); // Assuming Prisma client is exported

const router = express.Router();

// Use express.raw for verifying webhook signature
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            // TODO: Fulfill the purchase, e.g., create order in database
            // This is where you trigger other integrations (Klaviyo, CAPI, ShipStation)
            console.log('Checkout session completed:', session.id);
            // Example:
            // await handleSuccessfulPayment(session);
            break;

        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            if (invoice.billing_reason === 'subscription_cycle') {
                // Handle recurring subscription payment
                console.log('Subscription payment succeeded for:', invoice.customer);
                // TODO: Create renewal order in database
            }
            break;

        // ... handle other event types as needed
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
});

module.exports = router;
```

---

## 4. Klaviyo Integration (Marketing Automation)

**Purpose**: To track user activity for targeted marketing campaigns, such as abandoned cart reminders and post-purchase follow-ups.

**Backend Tech**: Klaviyo REST API (using a lightweight client like `axios`).
`npm install axios`

### 4.1. Environment Variables

```bash
# .env
KLAVIYO_API_KEY=pk_...
KLAVIYO_LIST_ID=... # ID for the main newsletter list
```

### 4.2. Frontend Tracking (Klaviyo.js)

The Klaviyo tracking snippet should be added to the main layout file in Next.js (`_app.js` or a shared `Layout` component). This will handle standard events like `Active on Site` and `Viewed Product`.

```javascript
// components/KlaviyoScript.js (example)
import Script from 'next/script';

const KlaviyoScript = () => (
    <Script
        strategy="afterInteractive"
        id="klaviyo-tracking"
        src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${process.env.NEXT_PUBLIC_KLAVIYO_API_KEY}`}
    />
);

export default KlaviyoScript;
```

Client-side events like `Viewed Product` and `Added to Cart` will be triggered from the relevant pages/components using the `_learnq` object provided by the script.

### 4.3. Backend Event Tracking (Server-Side)

Server-side tracking is more reliable, especially for critical conversion events. The "Placed Order" event should be sent from our backend after a successful payment is confirmed by the Stripe webhook.

```javascript
// src/services/klaviyoService.js
const axios = require('axios');

const trackKlaviyoEvent = async (eventName, customerProperties, eventProperties) => {
    const url = 'https://a.klaviyo.com/api/track';
    const payload = {
        token: process.env.KLAVIYO_API_KEY,
        event: eventName,
        customer_properties: customerProperties, // { $email: '...', $first_name: '...' }
        properties: eventProperties // { $value: 99.00, ItemNames: ['...'] }
    };

    try {
        await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/html'
            }
        });
        console.log(`Klaviyo event '${eventName}' tracked successfully.`);
    } catch (error) {
        console.error('Klaviyo tracking error:', error.response?.data || error.message);
    }
};

module.exports = { trackKlaviyoEvent };
```

**Usage (within Stripe webhook handler):**

```javascript
// Inside 'checkout.session.completed' case in webhookRoutes.js
const { trackKlaviyoEvent } = require('../services/klaviyoService');

// ... after retrieving session details
const customerDetails = await stripe.customers.retrieve(session.customer);

await trackKlaviyoEvent(
    'Placed Order',
    { $email: customerDetails.email, $first_name: customerDetails.name.split(' ')[0] },
    { $value: session.amount_total / 100, OrderId: session.id /* ... other order details */ }
);
```

---

## 5. Social Media Pixels & Conversion APIs

**Purpose**: To track conversions from ads for accurate reporting and to build powerful retargeting audiences. A hybrid approach (frontend Pixel + backend Conversion API) is recommended for reliability.

### 5.1. Meta (Facebook) Conversions API (CAPI)

**Environment Variables**

```bash
# .env
META_PIXEL_ID=...
META_ACCESS_TOKEN=...
```

**Implementation**: Send the `Purchase` event from the backend when a Stripe payment is confirmed. This bypasses browser-based blockers.

```javascript
// src/services/metaCapiService.js
const axios = require('axios');
const crypto = require('crypto');

const sendMetaPurchaseEvent = async (eventData) => {
    const { value, currency, user, event_id } = eventData;
    const url = `https://graph.facebook.com/v15.0/${process.env.META_PIXEL_ID}/events?access_token=${process.env.META_ACCESS_TOKEN}`;
    
    // Hash user data for privacy
    const hashedEmail = crypto.createHash('sha256').update(user.email.toLowerCase()).digest('hex');
    const hashedFirstName = crypto.createHash('sha256').update(user.firstName.toLowerCase()).digest('hex');

    const payload = {
        data: [{
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: `${process.env.CLIENT_URL}/order/success`,
            event_id: event_id, // IMPORTANT for deduplication
            user_data: {
                em: [hashedEmail],
                fn: [hashedFirstName],
                client_ip_address: user.ip, // if available
                client_user_agent: user.userAgent, // if available
            },
            custom_data: {
                value: value,
                currency: currency,
            },
        }],
    };

    try {
        await axios.post(url, payload);
        console.log('Meta CAPI Purchase event sent.');
    } catch (error) {
        console.error('Meta CAPI error:', error.response?.data || error.message);
    }
};

module.exports = { sendMetaPurchaseEvent };
```

**Note on Deduplication**: The frontend pixel should also fire a `Purchase` event. To prevent double-counting, both the frontend event and the backend CAPI event must share the **same `event_id`**. This ID should be generated on the server when the checkout session is created and passed to the frontend.

### 5.2. TikTok Events API

The implementation is conceptually identical to Meta's CAPI.

**Environment Variables**

```bash
# .env
TIKTOK_PIXEL_ID=...
TIKTOK_ACCESS_TOKEN=...
```

**Implementation**: Send a `CompletePayment` event from the backend Stripe webhook handler.

```javascript
// src/services/tiktokApiService.js
const axios = require('axios');
const crypto = require('crypto');

const sendTikTokPurchaseEvent = async (eventData) => {
    const { value, currency, user, contents } = eventData;
    const url = `https://business-api.tiktok.com/open_api/v1.3/pixel/track/`;
    
    // Hash user data
    const hashedEmail = crypto.createHash('sha256').update(user.email.toLowerCase()).digest('hex');
    
    const payload = {
        pixel_code: process.env.TIKTOK_PIXEL_ID,
        event: 'CompletePayment',
        event_time: Math.floor(Date.now() / 1000),
        context: {
            user: { email: hashedEmail },
            ip: user.ip,
            user_agent: user.userAgent,
        },
        properties: {
            value: value,
            currency: currency,
            contents: contents, // [{ content_id: 'SKU123', quantity: 1, price: 10.00 }]
        },
    };

    try {
        await axios.post(url, payload, { headers: { 'Access-Token': process.env.TIKTOK_ACCESS_TOKEN } });
        console.log('TikTok Events API Purchase event sent.');
    } catch (error) {
        console.error('TikTok API error:', error.response?.data || error.message);
    }
};

module.exports = { sendTikTokPurchaseEvent };
```

---

## 6. ShipStation Integration (Order Fulfillment)

**Purpose**: To automate the flow of paid orders from our store into ShipStation for fulfillment. We will implement a "Custom Store" integration, where ShipStation polls our API for new orders.

### 6.1. Environment Variables

These credentials will be provided by the user in the ShipStation "Custom Store" setup screen. We use them for Basic Authentication.

```bash
# .env
SHIPSTATION_AUTH_USER=...
SHIPSTATION_AUTH_PASS=...
```

### 6.2. Endpoint 1: Exporting Orders to ShipStation

ShipStation will periodically call this endpoint to fetch new/updated orders. The response **must** be in the specific XML format ShipStation expects.

`GET /api/shipstation/orders`

```javascript
// src/routes/shipstationRoutes.js
const express = require('express');
const { prisma } = require('../db/prisma');
const js2xmlparser = require('js2xmlparser');
const basicAuth = require('express-basic-auth');

const router = express.Router();

router.use(basicAuth({
    users: { [process.env.SHIPSTATION_AUTH_USER]: process.env.SHIPSTATION_AUTH_PASS },
    challenge: true
}));

router.get('/orders', async (req, res) => {
    const { start_date, end_date, page } = req.query;
    const pageSize = 100;

    try {
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: new Date(start_date),
                    lte: new Date(end_date)
                },
                // Fetch orders that need to be shipped
                shipmentStatus: { in: ['pending', 'processing'] }
            },
            include: {
                orderItems: true, // Assuming relation exists
                shippingAddress: true,
            },
            take: pageSize,
            skip: (page - 1) * pageSize
        });

        // Transform Prisma orders into ShipStation XML format
        const formattedOrders = {
            Order: orders.map(order => ({
                OrderID: order.id,
                OrderNumber: order.orderNumber, // A human-friendly order number
                OrderDate: order.createdAt.toISOString().slice(0, 19).replace('T', ' '),
                OrderStatus: 'awaiting_shipment',
                OrderTotal: order.totalAmount,
                ShippingAmount: order.shippingAmount,
                Customer: {
                    CustomerCode: order.customerId,
                    BillTo: { /* ...billing address... */ },
                    ShipTo: {
                        Name: order.shippingAddress.name,
                        Street1: order.shippingAddress.street1,
                        City: order.shippingAddress.city,
                        State: order.shippingAddress.state,
                        PostalCode: order.shippingAddress.postalCode,
                        Country: order.shippingAddress.country,
                        Phone: order.shippingAddress.phone,
                    },
                },
                Items: {
                    Item: order.orderItems.map(item => ({
                        SKU: item.sku,
                        Name: item.name,
                        Quantity: item.quantity,
                        UnitPrice: item.price,
                    })),
                },
            })),
        };
        
        // Add pages attribute to the root element
        formattedOrders['@'] = { pages: Math.ceil(orders.length / pageSize) };

        const xml = js2xmlparser.parse('Orders', formattedOrders);
        res.type('application/xml');
        res.send(xml);

    } catch (error) {
        console.error('ShipStation order export failed:', error);
        res.status(500).send('<error>Internal Server Error</error>');
    }
});

module.exports = router;
```

### 6.3. Endpoint 2: Receiving Shipment Notifications (Webhook)

ShipStation will send a POST request to this endpoint when an order is shipped. We use this to update the order status in our database and trigger a "Your order has shipped" email via Klaviyo.

`POST /api/webhooks/shipstation`

```javascript
// Add to src/routes/webhookRoutes.js
const { xml2js } = require('xml-js');

// This webhook doesn't use Basic Auth by default
router.post('/shipstation', express.text({ type: 'application/xml' }), async (req, res) => {
    try {
        const notification = xml2js(req.body, { compact: true });
        const { OrderNumber, Carrier, TrackingNumber } = notification.ShipNotice;

        const orderId = OrderNumber._text;
        const trackingNumber = TrackingNumber._text;
        const carrier = Carrier._text;

        // 1. Update order status in our database
        const updatedOrder = await prisma.order.update({
            where: { orderNumber: orderId },
            data: {
                shipmentStatus: 'shipped',
                trackingNumber: trackingNumber,
                shippingCarrier: carrier
            }
        });

        if (!updatedOrder) {
            console.warn(`ShipStation webhook: Order ${orderId} not found.`);
            return res.status(404).send('Order not found.');
        }

        // 2. Trigger "Order Shipped" email via Klaviyo
        // await trackKlaviyoEvent('Fulfilled Order', ...);

        console.log(`Order ${orderId} marked as shipped with tracking: ${trackingNumber}`);
        res.status(200).send('OK');

    } catch (error) {
        console.error('ShipStation webhook processing error:', error);
        res.status(500).send('Error processing notification.');
    }
});
```

***
## `.cursorrules`

Create a file named `.cursorrules` in the project's root directory with the following content. This will provide context to the AI for future development tasks.

```
# .cursorrules

# This file provides context and rules for Cursor's AI features.
# It helps the AI understand the project structure, coding standards, and objectives.

# The @ symbol is used to reference specific files or folders.
# The `ls -F` command can be used to list the contents of a directory.

# --- Project Context ---
# The AI should be aware of the overall project goals and specifications.

# Project Name: lastgenie
# Website Type: Ecommerce
# Description: An ecommerce website for the "Genie" brand, a sexual enhancer drink for males and females.
# Primary Business Objectives:
# 1. Build a strong brand community through engaging content and testimonials.
# 2. Establish credibility with scientific information and transparent product details.
# 3. Create a digital hub for future retail launches and product expansions.
# Target Audience: Health-conscious adults aged 30-50 who value personal wellness, intimacy, and discreet online shopping.
# Core Features:
# - Product pages with reviews and ingredient info.
# - Third-party age verification at checkout.
# - "Subscribe and Save" model for 12-packs.
# - Real-time shipping rate calculation.
# - Customer testimonials section and an informative blog.

# --- Tech Stack ---
# The AI must generate code and provide instructions compatible with this stack.

# Frontend: Next.js with Tailwind CSS.
#   - Path: @src/app/
# Backend: Node.js with Express.
#   - Path: @src/
# Database: PostgreSQL with Prisma ORM.
#   - Prisma Schema: @prisma/schema.prisma
# Deployment: AWS Amplify.

# --- File Structure & Naming Conventions ---
# The AI should follow these conventions when creating or modifying files.

# /src
# ├── app/         # Next.js frontend pages and components
# ├── components/  # Shared React components
# ├── lib/         # Shared utility functions (client & server)
# ├── routes/      # Express API route handlers (e.g., paymentRoutes.js, userRoutes.js)
# ├── services/    # Logic for interacting with third-party APIs (e.g., klaviyoService.js)
# ├── db/          # Database connection and Prisma client setup
# └── server.js    # Main Express server entry point

# Use camelCase for variables and functions.
# Use PascalCase for React components and class names.
# API route files should be named according to their resource (e.g., `productRoutes.js`).

# --- Coding Standards & Best Practices ---
# The AI's generated code must adhere to these rules.

# 1. Use modern JavaScript (ES6+), including `async/await` for all asynchronous operations.
# 2. All API keys, secrets, and sensitive credentials must be stored in and read from environment variables (`process.env`). Never hard-code them.
# 3. Implement comprehensive error handling using `try...catch` blocks for all I/O operations, especially API calls and database queries.
# 4. For backend, all new functionality should be modularized into services and routes.
# 5. All incoming webhooks must be cryptographically verified using the provider's signature.
# 6. All user-facing code must be responsive and mobile-first.
# 7. Write JSDoc comments for complex functions and API endpoints to improve code clarity.

# --- Key Documentation ---
# For more detailed context, the AI can refer to these files.

# - Backend Integrations: @docs/backend/third-party-integrations.md
# - Frontend Design System: @docs/frontend/design-system.md
# - API Specification: @docs/api/spec.md
```

## `changelog.md`

Create a file named `changelog.md` in the project's root directory to track AI-assisted changes.

```markdown
# Changelog

This file tracks significant changes and features generated or modified by AI assistance in the `lastgenie` project.

## [Unreleased]

### 2023-10-27

*   **AI: Initial Documentation Generation**
    *   Generated the comprehensive `third-party-integrations.md` document.
    *   Included detailed setup, code examples, and best practices for Stripe, Klaviyo, Meta CAPI, TikTok API, and ShipStation.
    *   Created the initial `.cursorrules` file to establish project context and coding standards for the AI.
    *   Created this `changelog.md` file to begin tracking AI contributions.
```