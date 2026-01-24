```markdown
# WCAG 2.2 AA Checklist for lastgenie

*   **Document Type**: WCAG 2.2 AA Checklist
*   **Project**: lastgenie
*   **Purpose**: To guide the development and auditing of the `lastgenie` ecommerce website, ensuring it meets the Web Content Accessibility Guidelines (WCAG) 2.2 at the AA conformance level. This is critical for legal compliance, ethical design, and reaching the target 30-50 age demographic, which may include users with varying abilities.

---

## Introduction

This document outlines the specific success criteria from WCAG 2.2 that the `lastgenie` website must meet. Each item includes a status tracker, a description of the criterion, and actionable implementation notes tailored to the project's features, tech stack (Next.js, Tailwind CSS), and design aesthetic.

The four principles of accessibility (POUR) provide the structure for this checklist:

1.  **Perceivable**: Information and user interface components must be presentable to users in ways they can perceive.
2.  **Operable**: User interface components and navigation must be operable.
3.  **Understandable**: Information and the operation of the user interface must be understandable.
4.  **Robust**: Content must be robust enough that it can be interpreted reliably by a wide variety of user agents, including assistive technologies.

**Status Key**:
*   `[ ]` - Not Started
*   `[/]` - In Progress
*   `[x]` - Complete
*   `[N/A]` - Not Applicable

---

## 1. Perceivable

### Guideline 1.1 - Text Alternatives

| Status | Criterion | Level | Description & `lastgenie` Implementation Notes |
| :----: | :--- | :---: | :--- |
| `[ ]` | **1.1.1 Non-text Content** | A | Provide text alternatives for any non-text content. <br/><br/> **For `lastgenie`**: <br/>- **Product Images**: All images of the male and female enhancer bottles (single and 12-packs) must have descriptive `alt` text. E.g., `alt="Genie 50ML sexual enhancer drink for men"` and `alt="12-pack of Genie 50ML sexual enhancer drink for women"`. <br/>- **Logo**: The Genie logo should have `alt="lastgenie homepage"`. <br/>- **Decorative Images**: Any purely decorative images used for the "modern and playful" aesthetic should have an empty `alt` attribute (`alt=""`) to be ignored by screen readers. <br/>- **Icons**: All icons (e.g., cart, user profile) must have an accessible name, either via `aria-label` or visually hidden text. |

### Guideline 1.3 - Adaptable

| Status | Criterion | Level | Description & `lastgenie` Implementation Notes |
| :----: | :--- | :---: | :--- |
| `[ ]` | **1.3.1 Info and Relationships** | A | Information, structure, and relationships conveyed through presentation can be programmatically determined. <br/><br/> **For `lastgenie`**: <br/>- Use semantic HTML. `<h1>` for the main page title, `<h2>`-`<h6>` for section headings (e.g., "Customer Testimonials," "From Our Blog"). <br/>- Use `<nav>`, `<main>`, `<section>`, and `<footer>` for page structure. <br/>- On product pages, use `<ul>` for ingredient lists and `<figure>` for product images with `<figcaption>`. <br/>- In all forms (checkout, subscribe, contact), correctly associate `<label>` elements with their corresponding `<input>` controls using the `for` attribute. |
| `[ ]` | **1.3.5 Identify Input Purpose** | AA | The purpose of each input field collecting information about the user can be programmatically determined. <br/><br/> **For `lastgenie`**: <br/>- This is critical for the checkout and account creation forms. Use the `autocomplete` attribute on inputs for common data like name (`autocomplete="name"`), email (`autocomplete="email"`), address (`autocomplete="street-address"`), and credit card information (`autocomplete="cc-name"`). This helps users with cognitive disabilities and improves usability for everyone by enabling browser autofill. |

### Guideline 1.4 - Distinguishable

| Status | Criterion | Level | Description & `lastgenie` Implementation Notes |
| :----: | :--- | :---: | :--- |
| `[ ]` | **1.4.1 Use of Color** | A | Color is not used as the only visual means of conveying information. <br/><br/> **For `lastgenie`**: <br/>- **Form Errors**: Do not indicate an error with only a red border. Add an icon and a text message explaining the error. <br/>- **Links**: Ensure links are not only distinguished by color. They should have an underline or other non-color indicator, at least on hover/focus. |
| `[ ]` | **1.4.3 Contrast (Minimum)** | AA | Visual presentation of text and images of text has a contrast ratio of at least 4.5:1. <br/><br/> **`lastgenie` Color Palette Check**: <br/>- **Text (`#1F2937`) on Background (`#F3F4F6`)**: Ratio is **11.69:1**. **PASSES**. <br/>- **Primary (`#1E40AF`) text on Background (`#F3F4F6`)**: Ratio is **5.45:1**. **PASSES**. <br/>- **Secondary (`#14B8A6`) text on Background (`#F3F4F6`)**: Ratio is **3.24:1**. **FAILS**. Do not use for normal body text. Can be used for large text (18pt+) where the required ratio is 3:1. <br/>- **Accent (`#FACC15`) text on Background (`#F3F4F6`)**: Ratio is **1.55:1**. **FAILS**. This color must not be used for text. It can be used for graphical elements or as a background for dark text. <br/>- **White (`#FFFFFF`) text on Primary (`#1E40AF`)**: Ratio is **3.85:1**. **FAILS** for normal text. Use larger, bold text (18pt or 14pt bold) to meet the 3:1 ratio for large text. <br/><br/> **ACTION**: Adjust color usage to ensure all text meets contrast requirements. Use a contrast checker tool during development. |
| `[ ]` | **1.4.4 Resize text** | AA | Text can be resized up to 200% without loss of content or functionality. <br/><br/> **For `lastgenie`**: <br/>- Use relative units like `rem` or `em` for font sizes, not `px`. Tailwind CSS is configured to use `rem` by default, which is good practice. <br/>- Test the layout by zooming the browser to 200%. Ensure no content is cut off and all buttons/controls are still usable. |
| `[ ]` | **1.4.10 Reflow** | AA | Content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions (i.e., no horizontal scrolling). <br/><br/> **For `lastgenie`**: <br/>- The website must be fully responsive. Test at a viewport width of 320 CSS pixels (e.g., iPhone SE). The single-column layout should not require horizontal scrolling to read text or use controls. |
| `[ ]` | **1.4.11 Non-text Contrast** | AA | The visual presentation of UI components and graphical objects have a contrast ratio of at least 3:1 against adjacent colors. <br/><br/> **For `lastgenie`**: <br/>- Applies to input borders, button backgrounds, and focus indicators. <br/>- The **Accent color (`#FACC15`)** has a ratio of **2.14:1** against the **Primary color (`#1E40AF`)**. If these are used adjacent in a UI control, it may fail. <br/>- Ensure the borders of form fields on the light gray background (`#F3F4F6`) have sufficient contrast. A border of `#A1A1AA` would have a 3.03:1 ratio and pass. |
| `[ ]` | **1.4.13 Content on Hover or Focus** | AA | Where new content appears on hover or focus, it must be dismissible, hoverable, and persistent. <br/><br/> **For `lastgenie`**: <br/>- If using tooltips for ingredient information or info pop-ups, ensure: <br/> 1. They can be dismissed without moving the mouse (e.g., with the `Esc` key). <br/> 2. The user can move their mouse over the new content without it disappearing. <br/> 3. The content remains visible until the user dismisses it or moves hover/focus away. |

---

## 2. Operable

### Guideline 2.1 - Keyboard Accessible

| Status | Criterion | Level | Description & `lastgenie` Implementation Notes |
| :----: | :--- | :---: | :--- |
| `[ ]` | **2.1.1 Keyboard** | A | All functionality of the content is operable through a keyboard interface. <br/><br/> **For `lastgenie`**: <br/>- Every interactive element must be reachable and usable with the `Tab` key and other standard keys (`Enter`, `Space`, arrow keys). <br/>- **Crucial Test Paths**: <br/>  1. Navigate the main menu. <br/>  2. Select product options (male/female, quantity). <br/>  3. Add to cart. <br/>  4. Operate the entire checkout process, including the third-party age verification and Shippo shipping calculator. <br/>  5. Interact with the "Subscribe & Save" feature. |
| `[ ]` | **2.1.2 No Keyboard Trap** | A | If keyboard focus can be moved to a component, then it can be moved away from that component using only the keyboard. <br/><br/> **For `lastgenie`**: <br/>- The **Age Verification modal** is a primary risk area. Ensure the user can close the modal and return to the main page using the `Esc` key or by tabbing to a "Close" button. Focus should be trapped *inside* the modal while it is open, but it must be possible to exit. |

### Guideline 2.4 - Navigable

| Status | Criterion | Level | Description & `lastgenie` Implementation Notes |
| :----: | :--- | :---: | :--- |
| `[ ]` | **2.4.3 Focus Order** | A | If a web page can be navigated sequentially, focusable components receive focus in an order that preserves meaning and operability. <br/><br/> **For `lastgenie`**: <br/>- The DOM order should match the visual order. In Next.js with Tailwind, this is generally true unless complex CSS (like `flex-direction: row-reverse`) is used. <br/>- Test `Tab` key navigation through the header, main content, and footer. Ensure it follows a logical path. In the checkout form, the tab order should be logical: name, email, address, etc. |
| `[ ]` | **2.4.4 Link Purpose (In Context)** | A | The purpose of each link can be determined from the link text alone or from the link text together with its programmatically determined link context. <br/><br/> **For `lastgenie`**: <br/>- Avoid generic link text like "Click Here" or "Learn More" out of context. <br/>- Instead of "Learn More," use "Learn more about our ingredients." <br/>- "Buy Now" on a product page is acceptable, as the context is clear. On the homepage, it might be better as "Shop Male Enhancer." |
| `[ ]` | **2.4.7 Focus Visible** | AA | Any keyboard-operable user interface has a mode of operation where the keyboard focus indicator is visible. <br/><br/> **For `lastgenie`**: <br/>- Do not disable the default browser `outline`. Better yet, style a custom, highly visible focus state that matches the "playful" brand aesthetic. <br/>- Use Tailwind's `focus` variants. A 2px solid outline using the **Primary (`#1E40AF`)** or **Secondary (`#14B8A6`)** color would be effective. <br/>```jsx
// Example in a Next.js component with Tailwind
<button className="... focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700">
  Add to Cart
</button>
``` |

### Guideline 2.5 - Input Modalities

| Status | Criterion | Level | Description & `lastgenie` Implementation Notes |
| :----: | :--- | :---: | :--- |
| `[ ]` | **2.5.3 Label in Name** | A | For UI components with labels that include text or images of text, the accessible name contains the text that is presented visually. <br/><br/> **For `lastgenie`**: <br/>- A button with the visible text "Subscribe & Save" must have "Subscribe & Save" in its programmatic name (the `aria-label` or inner text). This is critical for voice control users who will say "Click Subscribe & Save." |
| `[ ]` | **2.5.7 Dragging Movements** | AA | All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging, unless dragging is essential. <br/><br/> **For `lastgenie`**: <br/>- If a product image carousel or a price-range slider is implemented, ensure there are also "Next/Previous" buttons or input fields to achieve the same result. |
| `[ ]` | **2.5.8 Target Size (Minimum)** | AAA | The size of the target for pointer inputs is at least 24 by 24 CSS pixels. (Note: This is a new AAA criterion in 2.2, but it is a best practice for AA and essential for good mobile UX). <br/><br/> **For `lastgenie`**: <br/>- All buttons, links, and form controls should have a clickable area that meets this minimum size. This is particularly important for mobile users and users with motor impairments. Use padding to increase the clickable area without altering the visual design too much. |

---

## 3. Understandable

### Guideline 3.1 - Readable

| Status | Criterion | Level | Description & `lastgenie` Implementation Notes |
| :----: | :--- | :---: | :--- |
| `[ ]` | **3.1.1 Language of Page** | A | The default human language of each Web page can be programmatically determined. <br/><br/> **For `lastgenie`**: <br/>- In the root layout file of the Next.js application (`layout.js` or `_app.js`/`_document.js`), set the `lang` attribute on the `<html>` tag. <br/>```jsx
<html lang="en">
  {/* ... */}
</html>
``` |

### Guideline 3.2 - Predictable

| Status | Criterion | Level | Description & `lastgenie` Implementation Notes |
| :----: | :--- | :---: | :--- |
| `[ ]` | **3.2.2 On Input** | A | Changing the setting of any user interface component does not automatically cause a change of context unless the user has been advised of the behavior before using the component. <br/><br/> **For `lastgenie`**: <br/>- When a user changes the quantity of a product in the cart, do not automatically refresh the page or proceed to checkout. The change should update a subtotal, but control should remain with the user. The user must explicitly click a button like "Update Cart" or "Proceed to Checkout." |
| `[ ]` | **3.2.4 Consistent Identification** | AA | Components that have the same functionality within a set of Web pages are identified consistently. <br/><br/> **For `lastgenie`**: <br/>- The "Add to Cart" button should have the same text and general appearance on the homepage and on individual product pages. <br/>- The shopping cart icon and account icon should be consistent across all pages. |

### Guideline 3.3 - Input Assistance

| Status | Criterion | Level | Description & `lastgenie` Implementation Notes |
| :----: | :--- | :---: | :--- |
| `[ ]` | **3.3.1 Error Identification** | A | If an input error is automatically detected, the item that is in error is identified and the error is described to the user in text. <br/><br/> **For `lastgenie`**: <br/>- For the checkout or contact forms, if a user submits invalid data, scroll focus to the first error, highlight the invalid field, and provide a clear, human-readable error message next to the field (e.g., "Please enter a valid email address"). |
| `[ ]` | **3.3.2 Labels or Instructions** | A | Labels or instructions are provided when content requires user input. <br/><br/> **For `lastgenie`**: <br/>- All form fields for checkout, "Subscribe & Save," age verification, and contact forms must have a visible `<label>` element programmatically associated with them. Placeholders are not substitutes for labels. |
| `[ ]` | **3.3.4 Error Prevention (Legal, Financial)** | AA | For Web pages that cause legal commitments or financial transactions for the user, submissions are reversible, checked for errors, and/or confirmable. <br/><br/> **For `lastgenie`**: <br/>- The checkout process is a financial transaction. Before the final purchase, a confirmation screen must be shown that allows the user to **review and correct** all information: items in the cart, shipping address, billing address, and total cost. The final "Place Order" button should only be on this confirmation step. |
| `[ ]` | **3.3.7 Redundant Entry** | A | Information previously entered by or provided to the user that is required on the same process is either pre-populated, or available for the user to select. <br/><br/> **For `lastgenie`**: <br/>- During checkout, provide a checkbox like "Use shipping address for billing address" to prevent users from having to type their address twice. |
| `[ ]` | **3.3.8 Accessible Authentication (Minimum)** | AA | A cognitive function test is not required for any step in an authentication process, unless an alternative is provided. <br/><br/> **For `lastgenie`**: <br/>- If a user account/login system is implemented, do not rely on tasks like solving puzzles or transcribing distorted text (CAPTCHA). Support password managers by using standard `autocomplete` attributes (`username`, `current-password`). If a CAPTCHA is legally required, use an accessible alternative like a non-cognitive challenge (e.g., "select all images with a car") or an object-recognition CAPTCHA service. |

---

## 4. Robust

### Guideline 4.1 - Compatible

| Status | Criterion | Level | Description & `lastgenie` Implementation Notes |
| :----: | :--- | :---: | :--- |
| `[ ]` | **4.1.1 Parsing** | A | In content implemented using markup languages, elements have complete start and end tags, elements are nested according to their specifications, elements do not contain duplicate attributes, and any IDs are unique. <br/><br/> **For `lastgenie`**: <br/>- Next.js and JSX help enforce this, but developers must still ensure no duplicate `id` attributes are used and all custom components render valid HTML. Use a linter and HTML validator to check the rendered output. |
| `[ ]` | **4.1.2 Name, Role, Value** | A | For all user interface components, the name and role can be programmatically determined; states, properties, and values that can be set by the user can be programmatically set; and notification of changes to these items is available to user agents, including assistive technologies. <br/><br/> **For `lastgenie`**: <br/>- Use standard HTML elements like `<button>`, `<input>`, `<select>` whenever possible, as they have built-in roles and states. <br/>- If creating a custom component (e.g., a custom dropdown for product selection), use ARIA attributes to define its `role` (e.g., `role="combobox"`), `state` (e.g., `aria-expanded="true"`), and `name` (`aria-labelledby`). |

---

## Tools & Resources

*   **Contrast Checker**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
*   **Browser Extension**: [axe DevTools](https://www.deque.com/axe/devtools/)
*   **Automated Scanner**: [WAVE Web Accessibility Evaluation Tool](https://wave.webaim.org/)
*   **Official Documentation**: [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
```