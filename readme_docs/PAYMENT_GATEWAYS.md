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

### 4. **Bachs**
- **Features**: Hosted checkout for USD and NGN cards, NGN bank transfer, mobile money (GHS, KES, TZS, UGX, XAF, XOF, RWF, MWK, ZMW) and crypto (USDT, USDC, ETH, SOL, BNB; no BTC). Refunds by API. Settles to the account's USD balance.
- **Docs**: [https://docs.bachs.io](https://docs.bachs.io)
- **Integration**: `BachsService` creates one checkout per deposit, cart checkout or order, priced in USD with our `DEP`/`CHECKOUT`/`ORD` reference. `BachsWebhookService` confirms each payment by reading the checkout back from Bachs, then hands it to `PaymentReconciler`.
- **Webhook**: `/webhooks/bachs`, signed with `X-Bachs-Signature-V2` (rejected when the secret or signature is missing). Register the endpoint in the Bachs developer portal with `event_source: account` and these events: `checkout.completed`, `refund.paid`, `refund.failed`, `dispute.created`, `dispute.updated`. Bachs waits 10 seconds for an answer and tries each event 5 times over about 80 minutes. It emails a warning after 24 hours of failed deliveries and turns the endpoint off after 72 hours; turn it back on in the developer portal and resend the missed events.
- **Payment limits** (set per account by Bachs; ask support@bachs.io to raise them): USD cards up to $500 per payment, so above that the checkout page does not offer a USD card. Mobile money and crypto go up to $5,000; above that Bachs refuses the checkout and the customer is told the limit (HTTP 422), and a deposit is marked `failed`.
- **Short payments**: a payment Bachs accepts below its price is not credited. Staff get a Slack alert and the deposit or order stays pending for review.
- **Fees**: the customer pays the processing fee, but a card issued outside the US costs us an extra 1.5% of the payment. USD reaches the Bachs balance 2 days after payment.
- **Environment Variables**:
  - `BACHS_API_KEY`: `sk_sandbox_...` or `sk_live_...`. The prefix picks the sandbox or production API.
  - `BACHS_WEBHOOK_SECRET`: the endpoint's signing secret (`whsec_...`). For local work, `bachs listen --forward-to localhost:3000/webhooks/bachs --events checkout.completed,refund.failed,dispute.created` prints one.
- **Refunds**: automatic refunds of failed orders go back through Bachs, once per payment. NGN bank-transfer payments cannot be refunded by Bachs; refund those to the wallet. A failed Bachs refund is posted to Slack alerts.
- **Limitations**: Bachs pays out only to the account holder's own destinations, so affiliate and reseller payouts stay on Plisio and Heleket. Checkout return URLs must be public, so local development checkouts have none.

### 5. **Payvra**
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
