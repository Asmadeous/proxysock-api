# Reseller Integration & Management Guide

ProxySock provides two distinct models for resellers to integrate with our infrastructure.

## 👥 Reseller Types

### 1. API-only Reseller
- **Audience**: Developers building their own frontend/infrastructure.
- **Workflow**: 
  - Fund their wallet in our dashboard.
  - Call our API to provision resources.
  - Pay directly from their balance on every successful provision.
  - Receive credentials instantly in the API response.

### 2. Infrastructure (Enterprise) Reseller
- **Audience**: Resellers who want us to handle the customer interface and payments.
- **Workflow**:
  - Use our enterprise frontend/API to create orders.
  - Pass a `customer_email` for every order.
  - Generate a payment link for their customer.
  - Once the customer pays, we provision the resource and email credentials directly to the customer.

---

## 🔐 Authentication

Resellers use a dual-factor authentication system:
1.  **Secret API Key**: Used to obtain a short-lived session token.
2.  **JWT Token**: Used for all subsequent API calls.

### Handshake Flow:
```bash
# Obtain JWT Token
POST /api/v1/auth/token
Headers: X-API-KEY: sk_live_your_key_here

# Response
{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "expires_in": 3600
}
```

---

## 🛒 Order Management

### Creating a Single Order
```bash
POST /api/v1/orders
Headers: Authorization: Bearer <token>
Body:
{
  "product_id": "uuid",
  "quantity": 1,
  "metadata": { "countryCode": "US" }
}
```

### Batch Checkout (Infrastructure Only)
Infrastructure resellers can batch products into a single payment intent via the `/api/v1/orders/checkout_cart` endpoint.

---

## 🪝 Webhook System
Resellers should configure a `webhook_url` in their dashboard to receive real-time updates on resource activation.

### Webhook Event Payload:
```json
{
  "event": "order.provisioned",
  "data": {
    "order_id": "uuid",
    "status": "active",
    "resource": {
      "ip_address": "1.2.3.4",
      "port": 8080,
      "username": "...",
      "password": "..."
    }
  }
}
```
**Security**: All webhooks are signed with an `HMAC-SHA256` signature using the reseller's secret key.

---

## 💰 Financial Hub
- **Immutable Ledger**: Every credit and debit is a permanent record. Balance is dynamically calculated from the transaction sum.
- **Minimum Deposit**: Configurable in the admin settings.
- **Supported Deposit Methods**: 100Pay (Cards/Crypto), RexPay (Cards), Plisio.
