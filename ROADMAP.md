# Roadmap: EasyTax-AU

## Scope Definition

**Purpose:** Personal Australian tax management for a single freelancer.  
**Not:** A commercial product, multi-tenant SaaS, or public service.

---

## Phase 1: MVP (Foundation)

**Goal:** Manual CRUD for expenses/incomes + basic BAS summary.

### Backend

| Task              | Description                                    | Priority |
| ----------------- | ---------------------------------------------- | -------- |
| NestJS scaffold   | Initialize project with TypeORM + PostgreSQL   | 🔴 High  |
| Categories module | CRUD + seed default categories                 | 🔴 High  |
| Providers module  | CRUD + seed common providers                   | 🔴 High  |
| Clients module    | CRUD for freelance clients                     | 🔴 High  |
| Expenses module   | Full CRUD with provider auto-fill              | 🔴 High  |
| Incomes module    | Full CRUD for invoices                         | 🔴 High  |
| BAS module        | Read-only quarterly summary (G1, 1A, 1B)       | 🔴 High  |
| Encryption        | AES-256-GCM transformer for sensitive columns  | 🔴 High  |
| decimal.js        | All currency math uses Decimal, store as cents | 🔴 High  |

### Infrastructure

| Task           | Description                    | Priority  |
| -------------- | ------------------------------ | --------- |
| Docker Compose | PostgreSQL 15 + API container  | 🔴 High   |
| .env.example   | Template with required secrets | 🔴 High   |
| Healthcheck    | `pg_isready` in docker-compose | 🟡 Medium |

### Validation

| Task           | Description                         | Priority |
| -------------- | ----------------------------------- | -------- |
| DTO validation | class-validator on all inputs       | 🔴 High  |
| GST auto-calc  | If international provider → GST = 0 | 🔴 High  |
| biz_percent    | Validate 0-100 range                | 🔴 High  |

### Deliverable

- API running on `localhost:3000`
- Can manually add expenses/incomes via REST
- Can query BAS summary for any quarter

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

## Phase 5: Web UI (Current)

**Goal:** Build a modern, accessible React frontend for daily use.

**See:** [TASKS-FRONTEND.md](./TASKS-FRONTEND.md) for detailed task breakdown.

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

### Phase F2 – Core Features (web)

- [x] F2.1 – Dashboard (current BAS summary & shortcuts)
  - Shows GST summary cards for the current BAS quarter (G1, 1A, 1B, Net GST).
  - Includes a recent expenses list (latest 10), upcoming recurring expenses, and quick actions to add expenses/incomes.
  - Backed by a typed `useDashboardData` hook using shared OpenAPI types and TanStack Query.

- [ ] F2.2 – Expenses list & CRUD
- [ ] F2.3 – Incomes list & CRUD
- [ ] F2.4 – CSV import UI
- [ ] F2.5 – Reports (BAS/FY) UI

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

## Timeline Estimate

| Phase               | Effort       | Calendar Time |
| ------------------- | ------------ | ------------- |
| Phase 1-4 (Backend) | ~65 hours    | ✅ Complete   |
| Phase 5 (Frontend)  | ~40-50 hours | 2-3 weeks     |

**Goal:** Complete frontend before end of January 2026 for Q2 FY2026 BAS (Oct-Dec 2025).
