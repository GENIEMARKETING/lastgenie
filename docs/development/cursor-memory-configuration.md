# Cursor Memory Configuration

**Document Type:** Cursor Memory Configuration
**Category:** Development
**Project:** lastgenie

---

## 1. Overview

This document outlines the essential configuration for the Cursor IDE to streamline the AI-assisted development workflow for the `lastgenie` project. By providing Cursor with a rich and structured context, we enable it to generate high-quality, consistent, and relevant code. This configuration includes project details, coding standards, file structure conventions, and change tracking procedures. Adhering to this setup is crucial for maximizing development velocity and maintaining code quality.

## 2. Project Context (`@project`)

This section consolidates all critical project information. This context is fed directly to Cursor's AI to ensure its understanding of the project's goals, features, and technical specifications.

*   **Project Name:** lastgenie
*   **Website Type:** Ecommerce
*   **Description:** An ecommerce website for the brand "Genie," a sexual enhancer drink designed for both men and women. The site aims to build a strong, engaged brand community.
*   **Business Objectives:**
    1.  **Build a Strong Brand Community:** Engage customers through informative content (blog), user testimonials, and interactive features.
    2.  **Establish Credibility:** Reinforce trust and encourage repeat purchases by providing scientific information and transparent ingredient details.
    3.  **Digital Hub:** Serve as the primary online presence for future retail launches and product expansions.
*   **Target Personas:**
    *   **Male (30-50):** Health-conscious, values personal wellness and intimacy, leads a busy lifestyle, and prefers convenient, discreet online shopping.
    *   **Female (30-50):** Values empowerment and self-care, open to exploring products that enhance personal relationships, and actively engages with social media and health content.
*   **Products & Pricing:**
    *   Male Sexual Enhancer: 50ML bottle, 1 SKU, $10.
    *   Female Sexual Enhancer: 50ML bottle, 1 SKU, $10.
    *   Male 12-Pack: $99.
    *   Female 12-Pack: $99.
*   **Core Features:**
    *   **Product Pages (High Priority):** Detailed descriptions, pricing, customer reviews, ingredient information.
    *   **Age Verification (High Priority):** Robust age verification at checkout using a third-party API.
    *   **Subscribe and Save (High Priority):** Recurring subscription model for 12-packs with a discount to increase LTV.
    *   **Shipping Calculator (High Priority):** Real-time shipping rate calculation at checkout via Shippo API.
    *   **Customer Testimonials (Medium Priority):** A dedicated section or component to showcase user reviews.
    *   **Informative Blog (Medium Priority):** Articles on sexual health, wellness, and product usage.
*   **Tech Stack:**
    *   **Frontend:** Next.js (v14+ App Router) with TypeScript and Tailwind CSS.
    *   **Backend:** Node.js with Express (for specific, complex API routes if needed, otherwise Next.js API Routes).
    *   **Database ORM:** Prisma.
    *   **Database:** PostgreSQL.
    *   **Deployment:** AWS Amplify.
*   **Key Integrations:**
    *   **Payments:** Stripe.
    *   **Shipping:** Shippo for real-time rates. Standard carriers (USPS, FedEx, UPS) for fulfillment.
    *   **Analytics:** Google Analytics 4.
    *   **Marketing:** Social Media Pixels (Meta, TikTok), Klaviyo for email marketing.
*   **Aesthetic & Design:**
    *   **Mood:** Modern, playful, energetic, empowering, vitality.
    *   **Color Scheme:**
        *   Primary: `#1E40AF` (Strong Blue)
        *   Secondary: `#14B8A6` (Teal)
        *   Accent: `#FACC15` (Amber)
        *   Background: `#F3F4F6` (Light Gray)
        *   Text: `#1F2937` (Charcoal Gray)
    *   **Layout:** Landing page style homepage, top navigation, fully responsive, with Dark Mode support.

## 3. Coding Standards (`@rules`)

This section defines the coding conventions and best practices for the project. The AI will adhere to these rules when generating or modifying code.

*   **Language:** All code must be written in **TypeScript** with `strict` mode enabled. Use explicit types and avoid `any` wherever possible.
*   **Framework:** Use **Next.js 14+ with the App Router**. Server Components should be the default for data fetching and rendering static content. Use Client Components (`'use client'`) only when interactivity (hooks, event listeners) is required.
*   **Styling:**
    *   Use **Tailwind CSS** for all styling. Avoid inline styles (`style` attribute) and separate CSS files.
    *   Use the `clsx` or `cva` library for constructing conditional and variant-based class names.
    *   The project's color palette is defined in `tailwind.config.ts`. Always use theme variables (e.g., `bg-primary`, `text-accent`) instead of hardcoded hex values.
*   **Component Structure:**
    *   Components must be **Functional Components** using React Hooks.
    *   File names must be **PascalCase** (e.g., `ProductCard.tsx`).
    *   Create a `variants` object using `cva` for components with multiple styles (e.g., Button variants: primary, secondary).
*   **State Management:**
    *   For local/component-level state, use React's built-in hooks (`useState`, `useReducer`).
    *   For shared, global state (e.g., cart, user session), use **Zustand**. Create stores in the `lib/store/` directory.
*   **Data Fetching & API Interaction:**
    *   **Server-Side:** Use `async` Server Components to fetch data directly, preferably through a dedicated data-access layer that uses Prisma.
    *   **Client-Side:** For mutations (e.g., adding to cart, submitting a form) or dynamic data fetching (e.g., SWR), use Next.js API Routes located in `app/api/`.
    *   **API Response Format:** All custom API routes must return a consistent JSON object structure:
        ```typescript
        {
          success: boolean,
          data: T | null,
          error: string | null
        }
        ```
*   **Database:**
    *   All database interactions must be performed through the **Prisma Client**.
    *   The database schema is the single source of truth and is defined in `prisma/schema.prisma`.
    *   Do not write raw SQL queries unless absolutely necessary and approved.
*   **Code Comments & Documentation:**
    *   Use **JSDoc** comments for all exported functions, components, hooks, and types. Describe the purpose, parameters (`@param`), and return value (`@returns`). This is critical for the AI's contextual understanding.
    *   Example:
        ```typescript
        /**
         * Renders a product card with image, title, price, and add to cart button.
         * @param {object} product - The product data to display.
         * @param {string} product.name - The name of the product.
         * @param {number} product.price - The price of the product.
         * @param {string} product.imageUrl - The URL for the product image.
         */
        export function ProductCard({ product }) {
          // ... component logic
        }
        ```

## 4. `.cursorrules` File Configuration

Create a file named `.cursorrules` in the root of the project directory and paste the following content. This file provides Cursor with the necessary context and rules for AI-powered actions.

```
# .cursorrules - Configuration for Cursor AI in the lastgenie project

# @project: Provides the AI with high-level context about the project.
# This context is used for generating new code, understanding user intent, and answering questions.
@project
- Project Name: lastgenie
- Website Type: Ecommerce
- Description: An ecommerce website for the brand "Genie," a sexual enhancer drink designed for both men and women. The site aims to build a strong, engaged brand community.
- Business Objectives:
    1. Build a Strong Brand Community: Engage customers through informative content (blog), user testimonials, and interactive features.
    2. Establish Credibility: Reinforce trust and encourage repeat purchases by providing scientific information and transparent ingredient details.
    3. Digital Hub: Serve as the primary online presence for future retail launches and product expansions.
- Target Personas:
    - Male (30-50): Health-conscious, values personal wellness and intimacy, leads a busy lifestyle, and prefers convenient, discreet online shopping.
    - Female (30-50): Values empowerment and self-care, open to exploring products that enhance personal relationships, and actively engages with social media and health content.
- Products & Pricing:
    - Male Sexual Enhancer: 50ML bottle, 1 SKU, $10.
    - Female Sexual Enhancer: 50ML bottle, 1 SKU, $10.
    - Male 12-Pack: $99.
    - Female 12-Pack: $99.
- Core Features:
    - Product Pages (High Priority): Detailed descriptions, pricing, customer reviews, ingredient information.
    - Age Verification (High Priority): Robust age verification at checkout using a third-party API.
    - Subscribe and Save (High Priority): Recurring subscription model for 12-packs with a discount.
    - Shipping Calculator (High Priority): Real-time shipping rate calculation at checkout via Shippo API.
    - Customer Testimonials (Medium Priority): A dedicated section or component to showcase user reviews.
    - Informative Blog (Medium Priority): Articles on sexual health, wellness, and product usage.
- Tech Stack:
    - Frontend: Next.js (v14+ App Router) with TypeScript and Tailwind CSS.
    - Backend: Next.js API Routes primarily. Node.js with Express only for highly complex, non-standard routes.
    - Database ORM: Prisma.
    - Database: PostgreSQL.
    - Deployment: AWS Amplify.
- Key Integrations: Stripe, Shippo, Google Analytics 4, Social Media Pixels, Klaviyo.
- Aesthetic & Design:
    - Mood: Modern, playful, energetic, empowering, vitality.
    - Colors: Primary: #1E40AF, Secondary: #14B8A6, Accent: #FACC15, Background: #F3F4F6, Text: #1F2937.

# @rules: Defines specific coding standards and conventions for the AI to follow.
# This ensures consistency and adherence to best practices when generating or editing code.
@rules
- Language: Use TypeScript with `strict` mode. Avoid `any` types.
- Framework: Use Next.js 14+ with the App Router. Default to Server Components. Use `'use client'` only when client-side interactivity is needed.
- Styling: Use Tailwind CSS for all styling. Use theme colors from `tailwind.config.ts`. Use `clsx` for conditional classes. No inline styles.
- Components: Write Functional Components with React Hooks. Filenames must be PascalCase (`MyComponent.tsx`).
- State Management: Use React hooks for local state. Use Zustand for global state (e.g., cart, user), with stores in `lib/store/`.
- API: Use Next.js API Routes in `app/api/`. API responses must follow the format: `{ success: boolean, data: T | null, error: string | null }`.
- Database: All database access must go through the Prisma Client. Schema is defined in `prisma/schema.prisma`.
- Documentation: Add JSDoc comments to all exported functions, components, and types, detailing purpose, `@param`, and `@returns`.
```

## 5. File & Directory Structure

A well-organized file structure is essential for both human developers and AI. It provides clear locations for different types of logic.

```
/
├── app/                        # Next.js App Router
│   ├── (marketing)/            # Route group for marketing pages
│   │   ├── page.tsx            # Home page (/)
│   │   └── product/
│   │       └── [slug]/
│   │           └── page.tsx    # Product Detail Page
│   ├── api/                    # API Routes
│   │   ├── age-verify/
│   │   │   └── route.ts
│   │   └── shipping/
│   │       └── route.ts
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles (Tailwind imports)
├── components/                 # Shared React components
│   ├── ui/                     # Generic, reusable UI components (Button, Input, Card)
│   ├── features/               # Feature-specific components (ProductGrid, AgeGateModal)
│   └── icons/                  # SVG icon components
├── lib/                        # Project-specific libraries and helpers
│   ├── prisma.ts               # Prisma client instance
│   ├── store/                  # Zustand global state stores (cartStore.ts)
│   ├── types.ts                # Shared TypeScript types and interfaces
│   └── utils.ts                # Utility functions (formatters, etc.)
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets (images, fonts)
├── styles/                     # (Optional) For complex global styles if needed
├── .cursorrules                # Cursor AI configuration
├── .eslintrc.json              # ESLint configuration
├── changelog.md                # AI-assisted change tracking
├── next.config.mjs             # Next.js configuration
├── package.json
└── tailwind.config.ts          # Tailwind CSS configuration
```

## 6. AI Change Tracking (`changelog.md`)

To maintain visibility and control over AI-generated code, all significant changes made with Cursor's AI should be logged in a `changelog.md` file at the project root. This provides a human-readable history of AI contributions.

Create `changelog.md` with the following template:

````markdown
# AI Change Log

This log tracks significant code generation and modification tasks performed using the Cursor AI. Each entry should be concise but descriptive.

---

### YYYY-MM-DD

**Developer:** [Your Name]

-   **Prompt:** "Create a responsive `ProductCard` component in `components/features/` that accepts product props (name, price, imageUrl) and uses the project's primary and accent colors."
    -   **Result:** Generated `components/features/ProductCard.tsx`.
    -   **Action:** Reviewed and committed. Minor style adjustments made to button padding.
-   **Prompt:** "Generate a Next.js API route in `app/api/shipping/route.ts` to calculate shipping rates using a placeholder for the Shippo API call."
    -   **Result:** Generated the API route structure with correct request/response handling.
    -   **Action:** Reviewed and implemented the actual Shippo API logic.
````

## 7. Example AI Prompts & Workflow

With the configuration in place, you can now leverage Cursor effectively.

**Example 1: Creating a UI Component**

> **Prompt:** "Using the rules, create a new Button component in `components/ui/Button.tsx`. It should use `cva` for variants: `primary`, `secondary`, and `accent`. The primary variant should use the `bg-primary` color, secondary should use `bg-secondary`, and accent `bg-accent`. All variants should have a `text-white` color, `font-bold`, `py-2`, `px-4`, and be rounded."

**Example 2: Implementing a Feature**

> **Prompt:** "I need to build the age verification feature. Create a modal component in `components/features/AgeGateModal.tsx`. It must be a client component. It should contain a form with day, month, and year inputs. On submit, it should call an API route at `/api/age-verify`. If the API returns success, close the modal. If it returns an error, display the error message below the form."

**Example 3: Refactoring Code**

> **Prompt (with code selected):** "Refactor this component to follow our project rules. Separate the data fetching logic into a Server Component and move the interactive parts into a new Client Component."