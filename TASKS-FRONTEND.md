# Frontend Development Tasks: EasyTax-AU Web UI

## Project Overview

**Purpose:** Build a modern, accessible web interface for EasyTax-AU that enables:

1. Manual entry of expenses and incomes with excellent UX
2. CSV file import with preview and validation
3. BAS/FY report viewing and PDF download
4. Dashboard for quick GST position overview

**Target User:** Single freelancer (the project owner) managing Australian GST and tax.

---

## Architecture Decisions (Confirmed)

### Project Structure: Monorepo

```
easytax-au/
├── src/                    # NestJS Backend (existing)
├── web/                    # React Frontend (new)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-based modules
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities, API client
│   │   ├── types/          # Shared TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── shared/                 # Shared types (API contracts)
│   └── types/
├── package.json            # Root workspace config
└── pnpm-workspace.yaml
```

**Rationale:** Single repo allows shared TypeScript types between API and frontend, simpler CI/CD, and atomic commits across stack.

---

### Tech Stack

| Layer             | Choice                | Bundle Size | Rationale                                    |
| ----------------- | --------------------- | ----------- | -------------------------------------------- |
| **Build**         | Vite                  | N/A         | Fast HMR, native ESM, simple config          |
| **Framework**     | React 19              | ~45KB       | Mature ecosystem, your expertise             |
| **Language**      | TypeScript (strict)   | N/A         | Type safety, API contract enforcement        |
| **Styling**       | Tailwind CSS          | ~10KB       | Utility-first, no runtime, tree-shakes       |
| **Components**    | shadcn/ui             | 0KB runtime | Copied to codebase, full control, accessible |
| **Routing**       | React Router v6       | ~13KB       | Standard, well-documented                    |
| **Data Fetching** | TanStack Query v5     | ~13KB       | Caching, refetching, loading states          |
| **Forms**         | React Hook Form + Zod | ~15KB       | Performance, validation, type inference      |
| **State**         | React Context         | 0KB         | Minimal client state needed                  |
| **Icons**         | Lucide React          | Tree-shakes | Only imports used icons                      |
| **Tables**        | TanStack Table        | ~15KB       | Headless, sorting, filtering, pagination     |
| **Date Handling** | date-fns              | Tree-shakes | Only imports used functions                  |

**Total estimated bundle:** ~100KB gzipped (excellent for a full-featured app)

---

### Testing Strategy

| Type            | Tool                     | Target                     |
| --------------- | ------------------------ | -------------------------- |
| **Unit**        | Vitest                   | Hooks, utilities, services |
| **Component**   | Vitest + Testing Library | UI components              |
| **Integration** | Vitest + MSW             | API interactions           |
| **E2E**         | Playwright (Phase 3)     | Critical user flows        |

**Coverage Target:** 80% on critical paths (forms, API calls, calculations)

---

## Status Legend

- ⬜ Not started
- 🟡 In progress
- ✅ Complete
- ⏸️ Blocked

---

## Phase F1: Project Scaffold

**Goal:** Set up the frontend project with all tooling configured and working.

### F1.1 Initialize Project

| #      | Task                                            | Status |
| ------ | ----------------------------------------------- | ------ |
| F1.1.1 | Create `/web` directory with Vite + React + TS  | ✅     |
| F1.1.2 | Configure `pnpm-workspace.yaml` for monorepo    | ✅     |
| F1.1.3 | Set up TypeScript strict mode (`tsconfig.json`) | ✅     |
| F1.1.4 | Configure path aliases (`@/components`, etc.)   | ✅     |
| F1.1.5 | Add ESLint + Prettier (match backend rules)     | ✅     |
| F1.1.6 | Configure Tailwind CSS                          | ✅     |
| F1.1.7 | Set up shadcn/ui with theme configuration       | ✅     |
| F1.1.8 | Create `.env.example` with `VITE_API_URL`       | ✅     |

**Implementation notes (F1.1):**

- Frontend scaffold uses **React 19**, **Vite 7**, **TypeScript 5.9 (strict)**.
- Tailwind CSS **4.x** using CSS-driven config in `web/src/index.css`:
  - `@import "tailwindcss";`
  - `@plugin "tailwindcss-animate";`
- Shared UI patterns:
  - `cn` helper in `web/src/lib/utils.ts`.
  - `Button` in `web/src/components/ui/button.tsx` (shadcn-style).

**Files created:**

- `web/package.json`
- `web/vite.config.ts`
- `web/tsconfig.json`
- `web/tailwind.config.js`
- `web/postcss.config.js`
- `web/.env.example`
- `web/src/index.css` (Tailwind v4 entrypoint)
- `pnpm-workspace.yaml` (root)

**Tests Required (completed):**

- [x] `pnpm --filter web dev` starts without errors
- [x] TypeScript compiles with no errors (`pnpm --filter web build`)
- [x] ESLint passes with no errors (`pnpm --filter web lint`)
- [x] Tailwind classes apply correctly in the rendered UI

**Definition of Done (F1.1 – met):**

- [x] Can run `pnpm --filter web dev` and see the React app
- [x] Hot reload works
- [x] shadcn-style `Button` component renders correctly on the landing screen
- [x] No TypeScript errors

---

### F1.2 Core Infrastructure

**Goal:** Provide a stable app shell with API client, data fetching, routing, error handling, and notifications.

| #      | Task                                                  | Status |
| ------ | ----------------------------------------------------- | ------ |
| F1.2.1 | Create API client (fetch wrapper, centralized errors) | ✅     |
| F1.2.2 | Set up TanStack Query provider + devtools             | ✅     |
| F1.2.3 | Create React Router shell (BrowserRouter + AppShell)  | ✅     |
| F1.2.4 | Create error boundary component (app-level)           | ✅     |
| F1.2.5 | Create toast notification system (custom, Tailwind)   | ✅     |
| F1.2.6 | Vitest + RTL setup and infra tests                    | ✅     |

**Files created / updated:**

- API + currency utilities:
  - `web/src/lib/api-client.ts` (fetch-based API client + `ApiError` + `checkApiHealth()`)
  - `web/src/lib/currency.ts` (cents-based helpers: `formatCents`, `parseCurrency`)
- Data fetching:
  - `web/src/lib/query-client.ts` (`QueryClient` with sane defaults)
- App shell & routing:
  - `web/src/AppShell.tsx` (`QueryClientProvider`, `BrowserRouter`, `ToastProvider`, `ToastViewport`, `ReactQueryDevtools` in dev)
  - `web/src/main.tsx` (wraps `<App />` in `<AppShell>`)
- Error handling:
  - `web/src/components/error-boundary.tsx` (app-level error boundary with friendly fallback UI)
- Toasts:
  - `web/src/lib/toast-context.ts` (`ToastContext` + `useToast`)
  - `web/src/components/ui/toast-provider.tsx` (toast state)
  - `web/src/components/ui/toast-viewport.tsx` (visual placement, accessible markup)
- Testing:
  - `web/vitest.config.ts` (jsdom + `@` alias)
  - `web/src/test/setup.ts` (`@testing-library/jest-dom`)
  - `web/src/components/error-boundary.test.tsx`
  - `web/src/lib/api-client.test.ts`
  - `web/src/components/ui/toast-provider.test.tsx`

**Tests / Definition of done (F1.2):**

- `pnpm --filter web lint` passes (no ESLint or Prettier errors).
- `pnpm --filter web test` passes:
  - API client throws `ApiError` for non-2xx, `checkApiHealth()` returns `true` for `/health` OK and `false` on failures.
  - Error boundary renders fallback UI when a child throws.
  - Toast system adds and removes toasts correctly.
- `pnpm --filter web build` passes (no TypeScript or Vite errors).
- Dev shell:
  - App runs under `AppShell` with React Query provider, BrowserRouter, Toasts, and Query devtools (dev only).

> Note: We intentionally use a **native fetch-based client** instead of Axios, and a **custom toast system** instead of `sonner`,
> to minimize dependencies while keeping behavior explicit and testable.

---

## 2. `ARCHITECTURE.md` – frontend section tweaks

Under the **Frontend Architecture** or equivalent section, add a short bullet list describing the actual infra. For example:

````md path=null start=null
### Frontend infrastructure (current)

- **API client:** `web/src/lib/api-client.ts`
  - Thin wrapper around `fetch` using `VITE_API_URL` as base.
  - Central `ApiError` type and `checkApiHealth()` helper hitting `/health`.
- **Data fetching:** TanStack Query v5
  - Shared `QueryClient` in `web/src/lib/query-client.ts`.
  - Wired via `AppShell` (`QueryClientProvider` + `ReactQueryDevtools` in dev).
- **Routing shell:** React Router
  - `BrowserRouter` wrapped in `AppShell` (routes will be expanded in later phases).
- **Toasts:** custom toast context + provider
  - `web/src/lib/toast-context.ts`, `web/src/components/ui/toast-provider.tsx`, `toast-viewport.tsx`.
  - Accessible UI with Tailwind, no third-party toast dependency.
- **Error handling:**
  - App-level error boundary in `web/src/components/error-boundary.tsx` with a minimal friendly fallback screen.
- **Testing:** Vitest + React Testing Library
  - `web/vitest.config.ts` + `web/src/test/setup.ts`.
  - Coverage today: infra tests for API client, error boundary, and toast provider.

| #      | Task                                                                    | Status |
| ------ | ----------------------------------------------------------------------- | ------ |
| F1.2.1 | Create API client using fetch wrapper + centralized errors (`ApiError`) | ✅     |
| F1.2.2 | Set up TanStack Query provider + devtools                               | ⬜     |
| F1.2.3 | Create React Router with lazy loading                                   | ⬜     |
| F1.2.4 | Create error boundary component (app-level)                             | ⬜     |
| F1.2.5 | Create toast notification system (custom, Tailwind-based)               | ✅     |

> **Note (F1.2.4):** Start with a single app-level error boundary. Add route-level error boundaries only if crashes in one feature affect unrelated features during testing.
> | F1.2.6 | Create currency transformer (dollars ↔ cents) | ⬜ |
> | F1.2.7 | Set up Vitest + Testing Library | ⬜ |

**Files to Create:**

- `web/src/lib/currency.ts` (toCents, toDollars, formatCurrency)
- `web/src/lib/api-client.ts`
- `web/src/lib/query-client.ts`
- `web/src/lib/router.tsx`
- `web/src/components/error-boundary.tsx`
- `web/src/components/ui/` (shadcn components)
- `web/vitest.config.ts`
- `web/src/test/setup.ts`

**Tests Required:**

- [ ] API client handles 401/403/500 errors gracefully
- [ ] Error boundary catches and displays errors
- [ ] Toast notifications appear and dismiss
- [ ] Vitest runs and passes sample test

**Definition of Done:**

- [ ] API client can call `/health` endpoint
- [ ] React Query caches responses
- [ ] Routes lazy load correctly
- [ ] Error boundary shows fallback UI on error

---

### F1.3 Shared Types (Auto-Generated)

| #      | Task                                                      | Status |
| ------ | --------------------------------------------------------- | ------ |
| F1.3.1 | Install `openapi-typescript` as dev dependency            | ✅     |
| F1.3.2 | Add `pnpm run generate:types` script to root package.json | ✅     |
| F1.3.3 | Generate types from `http://localhost:3000/api/docs-json` | ✅     |
| F1.3.4 | Configure path alias `@api-types` in web tsconfig         | ✅     |

**Files to Create:**

- `shared/types/api.d.ts` (auto-generated from OpenAPI spec)
- Root `package.json` script: `"generate:types": "openapi-typescript http://localhost:3000/api/docs-json -o shared/types/api.d.ts"`

**Benefits:**

- Zero type drift - types always match API
- Single source of truth (Swagger/OpenAPI)
- Auto-regenerate on API changes
- No manual maintenance

**Definition of Done:**

- [x] `pnpm run generate:types` produces valid TypeScript
- [x] Frontend can import types from `@api-types`
- [x] Types match API responses exactly (guaranteed by generation)

---

### F1.4 Layout & Navigation

|| #      | Task                                            | Status |
|| ------ | ----------------------------------------------- | ------ |
|| F1.4.1 | Create app shell with sidebar layout            | ✅     |
|| F1.4.2 | Create responsive navigation (mobile drawer)    | ✅     |
|| F1.4.3 | Create header with current FY/Quarter display   | ✅     |
|| F1.4.4 | Add keyboard shortcuts (⌘K for command palette) | ✅     |

**Files created / updated:**

- `web/src/components/layout/layout.tsx` (visual shell with sidebar, header, mobile nav, command palette)
- `web/src/components/layout/sidebar.tsx` (desktop navigation)
- `web/src/components/layout/header.tsx` (header with current FY/Quarter and ⌘K button)
- `web/src/components/layout/mobile-nav.tsx` (mobile drawer navigation)
- `web/src/components/layout/command-palette.tsx` (stub command palette overlay)
- `web/src/config/navigation.ts` (central `NAV_ITEMS` definition)
- `web/src/lib/fy.ts` + `web/src/hooks/use-fy-info.ts` (Australian FY/quarter helpers)
- `web/src/hooks/use-keyboard-shortcuts.ts` (handles ⌘K / Ctrl+K)
- `web/src/features/*/*-page.tsx` placeholders for routed screens
- `web/src/App.tsx` updated to use nested routes with `<Layout />` + `<Outlet />`

**Tests Required (completed):**

- [x] FY utilities map dates to correct FY/Quarter (`web/src/lib/fy.test.ts`)
- [x] Keyboard shortcut hook calls handler on Meta+K / Ctrl+K (`web/src/hooks/use-keyboard-shortcuts.test.tsx`)

**Definition of Done (F1.4 – met):**

- [x] Layout renders on all routes via nested React Router routes
- [x] Navigation links use a centralized config and highlight the active section
- [x] Responsive on mobile (< 768px) with a drawer navigation
- [x] Accessible (keyboard navigable, semantic nav and buttons)
- [x] Command palette can be toggled with ⌘K / Ctrl+K

---

## Phase F2: Core Features

**Goal:** Implement the main CRUD screens for daily use.

### F2.1 Dashboard

|| #      | Task                                               | Status |
|| ------ | -------------------------------------------------- | ------ |
|| F2.1.1 | Create dashboard page with GST summary cards       | 🟡     |
|| F2.1.2 | Show current quarter BAS position (G1, 1A, 1B)     | 🟡     |
|| F2.1.3 | Add quick action buttons (Add Expense, Add Income) | ✅     |
|| F2.1.4 | Display recent expenses (last 10)                  | 🟡     |
|| F2.1.5 | Display upcoming recurring expenses                | 🟡     |

**Files created / updated (F2.1):**

- `web/src/features/dashboard/dashboard-page.tsx` (dashboard layout + wiring)
- `web/src/features/dashboard/components/gst-summary-card.tsx` (GST summary cards)
- `web/src/features/dashboard/components/recent-expenses.tsx` (recent expenses list)
- `web/src/features/dashboard/components/quick-actions.tsx` (Add expense / Add income links)
- `web/src/features/dashboard/hooks/use-dashboard-data.ts` (TanStack Query hooks for BAS, expenses, recurring)

**API Endpoints Used:**

- `GET /bas/:quarter/:year`
- `GET /expenses?limit=10&sort=date:desc`
- `GET /recurring-expenses/due`

**Tests Required:**

- [ ] Dashboard loads without errors
- [ ] GST summary displays correct values
- [ ] Quick actions navigate correctly
- [ ] Loading states shown while fetching

**Definition of Done:**

- [ ] Dashboard shows accurate GST position
- [ ] All data refreshes on mount
- [ ] Responsive layout
- [ ] Accessible summary cards

---

### F2.2 Expenses Module

| #       | Task                                           | Status |
| ------- | ---------------------------------------------- | ------ |
| F2.2.1  | Create expenses list page with data table      | ⬜     |
| F2.2.2  | Add sorting (date, amount, provider)           | ⬜     |
| F2.2.3  | Add filtering (category, provider, date range) | ⬜     |
| F2.2.4  | Add pagination                                 | ⬜     |
| F2.2.5  | Create expense form (add/edit) with validation | ⬜     |
| F2.2.6  | Implement provider dropdown with search        | ⬜     |
| F2.2.7  | Implement category dropdown                    | ⬜     |
| F2.2.8  | Add GST auto-calculation display               | ⬜     |
| F2.2.9  | Add biz_percent slider (0-100)                 | ⬜     |
| F2.2.10 | Implement delete with confirmation             | ⬜     |
| F2.2.11 | Add inline editing for quick updates           | ⬜     |

**Files to Create:**

- `web/src/features/expenses/expenses-page.tsx`
- `web/src/features/expenses/components/expenses-table.tsx`
- `web/src/features/expenses/components/expense-form.tsx`
- `web/src/features/expenses/components/expense-filters.tsx`
- `web/src/features/expenses/components/provider-select.tsx`
- `web/src/features/expenses/components/category-select.tsx`
- `web/src/features/expenses/hooks/use-expenses.ts`
- `web/src/features/expenses/hooks/use-expense-mutations.ts`
- `web/src/features/expenses/schemas/expense.schema.ts`

**API Endpoints Used:**

- `GET /expenses`
- `POST /expenses`
- `PATCH /expenses/:id`
- `DELETE /expenses/:id`
- `GET /providers`
- `GET /categories`

**Tests Required:**

- [ ] Table displays expenses correctly
- [ ] Sorting works on all columns
- [ ] Filtering by category works
- [ ] Form validation prevents invalid submissions
- [ ] GST auto-calculates for domestic providers
- [ ] GST shows $0 for international providers
- [ ] biz_percent affects displayed claimable GST
- [ ] Delete confirmation prevents accidental deletion
- [ ] Optimistic update on mutations

**Definition of Done:**

- [ ] Full CRUD operations work
- [ ] Form is keyboard navigable
- [ ] Loading/error states handled
- [ ] Accessible (screen reader tested)

---

### F2.3 Incomes Module

| #       | Task                                            | Status |
| ------- | ----------------------------------------------- | ------ |
| F2.3.1  | Create incomes list page with data table        | ⬜     |
| F2.3.2  | Add sorting (date, amount, client)              | ⬜     |
| F2.3.3  | Add filtering (client, paid/unpaid, date range) | ⬜     |
| F2.3.4  | Add pagination                                  | ⬜     |
| F2.3.5  | Create income form (add/edit) with validation   | ⬜     |
| F2.3.6  | Implement client dropdown with search + add new | ⬜     |
| F2.3.7  | Add GST (10%) auto-calculation                  | ⬜     |
| F2.3.8  | Add Total auto-calculation (subtotal + GST)     | ⬜     |
| F2.3.9  | Add paid/unpaid toggle                          | ⬜     |
| F2.3.10 | Implement delete with confirmation              | ⬜     |

**Files to Create:**

- `web/src/features/incomes/incomes-page.tsx`
- `web/src/features/incomes/components/incomes-table.tsx`
- `web/src/features/incomes/components/income-form.tsx`
- `web/src/features/incomes/components/income-filters.tsx`
- `web/src/features/incomes/components/client-select.tsx`
- `web/src/features/incomes/hooks/use-incomes.ts`
- `web/src/features/incomes/hooks/use-income-mutations.ts`
- `web/src/features/incomes/schemas/income.schema.ts`

**API Endpoints Used:**

- `GET /incomes`
- `POST /incomes`
- `PATCH /incomes/:id`
- `PATCH /incomes/:id/paid`
- `DELETE /incomes/:id`
- `GET /clients`
- `POST /clients` (inline create)

**Tests Required:**

- [ ] Table displays incomes correctly
- [ ] Paid/unpaid filter works
- [ ] Form calculates total correctly
- [ ] Can create new client inline
- [ ] Mark paid updates status immediately

**Definition of Done:**

- [ ] Full CRUD operations work
- [ ] Total = Subtotal + GST always
- [ ] Can quickly toggle paid status
- [ ] Loading/error states handled

---

### F2.4 CSV Import

| #       | Task                                          | Status |
| ------- | --------------------------------------------- | ------ |
| F2.4.1  | Create import page with file dropzone         | ⬜     |
| F2.4.2  | Add file type detection (expenses vs incomes) | ⬜     |
| F2.4.3  | Create preview table showing parsed rows      | ⬜     |
| F2.4.4  | Show validation errors per row                | ⬜     |
| F2.4.5  | Show duplicate warnings                       | ⬜     |
| F2.4.6  | Allow row-level include/exclude toggle        | ⬜     |
| F2.4.7  | Show provider/client match confidence         | ⬜     |
| F2.4.8  | Add "Import Selected" confirmation            | ⬜     |
| F2.4.9  | Show import progress and results              | ⬜     |
| F2.4.10 | Link to ImportJob for rollback option         | ⬜     |

**Files to Create:**

- `web/src/features/import/import-page.tsx`
- `web/src/features/import/components/file-dropzone.tsx`
- `web/src/features/import/components/preview-table.tsx`
- `web/src/features/import/components/row-validation.tsx`
- `web/src/features/import/components/import-progress.tsx`
- `web/src/features/import/hooks/use-csv-preview.ts`
- `web/src/features/import/hooks/use-import.ts`

**API Endpoints Used:**

- `POST /import/expenses/preview`
- `POST /import/expenses`
- `POST /import/incomes/preview`
- `POST /import/incomes`
- `GET /import-jobs/:id`

**Tests Required:**

- [ ] File dropzone accepts CSV files only
- [ ] Preview shows parsed data correctly
- [ ] Validation errors display per row
- [ ] Duplicate rows are highlighted
- [ ] Import only includes selected rows
- [ ] Progress indicator works

**Definition of Done:**

- [ ] Can preview CSV before import
- [ ] Can selectively import rows
- [ ] Errors clearly displayed
- [ ] Success shows import statistics

---

### F2.5 Providers & Categories Management

| #      | Task                                           | Status |
| ------ | ---------------------------------------------- | ------ |
| F2.5.1 | Create providers list page                     | ⬜     |
| F2.5.2 | Create provider form (add/edit)                | ⬜     |
| F2.5.3 | Add "is_international" toggle with explanation | ⬜     |
| F2.5.4 | Create categories list page                    | ⬜     |
| F2.5.5 | Create category form (add/edit)                | ⬜     |
| F2.5.6 | Show BAS label mapping                         | ⬜     |

**Files to Create:**

- `web/src/features/settings/providers-page.tsx`
- `web/src/features/settings/categories-page.tsx`
- `web/src/features/settings/components/provider-form.tsx`
- `web/src/features/settings/components/category-form.tsx`

**Definition of Done:**

- [ ] Can manage providers and categories
- [ ] International flag clearly explained
- [ ] BAS labels displayed

---

### F2.6 Clients Management

| #      | Task                          | Status |
| ------ | ----------------------------- | ------ |
| F2.6.1 | Create clients list page      | ⬜     |
| F2.6.2 | Create client form (add/edit) | ⬜     |
| F2.6.3 | Show related incomes count    | ⬜     |

**Files to Create:**

- `web/src/features/settings/clients-page.tsx`
- `web/src/features/settings/components/client-form.tsx`

**Definition of Done:**

- [ ] Can manage clients
- [ ] Shows income association

---

## Phase F3: Reports & Polish

**Goal:** Complete reporting features and polish UX.

### F3.1 BAS Reports

| #      | Task                                         | Status |
| ------ | -------------------------------------------- | ------ |
| F3.1.1 | Create BAS report page with quarter selector | ⬜     |
| F3.1.2 | Display G1, 1A, 1B with explanations         | ⬜     |
| F3.1.3 | Show net GST position (payable/refund)       | ⬜     |
| F3.1.4 | Add PDF download button                      | ⬜     |
| F3.1.5 | Show expense/income breakdown tables         | ⬜     |

**Files to Create:**

- `web/src/features/reports/bas-report-page.tsx`
- `web/src/features/reports/components/quarter-selector.tsx`
- `web/src/features/reports/components/bas-summary.tsx`
- `web/src/features/reports/components/bas-breakdown.tsx`
- `web/src/features/reports/hooks/use-bas-report.ts`

**API Endpoints Used:**

- `GET /bas/:quarter/:year`
- `GET /reports/bas/:quarter/:year/pdf`

**Definition of Done:**

- [ ] Can view any quarter's BAS
- [ ] PDF downloads correctly
- [ ] Numbers match API exactly

---

### F3.2 FY Reports

| #      | Task                                          | Status |
| ------ | --------------------------------------------- | ------ |
| F3.2.1 | Create FY report page with year selector      | ⬜     |
| F3.2.2 | Display income summary (total, GST collected) | ⬜     |
| F3.2.3 | Display expense breakdown by category         | ⬜     |
| F3.2.4 | Display expense breakdown by BAS label        | ⬜     |
| F3.2.5 | Show net profit calculation                   | ⬜     |
| F3.2.6 | Add PDF download button                       | ⬜     |

**Files to Create:**

- `web/src/features/reports/fy-report-page.tsx`
- `web/src/features/reports/components/year-selector.tsx`
- `web/src/features/reports/components/fy-summary.tsx`
- `web/src/features/reports/components/category-breakdown.tsx`
- `web/src/features/reports/hooks/use-fy-report.ts`

**API Endpoints Used:**

- `GET /reports/fy/:year`
- `GET /reports/fy/:year/pdf`

**Definition of Done:**

- [ ] Can view any FY's summary
- [ ] PDF downloads correctly
- [ ] Useful for tax return preparation

---

### F3.3 Recurring Expenses

| #      | Task                                     | Status |
| ------ | ---------------------------------------- | ------ |
| F3.3.1 | Create recurring expenses list page      | ⬜     |
| F3.3.2 | Create recurring expense form (add/edit) | ⬜     |
| F3.3.3 | Show next due date prominently           | ⬜     |
| F3.3.4 | Add "Generate Now" button                | ⬜     |
| F3.3.5 | Show generated expenses history          | ⬜     |

**Files to Create:**

- `web/src/features/recurring/recurring-page.tsx`
- `web/src/features/recurring/components/recurring-form.tsx`
- `web/src/features/recurring/components/recurring-table.tsx`
- `web/src/features/recurring/hooks/use-recurring.ts`

**API Endpoints Used:**

- `GET /recurring-expenses`
- `POST /recurring-expenses`
- `PATCH /recurring-expenses/:id`
- `DELETE /recurring-expenses/:id`
- `POST /recurring-expenses/generate`
- `GET /recurring-expenses/due`

**Definition of Done:**

- [ ] Can manage recurring templates
- [ ] Generate creates expenses correctly
- [ ] Due dates clearly visible

---

### F3.4 Polish & Accessibility

| #      | Task                                                | Status |
| ------ | --------------------------------------------------- | ------ |
| F3.4.1 | Audit all forms for keyboard accessibility          | ⬜     |
| F3.4.2 | Add focus visible styles                            | ⬜     |
| F3.4.3 | Test with screen reader (VoiceOver/NVDA)            | ⬜     |
| F3.4.4 | Add skip links for navigation                       | ⬜     |
| F3.4.5 | Ensure color contrast meets WCAG AA                 | ⬜     |
| F3.4.6 | Add loading skeletons for all data fetches          | ⬜     |
| F3.4.7 | Add empty states for all lists                      | ⬜     |
| F3.4.8 | Add success/error toasts for all mutations          | ⬜     |
| F3.4.9 | Implement dark mode toggle (stored in localStorage) | ⬜     |

**Files to Create (dark mode):**

- `web/src/hooks/use-theme.ts`
- Update `web/src/components/layout/header.tsx` with toggle

**Definition of Done:**

- [ ] All interactive elements keyboard accessible
- [ ] Screen reader announces correctly
- [ ] Loading states for all async operations
- [ ] Empty states guide user action

---

### F3.5 E2E Testing

| #      | Task                       | Status |
| ------ | -------------------------- | ------ |
| F3.5.1 | Set up Playwright          | ⬜     |
| F3.5.2 | Test: Add expense flow     | ⬜     |
| F3.5.3 | Test: Add income flow      | ⬜     |
| F3.5.4 | Test: CSV import flow      | ⬜     |
| F3.5.5 | Test: View BAS report flow | ⬜     |
| F3.5.6 | Test: Download PDF flow    | ⬜     |

**Files to Create:**

- `web/e2e/expense.spec.ts`
- `web/e2e/income.spec.ts`
- `web/e2e/import.spec.ts`
- `web/e2e/reports.spec.ts`
- `web/playwright.config.ts`

**Definition of Done:**

- [ ] Critical flows covered
- [ ] Tests run in CI
- [ ] No flaky tests

---

## Phase F4: Production Ready

**Goal:** Prepare for daily use.

### F4.1 Build & Deployment

| #      | Task                                         | Status |
| ------ | -------------------------------------------- | ------ |
| F4.1.1 | Configure production build                   | ⬜     |
| F4.1.2 | Add to Docker Compose (nginx serving static) | ⬜     |
| F4.1.3 | Configure API proxy in nginx                 | ⬜     |
| F4.1.4 | Configure nginx gzip + SPA fallback          | ⬜     |
| F4.1.5 | Add frontend health check                    | ⬜     |

**Files to Create:**

- `web/Dockerfile`
- `web/nginx.conf` (with gzip, `try_files $uri /index.html`)
- Update `docker-compose.yml`

**nginx.conf essentials:**

```nginx
gzip on;
gzip_types text/css application/javascript application/json;
location / {
    try_files $uri $uri/ /index.html;  # SPA fallback
}
```
````

**Definition of Done:**

- [ ] `docker compose up` serves frontend on port 80
- [ ] API proxied through `/api`
- [ ] Production build optimized

---

### F4.2 Documentation

| #      | Task                               | Status |
| ------ | ---------------------------------- | ------ |
| F4.2.1 | Update README with frontend setup  | ⬜     |
| F4.2.2 | Document all environment variables | ⬜     |
| F4.2.3 | Add screenshots to README          | ⬜     |
| F4.2.4 | Document keyboard shortcuts        | ⬜     |

**Definition of Done:**

- [ ] README has clear setup instructions
- [ ] All features documented
- [ ] Screenshots show key screens

---

## Progress Tracker

| Phase                | Tasks  | Done  | Progress |
| -------------------- | ------ | ----- | -------- |
|| F1. Scaffold         | 22     | 22    | 100%     |
| F2. Core Features    | 44     | 0     | 0%       |
| F3. Reports & Polish | 26     | 0     | 0%       |
| F4. Production       | 9      | 0     | 0%       |
|| **Total**            | **101** | **22** | **22%** |

---

## Pre-Task Checklist (Frontend)

Before starting any task:

- [ ] Backend API endpoint exists and tested
- [ ] Types defined in `/shared/types`
- [ ] Understand the UX flow
- [ ] Know which shadcn components to use

## Post-Task Checklist (Frontend)

Before marking complete:

- [ ] No TypeScript errors
- [ ] Component tests pass
- [ ] Responsive on mobile
- [ ] Keyboard accessible
- [ ] Loading/error states handled
- [ ] No console.logs
- [ ] Commit follows Conventional Commits

---

## AI Agent Instructions

When working on frontend tasks:

1. **Always check backend first** - Ensure the API endpoint exists and works via Swagger before building UI.

2. **Use shared types** - Import from `@shared/types`, never duplicate type definitions.

3. **Follow component patterns** - Look at existing components for patterns before creating new ones.

4. **Test incrementally** - Run `pnpm --filter web test` after each significant change.

5. **Commit atomically** - One logical change per commit, following Conventional Commits.

6. **Ask before:**
   - Adding new dependencies
   - Changing shared types
   - Modifying API contracts
   - Major architectural decisions

7. **Performance considerations:**
   - Use React.memo for list items
   - Lazy load routes
   - Virtualize long lists (TanStack Virtual if needed)
   - Debounce search inputs

8. **Accessibility requirements:**
   - All interactive elements must be keyboard accessible
   - Use semantic HTML
   - Add ARIA labels where needed
   - Test with keyboard navigation
