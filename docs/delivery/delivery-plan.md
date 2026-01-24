# Delivery Plan: lastgenie Ecommerce Website

*   **Project:** lastgenie
*   **Document Version:** 1.0
*   **Date:** October 26, 2023
*   **Category:** Delivery

---

## 1. Introduction

### 1.1. Document Purpose

This Delivery Plan outlines the phased development schedule, key milestones, and deliverables required to successfully launch the `lastgenie` ecommerce website within the critical 3-month timeline. The plan is designed to provide a clear roadmap for the development team, ensuring all core features and business objectives are met in a structured and timely manner.

### 1.2. Project Overview

The `lastgenie` project is the development of a modern, direct-to-consumer ecommerce website for a new brand of sexual enhancer drinks for men and women. The site will facilitate the sale of single bottles and 12-packs, with a key feature being a "Subscribe and Save" model to foster recurring revenue and customer loyalty.

### 1.3. Key Business Objectives

*   **Build a Strong Brand Community:** Engage customers through informative content, user testimonials, and interactive features.
*   **Establish Credibility:** Reinforce trust and encourage repeat purchases through scientific information and product transparency.
*   **Serve as a Digital Hub:** Create a scalable platform for future product expansions and potential retail launches.

## 2. Project Timeline & Milestones (12 Weeks)

The project is divided into four primary phases, culminating in a successful launch. The timeline is aggressive and relies on efficient execution and timely feedback.

| Phase                                   | Timeline     | Key Focus                                                               | Milestone                  |
| --------------------------------------- | ------------ | ----------------------------------------------------------------------- | -------------------------- |
| **Phase 1: Foundation & Setup**         | Weeks 1-2    | Environment setup, architecture, and core UI/UX design.                 | M1: Project Kickoff        |
| **Phase 2: Core Feature Development**   | Weeks 3-8    | Building product pages, cart, checkout flow, and backend logic.         | M2: Core Commerce Ready    |
| **Phase 3: Integrations & Content**     | Weeks 9-10   | Integrating third-party APIs (payments, shipping, age-gate) and content.| M3: Key Integrations Live  |
| **Phase 4: Testing, Launch & Handover** | Weeks 11-12  | End-to-end testing, bug fixing, analytics setup, and deployment.        | M4: Go-Live Readiness      |

## 3. Milestone Breakdown

This section details the specific tasks and deliverables associated with each milestone.

### Milestone 1: Project Kickoff & Environment Setup (End of Week 2)

**Goal:** Establish the technical foundation and development environment.

*   **Tasks:**
    *   Initialize Git repository and establish branching strategy (main, develop, feature/\*).
    *   Set up AWS Amplify project and connect to the Git repository for CI/CD.
    *   Bootstrap Next.js 13+ project with the App Router.
    *   Configure Tailwind CSS with the brand's color scheme and design mood.
    *   Set up PostgreSQL database and connect via Prisma ORM.
    *   Define initial database schema in `schema.prisma` for `User`, `Product`, `Order`, `Review`.
    *   Create a basic UI component library for buttons, inputs, and layout wrappers.
    *   Implement responsive navigation (top-bar) and footer.
*   **Deliverables:**
    *   A live, auto-deploying development environment on AWS Amplify.
    *   A structured Next.js project with a configured tech stack.
    *   Initial Prisma schema committed to the repository.

### Milestone 2: Core Commerce Functionality (End of Week 8)

**Goal:** Develop the primary user-facing ecommerce features.

*   **Tasks:**
    *   **Weeks 3-4 (Frontend):**
        *   Build static product pages with detailed descriptions, ingredient info, and pricing.
        *   Develop the Home page layout with its two primary sections.
        *   Create skeletons for the Blog index and article pages.
        *   Implement the Customer Testimonials display component.
    *   **Weeks 5-6 (Backend):**
        *   Develop API routes (`/api/...`) for fetching products, submitting reviews, and managing user accounts.
        *   Implement backend logic for "Subscribe and Save" plans (e.g., frequency, discount).
        *   Flesh out database schemas for `Cart`, `CartItem`, and `Subscription`.
    *   **Weeks 7-8 (Connecting Frontend/Backend):**
        *   Implement client-side state management for the shopping cart (e.g., `useContext`).
        *   Develop the full checkout flow UI (shipping, payment, review steps).
        *   Connect the "Add to Cart" and "Subscribe" buttons to the backend logic.
*   **Deliverables:**
    *   Functional Product Pages populated with data from the database.
    *   A working shopping cart that can be viewed and modified.
    *   A complete, multi-step checkout form (UI/UX only, no live integrations yet).
    *   Backend API endpoints for all core commerce actions.

### Milestone 3: Key Integrations & Content Implementation (End of Week 10)

**Goal:** Integrate critical third-party services and populate the site with content.

*   **Tasks:**
    *   **Week 9 (Payments & Age Gate):**
        *   Integrate Stripe SDK for payment processing within the checkout flow.
        *   Implement a robust, third-party age verification API call at a critical user checkpoint (e.g., before checkout).
    *   **Week 10 (Shipping & Content):**
        *   Integrate the Shippo API for real-time shipping rate calculations at checkout.
        *   Populate the blog with initial articles provided by the client.
        *   Add customer testimonials and finalize all marketing copy on the site.
*   **Deliverables:**
    *   A fully functional checkout flow capable of processing live (test) payments via Stripe.
    *   An active age-gate that blocks underage users.
    *   Accurate, real-time shipping costs displayed to the user.
    *   A content-complete website ready for final review.

### Milestone 4: Go-Live Readiness (End of Week 12)

**Goal:** Ensure the website is stable, tracked, and ready for a public launch.

*   **Tasks:**
    *   **Week 11 (Analytics & QA):**
        *   Integrate Google Analytics 4 (GA4) for comprehensive user tracking.
        *   Install Meta (Facebook/Instagram) Pixel for ad retargeting.
        *   Set up Klaviyo integration for email marketing triggers (e.g., abandoned cart).
        *   Conduct thorough User Acceptance Testing (UAT) across all features and major browsers/devices.
    *   **Week 12 (Bug Fixing & Deployment Prep):**
        *   Triage and resolve all high-priority bugs identified during QA.
        *   Perform final performance and security audits.
        *   Prepare production environment variables and configurations.
        *   Execute a full deployment to a staging branch for final client sign-off.
*   **Deliverables:**
    *   GA4 and social pixels are firing correctly.
    *   A bug-fix report and a stable, tested application on a staging environment.
    *   Client sign-off on the final pre-launch site.
    *   A Go-Live checklist.

## 4. Assumptions, Risks, and Dependencies

### 4.1. Assumptions

*   All content (product descriptions, blog articles, scientific data, legal text) will be provided by the client on or before Week 10.
*   API keys and account access for Stripe, Shippo, and the chosen age verification service will be available by Week 8.
*   The project budget of $500 is a significant constraint. This plan assumes heavy reliance on free-tier services, open-source libraries, and minimal expenditure on premium themes, plugins, or third-party services.

### 4.2. Risks & Mitigation

| Risk                                     | Likelihood | Impact | Mitigation Strategy                                                                                                                                   |
| ---------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Budget Constraint**                    | High       | High   | Prioritize essential features ruthlessly. Utilize free tiers of services (AWS, Vercel, etc.). Defer non-critical "nice-to-have" features to a Phase 2. |
| **Third-Party API Complexity**           | Medium     | High   | Allocate specific time (Weeks 9-10) for integration. Choose services with excellent documentation and developer support. Have a fallback plan if an API fails. |
| **Content Delivery Delays**              | Medium     | Medium | Use placeholder content during development but establish firm content deadlines with the client. Emphasize that delays will directly impact the launch date. |
| **Scope Creep**                          | Medium     | High   | Adhere strictly to the feature list in this plan. All new feature requests must go through a formal change request process and be scheduled for a future release. |

### 4.3. Dependencies

*   **External Services:** The project's success is dependent on the successful integration and continued operation of:
    *   **Stripe:** For all payment processing.
    *   **Shippo:** For real-time shipping rates.
    *   **Third-Party Age Verification Service:** (e.g., AgeChecker.Net, Veratad) For legal compliance.
    *   **AWS Amplify:** For hosting and deployment.
*   **Client Deliverables:** Timely delivery of product information, brand assets, legal disclaimers, and all website copy.

## 5. Cursor IDE & Development Standards

To ensure efficiency and maintain high code quality, especially when leveraging AI-assisted development, the project will adhere to the following standards.

### 5.1. File & Directory Structure

The project will use a standard Next.js App Router structure, optimized for clarity and AI context.

```bash
/
├── .cursor-workspace # Cursor IDE config
├── .cursorrules      # AI coding rules and project context
├── .env.local        # Environment variables
├── .eslintrc.json    # ESLint configuration
├── .gitignore
├── changelog.md      # Log of AI-generated changes
├── next.config.js
├── package.json
├── postcss.config.js
├── prisma/
│   └── schema.prisma # Database schema
├── public/           # Static assets (images, fonts)
├── src/
│   ├── app/
│   │   ├── api/      # Backend API routes
│   │   ├── (pages)/  # Page routes (e.g., /product, /blog)
│   │   │   ├── product/
│   │   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx  # Home page
│   ├── components/
│   │   ├── ui/       # Reusable, unstyled components (shadcn/ui style)
│   │   └── shared/   # Composed components (e.g., ProductCard, Header)
│   ├── lib/          # Helper functions, utilities, API clients
│   └── styles/
│       └── globals.css
└── tailwind.config.ts
```

### 5.2. Naming Conventions

*   **Components:** PascalCase (e.g., `ProductCard.tsx`, `AgeVerificationModal.tsx`)
*   **Files/Folders:** kebab-case (e.g., `product-page`, `api/send-email`)
*   **Functions/Variables:** camelCase (e.g., `calculateTotal`, `const userCart`)
*   **API Routes:** Descriptive and RESTful (e.g., `app/api/products/[id]/route.ts`)

### 5.3. `.cursorrules` Configuration

This file will be placed in the project root to provide persistent context to the AI.

```
# .cursorrules

# This file tells the AI how to behave in this repository.
# For more information, see the docs: https://cursor.sh/docs/custom-rules

# Rules for how the AI should generate and edit code.
# The AI will see these rules at the top of its instruction prompt.
coding-rules:
  - The user wants me to act as an expert technical writer and full-stack developer.
  - All code must be written in TypeScript.
  - Adhere to the project's file structure and naming conventions.
  - Use functional components with React Hooks.
  - For styling, use Tailwind CSS utility classes exclusively. Do not write custom CSS files.
  - For database interactions, use the Prisma client. Do not write raw SQL queries.
  - All API routes must be located in the `src/app/api/` directory and follow the Next.js App Router conventions.
  - Ensure all components are responsive by default using mobile-first media queries (e.g., `sm:`, `md:`, `lg:`).

# The AI will have access to all of the repository's context.
# You can use this section to list files that are particularly important.
# The AI will look at these files first when it's trying to understand the codebase.
context:
  - path: src/app/layout.tsx # Main layout and styles
  - path: tailwind.config.ts # Brand colors and theme
  - path: prisma/schema.prisma # Database models
  - path: src/lib/ # Utility functions

# This is the project context the AI will use to understand the project.
project-context: |
  Project: lastgenie
  Description: An ecommerce website for "Genie," a sexual enhancer drink for men and women.
  Tech Stack:
    - Frontend: Next.js 13+ (App Router) with TypeScript
    - Styling: Tailwind CSS
    - Backend: Node.js/Express (via Next.js API Routes)
    - Database: PostgreSQL with Prisma ORM
    - Deployment: AWS Amplify
  Key Features:
    - Product pages, shopping cart, and checkout.
    - Age verification via a third-party API.
    - "Subscribe and Save" model for recurring purchases.
    - Integrations: Stripe (payments), Shippo (shipping), Klaviyo (email), GA4.
  Design Mood: playful, modern, energetic, empowering.
```

### 5.4. `changelog.md` Example

To track significant AI contributions, a `changelog.md` will be maintained.

```markdown
# Changelog

All major features, components, or bug fixes generated or significantly refactored by the AI will be documented here.

---

### 2023-10-28

*   **Change:** Generated the initial Prisma schema for `User`, `Product`, `Order`, and `Review` models.
*   **AI Used:** Cursor AI
*   **Prompt Snippet:** "Based on the `lastgenie` project context, create a Prisma schema for an ecommerce site. Include models for users, products (with male/female variants), orders, and reviews. Products should have name, description, price, sku, and imageURL fields."

### 2023-10-27

*   **Change:** Initialized the Next.js + Tailwind CSS project structure and configured `tailwind.config.ts` with the brand's primary, secondary, and accent colors.
*   **AI Used:** Cursor AI
*   **Prompt Snippet:** "Bootstrap a new Next.js 13 App Router project with TypeScript and Tailwind CSS. Then, configure the `tailwind.config.ts` file to include the following color palette: Primary: #1E40AF, Secondary: #14B8A6, Accent: #FACC15..."
```