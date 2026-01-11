# Roadmap: EasyTax-AU

## Scope Definition

**Purpose:** Personal Australian tax management for a single freelancer.  
**Not:** A commercial product, multi-tenant SaaS, or public service.

---

## Phase 1: MVP (Foundation)

**Goal:** Manual CRUD for expenses/incomes + basic BAS summary.

**Status:** ✅ Backend Complete | 🟡 Frontend In Progress (47%)

### Backend

| Task              | Description                                    | Priority | Status |
| ----------------- | ---------------------------------------------- | -------- | ------ |
| NestJS scaffold   | Initialize project with TypeORM + PostgreSQL   | 🔴 High  | ✅     |
| Categories module | CRUD + seed default categories                 | 🔴 High  | ✅     |
| Providers module  | CRUD + seed common providers                   | 🔴 High  | ✅     |
| Clients module    | CRUD for freelance clients                     | 🔴 High  | ✅     |
| Expenses module   | Full CRUD with provider auto-fill              | 🔴 High  | ✅     |
| Incomes module    | Full CRUD for invoices                         | 🔴 High  | ✅     |
| BAS module        | Read-only quarterly summary (G1, 1A, 1B)       | 🔴 High  | ✅     |
| Encryption        | AES-256-GCM transformer for sensitive columns  | 🔴 High  | ✅     |
| decimal.js        | All currency math uses Decimal, store as cents | 🔴 High  | ✅     |

### Frontend (React SPA)

| Task                | Description                                               | Priority  | Status |
| ------------------- | --------------------------------------------------------- | --------- | ------ |
| Project scaffold    | Vite + React 19 + TypeScript + Tailwind CSS 4             | 🔴 High   | ✅     |
| Infrastructure      | API client, TanStack Query, routing, toasts               | 🔴 High   | ✅     |
| Layout & navigation | Responsive shell with sidebar, header, mobile             | 🔴 High   | ✅     |
| Dashboard           | BAS summary, recent expenses, quick actions               | 🔴 High   | ✅     |
| Expenses module     | Full CRUD with filters, sorting, modal forms              | 🔴 High   | ✅     |
| Incomes module      | Full CRUD with paid toggle, filters, sorting              | 🔴 High   | ✅     |
| CSV Import          | Bulk import expenses with preview (incomes backend-ready) | 🟡 Medium | ✅     |
| Settings pages      | Manage providers, categories (clients pending)            | 🟡 Medium | 🟡     |

### Infrastructure

| Task           | Description                    | Priority  | Status |
| -------------- | ------------------------------ | --------- | ------ |
| Docker Compose | PostgreSQL 15 + API container  | 🔴 High   | ✅     |
| .env.example   | Template with required secrets | 🔴 High   | ✅     |
| Healthcheck    | `pg_isready` in docker-compose | 🟡 Medium | ✅     |

### Validation

| Task           | Description                         | Priority | Status |
| -------------- | ----------------------------------- | -------- | ------ |
| DTO validation | class-validator on all inputs       | 🔴 High  | ✅     |
| GST auto-calc  | If international provider → GST = 0 | 🔴 High  | ✅     |
| biz_percent    | Validate 0-100 range                | 🔴 High  | ✅     |

### Deliverable

- ✅ API running on `localhost:3000`
- ✅ Can manually add expenses/incomes via REST and Web UI
- ✅ Can query BAS summary for any quarter
- ✅ Frontend SPA with full CRUD for expenses and incomes
- ✅ Dashboard showing current BAS period and recent activity
- ✅ CSV import for expenses with preview, validation, and duplicate detection

---

## Phase 2: Quality of Life (Complete ✅)

**Goal:** Make daily use more convenient.

### Features

| Task                | Description                                  | Priority  | Status |
| ------------------- | -------------------------------------------- | --------- | ------ |
| CSV Import Expenses | Bulk import expenses from bank export        | 🟡 Medium | ✅     |
| CSV Import Incomes  | Bulk import incomes from spreadsheet         | 🟡 Medium | ✅     |
| ImportJob entity    | Track imports, allow rollback                | 🟡 Medium | ✅     |
| Duplicate detection | Warn if same date + amount + provider exists | 🟡 Medium | ✅     |
| FY helper           | Auto-detect FY and quarter from date         | 🟡 Medium | ✅     |
| Swagger docs        | Auto-generated API documentation             | 🟡 Medium | ✅     |

**Completed Features:**

- CSV Import module with support for custom, CommBank, and Amex formats
- Income CSV Import with client fuzzy matching
- ImportJob entity with rollback capability and statistics tracking
- Duplicate detection (same date, amount, provider/client)
- FY Helper utilities (getFY, getQuarter, date ranges)
- FY/Quarter computed fields in expense responses
- Provider fuzzy matching (Levenshtein + aliases)
- Client fuzzy matching (in-memory for encrypted names)
- Business use percentage applied to imports
- GST auto-calculation for domestic providers
- 500 tests across 18 test suites

### UI Options (Pick One)

| Option           | Effort | Notes                                |
| ---------------- | ------ | ------------------------------------ |
| AdminJS          | Low    | Auto-generated CRUD UI from entities |
| Simple React SPA | Medium | Custom but more work                 |
| CLI tool         | Low    | For terminal lovers                  |

---

## Phase 3: Automation

**Goal:** Reduce manual work.

### Features

| Task                  | Description                                 | Priority | Status      |
| --------------------- | ------------------------------------------- | -------- | ----------- |
| Recurring expenses    | Auto-generate monthly entries (e.g., iinet) | 🟢 Low   | ✅          |
| Bank statement parser | Map CSV columns to expense fields           | 🟢 Low   | ✅ (in CSV) |
| Provider auto-match   | Fuzzy match "GITHUB.COM" → GitHub provider  | 🟢 Low   | ✅ (in CSV) |
| Email import          | Forward receipts, extract with OCR          | 🟢 Low   | Not started |

---

## Phase 4: Reporting

**Goal:** Better visibility into finances.

### Features

| Task       | Description                                           | Priority | Status      |
| ---------- | ----------------------------------------------------- | -------- | ----------- |
| Dashboard  | Summary charts (expenses by category, monthly trends) | 🟢 Low   | Not started |
| PDF export | Generate BAS-ready report                             | 🟢 Low   | ✅          |
| FY summary | Annual totals for tax return                          | 🟢 Low   | ✅          |

**Completed Features:**

- FY Summary endpoint with income/expense breakdown
- PDF Export using PDFKit (~500KB, no Chrome)
- BAS quarterly PDF reports
- FY annual PDF reports
- Health endpoint for monitoring (`GET /health`)
- 608 tests across 24 test suites

---

## Future Enhancements (Low Priority)

These are documented for future consideration, not planned for MVP.

| Feature      | Description                             | When to Consider                |
| ------------ | --------------------------------------- | ------------------------------- |
| Dashboard UI | Charts for expenses by category, trends | When visual reporting is needed |
| Email import | Forward receipts, OCR extraction        | If manual entry becomes tedious |

---

## Out of Scope (Won't Build)

| Feature                 | Reason                          |
| ----------------------- | ------------------------------- |
| Multi-user / Auth       | Single user, local-only         |
| Bank API integration    | Privacy concern, manual is fine |
| ATO direct submission   | Use their portal                |
| Mobile app              | Desktop/web is sufficient       |
| Asset depreciation      | Can add later if needed         |
| Superannuation tracking | Separate concern                |

---

## Definition of Done (MVP) ✅

All MVP requirements have been completed as of January 1, 2026.

- [x] Can create/read/update/delete Categories
- [x] Can create/read/update/delete Providers (with seed data)
- [x] Can create/read/update/delete Clients
- [x] Can create/read/update/delete Expenses
- [x] Can create/read/update/delete Incomes
- [x] Selecting international provider auto-sets GST = 0
- [x] biz_percent correctly reduces claimable GST
- [x] BAS endpoint returns G1, 1A, 1B for given quarter
- [x] Sensitive fields encrypted at rest
- [x] All currency calculations use decimal.js
- [x] Docker Compose starts cleanly
- [x] README has install instructions

---

## 🎉 Backend Status: Feature Complete

**Completed:** January 1, 2026

### Backend Summary

| Metric        | Value              |
| ------------- | ------------------ |
| Test Suites   | 24                 |
| Total Tests   | 608                |
| API Endpoints | 40+                |
| Modules       | 12 feature modules |

### Backend Features

- ✅ Full CRUD for Categories, Providers, Clients, Expenses, Incomes
- ✅ BAS quarterly reporting (G1, 1A, 1B calculations)
- ✅ FY annual summary for tax returns
- ✅ CSV import (expenses + incomes) with fuzzy matching
- ✅ Recurring expense automation
- ✅ PDF export for BAS and FY reports
- ✅ AES-256-GCM encryption for sensitive fields
- ✅ Health endpoint for monitoring
- ✅ Swagger/OpenAPI documentation
- ✅ Docker Compose deployment

---

## Phase 5: Web UI (94% Complete)

**Goal:** Build a modern, accessible React frontend for daily use.

**Status:** ✅ **Production Ready** - All core features implemented, Docker deployed, and fully documented.

**See:**
- [TASKS-FRONTEND.md](./TASKS-FRONTEND.md) for detailed task breakdown and implementation reference
- [FUTURE-ENHANCEMENTS.md](./FUTURE-ENHANCEMENTS.md) for optional features and improvements

### Tech Stack

| Layer     | Choice                   | Rationale                |
| --------- | ------------------------ | ------------------------ |
| Build     | Vite                     | Fast HMR, native ESM     |
| Framework | React 19 + TypeScript    | Mature, type-safe        |
| Styling   | Tailwind CSS + shadcn/ui | Zero-runtime, accessible |
| Data      | TanStack Query           | Caching, loading states  |
| Forms     | React Hook Form + Zod    | Performance, validation  |
| Routing   | React Router v6          | Standard, lazy loading   |

### Phase F1 – Frontend Scaffold (web SPA)

Goal: Establish a modern React SPA with tooling, styling, and core infrastructure before building features.

**Status:**

- ✅ F1.1 Initialize Project
  - Vite + React 19 + TS 5.9 app in `web/`
  - `pnpm-workspace.yaml` configured (`.`, `web`)
  - TS strict + `@` alias
  - ESLint 9 flat config + Prettier
  - Tailwind 4 configured via `web/src/index.css`
  - shadcn-style `Button` and initial EasyTax hero screen
- ✅ F1.2 Core Infrastructure
  - Fetch-based API client with `ApiError` and `/health` check
  - TanStack Query `QueryClient` and `AppShell` wiring
  - Routing shell via `BrowserRouter`
  - App-level error boundary
  - Custom toast system (context + viewport)
  - Vitest + React Testing Library setup and infra tests
- ✅ F1.3 Shared Types Auto-Generated
  - `openapi-typescript` generating `shared/types/api.d.ts` from `/api/docs-json`
  - Frontend imports backend contracts via `@shared/types` / `@api-types`
- ✅ F1.4 Layout & Navigation
  - Sidebar + mobile drawer layout with central `NAV_ITEMS` config
  - Header showing current FY/Quarter and a ⌘K / Ctrl+K command palette toggle

### Key Screens

1. **Dashboard** - GST position, quick actions, recent activity
2. **Expenses** - List, add/edit form, filters, CSV import
3. **Incomes** - List, add/edit form, paid/unpaid toggle
4. **Import** - CSV upload, preview, selective import
5. **BAS Report** - Quarter view, PDF download
6. **FY Report** - Annual summary, PDF download
7. **Settings** - Providers, Categories, Clients management

### Completed Frontend Phases

- ✅ **F1 – Project Scaffold (100%):** Vite + React 19 + TypeScript, TanStack Query, React Router, Tailwind CSS 4, Testing infrastructure
- ✅ **F2 – Core Features (91%):** Dashboard, Expenses CRUD, Incomes CRUD, CSV Import, Settings, Searchable Dropdowns
- ✅ **F3 – Reports & Polish (92%):** BAS Reports, FY Reports, Recurring Expenses, Accessibility (keyboard nav, dark mode, E2E tests)
- ✅ **F4 – Production Ready (100%):** Docker deployment, comprehensive documentation with screenshots guide and keyboard shortcuts

### Implemented Features

- **Dashboard**: Live BAS summary, recent expenses, upcoming recurring expenses, quick actions
- **Expense Management**: Full CRUD with smart GST calculation, business use slider, filtering, sorting, CSV import
- **Income Tracking**: Full CRUD with paid toggle, client management, GST auto-calculation
- **BAS Reporting**: Quarterly summaries with PDF export
- **FY Reports**: Annual breakdown by category and BAS label with PDF export
- **Recurring Expenses**: Automated monthly/quarterly/yearly expense generation
- **Settings**: Manage providers, categories, and clients (encrypted)
- **Dark Mode**: Theme toggle with system preference support
- **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
- **Testing**: 272+ unit tests, 40+ E2E tests with Playwright

### Optional Future Enhancements

See [FUTURE-ENHANCEMENTS.md](./FUTURE-ENHANCEMENTS.md) for:
- Deferred features (inline editing, screen reader testing)
- UX polish (toast enhancements, keyboard shortcuts, micro-interactions)
- Advanced features (multi-currency, bulk operations, receipt uploads)
- Technical improvements (CI/CD for E2E tests, React Router v7 migration)

---

## Phase 6: System Management Features (v1.1.0) - 100% Complete

**Goal:** Add version management, backup export, and update notifications.

**Status:** ✅ **Shipped** - 2026-01-10

| Task | Effort | Status | Implementation |
|------|--------|--------|----------------|
| **Version Display** | 3-4 hours | ✅ Done | `/api/version` endpoint + footer component + Settings page display |
| **Database Export** | 7-8 hours | ✅ Done | `/api/backup/export` endpoint with rate limiting (3 per 5 min) + Settings UI with countdown timer |
| **Update Notification** | 4-6 hours | ✅ Done | GitHub Releases API integration + auto-check (24h) + manual check button on About page |
| **CI/CD for E2E Tests** | 3-4 hours | ✅ Done | GitHub Actions workflow (`.github/workflows/e2e-tests.yml`) with PostgreSQL, 62 E2E tests (1 skipped, 98.4% pass rate), artifacts upload |

### Implementation Details

**Version Display:**
- Backend: `GET /api/version` returns `{ version: "1.1.0", buildDate: "..." }`
- Frontend: Version shown in footer on all pages + Settings page with build info
- Source of truth: `package.json` version field

**Database Export:**
- Backend: Rate-limited export endpoint (3 downloads per 5 minutes per session)
- Frontend: Download button in Settings with countdown timer between downloads
- File format: `easytax-backup-YYYY-MM-DD.sql` (PostgreSQL dump)
- Security: Export includes encryption keys (user responsible for secure storage)

**Update Notification:**
- Backend: Fetch GitHub Releases API to check for newer versions
- Frontend: Auto-check on app startup (cached for 24 hours)
- Manual check button on About page
- Toast notification if newer version available with link to releases page

**CI/CD for E2E Tests:**
- GitHub Actions workflow runs on push/PR to main branch
- Automated setup: PostgreSQL service, backend startup, dependency installation
- 62 Playwright tests covering: theme switching (11), expenses (9), incomes (10), reports (14), PDF downloads (10), CSV import (5/9, 4 skipped due to backend requirement)
- Artifacts: Test reports and failure screenshots uploaded on failure
- Test parallelization: 1 worker on CI, 8 locally
- Health checks ensure backend ready before tests run

### Testing Coverage

- Unit Tests: 482 Vitest tests passing
- E2E Tests: 62 Playwright tests (98.4% pass rate, 1 skipped)
- Test Categories:
  - Theme switching: 11/11 ✓
  - Expense CRUD: 9/9 ✓
  - Income CRUD: 10/10 ✓
  - Reports: 14/14 ✓
  - PDF Downloads: 10/10 ✓
  - CSV Import: 5/9 (4 require backend API, deferred)

### Files Modified

**Backend:**
- `src/version/version.controller.ts` (new)
- `src/backup/backup.controller.ts` (new)
- Rate limiting middleware for backup endpoint

**Frontend:**
- `web/src/components/layout/footer.tsx` (version display)
- `web/src/features/settings/about/about-page.tsx` (version + update check)
- `web/src/features/settings/settings-page.tsx` (backup download)
- `web/src/hooks/use-update-check.ts` (new)

**CI/CD:**
- `.github/workflows/e2e-tests.yml` (new)
- `web/e2e/README.md` (documentation)

---

## Out of Scope (Won't Build)

| Feature                 | Reason                          |
| ----------------------- | ------------------------------- |
| Multi-user / Auth       | Single user, local-only         |
| Bank API integration    | Privacy concern, manual is fine |
| ATO direct submission   | Use their portal                |
| Mobile app              | Desktop/web is sufficient       |
| Asset depreciation      | Can add later if needed         |
| Superannuation tracking | Separate concern                |
| Email/OCR import        | Manual CSV works fine           |

---
