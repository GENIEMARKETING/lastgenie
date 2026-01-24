```markdown
# API Contracts: Third-Party Integrations

- **Project:** lastgenie
- **Document Type:** API Contracts
- **Category:** Architecture
- **Version:** 1.0.0
- **Date:** 2023-10-27
- **Author:** AI Technical Writer

---

## 1. Introduction

This document defines the technical specifications and contracts for integrating the `lastgenie` ecommerce platform with essential third-party services. Adherence to these contracts is critical for implementing core functionalities, including age verification, payment processing, and shipping rate calculation.

The following services are covered:

1.  **Age Verification:** **Veriff** - For robust, ID-based age verification to ensure legal compliance.
2.  **Payment Processing:** **Stripe** - For handling one-time purchases and recurring 'Subscribe and Save' models.
3.  **Shipping & Fulfillment:** **Shippo** - For real-time shipping rate calculation at checkout.

## 2. General Integration Principles

All integrations must adhere to the following principles to ensure security, reliability, and maintainability.

### 2.1. Authentication

- **API Keys:** All credentials (API keys, secret keys, webhook signing secrets) must **not** be hard-coded. They must be stored as environment variables (e.g., `STRIPE_SECRET_KEY`, `VERIFF_API_KEY`, `SHIPPO_API_TOKEN`) and accessed via `process.env` in the Node.js backend.
- **Key Rotation:** A process for rotating API keys should be established as part of the operational security policy.

### 2.2. Error Handling

- **Resilience:** API calls to third-party services must be wrapped in `try...catch` blocks to handle network failures, timeouts, or API errors gracefully.
- **User Feedback:** In case of a failure that impacts the user (e.g., payment or shipping calculation fails), the backend should respond with a clear error message and an appropriate HTTP status code (e.g., `503 Service Unavailable`) to the frontend, which should then display a user-friendly message.
- **Logging:** All failed API requests and unexpected responses must be logged with sufficient context (e.g., request body, error response) for debugging.

### 2.3. Webhook Security

- **Signature Verification:** All incoming webhooks from third-party services **must** be verified using their respective signature-checking mechanisms. Unverified webhooks must be discarded immediately with a `400 Bad Request` response. This prevents replay attacks and ensures the request originated from the trusted service.

---

## 3. Age Verification: Veriff

Veriff provides ID-based identity verification, which is required to ensure customers are of legal age to purchase `lastgenie` products.

### 3.1. Integration Flow

1.  **Initiation:** At checkout, before payment, the user is prompted to verify their age.
2.  **Session Creation:** The `lastgenie` backend sends a `POST` request to the Veriff API to create a verification session. This request includes a callback URL and a unique `vendorData` identifier (e.g., our internal `orderId` or a temporary session ID).
3.  **Redirection:** The backend receives a `verificationUrl` from Veriff and sends it to the frontend. The frontend redirects the user to this URL.
4.  **Verification:** The user completes the ID verification process on Veriff's secure platform.
5.  **Notification (Webhook):** Upon completion (or failure), Veriff sends a `POST` request (webhook) to our pre-configured `verification.callback` endpoint.
6.  **Fulfillment:** Our backend verifies the webhook signature, checks the verification `status`, and updates the order status in the PostgreSQL database. If approved, the user is allowed to proceed to payment.

### 3.2. API Contract: Create Session

- **Method:** `POST`
- **Endpoint:** `https://api.veriff.me/v1/sessions`
- **Headers:**
    - `Content-Type: application/json`
    - `X-AUTH-CLIENT: <YOUR_VERIFF_API_KEY>`

- **Request Body:**

```json
{
  "verification": {
    "callback": "https://api.lastgenie.com/webhooks/veriff",
    "person": {
      "firstName": "John",
      "lastName": "Smith"
    },
    "document": {
      "country": "US",
      "type": "ID_CARD"
    },
    "vendorData": "order_12345_abcde",
    "timestamp": "2023-10-27T10:00:00.000Z"
  }
}
```

- **Success Response (201 Created):**

```json
{
  "status": "success",
  "verification": {
    "id": "e33dcce3-3331-474c-8f86-772f1e018698",
    "url": "https://magic.veriff.me/v/verification-session-url",
    "vendorData": "order_12345_abcde",
    "status": "created",
    "sessionToken": "..."
  }
}
```

### 3.3. API Contract: Webhook Handling

- **Endpoint:** `POST /webhooks/veriff`
- **Description:** Veriff sends event data to this endpoint. We are primarily interested in the final decision events.
- **Webhook Payload Example (`approved`):**

```json
{
  "status": "success",
  "verification": {
    "id": "e33dcce3-3331-474c-8f86-772f1e018698",
    "status": "approved",
    "vendorData": "order_12345_abcde",
    "person": {
        "dateOfBirth": "1990-01-15"
    },
    "decisionTime": "2023-10-27T10:05:00.000Z"
  }
}
```
- **Actionable Statuses:**
    - `approved`: The user's age is verified. Proceed with the order.
    - `declined`: The user is not of age or the ID is invalid. Block the order and inform the user.
    - `resubmission_requested`: Inform the user that they need to try the verification process again.

---

## 4. Payment Gateway: Stripe

Stripe will process all payments, including one-time purchases and recurring subscriptions for the 'Subscribe and Save' model. We will use Stripe Checkout for a secure, PCI-compliant, and hosted payment flow.

### 4.1. Product & Price Setup (Prerequisite)

Before integration, the following Products and Prices must be created in the Stripe Dashboard:

| Product Name                | Stripe Product ID  | Description                           |
| --------------------------- | ------------------ | ------------------------------------- |
| Genie - Male Enhancer       | `prod_male_single` | 50ML Bottle                           |
| Genie - Female Enhancer     | `prod_female_single`| 50ML Bottle                           |
| Genie - Male Enhancer Pack  | `prod_male_pack`   | 12-Pack of 50ML Bottles               |
| Genie - Female Enhancer Pack| `prod_female_pack` | 12-Pack of 50ML Bottles               |

| Price Type                  | Corresponds To             | Price      | Recurring | Stripe Price ID             |
| --------------------------- | -------------------------- | ---------- | --------- | --------------------------- |
| One-Time (Male)             | Genie - Male Enhancer      | $10.00 USD | No        | `price_male_single_1000`    |
| One-Time (Female)           | Genie - Female Enhancer    | $10.00 USD | No        | `price_female_single_1000`  |
| One-Time (Male Pack)        | Genie - Male Enhancer Pack | $99.00 USD | No        | `price_male_pack_9900`      |
| One-Time (Female Pack)      | Genie - Female Enhancer Pack| $99.00 USD | No        | `price_female_pack_9900`    |
| Subscription (Male Pack)    | Genie - Male Enhancer Pack | $99.00 USD | Monthly   | `price_male_pack_sub_9900`  |
| Subscription (Female Pack)  | Genie - Female Enhancer Pack| $99.00 USD | Monthly   | `price_female_pack_sub_9900`|

### 4.2. API Contract: Create Checkout Session

This single endpoint is used for both one-time and subscription purchases, controlled by the `mode` parameter.

- **Method:** `POST`
- **Endpoint:** `https://api.stripe.com/v1/checkout/sessions`
- **Headers:**
    - `Authorization: Bearer <YOUR_STRIPE_SECRET_KEY>`
    - `Content-Type: application/x-www-form-urlencoded`

#### 4.2.1. Request Body (One-Time Purchase)

```javascript
// Node.js/Express example of building the request
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  success_url: 'https://lastgenie.com/order/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://lastgenie.com/cart',
  line_items: [
    {
      price: 'price_male_single_1000', // Stripe Price ID
      quantity: 1,
    },
  ],
  metadata: {
    orderId: 'order_12345_abcde'
  },
  // Automatically calculate taxes
  automatic_tax: { enabled: true },
  // Collect shipping address and calculate rates
  shipping_address_collection: {
      allowed_countries: ['US', 'CA'],
  },
});
```

#### 4.2.2. Request Body (Subscription Purchase)

```javascript
// Node.js/Express example of building the request
const session = await stripe.checkout.sessions.create({
  mode: 'subscription', // The key difference
  success_url: 'https://lastgenie.com/order/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://lastgenie.com/cart',
  line_items: [
    {
      price: 'price_male_pack_sub_9900', // The recurring Stripe Price ID
      quantity: 1,
    },
  ],
  metadata: {
    orderId: 'order_12345_abcde'
  },
  automatic_tax: { enabled: true },
  shipping_address_collection: {
      allowed_countries: ['US', 'CA'],
  },
});
```

### 4.3. API Contract: Webhook Handling

- **Endpoint:** `POST /webhooks/stripe`
- **Key Events to Handle:**
    - `checkout.session.completed`: Fired when a checkout session is successfully completed. This is the primary trigger to confirm an order (both one-time and the first payment of a subscription) and initiate the fulfillment process.
    - `invoice.paid`: Fired when a subscription renewal payment is successful. Use this to trigger fulfillment for recurring orders.
    - `invoice.payment_failed`: Fired when a subscription renewal fails. Use this to notify the customer and update their subscription status.
    - `customer.subscription.deleted`: Fired when a subscription is canceled. Update the customer's status in our database.

---

## 5. Shipping & Fulfillment: Shippo

Shippo is used to fetch real-time shipping rates from carriers like USPS, FedEx, and UPS during checkout.

### 5.1. Parcel Definitions

Standard parcel dimensions and weights are defined here to ensure consistent rate calculations.

| Item                        | SKU Suffix | Weight (lbs) | Dimensions (inches L x W x H) |
| --------------------------- | ---------- | ------------ | ----------------------------- |
| Single Bottle (Male/Female) | `-single`  | 0.3 lbs      | 2 x 2 x 4                     |
| 12-Pack (Male/Female)       | `-pack`    | 4.0 lbs      | 8 x 6 x 4                     |

*Note: The backend must aggregate the total weight and determine the appropriate parcel size for multi-item carts.*

### 5.2. Integration Flow

1.  **Address Entry:** On the checkout page, the user enters their shipping address.
2.  **Rate Request:** The frontend sends the cart contents and the destination address to our backend endpoint (e.g., `POST /api/shipping-rates`).
3.  **Shippo API Call:** The `lastgenie` backend constructs a `Shipment` object and sends it to the Shippo API.
4.  **Rate Response:** Shippo returns a list of available shipping rates.
5.  **Display Rates:** Our backend formats the rates and sends them to the frontend for the user to select their preferred option.

### 5.3. API Contract: Get Shipping Rates

- **Method:** `POST`
- **Endpoint:** `https://api.goshippo.com/shipments/`
- **Headers:**
    - `Authorization: ShippoToken <YOUR_SHIPPO_API_TOKEN>`
    - `Content-Type: application/json`

- **Request Body:**

```json
{
  "address_from": {
    "name": "Genie Fulfillment",
    "street1": "123 Vitality Way",
    "city": "Austin",
    "state": "TX",
    "zip": "78701",
    "country": "US"
  },
  "address_to": {
    "name": "John Smith",
    "street1": "100 Customer Lane",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  },
  "parcels": [
    {
      "length": "8",
      "width": "6",
      "height": "4",
      "distance_unit": "in",
      "weight": "4",
      "mass_unit": "lb"
    }
  ],
  "async": false
}
```

- **Success Response (201 Created):**
The most important field is `rates`, which contains an array of shipping options.

```json
{
  "status": "SUCCESS",
  "object_created": "2023-10-27T12:00:00.000Z",
  "address_from": { ... },
  "address_to": { ... },
  "parcels": [ ... ],
  "rates": [
    {
      "object_id": "rate_id_1",
      "amount": "8.50",
      "currency": "USD",
      "provider": "USPS",
      "servicelevel": {
        "name": "Priority Mail",
        "token": "usps_priority"
      },
      "estimated_days": 2,
      "attributes": ["BEST_VALUE"]
    },
    {
      "object_id": "rate_id_2",
      "amount": "25.10",
      "currency": "USD",
      "provider": "UPS",
      "servicelevel": {
        "name": "Next Day Air",
        "token": "ups_next_day_air"
      },
      "estimated_days": 1,
      "attributes": []
    }
  ],
  ...
}
```

- **Backend Logic:** The backend should parse the `rates` array, selecting relevant information (`provider`, `servicelevel.name`, `amount`, `estimated_days`) to send to the frontend.
```markdown