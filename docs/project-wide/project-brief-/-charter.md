Of course. Here is the comprehensive Project Brief / Charter for the `lastgenie` website, formatted in Markdown and tailored for your specific requirements.

***

# Project Brief & Charter: lastgenie Ecommerce Website

| | |
|---|---|
| **Project Name:** | lastgenie Ecommerce Platform |
| **Document Type:** | Project Brief / Charter |
| **Version:** | 1.0 |
| **Date:** | 2023-10-27 |
| **Category:** | project-wide |

---

## 1.0 Executive Summary

This document outlines the project plan for the design and development of `lastgenie`, a direct-to-consumer ecommerce website for the "Genie" brand of sexual enhancer drinks. The primary goal is to launch a minimum viable product (MVP) that effectively sells the two core products, builds a strong brand community, and establishes credibility through informative content.

This project is defined by its strict constraints: a **3-month timeline** and a **$500 budget**. Therefore, the scope is tightly controlled to focus on essential, high-impact features. The technical strategy emphasizes a modern, cost-effective stack (Next.js, Node.js, AWS Amplify) to maximize efficiency and performance. The successful completion of this project will provide Genie with a foundational digital presence, enabling initial sales, customer engagement, and a platform for future growth.

## 2.0 Project Goals & Objectives

### 2.1 Business Objectives

*   **Build a Strong Brand Community:** Engage customers through informative content (blog), user-generated testimonials, and interactive features to foster loyalty and advocacy.
*   **Establish Brand Credibility:** Reinforce consumer trust and encourage repeat purchases by providing transparent access to scientific information, ingredient details, and usage guidelines.
*   **Create a Scalable Digital Hub:** Establish a foundational web presence that can support initial sales and serve as a launchpad for future product expansions and potential retail partnerships.

### 2.2 Project Objectives (SMART)

*   **Specific:** Launch a secure, responsive ecommerce website with functionality for product discovery, age verification, purchase, and subscription.
*   **Measurable:** The project will be considered successful upon the public launch of the website with all "high" priority features functional. Success will be further measured by tracking conversion rates, subscription opt-ins, and key analytics post-launch.
*   **Achievable:** The scope is strictly limited to core features achievable within the budget and timeline using the specified technology stack.
*   **Relevant:** The website directly supports the primary business goals of driving initial sales and building a brand foundation.
*   **Time-bound:** The project will be completed and deployed to a live production environment within a 3-month period from the official start date.

## 3.0 Scope

### 3.1 In-Scope Features

The following features represent the complete scope for this initial build:

| Priority | Feature | Description |
|---|---|---|
| **High** | Product Pages | Dedicated pages for the Male and Female enhancers. Includes images, detailed descriptions, ingredient information, pricing, and an "Add to Cart" button. |
| **High** | Secure Checkout | A multi-step checkout process including shipping information, payment processing via **Stripe**, and order confirmation. |
| **High** | Age Verification | A mandatory, robust age verification gate utilizing a third-party service API to ensure legal compliance before checkout. |
| **High** | Subscribe and Save | Functionality for customers to subscribe to recurring deliveries of the 12-packs at a discounted rate. |
| **High** | Shipping Calculator | Integration with **Shippo** to provide real-time shipping rate calculations at checkout based on the customer's location. |
| **Medium** | Customer Testimonials | A dedicated section on the homepage or product pages to display curated customer reviews and build social proof. |
| **Medium** | Informative Blog | A simple, statically-generated blog section to host articles on sexual health, product usage, and brand-related topics. |

### 3.2 Out-of-Scope

To adhere to the budget and timeline, the following features are explicitly **out of scope** for this project phase:

*   Advanced customer accounts (e.g., complex order history, profile management, saved addresses).
*   Internationalization (multi-language or multi-currency support).
*   Complex Content Management System (CMS) for the blog (content will be managed via Markdown files in the codebase).
*   Community forums, live chat, or other real-time interactive features.
*   Gift cards or complex discount/coupon code systems (beyond the subscription discount).
*   Integration with any fulfillment service other than Shippo for rates.

## 4.0 Key Stakeholders & Roles

| Role | Responsibility |
|---|---|
| **Project Sponsor** | Genie Brand Owner |
| **Project Lead** | Lead Developer / Project Manager |

## 5.0 Success Metrics & KPIs

The success of the `lastgenie` website will be measured by the following Key Performance Indicators (KPIs), to be tracked via Google Analytics 4 and the backend database:

*   **Conversion Rate:** Target a 1-2% conversion rate (visitors to customers) within the first 3 months post-launch.
*   **Subscription Adoption Rate:** Target a 15% adoption rate for the "Subscribe and Save" option on all 12-pack purchases.
*   **Average Order Value (AOV):** Track AOV to understand purchasing patterns.
*   **Age Verification Success Rate:** Monitor the pass/fail rate of the age verification system to ensure it is not a significant barrier to legitimate customers.
*   **Website Uptime & Performance:** Maintain >99% uptime and a Google PageSpeed Insights score of 85+ for mobile.

## 6.0 Constraints & Assumptions

### 6.1 Constraints

*   **Budget:** The total budget for design, development, and deployment is strictly capped at **$500**. This budget does not cover ongoing third-party service fees (e.g., AWS hosting, Shippo API usage, age verification service fees) or marketing expenses.
*   **Timeline:** The project must be completed and launched within **3 months**.
*   **Legal Compliance:** The site must implement a robust, non-bypassable age verification system as a prerequisite for purchase.

### 6.2 Assumptions

*   The Project Sponsor will provide all necessary content in a timely manner, including product descriptions, branding assets (logo), scientific data/links, and initial blog posts.
*   The chosen third-party services (Stripe, Shippo, Age Verification API) will have free or low-cost tiers suitable for an initial launch.
*   Feedback and approvals from the Project Sponsor will be provided within 2 business days to maintain the project schedule.
*   The aesthetic and emotional tone (modern, playful) is approved and will not undergo major revisions during development.

## 7.0 Technical Specifications

### 7.1 Technology Stack

*   **Frontend:** Next.js with Tailwind CSS
*   **Backend:** Node.js with Express
*   **Database:** PostgreSQL with Prisma ORM
*   **Deployment:** AWS Amplify
*   **Development IDE:** Cursor

### 7.2 Design & Branding

*   **Mood:** Playful, modern, energetic, empowering, vitality.
*   **Layout:** Single-page landing feel with clear top navigation. Fully responsive with Dark Mode support.
*   **Color Palette:**
    *   Primary: `#1E40AF` (Strong Blue)
    *   Secondary: `#14B8A6` (Teal)
    *   Accent: `#FACC15` (Amber)
    *   Background: `#F3F4F6` (Light Gray)
    *   Text: `#1F2937` (Charcoal Gray)

### 7.3 Core Integrations

*   **Payment Gateway:** Stripe
*   **Shipping Rates:** Shippo API
*   **Email Marketing:** Klaviyo
*   **Analytics:** Google Analytics 4 (GA4), Social Media Pixels (e.g., Meta, TikTok)
*   **Age Verification:** A third-party API (e.g., Age-Gate, Veratad, or similar) to be researched and selected based on cost and reliability.

## 8.0 High-Level Timeline & Milestones

| Phase | Month | Key Milestones |
|---|---|---|
| **Phase 1: Foundation & Backend** | Month 1 | - Project setup, Git repository initialization.<br>- Database schema design with Prisma.<br>- Backend API development for products, cart, and orders.<br>- Initial AWS Amplify project configuration. |
| **Phase 2: Frontend & Integration** | Month 2 | - Build Next.js frontend pages (Home, Product).<br>- Connect frontend to backend API endpoints.<br>- Integrate Stripe for payments.<br>- Integrate Shippo for shipping rates.<br>- Integrate Age Verification API at checkout. |
| **Phase 3: Content, Testing & Launch** | Month 3 | - Populate all website content (text, images, blog posts).<br>- Implement GA4 and marketing pixels.<br>- Conduct end-to-end user acceptance testing (UAT).<br>- Final deployment to production.<br>- Project handover and documentation. |

## 9.0 Project Governance & Communication

*   **Change Management:** All changes to the scope defined in this charter must be formally requested, evaluated for impact on budget and timeline, and approved in writing. A `changelog.md` will be maintained in the project root to track all AI-assisted and manual code changes.
*   **Communication:** A weekly sync-up call will be held to discuss progress, address blockers, and review upcoming tasks. The primary channel for asynchronous communication will be a shared Slack/Discord channel.
*   **Code Standards:** All code will adhere to the standards defined in the `.cursorrules` file to ensure consistency and maintainability, especially when leveraging AI development tools.

---

## 10.0 Appendices

### Appendix A: `.cursorrules` File Content

This file will be placed in the project root to guide the AI development assistant.

```
# .cursorrules

# This file provides context and rules for the AI assistant (Cursor)
# working on the lastgenie project.

# =========================================
# 1. Project Context
# =========================================
# - Project: lastgenie
# - Type: Ecommerce website for a sexual enhancer drink brand.
# - Goal: MVP launch with a tight $500 budget and 3-month timeline. Focus on essentials.
# - Personas: Male/Female, 30-50, health-conscious, seeking personal wellness and intimacy.
# - Brand Vibe: Modern, playful, empowering, trustworthy.

# =========================================
# 2. Tech Stack
# =========================================
# - Frontend: Next.js (App Router), React, Tailwind CSS.
# - Backend: Node.js, Express.js.
# - Database: PostgreSQL with Prisma ORM.
# - Deployment: AWS Amplify.
# - State Management: Use React Context or Zustand for simple state. Avoid Redux.

# =========================================
# 3. Coding Standards & Rules
# =========================================
# - Naming Conventions:
#   - Components: PascalCase (e.g., `ProductCard.tsx`).
#   - API Routes/Functions: camelCase (e.g., `getProducts.ts`).
#   - CSS Classes: Use Tailwind utility classes directly. Avoid custom CSS files unless absolutely necessary.
# - File Structure: Follow the proposed structure. Place components in `/components`, API logic in `/pages/api` (or App Router equivalent), and lib functions in `/lib`.
# - Comments: Write clear, concise comments for complex logic, especially for business rules like subscription pricing or age verification flow.
# - Error Handling: Implement try-catch blocks for all API calls and database operations. Return meaningful error messages.
# - Security: Never expose secret keys on the frontend. Use environment variables (`.env.local`) for all secrets. Sanitize all user inputs.
# - AI Generation:
#   - Always review AI-generated code for correctness and adherence to these rules.
#   - After committing AI-generated changes, add a summary to `changelog.md`.
#   - For new features, provide the AI with the relevant section of the Project Brief for context.

# =========================================
# 4. Key Features & Logic
# =========================================
# - Age Verification: Must be a robust, non-skippable gate at checkout, calling a third-party API.
# - Subscribe and Save: Implement logic to create a recurring charge in Stripe and apply a discount to the 12-pack SKU.
# - Shipping: Use the Shippo API for real-time rate calculation based on user address.
```

### Appendix B: Initial File Structure

A simplified directory structure to guide development.

```
lastgenie/
├── .cursorrules
├── .gitignore
├── changelog.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── prisma/
│   └── schema.prisma
├── public/
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (api)/      # API routes for backend logic
│   │   ├── (pages)/
│   │   │   ├── page.tsx          # Home page
│   │   │   ├── product/page.tsx  # Product page
│   │   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/         # Reusable UI elements (Button, Card, etc.)
│   │   ├── layout/     # Nav, Footer, etc.
│   │   └── ProductCard.tsx
│   ├── lib/
│   │   ├── prisma.ts   # Prisma client instance
│   │   ├── stripe.ts   # Stripe client instance
│   │   └── shippo.ts     # Shippo client instance
│   └── styles/
│       └── globals.css
```

### Appendix C: `changelog.md` Initial Content

This file will be placed in the project root to track development progress.

```md
# Changelog

All notable changes to this project will be documented in this file.
This project uses AI-assisted development; entries should specify the nature of the change and if it was AI-generated, AI-assisted, or manually coded.

## [1.0.0-alpha] - YYYY-MM-DD

### Added
- **[Manual]** Initialized project structure, including Next.js, Tailwind CSS, and Prisma setup.
- **[Manual]** Created `Project Brief & Charter`, `.cursorrules`, and initial `changelog.md`.
- **[AI-Assisted]** Generated boilerplate for basic UI components (Button, Card) based on the color palette in the project brief.
```