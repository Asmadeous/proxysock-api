# ProxySock Reseller API Reference

Welcome to the comprehensive ProxySock Reseller API documentation. This API allows partners to automate the purchase, management, and reselling of Proxies, VPNs, VPS, RDPs, and eSIMs.

## Base URL
All API requests should be made to:
`https://proxysock.com/api/v1`

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [Products & Categories](#2-products--categories)
3. [Ordering Specific Products (Payload Guide)](#3-ordering-specific-products-payload-guide)
4. [Order Management](#4-order-management)
5. [Billing & Deposits](#5-billing--deposits)
6. [Sub-User Management](#6-sub-user-management-infrastructure-resellers-only)
7. [Virtual Machines (VMs)](#7-virtual-machines-vms)
8. [Payouts](#8-payouts)
9. [Webhooks](#9-webhooks)
10. [Support & Notifications](#10-support--notifications)

---

## 1. Authentication

All endpoints (except login/token generation) require a Bearer token in the `Authorization` header.
ProxySock uses **Rotating JWTs**. Every successful API response will contain a new token in the `Authorization` header. You **must** extract this new token and use it for your next request.

### Generate Token (For API Integration)
`POST /auth/token`

**IMPORTANT**: Email and Password authentication is strictly intended for accessing the Web Dashboard. **For API access (especially API-Only and Single-Product resellers), you MUST authenticate using your `username` and dedicated `api_key`.**

**Request:**
```json
{
  "username": "your_reseller_username",
  "api_key": "your_dedicated_api_key"
}
```

**Response (200 OK):**
```json
{
  "message": "Authentication successful",
  "token": "eyJhbG...",
  "refresh_token": "a1b2c3d4..."
}
```

### Dashboard Login
`POST /auth/login`
Used exclusively by frontend interfaces to obtain a long-lived session JWT using `email` and `password`. Do not use this for automated API workflows.

---

## 2. Products & Categories

To place an order, you must first know the `product_id` and what type of product it is (e.g., `vps`, `residential_rotating`, `vpn`).

### List Products
`GET /products`
Returns all products available to your reseller tier.

**Query Parameters:**
- `page`: Page number (default 1)
- `category_id`: Filter by category ID
- `product_type`: Filter by type (e.g., `proxy`, `vps`, `vpn`, `esim`)

**Response Snippet:**
```json
{
  "products": [
    {
      "id": 15,
      "name": "Residential Rotating V2",
      "category": "Residential Proxies",
      "base_price": 3.00,
      "currency": "USD",
      "provider_type": "myproxyapi",
      "product_type": "residential_rotating"
    }
  ]
}
```

---

## 3. Ordering Specific Products (Payload Guide)

When placing an order (`POST /orders` or `POST /orders/checkout_cart`), you must provide a `metadata` object. The required keys inside `metadata` depend entirely on the `product_type` you are ordering.

Below are the exact, strict payload requirements for each product type.

### A. Residential Rotating Proxies
**`product_type: "residential_rotating"`**

Requires traffic volume (`period`), protocol, and a dedicated `residentalRotatingConfig` object that determines the rotation logic and geotargeting.

**Example `metadata` payload:**
```json
"metadata": {
  "period": "1", // The amount of Traffic (e.g., "1" for 1 GB)
  "protocol": "http", // "http" or "socks5"
  "residentalRotatingConfig": {
    "rotationStrategy": "0", // "0" for Sticky IP, "1" for Rotating every request
    "proxyRegion": "ip-na.myproxyapi.com", // Target entry node
    "quantity": 1, // Number of credential pairs to generate
    "autoGenerate": true, // If true, randomly generates credentials
    "country": "US", // ISO Country Code for geo-targeting
    "state": "TX", // Optional: Target specific state
    "city": "Dallas" // Optional: Target specific city
  }
}
```

### B. Static Proxies (ISP & Datacenter)
**`product_type: "static_isp"` or `"datacenter"` or `"premium_isp"`**

Requires the duration (`period`) and the target location ID (`locationId`).

**Example `metadata` payload:**
```json
"metadata": {
  "period": "1", // Duration (e.g., "1" for 1 month, or "30d" for 30 days depending on the product)
  "protocol": "http",
  "locationId": "123" // The numeric Provider Location ID for the specific city/datacenter
}
```

### C. Global ISP Proxies
**`product_type: "global_isp"`**

Requires specific section targeting IDs and enforces strict 7-day or 30-day durations.

**Example `metadata` payload:**
```json
"metadata": {
  "period": "30d", // MUST be exactly "7d" or "30d"
  "protocol": "http",
  "target_section_id": "45", // The internal section ID for the ISP pool
  "target_id": "89", // The specific ISP target ID
  "selected_country_id": "US" // Target Country
}
```

### D. Virtual Private Servers (VPS & RDP)
**`product_type: "vps"` or `"rdp"`**

Requires operating system template and location targeting.

**Example `metadata` payload:**
```json
"metadata": {
  "os_template": "ubuntu-22-04", // e.g., "ubuntu-22-04", "windows-2022"
  "countryCode": "US", // Target deployment country
  "hostname": "my-server-1", // Optional: Custom hostname
  "management_type": "unmanaged" // Optional: "managed" or "unmanaged"
}
```

### E. Virtual Private Networks (VPN)
**`product_type: "vpn"`**

Requires duration and location string.

**Example `metadata` payload:**
```json
"metadata": {
  "period": "1", // Duration (e.g., 1 month)
  "protocol": "udp", // "udp" or "tcp"
  "locationId": "US" // Target country/region
}
```

---

## 4. Order Management

### Create Order (API-Only Resellers)
`POST /orders`
Wallet balance is deducted instantly, and credentials are provided immediately.

**Request:**
```json
{
  "product_id": 15,
  "quantity": 1,
  "metadata": { ...see Section 3... }
}
```

**Response (202 Accepted):**
```json
{
  "id": 104,
  "order_number": "ORD-123456",
  "status": "pending",
  "message": "Order received and provisioning has started.",
  "available_balance": 45.50
}
```

### Checkout Cart (Infrastructure Resellers Only)
`POST /orders/checkout_cart`
Allows batch ordering of multiple items and returns a payment link.

**Request Body:**
```json
{
  "gateway": "rexpay",
  "customer_email": "client@example.com",
  "items": [
    {
      "product_id": 15,
      "quantity": 1,
      "metadata": { ...see Section 3... }
    }
  ]
}
```

### Get Order Credentials
`GET /orders/:id/credentials`
Retrieves the connection details for a provisioned order dynamically based on product type.

**Response Example (Proxy):**
```json
{
  "type": "proxy",
  "order_id": 104,
  "proxies": [
    {
      "ip_address": "192.168.1.10",
      "port": 8080,
      "username": "user_a1b2",
      "password": "password123",
      "status": "active"
    }
  ]
}
```

**Response Example (VM):**
```json
{
  "type": "vm",
  "order_id": 105,
  "vm_id": 42,
  "ip_address": "10.0.0.5",
  "ssh_port": 22,
  "ssh_username": "root",
  "ssh_password": "securepassword",
  "status": "active"
}
```

### Cancel Order
`POST /orders/:id/cancel`
Cancels an order and refunds the wallet. Must be done within **1 hour** of purchase.

### Renew Order
`POST /orders/:id/renew`
Renews an existing subscription (Currently supports VMs).

### Update Subscription
`POST /orders/:id/update_subscription`
Toggle auto-renewal for a service.
**Request Body:** `{"auto_renew": true, "renewal_method": "wallet"}`

---

## 5. Billing & Deposits

### Get Wallet Balance
`GET /billing/balance`

### Initiate Deposit
`POST /resellers/:id/deposit`

**Request Body:**
```json
{
  "amount": 50.00,
  "gateway": "rexpay", 
  "currency": "USD"
}
```
*Supported Gateways: `rexpay`, `plisio`, `payvra`, `hundredpay`, `fastspring`.*

---

## 6. Sub-User Management (Infrastructure Resellers Only)

Infrastructure resellers can create isolated end-users to segregate billing and orders.

### Create User
`POST /users`
```json
{
  "user": {
    "email": "client@example.com",
    "username": "client123",
    "first_name": "John",
    "last_name": "Doe",
    "country": "US"
  }
}
```

### Get User Orders
`GET /users/:id/orders`
View orders placed specifically by this sub-user.

---

## 7. Virtual Machines (VMs)

### VM Power Actions
- `POST /vms/:id/start`
- `POST /vms/:id/stop`
- `POST /vms/:id/restart`

### Get VM Status
`GET /vms/:id/status`

---

## 8. Payouts

Withdraw accumulated earnings to a bank or crypto wallet.

### Request Payout
`POST /billing/request_payout`

**Request Body (Crypto):**
```json
{
  "amount": 100.00,
  "payment_method": "crypto",
  "payment_details": {
    "crypto_currency": "USDT",
    "crypto_address": "0xYourAddress..."
  }
}
```

---

## 9. Webhooks

ProxySock can send HTTP POST requests to your server for real-time order updates.

### Register Webhook Endpoint
`POST /webhook_endpoints`
```json
{
  "webhook_endpoint": {
    "url": "https://your-domain.com/webhook",
    "description": "Production Webhook",
    "events": ["order.completed", "order.failed"]
  }
}
```

**Security:**
All webhooks are signed using HMAC-SHA256. Validate the signature using the `X-ProxySock-Signature` header and your endpoint's `secret`.

---

## 10. Support & Notifications

### Tickets
- `GET /tickets`: List all support tickets.
- `POST /tickets`: Create a new ticket.
- `POST /tickets/:id/reply`: Add a reply to a ticket.

### Notifications
- `GET /notifications`: List all notifications.
- `PUT /notifications/:id/read`: Mark notification as read.
