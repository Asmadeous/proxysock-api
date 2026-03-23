# Project Structure & Directory Overview

ProxySock is a mono-repository containing a Ruby on Rails API backend and a Vite-powered React frontend.

## 📁 Repository Root

- `app/`: Rails application logic (Models, Controllers, Services, Jobs).
- `client/`: React frontend application.
- `config/`: Rails configuration (routes, initializers, database).
- `db/`: Database migrations, seeds, and schema.
- `readme_docs/`: Centralized documentation home.
- `spec/` & `test/`: Automated test suites (RSpec and Minitest).
- `lib/`: Shared libraries and rake tasks.
- `tmp/`: Temporary files, cache, and pids.

---

## 🚀 Backend (Ruby on Rails) - `/app`

The backend follows a standard Rails structure with several domain-specific additions:

- **`controllers/`**: 
  - `api/v1/`: Reseller-facing API endpoints.
  - `web/api/`: Frontend-facing API endpoints for the E-commerce app.
  - `admin/api/`: SuperAdmin/Employee internal endpoints.
- **`services/`**: The "Brain" of the application. 
  - `HundredpayService.rb`: Payment gateway integration.
  - `RedditConversionService.rb`: Analytics integration.
  - `OrderProvisioningService.rb`: Logic for activating VMs, Proxies, and eSIMs.
- **`models/`**:
  - Contains core entities: `Reseller`, `User`, `Order`, `Product`, `Transaction`.
  - Polymorphic associations are used for `orderable` (Reseller/User) and `depositable`.
- **`jobs/`**: Sidekiq workers for background processing (Provisioning, Webhooks, Emails).
- **`mailers/`**: Email templates for invoices, credentials, and notifications.

---

## 🎨 Frontend (React + Vite) - `/client`

The frontend is built with TypeScript and follows a modular component-based architecture.

- **`src/`**:
  - **`pages/`**: View-level components grouped by user role:
    - `Reseller/`: Financial hub, dashboards, and checkout.
    - `Employee/` & `SuperAdmin/`: Administrative panels.
    - `UserDashboard/`: Standard customer views.
    - `public/`: Marketing pages, blog, and FAQ.
  - **`components/`**: Reusable UI elements, checkout handlers, and SEO tools.
  - **`services/`**: API client wrappers using Axios.
  - **`hooks/`**: Custom React hooks for analytics (e.g., `useRedditAnalytics`) and state.
  - **`context/`**: Global state providers (Auth, Theme, Cart).
  - **`utils/`**: Helper scripts for pixel tracking, formatting, and CAPI.
  - **`routes.js`**: Central routing configuration.

---

## ⚙️ Shared Infrastructure

- **Database**: PostgreSQL with an immutable transaction ledger for financial accuracy.
- **Cache**: Redis for session storage, Sidekiq queues, and API rate limiting.
- **Jobs**: Sidekiq handles all asynchronous tasks (Email delivery, Cloud provisioning).
