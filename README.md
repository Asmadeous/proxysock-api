# Proxysock API & E-Commerce Platform

**A powerful, multi-tenant platform for Resellers and E-Commerce operations, built with Ruby on Rails and React.**

---

## 📚 Table of Guides

Documentation is organized into modular guides within the `readme_docs/` directory for clarity and depth.

### 🚀 Getting Started
- 🛠️ **[Developer Setup Guide](readme_docs/DEVELOPER_GUIDE.md)** - Requirements, installation, and environment variables.
- 📁 **[Project Structure Overview](readme_docs/PROJECT_STRUCTURE.md)** - Codebase organization for Backend and Frontend.
- 🗺️ **[Implementation Roadmap](readme_docs/IMPLEMENTATION_ROADMAP.md)** - Phase-by-phase project vision.

### 👥 Reseller Operations
- 🔑 **[Reseller Integration Guide](readme_docs/RESELLER_GUIDE.md)** - API-only vs Infrastructure models, Auth, and Webhooks.
- 💰 **[Wallet & Financials](readme_docs/WALLET_FINANCE.md)** - Immutable ledger, deposits, and payout logic.
- 📜 **[MyProxyApi Specification](readme_docs/MYPROXYAPI_SPEC.md)** - Detailed provider API documentation.

### 🛠️ Core Features & Integrations
- 💳 **[Payment Gateways Guide](readme_docs/PAYMENT_GATEWAYS.md)** - 100Pay (Cards/Crypto), Paystack, Plisio, and Payvra.
- 📦 **[Product Provisioning Engine](readme_docs/PRODUCT_PROVISIONING.md)** - Activation lifecycle for VMs, Proxies, VPNs, and eSIMs.
- 📈 **[Analytics & SEO Strategy](readme_docs/ANALYTICS_SEO.md)** - Reddit CAPI, Pixel, and dynamic SEO components.
- 💳 **[100Pay Integration Spec](readme_docs/100PAY_INTEGRATION_SPEC.md)** - Technical details for Hundredpay gateway.

---

## 🏗️ Quick Tech Stack Reference

- **Backend**: Ruby on Rails 7/4.0 branch (Postgres, Redis, Sidekiq, RSpec).
- **Frontend**: React + Vite (TypeScript, Tailwind, Context API).
- **Deployment**: Kamal / Docker.
- **Infrastructure Providers**: Proxmox, MyProxyApi, eSIM Access.

---

## ✅ System Status
- **Backend Tests**: RSpec & Minitest passing.
- **Security**: Brakeman & RuboCop enforced.
- **Build**: Vite production build verified.

---

**Last Updated**: March 12, 2026  
**Status**: Development & Integration Stage  