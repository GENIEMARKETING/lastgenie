```markdown
# Testing Strategy: lastgenie Ecommerce Platform

| **Document Type** | Testing Strategy |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Project**       | lastgenie                                                                                                                         |
| **Category**      | Delivery                                                                                                                          |
| **Author**        | Technical Writer AI                                                                                                               |
| **Version**       | 1.0                                                                                                                               |
| **Date**          | 2023-10-27                                                                                                                        |
| **Status**        | Final                                                                                                                             |

---

## 1. Introduction

### 1.1. Document Purpose
This document outlines the comprehensive testing strategy for the `lastgenie` ecommerce website. The primary goal is to ensure the platform is robust, secure, and provides a seamless user experience before its public launch. This strategy details the scope, objectives, types of testing, environments, tools, and processes that will be employed to guarantee the quality and reliability of critical user flows, including age verification, product purchase, and the "subscribe and save" model.

### 1.2. Project Overview
`lastgenie` is a new ecommerce website for the "Genie" brand, a sexual enhancer drink for males and females. The site's core business objectives are to drive sales, build a strong brand community, and establish credibility through informative content. Key functionalities include direct-to-consumer sales, a recurring subscription model for 12-packs, and a legally-compliant age verification system. Given the nature of the product and the financial transactions involved, a rigorous testing plan is non-negotiable.

### 1.3. Scope of Testing

#### 1.3.1. In-Scope
The following features and functionalities are within the scope of this testing strategy:
- **Core Ecommerce Flow:** Product browsing, adding to cart, cart management, checkout, and order confirmation.
- **Age Verification:** Integration and functionality of the third-party age verification service at the point of purchase.
- **Subscription Model ("Subscribe and Save"):** User sign-up, recurring billing logic, subscription management (pause, cancel), and discount application.
- **User Accounts:** Registration, login, password reset, and order history.
- **Third-Party Integrations:**
    - Payment Gateway: Stripe
    - Shipping Calculator: Shippo
    - Age Verification Service API
    - Analytics & Marketing: Google Analytics 4, social media pixels, Klaviyo.
- **UI/UX:** Responsiveness across devices, visual consistency with the brand's "modern and playful" aesthetic, and overall usability.
- **Content:** Display of product information, blog posts, FAQs, and testimonials.
- **Security:** Protection of user data (PII) and payment information.
- **Performance:** Page load times and API response speed.

#### 1.3.2. Out-of-Scope
- The internal functionality of third-party services (e.g., Stripe's fraud detection algorithms, the internal uptime of the Shippo API). We will only test the integration points and our application's response to their states (success, failure, timeout).
- Usability and performance of the Content Management System (CMS) admin panel, unless it directly impacts the frontend user experience.
- Extreme load/stress testing beyond realistic launch traffic projections.

## 2. Testing Objectives
The primary objectives of our testing efforts are:
- **Functionality:** Ensure all features work as specified in the requirements.
- **Security:** Verify that the application is secure against common web vulnerabilities (OWASP Top 10) and that customer data is protected.
- **Reliability:** Confirm the application is stable and can handle expected user loads without failure, especially during payment and subscription processing.
- **Usability:** Guarantee the website is intuitive, accessible, and provides a discreet, positive experience aligned with the target personas.
- **Compliance:** Validate that the age verification process is robust and meets legal requirements.
- **Performance:** Ensure fast page loads and a responsive interface to prevent user drop-off.

## 3. Testing Levels

### 3.1. Unit Testing
- **Description:** Testing individual functions and components in isolation.
- **Responsibility:** Developers.
- **Tools:** `Jest`, `React Testing Library`.
- **Coverage Goal:** > 80% for all critical backend logic (pricing, discounts, API controllers) and frontend components.
- **Example:** A unit test will be written for the function that calculates the "Subscribe and Save" discount to ensure it correctly applies the 12-pack price of $99.

```javascript
// Example Unit Test for Subscription Discount Logic (using Jest)
describe('calculateSubscriptionPrice', () => {
  it('should apply the correct subscription price for a 12-pack', () => {
    const product = { id: '12-pack-male', regularPrice: 110, subscriptionPrice: 99 };
    const price = calculateSubscriptionPrice(product);
    expect(price).toBe(99);
  });
});
```

### 3.2. Integration Testing
- **Description:** Testing the interaction between different parts of the system.
- **Responsibility:** Developers / QA.
- **Tools:** `Jest`, `Supertest` (for API endpoint testing), `Prisma` test utilities.
- **Focus:**
    - Frontend (Next.js) communication with the Backend (Node.js/Express) API.
    - API interaction with the PostgreSQL database via Prisma.
    - API-to-API communication with third-party services (Stripe, Shippo, Age Verification).

### 3.3. End-to-End (E2E) Testing
- **Description:** Simulating complete user journeys from start to finish in a browser environment that mirrors production.
- **Responsibility:** QA / Automation Engineer.
- **Tool:** `Cypress`.
- **Key Flows:**
    1.  New user successfully completes age verification and purchases a single product.
    2.  New user signs up for a "Subscribe and Save" 12-pack.
    3.  Existing user logs in and views their order history.
    4.  User fails age verification and is blocked from checkout.
    5.  User abandons cart and receives a follow-up email (Klaviyo integration).

### 3.4. User Acceptance Testing (UAT)
- **Description:** Manual testing performed by the project stakeholder(s) to confirm the website meets business requirements and is ready for launch.
- **Responsibility:** Project Owner / Key Stakeholders.
- **Environment:** Staging.
- **Process:** QA will provide a UAT test plan with key scenarios to execute. Stakeholders will report any issues back for final review and resolution.

## 4. Types of Testing

### 4.1. Functional Testing
Validates that the application behaves as expected. Test cases will be derived directly from feature requirements. This includes form validation, navigation, and business logic execution.

### 4.2. Usability & UI/UX Testing
- **Objective:** Ensure the site is intuitive and aligns with the "modern, playful, empowering" brand aesthetic.
- **Checks:**
    - Is the purchasing flow discreet and straightforward?
    - Is navigation clear on all devices?
    - Do interactive elements provide clear feedback?
    - Is the color scheme and typography applied consistently?
    - Is dark mode functionality working correctly without compromising readability?

### 4.3. Performance Testing
- **Objective:** Ensure the site is fast and responsive.
- **Tools:** `Google Lighthouse`, `WebPageTest`.
- **Metrics & Targets:**
    - **Largest Contentful Paint (LCP):** < 2.5 seconds.
    - **First Input Delay (FID):** < 100 milliseconds.
    - **API Response Time:** < 500ms for 95% of requests under normal load.
    - **Server Load:** Monitor CPU and Memory usage on AWS Amplify during tests.

### 4.4. Security Testing
- **Objective:** Identify and mitigate potential security vulnerabilities.
- **Focus Areas:**
    - **OWASP Top 10:** Specifically checking for Injection (SQLi), Cross-Site Scripting (XSS), and Insecure Design.
    - **Data Protection:** Ensure no sensitive data (e.g., credit card details) is stored on our server. All payment processing must be handled by Stripe's tokenization.
    - **Access Control:** Verify that a user cannot access another user's order history or personal information.
    - **API Security:** All endpoints must be authenticated and authorized where necessary.

### 4.5. Compatibility Testing
- **Objective:** Ensure a consistent experience across different platforms.
- **Target Matrix:**
    - **Browsers:** Latest 2 versions of Chrome, Firefox, Safari.
    - **Operating Systems:** Windows, macOS, iOS, Android.
    - **Screen Sizes:** Mobile (375px), Tablet (768px), Desktop (1440px).

### 4.6. Compliance Testing
- **Objective:** Ensure the age verification flow is robust and legally compliant.
- **Scenarios:**
    - Test the full loop with the third-party verification service API.
    - Verify that a failed verification (due to age or invalid ID) blocks the user from proceeding to checkout.
    - Test the system's behavior if the verification service API is down or returns an error (fail-safe mechanism).
    - Ensure a session-based flag is set upon successful verification to avoid asking the user on every page load, but re-verify after a set period (e.g., 24 hours).

## 5. Test Environment & Tools

| **Area**                | **Tool / Environment**                                                                                                                              |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test Case Management**  | GitHub Issues with custom labels (`test-case`, `user-story-x`).                                                                                     |
| **Defect Management**     | GitHub Issues with a standardized bug report template and labels (`bug`, `critical`, `ui`, `backend`).                                            |
| **Unit Testing**          | Jest, React Testing Library                                                                                                                         |
| **API Testing**           | Supertest (automated), Postman (manual)                                                                                                             |
| **E2E / UI Testing**      | Cypress                                                                                                                                             |
| **Performance Testing**   | Google Lighthouse, WebPageTest                                                                                                                      |
| **CI/CD**                 | AWS Amplify connected to GitHub. Automated tests (Unit, Integration) will run via GitHub Actions on every pull request.                             |
| **Test Environments**     | **Local:** Developer machines. <br> **Staging:** An isolated environment on AWS Amplify mirroring production. <br> **Production:** Live customer-facing site on AWS Amplify. |

## 6. Test Execution & Reporting

### 6.1. Defect Management Process
1.  **Discovery:** Bugs are identified during any testing phase.
2.  **Reporting:** Bugs are logged as GitHub Issues using the "Bug Report" template, including steps to reproduce, expected vs. actual results, environment details, and screenshots/videos.
3.  **Triage:** The project lead prioritizes bugs (Critical, High, Medium, Low).
4.  **Assignment:** The bug is assigned to a developer for fixing.
5.  **Resolution:** The developer fixes the bug and updates the issue status.
6.  **Verification:** QA re-tests the bug in the Staging environment. If fixed, the issue is closed. If not, it is reopened and reassigned.

### 6.2. Entry and Exit Criteria

| **Testing Phase** | **Entry Criteria**                                                                         | **Exit Criteria**                                                                                                   |
| :---------------- | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **Integration**   | All related components have passed Unit Testing with >80% coverage.                        | All planned integration tests are passed. No Critical or High severity bugs are open.                               |
| **E2E Testing**   | Successful deployment to Staging. All Integration tests have passed.                       | All E2E test scripts are executed and passed. No Critical or High severity bugs are open.                           |
| **UAT**           | E2E Testing Exit Criteria met. Staging environment is stable. UAT test plan is ready.      | All UAT scenarios executed. No Critical bugs are open. Stakeholder sign-off has been received.                     |
| **Launch**        | UAT Exit Criteria met. Production environment is provisioned. Final performance check passed. | Successful deployment to production. Post-launch "smoke test" of critical paths is completed successfully.        |

## 7. Roles & Responsibilities

| **Role**            | **Responsibilities**                                                                                                         |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| **Developer**       | Write and maintain Unit and Integration tests for their code. Fix bugs assigned to them.                                     |
| **QA / Test Lead**  | Develop the overall test plan and strategy. Create and execute E2E test cases. Manage the defect lifecycle. Report on testing progress. |
| **Project Owner**   | Define UAT scenarios. Participate in and provide final sign-off for UAT. Prioritize defects based on business impact.         |

## 8. High-Priority Test Scenarios

The following scenarios are critical for launch and will receive the highest level of testing scrutiny.

#### 8.1. Age Verification Flow
- **TC-AV-01 (Success):** User enters valid details, is successfully verified by the third-party API, and is allowed to proceed to checkout.
- **TC-AV-02 (Failure - Underage):** User enters valid details but is identified as underage. An appropriate message is displayed, and the checkout process is blocked.
- **TC-AV-03 (Failure - API Error):** The third-party verification API is unavailable. A user-friendly error message is displayed, and the checkout process is blocked with an option to "try again later."
- **TC-AV-04 (Persistence):** A successfully verified user is not prompted for verification again within the same session or for a defined period (e.g., 24 hours).

#### 8.2. "Subscribe and Save" Flow
- **TC-SUB-01 (Sign-up):** User successfully adds a 12-pack to the cart with the "Subscribe and Save" option selected. The price in the cart and at checkout reflects the $99 subscription price.
- **TC-SUB-02 (Order Confirmation):** Upon successful purchase, the order confirmation page and email clearly state that this is a recurring subscription order.
- **TC-SUB-03 (Account Management):** User can log into their account, view their active subscription, and successfully use the "Cancel Subscription" functionality.
- **TC-SUB-04 (Mixed Cart):** User adds a subscription item and a one-time purchase item to the same cart. Checkout calculates totals and shipping correctly for both.

#### 8.3. Core Checkout & Integration Flow
- **TC-CO-01 (Stripe Success):** User enters valid Stripe test card details, and the payment is processed successfully. An order is created in the database, and the user is redirected to the confirmation page.
- **TC-CO-02 (Stripe Failure):** User enters invalid or declined card details. Stripe returns an error, which is displayed clearly to the user, and they are allowed to re-enter their details without losing cart contents.
- **TC-CO-03 (Shippo Real-time Rates):** User enters a valid shipping address at checkout. The Shippo API is called, and multiple shipping options (e.g., Standard, Express) with correct real-time rates are displayed.
- **TC-CO-04 (GA4 & Pixels):** A successful purchase transaction event is correctly fired and sent to Google Analytics 4 and relevant social media pixels with the correct currency and value.

```