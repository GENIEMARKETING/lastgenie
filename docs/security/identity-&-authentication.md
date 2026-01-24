```markdown
# Identity & Authentication

| | |
|---|---|
| **Document Type** | Identity & Authentication |
| **Category** | Security |
| **Project** | lastgenie |
| **Version** | 1.0 |
| **Date** | 2023-10-27 |

---

## 1.0 Overview

This document outlines the architecture and implementation details for the Identity and Authentication systems for the `lastgenie` e-commerce website. The primary goal is to create a secure, seamless, and compliant user account system that fosters a trusted brand community.

This system is comprised of two core components:

1.  **Customer Account Management:** A robust system for user registration, login, and session management, enabling customers to manage their profiles, orders, and subscriptions.
2.  **Age Verification:** A mandatory, third-party service integration to ensure all customers are of legal age to purchase `lastgenie` products, adhering to legal and ethical standards.

Security, data privacy, and user experience are paramount. All systems will be designed to protect user data, ensure a discreet purchasing process, and comply with relevant regulations.

## 2.0 Customer Account System

The customer account system is the foundation for managing user relationships, enabling personalized experiences, and facilitating core e-commerce functionalities like recurring subscriptions.

### 2.1 System Objectives

-   **Secure Access:** Provide a secure authentication flow using modern best practices for password hashing and session management.
-   **User Self-Service:** Allow users to create an account, manage personal details, view order history, and control their 'Subscribe and Save' plans.
-   **Data Privacy:** Ensure user data is protected, implementing data minimization principles and secure storage.
-   **Marketing Integration:** Facilitate the synchronization of customer data with marketing platforms like Klaviyo to build a strong brand community.

### 2.2 Authentication Flow

Authentication will be managed by our Node.js/Express backend, with sessions handled via JSON Web Tokens (JWTs).

#### 2.2.1 User Registration

New users will register via an email and password combination.

-   **Required Fields:**
    -   First Name
    -   Last Name
    -   Email Address (must be unique)
    -   Password
-   **Process Flow:**
    1.  User submits the registration form.
    2.  The backend validates the data (e.g., checks if the email is already in use).
    3.  The password is anfu with `bcrypt`.
    4.  A new `User` record is created in the PostgreSQL database with `emailVerified` set to `false`.
    5.  A unique, time-limited verification token is generated and sent to the user's email address.
    6.  Upon clicking the verification link, the user is redirected to the site, their token is validated, and the `emailVerified` flag is set to `true`. The user is then automatically logged in.

#### 2.2.2 User Login

-   **Credentials:** Email and Password.
-   **Security Measures:**
    -   **Rate Limiting:** The `/api/auth/login` endpoint will be protected with rate limiting to mitigate brute-force attacks.
    -   **"Forgot Password":** A standard "Forgot Password" flow will be implemented, sending a secure, single-use, time-limited reset link to the user's registered email.

#### 2.2.3 Session Management

We will use a JWT-based stateless authentication strategy.

-   **Tokens:**
    -   **Access Token:** A short-lived JWT (e.g., 15-minute expiry) containing the user's ID and role. This token is used to authorize API requests.
    -   **Refresh Token:** A long-lived JWT (e.g., 7-day expiry) used to obtain a new access token without requiring the user to log in again.
-   **Storage:** Both tokens will be stored in **`HttpOnly` cookies** to prevent access via client-side JavaScript, mitigating the risk of Cross-Site Scripting (XSS) attacks. The cookies will also be configured with the `Secure` flag, ensuring they are only sent over HTTPS.
-   **JWT Payload Example:**
    ```json
    {
      "sub": "c1a2b3d4-e5f6-7890-1234-567890abcdef", // User ID
      "email": "customer@example.com",
      "role": "CUSTOMER",
      "iat": 1672531200, // Issued at
      "exp": 1672532100  // Expires at
    }
    ```

### 2.3 Authorization

Authorization will be role-based to ensure users can only access appropriate resources.

-   **Roles:**
    -   `CUSTOMER`: Standard user role. Can manage their own profile, orders, and subscriptions.
    -   `ADMIN`: Administrative role for site management.
-   **Implementation:** Backend API endpoints will be protected by middleware that validates the JWT and checks the user's role against the required permissions for that endpoint. For example, a `CUSTOMER` can only access `GET /api/orders/me` and not `GET /api/orders/all`.

### 2.4 Data Model (Prisma Schema)

The `User` model in our PostgreSQL database will be defined using the Prisma ORM as follows. This schema includes fields for authentication, profile information, and the required age verification status.

```prisma
// schema.prisma

model User {
  id              String    @id @default(cuid())
  firstName       String
  lastName        String
  email           String    @unique
  passwordHash    String
  emailVerified   DateTime?
  ageVerified     Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  orders          Order[]
  subscriptions   Subscription[]
  stripeCustomerId String?   @unique

  @@map("users")
}
```

### 2.5 Security Best Practices

-   **Password Hashing:** All user passwords will be securely hashed and salted using the `bcrypt` library with a cost factor of at least 12. Plain-text passwords will never be stored.
-   **Data in Transit:** All communication between the client (Next.js) and server (Node.js) will be encrypted using HTTPS/TLS.
-   **CORS:** The Express backend will be configured with a strict Cross-Origin Resource Sharing (CORS) policy to only accept requests from the official `lastgenie` domain.

## 3.0 Age Verification System

Due to the nature of `lastgenie` products, a robust, legally compliant age verification system is mandatory. A simple date-of-birth input field is insufficient and presents significant legal risk.

### 3.1 Rationale and Requirements

-   **Compliance:** To meet legal requirements for selling products in the sexual wellness category.
-   **Trust:** To demonstrate brand responsibility and build trust with customers and payment processors.
-   **One-Time Process:** The verification should be a one-time, seamless event in the customer journey.

### 3.2 Chosen Third-Party Service: Veriff

We will integrate **Veriff**, a global identity verification provider. Veriff offers a robust solution that allows users to verify their age by scanning a government-issued ID. This meets our requirement for a reliable verification method.

### 3.3 Integration Flow

The verification process will be triggered before a user's first purchase.

1.  **Trigger Point:** When an unverified user clicks "Proceed to Checkout".
2.  **Frontend Check (Next.js):** The application checks the authenticated user's profile for the `ageVerified` flag. If `false`, the user is redirected to a dedicated `/verify-age` page.
3.  **Create Verification Session (Backend):**
    -   The frontend requests a Veriff session from our backend via an endpoint like `POST /api/age-verification/session`.
    -   The backend uses the Veriff API key to create a new verification session, passing the user's `id` from our database as a `vendorData` field. This links the Veriff session back to our user record.
    -   The backend returns a unique `sessionUrl` to the frontend.
4.  **User Verification (Frontend):**
    -   The frontend initializes the Veriff client (SDK) and launches the verification flow using the received `sessionUrl`.
    -   The user follows the on-screen instructions to scan their ID.
5.  **Webhook Notification (Veriff → Backend):**
    -   Once Veriff completes its analysis, it sends a webhook POST request to a pre-configured endpoint on our backend: `/api/webhooks/veriff`.
    -   The webhook payload contains the verification result (`approved` or `declined`) and the `vendorData` (our user `id`).
6.  **Update User Status (Backend):**
    -   The webhook handler first verifies the authenticity of the request using Veriff's signature.
    -   It parses the payload to get the user `id` and the verification status.
    -   If the status is `approved`, the backend updates the corresponding `User` record in the database, setting `ageVerified` to `true`.
    -   If declined, the flag remains `false`. The user can be notified and offered to retry or contact support.

### 3.4 User Experience Considerations

-   **Transparency:** The `/verify-age` page will clearly explain why verification is necessary and that their ID data is processed by Veriff for age verification purposes only and will not be stored by `lastgenie`.
-   **Persistence:** Once a user is verified, the `ageVerified: true` status is permanent. They will not be asked to verify their age on subsequent purchases.
-   **Data Minimization:** We will only store the boolean result of the verification (`true` or `false`). No personal identifiable information (PII) from the ID document (e.g., driver's license number, photo) will be requested from Veriff or stored in our database.

### 3.5 Technical Implementation Snippet

Below is a pseudo-code example of the Node.js/Express webhook handler for Veriff.

```javascript
// /api/webhooks/veriff.js

import express from 'express';
import { prisma } from '../../lib/prisma';
import { verifyVeriffSignature } from '../../lib/veriff';

const router = express.Router();

router.post('/veriff', express.json(), async (req, res) => {
  // 1. Verify the webhook signature to ensure it's from Veriff
  if (!verifyVeriffSignature(req.headers['x-signature'], req.body)) {
    return res.status(401).send('Unauthorized: Invalid signature');
  }

  const { status, vendorData, verification } = req.body;

  // 2. Check if the verification event is 'approved'
  if (verification?.status === 'approved') {
    const userId = vendorData; // This is the user ID we passed when creating the session

    if (!userId) {
      console.error('Webhook received without vendorData (userId).');
      return res.status(400).send('Bad Request: Missing user identifier.');
    }

    try {
      // 3. Update the user record in the database
      await prisma.user.update({
        where: { id: userId },
        data: { ageVerified: true },
      });

      console.log(`User ${userId} successfully age verified.`);
      // Optionally: Trigger a "Verification Complete" email to the user
      
    } catch (error) {
      console.error(`Failed to update age verification status for user ${userId}:`, error);
      return res.status(500).send('Internal Server Error');
    }
  } else {
    console.log(`Verification for user ${vendorData} was not approved. Status: ${verification?.status}`);
  }
  
  // 4. Respond to Veriff to acknowledge receipt
  res.status(200).send('Webhook received.');
});

export default router;
```

---

## 4.0 Document Control

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2023-10-27 | System | Initial document creation based on project requirements. |
```