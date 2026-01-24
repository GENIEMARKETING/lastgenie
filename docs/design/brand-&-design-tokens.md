```markdown
# Brand & Design Tokens: lastgenie

*   **Document Type**: Brand & Design Tokens
*   **Category**: Design
*   **Project**: lastgenie
*   **Date**: 2023-10-27
*   **Version**: 1.0

## 1. Introduction

This document outlines the core visual design tokens for the **lastgenie** ecommerce website. Its purpose is to establish a consistent, reusable system for applying our brand's **modern and playful** aesthetic across all digital touchpoints.

These tokens are the single source of truth for colors, typography, spacing, and other stylistic elements. By adhering to this system, developers and designers can ensure brand consistency, streamline the development process, and create a cohesive user experience that is empowering, energetic, and trustworthy.

This guide is designed to be directly implemented within our tech stack: **Next.js with Tailwind CSS**.

---

## 2. Core Design Philosophy

Our design language is guided by four key principles that reflect the `lastgenie` brand identity.

*   **Modern**: Clean layouts, clear hierarchy, and a digital-native feel. We avoid clutter and focus on what's essential, ensuring the user journey is intuitive and seamless.
*   **Playful**: Energetic colors, soft corners, and dynamic typography create an inviting and approachable atmosphere. The design should feel fun and engaging, demystifying the product category and fostering a positive connection.
*   **Empowering**: The design instills confidence. Through clear information, trustworthy visual cues, and a focus on self-care, we empower users to make informed decisions about their wellness.
*   **Trustworthy**: While playful, our aesthetic is grounded in professionalism. We use legible typography, a structured color system, and clear visual hierarchy to build credibility and ensure users feel secure.

---

## 3. Color Palette

Our color palette is designed to be vibrant and energetic, with a strong foundation of professional neutrals. All colors are defined with both light and dark mode applications in mind.

### 3.1. Primitive Tokens

These are the raw hex values for our brand palette. Avoid using these directly in components; use the semantic tokens instead.

| Color Name   | Hex       | Tailwind Reference   |
| :----------- | :-------- | :------------------- |
| Genie Blue   | `#1E40AF` | `genie-blue`         |
| Genie Teal   | `#14B8A6` | `genie-teal`         |
| Genie Amber  | `#FACC15` | `genie-amber`        |
| Gray 100     | `#F3F4F6` | `gray-100`           |
| Gray 200     | `#E5E7EB` | `gray-200`           |
| Gray 500     | `#6B7280` | `gray-500`           |
| Gray 800     | `#1F2937` | `gray-800`           |
| Gray 900     | `#111827` | `gray-900`           |
| White        | `#FFFFFF` | `white`              |
| Success      | `#22C55E` | `green-500`          |
| Warning      | `#F59E0B` | `amber-500`          |
| Error        | `#EF4444` | `red-500`            |

### 3.2. Semantic Tokens

These tokens describe the *purpose* of a color. They automatically adapt to light or dark mode. **Always use semantic tokens in your code.**

| Semantic Name       | Light Mode Value    | Dark Mode Value     | CSS Variable                 | Description                                    |
| :------------------ | :------------------ | :------------------ | :--------------------------- | :--------------------------------------------- |
| `bg-background`     | `gray-100`          | `gray-900`          | `var(--color-background)`    | Main page background color.                    |
| `bg-surface`        | `white`             | `gray-800`          | `var(--color-surface)`       | Background for cards, modals, and components.  |
| `text-primary`      | `gray-800`          | `gray-100`          | `var(--color-text-primary)`  | Primary text for headings and body content.    |
| `text-secondary`    | `gray-500`          | `gray-400`          | `var(--color-text-secondary)`| Secondary text for subheadings and captions.   |
| `text-accent`       | `genie-teal`        | `genie-teal`        | `var(--color-text-accent)`   | For highlighted text or special links.         |
| `brand-primary`     | `genie-blue`        | `genie-blue`        | `var(--color-brand-primary)` | Primary brand color for CTAs, interactive UI.  |
| `brand-secondary`   | `genie-teal`        | `genie-teal`        | `var(--color-brand-secondary)`| Secondary brand color for highlights, tags.    |
| `brand-accent`      | `genie-amber`       | `genie-amber`       | `var(--color-brand-accent)`  | Accent color for promotions, special notices.  |
| `border-default`    | `gray-200`          | `gray-700`          | `var(--color-border-default)`| Default border for cards and dividers.         |
| `border-interactive`| `gray-500`          | `gray-500`          | `var(--color-border-interactive)`| Border color for inputs on hover/focus.      |

### 3.3. Tailwind CSS Configuration

Add these colors to your `tailwind.config.js` to make them available as utility classes (e.g., `bg-primary`, `text-secondary`).

```javascript
// tailwind.config.js
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class', // Enable dark mode
  theme: {
    extend: {
      colors: {
        'genie-blue': '#1E40AF',
        'genie-teal': '#14B8A6',
        'genie-amber': '#FACC15',
        // Semantic colors for easy use
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        primary: {
          DEFAULT: 'var(--color-brand-primary)',
          hover: 'var(--color-brand-primary-hover)', // Define hover states
        },
        secondary: 'var(--color-brand-secondary)',
        accent: 'var(--color-brand-accent)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'border-default': 'var(--color-border-default)',
        'border-interactive': 'var(--color-border-interactive)',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      // ... rest of the config
    },
  },
  plugins: [],
};
```

You would then define the CSS variables in your global CSS file:

```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-background: #F3F4F6; /* gray-100 */
  --color-surface: #FFFFFF;
  --color-text-primary: #1F2937; /* gray-800 */
  --color-text-secondary: #6B7280; /* gray-500 */
  --color-brand-primary: #1E40AF; /* genie-blue */
  --color-brand-secondary: #14B8A6; /* genie-teal */
  --color-brand-accent: #FACC15; /* genie-amber */
  --color-border-default: #E5E7EB; /* gray-200 */
  --color-border-interactive: #6B7280; /* gray-500 */
}

.dark {
  --color-background: #111827; /* gray-900 */
  --color-surface: #1F2937; /* gray-800 */
  --color-text-primary: #F3F4F6; /* gray-100 */
  --color-text-secondary: #9CA3AF; /* gray-400 */
  --color-border-default: #374151; /* gray-700 */
  --color-border-interactive: #6B7280; /* gray-500 */
}
```

---

## 4. Typography

Our typography system is designed for readability and personality, balancing a modern heading font with a clean body font.

*   **Heading Font**: **Poppins** (Modern, rounded, playful)
*   **Body Font**: **Inter** (Clean, highly readable, neutral)

### 4.1. Type Scale

We use a modular, responsive type scale based on `rem` units for accessibility and consistency.

| Class Name        | Font Size | Line Height | Weight     | Use Case                 |
| :---------------- | :-------- | :---------- | :--------- | :----------------------- |
| `text-display-lg` | `3.75rem` | `1.2`       | `semibold` | Hero section main title  |
| `text-display-md` | `3rem`    | `1.2`       | `semibold` | Large section headings   |
| `text-heading-xl` | `2.25rem` | `1.3`       | `semibold` | Page titles (H1)         |
| `text-heading-lg` | `1.875rem`| `1.4`       | `semibold` | Section titles (H2)      |
| `text-heading-md` | `1.5rem`  | `1.5`       | `semibold` | Sub-section titles (H3)  |
| `text-heading-sm` | `1.25rem` | `1.5`       | `medium`   | Card titles, labels (H4) |
| `text-body-lg`    | `1.125rem`| `1.6`       | `normal`   | Long-form content, intros|
| `text-body-md`    | `1rem`    | `1.7`       | `normal`   | **Base Body Text**       |
| `text-body-sm`    | `0.875rem`| `1.5`       | `normal`   | Captions, metadata, legal|
| `text-body-xs`    | `0.75rem` | `1.5`       | `normal`   | Fine print, small tags   |

### 4.2. Tailwind CSS Configuration

```javascript
// tailwind.config.js
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
        display: ['Poppins', ...fontFamily.sans],
      },
      fontSize: {
        'display-lg': ['3.75rem', { lineHeight: '1.2' }],
        'display-md': ['3rem', { lineHeight: '1.2' }],
        'heading-xl': ['2.25rem', { lineHeight: '1.3' }],
        'heading-lg': ['1.875rem', { lineHeight: '1.4' }],
        'heading-md': ['1.5rem', { lineHeight: '1.5' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.5' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.7' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5' }],
      }
      // ...
    },
  },
  // ...
};
```

**Usage Example:**

```html
<h1 class="font-display text-display-lg text-primary">A Wish for Wellness</h1>
<p class="text-body-md text-secondary mt-4">Discover the modern way to enhance your vitality and connection.</p>
```

---

## 5. Spacing & Sizing

We use an 8-point grid system for all spacing, padding, margins, and layout dimensions. The base unit is **1 unit = 0.5rem = 8px**. This ensures a consistent visual rhythm throughout the site. Tailwind's default spacing scale aligns well with this, but we will use it with intention.

| Unit | Rem    | Pixels | Tailwind Class (p, m, gap, etc.) |
| :--- | :----- | :----- | :------------------------------- |
| 0.5  | 0.25rem| 4px    | `-1`                             |
| 1    | 0.5rem | 8px    | `-2`                             |
| 2    | 1rem   | 16px   | `-4`                             |
| 3    | 1.5rem | 24px   | `-6`                             |
| 4    | 2rem   | 32px   | `-8`                             |
| 5    | 2.5rem | 40px   | `-10`                            |
| 6    | 3rem   | 48px   | `-12`                            |
| 8    | 4rem   | 64px   | `-16`                            |
| 12   | 6rem   | 96px   | `-24`                            |

**Usage Principle:** Use these spacing tokens consistently for both macro-layout (gaps between sections) and micro-layout (padding within a button).

---

## 6. Border Radius

Border radius contributes significantly to our 'playful' yet 'modern' aesthetic. We use a limited set of options to maintain consistency.

| Name      | Value  | Pixels | Tailwind Class | Use Case                                    |
| :-------- | :----- | :----- | :------------- | :------------------------------------------ |
| `rounded` | `0.5rem` | 8px    | `rounded-lg`     | **Default**. Cards, modals, large elements. |
| `sm`      | `0.25rem`| 4px    | `rounded`        | Smaller elements like tags and tooltips.    |
| `full`    | `9999px`| -      | `rounded-full`   | Circular elements like avatars, icons.      |

### Tailwind CSS Configuration

We can alias Tailwind's `rounded-lg` to be our default radius for consistency.

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    borderRadius: {
      'DEFAULT': '0.5rem', // Default rounded corners
      'sm': '0.25rem',
      'lg': '0.75rem', // For a more pronounced rounded effect if needed
      'full': '9999px',
    },
    // ...
  },
  // ...
};
```

---

## 7. Shadows & Elevation

Shadows create depth and signal interactivity. Our shadows are subtle and soft to maintain a modern, clean feel.

| Name   | Value                                               | Tailwind Class | Use Case                                         |
| :----- | :-------------------------------------------------- | :------------- | :----------------------------------------------- |
| `sm`   | `0 1px 2px 0 rgb(0 0 0 / 0.05)`                     | `shadow-sm`    | Subtle lift for non-interactive elements.        |
| `md`   | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | `shadow-md`    | **Default**. Cards and interactive surfaces.     |
| `lg`   | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`| `shadow-lg`    | Modals, dropdowns, popovers.                     |
| `xl`   | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | `shadow-xl`    | Maximum elevation, for elements that need to stand out. |

**Dark Mode Note:** These shadows are designed to work on both light and dark backgrounds without modification.
```