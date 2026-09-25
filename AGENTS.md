# AGENTS.md

Instructions for AI coding agents working in this project. Claude Code reads
`CLAUDE.md`, which imports this file, so there is a single source of truth.

Claude Code, Codex, and every other AI tool must not add AI attribution to
commits or pull requests, including AI `Co-Authored-By` trailers or generated-by
signatures. Preserve genuine human attribution.

## What this is

Proxysock API: a Rails 8.1 API and React storefront that sells and automatically
provisions proxies, VMs (Proxmox), VPNs, and eSIMs to customers and resellers,
with payments, wallets and an immutable ledger, affiliates, support, and an admin
panel. See `README.md` and `readme_docs/` for details.

## Proportional engineering

Build for established requirements, not hypothetical scale, threats, or future
flexibility. Reuse existing code, the standard library, native platform features,
and installed dependencies before adding machinery.

- Unknown scale or extensibility defaults to the smaller reversible design. Do
  not infer enterprise, multi-tenant, hostile-user, or compliance requirements.
- Derive trust and data-integrity boundaries from actual reachability: untrusted
  input, auth/session/ownership, shared persisted data, destructive operations,
  payments, secrets, and sensitive data.
- Ask only when an unknown materially changes behavior, architecture, persisted
  data, interoperability, a real security boundary, or cost. Otherwise choose the
  simplest repository-native implementation.
- Add an abstraction, dependency, service, configuration surface, compatibility
  layer, or security mechanism only for a current requirement.
- Simplicity never removes real trust-boundary validation, data-loss prevention,
  accessibility, explicit security requirements, configured tests, or project rules.
- Stack-specific template standards apply only when the project uses that stack.

## Conventions

- Rails API with three namespaces: `Api::V1` (Reseller API), `Web::Api`
  (storefront), `Admin::Api` (staff). Thin controllers, JSON built in private
  `serialize_*` helpers, business logic in `app/services/`, jobs on Sidekiq.
- `# frozen_string_literal: true` and single-quoted strings; RuboCop must pass.
- Lifecycle state via AASM events. Money movement goes through the ledger and
  wallet services inside a lock or transaction.
- Scope user-owned data to the authenticated actor; verify webhook signatures.
- Frontend in `client/`: React 18 + Vite + TypeScript, Tailwind, React Query,
  Zustand, axios clients in `client/src/services/`.

## Commands

- Setup: `bin/setup`
- Dev server: `bin/dev` (Rails on http://localhost:3000, Vite on
  http://localhost:3001, Sidekiq)
- Test: `bin/rails test` (Minitest; this is what CI runs)
- Frontend test: `cd client && npm test -- --run` (Vitest)
- Lint: `bin/rubocop`
- Security: `bin/brakeman` and `bin/bundler-audit`
- Frontend typecheck: `cd client && npx tsc --noEmit`
- Frontend build: `cd client && npm run build`
- Verify: `bin/ci` (setup, RuboCop, bundler-audit, Brakeman, `bin/rails test`,
  seed replant; does not cover the frontend)

Legacy RSpec specs live in `spec/` but are not run in CI. New backend tests use
Minitest under `test/`.
