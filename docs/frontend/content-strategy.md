# Content Strategy: lastgenie

-   **Document Type**: Content Strategy
-   **Category**: Frontend
-   **Project**: lastgenie
-   **Version**: 1.0
-   **Date**: 2023-10-27
-   **Author**: AI Technical Writer

---

## 1. Executive Summary

This document outlines the frontend content strategy for the **lastgenie** ecommerce website. The primary objective is to support the business goal of **building a strong brand community** and **establishing credibility**.

Our strategy is centered around three core content pillars: **Education & Empowerment**, **Product Transparency & Science**, and **Community & Lifestyle**. By creating and distributing valuable content through blog posts, testimonials, detailed product information, and social channels, we will engage our target personas, build trust, and foster a loyal customer base. This approach will not only drive initial sales but also encourage repeat purchases and 'Subscribe and Save' adoption, positioning Genie as a trusted leader in the personal wellness space.

## 2. Target Audience & Personas

All content will be tailored to resonate with our two primary customer personas, who share an interest in wellness, self-care, and enhancing personal relationships.

### 2.1. Male Persona: "Wellness Warrior Will"

-   **Age**: 30-50
-   **Lifestyle**: Health-conscious professional with a busy schedule.
-   **Values**: Personal wellness, intimacy, efficiency, and privacy.
-   **Online Habits**: Shops online for convenience, prefers discreet purchasing, consumes health-related content on blogs and social media.
-   **Content Angle**: Content for Will should be straightforward, science-backed, and focused on benefits. It must respect his time and privacy, emphasizing convenience (like 'Subscribe and Save') and product efficacy.

### 2.2. Female Persona: "Empowered Emily"

-   **Age**: 30-50
-   **Lifestyle**: Proactive about self-care and personal growth.
-   **Values**: Empowerment, holistic wellness, open communication, and authenticity.
-   **Online Habits**: Engages with brand communities on social media, reads reviews and testimonials, follows wellness influencers, and seeks out products that align with her values.
-   **Content Angle**: Content for Emily should be empowering, relatable, and community-focused. It should de-stigmatize sexual wellness and frame Genie as a tool for self-care and enhancing connections.

## 3. Core Content Pillars

Our content will be organized around three foundational pillars that directly support our business goals and resonate with our personas.

### Pillar 1: Education & Empowerment

-   **Goal**: To de-stigmatize sexual wellness and position Genie as a knowledgeable, supportive brand.
-   **Topics**:
    -   Holistic approaches to intimacy and libido.
    -   Communication in relationships.
    -   The role of stress and lifestyle in sexual health.
    -   Myth-busting common misconceptions about sexual wellness.
-   **Formats**: Blog posts, infographics, email newsletters.

### Pillar 2: Product Transparency & Science

-   **Goal**: To build credibility and trust by being transparent about our product.
-   **Topics**:
    -   Deep dives into each ingredient: its origin, purpose, and scientific backing.
    -   Detailed explanations of how Genie works for both men and women.
    -   Product safety, manufacturing standards, and proper usage guides.
-   **Formats**: A dedicated "Our Science" page, detailed ingredient glossary, FAQ page, product page copy.

### Pillar 3: Community & Lifestyle

-   **Goal**: To build a brand community by showcasing authentic user experiences.
-   **Topics**:
    -   User testimonials and success stories (anonymized if requested).
    -   Integrating Genie into a modern, vibrant lifestyle (e.g., date nights, self-care routines).
    -   User-generated content campaigns.
-   **Formats**: Customer testimonials section, blog posts featuring user stories, social media content.

## 4. Content Types & Implementation

### 4.1. Informative Blog

The blog is our primary tool for SEO and education. Posts will be hosted at `/blog` and managed as Markdown files within the Next.js application for performance and ease of use.

-   **Frequency**: 2 posts per month to start, balancing the limited budget with the need for fresh content.
-   **Structure**: Each post will be an `.mdx` file, allowing for embedded React components if needed. The frontmatter will contain critical metadata for SEO and content management.

**Example `post.mdx` Frontmatter:**

```markdown
---
title: '5 Ways to Naturally Boost Intimacy in Your Relationship'
slug: 'boost-intimacy-naturally'
date: '2024-11-15'
author: 'Genie Wellness Team'
tags: ['Intimacy', 'Wellness', 'Relationships']
pillar: 'Education & Empowerment'
excerpt: 'Rediscover connection with your partner. Here are 5 science-backed, natural ways to enhance intimacy and bring the spark back into your relationship.'
---

## Introduction

In our busy lives, it's easy for intimacy to take a backseat. But nurturing that connection is vital for a healthy, happy relationship...
```

### 4.2. Customer Testimonials

Testimonials provide social proof and build community. They will be featured prominently on product pages and a dedicated `/testimonials` page.

-   **Sourcing**: We will trigger a post-purchase email via Klaviyo 14-21 days after delivery, inviting customers to share their experience.
-   **Implementation**: Testimonials will be stored in the PostgreSQL database and fetched via the API. Each testimonial should include the customer's first name, an initial, location (optional), a star rating, and the review text. Privacy will be paramount; users can opt to be anonymous.

### 4.3. "The Science" Page

A dedicated page at `/science` will serve as the hub for all scientific and ingredient-related information, directly supporting the "Product Transparency & Science" pillar.

-   **Content**:
    -   **Ingredient Glossary**: An A-Z list of ingredients with detailed descriptions of their function and links to relevant (publicly available) scientific studies.
    -   **Mechanism of Action**: A simplified, visual explanation of how the male and female formulas work.
    -   **Quality & Safety**: Information on manufacturing practices and quality assurance.

### 4.4. FAQ Page

An essential page at `/faq` to address common questions and reduce friction in the purchasing process.

-   **Categories**: Product, Shipping & Orders, Health & Safety, Subscription.
-   **Implementation**: Use accordions for each question to keep the layout clean. The content should be SEO-optimized to capture long-tail "question" keywords.

## 5. Tone of Voice

Our brand voice will be consistent across all content, reflecting the desired **modern, playful, and empowering** aesthetic.

-   **Empowering**: We use positive, confident language that encourages self-care.
-   **Approachable**: We avoid overly clinical or intimidating jargon. Complex topics are explained simply.
-   **Playful**: We embrace the fun and enjoyable aspects of intimacy. The tone is energetic and vibrant, not sterile.
-   **Trustworthy**: We are direct, honest, and transparent, especially when discussing ingredients and benefits. We make no unverified medical claims.

| Attribute | Example "Do" | Example "Don't" |
| :--- | :--- | :--- |
| **Playful** | "Your little secret for a big night in." | "Utilize this product to enhance sexual encounters." |
| **Empowering** | "Own your pleasure, on your terms." | "Fix your low libido." |
| **Trustworthy**| "Made with Ashwagandha, known for its stress-reducing properties." | "Our miracle formula is guaranteed to work." |

## 6. SEO & Technical Implementation

Content will be optimized to attract organic traffic and ensure a high-quality user experience.

### 6.1. Keyword Strategy

-   **Head Terms**: "sexual enhancer drink", "libido drink", "aphrodisiac drink".
-   **Long-Tail (Blog/FAQ)**: "how to increase female libido", "natural ingredients for male enhancement", "what is in sexual wellness drinks", "is [ingredient] safe".

### 6.2. On-Page SEO

All content pages (especially blog posts) must include:
-   A unique `<title>` tag (under 60 characters).
-   A compelling `meta description` (under 160 characters).
-   A single `<h1>` for the main title.
-   Structured use of `<h2>`, `<h3>` for subheadings.
-   Descriptive `alt` text for all images.

### 6.3. Structured Data (Schema.org)

To enhance search engine visibility, we will implement JSON-LD structured data on relevant pages.

**Example `Product` Schema (Product Page):**

```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Genie - Male Sexual Enhancer",
  "image": "https://lastgenie.com/images/product-male.jpg",
  "description": "A 50ML sexual enhancer drink designed to boost vitality and intimacy for men. Made with a modern, playful blend of natural ingredients.",
  "brand": {
    "@type": "Brand",
    "name": "Genie"
  },
  "sku": "GENIE-M-50ML",
  "offers": {
    "@type": "Offer",
    "url": "https://lastgenie.com/product/male-enhancer",
    "priceCurrency": "USD",
    "price": "10.00",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "89"
  }
}
```

**Example `BlogPosting` Schema (Blog Post Page):**

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "5 Ways to Naturally Boost Intimacy in Your Relationship",
  "author": {
    "@type": "Organization",
    "name": "Genie Wellness Team"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Genie",
    "logo": {
      "@type": "ImageObject",
      "url": "https://lastgenie.com/images/logo.png"
    }
  },
  "datePublished": "2024-11-15",
  "image": "https://lastgenie.com/blog/images/boost-intimacy.jpg"
}
```

## 7. Governance and Workflow

-   **Content Calendar**: A shared board (e.g., in Notion or Trello) will be used to plan, track, and schedule all content.
-   **Roles**:
    -   **Marketing Lead**: Owns the content strategy and calendar.
    -   **Content Creator**: Writes blog posts and social copy.
    -   **Developer**: Implements content on the site and ensures technical SEO.
-   **Review Process**: `Draft -> Marketing Review -> Final Edit -> Schedule`. For scientific content, an external SME review is recommended if the budget allows.

## 8. Measurement & KPIs

We will use Google Analytics 4, Klaviyo, and social media analytics to measure content effectiveness against our goals.

| Goal | KPI | Metric to Track |
| :--- | :--- | :--- |
| **Build Community** | Engagement Rate | Blog comments, email CTR, social media interactions, time on page. |
| **Establish Credibility**| Organic Authority | Organic traffic to blog & `/science` pages, number of positive reviews, conversion rate from blog readers. |
| **Drive Revenue** | Subscription Rate | Percentage of 12-pack purchases made via 'Subscribe and Save'. |

## 9. Platform-Specific Tooling

As per project requirements, the development and documentation process will be optimized for the Cursor IDE.

-   **.cursorrules**: A `.cursorrules` file will be maintained in the root directory to provide the AI with persistent context about the project, tech stack, and coding standards.
-   **changelog.md**: All significant AI-assisted changes to the codebase and documentation will be logged in `changelog.md`.
-   **File Structure**: Content files (like blog posts in `/content/blog`) will be structured logically to help the AI understand the project architecture and provide relevant assistance.