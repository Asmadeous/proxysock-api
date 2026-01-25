# Proxysock Reseller & E-Commerce Platform - Complete Architecture Guide

**Production-grade multi-tenant platform supporting both Reseller API and E-Commerce Admin Dashboard**

---

## DOCUMENTATION INDEX

This guide is split into separate documents:

1. **ARCHITECTURE.md** - System design principles and patterns
2. **DATABASE_SCHEMA.md** - Complete database tables and relationships
3. **PROJECT_STRUCTURE.md** - Directory organization and naming conventions
4. **MODELS.md** - All model relationships and responsibilities
5. **CONTROLLERS.md** - API endpoints and controller structure
6. **SERVICES.md** - Business logic layer organization
7. **JOBS.md** - Background job workers and scheduling
8. **CACHING.md** - Cache strategy and implementation
9. **SECURITY.md** - Authentication, authorization, and safety measures
10. **API_DOCS.md** - Complete API endpoint documentation
11. **RESELLER_INTEGRATION.md** - Reseller-specific features and workflows
12. **ECOMMERCE_GUIDE.md** - E-commerce admin dashboard features
13. **PAYMENT_INTEGRATION.md** - Payment gateway workflows
14. **WEBHOOK_SYSTEM.md** - Event system and reseller webhooks
15. **TESTING_STRATEGY.md** - Testing approach and structure
16. **DEPLOYMENT.md** - Production deployment checklist
17. **TROUBLESHOOTING.md** - Common issues and solutions
18. **GLOSSARY.md** - Terms and definitions

---

## QUICK START OVERVIEW

### What This Platform Does

A **dual-purpose Rails application** with:

#### **Reseller API** (Module A)
- Third-party companies integrate via secret API key
- Purchase VMs, Proxies, VPN, eSIM in bulk
- Manage orders with 12-hour cancellation window
- Immutable wallet system for balance management
- Webhook notifications for resource provisioning
- Multi-product ordering with independent tracking

#### **E-Commerce Admin Dashboard** (Module B)
- Internal staff use company SSO to login
- Employee role-based access (SuperAdmin, Admin, Support, Finance, Designer)
- Customer user tracking (IP, device, location, frequency)
- Persistent shopping cart with abandonment tracking
- Real-time conversion funnel analytics
- Order management and refunds
- Business intelligence dashboards
- Complete audit trail of all actions

#### **Shared Infrastructure**
- Single PostgreSQL database
- Single Redis cache layer
- Unified Sidekiq job queue
- Integrated payment processing
- Shared customer user base (resellers can manage users)
- Extensible webhook system

---

## 🏗️ SYSTEM ARCHITECTURE

### Two-Module Design

```
┌─────────────────────────────────────────────────────┐
│          Rails Application (API-only)               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────┐   ┌──────────────────┐   │
│  │   RESELLER MODULE    │   │  ECOMMERCE MODULE │   │
│  │                      │   │                  │   │
│  │ - API Routes (/api)  │   │ - Admin Routes   │   │
│  │ - Reseller Auth      │   │ - Employee Auth  │   │
│  │ - Order Management   │   │ - User Tracking  │   │
│  │ - Product Catalog    │   │ - Cart & Orders  │   │
│  │ - Billing System     │   │ - Analytics      │   │
│  │ - Webhook System     │   │ - Reports        │   │
│  │ - Reseller Webhooks  │   │ - Admin Actions  │   │
│  │                      │   │                  │   │
│  └──────────────────────┘   └──────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  SHARED INFRASTRUCTURE LAYER                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Models: Transaction, Order, Product, User, etc.   │
│  Services: Payment, Auth, External APIs            │
│  Jobs: Sidekiq Workers, Scheduling (Cron)          │
│  Cache: Redis (with smart invalidation)            │
│  Auth: JWT tokens + API keys                       │
│                                                     │
├─────────────────────────────────────────────────────┤
│          DATA & EXTERNAL SERVICES                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PostgreSQL ← Shared Database                      │
│  Redis ← Cache & Sidekiq Queue                     │
│  Paystack, Plisio, Payvra ← Payments              │
│  Proxmox ← VM Provisioning                         │
│  XProxy API ← Mobile Proxies                       │
│  DHCP/DNS ← IP Allocation                          │
│  eSIM API ← Global eSIM provisioning               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Module Independence

**Reseller Module**
- Can exist independently
- Doesn't depend on E-commerce features
- Can be deployed separately if needed
- Uses API key authentication

**E-Commerce Module**
- Standalone admin dashboard
- Uses SSO (Google/Azure/Okta) for employees
- Uses session-based authentication for customers
- Can exist without Reseller API

**Shared Responsibility**
- Database models (customers can be served by both)
- Payment infrastructure
- Job processing
- Cache layer

---

## AUTHENTICATION APPROACH

### Reseller Authentication (API Key → JWT)

```
1. Reseller registers with email & company name
2. Secret API key generated (sk_xxxxx format)
3. Reseller makes request with key header
4. API verifies key (hashed in DB)
5. Generates short-lived JWT token (1 hour)
6. Reseller uses JWT for subsequent requests
7. On expiry, refresh with original API key
8. Can revoke token immediately
```

### Employee Authentication (SSO)

```
1. Employee clicks "Login with Google/Azure/Okta"
2. Redirected to company OAuth provider
3. User grants permissions
4. OAuth code exchanged for token
5. Employee created/updated in database
6. Session established
7. Access level determined by role
```

### Customer Authentication

```
1. Customer creates account via email + password
2. Email verification sent
3. Can login with email/password
4. Session established for tracking
5. SSO option available (Google)
6. Used for cart/order tracking
```

---

## DATA FLOW EXAMPLES

### Reseller Order Creation Flow

```
1. Reseller API Request
   POST /api/v1/orders
   Headers: Authorization: Bearer jwt_token
   Body: { items: [{product_id, quantity}] }

2. OrdersController::create
   - Validates JWT token
   - Checks rate limiting
   - Calls Orders::CreateService

3. Orders::CreateService
   - Validates inputs
   - Checks reseller balance
   - Reserves inventory
   - Creates Order + SubOrders
   - Creates Transaction (pending)
   - Locks balance pessimistically
   - Returns order details

4. Background Processing (Jobs)
   - VM Provisioning → Proxmox API
   - Proxy Assignment → XProxy API
   - eSIM Activation → eSIM Provider
   - Each creates WebhookEvent

5. Webhook Dispatch
   - WebhookDispatchWorker picks up events
   - Computes HMAC signature
   - POSTs to reseller's webhook_url
   - Retries with exponential backoff
   - Logs delivery attempts

6. Completion
   - Reseller receives webhook
   - Returns success
   - Order marked active
   - Resources accessible
```

### Customer Cart Abandonment Flow

```
1. Customer adds items to cart
   - CartAddedActivity logged
   - UserEvent created
   - Conversion funnel updated
   - Retention cache invalidated

2. Customer abandons checkout
   - 24 hours pass
   - CleanupWorker runs hourly
   - Carts marked "abandoned" if no activity
   - CartEvent logged with abandonment reason

3. Recovery Campaign
   - RecoveryEmailWorker checks abandoned carts
   - Sends personalized recovery email
   - Creates recovery link with token
   - Tracks link clicks
   - Updates CartEvent

4. Analytics
   - Abandonment rate calculated
   - Conversion funnel shows drop-off
   - ROI of recovery emails tracked
   - Dashboard displays metrics
```

---

## DATABASE ORGANIZATION

### Core Tables (Shared)

**Resellers** - Third-party companies (Reseller API users)
**Employees** - Internal staff (E-commerce admin)
**Users** - End customers (E-commerce customers)
**Products** - VMs, Proxies, VPN, eSIM catalog
**Orders** - Main order container
**Transactions** - Immutable financial ledger

### Reseller-Specific Tables

**ApiTokens** - JWT tokens
**VmOrders** + **Vms** - VM orders and instances
**MobileProxyOrders** + **MobileProxies** - Mobile proxy orders
**StaticResidentialProxyOrders** - Static residential proxies
**StaticDatacenterProxyOrders** - Datacenter proxies
**VpnOrders** + **Vpns** - VPN orders and instances
**EsimOrders** + **Esims** - eSIM orders and plans
**WebhookEvents** - Pending reseller webhook deliveries

### E-Commerce Specific Tables

**UserSessions** - Track every user login
**UserActivities** - Track page views, clicks, scrolls
**UserEvents** - Business events (add to cart, view product)
**Carts** - Persistent shopping carts
**CartItems** - Individual cart line items
**CartEvents** - Cart lifecycle tracking
**PageAnalytics** - Page performance metrics
**ProductAnalytics** - Product performance
**Conversions** - Conversion funnel tracking
**DailyAnalyticsSummary** - Daily rollup for dashboards
**AdminActionsLog** - Audit trail of admin actions
**UserImpersonationLog** - When admins impersonate users

### Payment Tables

**PaymentMethods** - Stored payment methods
**PaymentIntents** - Payment processing attempts
**Refunds** - Refund records

---

## MIGRATION STRATEGY (Supabase → Rails)

### Phase 1: Parallel Operation (Week 1-4)
- Rails app runs alongside Supabase
- All writes go to both systems
- Read requests from Rails (fallback to Supabase if missing)
- Reseller API works fully on Rails
- E-commerce still uses Supabase

### Phase 2: Mirror Reads (Week 5-8)
- Reseller API fully functional on Rails
- E-commerce controllers call Rails models
- Authentication checks both systems
- Customer data migrated incrementally

### Phase 3: Full Transition (Week 9+)
- All reads from Rails
- Supabase becomes backup only
- Verify data consistency
- Decommission Supabase tables gradually

---

## KEY DESIGN PATTERNS

### 1. Immutable Balance System
- Reseller balance is **NEVER** directly updated
- Balance computed from Transaction ledger sum
- Database triggers prevent updates/deletes
- Every change is new Transaction record
- Supports historical balance queries

### 2. Pessimistic Locking
- Critical operations use `with_lock`
- Prevents race conditions on balance
- Prevents inventory overselling
- Ensures order state consistency
- Retry logic with exponential backoff

### 3. Serializable Transactions
- All financial operations use serializable isolation
- Prevents dirty reads and phantom reads
- Guarantees consistency even under high concurrency
- Application retries on serialization failure

### 4. Product-Based Order Structure
- Each product type has separate order table
- Orders → VmOrders → Vms (one-to-many)
- Can query VMs independently
- Can calculate ROI per product
- Easier to add new product types

### 5. Event-Driven Webhooks
- Resources provisioned → WebhookEvent created
- Separate worker handles dispatch
- Reseller configures their own webhook URL
- Signature verification for security
- Retry with exponential backoff

### 6. Smart Caching
- Redis for all caches
- Short TTLs (30s for balance, 5min for orders)
- Cache invalidation on every write
- Query results cached (1 hour for products)
- Compression for large payloads

### 7. Background Jobs
- Long operations move to Sidekiq
- API returns immediately
- Jobs have visibility (BackgroundJob model tracks them)
- Webhooks sent asynchronously
- Scheduled cleanup via sidekiq-cron

---

## 📈 SCALABILITY CONSIDERATIONS

### Horizontal Scaling
- **Stateless API servers** - Can add/remove freely
- **Persistent queue** - Sidekiq jobs survive restarts
- **Cache layer** - Redis handles multiple servers
- **Database** - Read replicas for analytics queries

### Vertical Scaling
- **Job queue sizing** - Adjust Sidekiq concurrency
- **Cache tuning** - TTLs based on data freshness needs
- **Database indexes** - Optimized for common queries
- **Connection pooling** - Prevent exhaustion

### Rate Limiting Strategy
- Per-reseller rate limits (configurable by plan)
- Per-IP rate limits for API abuse prevention
- Time-window based (requests per minute/hour)
- Graceful degradation with 429 responses

---

## ✅ ARCHITECTURE CHECKLISTS

### Before Starting Development
- [ ] Review all 18 documentation files
- [ ] Understand immutable balance system
- [ ] Understand pessimistic locking approach
- [ ] Review two-module architecture
- [ ] Plan database migration from Supabase
- [ ] Set up development environment
- [ ] Create Git branching strategy

### During Development
- [ ] Follow naming conventions
- [ ] Write specs before implementation
- [ ] Test race conditions explicitly
- [ ] Validate cache invalidation
- [ ] Mock external APIs
- [ ] Test job retry logic
- [ ] Monitor deadlock scenarios

### Before Production
- [ ] Load test both modules
- [ ] Verify payment flows
- [ ] Test webhook delivery at scale
- [ ] Verify cache hit rates
- [ ] Check database query performance
- [ ] Security audit of auth
- [ ] Backup strategy in place

---

## 🚀 NEXT STEPS

1. **Read ARCHITECTURE.md** - Understand design principles
2. **Read DATABASE_SCHEMA.md** - Learn data model
3. **Read PROJECT_STRUCTURE.md** - Understand file organization
4. **Set up Rails app** with all gems
5. **Create migrations** based on schema
6. **Implement models** with associations
7. **Build service layer** for business logic
8. **Create controllers** and routes
9. **Implement jobs** for background work
10. **Add tests** alongside code

---

## 📞 DOCUMENT CROSS-REFERENCES

- For payment flows → see PAYMENT_INTEGRATION.md
- For webhook setup → see WEBHOOK_SYSTEM.md
- For reseller features → see RESELLER_INTEGRATION.md
- For e-commerce → see ECOMMERCE_GUIDE.md
- For API usage → see API_DOCS.md
- For troubleshooting → see TROUBLESHOOTING.md

---

**Last Updated**: January 2025  
**Status**: Architecture Complete - Ready for Implementation  
**Total Documentation Files**: 18