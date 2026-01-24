# Cursor Workflow & Tasks

| | |
| :--- | :--- |
| **Document Type:** | Cursor Workflow & Tasks |
| **Category:** | Development |
| **Project:** | lastgenie |
| **Version:** | 1.0 |

---

## 1.0 Introduction

This document provides a comprehensive guide for developers using the Cursor IDE for the `lastgenie` project. Its purpose is to establish essential configurations, workflows, and best practices for leveraging Cursor's AI capabilities effectively. Adhering to these guidelines will ensure code consistency, improve development speed, and maintain high-quality standards throughout the project lifecycle.

## 2.0 Project Overview

The `lastgenie` project is an ecommerce website for a sexual enhancer drink brand named "Genie." The primary business objective is to build a strong brand community and establish credibility through informative content, while driving sales.

-   **Website Type:** Ecommerce
-   **Products:** Male & Female sexual enhancer drinks (50ML single bottles and 12-packs).
-   **Business Objectives:** Build a brand community, establish credibility with scientific information, and create a digital hub for future growth.
-   **Target Audience:** Health-conscious men and women aged 30-50 who value personal wellness, intimacy, and discreet online shopping.
-   **Aesthetic:** Modern, playful, energetic, and empowering.
-   **Tech Stack:**
    -   **Frontend:** Next.js with Tailwind CSS
    -   **Backend:** Node.js with Express (via Next.js API Routes)
    -   **Database:** PostgreSQL with Prisma ORM
    -   **Deployment:** AWS Amplify
-   **Key Integrations:** Stripe (payments), Shippo (shipping rates), a third-party age verification service, Klaviyo (email marketing), Google Analytics 4, and social media pixels.

## 3.0 Cursor IDE Configuration

Proper configuration is critical for maximizing the effectiveness of Cursor's AI. All developers must implement the following setup.

### 3.1 Initial Setup

1.  Download and install the [Cursor IDE](https://cursor.sh/).
2.  Clone the `lastgenie` project repository.
3.  Open the project folder in Cursor.
4.  Create the files `.cursorrules` and `changelog.md` at the root of the project.

### 3.2 .cursorrules File

Create a file named `.cursorrules` in the project root. This file provides persistent context and coding standards to the AI, ensuring its suggestions and generated code align with our project's requirements.

**Copy the entire contents of the code block below into your `.cursorrules` file.**

```
# .cursorrules for the lastgenie project
# This file guides the AI on project context and coding standards.

# ==============================================================================
# PROJECT CONTEXT
# ==============================================================================
# Use @projectContext to reference these rules in a prompt.

projectContext:
  - role: project_brief
    content: |
      - Project: lastgenie
      - Type: Ecommerce website for a sexual enhancer drink.
      - Products: Male/Female 50ML bottles ($10), Male/Female 12-packs ($99).
      - Core Features: Product pages, robust age verification, 'subscribe and save' model, real-time shipping calculator (Shippo), customer testimonials, informative blog.
      - Design Mood: playful, modern, energetic, empowering, vitality.

  - role: tech_stack
    content: |
      - Frontend: Next.js (App Router) with TypeScript and Tailwind CSS.
      - Backend: Next.js API Routes.
      - Database: PostgreSQL with Prisma ORM.
      - Deployment: AWS Amplify.
      - Payments: Stripe.
      - Shipping: Shippo API for real-time rates.
      - Analytics: Google Analytics 4, social media pixels.
      - Email: Klaviyo.

  - role: design_system
    content: |
      - Primary Color: #1E40AF (Strong Blue)
      - Secondary Color: #14B8A6 (Teal)
      - Accent Color: #FACC15 (Amber)
      - Background Color: #F3F4F6 (Light Gray)
      - Text Color: #1F2937 (Charcoal Gray)
      - Dark Mode Support: Yes, design with dark mode compatibility in mind.
      - Layout: Landing page style, top navigation, fully responsive.

# ==============================================================================
# CODING STANDARDS
# ==============================================================================
# Use @codingStandards to reference these rules in a prompt.

codingStandards:
  - role: general
    content: |
      - Language: TypeScript. Use strict mode. Avoid `any` type where possible.
      - Formatting: Adhere to Prettier configuration. Use the official Prettier Tailwind CSS plugin for class sorting.
      - Naming: Use clear, descriptive names for variables, functions, and files.

  - role: nextjs
    content: |
      - Use the App Router (`/app` directory).
      - Component files should be named in PascalCase (e.g., `ProductCard.tsx`).
      - Page and route files should be named `page.tsx`, `layout.tsx`, `route.ts` inside kebab-case directories (e.g., `/app/product-details/[slug]/page.tsx`).
      - Components must be functional components using React Hooks.
      - Use Server Components by default. Only use the 'use client' directive when client-side interactivity is absolutely necessary (e.g., event handlers, state hooks).
      - Environment variables must be prefixed with `NEXT_PUBLIC_` for browser exposure.

  - role: tailwindcss
    content: |
      - Use utility-first classes directly in the JSX.
      - Define project-specific colors, fonts, and spacing in `tailwind.config.ts`. Do not use arbitrary values in JSX.
      - Classes should be automatically sorted by the Prettier plugin.

  - role: prisma
    content: |
      - Define models in PascalCase (e.g., `model User`).
      - Define fields in camelCase (e.g., `firstName String`).
      - Use relations (`@relation`) to define connections between models.
      - After modifying `schema.prisma`, always run `npx prisma generate` to update the client.

# ==============================================================================
# DOCUMENTATION STANDARDS
# ==============================================================================
# Use @documentationStandards to reference these rules in a prompt.

documentationStandards:
  - role: comments
    content: |
      - Use JSDoc for all functions, components, and type definitions to explain their purpose, parameters, and return values.
      - Add inline comments only for complex or non-obvious logic.

  - role: commit_messages
    content: |
      - Follow the Conventional Commits specification.
      - Example: `feat(auth): implement age verification middleware`
      - Example: `fix(cart): resolve quantity update bug`
      - Example: `docs(readme): update setup instructions`

  - role: changelog
    content: |
      - After a significant AI-assisted change (e.g., generating a new component, refactoring a complex function), add an entry to `changelog.md`.
      - Format: `* YYYY-MM-DD - AI - feat(scope): Description of the change. - (prompt: "brief prompt used")`
```

### 3.3 Workspace Structure

A well-organized file structure is essential for Cursor's AI to navigate and understand the codebase. We will follow the standard Next.js App Router structure.

```
lastgenie/
├── .cursorrules           # AI rules and context (YOU CREATE THIS)
├── changelog.md           # Log of AI-generated changes (YOU CREATE THIS)
├── prisma/
│   └── schema.prisma      # Database schema
├── public/                # Static assets
├── app/                   # Next.js App Router
│   ├── api/               # API routes
│   ├── (pages)/           # Page routes grouping
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   └── product/
│   │       └── page.tsx   # Product listing page
│   └── components/
│       ├── ui/            # Reusable low-level components (e.g., Button, Input)
│       └── features/      # Feature-specific components (e.g., AgeGate, SubscriptionForm)
├── lib/                   # Utility functions, helpers, etc.
├── tailwind.config.ts     # Tailwind configuration
└── ...                    # Other config files (package.json, etc.)
```

## 4.0 AI-Assisted Development Workflow

Leverage Cursor's AI features to accelerate development while maintaining quality.

### 4.1 Generating New Code (Cmd+K)

To create new files, components, or functions, open the Command-K prompt and type your request. Be specific and reference the rules files.

**Good Prompt Example:**
> `Create a new React component named ProductCard.tsx in /app/components/features/. It should display a product image, name, and price. It must accept props for product data. Use TypeScript and Tailwind CSS for styling. @codingStandards @design_system`

### 4.2 Editing and Refactoring Code (Select Code + Cmd+K)

To modify existing code, highlight the relevant block, press `Cmd+K`, and provide your instructions. This is useful for adding functionality, fixing bugs, or improving readability.

**Good Prompt Example:**
> `(After selecting a function) Refactor this function to be asynchronous. Add try-catch error handling and log any errors to the console. @codingStandards`

### 4.3 Chat and Codebase Questions (@ Symbol)

Use the Chat panel to ask questions about the project. Use `@` to reference specific files or rule sets for context.

-   `@app/api/auth/route.ts What does this API route do?`
-   `Where in the codebase is the Stripe client initialized?`
-   `@prisma/schema.prisma Explain the relationship between the Order and User models.`

## 5.0 Core Development Tasks & AI Prompts

The following are initial development tasks. Use the provided prompts in Cursor to kickstart each task.

### Task 1: UI Foundation Setup

**Goal:** Configure Tailwind CSS with the project's design system.
**Prompt (in chat or Cmd+K):**
> `Update my tailwind.config.ts file. Extend the theme to include the following color palette. Also, add a dark mode strategy using the 'class' attribute.
- Primary: #1E40AF
- Secondary: #14B8A6
- Accent: #FACC15
- Background: #F3F4F6
- Text: #1F2937
@codingStandards`

### Task 2: Database Schema (Prisma)

**Goal:** Create the initial database schema for users, products, orders, and subscriptions.
**Prompt (in `prisma/schema.prisma`):**
> `Generate a Prisma schema for a PostgreSQL database. It should include the following models:
1.  **User**: with fields for id, email (unique), name, password (hashed), createdAt, and updatedAt.
2.  **Product**: with fields for id, name, description, price, sku, and an enum for type (MALE, FEMALE).
3.  **Order**: with fields for id, totalAmount, status, createdAt, and relations to a User.
4.  **OrderItem**: to link Orders and Products, with quantity.
5.  **Subscription**: with fields for id, status (ACTIVE, CANCELED), interval (MONTHLY), nextBillingDate, and relations to a User and Product.
@codingStandards`

### Task 3: Homepage Component

**Goal:** Generate the main landing page with two primary sections.
**Prompt (in `app/(pages)/page.tsx`):**
> `Generate the code for a Next.js 14 homepage component using the App Router.
The page should have two main sections:
1.  **Hero Section:** A full-width section with a bold headline "Unleash Your Vitality," a sub-headline, and two call-to-action buttons: "Shop for Him" and "Shop for Her". Use the primary color for buttons and an energetic background image placeholder.
2.  **Product Showcase:** A section displaying two product cards side-by-side, one for the male product and one for the female product.
Style everything with Tailwind CSS, ensuring it is modern, playful, and responsive. @design_system @codingStandards`

### Task 4: Age Verification Middleware

**Goal:** Create the Next.js middleware to handle age verification.
**Prompt (in a new `middleware.ts` file at the project root):**
> `Create Next.js middleware using TypeScript. The middleware should check for an 'age_verified' cookie on all routes except '/age-gate'. If the cookie is not present and its value is not 'true', it should redirect the user to the '/age-gate' page. The middleware should apply to all paths. @codingStandards`

### Task 5: 'Subscribe and Save' API Endpoint

**Goal:** Scaffold the API route for creating a new subscription.
**Prompt (in `app/api/subscriptions/route.ts`):**
> `Create a Next.js API route handler for a POST request. This route will be used to create a new 'subscribe and save' plan for a user.
The function should:
1.  Read the userId and productId from the request body.
2.  (Placeholder) Interact with the Stripe API to create a new subscription.
3.  Use Prisma to save the subscription details (userId, productId, stripeSubscriptionId, status) to the database.
4.  Return a success message or an error.
Include JSDoc, error handling, and follow all project @codingStandards.`

## 6.0 Changelog Management

The `changelog.md` file serves as a transparent log of significant AI-generated or AI-assisted code contributions. This helps track progress and provides a reference point for debugging or rollbacks.

**Purpose:**
-   To document the creation of new features/components by the AI.
-   To log significant refactoring performed by the AI.
-   To maintain a high-level history of AI's impact on the codebase.

**Entry Format:**
Each entry must follow this format:
`* YYYY-MM-DD - AI - <type>(<scope>): <description> - (prompt: "<brief prompt used>")`

**Example Entries:**

```markdown
* 2023-10-27 - AI - feat(components): Generated initial ProductCard component with props for image, name, and price. - (prompt: "create product card component with typescript and tailwind")
* 2023-10-28 - AI - refactor(api): Refactored the user creation endpoint to include password hashing with bcrypt. - (prompt: "refactor this to hash the password field using bcrypt")
```