```markdown
# **Sitemap & Information Architecture**

| **Project:** | lastgenie |
| --- | --- |
| **Document Type:** | Sitemap & Information Architecture |
| **Category:** | Design |
| **Version:** | 1.0 |
| **Date:** | October 26, 2023 |
| **Author:** | AI Technical Writer |

---

### **Project & Document Context for Cursor IDE**

This document defines the structural blueprint for the `lastgenie` website. It is designed to be used within a Cursor IDE environment. For optimal AI-assisted development, this file should be located in the `/docs` directory of the project repository. It works in conjunction with the following files:

*   **`.cursorrules`**: Located at the project root, this file provides the AI with high-level context about the project, tech stack (`Next.js`, `Node.js`, `Prisma`), and coding standards. This allows the AI to generate code that is consistent with the project's architecture.
*   **`changelog.md`**: Tracks all significant AI-generated or AI-assisted changes, providing a clear history of development iterations.

---

## 1.0 Introduction

### 1.1 Document Purpose

This document outlines the Information Architecture (IA) and Sitemap for the `lastgenie` ecommerce website. Its purpose is to define a clear, intuitive, and scalable site structure that aligns with the primary business objectives: building a strong brand community, establishing credibility through scientific information, and driving sales. This blueprint will guide the design, content, and development phases of the project.

### 1.2 Business Objectives

The website's structure is strategically designed to support the following core goals:

1.  **Build a Strong Brand Community:** Engage customers through a dedicated blog, user-generated testimonials, and interactive features to foster loyalty and advocacy.
2.  **Establish Credibility & Trust:** Provide transparent, science-backed information about product ingredients, benefits, and safety to build consumer confidence.
3.  **Drive Conversions:** Create a frictionless path to purchase, from product discovery to checkout, incorporating features like 'Subscribe & Save' to increase customer lifetime value (CLV).
4.  **Serve as a Scalable Digital Hub:** Establish a foundational architecture that can support future product expansions and retail launches.

### 1.3 Target Audience

The IA is tailored to two primary customer personas:

*   **Male Persona (30-50):** Health-conscious, busy professional who values personal wellness, intimacy, and seeks convenient, discreet online shopping experiences.
*   **Female Persona (30-50):** Values empowerment and self-care, is open to exploring products that enhance personal relationships, and engages with health and wellness content online.

Both personas are digitally savvy, respond to authentic brand storytelling, and prioritize trust and transparency when purchasing personal wellness products.

---

## 2.0 Information Architecture (IA)

### 2.1 IA Principles

The organization of content is guided by the following principles:

*   **Clear & Modern:** The structure is simple and intuitive, reflecting the "modern and playful" brand aesthetic. Navigation labels are straightforward and predictable.
*   **Trust-Centric:** Pages dedicated to scientific information, detailed FAQs, and authentic testimonials are given prominence to address potential customer hesitation and build trust.
*   **Community-Focused:** The architecture creates dedicated spaces (`/community`, `/blog`) for content that fosters connection and conversation, moving beyond a purely transactional experience.
*   **Conversion-Oriented:** The user journey from discovery to purchase is optimized. Product information is comprehensive, and key calls-to-action (CTAs) are strategically placed.
*   **Scalable:** The structure uses a modular approach (e.g., dynamic routing for products and blog posts) that can easily accommodate new products, content categories, and features in the future.

### 2.2 Content Hierarchy

Content is grouped into three logical pillars that directly map to user needs and business goals:

1.  **Shop (Conversion):** All product-related information, purchasing options, and the checkout flow.
    *   Products: Genie for Him, Genie for Her.
    *   Purchase Options: Single bottle, 12-pack, Subscribe & Save.
    *   Core Features: Detailed descriptions, pricing, reviews, checkout.

2.  **Learn (Trust & Education):** Content designed to educate users and build credibility.
    *   The Science: Ingredient deep-dives, safety information.
    *   Blog: Articles on sexual wellness, lifestyle, and product benefits.
    *   FAQ: Answers to common questions.

3.  **Connect (Community):** Content that fosters a sense of community and social proof.
    *   Testimonials: User stories and reviews.
    *   About Us: The brand's mission and story.
    *   Contact: Direct line for user support and feedback.

---

## 3.0 Sitemap

The following sitemap details the pages and structure of the `lastgenie` website.

### 3.1 Visual Sitemap (Hierarchical Tree)

```
/ (Home)
├── /shop
│   ├── /shop/genie-for-him  (Dynamic Product Page)
│   └── /shop/genie-for-her  (Dynamic Product Page)
│
├── /community
│   ├── /blog
│   │   └── /blog/[slug]     (Dynamic Blog Post Page)
│   └── /testimonials
│
├── /science
│
├── /about
│
├── /faq
│
├── /contact
│
├── /cart
│
├── /checkout
│
├── /account
│   ├── /account/profile
│   ├── /account/orders
│   └── /account/subscriptions
│
└── Legal & Utility (Footer Links)
    ├── /privacy-policy
    └── /terms-of-service
```

### 3.2 Detailed Sitemap Breakdown

<details>
<summary><strong>/ (Home)</strong></summary>

*   **URL:** `/`
*   **Page Title:** Genie: Unleash Your Potential | Modern Sexual Wellness
*   **Purpose:** To captivate visitors, introduce the brand's playful and empowering ethos, and guide them toward key discovery paths (Shop, Science, Community).
*   **Content:**
    *   **Section 1 (Hero):** Energetic, visually-driven banner with a strong headline and a primary CTA: "Shop Now".
    *   **Section 2 (Product Intro):** A concise introduction to "Genie for Him" and "Genie for Her" with direct links to the product pages.
    *   **Section 3 (Social Proof):** A rotating carousel of top customer testimonials.
    *   **Section 4 (Content Teaser):** Snippets from recent blog posts to drive traffic to the `/blog`.
*   **Technical Notes:** Static page generated via Next.js. Testimonials can be fetched statically at build time for performance.

</details>

<details>
<summary><strong>/shop (Shop All)</strong></summary>

*   **URL:** `/shop`
*   **Page Title:** Shop Genie | Sexual Enhancement Drinks for Him & Her
*   **Purpose:** To present all available products in a clean, easy-to-browse format.
*   **Content:**
    *   Product cards for "Genie for Him" and "Genie for Her".
    *   Each card displays the product image, name, a brief tagline, and price.
    *   Clear CTAs on each card: "View Details".
*   **Technical Notes:** Fetches product summary data from the database via Prisma.

</details>

<details>
<summary><strong>/shop/[slug] (Product Detail Page)</strong></summary>

*   **URL:** `/shop/genie-for-him`, `/shop/genie-for-her`
*   **Page Title:** Shop [Product Name] | Genie
*   **Purpose:** The primary conversion page. Provides comprehensive information to persuade the user to purchase.
*   **Content:**
    *   **Section 1 (Product Gallery & Purchase):**
        *   High-quality product images.
        *   Product Name, short description, price ($10).
        *   Quantity selector.
        *   CTA: "Add to Cart".
        *   **12-Pack Option:** A distinct section or variant selector for the 12-pack ($99).
        *   **Subscribe & Save:** A toggle/option to subscribe to the 12-pack for a discount (e.g., 15% off).
    *   **Section 2 (Detailed Information):**
        *   Tabs for: "Description", "Ingredients", "How to Use", "Reviews".
        *   Full ingredient list with links to the `/science` page for more details.
        *   Customer reviews fetched from the database.
*   **Technical Notes:** A dynamic route in Next.js. The `[slug]` will be used to fetch the corresponding product data from the PostgreSQL database using Prisma. The 'Subscribe & Save' functionality will integrate with Stripe's subscription billing API.

</details>

<details>
<summary><strong>/community, /blog, /testimonials</strong></summary>

*   **URL:** `/community`, `/blog`, `/testimonials`
*   **Page Titles:** "Our Community", "The Genie Blog", "Genie Testimonials"
*   **Purpose:** To build the brand community and provide social proof.
*   **Content:**
    *   **/community:** A landing page introducing the blog and testimonials sections, framing them as a space for connection and learning.
    *   **/blog:** A grid or list of blog post excerpts with featured images, titles, and dates. Includes category filters.
    *   **/blog/[slug]:** The full blog post page.
    *   **/testimonials:** A curated page of powerful customer quotes, stories, and potentially user-submitted videos/photos (with consent).
*   **Technical Notes:** Blog posts will be managed via a headless CMS or stored as Markdown files in the repo and fetched dynamically using Next.js. `[slug]` will correspond to the post's URL.

</details>

<details>
<summary><strong>/science (The Science Behind Genie)</strong></summary>

*   **URL:** `/science`
*   **Page Title:** The Science Behind Genie | Ingredients & Safety
*   **Purpose:** To establish credibility and trust by being transparent about the product's formulation.
*   **Content:**
    *   An overview of the brand's commitment to quality and safety.
    *   Detailed breakdown of key ingredients, their purpose, and sourcing.
    *   Links to any available third-party studies or scientific literature that supports the ingredient claims.
    *   Information on manufacturing standards.
*   **Technical Notes:** A static page, easily updatable as new research or information becomes available.

</details>

<details>
<summary><strong>/cart & /checkout</strong></summary>

*   **URL:** `/cart`, `/checkout`
*   **Page Titles:** "Your Cart", "Secure Checkout"
*   **Purpose:** To provide a seamless and secure transaction process.
*   **Content:**
    *   **/cart:** View items, update quantities, remove items. Displays a subtotal and a **real-time shipping cost estimate** via the Shippo API.
    *   **/checkout:** A multi-step process:
        1.  Shipping Information.
        2.  Shipping Method (rates pulled from Shippo).
        3.  Payment (Stripe integration).
        4.  **Age Verification:** A modal or step that integrates with a third-party age verification service before payment can be completed.
        5.  Order Review & Confirmation.
*   **Technical Notes:** These are client-side heavy pages that will manage state and interact with multiple third-party APIs (Stripe, Shippo, Age Verification).

</details>

<details>
<summary><strong>/account/* (User Account)</strong></summary>

*   **URL:** `/account`, `/account/profile`, `/account/orders`, `/account/subscriptions`
*   **Page Title:** "My Account"
*   **Purpose:** To allow registered users to manage their personal information, orders, and subscriptions.
*   **Content:**
    *   A dashboard with links to sub-pages.
    *   **/profile:** Update name, email, password, and default addresses.
    *   **/orders:** View history of past orders with status and details.
    *   **/subscriptions:** The critical hub for managing 'Subscribe & Save'. Users can pause, cancel, or change the frequency of their recurring 12-pack delivery.
*   **Technical Notes:** Protected routes requiring user authentication. All data is fetched from the database based on the authenticated user's ID. Subscription management will interact with the Stripe Billing customer portal or API.

</details>

---

## 4.0 URL & Routing Strategy (Next.js)

The URL structure is designed to be clean, human-readable, and SEO-friendly. We will leverage the Next.js App Router for file-based routing.

### 4.1 URL Naming Conventions

*   Use lowercase letters.
*   Use hyphens (`-`) to separate words.
*   Keep URLs as short and descriptive as possible.
*   Avoid file extensions (e.g., `.html`).

### 4.2 Routing Implementation Example

The file structure within the `app/` directory will directly map to the URL paths:

```
app/
├── page.tsx                  # Renders the Home page at /
├── layout.tsx                # Root layout
├── shop/
│   ├── page.tsx              # Renders the Shop All page at /shop
│   └── [slug]/
│       └── page.tsx          # Renders a dynamic product page, e.g., /shop/genie-for-him
├── blog/
│   ├── page.tsx              # Renders the Blog listing page at /blog
│   └── [slug]/
│       └── page.tsx          # Renders a dynamic blog post, e.g., /blog/our-favorite-recipe
├── checkout/
│   └── page.tsx              # Renders the checkout page at /checkout
└── account/
    ├── layout.tsx            # Layout for all account pages (includes auth check)
    ├── page.tsx              # Renders the main account dashboard at /account
    └── subscriptions/
        └── page.tsx          # Renders subscription management at /account/subscriptions
```

---

## 5.0 Navigation & User Flows

### 5.1 Primary Navigation (Header)

The main header navigation will be consistent across all pages to ensure easy exploration.

*   **Shop** (Dropdown with "For Him", "For Her", "Shop All")
*   **Community** (Dropdown with "Blog", "Testimonials")
*   **The Science**
*   **About**
*   **Icons:** User Account, Shopping Cart

### 5.2 Footer Navigation

The footer will contain secondary, utility, and legal links.

*   **Shop:**
    *   Genie for Him
    *   Genie for Her
*   **Learn:**
    *   The Science
    *   Blog
    *   FAQ
*   **Connect:**
    *   About Us
    *   Contact Us
    *   Testimonials
*   **Legal:**
    *   Privacy Policy
    *   Terms of Service
*   **Social Media Icons & Newsletter Signup**

### 5.3 Key User Flows

**Flow 1: First-Time Purchase of a Single Product**

1.  **Entry:** User lands on the **Homepage (`/`)** from a social media ad.
2.  **Discovery:** Clicks "Shop Now" CTA in the hero section.
3.  **Selection:** Lands on the **Shop page (`/shop`)** and clicks on "Genie for Him".
4.  **Consideration:** On the **Product page (`/shop/genie-for-him`)**, user reads the description, ingredients, and reviews.
5.  **Action:** Clicks "Add to Cart". A mini-cart slides out with a "Proceed to Checkout" button.
6.  **Checkout:** User proceeds to the **Cart (`/cart`)**, confirms the item, and then to **Checkout (`/checkout`)**.
7.  **Compliance:** The age verification modal appears and is successfully completed.
8.  **Completion:** User fills in shipping/payment details and completes the purchase.
9.  **Confirmation:** User is directed to an order confirmation page and receives a confirmation email.

**Flow 2: Subscribing to a 12-Pack**

1.  **Entry:** A returning customer navigates directly to the **Product page (`/shop/genie-for-her`)**.
2.  **Selection:** The user selects the "12-Pack" variant.
3.  **Action:** The user clicks the "Subscribe & Save 15%" option. The UI updates to show the recurring price.
4.  **Add to Cart:** User adds the subscription to their cart.
5.  **Checkout:** The cart and checkout flow clearly indicate that this is a recurring subscription order.
6.  **Completion:** User completes the purchase.
7.  **Management:** The user receives an email with a link to manage their new subscription in their **Account (`/account/subscriptions`)**.
```