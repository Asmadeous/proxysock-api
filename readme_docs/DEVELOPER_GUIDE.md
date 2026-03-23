# Developer Guide

Welcome to the ProxySock engineering team! This guide covers setup, testing, and development workflows.

## 1. Environment Requirements
- **Ruby**: 4.0.0 (Managed via `rbenv`/`mise`)
- **Node.js**: 20+ (for Frontend)
- **Postgres**: 16+
- **Redis**: 7+ (ActiveJob/Sidekiq/Caching)

## 2. Getting Started

### Backend Setup
```bash
# 1. Install dependencies
bundle install

# 2. Setup Database
bin/rails db:setup

# 3. Start Development Environment
bin/dev
```
`bin/dev` uses Foreman to start:
- Rails Server (Port 3000)
- Sidekiq (Background Jobs)

### Frontend Setup
```bash
cd client
npm install
npm run dev
```
The frontend will be available at [http://localhost:5173](http://localhost:5173).

---

## 3. Environment Variables
ProxySock relies on several external services. Ensure your `.env` file contains the following critical keys:

### Payment Gateways
- `PAYSTACK_SECRET_KEY`
- `HUNDREDPAY_SECRET_KEY`
- `PLISIO_API_KEY`

### Infrastructure Providers
- `MY_PROXY_RESELLER_USER_ID`
- `MY_PROXY_API_KEY`
- `PROXMOX_URL` / `PROXMOX_TOKEN`

### Analytics
- `REDDIT_AD_ACCOUNT_ID`
- `REDDIT_CONVERSION_TOKEN`

---

## 4. Testing & Quality
We maintain high standards for code quality and security.

### Running Tests
```bash
# Full Backend Suite
bin/rails test && bundle exec rspec

# Static Analysis
bundle exec rubocop
bundle exec brakeman
```

### CI/CD Pipeline
Every Pull Request to `develop` triggers:
1.  **RuboCop/Brakeman** (Style & Security)
2.  **Minitest/RSpec** (Logic & API Docs)
3.  **Frontend Build** (Vite verification)

---

## 5. Documentation System
Our documentation is modular and located in `readme_docs/`.
- [Project Structure](PROJECT_STRUCTURE.md)
- [Reseller Integration](RESELLER_GUIDE.md)
- [Payment Gateways](PAYMENT_GATEWAYS.md)
- [Analytics & SEO](ANALYTICS_SEO.md)
- [Provisioning Engine](PRODUCT_PROVISIONING.md)
