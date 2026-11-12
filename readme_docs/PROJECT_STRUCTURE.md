# Project Structure & Directory Overview

ProxySock is a mono-repository containing a Ruby on Rails 8 API backend and a Vite-powered React frontend.

## 📁 Repository Root

- `app/`: Rails application logic (Models, Controllers, Services, Jobs).
- `client/`: React frontend application.
- `config/`: Rails configuration (routes, initializers, database).
- `db/`: Database migrations, seeds, and schema.
- `readme_docs/`: Centralized documentation home.
- `spec/` & `test/`: Automated test suites (RSpec and Minitest).
- `lib/`: Shared libraries and rake tasks (e.g., Supabase migration).
- `vendor/`: Third-party assets.

---

## 🚀 Backend (Ruby on Rails) - `/app`

The backend follows a standard Rails structure with several domain-specific additions:

- **`controllers/`**: 
  - `api/v1/`: Reseller-facing API endpoints (Orders, VMs, Webhooks, Billing).
  - `web/api/`: Frontend-facing API endpoints for the E-commerce app (Cart, Auth, Affiliate).
  - `admin/api/`: SuperAdmin/Employee internal endpoints (System Monitoring, Audit Logs, CMS).
  - `webhooks/`: Gateway-specific handlers (RexPay, Plisio, eSIM Access).
  - `vm_callbacks/`: Handles status updates from Ansible provisioning playbooks.
- **`services/`**: The Core Logic.
  - `OrderProvisioningService.rb`: Orchestrates activation across all product types.
  - `VmProvisioningService.rb`: Manages Proxmox VM cloning and configuration.
  - `EsimProvisioningService.rb`: Interfaces with eSIM Access API.
  - `XProxyService.rb` & `MyProxyApiClient.rb`: Mobile and Residential proxy management.
  - `AffiliateService.rb`: Handles referral tracking and earnings.
  - `CloudflareDnsService.rb`: Manages DNS records for provisioned VMs.
  - `InvoicePdfService.rb`: Generates Prawn-based transaction receipts.
- **`models/`**: 
  - **Core**: `Reseller`, `User`, `Order`, `Product`, `Transaction`, `Wallet`.
  - **Provisioning**: `Vm`, `Esim`, `Vpn`, `ProxyInstance`.
  - **Support**: `Ticket`, `GuestChat`, `SupportChat`, `Notification`.
  - **Analytics**: `DailyAnalyticsSummary`, `Conversion`, `PageAnalytic`.
- **`jobs/`**: Background workers.
  - `VmProvisioningJob`, `OrderProvisioningJob`, `EsimSyncJob`, `InventoryRestockWorker`.
- **`mailers/`**: Templates for invoices, credentials, and security alerts.

---

## 🎨 Frontend (React + Vite) - `/client`

The frontend is built with React 18 and Vite 7, following a modular component-based architecture.

- **`src/`**:
  - **`pages/`**: View-level units grouped by role:
    - `Reseller/`: Financial hub, API management, and service control.
    - `UserDashboard/`: standard E-commerce customer views (VPS management, VPN downloads).
    - `Affiliate/`: Referral tracking and payout requests.
    - `SuperAdmin/` & `Employee/`: Deep system internal panels and monitoring.
    - `public/`: Marketing, Blog, and Pricing pages.
  - **`components/`**: Atomic UI elements, checkout flows, and specialized SEO tools.
  - **`services/`**: Axios-based API client wrappers.
  - `hooks/`: Specialized hooks for `useRedditAnalytics`, `useCart`, and `useSupportChat`.
  - `context/`: Global state for Auth, Theme, Cart, and LiveChat support.
  - `utils/`: Helperse for pixel tracking (Pixel, CAPI) and data formatting.

---

## 🎧 Support & Communications Ecosystem

ProxySock features a multi-channel support environment integrated directly into the E-commerce and Reseller modules:

- **Real-time Support Chats**: ActionCable-powered live messaging for both authenticated Users and anonymous Guests (`ChatChannel`).
- **Ticket Management System**: Full lifecycle support tickets with priority levels, internal notes, and staff assignment.
- **Order Rescue Utility**: A specialized admin tool that allows support staff to re-trigger provisioning (`OrderProvisioningService`) directly from a support ticket or order page to fix activation failures.
- **Automated Staff Routing**: Notifications are dynamically routed to employees with `admin` or `support` roles via the `NotificationService`.

---

## ⚙️ Shared Infrastructure

- **Database**: PostgreSQL 16 with UUID primary keys and an immutable transaction ledger.
- **Background Jobs**: 
  - **Sidekiq**: Primary engine for long-running provisioning and emails.
  - **Solid Queue**: Integrated for specialized Rails 8 job management.
- **Real-time**: **Solid Cable** for live chat (Support/Guest) and order status toast notifications.
- **Cache**: **Solid Cache** for lightning-fast API response caching.
- **Deployment**: **Kamal** for Zero-downtime Docker deployments.
