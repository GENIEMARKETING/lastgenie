# Project README: lastgenie

**Category:** Development
**Purpose:** Essential development tool configuration for an AI-assisted development workflow.

---

# `lastgenie` - Ecommerce Platform

Welcome to the `lastgenie` project! This document serves as the central guide for setting up your development environment, understanding the project architecture, and leveraging our AI-assisted workflow with Cursor to build an exceptional ecommerce experience.

`lastgenie` is a modern ecommerce website for the "Genie" brand, offering a sexual enhancer drink designed for both men and women. Our primary objective is to build a strong, engaged brand community by providing informative content, fostering trust through transparency, and creating a playful, modern, and empowering online presence.

## Table of Contents

1.  [Tech Stack](#tech-stack)
2.  [Project Structure](#project-structure)
3.  [Getting Started: Local Development](#getting-started-local-development)
    *   [Prerequisites](#prerequisites)
    *   [Installation & Setup](#installation--setup)
4.  [AI-Assisted Development with Cursor](#ai-assisted-development-with-cursor)
    *   [The `.cursorrules` File](#the-cursorrules-file)
    *   [AI Changelog: `changelog.md`](#ai-changelog-changelogmd)
    *   [Best Practices for AI Interaction](#best-practices-for-ai-interaction)
5.  [Environment Variables](#environment-variables)
6.  [Available Scripts](#available-scripts)
7.  [Coding Standards & Conventions](#coding-standards--conventions)
8.  [Core Features & Roadmap](#core-features--roadmap)
9.  [Deployment](#deployment)

## Tech Stack

The project is built on a modern, robust, and scalable technology stack chosen for its performance and developer experience.

*   **Development IDE:** [Cursor](https://cursor.sh/) (AI-First Code Editor)
*   **Frontend:** [Next.js](https://nextjs.org/) (React Framework)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Backend:** [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/)
*   **Deployment:** [AWS Amplify](https://aws.amazon.com/amplify/)
*   **Package Manager:** [pnpm](https://pnpm.io/)

## Project Structure

This project uses a monorepo structure to organize the frontend, backend, and shared packages. This approach enhances code sharing, simplifies dependency management, and provides a clear context for AI tools.

```
/
├── .cursorrules          # AI configuration and project context for Cursor IDE
├── .github/              # GitHub Actions workflows and templates
├── apps/
│   ├── api/              # Node.js/Express backend application
│   └── web/              # Next.js frontend application
├── packages/
│   ├── db/               # Prisma schema, client, and migration files
│   ├── ui/               # Shared React components (e.g., Buttons, Modals)
│   └── types/            # Shared TypeScript types and interfaces
├── .env.example          # Template for environment variables
├── changelog.md          # Tracks significant AI-generated changes
├── package.json          # Root package.json for monorepo workspace
└── README.md             # This documentation file
```

## Getting Started: Local Development

Follow these steps to get the project running on your local machine.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later)
*   [pnpm](https://pnpm.io/installation)
*   [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose
*   [Cursor IDE](https://cursor.sh/)

### Installation & Setup

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/your-username/lastgenie.git
    cd lastgenie
    ```

2.  **Install Dependencies**
    From the root directory, install all dependencies for the monorepo workspaces.

    ```bash
    pnpm install
    ```

3.  **Set Up Environment Variables**
    Copy the example environment file and fill in the required values. You will need to create accounts for Stripe, Shippo, and a third-party age verification service to get the necessary API keys.

    ```bash
    cp .env.example .env
    ```

    Now, open the `.env` file and update the variables. See the [Environment Variables](#environment-variables) section for details.

4.  **Start the Database**
    We use Docker Compose to run a PostgreSQL database instance locally.

    ```bash
    docker-compose up -d
    ```

5.  **Run Database Migrations**
    Apply the Prisma schema to your local database. This will create the necessary tables.

    ```bash
    pnpm db:migrate
    ```
    *Optional:* You can use Prisma Studio to view and manage your database.
    ```bash
    pnpm db:studio
    ```

6.  **Run the Development Servers**
    This command will start the Next.js frontend (`apps/web`) and the Express backend (`apps/api`) concurrently.

    ```bash
    pnpm dev
    ```

    *   Frontend will be available at `http://localhost:3000`
    *   Backend API will be available at `http://localhost:3001`

## AI-Assisted Development with Cursor

This project is optimized for an AI-first workflow using Cursor. The following conventions are essential for maintaining consistency and maximizing the effectiveness of AI-powered features.

### The `.cursorrules` File

The `.cursorrules` file at the root of the project provides persistent context to the AI. It contains our project's goals, tech stack, coding standards, and brand voice. **All developers must use Cursor to ensure the AI adheres to these rules.**

```
# .cursorrules

# Project Context
- Project Name: lastgenie
- Type: Ecommerce website for a sexual enhancer drink brand named "Genie".
- Products: Male & Female 50ML bottles ($10 each), 12-packs ($99).
- Business Goal: Build a strong brand community, establish credibility with scientific information, and serve as a digital hub for future growth.
- Core Features: Product pages, robust age verification, 'subscribe and save' model, real-time shipping calculator, testimonials, and a blog.

# Target Audience
- Male Persona: 30-50, health-conscious, busy lifestyle, values wellness, intimacy, and discreet online shopping.
- Female Persona: 30-50, values empowerment and self-care, open to products enhancing personal relationships.
- Both personas are active on social media and engage with health-related content.

# Brand & Design
- Tone: Playful, modern, energetic, empowering.
- Primary Color: #1E40AF (Strong Blue)
- Secondary Color: #14B8A6 (Teal)
- Accent Color: #FACC15 (Amber)
- Background Color: #F3F4F6 (Light Gray)
- Text Color: #1F2937 (Charcoal Gray)

# Tech Stack & Standards
- Frontend: Next.js 14+ with App Router, React, Tailwind CSS.
- Backend: Node.js with Express. API routes should be RESTful.
- Database: PostgreSQL with Prisma ORM.
- Naming Conventions:
  - Components: PascalCase (e.g., `ProductCard.tsx`)
  - Files/Folders: kebab-case (e.g., `product-details/`)
  - Functions/Variables: camelCase (e.g., `calculateShipping`)
  - API Endpoints: kebab-case (e.g., `/api/products/:id`)
- Styling: Use Tailwind CSS utility classes directly in JSX. Avoid creating separate CSS files.
- State Management: Use React Hooks (useState, useContext) for local/shared state. For global state, use Zustand.
- Code Style: Follow ESLint and Prettier rules defined in the project. Use TypeScript for all new code.
```

### AI Changelog: `changelog.md`

Use Cursor's "Auto-Changelog" feature to document significant changes made with AI assistance. This helps in tracking AI contributions and simplifies code reviews.

**Workflow:**
1.  After using AI to generate or refactor a block of code (e.g., using `Cmd+K` or Chat).
2.  Select the modified code block(s).
3.  Right-click and choose "Add to AI Changelog".
4.  Provide a concise, human-readable summary of the change.

### Best Practices for AI Interaction

*   **Be Specific:** Instead of "Create a product page," try "Create a Next.js server component for the product page located at `apps/web/src/app/product/[id]/page.tsx`. It should fetch product data from the `/api/products/:id` endpoint and use the `#1E40AF` primary color for the 'Add to Cart' button."
*   **Provide Context with `@`:** Use `@` symbols to include specific files or documentation in your prompt. This dramatically improves the quality of the AI's output.
    *   `@file:apps/web/src/app/layout.tsx`
    *   `@file:packages/db/schema.prisma`
*   **Iterate and Refine:** Use AI as a starting point. Review the generated code, identify areas for improvement, and provide feedback in a follow-up prompt.
*   **Always Review:** **Never commit AI-generated code without a thorough human review.** Verify its correctness, performance, and adherence to our project standards.

## Environment Variables

The `.env` file is used to store sensitive keys and configuration settings. It is ignored by Git.

```ini
# .env.example

# --- Database ---
# Connection URL for the PostgreSQL database.
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/lastgenie"

# --- Backend API ---
# The port the Express API server will run on.
API_PORT=3001

# --- Payment Gateway ---
# Secret key from your Stripe dashboard.
STRIPE_SECRET_KEY="sk_test_..."
# Public key for the frontend.
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# --- Shipping ---
# API token from your Shippo dashboard.
SHIPPO_API_KEY="shippo_test_..."

# --- Services ---
# API key for the third-party age verification service.
AGE_VERIFICATION_API_KEY="..."

# --- Application ---
# Base URL for the frontend application.
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Available Scripts

The following scripts are available in the root `package.json`:

*   `pnpm dev`: Starts the frontend and backend development servers.
*   `pnpm build`: Builds all apps for production.
*   `pnpm start`: Starts the production-ready apps (after building).
*   `pnpm lint`: Lints and formats the entire codebase.
*   `pnpm db:migrate`: Applies pending database migrations.
*   `pnpm db:studio`: Opens the Prisma Studio GUI.

## Coding Standards & Conventions

*   **TypeScript:** All new code should be written in TypeScript to ensure type safety.
*   **ESLint/Prettier:** Code is automatically formatted on save (if your editor is configured) and linted as a pre-commit hook.
*   **Component Structure:** Place new React components inside the `packages/ui` directory if they are generic, or within the `apps/web/src/components` directory if they are specific to the web app.
*   **API Design:** Follow RESTful principles. Use appropriate HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) and status codes. All API routes are located in `apps/api`.
*   **Git Branching:**
    *   `main`: Production-ready code.
    *   `develop`: Integration branch for new features.
    *   Features: `feature/feature-name` (e.g., `feature/subscribe-and-save`)
    *   Fixes: `fix/bug-description` (e.g., `fix/shipping-calculator-error`)

## Core Features & Roadmap

This is the high-level plan for initial development.

| Feature                 | Priority | Status      | Description                                                    |
| ----------------------- | -------- | ----------- | -------------------------------------------------------------- |
| Product Pages           | High     | Not Started | Detailed pages for male & female products with reviews.        |
| Age Verification        | High     | Not Started | Third-party API integration to verify user age at checkout.    |
| Subscribe and Save      | High     | Not Started | Recurring purchase plans for 12-packs with a discount.         |
| Shipping Calculator     | High     | Not Started | Real-time shipping rate calculation via Shippo.                |
| Customer Testimonials   | Medium   | Not Started | A dedicated section or component to showcase user reviews.     |
| Informative Blog        | Medium   | Not Started | Blog for content on sexual health, wellness, and product info. |

## Deployment

The `lastgenie` project is configured for deployment on **AWS Amplify**.

The deployment process is managed by connecting the GitHub repository to an Amplify project. Amplify will automatically detect the monorepo structure and build/deploy settings.

*   **Branch:** The `main` branch is connected for production deployments.
*   **Build Settings:** Amplify uses the `pnpm build` command.
*   **Environment Variables:** All variables from the `.env` file must be securely added to the Amplify console under **Environment variables**.