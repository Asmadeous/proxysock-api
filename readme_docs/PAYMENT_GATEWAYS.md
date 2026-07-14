# Payment Gateways & Integration Guide

ProxySock supports multiple payment gateways to handle global transactions for both standard customers and resellers.

## 💳 Supported Gateways

### 1. **100Pay (Integrated)**
- **Features**: Supports both **Cards** and **Cryptocurrency** (USDT, BTC, etc.).
- **URL**: [https://100pay.co](https://100pay.co)
- **Integration**: Uses `@100pay-hq/checkout` on the frontend and `HundredpayService` on the backend.
- **Webhook**: `/webhooks/hundredpay`
- **Environment Variables**:
  - `HUNDREDPAY_API_KEY`: Public API Key.
  - `HUNDREDPAY_SECRET_KEY`: Secret API Key for verification.
  - `HUNDREDPAY_USER_ID`: Required for internal tracking.

### 2. **RexPay**
- **Features**: Primary card gateway (Global Accelerex). Supports Cards, Bank Transfer, and USSD via a hosted redirect checkout.
- **Docs**: [https://rexpay-docs.globalaccelerex.com/docs](https://rexpay-docs.globalaccelerex.com/docs)
- **Webhook / Callback**: `/webhooks/rexpay` (unsigned — the handler verifies every charge server-side via `getTransactionStatus` before crediting).
- **Logic**: Automatically converts USD amounts to NGN (major units, not kobo) using real-time rates from `FixerService`.
- **Environment Variables**:
  - `REXPAY_USERNAME`: Account email (Basic Auth username).
  - `REXPAY_SECRET_KEY`: Secret key (Basic Auth password).
  - `REXPAY_BASE_URL`: API host — defaults to the sandbox (`https://pgs-sandbox.globalaccelerex.com`).
- **Limitations**: No refund, transfer, or saved-card recharge API — refunds and payouts are processed manually from the RexPay dashboard.

### 3. **Plisio**
- **Features**: Dedicated Cryptocurrency payment processor.
- **Webhook**: `/webhooks/plisio`
- **Usage**: Primarily used for direct purchase and reseller wallet top-ups.

### 4. **Payvra**
- **Features**: Crypto payment gateway focused on privacy and global reach.
- **Webhook**: `/webhooks/payvra`

---

## 🔄 Payment Flows

### Standard E-commerce Checkout
1. User selects items and chooses a gateway.
2. Frontend calls `POST /web/api/orders`.
3. Backend generates a checkout session and returns a `payment_url`.
4. User completes payment on the gateway's hosted page.
5. Gateway sends a webhook to ProxySock.
6. Backend verifies the signature, marks the order as paid, and triggers `OrderProvisioningService`.

### Reseller Wallet Top-up
1. Reseller enters amount in the Financial Hub.
2. Frontend calls `POST /api/v1/wallets/deposit`.
3. Backend returns a payment link.
4. After webhook confirmation, the reseller's `main_wallet` is credited via the immutable transaction ledger.

### Reseller Infrastructure (Enterprise) Checkout
1. Reseller submits an order with a `customer_email`.
2. Backend returns a payment link for the reseller (or their customer) to pay.
3. Upon payment, credentials are automatically emailed to the `customer_email`.

---

## 🛠️ Security & Verfication
Every webhook handler verifies authenticity before crediting. Never disable these checks in production.
- **RexPay**: Callbacks carry no signature; the handler confirms every charge server-side via `getTransactionStatus`.
- **100Pay**: Verifies using `x-100pay-signature`.
- **Plisio/Payvra**: Uses IP whitelisting and secret key matching.
