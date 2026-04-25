# Developer Guide

Welcome to the ProxySock engineering team! This guide covers setup, testing, and development workflows.

## 1. Environment Requirements
- **Ruby**: 4.0.2+ (Managed via `rbenv`/`mise`)
- **Node.js**: 20+ (using `npm`)
- **Postgres**: 16+
- **Redis**: 7+ (for Sidekiq and Rate Limiting)

## 2. Getting Started

### Backend Setup
```bash
# 1. Install dependencies
bundle install

# 2. Setup Database (Development and Test)
bin/rails db:setup

# 3. Start Development Environment
bin/dev
```
`bin/dev` uses Foreman to start:
- Rails Server (Port 3000)
- Vite Frontend (Port 3001)
- Sidekiq (Background Jobs)

### Frontend Setup
```bash
cd client
npm install
npm run dev
```
The frontend will be available at [http://localhost:3001](http://localhost:3001).

---

## 3. Environment Variables
ProxySock relies on several external services. Ensure your `.env` file contains the following critical keys:

### Infrastructure & Providers
- `PROXMOX_URL` / `PROXMOX_TOKEN` - For VM cloning.
- `ESIM_ACCESS_API_KEY` - For eSIM provisioning.
- `MY_PROXY_API_KEY` - For residential proxy orders.
- `CLOUDFLARE_API_TOKEN` - For DNS management.

### Payment Gateways
- `PAYSTACK_SECRET_KEY`
- `HUNDREDPAY_SECRET_KEY`
- `PLISIO_API_KEY`

---

## 4. Data Migration Utilities

### Supabase User Migration
If you are migrating users from an existing Supabase instance:
```bash
bundle exec rails migrate:supabase_users
```
This task handles user records, wallets, and credentials mapping to the Rails schema.

---

## 5. Testing & Quality

### Running Tests
```bash
# Full Backend Suite
bin/rails test && bundle exec rspec

# Static Analysis
bundle exec rubocop
bundle exec brakeman
```

---

## 6. Documentation System
Our documentation is modular and located in `readme_docs/`.
- [Project Structure](PROJECT_STRUCTURE.md)
- [Reseller Integration](RESELLER_GUIDE.md)
- [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md)
- [Product Provisioning](PRODUCT_PROVISIONING.md)
