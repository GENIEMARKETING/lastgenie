```markdown
# Non-Functional Requirements (NFR) - lastgenie

**Document Purpose:** This document outlines the non-functional requirements for the `lastgenie` e-commerce website. These requirements define the system's operational attributes and constraints, ensuring the website is secure, reliable, performant, and usable. This document is critical for defining the legal, security, and privacy standards, with a specific focus on implementing a robust third-party age verification system and ensuring discreet purchasing for customers.

---

## 1.0 Security Requirements

Security is paramount due to the nature of the product and the need to protect customer data. The system must be architected to prevent unauthorized access, data breaches, and other security vulnerabilities.

### 1.1 Age Verification System (Critical)

To ensure legal compliance and responsible sales, a robust age verification mechanism is mandatory.

-   **NFR-SEC-01:** The system **must** integrate a third-party age verification service (e.g., Veratad, AgeChecker.Net, or similar). A simple, user-entered birthdate field is not sufficient and is not permitted.
-   **NFR-SEC-02:** Age verification must be triggered during the checkout process before a payment can be processed. Users who fail verification must be blocked from completing the purchase.
-   **NFR-SEC-03:** The verification process should be as seamless as possible, leveraging methods like identity document scanning or database lookups to minimize user friction.
-   **NFR-SEC-04:** The system must not store sensitive personal information from the verification process (e.g., driver's license numbers or full ID scans) after the verification is complete. Only the verification status (Pass/Fail) and a verification transaction ID should be stored.
-   **NFR-SEC-05:** The legal age for purchase (e.g., 18+, 21+) must be a configurable environment variable to allow for adjustments based on jurisdictional requirements.

### 1.2 Data Protection and Encryption

All user data, especially Personally Identifiable Information (PII), must be protected at all stages.

-   **NFR-SEC-06:** All data transmitted between the client (browser) and the server **must** be encrypted using TLS 1.2 or higher. The AWS Amplify deployment must be configured to enforce HTTPS-only traffic.
-   **NFR-SEC-07:** All sensitive user data stored in the PostgreSQL database (e.g., names, addresses, contact information) must be encrypted at rest.
-   **NFR-SEC-08:** Passwords must be hashed using a strong, modern, salted hashing algorithm (e.g., Argon2 or bcrypt).

### 1.3 Access Control

Access to the website's backend and administrative functions must be strictly controlled.

-   **NFR-SEC-09:** The system must implement role-based access control (RBAC) for administrative users. At a minimum, roles should include:
    -   `Admin`: Full access to the system.
    -   `Customer Support`: Access to view and manage orders and customer information, but no access to payment details or system configuration.
    -   `Content Editor`: Access to manage blog posts and static page content only.
-   **NFR-SEC-10:** The principle of least privilege must be applied, granting users only the permissions essential to perform their duties.

### 1.4 Secure Coding Practices

The application code must be developed following security best practices.

-   **NFR-SEC-11:** The application must be protected against the OWASP Top 10 vulnerabilities, including but not limited to Cross-Site Scripting (XSS), SQL Injection (mitigated by Prisma's ORM), and Cross-Site Request Forgery (CSRF).
-   **NFR-SEC-12:** All user-supplied input must be validated on the backend before being processed or stored in the database.

## 2.0 Privacy Requirements

Customer privacy is a cornerstone of building trust, especially for a personal wellness product.

### 2.1 Discreet Purchasing and Shipping (Critical)

The entire purchase and delivery experience must respect the customer's desire for privacy.

-   **NFR-PRV-01:** All shipments **must** be sent in plain, unbranded packaging. The shipping label must not mention "Genie" or the product's nature. A generic sender name (e.g., "Fulfillment Center" or a neutral holding company name) must be used.
-   **NFR-PRV-02:** The billing descriptor that appears on customer credit card statements **must** be discreet and not explicitly name the product. A generic, pre-approved business name must be configured in Stripe.
-   **NFR-PRV-03:** All transactional emails (order confirmation, shipping updates) must be professional and discreet, without overly explicit product marketing imagery in the main body.

### 2.2 User Data Management & Compliance

The site must be transparent about data collection and give users control over their information.

-   **NFR-PRV-04:** The website must feature a comprehensive and easily understandable Privacy Policy, accessible from the site footer.
-   **NFR-PRV-05:** In accordance with privacy regulations like GDPR and CCPA, users must have the ability to request access to, correction of, and deletion of their personal data through a clear process.

### 2.3 Anonymized Analytics

-   **NFR-PRV-06:** Google Analytics 4 integration must be configured to respect user privacy. IP anonymization must be enabled.

## 3.0 Legal and Compliance Requirements

The website must operate in full compliance with all relevant laws and regulations.

-   **NFR-LGL-01:** The website must display a persistent, accessible link to the Terms of Service and Privacy Policy in the footer of all pages.
-   **NFR-LGL-02:** Users must be required to affirmatively agree to the Terms of Service before creating an account or completing a purchase.
-   **NFR-LGL-03 (PCI DSS Compliance):** As the site accepts credit card payments, it must adhere to the Payment Card Industry Data Security Standard (PCI DSS). The integration with Stripe must use `Stripe Elements` or `Stripe Checkout`, which hosts payment fields in an iframe to ensure sensitive card details never touch the `lastgenie` server, significantly reducing PCI compliance scope.
-   **NFR-LGL-04 (Marketing Compliance):** All email marketing conducted via Klaviyo must be compliant with the CAN-SPAM Act, including providing a clear unsubscribe link in every email.

## 4.0 Performance Requirements

A fast, responsive website is crucial for user experience and conversion rates.

-   **NFR-PRF-01 (Core Web Vitals):** The website must meet the following Google Core Web Vitals targets for at least 75% of users:
    -   **Largest Contentful Paint (LCP):** under 2.5 seconds.
    -   **First Input Delay (FID):** under 100 milliseconds.
    -   **Cumulative Layout Shift (CLS):** under 0.1.
-   **NFR-PRF-02 (Scalability):** The AWS Amplify infrastructure must be configured to automatically scale to handle traffic spikes resulting from marketing campaigns or press features, supporting up to 500 concurrent users without performance degradation.
-   **NFR-PRF-03 (API Response Times):** The average response time for all backend API calls must be under 200ms. Critical path API calls (e.g., add to cart, checkout) must be under 100ms.

## 5.0 Usability and Accessibility Requirements

The site must be easy and intuitive for everyone to use, regardless of ability or device.

-   **NFR-USA-01 (Responsive Design):** The user interface must be fully responsive and provide an optimal viewing experience across all major device types (mobile, tablet, desktop) and screen sizes.
-   **NFR-USA-02 (Browser Compatibility):** The website must be fully functional on the latest two versions of major web browsers: Chrome, Firefox, Safari, and Edge.
-   **NFR-USA-03 (Accessibility):** The website must comply with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. This includes:
    -   Providing `alt` text for all informative images.
    -   Ensuring all functionality is navigable via keyboard.
    -   Maintaining a color contrast ratio of at least 4.5:1 for normal text.
    -   Using semantic HTML for screen reader compatibility.
-   **NFR-USA-04 (Dark Mode):** The website must support a user-toggleable dark mode. The color scheme for dark mode must also meet WCAG 2.1 AA contrast requirements.

## 6.0 Reliability and Availability Requirements

The website must be consistently online and operational.

-   **NFR-REL-01 (Uptime):** The production website must achieve a minimum of **99.9%** uptime, excluding scheduled maintenance windows.
-   **NFR-REL-02 (Backup and Recovery):**
    -   **Database:** The PostgreSQL database must have automated daily backups with a retention period of at least 14 days. Point-in-Time Recovery (PITR) must be enabled.
    -   **Recovery Point Objective (RPO):** Maximum acceptable data loss is 24 hours.
    -   **Recovery Time Objective (RTO):** The system must be fully recoverable within 4 hours in the event of a critical failure.

## 7.0 Maintainability and Extensibility Requirements

The codebase and architecture should be clean, well-documented, and easy to extend.

-   **NFR-MNT-01 (Code Quality):** The project must enforce code quality and style consistency using tools like ESLint for JavaScript/TypeScript and Prettier for automated code formatting. These checks must be integrated into a pre-commit hook.
-   **NFR-MNT-02 (Modularity):** The backend (Node.js/Express) and frontend (Next.js) must be architected in a modular fashion to allow for future feature development (e.g., new product lines, internationalization) without requiring significant refactoring.
-   **NFR-MNT-03 (Technical Documentation):**
    -   Key algorithms and complex business logic must be documented with inline comments.
    -   The backend API must have documentation generated from the code, ideally following the OpenAPI (Swagger) specification.

## 8.0 Integration Requirements

The system must integrate seamlessly with specified third-party services.

-   **NFR-INT-01 (Payment Gateway):** Stripe integration must securely handle one-time purchases and recurring subscription billing for the "Subscribe and Save" feature. Webhooks must be used to reliably update subscription status and order information in the database.
-   **NFR-INT-02 (Shipping Services):** Shippo API integration must provide real-time shipping rate calculations at checkout. The API calls must be performant and include error handling for API downtime or invalid addresses.
-   **NFR-INT-03 (Marketing and Analytics):**
    -   Google Analytics 4 and social media pixels must be implemented via a tag manager (e.g., Google Tag Manager) to avoid hardcoding scripts and to improve site performance.
    -   Klaviyo integration must support customer segmentation and automated email flows for cart abandonment, welcome series, and order confirmations.
```