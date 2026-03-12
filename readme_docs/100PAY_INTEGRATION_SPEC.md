===============================================================================
100PAY DOCUMENTATION - COMPLETE SITE CONTENT
===============================================================================

Website: https://docs.100pay.co
Last Updated: 2024

===============================================================================
TABLE OF CONTENTS
===============================================================================
1. Home Page
2. Getting Started - Overview
3. Payments - Overview
4. Payments - Checkout
5. Wallets
6. Cards
7. Developer Tools
8. API Overview
9. Payment Links
10. Libraries and Plugins Overview

===============================================================================
1. HOME PAGE
===============================================================================

Welcome to the 100Pay Developers documentation. Learn about our tools, SDKs and APIs

Key Sections:
- Seamless Payments: Accept payments from customers around the world.
- Easy Integration: Leverage the simplicity of our Checkout SDKs and start accepting payments in minutes.
- Developer Tools: Explore our APIs and SDKs to build custom payment solutions.
- APIs: Integrate with our APIs to build custom payment solutions.

Links:
- Get Started: https://docs.100pay.co/getting-started
- GitHub: https://github.com/shop100global

Copyright © 2024

===============================================================================
2. GETTING STARTED - OVERVIEW
===============================================================================

URL: https://docs.100pay.co/getting-started/overview

Welcome to the 100Pay Developers documentation. Learn how to build amazing products and payment solutions on our APIs, tools and SDKs.

Main Features:

[A] PAYMENTS
Learn how to receive payments on your website or app using 100Pay APIs, tools and SDKs
Link: https://docs.100pay.co/getting-started/payments

[B] WALLETS
Integrate wallet payments effortlessly with 100Pay's APIs, tools, and SDKs for smooth, secure transactions.
Link: https://docs.100pay.co/getting-started/wallets

[C] CARDS
Enable card payments easily with 100Pay's APIs, tools, and SDKs for a secure, seamless checkout experience.
Link: https://docs.100pay.co/getting-started/cards

[D] DEVELOPER TOOLS
Enhance your development with 100Pay's tools and SDKs, simplifying integration and scaling for your website or app.
Link: https://docs.100pay.co/getting-started/developer-tools

[E] LIBRARIES AND PLUGINS
Integrate payments easily with 100Pay's libraries and plugins for a quick, seamless setup on your site or app.
Link: https://docs.100pay.co/getting-started/libraries-and-plugins

[F] GUIDES
Get started quickly with 100Pay's guides, featuring clear, step-by-step instructions for integrating payments on your site or app.
Link: https://docs.100pay.co/getting-started/guides

===============================================================================
3. PAYMENTS - OVERVIEW
===============================================================================

URL: https://docs.100pay.co/getting-started/payments/overview

Learn how to receive payments on your website or app using 100Pay APIs, tools and SDKs.

Getting Started Section:

[A] PAYMENT LINKS
Create payment links to receive payments from your customers for your products or services.
Link: https://docs.100pay.co/getting-started/payments/payment-links

[B] INVOICES
Create, send, and manage invoices with advanced features.
Link: https://docs.100pay.co/getting-started/payments/invoices

[C] CHECKOUT
Securely accept both one-time purchases and subscription payments online with ease.
Link: https://docs.100pay.co/getting-started/payments/checkout

Related Links:
- Back to Overview: https://docs.100pay.co/getting-started/overview
- Payment Links: https://docs.100pay.co/getting-started/payments/payment-links

GitHub Resources:
- Star on GitHub: https://github.com/shop100global/100pay-checkout-js
- Create Issues: https://github.com/shop100global/100pay-checkout-js/issues

===============================================================================
4. PAYMENTS - CHECKOUT
===============================================================================

URL: https://docs.100pay.co/getting-started/payments/checkout

Title: Checkout
Description: Accept payments online on your website or app with ease.

REQUIREMENTS:
Before you can start accepting crypto payments, you need to create a 100pay Account and obtain your API keys.
Account creation link: https://nanoapps.store/100pay/view

SECTION 1: USING THE CHECKOUT SDK
==========================================

The Checkout SDK is a JavaScript library that allows developers to securely accept both one-time purchases and subscription payments on their website or app.

Installation Methods:

1. NPM:
   npm install @100pay-hq/checkout

2. PNPM:
   pnpm add @100pay-hq/checkout

3. YARN:
   yarn add @100pay-hq/checkout

4. HTML Script Tag:
   <script src="https://js.100pay.co/"></script>

SECTION 2: IMPORT THE LIBRARY
========================================

JavaScript:
   import { shop100Pay } from "@100pay-hq/checkout";
   // or import using require
   const shop100Pay = require("@100pay-hq/checkout")

TypeScript:
   import { COUNTRIES, CURRENCIES, shop100Pay } from "@100pay-hq/checkout";
   // or import using require
   const shop100Pay = require("@100pay-hq/checkout")

Alternative: Use the global variable `shop100Pay` if you included the script tag in your HTML file.

SECTION 3: USING shop100Pay
=====================================

The shop100Pay function is the main entry point for integrating 100Pay's checkout process into your application.

EXAMPLE USAGE:
==============

import { v4 as uuidv4 } from "uuid";
import { COUNTRIES, CURRENCIES, shop100Pay } from "@100pay-hq/checkout";

const chargeData = {
  ref_id: uuidv4(), // Unique transaction reference ID
  api_key: "your-api-key", // Replace with your 100Pay API key
  billing: {
    amount: 10000, // Amount to be charged
    currency: CURRENCIES.USD, // Currency in which the payment will be made
    description: "Purchase of digital product", // Description of the payment
    country: COUNTRIES.US, // Country of the customer
    pricing_type: "fixed", // Pricing type (fixed or variable)
  },
  customer: {
    user_id: "12345", // Unique ID of the customer
    name: "John Doe", // Name of the customer
    email: "[email protected]", // Email address of the customer
    phone: "+1234567890", // Phone number of the customer
  },
  metadata: {
    is_approved: "yes",
    order_id: "OR2", // Optional order ID
    charge_ref: "REF", // Optional charge reference
  },
  call_back_url: "http://localhost:8000/verifyorder/", // URL to which the user will be redirected after payment
  onClose: () => {
    console.log("User closed the payment modal.");
  },
  callback: (reference) => {
    console.log(`Transaction successful with reference: ${reference}`);
  },
  onError: (error) => {
    console.error("An error occurred:", error);
  },
  onPayment(reference: string) {
    console.log("Payment completed with reference:", reference);
  },
};

const displayOptions = {
  maxWidth: "500px", // Optional: specify the max width of the payment modal
};

const payWith100Pay = async () => {
  shop100Pay.setup(
    chargeData,
    displayOptions
  );
};

export default payWith100Pay;

SECTION 4: shop100Pay FUNCTION PARAMETERS
===========================================

The shop100Pay function takes two parameters: chargeData and displayOptions.

4.1 CHARGEDATA OBJECT
---------------------

* ref_id (required, string): A unique identifier for the transaction, typically generated using a UUID.

* api_key (required, string): Your 100Pay API key required to authenticate the transaction.

* billing (required, object): An object containing billing information:
  - amount: The amount to be charged.
  - currency: The currency in which the payment will be made (e.g., USD).
  - description: A brief description of the payment.
  - country: The country of the customer (e.g., US).
  - pricing_type: The type of pricing, either "fixed" or "variable".

* customer (required, object): An object containing customer information:
  - user_id: A unique identifier for the customer.
  - name: The customer's name.
  - email: The customer's email address.
  - phone: The customer's phone number.

* metadata (optional, object): An object for additional metadata (e.g., order_id, charge_ref, etc.).

* call_back_url (required, string): A URL to which the user will be redirected after the payment is completed.

* onClose (optional, function): A callback function that is triggered when the user closes the payment modal.

* callback (required, function): A callback function that is triggered when the transaction is successful.

* onError (optional, function): A callback function that is triggered if there is an error during the payment process.

* onPayment (optional, function): A callback function that is triggered after the payment is completed, with the payment reference as its argument.

4.2 DISPLAYOPTIONS OBJECT
--------------------------

* maxWidth (optional, string): An optional parameter to specify the maximum width of the payment modal.

* maxHeight (optional, string): An optional parameter to specify the maximum height of the payment modal.

SECTION 5: CHARGEDATA INTERFACE
================================

interface ChargeData {
  ref_id: string;
  api_key: string;
  billing: {
    amount: number;
    currency: string;
    description: string;
    country: string;
    pricing_type: string;
  };
  customer: {
    user_id: string;
    name: string;
    email: string;
    phone: string;
  };
  metadata?: Record<string, string>;
  call_back_url: string;
  onClose?: () => void;
  callback: (reference: string) => void;
  onError?: (error: any) => void;
  onPayment?: (reference: string) => void;
}

SECTION 6: DISPLAYOPTIONS INTERFACE
====================================

interface DisplayOptions {
  maxWidth?: string;
  maxHeight?: string;
}

RELATED LINKS:
- Previous: Invoices - https://docs.100pay.co/getting-started/payments/invoice
- Next: Wallets - https://docs.100pay.co/getting-started/wallets

GitHub:
- Star on GitHub: https://github.com/shop100global/100pay-checkout-js
- Create Issues: https://github.com/shop100global/100pay-checkout-js/issues

Copyright © 2024

===============================================================================
5. WALLETS
===============================================================================

URL: https://docs.100pay.co/getting-started/wallets

Title: Wallets
Description: Learn how to create and manage wallets for your users.

PREREQUISITE:
This guide assumes you already have an account on the 100Pay Platform. If you do not have one, you can create via: https://nanoapps.store/100pay/view

SECTION 1: WHAT IS THE WALLET SYSTEM?
======================================

Wallets on the 100Pay platform is a feature that allows you to create and manage wallets for cryptocurrency assets all on the dashboard. You can use these wallets to store, send, and receive cryptocurrencies.

SECTION 2: HOW DO WALLETS WORK?
================================

1. Create a Wallet: You can create a wallet for each cryptocurrency asset you want to store, send, or receive.

2. Manage Wallets: You can view your wallet balance, transaction history, and other details in your 100Pay dashboard.

3. Send and Receive Cryptocurrencies: You can send and receive cryptocurrencies to and from your wallet using the wallet address on generated QR codes.

4. Swap Cryptocurrencies: You can swap cryptocurrencies to Pay Tokens, USDT or your local fiat directly from your wallet.

SECTION 3: WHY USE WALLETS?
============================

* Secure Storage: Wallets are secure and encrypted, so you can trust that your cryptocurrency assets are safe.

* Convenient: You can easily send and receive cryptocurrencies using your wallet address or QR code.

* Track Transactions: You can view your transaction history and track your payments in your 100Pay dashboard.

* Manage all your assets in one place: You can manage all your cryptocurrency assets in one place, making it easier to keep track of your portfolio.

SECTION 4: HOW TO CREATE A WALLET?
===================================

Step-by-Step Process:

1. Create a Wallet:
   - Navigate to the "Assets" tab in your 100Pay dashboard.
   - Select the cryptocurrency asset you want to create a wallet for.
   - Click on the "Receive" button. It checks if you have a wallet already and displays it, else it gives you an option to create one for the asset.
   - Click on the "Generate Wallet" button to create a wallet for that asset.

Congratulations! You have successfully created a wallet for your cryptocurrency asset. You can now use it to store, send, and receive cryptocurrencies.

Dashboard Screenshots Available:
- wallets1-8.png
- wallets2-8.png
- wallets3-8.png
- wallets4.jpeg

RELATED LINKS:
- Previous: Checkout - https://docs.100pay.co/getting-started/payments/checkout
- Next: Cards - https://docs.100pay.co/getting-started/cards

GitHub:
- Star on GitHub: https://github.com/shop100global/100pay-checkout-js
- Create Issues: https://github.com/shop100global/100pay-checkout-js/issues

Copyright © 2024

===============================================================================
6. CARDS
===============================================================================

URL: https://docs.100pay.co/getting-started/cards

Title: Cards
Description: Learn how cards work on 100Pay

LIMITED ACCESS:
This service is exclusively available to startups or businesses that can meet a minimum order requirement of 1,000 cards.

ABOUT CARD SERVICES:
You can issue cards to your users using the 100Pay PayCard APIs. To get started or learn more about how this feature can support your business, please contact the sales team here: https://forms.gle/NiN1jb4NVK2eghEa7

RELATED LINKS:
- Previous: Wallets - https://docs.100pay.co/getting-started/wallets
- Next: Developer Tools - https://docs.100pay.co/getting-started/developer-tools

Copyright © 2024

===============================================================================
7. DEVELOPER TOOLS
===============================================================================

URL: https://docs.100pay.co/getting-started/developer-tools

Title: Developer Tools
Description: Learn how to use our developer tools to integrate 100Pay with your product.

MAIN SECTIONS:

[A] API REFERENCE
Description: Learn how to use our API to integrate 100Pay with your product
Link: https://docs.100pay.co/api/introduction/overview

[B] SDKs
Description: Learn how to use our SDKs to integrate 100Pay with your product
Link: https://docs.100pay.co/getting-started/libraries-and-plugins/libraries

[C] PLUGINS
Description: Learn how to use our plugins to integrate 100Pay with your product
Link: https://docs.100pay.co/getting-started/libraries-and-plugins/plugins

[D] POSTMAN COLLECTION
Description: Learn how to use our Postman collection to test your integration
Link: https://documenter.getpostman.com/view/13045730/2s93RMUatE#intro

RELATED LINKS:
- Previous: Cards - https://docs.100pay.co/getting-started/cards
- Next: Libraries and Plugins Overview - https://docs.100pay.co/getting-started/libraries-and-plugins/overview

Copyright © 2024

===============================================================================
8. API - OVERVIEW
===============================================================================

URL: https://docs.100pay.co/api/introduction/overview

Title: Overview
Description: Developer API documentation for 100pay platform.

GETTING STARTED:
================

Before you can start accepting crypto payments with 100Pay checkout, you will need:
- A 100Pay account
- Your account API keys

Create a 100Pay Account: https://dashboard.100pay.co/

OBTAINING API KEYS:
====================

Step 1: Sign In to Your Account
   Once you've created your account, click on settings

Step 2: Navigate to Developer Settings
   In the Settings menu, go to the Developers Settings section

Step 3: Get Your Public Keys
   Select your public keys

IMPORTANT SECURITY NOTE:
=========================

You will need to provide these keys in your request headers.

The required field is "api-key" and can either be your public or secret key depending on which endpoint you're calling.

WARNING: Always ensure you never call our API endpoints with your private keys from the browser or your front end. Anyone with your secret keys can move funds from your account.

API ENDPOINTS DOCUMENTATION:
============================

100Pay Developers Documentation includes the following endpoints:

1. Create Payment Charge
   Link: https://docs.100pay.co/api/introduction/create-payment-charge

2. Get Payment Charge
   Link: https://docs.100pay.co/api/introduction/get-payment-charge

3. Create crypto Charge
   Link: https://docs.100pay.co/api/introduction/create-crypto-charge

4. Get Crypto Charge
   Link: https://docs.100pay.co/api/introduction/get-crypto-charge

5. Cancel Crypto Charge
   Link: https://docs.100pay.co/api/introduction/cancel-crypto-charge

6. Convert Checkout Asset and watch for payment
   Link: https://docs.100pay.co/api/introduction/convert-checkout-asset-and-watch-for-payments

7. Verify Payments
   Link: https://docs.100pay.co/api/introduction/verify-payments

RELATED CONTENT:
================
- HTML Integration Guide: https://docs.100pay.co/getting-started/guides/html
- Create Payment Charge (POST): https://docs.100pay.co/api/introduction/create-payment-charge

GitHub:
- Star on GitHub: https://github.com/shop100global/100pay-checkout-js
- Create Issues: https://github.com/shop100global/100pay-checkout-js/issues

Copyright © 2024

===============================================================================
9. PAYMENT LINKS
===============================================================================

URL: https://docs.100pay.co/getting-started/payments/payment-links

Title: Payment Links
Description: Use Payment Links to sell online without a website.

SECTION 1: WHAT ARE PAYMENT LINKS?
===================================

Payment Links are a simple way to sell online without a website. Create a full payment page in just a few clicks and share the link with your customers—no code required.

SECTION 2: HOW DO PAYMENT LINKS WORK?
======================================

1. Create a Payment Link: 
   Enter the details of your product or service, including the price, description, and image.

2. Share the Link: 
   Copy the Payment Link and share it with your customers via email, SMS, or social media.

3. Receive Payments: 
   Customers can click on the Payment Link to view the product details and make a payment using their preferred payment method.

SECTION 3: WHY USE PAYMENT LINKS?
==================================

* No Website Required: You can start selling online without a website.

* Quick Setup: Create a Payment Link in just a few clicks.

* Secure Payments: Payment Links are powered by 100Pay, so you can trust that your payments are secure.

* Flexible Payment Options: Customers can pay using their preferred cryptocurrency or a combination of cryptocurrencies.

SECTION 4: HOW TO CREATE A PAYMENT LINK?
=========================================

Step 1: Sign in to your 100Pay Account
   If you don't have an account, you can create one here: https://nanoapps.store/100pay/view

Step 2: Create a Payment Link
   - Click on the "Payment Links" tab in your 100Pay dashboard.
   - Enter the details of your product or service, including the price, description, and image.
   - Click on the "Create Payment Link" button to generate the Payment Link.

Step 3: Share the Payment Link
   - Copy the Payment Link and share it with your customers via email, SMS, or social media.
   - Customers can click on the Payment Link to view the product details and make a payment using their preferred payment method.

Step 4: Receive Payments
   - You will receive a notification when a payment is made through the Payment Link.
   - You can track your payments and manage your Payment Links in your 100Pay dashboard.

Dashboard Screenshots Available:
   - 100pay-app-app-store.jpeg
   - 100pay-app---app-store--125am--09-13.jpeg
   - 100pay-app---app-store--127am--09-13.jpeg
   - 100pay-app---app-store--130am--09-13.jpeg

RELATED LINKS:
- Previous: Payments Overview - https://docs.100pay.co/getting-started/payments/overview
- Next: Invoices - https://docs.100pay.co/getting-started/payments/invoice

GitHub:
- Star on GitHub: https://github.com/shop100global/100pay-checkout-js
- Create Issues: https://github.com/shop100global/100pay-checkout-js/issues

Copyright © 2024

===============================================================================
10. LIBRARIES AND PLUGINS - OVERVIEW
===============================================================================

URL: https://docs.100pay.co/getting-started/libraries-and-plugins/overview

Title: Overview
Description: Browse through our libraries and plugins to find the right tools for your project.

SECTION 1: LIBRARIES
====================

Available Libraries:

1. JavaScript
   Link: https://docs.100pay.co/getting-started/libraries-and-plugins/libraries#javascript

2. NodeJS
   Link: https://docs.100pay.co/getting-started/libraries-and-plugins/libraries#nodejs

3. Flutter
   Link: https://docs.100pay.co/getting-started/libraries-and-plugins/libraries#flutter

Main Libraries Page: https://docs.100pay.co/getting-started/libraries-and-plugins/libraries

SECTION 2: PLUGINS
==================

Available Plugins:

1. WordPress
   Link: https://docs.100pay.co/getting-started/libraries-and-plugins/plugins#wordpress

Main Plugins Page: https://docs.100pay.co/getting-started/libraries-and-plugins/plugins

CONTRIBUTION:
=============

Contribute: Have an idea for a library or plugin? We encourage the community to contribute to the ecosystem by creating libraries and plugins for other languages and frameworks.

RELATED LINKS:
- Previous: Developer Tools - https://docs.100pay.co/getting-started/developer-tools
- Libraries Detail Page: https://docs.100pay.co/getting-started/libraries-and-plugins/libraries

GitHub:
- Star on GitHub: https://github.com/shop100global/100pay-checkout-js
- Create Issues: https://github.com/shop100global/100pay-checkout-js/issues

Copyright © 2024

===============================================================================
ADDITIONAL NOTES
===============================================================================

NAVIGATION STRUCTURE:

Main Menu Items:
1. Getting started - https://docs.100pay.co/getting-started
2. API - https://docs.100pay.co/api

Getting Started Sub-sections:
- Overview
- Payments
- Wallets
- Cards
- Developer Tools
- Libraries and Plugins
- Guides

API Sub-sections:
- Introduction
- Wallets

KEY EXTERNAL LINKS:

Dashboard: https://dashboard.100pay.co/
Account Creation: https://nanoapps.store/100pay/view
GitHub Repository: https://github.com/shop100global
GitHub Issues: https://github.com/shop100global/100pay-checkout-js/issues
Sales Contact: https://forms.gle/NiN1jb4NVK2eghEa7
Postman Collection: https://documenter.getpostman.com/view/13045730/2s93RMUatE#intro

PAYMENT METHODS SUPPORTED:

- Cryptocurrencies (mentioned throughout)
- Pay Tokens
- USDT (Stablecoin)
- Local Fiat Currency

MAIN FEATURES:

1. Payments System
   - Payment Links
   - Checkout SDK
   - Invoices (page not yet fully developed)

2. Wallet Management
   - Create wallets
   - Send and receive cryptocurrencies
   - Swap cryptocurrencies
   - Track transactions

3. Card Services (Limited Access)
   - PayCard APIs
   - Minimum 1,000 card order requirement

4. Developer Tools
   - APIs
   - SDKs (JavaScript, NodeJS, Flutter)
   - Plugins (WordPress)
   - Postman Collection

REQUIREMENTS FOR GETTING STARTED:

1. 100Pay Account
2. API Keys (Public and Secret)
3. For Checkout: Unique transaction reference ID (UUID)
4. Customer information (user_id, name, email, phone)
5. Billing information (amount, currency, description, country, pricing_type)

SUPPORTED FRAMEWORKS & LANGUAGES:

- JavaScript/TypeScript
- Node.js
- Flutter
- WordPress
- HTML/Vanilla JS

CODE EXAMPLES PROVIDED:

- Checkout SDK Installation (npm, pnpm, yarn, script tag)
- Import Library (JavaScript and TypeScript)
- shop100Pay Implementation Example
- ChargeData Interface Definition
- DisplayOptions Interface Definition

===============================================================================
END OF DOCUMENTATION
===============================================================================

Generated: 2024
Source: https://docs.100pay.co
All content compiled from official 100Pay documentation website.
