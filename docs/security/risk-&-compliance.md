Of course. Here is the comprehensive Risk & Compliance document for the `lastgenie` project, focusing on security and PII management, formatted in Markdown.

---

```markdown
# Risk & Compliance: Security & PII Management

- **Project:** lastgenie
- **Document Type:** Risk & Compliance
- **Category:** Security
- **Version:** 1.0
- **Date:** 2023-10-27
- **Author:** AI Technical Writer

---

## 1.0 Introduction

### 1.1 Purpose

This document outlines the critical security controls, risk mitigation strategies, and compliance policies for the `lastgenie` ecommerce website. Given the sensitive nature of the product—a sexual enhancer drink—and the legal requirement for age verification, establishing and documenting robust procedures for handling Personally Identifiable Information (PII) is paramount. The primary objectives of this document are to ensure legal and regulatory compliance, protect customer data, build consumer trust, and provide a secure development framework for the engineering team.

### 1.2 Scope

This document applies to all aspects of the `lastgenie` website and its underlying infrastructure. It covers the entire data lifecycle, including:

- **Data Collection:** The methods and points at which user data is collected.
- **Age Verification:** The specific technical implementation for verifying user age.
- **Data Processing & Storage:** How data is handled, stored, encrypted, and protected on the backend.
- **Data Transmission:** Securing data in transit between the client, server, and third-party services.
- **Compliance:** Adherence to key data privacy and payment processing regulations.
- **Third-Party Integrations:** Security standards for integrated services like payment gateways, shipping providers, and marketing tools.

### 1.3 Audience

This document is intended for project stakeholders, including developers, project managers, and legal counsel, to ensure a shared understanding of the security and compliance requirements for the `lastgenie` platform.

## 2.0 Regulatory Compliance & Legal Framework

### 2.1 Age Verification Mandate

The sale of products in the sexual wellness category is restricted to adults. The specific age of majority is typically 18 or 21 years, depending on the jurisdiction.

**Policy:** The `lastgenie` website will enforce a strict age gate for all purchases. A simple birthdate entry field is **insufficient** as it is easily falsified and offers no legal safe harbor. A robust, third-party age verification service will be implemented at checkout to mitigate legal risk and ensure compliance.

### 2.2 Data Privacy Regulations

The website will be designed to comply with the principles of major data privacy regulations, including the **General Data Protection Regulation (GDPR)** for users in the European Union and the **California Consumer Privacy Act (CCPA)**. Key principles we will adhere to include:

- **Data Minimization:** Collecting only the PII that is strictly necessary.
- **Lawfulness, Fairness, and Transparency:** Clearly informing users what data is collected and why, via an accessible Privacy Policy.
- **Purpose Limitation:** Using data only for the specified purposes for which it was collected.
- **User Rights:** Providing mechanisms for users to access, rectify, and request the deletion of their personal data.

### 2.3 PCI DSS Compliance

The Payment Card Industry Data Security Standard (PCI DSS) governs the handling of credit card information.

**Policy:** To drastically reduce PCI DSS compliance scope and risk, the `lastgenie` website will **never** handle, transmit, or store raw credit card numbers. All payment processing will be delegated to **Stripe**, a certified Level 1 PCI DSS compliant service provider, using their client-side tokenization methods (Stripe Elements/Checkout).

## 3.0 Personally Identifiable Information (PII) Management

### 3.1 PII Definition for lastgenie

The following PII will be collected and processed by the `lastgenie` platform:

- **Direct Identifiers:**
  - Full Name
  - Email Address
  - Shipping & Billing Address
  - Phone Number (optional, for shipping notifications)
- **Sensitive/Compliance Data:**
  - Age Verification Status (e.g., `verified`, `denied`)
  - Non-identifiable Verification Transaction ID (from third-party service)
- **Indirect & Financial Identifiers:**
  - IP Address
  - Order History
  - Stripe Customer ID
  - Stripe Subscription ID
  - User-Agent strings

### 3.2 Data Collection Points

PII will be collected at the following points in the user journey:

- **Age Verification Gate:** Prior to purchase.
- **Account Creation:** Name, Email, Password.
- **Checkout Process:** Name, Email, Shipping/Billing Address, Phone Number.
- **"Subscribe and Save" Sign-up:** For recurring billing and shipping information.
- **Payment Form:** Handled directly by the Stripe Elements UI component.
- **Marketing Opt-in (Klaviyo):** Email address and consent.
- **Analytics Tools (GA4, Meta Pixel):** Pseudonymized user behavior data.

### 3.3 Data Minimization Principle

Our policy is to collect only the data essential for business operations. For example, we require a shipping address to fulfill an order, but we will not ask for extraneous information like gender or date of birth for account creation (as age is verified separately).

## 4.0 Technical Implementation & Security Controls

### 4.1 Age Verification Implementation

A third-party identity verification service (e.g., Persona, Veriff, Berbix) will be integrated to manage the age verification process.

**4.1.1 Verification Flow**

1.  A user adds a product to the cart and proceeds to checkout.
2.  The backend generates a unique session token for the verification process.
3.  The frontend uses this token to initialize the third-party service's verification SDK/widget in a modal.
4.  The user follows the prompts within the secure, sandboxed UI of the third-party service to verify their age (e.g., by scanning a government-issued ID).
5.  **Crucially, the user's ID image and its extracted raw data (e.g., name, date of birth) are sent directly to the third-party service's servers and are never processed by or stored on `lastgenie` infrastructure.**
6.  Upon completion, the third-party service sends a webhook to a secure `lastgenie` backend endpoint. This webhook contains the outcome (`status: 'verified' | 'denied'`) and a `verificationId`.
7.  The `lastgenie` backend validates the webhook's authenticity (e.g., using a signed signature) and updates the user's profile in the PostgreSQL database.

**4.1.2 Database Schema Example (Prisma)**

The `User` model in our database will only store the verification status, not the sensitive data itself.

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  passwordHash    String
  isAgeVerified   Boolean   @default(false)
  ageVerificationId String? // Reference ID from third-party service
  stripeCustomerId String?  @unique

  // ... other fields like addresses, orders
}
```

### 4.2 Data Encryption

**4.2.1 Data in Transit**
All network communication will be encrypted using **TLS 1.2 or higher**. This is enforced by default on AWS Amplify and will be configured for all API calls to third-party services (Stripe, Shippo, etc.). HTTP traffic will be automatically redirected to HTTPS.

**4.2.2 Data at Rest**
- **Database Encryption:** The PostgreSQL database hosted on AWS will have encryption at rest enabled. This protects the underlying storage from unauthorized access.
- **Password Hashing:** User passwords will never be stored in plaintext. They will be hashed using a strong, salted, one-way algorithm like **bcrypt**.

```javascript
// Example of password hashing in Node.js/Express backend
import bcrypt from 'bcrypt';

const saltRounds = 12; // Use a cost factor of 12 or higher

// Hashing a new password
const password = 'user-provided-password';
const passwordHash = await bcrypt.hash(password, saltRounds);
// Store `passwordHash` in the database

// Verifying a password during login
const isMatch = await bcrypt.compare('user-login-attempt', passwordHash);
```

- **Environment Variables:** All secrets, including database credentials, API keys, and JWT secrets, will be managed as environment variables using AWS Amplify's environment variable management and will not be hardcoded in the repository.

### 4.3 Backend Security (Node.js / Express)

- **Authentication:** User sessions will be managed using JSON Web Tokens (JWTs). JWTs will be signed with a strong secret key (e.g., HS256) stored securely as an environment variable.
- **Input Validation:** All incoming request bodies, parameters, and queries will be validated using a library like `express-validator` to prevent common vulnerabilities like SQL Injection (mitigated by Prisma) and Cross-Site Scripting (XSS).
- **Security Headers:** The Express application will use middleware like `helmet` to set important HTTP security headers (e.g., `Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`).
- **Dependency Scanning:** The project will utilize `npm audit` and integrate a tool like Snyk or GitHub Dependabot to continuously scan for and alert on vulnerabilities in third-party dependencies.

### 4.4 Frontend Security (Next.js)

- **Cross-Site Scripting (XSS) Prevention:** React's default data binding (JSX) automatically escapes content, providing strong protection against XSS. Any use of `dangerouslySetInnerHTML` will be strictly forbidden unless absolutely necessary and properly sanitized.
- **Secure API Communication:** The Next.js frontend will communicate with the backend exclusively over HTTPS. The API endpoint will be stored as an environment variable.
- **Testimonial/Review Sanitization:** Any user-generated content, such as testimonials, that is displayed on the site will be sanitized on the backend before being stored to strip out any potentially malicious HTML or script tags.

## 5.0 Data Handling Policies & Procedures

### 5.1 Data Retention Policy

- **User Accounts:** Data associated with a user account (profile, address, order history) will be retained as long as the account is active.
- **Inactive Accounts:** Accounts inactive for more than 24 months may be flagged for deletion, with prior notification sent to the user's email address.
- **Order Data:** Financial records, including anonymized order information, will be retained for a minimum of 7 years to comply with tax and accounting regulations.
- **Age Verification Logs:** The `verificationId` and `status` will be retained as long as the user account exists to provide an audit trail of compliance.

### 5.2 User Data Access & Deletion ("Right to be Forgotten")

Users have the right to request access to and deletion of their personal data.

- **Access Request:** A user can contact customer support to request an export of their PII.
- **Deletion Request:** A user can request the deletion of their account. This action will:
  1.  Trigger a function to delete the user's PII (name, addresses) from the `User` and `Address` tables.
  2.  Anonymize their order history by replacing their user ID with a `NULL` or generic "deleted user" value.
  3.  Issue an API call to Stripe to delete their customer object.
  4.  Issue an API call to Klaviyo to delete their profile.
  5.  This process will be irreversible.

### 5.3 Incident Response Plan

In the event of a suspected data breach, the following high-level plan will be enacted:

1.  **Containment:** Immediately isolate affected systems from the network to prevent further data loss. Revoke compromised credentials and secrets.
2.  **Assessment:** The development team will conduct a forensic analysis to determine the breach's scope, including what data was accessed and which users were affected.
3.  **Notification:** In compliance with GDPR and other regulations, `lastgenie` will notify the relevant supervisory authority and affected users of the breach without undue delay.
4.  **Remediation:** Patch the vulnerability that led to the breach. Restore system integrity from secure backups.
5.  **Review:** Conduct a post-mortem to analyze the cause of the breach and implement additional security controls to prevent recurrence.

## 6.0 Third-Party Services & Vendor Management

### 6.1 Service Inventory & Data Sharing

| Service                  | Purpose                    | Data Handled                                              |
| ------------------------ | -------------------------- | --------------------------------------------------------- |
| **AWS Amplify**          | Hosting & Infrastructure   | Entire application, database, and all user data.          |
| **Third-Party Age Verify** | Age Verification           | Name, DoB, ID Image (Processed by them, not us).          |
| **Stripe**               | Payment Processing         | Name, Email, Address, Card Details (Processed by them).   |
| **Shippo / ShipStation** | Shipping & Fulfillment     | Name, Shipping Address, Order Details, Phone Number.      |
| **Klaviyo**              | Email Marketing            | Name, Email Address, Purchase History, Site Activity.     |
| **Google Analytics 4**   | Website Analytics          | Pseudonymized usage data, IP address (anonymized).        |
| **Meta (Facebook/IG)**   | Ad Tracking (Pixel)        | Pseudonymized user and conversion event data.             |

### 6.2 Vendor Due Diligence

Prior to integrating any new third-party service that will handle PII, a due diligence review will be conducted. This includes reviewing the vendor's:
- Privacy Policy
- Security documentation
- Compliance certifications (e.g., SOC 2, ISO 27001, PCI DSS, HIPAA)
- Data Processing Agreements (DPAs)

## 7.0 Document Review & Maintenance

This is a living document. It will be formally reviewed and updated at least annually, or whenever there are significant changes to the application architecture, data models, legal requirements, or third-party integrations.
```