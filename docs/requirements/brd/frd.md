Of course. Here is the comprehensive BRD/FRD for the lastgenie project, written in Markdown and tailored for your specified development environment.

***

# Business & Functional Requirements Document (BRD/FRD)
- **Project:** lastgenie
- **Brand:** Genie
- **Document Type:** Requirements
- **Version:** 1.0
- **Date:** October 26, 2023

---

## 1. Introduction

### 1.1 Document Purpose
This document outlines the business objectives and functional requirements for the development of the "lastgenie" e-commerce website. It serves as the primary guide for designers, developers, and stakeholders, detailing the project's scope, features, and technical specifications. The goal is to ensure all parties have a shared understanding of the final product.

### 1.2 Project Overview
"lastgenie" is a direct-to-consumer e-commerce website for the brand "Genie." The site will sell a sexual enhancer drink designed for both male and female consumers. The core functionality includes product sales, a recurring subscription model, content marketing to build community and trust, and robust age verification to ensure legal compliance.

### 1.3 Target Audience
The website design, content, and user experience will be tailored to the following customer personas:

*   **Male Persona:**
    *   **Age:** 30-50
    *   **Lifestyle:** Health-conscious, busy professional, values personal wellness and intimacy.
    *   **Values:** Seeks convenient, effective, and discreet solutions.
    *   **Online Habits:** Active on social media, reads health/wellness blogs, prefers discreet online shopping.

*   **Female Persona:**
    *   **Age:** 30-50
    *   **Lifestyle:** Values empowerment, self-care, and open exploration of products that enhance personal relationships.
    *   **Values:** Seeks trustworthy, modern, and relatable brands.
    *   **Online Habits:** Engages with social media communities, follows health and lifestyle influencers, responsive to targeted online marketing.

### 1.4 Scope

#### 1.4.1 In-Scope
*   Website design and development based on the specified tech stack.
*   Four distinct product SKUs with individual product pages.
*   A 'Subscribe and Save' feature for 12-pack products.
*   Standard e-commerce checkout flow with integrated payment and shipping.
*   Robust, third-party age verification system.
*   User account creation and management (profile, order history, subscription management).
*   Content sections: Blog, FAQ, and The Science.
*   Integration with specified third-party services (Stripe, Shippo, Klaviyo, GA4).
*   Responsive design for desktop, tablet, and mobile devices.
*   Dark Mode support.

#### 1.4.2 Out-of-Scope
*   Development of a mobile application.
*   Integration with marketplaces (e.g., Amazon).
*   Multi-language or multi-currency support beyond USD.
*   Advanced community features like a user forum or live chat (beyond a contact form).
*   Physical product fulfillment and inventory management (handled by a fulfillment service).

---

## 2. Business Requirements

### 2.1 Business Objectives
*   **Primary Objective: Build a Strong Brand Community:** Engage customers through informative content (Blog, FAQ, Science), user testimonials, and a modern, playful brand presence to foster loyalty and repeat business.
*   **Secondary Objective: Establish Credibility and Trust:** Reinforce brand trustworthiness by providing transparent, science-backed information about product ingredients and benefits.
*   **Tertiary Objective: Create Predictable Revenue:** Implement a 'Subscribe and Save' model to increase customer lifetime value (CLV) and establish a recurring revenue stream.
*   **Future Goal:** Serve as a digital hub and proof-of-concept for future retail launches and product line expansions.

### 2.2 Success Metrics
The success of the website will be measured by the following Key Performance Indicators (KPIs):
*   **Conversion Rate:** Percentage of visitors who complete a purchase.
*   **Subscription Rate:** Percentage of 12-pack orders that are subscriptions.
*   **Customer Lifetime Value (CLV):** Average total revenue generated per customer.
*   **Returning Customer Rate:** Percentage of customers who make more than one purchase.
*   **Google Analytics 4 Engagement Metrics:** User engagement time, content views (Blog, Science), and user retention.

### 2.3 Brand & Design Guidelines
*   **Aesthetic:** Modern, playful, energetic, empowering. The design should feel approachable and fun, avoiding a sterile or overly clinical feel.
*   **Emotional Tone:** Inviting, trustworthy, and confident. Messaging should be clear, positive, and focused on wellness and vitality.
*   **Layout:** A modern landing page layout with clear calls-to-action.
*   **Navigation:** Fixed top navigation bar for easy access to key pages.
*   **Color Scheme:**
    *   Primary: `#1E40AF` (Strong Blue)
    *   Secondary: `#14B8A6` (Teal)
    *   Accent: `#FACC15` (Amber)
    *   Background: `#F3F4F6` (Light Gray)
    *   Text: `#1F2937` (Charcoal Gray)

---

## 3. Functional Requirements (FRD)

### 3.1 Age Verification (Priority: High)
*   **FR-3.1.1:** Upon first visiting the site, the user must be presented with an age verification gate (e.g., a modal overlay).
*   **FR-3.1.2:** The gate must block interaction with the rest of the site until the user's age is verified.
*   **FR-3.1.3:** The system will use a third-party verification service (e.g., Age-Gate.io, Veratad) that validates age through reliable methods, not a simple birthdate entry form.
*   **FR-3.1.4:** Once verified, a browser session or cookie will be used to prevent the user from needing to re-verify on subsequent visits within a reasonable timeframe (e.g., 30 days).
*   **FR-3.1.5:** The age verification check must be re-validated at the checkout stage before a payment can be processed to ensure compliance.

### 3.2 Product Catalog & SKUs
*   **FR-3.2.1:** The system must support the following four product SKUs:

| Product Name                  | SKU              | Size  | Price  |
| ----------------------------- | ---------------- | ----- | ------ |
| Genie - Male Formula          | `GEN-MALE-50ML`  | 50ML  | $10.00 |
| Genie - Female Formula        | `GEN-FEMALE-50ML`| 50ML  | $10.00 |
| Genie - Male Formula 12-Pack  | `GEN-MALE-12PK`  | 12x50ML | $99.00 |
| Genie - Female Formula 12-Pack| `GEN-FEMALE-12PK`| 12x50ML | $99.00 |

*   **FR-3.2.2:** The website will feature a main shop page that displays all available products.
*   **FR-3.2.3:** Each product listing on the shop page must display the product image, name, and price.

### 3.3 Product Detail Pages (PDP) (Priority: High)
*   **FR-3.3.1:** Each SKU must have a unique URL and a dedicated Product Detail Page (e.g., `/product/genie-male-formula`).
*   **FR-3.3.2:** The PDP must display:
    *   High-quality product images.
    *   Product name.
    *   Price.
    *   A detailed, engaging product description.
    *   A clear list of ingredients and their benefits.
    *   Instructions for proper usage.
    *   A quantity selector.
    *   An "Add to Cart" button.
*   **FR-3.3.3:** For 12-pack SKUs (`GEN-MALE-12PK`, `GEN-FEMALE-12PK`), the PDP must also include the 'Subscribe and Save' option.
*   **FR-3.3.4:** A section for customer reviews and ratings must be present on the PDP.

### 3.4 'Subscribe and Save' Model (Priority: High)
*   **FR-3.4.1:** On the PDP for 12-pack SKUs, users must be presented with two purchase options: "One-time purchase" and "Subscribe & Save".
*   **FR-3.4.2:** Selecting "Subscribe & Save" must clearly display the discounted price and the billing frequency (e.g., "Delivered every 30 days"). A 10-15% discount is recommended for subscriptions.
*   **FR-3.4.3:** The shopping cart and checkout summary must clearly distinguish between one-time purchases and subscription items, showing the recurring total.
*   **FR-3.4.4:** The subscription will be managed via the Stripe Billing portal, which will be accessible to customers through their account dashboard.
*   **FR-3.4.5:** Customers must be able to view, pause, cancel, or modify their subscriptions (e.g., skip a shipment) from their account dashboard.

### 3.5 Shopping Cart & Checkout
*   **FR-3.5.1:** Users can add/remove items and adjust quantities in their shopping cart.
*   **FR-3.5.2:** The checkout process will be a single page or a streamlined multi-step process.
*   **FR-3.5.3:** The checkout page must include fields for shipping address, billing address, and payment information.
*   **FR-3.5.4:** Shipping costs must be calculated in real-time using the **Shippo API** based on the customer's address and cart contents.
*   **FR-3.5.5:** Payment processing will be handled securely via the **Stripe** integration.
*   **FR-3.5.6:** Upon successful order completion, the user will be directed to an order confirmation page and receive a confirmation email.

### 3.6 Content Management Sections (Priority: Medium)
*   **FR-3.6.1:** **Blog (`/blog`):**
    *   A section for articles on topics related to sexual health, wellness, intimacy, and product usage.
    *   Each blog post will have a unique page with support for text, images, and embedded videos.
    *   A main blog page will list all articles in reverse chronological order.
*   **FR-3.6.2:** **FAQ (`/faq`):**
    *   A dedicated page to answer common questions about the product, ingredients, shipping, subscriptions, and usage.
    *   Questions should be organized into categories (e.g., Product, Orders, Health).
*   **FR-3.6.3:** **The Science (`/science`):**
    *   A dedicated section to build trust and credibility.
    *   This page will detail the science behind the key ingredients, their intended effects, and safety.
    *   It should include references or links to relevant scientific studies or data where applicable.

### 3.7 Customer Testimonials/Reviews (Priority: Medium)
*   **FR-3.7.1:** Verified buyers can leave a star rating (1-5) and a written review for products they have purchased.
*   **FR-3.7.2:** Approved reviews will be displayed on the relevant PDP.
*   **FR-3.7.3:** A dedicated testimonials page or a section on the homepage may be used to showcase a curated selection of positive reviews to build social proof.

---

## 4. Non-Functional Requirements (NFR)

*   **NFR-4.1 Performance:** The website must achieve a Google PageSpeed Insights score of 80+ for both mobile and desktop. Pages should load in under 3 seconds.
*   **NFR-4.2 Security:** All user data, especially PII and payment information, must be handled securely. The site must use HTTPS. All dependencies must be regularly scanned for vulnerabilities.
*   **NFR-4.3 Usability:** The website must be responsive and provide an optimal viewing experience across desktop, tablet, and mobile devices. Navigation must be intuitive.
*   **NFR-4.4 Integrations:** The platform must successfully integrate with:
    *   **Payment:** Stripe
    *   **Shipping:** Shippo (for real-time rates from USPS, FedEx, UPS)
    *   **Email Marketing:** Klaviyo
    *   **Analytics:** Google Analytics 4 (GA4)
    *   **Advertising:** Meta Pixel, TikTok Pixel
    *   **Fulfillment:** ShipStation
*   **NFR-4.5 SEO:** URLs should be human-readable and SEO-friendly. Basic on-page SEO elements (meta titles, descriptions, alt tags) must be configurable in the CMS. A `sitemap.xml` and `robots.txt` must be auto-generated.

---

## 5. Technical Specifications

### 5.1 Technology Stack
*   **Frontend:** Next.js with Tailwind CSS
*   **Backend:** Node.js with Express.js
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Deployment:** AWS Amplify
*   **Development IDE:** Cursor

### 5.2 Data Models (Example Prisma Schema)
Below is a simplified example of the data models to be used.

```prisma
// schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String    // Hashed password
  stripeCustomerId String? @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  orders        Order[]
  subscriptions Subscription[]
}

model Product {
  id           String   @id @default(cuid())
  sku          String   @unique
  name         String
  description  String   @db.Text
  price        Decimal
  imageUrl     String
  isPack       Boolean  @default(false) // True for 12-packs
  createdAt    DateTime @default(now())
}

model Order {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  total     Decimal
  status    String   // e.g., PENDING, SHIPPED, DELIVERED
  createdAt DateTime @default(now())
  // ... other fields like shippingAddress
}

model Subscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  stripeSubId String @unique
  status    String   // e.g., ACTIVE, PAUSED, CANCELED
  productId String
  createdAt DateTime @default(now())
}
```

---

## Appendix A: Development Environment & Practices

### A.1 Cursor IDE Integration (.cursorrules)
To ensure the AI understands the project context within the Cursor IDE, a `.cursorrules` file will be created at the project root with the following content:

```
As an expert full-stack developer, you are building a Next.js e-commerce site called "lastgenie".

Project Context:
- **Project:** lastgenie, a sexual enhancer drink brand.
- **Aesthetic:** Modern, playful, empowering.
- **Frontend:** Next.js with TypeScript and Tailwind CSS.
- **Backend:** Node.js/Express API (may be serverless functions).
- **Database/ORM:** PostgreSQL with Prisma.
- **Deployment:** AWS Amplify.
- **Core Features:** Product sales, 'Subscribe & Save' via Stripe, age verification, blog/content pages.
- **File Naming:** Use kebab-case for files and folders (e.g., `product-card.tsx`). Component names should be PascalCase (e.g., `ProductCard`).
- **Styling:** Use Tailwind CSS utility classes directly in the JSX. Avoid creating separate CSS/SCSS files unless absolutely necessary for complex animations or base styles.
- **State Management:** Use React Hooks (`useState`, `useContext`, `useReducer`). For global state, prefer Zustand or React Context over Redux for simplicity.
- **Code Style:** Follow standard TypeScript and React best practices. Use Prettier for code formatting. Add JSDoc comments to all major functions and components.
```

### A.2 Changelog Management
A `changelog.md` file will be maintained at the project root to track significant changes, especially those generated or modified by the AI. This provides a clear history of development progress.

**Example `changelog.md` Entry:**

```markdown
# Changelog

## [1.0.0] - 2023-10-26

### Added
- **AI:** Generated initial Product Detail Page component (`/components/product/product-detail.tsx`) with layout and styling via Tailwind CSS.
- **AI:** Created the Prisma schema for `User`, `Product`, and `Order` models.
- **Dev:** Implemented the basic Next.js API route for fetching a single product.
```

### A.3 Naming Conventions
*   **Files/Folders:** `kebab-case` (e.g., `user-profile`, `api-routes`)
*   **React Components:** `PascalCase` (e.g., `ProductCard.tsx`, `AgeVerificationModal.tsx`)
*   **Variables/Functions:** `camelCase` (e.g., `fetchProduct`, `cartTotal`)
*   **API Endpoints:** RESTful, `kebab-case` (e.g., `/api/products/{sku}`)
*   **CSS/Tailwind:** Use utility-first classes. Custom classes should be prefixed with `genie-` (e.g., `.genie-gradient-text`).