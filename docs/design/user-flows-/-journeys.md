```markdown
# User Flows & Journeys

| | |
|---|---|
| **Project** | lastgenie |
| **Document Type** | User Flows / Journeys |
| **Category** | Design |
| **Version** | 1.0 |
| **Date** | 2023-10-27 |
| **Status** | Final |

## 1. Introduction

### 1.1. Purpose

This document outlines the primary user journeys for the `lastgenie` ecommerce website. The purpose is to map the step-by-step paths that users will take to accomplish key goals, ensuring a logical, intuitive, and frictionless experience. These flows serve as a blueprint for UI/UX design and backend development, focusing on the critical paths for age verification, standard purchasing, and subscription sign-ups.

### 1.2. Target Audience & Motivation

The user journeys are designed with our ideal customer personas in mind:

*   **Personas:** Health-conscious males and females, aged 30-50. They are digitally savvy, value personal wellness and intimacy, and prefer convenient and discreet online shopping.
*   **Core Motivations:**
    *   To learn about a product that can enhance their personal relationships and well-being.
    *   To feel confident in the product's safety and efficacy through clear information and social proof.
    *   To purchase products easily, discreetly, and with good value.
    *   To conveniently replenish their supply of a product they trust.

## 2. Journey 1: New User - Standard One-Time Purchase

This journey maps the most common flow for a first-time visitor making a single, non-recurring purchase.

*   **Goal:** A new user discovers the site, learns about a product, passes age verification, and successfully completes a one-time purchase.
*   **Entry Points:** Organic Search (e.g., "sexual enhancer drink"), Paid Social Media Ad (Instagram/Facebook), Direct URL.

| Step | User Action | System Response / Frontend View | Technical Notes & Considerations |
| :--- | :--- | :--- | :--- |
| 1 | Lands on Homepage (`/`) | Displays a modern, playful, and energetic landing page. Clear branding, high-quality product imagery, and prominent Call-to-Actions (CTAs) like "Shop Male" and "Shop Female". A top navigation bar is present. | The page must be responsive. Initial server-side rendering (SSR) in Next.js for fast load times and SEO. |
| 2 | Clicks "Shop Now" or a product link. | Navigates the user to the relevant Product Page (`/product/[slug]`). | Dynamic routing in Next.js will be used to handle different product pages. |
| 3 | Reviews the Product Page. | Displays detailed product information: high-res images, benefits, usage instructions, full ingredient list, customer testimonials, and pricing for single bottle (`$10`) and 12-pack (`$99`). | Product data is fetched from the PostgreSQL database via a backend API. Testimonials are displayed to build trust. |
| 4 | Selects a product variant (e.g., "12-Pack") and clicks "Add to Cart". | An overlay or side-drawer (mini-cart) appears, confirming the item has been added. It shows the product, quantity, and subtotal. Provides two clear CTAs: "Continue Shopping" and "Checkout". | The cart state is managed on the client-side (e.g., using React Context or Zustand) and can be synced with the server/database for logged-in users. |
| 5 | Clicks "Checkout" in the mini-cart. | The user is redirected to the first step of the checkout process. | The system checks if the user has a stored "age-verified" session or cookie. If not, it triggers the Age Verification Gate. |
| 6 | **Age Verification Gate** | A modal or full-page overlay appears, stating the legal age requirement (e.g., "You must be 18+ to enter"). It prompts the user to begin verification. | This is a critical legal step. It must block content until passed. |
| 7 | Interacts with the third-party age verification service. | The UI for the third-party service (e.g., Veriff, Jumio) is loaded. The user may be asked to take a photo of their government-issued ID and a selfie. | An API call is made to a backend endpoint (e.g., `POST /api/verify-age`) which handles the integration with the third-party service. |
| 8 | **(Success Path)** Age is successfully verified. | The verification modal closes, and the user proceeds to the checkout page (`/checkout`). | The system receives a success token from the verification service. A secure, httpOnly cookie or session flag is set to `isAgeVerified=true` to prevent repeated checks during the session. For registered users, this status is saved to their user profile in the database. |
| 9 | **(Failure Path)** Age verification fails or user is underage. | An error message is displayed: "We're sorry, we could not verify your age. You must be 18 or older to purchase." The user is blocked from proceeding to checkout. | The user is redirected away from the checkout flow, perhaps back to the homepage, with the checkout button disabled. The cart should remain intact in case they wish to try again. |
| 10 | Enters Shipping Information. | Displays a form for the user's name, email, and shipping address. As the address is entered, the shipping section updates. | The email field will be used for order confirmation (Klaviyo integration) and to prompt account creation. |
| 11 | Selects a Shipping Method. | Once the address is complete, an API call is made to Shippo with the address and cart contents. The available shipping options and real-time rates (e.g., "USPS Ground: $5.99") are displayed. The user selects one. | Backend endpoint `POST /api/shipping-rates` handles the Shippo API integration. |
| 12 | Enters Payment Information. | Displays a secure payment form powered by Stripe Elements for credit/debit card details. | All payment processing is handled on the client-side by Stripe's library to maintain PCI compliance. The backend will only receive a secure token from Stripe. |
| 13 | Reviews order and clicks "Place Order". | The page shows a final summary: items in the cart, shipping address, shipping method, and total cost (including taxes and shipping). | A final backend validation confirms stock and pricing before processing the payment. |
| 14 | Sees Order Confirmation Page. | The user is redirected to a "Thank You" page (`/order-confirmation/[orderId]`) showing their order number and a summary. | An order confirmation email is triggered via a Klaviyo webhook. An `order_placed` event is sent to Google Analytics 4 and social media pixels. The order is written to the `orders` table in the database. |

## 3. Journey 2: User Signs Up for 'Subscribe & Save'

This journey details how a user opts into a recurring subscription for a 12-pack, which is key to increasing Customer Lifetime Value (CLV).

*   **Goal:** A user chooses the subscription option for a 12-pack, understands the recurring terms, and completes the checkout, creating an account in the process.

| Step | User Action | System Response / Frontend View | Technical Notes & Considerations |
| :--- | :--- | :--- | :--- |
| 1-2 | Navigates to a 12-pack Product Page. | (Same as Journey 1). | N/A |
| 3 | Interacts with the purchase options. | The page presents two clear, distinct choices for the 12-pack: <br> • **One-time purchase:** `$99` <br> • **Subscribe & Save (10% off):** `$89` <br> A frequency selector (e.g., "Deliver every 30 days") is visible next to the subscription option. | UI design is critical here to avoid confusion. The "Subscribe & Save" option should be visually appealing, highlighting the savings. Let's assume a 10% discount for this flow. |
| 4 | Selects the "Subscribe & Save" option. | The price on the page updates to `$89`. The "Add to Cart" button text might change to "Add Subscription to Cart". | The client-side state now needs to hold not just the product ID and quantity, but also the subscription status and frequency. |
| 5 | Clicks "Add Subscription to Cart". | The mini-cart slides out. The line item clearly indicates it's a subscription: "Genie 12-Pack (Male) - Subscription". The price is shown as `$89 / month`. | This clarity is essential for transparency and building trust. |
| 6 | Clicks "Checkout". | The user is redirected to the checkout flow. Age verification is triggered if not already passed (see Journey 1, Steps 6-9). | If the user is not logged in, the system knows a subscription requires an account. |
| 7 | Fills out checkout information. | In addition to shipping details, the form includes a **Password** field to create an account. The UI explicitly states: "An account is required to manage your subscription. Please create a password." | On the backend, upon successful checkout, a new user record will be created in the `users` table along with the subscription details. |
| 8 | Enters Payment Information. | The user enters their payment details via Stripe Elements. A clear disclaimer is present: "By placing this order, you agree to our subscription terms. Your card will be charged $89 every 30 days. You can cancel or modify your subscription anytime from your account." | Stripe's API will be used to create a `Customer` and save the payment method for future recurring billing. The backend will create a `Subscription` record linked to the Stripe customer ID. |
| 9 | Reviews and places the subscription order. | The order summary explicitly reiterates the subscription terms: "Total now: $89", and "Renews on [Date] for $89". | This final confirmation step is crucial for compliance and transparency. |
| 10 | Sees Subscription Confirmation Page. | The user is redirected to the confirmation page. The messaging is tailored for a new subscriber: "Welcome to the Genie Club! Your subscription is active." It includes a prominent CTA: "Manage Your Subscription". | A "Subscription Activated" email is triggered via Klaviyo, which includes login details and a link to the account dashboard. |

## 4. Journey 3: Returning Subscriber Manages Subscription

This journey covers the post-purchase experience, which is vital for retention and customer satisfaction.

*   **Goal:** An existing subscriber logs in to their account to modify or cancel their subscription.

| Step | User Action | System Response / Frontend View | Technical Notes & Considerations |
| :--- | :--- | :--- | :--- |
| 1 | Clicks "Login" or "My Account" in the site's main navigation. | The user is taken to the login page (`/login`). | Standard login form for email and password. |
| 2 | Enters credentials and logs in. | After successful authentication, the user is redirected to their Account Dashboard (`/account/dashboard`). | Authentication is handled using JWTs or a similar session management strategy. |
| 3 | Views the Account Dashboard. | The dashboard provides a summary of recent orders, saved addresses, and a clear section or tab titled "My Subscriptions". | This page should be clean and easy to navigate. |
| 4 | Clicks on "Manage Subscriptions". | The user is taken to the subscription management page (`/account/subscriptions`). | This page will list all active and inactive subscriptions. |
| 5 | Selects an active subscription to manage. | The page displays the full details of the selected subscription: product, price, frequency, next charge date, shipping address, and payment method. It presents a list of actions: <br> • `Skip Next Shipment` <br> • `Change Next Shipment Date` <br> • `Update Payment Method` <br> • `Update Shipping Address` <br> • `Cancel Subscription` | These actions will trigger API calls to the backend (e.g., `PUT /api/subscriptions/:id`), which will then communicate with the Stripe Billing API to update the subscription record. |
| 6 | Clicks "Cancel Subscription". | A confirmation modal appears, asking the user to confirm their choice. It may include a retention offer, such as "Pause your subscription for 1 month instead?" or "Get 15% off your next 3 orders." | This is a "cancellation flow" designed to reduce churn. The decision to implement this depends on business strategy. |
| 7 | Confirms cancellation. | The subscription status is updated to "Canceled" in the UI. A confirmation message is displayed on the screen. | The backend cancels the subscription in Stripe and updates the local database record. A "Subscription Canceled" email is triggered via Klaviyo. |
```