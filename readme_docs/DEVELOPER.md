# Developer Guide

Welcome to the ProxySock engineering team! This guide covers everything you need to know to build, test, and ship code.

## 1. Environment Setup

### Requirements
- **Ruby**: 4.0.0 (Managed via `rbenv`/`asdf`/`mise`)
- **Postgres**: 16+
- **Redis**: 7+
- **Docker**: (Optional, for building production images)

### Getting Started
```bash
# 1. Install dependencies
bundle install

# 2. Setup Database
bin/rails db:setup

# 3. Start Server
bin/dev
```

`bin/dev` starts:
- Rails Server (Port 3000)
- Sidekiq (Background Jobs)
- CSS Watcher (if applicable)

---

## 2. Development Workflow

### Git Flow
We follow a standard Feature Branch workflow:
1.  **Branch off `develop`**: `git checkout -b feature/my-feature develop` (or `fix/my-fix`)
2.  **Commit often**: Use conventional commits (e.g., `feat: add rate limiting`, `fix: correct typo`).
3.  **Push**: `git push origin feature/my-feature`
4.  **Auto-PR**: A Pull Request is automatically created targeting `develop` (CI runs immediately).
5.  **Merge**: After approval, merge to `develop`.

### Deployment
- **Staging**: Merges to `develop` deploy to Staging environment.
- **Production**: Releases are cut from `develop` to `main` via `auto-pr-main.yml`. Merges to `main` deploy to Production.

---

## 3. Testing Strategy

We use a hybrid testing approach as we migrate legacy code.

### Running Tests
```bash
# Run Minitest (Controller/Model logic)
bin/rails test

# Run RSpec (API Documentation Specs)
bundle exec rspec
```

### Writing Tests
- **Business Logic**: Write `ActiveSupport::TestCase` unit tests in `test/models` or `test/services`.
- **API Documentation**: Write `RSpec` request specs in `spec/requests/api/v1/`.

---

## 4. API Documentation

We use `rswag` to generate OpenAPI (Swagger) documentation from tests.

### How to Add Documentation
1.  Create/Edit a spec file in `spec/requests/api/v1/`.
2.  Define the path and expected response schema.
3.  Run generation command:

```bash
# Generate swagger.yaml
RAILS_ENV=test DB_USERNAME=your_user rake rswag:specs:swaggerize
```

The documentation is available at `/api-docs`.

---

## 5. Code Quality & Security

Our CI pipeline enforces strict quality gates.

### Linting
```bash
# Check code style
bundle exec rubocop
```

### Security
We run nightly security audits. You can run them locally:

```bash
# 1. Static Analysis (Rails vulnerabilities)
bundle exec brakeman

# 2. Dependency Audit (CVEs)
bundle audit check --update
```

**Rule of Thumb**: Fix high-severity issues immediately.

---

## 6. Project Structure

- `app/services`: Complex business logic (start here!)
- `app/jobs`: Sidekiq workers (see `config/sidekiq.yml` for queues)
- `readme_docs`: Legacy architecture PDFs
- `.github/workflows`: CI/CD automation
