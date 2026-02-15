# Architecture: EasyTax-AU

## Overview

This document describes the system architecture, tech stack, and module organization of EasyTax-AU.

**Related Documentation:**
- **Implementation Patterns:** See `PATTERNS.md` for frontend conventions (pagination, searchable dropdowns, forms, data fetching)
- **Troubleshooting:** See `TROUBLESHOOTING.md` for common issues and solutions
- **Australian Tax Rules:** See `ATO-LOGIC.md` for GST/BAS calculation logic
- **Database Schema:** See `SCHEMA.md` for entity relationships

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EasyTax-AU                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐     ┌──────────────────────────────────┐ │
│  │     Web Frontend     │     │        Backend API               │ │
│  │     (React SPA)      │────▶│        (NestJS)                  │ │
│  │     Port: 5173       │     │        Port: 3000                │ │
│  └──────────────────────┘     └──────────────┬───────────────────┘ │
│                                              │                     │
│                                              ▼                     │
│                               ┌──────────────────────────────────┐ │
│                               │        PostgreSQL                │ │
│                               │        Port: 5432                │ │
│                               └──────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Shared Types                               │  │
│  │               /shared/types/*.ts                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Backend Tech Stack

| Layer               | Technology      | Version        | Notes                            |
| ------------------- | --------------- | -------------- | -------------------------------- |
| **Runtime**         | Node.js         | 20 LTS         | Long-term support until Apr 2026 |
| **Node Manager**    | fnm             | Latest         | Fast Node Manager                |
| **Package Manager** | pnpm            | 9.x            | Fast, disk-efficient             |
| **Framework**       | NestJS          | 10.x           | Modular Monolith                 |
| **ORM**             | TypeORM         | 0.3.x          | With custom AES-256 transformers |
| **Database**        | PostgreSQL      | 15-alpine      | Docker image                     |
| **Math**            | decimal.js      | Latest         | All currency/GST calculations    |
| **Validation**      | class-validator | Latest         | DTO validation with decorators   |
| **Config**          | @nestjs/config  | Latest         | Environment variable management  |
| **API Docs**        | @nestjs/swagger | Latest         | Auto-generated OpenAPI docs      |
| **Encryption**      | Node.js crypto  | Built-in       | AES-256-GCM for sensitive fields |
| **Testing**         | Jest            | NestJS default | Unit + integration tests         |
| **Linting**         | ESLint          | 9.x            | Code quality enforcement         |
| **Formatting**      | Prettier        | 3.x            | Consistent code style            |
| **Container**       | Docker Compose  | Latest         | Single-host deployment           |

---

## Frontend Tech Stack

### Frontend stack

- React 19 + Vite 7 + TypeScript 5.9 (strict)
- Tailwind CSS 4.x with CSS-driven config:
  - `@import "tailwindcss";`
  - `@plugin "tailwindcss-animate";`
- shadcn-style UI primitives (starting with `Button`)
- React Router (BrowserRouter shell in `AppShell`)
- TanStack Query v5 for data fetching and caching
- OpenAPI-generated shared API types in `shared/types/api.d.ts`, imported via `@shared/types` / `@api-types`
- Vitest + React Testing Library + jest-dom for unit/integration tests

### Current frontend infrastructure (Phase F1.1–F1.2)

- **SPA location:** `web/`
- **App shell:** `web/src/AppShell.tsx`
  - Wraps the app with:
    - `QueryClientProvider` (TanStack Query)
    - `BrowserRouter` (routing shell)
    - `ToastProvider` + `ToastViewport` (toast notifications)
    - `ReactQueryDevtools` in development only
- **Entry point:** `web/src/main.tsx`
  - Renders `<AppShell><App /></AppShell>` and imports `web/src/index.css`.
- **Styling:** `web/src/index.css`
  - Tailwind v4 config via:
    - `@import "tailwindcss";`
    - `@plugin "tailwindcss-animate";`
- **API client:** `web/src/lib/api-client.ts`
  - Fetch-based wrapper using `VITE_API_URL` as base.
  - Central `ApiError` type.
  - `checkApiHealth()` helper calling `/health` and returning `true` / `false`.
- **Currency helpers:** `web/src/lib/currency.ts`
  - Cents-based helpers (`formatCents`, `parseCurrency`) aligned with backend money model.
- **Data fetching:** `web/src/lib/query-client.ts`
  - Shared `QueryClient` with conservative defaults (short stale time, low retry count, no refetch-on-focus).
- **Error handling:** `web/src/components/error-boundary.tsx`
  - App-level error boundary with a simple fallback screen and dev-only logging (no PII).
- **Toasts:**
  - `web/src/lib/toast-context.ts` (`ToastContext`, `useToast`)
  - `web/src/components/ui/toast-provider.tsx` (state management with pause/resume, auto-dismiss, stacking)
  - `web/src/components/ui/toast-viewport.tsx` (Tailwind-styled, accessible UI, bottom-right)
  - Features:
    - **Auto-dismiss:** Variant-based durations (success: 4s, default: 5s, error: 8s, customizable)
    - **Progress bar:** Visual countdown with CSS animation, pauses on hover
    - **Pause on hover:** Timer pauses when hovering over toast, resumes on mouse leave
    - **Stacking:** Maximum 5 toasts displayed, FIFO removal of oldest when limit exceeded
    - **Undo actions:** Delete operations show undo button with 8-second window (expenses, incomes)
    - **Accessibility:** ARIA live regions, keyboard navigation, prefers-reduced-motion support
- **Loading States (Skeleton Components):**
  - `web/src/components/ui/skeleton.tsx` (base skeleton with animated pulse, dark mode support)
  - `web/src/components/skeletons/table-skeleton.tsx` (configurable table skeleton with N columns/rows, ARIA labels)
  - `web/src/components/skeletons/card-skeleton.tsx` (card skeleton mimicking GstSummaryCard structure)
  - Integrated across all data-fetching pages:
    - Expenses, Incomes, Recurring Expenses (table skeletons)
    - Dashboard (card skeletons for BAS summary)
    - Settings: Providers, Categories, Clients (table skeletons)
  - All skeletons use proper ARIA labels for accessibility
  - 23 skeleton-related unit tests (6 base + 9 table + 8 card)
- **Empty States:**
  - `web/src/components/ui/empty-state.tsx` (reusable empty state component)
  - Props: `title`, `description`, `actionLabel?`, `onAction?`, `icon?`
  - Semantic HTML with `<section>`, `<h3>`, `<p>`, and optional `<button>`
  - Accessible with `role="status"` and `aria-live="polite"`
  - Integrated across all data-listing pages:
    - Expenses (Receipt icon) - "No expenses yet"
    - Incomes (DollarSign icon) - "No incomes yet"
    - Recurring Expenses (Repeat icon) - "No recurring expenses yet"
    - Settings: Providers (Store icon), Categories (FolderOpen icon), Clients (Users icon)
  - 9 unit tests covering all variants, accessibility, and keyboard navigation
- **Layout & navigation:**
  - `web/src/components/layout/layout.tsx` (visual shell using sidebar, header, mobile nav, command palette, global shortcuts)
  - `web/src/components/layout/sidebar.tsx` + `mobile-nav.tsx` (desktop & mobile navigation based on `NAV_ITEMS`)
  - `web/src/components/layout/header.tsx` (displays current FY/Quarter using `useFYInfo`)
  - `web/src/components/layout/command-palette.tsx` (stub modal toggled via ⌘K / Ctrl+K)
  - `web/src/components/keyboard-shortcuts-help.tsx` (help overlay showing all shortcuts, toggled via ⌘/ / Ctrl+/)
  - `web/src/config/navigation.ts` (central navigation config)
  - `web/src/hooks/use-keyboard-shortcuts.ts` (command palette shortcut: ⌘K)
  - `web/src/hooks/use-global-shortcuts.ts` (global shortcuts: Ctrl+Alt+N, Ctrl+Alt+Shift+N, Ctrl+Alt+I, Ctrl+/, Ctrl+F)
- **Testing:**
  - `web/vitest.config.ts` (jsdom env, `@` alias)
  - `web/src/test/setup.ts` (`@testing-library/jest-dom`)
  - Infra tests:
    - `web/src/components/error-boundary.test.tsx`
    - `web/src/lib/api-client.test.ts`
    - `web/src/components/ui/toast-provider.test.tsx`
    - `web/src/lib/fy.test.ts`
    - `web/src/hooks/use-keyboard-shortcuts.test.tsx` (command palette shortcut)
    - `web/src/hooks/use-global-shortcuts.test.tsx` (global shortcuts - 19 tests)
    - `web/src/components/keyboard-shortcuts-help.test.tsx` (help overlay - 19 tests)

### Dashboard (Phase F2.1)

The web dashboard in `web/src/features/dashboard` provides a high-level BAS overview for the current Australian financial year quarter plus shortcuts for common actions.

- Data is loaded from the backend via `useDashboardData`:
  - Uses `getFYInfo(new Date())` to determine the active BAS quarter and financial year.
  - Fetches the BAS summary (`BasSummaryDto`) for that period.
  - Loads recent expenses (`ExpenseResponseDto[]`), sorted newest-first and limited to the latest 10.
  - Loads active recurring expenses (`RecurringExpenseResponseDto[]`) sorted by `nextDueDate`.
- Typed API helpers in `web/src/lib/api-client.ts` wrap the shared OpenAPI types:
  - `getBasSummary(quarter, year)`
  - `getRecentExpenses()`
  - `getActiveRecurringExpenses()` – Returns all active recurring expenses sorted by next due date
  - `getDueRecurringExpenses(asOfDate?)` – Returns only expenses due for auto-generation
- `DashboardPage` composes:
  - GST summary cards for G1, 1A, 1B and Net GST.
  - A “Recent expenses” list with loading/empty/data states.
  - A “Quick actions” block linking to `/expenses` and `/incomes`.
  - An “Upcoming recurring expenses” panel with loading/empty/data states.

---

## Monorepo Structure

```
easytax-au/
├── src/                          # Backend (NestJS)
│   ├── common/                   # Shared utilities, transformers
│   ├── modules/                  # Feature modules
│   │   ├── categories/
│   │   ├── providers/
│   │   ├── clients/
│   │   ├── expenses/
│   │   ├── incomes/
│   │   ├── bas/
│   │   ├── reports/
│   │   ├── csv-import/
│   │   ├── import-jobs/
│   │   ├── recurring-expenses/
│   │   └── backup/
│   ├── app.module.ts
│   └── main.ts
│
├── web/                          # Frontend (React)
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   └── layout/           # App shell, navigation
│   │   ├── features/             # Feature modules
│   │   │   ├── dashboard/
│   │   │   ├── expenses/
│   │   │   ├── incomes/
│   │   │   ├── import/
│   │   │   ├── reports/
│   │   │   ├── recurring/
│   │   │   └── settings/
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utilities, API client
│   │   ├── types/                # Frontend-specific types
│   │   └── App.tsx
│   ├── e2e/                      # Playwright tests
│   ├── package.json
│   └── vite.config.ts
│
├── shared/                       # Shared between frontend & backend
│   └── types/
│       └── api.d.ts              # OpenAPI-generated API types (@shared/types, @api-types)
│
├── data-examples/                # Sample CSV files
├── pgdata/                       # PostgreSQL data (gitignored)
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json                  # Root workspace config
└── README.md
```

---

## Frontend Architecture Patterns

### Component Organization

```
features/expenses/
├── expenses-page.tsx           # Page component (route entry)
├── components/
│   ├── expenses-table.tsx      # Data table
│   ├── expense-form.tsx        # Add/edit form
│   ├── expense-filters.tsx     # Filter controls
│   ├── provider-select.tsx     # Provider dropdown
│   └── category-select.tsx     # Category dropdown
├── hooks/
│   ├── use-expenses.ts         # TanStack Query hook
│   └── use-expense-mutations.ts # Create/update/delete
└── schemas/
    └── expense.schema.ts       # Zod validation schema

features/incomes/
├── incomes-page.tsx            # Page component (route entry)
├── components/
│   ├── incomes-table.tsx       # Data table with paid toggle
│   ├── income-form.tsx         # Add/edit form with GST calc
│   ├── income-filters.tsx      # Filter controls
│   └── client-select.tsx       # Client dropdown
├── hooks/
│   ├── use-incomes.ts          # TanStack Query hook
│   └── use-income-mutations.ts # Create/update/delete/toggle paid
└── schemas/
    └── income.schema.ts        # Zod validation schema

features/recurring/
├── recurring-page.tsx          # Page component (route entry)
├── components/
│   ├── recurring-table.tsx     # Data table with color-coded due dates
│   ├── recurring-form.tsx      # Add/edit template form
│   └── generate-button.tsx     # Generation workflow component
├── hooks/
│   ├── use-recurring.ts        # TanStack Query hooks (all + due)
│   └── use-recurring-mutations.ts # Create/update/delete/generate
└── schemas/
    └── recurring.schema.ts     # Zod validation schema
```

### Expenses Module (F2.2)

- **Expenses list:** `useExpenses` hook (`web/src/features/expenses/hooks/use-expenses.ts`) + `ExpensesTable` (`web/src/features/expenses/components/expenses-table.tsx`) provide a read-only expenses table using `/expenses`, sorted by date (newest first) with loading/error/empty states.
- **Expenses table:** `ExpensesTable` renders a semantic HTML table with columns for date, description, provider, category, amount, GST, biz%, and BAS period. It uses client-side sorting by date, amount, and provider name (clickable headers, `aria-sort` for a11y).
- **Expenses filters:** `ExpenseFilters` (`web/src/features/expenses/components/expense-filters.tsx`) provides provider/category/date filters. Filtering is currently client-side in `ExpensesPage` by narrowing the `expenses` array before passing it into `ExpensesTable`. If data volume grows, `useExpenses` can be extended to accept filter params and call `/expenses` with query params for server-side filtering.
- **Expense create form:** `ExpenseForm` (`web/src/features/expenses/components/expense-form.tsx`) uses React Hook Form plus a Zod `expenseFormSchema` to validate inputs (date, providerId/categoryId UUIDs, amount/gst cents, bizPercent range, optional description/fileRef) and converts user-entered currency strings to cents via `parseCurrency`.
- **Expense mutations:** `use-expense-mutations.ts` (`web/src/features/expenses/hooks/use-expense-mutations.ts`) exposes three mutation hooks:
  - `useCreateExpense`: `POST /expenses` mutation for creating new expenses
  - `useUpdateExpense`: `PATCH /expenses/:id` mutation for updating existing expenses
  - `useDeleteExpense`: `DELETE /expenses/:id` mutation for deleting expenses
  - All mutations invalidate the `['expenses']` query on success and are wired with toast notifications for success/error feedback
- **Expense form modes:** `ExpenseForm` supports both create and edit modes via `initialValues` and `expenseId` props. In edit mode, it populates form fields from the expense data and uses `useUpdateExpense`; in create mode, it starts with empty fields and uses `useCreateExpense`.
- **GST auto-calculation (F2.2.8):** The expense form implements real-time GST calculation using React Hook Form's `watch()` and `useMemo` for performance optimization. Key features:
  - **Domestic providers:** GST automatically calculated as 1/11 of total amount (e.g., $110.00 → $10.00 GST)
  - **International providers:** GST always $0.00 (GST-free)
  - **Display:** Calculated GST shown in emerald text below amount field with provider-specific messaging
  - **Reactivity:** Updates immediately when amount or provider selection changes
  - **Manual override:** Users can still manually enter GST in the optional GST field if needed
  - **Implementation:** Uses `selectedProvider` memo to find provider by ID, then `calculatedGst` memo to compute GST based on `provider.isInternational` flag
- **Business use percentage slider (F2.2.9):** HTML5 range input (`type="range"`) replaces traditional number input for better UX:
  - **Range:** 0-100% with 5% step increments for easier control
  - **Accessibility:** Full ARIA support (aria-label, aria-valuemin/max/now) for screen readers
  - **Visual feedback:** Current percentage displayed prominently next to label in emerald color
  - **Claimable GST display:** Shows calculated claimable GST below slider: "Claimable GST: $X.XX (Y% of $Z.ZZ)"
  - **Reactive calculation:** `claimableGst` memo computes `(GST × bizPercent) / 100` using either manual or auto-calculated GST
  - **Respects manual GST:** If user enters custom GST amount, claimable calculation uses that value instead of auto-calculated
- **Actions column:** `ExpensesTable` includes an Actions column with Edit (pencil icon) and Delete (trash icon) buttons using Lucide React icons. Both buttons use accessible aria-labels and tooltips.
- **Delete confirmation:** Reusable `ConfirmationDialog` component (`web/src/components/ui/confirmation-dialog.tsx`) provides accessible alertdialog for dangerous actions. Features include:
  - Keyboard accessible (Escape to close, auto-focus on confirm button)
  - Loading state support (disables buttons during async operations)
  - Danger variant (red confirm button for destructive actions)
  - Focus management and `aria-modal` for screen readers

### Incomes Module (F2.3)

- **Incomes list:** `useIncomes` hook (`web/src/features/incomes/hooks/use-incomes.ts`) + `IncomesTable` (`web/src/features/incomes/components/incomes-table.tsx`) provide a sortable incomes table using `/incomes`, sorted by date descending (newest first) with loading/error/empty states.
- **Incomes table:** `IncomesTable` renders a semantic HTML table with columns for date, invoice #, client, description, subtotal, GST, total, paid status (as clickable badge), and actions. Supports client-side sorting by date, total, client name, and paid status via clickable column headers with `aria-sort` for accessibility.
- **Paid status toggle:** The paid/unpaid badge in the table becomes a clickable button when `onTogglePaid` callback is provided, allowing quick status changes without opening a modal. Badge colors: green for paid, amber for unpaid.
- **Incomes filters:** `IncomeFilters` (`web/src/features/incomes/components/income-filters.tsx`) provides client/paid-status/date-range filters. Like expenses, filtering is currently client-side by narrowing the `incomes` array in `IncomesPage` before rendering.
- **Income create/edit form:** `IncomeForm` (`web/src/features/incomes/components/income-form.tsx`) uses React Hook Form + Zod `incomeFormSchema` for validation. Key features:
  - GST auto-calculated as 10% of subtotal (Australian standard)
  - Total auto-calculated as subtotal + GST
  - Real-time calculation updates as user types
  - Client selection dropdown with pre-population
  - Optional invoice number field
  - Paid status checkbox
  - Supports both create and edit modes via `initialValues` and `incomeId` props
- **Income mutations:** `use-income-mutations.ts` (`web/src/features/incomes/hooks/use-income-mutations.ts`) exposes five mutation hooks:
  - `useCreateIncome`: `POST /incomes` for creating new incomes
  - `useUpdateIncome`: `PATCH /incomes/:id` for updating incomes
  - `useDeleteIncome`: `DELETE /incomes/:id` for deleting incomes
  - `useMarkPaid`: `PATCH /incomes/:id/paid` for marking income as paid
  - `useMarkUnpaid`: `PATCH /incomes/:id/paid` for marking income as unpaid
  - All mutations use optimistic updates, invalidate the `['incomes']` query on success, and show toast notifications
- **Key differences from Expenses:**
  - Uses Client instead of Provider (no category field)
  - No biz_percent (incomes are always 100% business)
  - Has isPaid boolean status with quick toggle
  - Has optional invoiceNumber field
  - GST is always 10% (not variable like expenses with international providers)
  - Total always equals subtotal + GST (no complexity around GST-free items)

### Recurring Expenses Module (F3.3)

- **Recurring expenses list:** `useRecurringExpenses` hook (`web/src/features/recurring/hooks/use-recurring.ts`) + `RecurringTable` (`web/src/features/recurring/components/recurring-table.tsx`) provide a sortable recurring expense templates table using `/recurring-expenses`, with loading/error/empty states.
- **Recurring table:** `RecurringTable` renders a semantic HTML table with columns for name, provider, category, amount, schedule, next due date, last generated date, active status (badge), and actions (edit/delete). Supports client-side sorting by name, amount, schedule, next due date, and active status via clickable column headers with `aria-sort` for accessibility.
- **Next due date color coding:** Due dates are color-coded for visual priority:
  - **Red (overdue):** Next due date is in the past, labeled "(overdue)"
  - **Amber (due soon):** Next due date is within 7 days, labeled "(due soon)"
  - **Green (future):** Next due date is more than 7 days away
- **Recurring expense form:** `RecurringForm` (`web/src/features/recurring/components/recurring-form.tsx`) uses React Hook Form + Zod `recurringExpenseSchema` for validation. Key features:
  - **Schedule configuration:** Monthly/quarterly/yearly frequency with day-of-month (1-28) to avoid month-end date issues
  - **GST auto-calculation:** Identical to expense form - 1/11 for domestic providers, $0 for international
  - **Business use slider:** 0-100% slider with real-time claimable GST calculation
  - **Date lifecycle:** Start date (required) and optional end date for template expiration
  - **Active/paused toggle:** Checkbox to temporarily suspend a template without deletion
  - **Supports create and edit modes** via `initialValues` and `recurringId` props
  - **Currency handling:** Uses `parseCurrency().cents` to extract integer cents from user input for backend compatibility
- **Generation workflow:** `GenerateButton` (`web/src/features/recurring/components/generate-button.tsx`) orchestrates the expense generation process:
  - Uses `useDueRecurringExpenses` hook to fetch templates where `nextDueDate <= today`
  - Shows confirmation dialog with list of due templates and total amount
  - Calls `POST /recurring-expenses/generate` on confirmation
  - Displays results modal showing count of generated/skipped expenses
  - Invalidates both `['recurring-expenses']` and `['expenses']` queries on success
  - Shows toast notifications for success/error states
- **Recurring mutations:** `use-recurring-mutations.ts` (`web/src/features/recurring/hooks/use-recurring-mutations.ts`) exposes five mutation hooks:
  - `useCreateRecurring`: `POST /recurring-expenses` for creating templates (requires `currency: 'AUD'` field)
  - `useUpdateRecurring`: `PATCH /recurring-expenses/:id` for updating templates
  - `useDeleteRecurring`: `DELETE /recurring-expenses/:id` for deleting templates
  - `useGenerateRecurring`: `POST /recurring-expenses/generate` for creating expenses from due templates
  - All mutations invalidate the `['recurring-expenses']` query on success; generate also invalidates `['expenses']`
- **Delete confirmation:** Warns user that generated expenses will remain after template deletion, showing template details (name, amount, schedule) in a dark-themed confirmation dialog
- **Empty state:** Shows empty state message "No recurring expenses yet" with "Create Your First Recurring Expense" button when no templates exist
- **Navigation integration:** Added to main navigation with `/recurring` route and "Recurring" label using Lucide's `Repeat` icon
- **Key differences from regular expenses:**
  - Templates are for future expense generation, not actual expenses
  - Includes schedule configuration (frequency, day of month)
  - Has next due date and last generated date tracking
  - Active/paused status for temporary suspension
  - Generation creates multiple actual expenses over time from a single template
  - Backend auto-calculates next due date based on schedule after each generation

### Settings Module (F2.5, F2.6)

- **Settings layout:** Shared tab navigation component (`SettingsTabs`) provides consistent navigation between Providers, Categories, and Clients sections
- **Nested routing:** Settings uses nested React Router routes under `/settings` with automatic redirect to `/settings/providers` as the default view
- **Providers CRUD:** Full create/read/update/delete for expense vendors with:
  - International provider toggle (GST-free flag)
  - Optional default category selection
  - Optional ABN/ARN field (9 or 11 digits, validated)
  - Sortable table by name and international status
  - Modal-based create/edit forms
  - Delete confirmation dialog
- **Categories CRUD:** Full create/read/update/delete for expense categories with:
  - BAS label selection (1B/G10/G11) with explanatory dropdown
  - Tax deductible toggle (default: true)
  - Optional description field
  - Sortable table by name and BAS label
  - Modal-based create/edit forms
  - Delete confirmation dialog
- **Clients CRUD (F2.6):** Full create/read/update/delete for income clients with:
  - Encrypted name and ABN fields (displayed with 🔒 icons in form)
  - ABN formatted with spaces for readability (12 345 678 901)
  - PSI (Personal Services Income) eligible flag with tooltip explanation
  - Related incomes count column (calculated client-side from incomes data)
  - Sortable table by name and PSI eligible status
  - Modal-based create/edit forms
  - Delete confirmation with warning about income references
- **Module structure:** All three settings modules follow the established feature pattern:

  ```
  features/settings/providers/
  ├── providers-page.tsx          # Main CRUD page with modals
  ├── components/
  │   ├── providers-table.tsx     # Sortable table
  │   └── provider-form.tsx       # Create/edit form
  ├── hooks/
  │   └── use-provider-mutations.ts # Create/update/delete
  └── schemas/
      └── provider.schema.ts      # Zod validation

  features/settings/categories/
  ├── categories-page.tsx         # Main CRUD page with modals
  ├── components/
  │   ├── categories-table.tsx    # Sortable table
  │   └── category-form.tsx       # Create/edit form
  ├── hooks/
  │   └── use-category-mutations.ts # Create/update/delete
  └── schemas/
      └── category.schema.ts      # Zod validation

  features/settings/clients/
  ├── clients-page.tsx            # Main CRUD page with modals
  ├── components/
  │   ├── clients-table.tsx       # Sortable table with ABN formatting
  │   └── client-form.tsx         # Create/edit form with encryption notices
  ├── hooks/
  │   └── use-client-mutations.ts # Create/update/delete
  └── schemas/
      └── client.schema.ts        # Zod validation (ABN: 11 digits)

  features/settings/components/
  └── settings-tabs.tsx           # Shared tab navigation
  ```

- **Shared query hooks:** All three modules reuse existing shared hooks from `web/src/hooks/` for data fetching (`useProviders`, `useCategories`, `useClients`) rather than duplicating them
- **Type safety:** All DTOs imported from `@shared/types` OpenAPI schema. Update mutations use `Partial<CreateDto>` pattern since backend Update DTOs are defined as `Record<string, never>` in the OpenAPI schema

### Reports Module (F3.1, F3.2)

- **BAS Reports (F3.1):** Quarterly BAS summaries with G1, 1A, 1B calculations
  - Quarter/year selector with current period highlighted
  - Date ranges displayed for each quarter (e.g., "Q1 (1 Jul - 30 Sep 2025)")
  - GST summary cards reusing `GstSummaryCard` component from dashboard
  - PDF download functionality with toast notifications
  - Income and expense record counts
- **FY Reports (F3.2):** Annual financial year summaries for tax return preparation
  - Year selector showing current FY + last 3 years (e.g., "FY2026 (Jul 2025 - Jun 2026)")
  - Comprehensive income summary: Total, Paid, Unpaid, GST Collected
  - Expense summary: Total, GST Paid, Category count
  - Net position cards: Profit/Loss and Net GST Payable/Refund (color-coded)
  - Category breakdown table: All expenses by category, sorted by amount descending, with totals row
  - BAS label breakdown: Expenses grouped by BAS label (1B, G10, G11) with:
    - Descriptive headers for each label
    - Nested category details within each label
    - Subtotals for multi-category labels
  - PDF download functionality using blob download pattern
  - Comprehensive loading, error, and empty states
- **Module structure:**
  ```
  features/reports/
  ├── bas-report-page.tsx         # BAS quarterly reports page
  ├── fy-report-page.tsx          # FY annual reports page
  ├── components/
  │   ├── quarter-selector.tsx    # Quarter/year selector (BAS)
  │   ├── year-selector.tsx       # Year selector (FY)
  │   ├── bas-summary.tsx         # BAS summary cards
  │   ├── fy-summary.tsx          # FY summary cards
  │   ├── category-breakdown.tsx  # Expense breakdown by category table
  │   └── bas-label-breakdown.tsx # Expense breakdown by BAS label (grouped)
  └── hooks/
      ├── use-bas-report.ts       # TanStack Query hook for BAS data
      ├── use-fy-report.ts        # TanStack Query hook for FY data
      └── use-available-quarters.ts # Quarter date ranges hook
  ```
- **API helpers:** `web/src/lib/api-client.ts` provides typed helpers:
  - `getBasSummary(quarter, year)` → `BasSummaryDto`
  - `getFYSummary(year)` → `FYSummaryDto`
  - `getQuartersForYear(year)` → `QuarterDateRange[]`
  - `downloadFYReportPdf(year)` → PDF blob download
- **Type safety:** All report DTOs imported from `@shared/types` OpenAPI schema:
  - `FYSummaryDto`, `FYIncomeSummaryDto`, `FYExpenseSummaryDto`, `CategoryExpenseDto`
  - `BasSummaryDto`, `QuarterDateRange`

### Data Fetching Pattern

> Note: Filtering by category/provider/date is currently applied client-side in `ExpensesPage` by narrowing the `expenses` array before passing it into `ExpensesTable`. If data volume grows, this hook can be extended with filter parameters and filter-aware query keys to call `/expenses` with query params for server-side filtering.

```typescript
// hooks/use-expenses.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ExpenseResponseDto } from '@/lib/api-client';
import { getExpenses } from '@/lib/api-client';

export function useExpenses(): UseQueryResult<ExpenseResponseDto[]> {
  return useQuery<ExpenseResponseDto[]>({
    queryKey: ['expenses'],
    queryFn: getExpenses,
  });
}
```

### Form Pattern

```typescript
// schemas/expense.schema.ts
import { z } from 'zod';

export const expenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  providerId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  gstCents: z.number().int().min(0),
  bizPercent: z.number().int().min(0).max(100),
  description: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
```

### API Client Pattern

```typescript
// Simplified example of the frontend API client (see web/src/lib/api-client.ts)

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const envBaseUrl = import.meta.env.VITE_API_URL as unknown;
  const baseUrl =
    typeof envBaseUrl === 'string' && envBaseUrl.length > 0 ? envBaseUrl : 'http://localhost:3000';

  const url = new URL(path, baseUrl).toString();

  const response = await fetch(url, {
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body: unknown = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

    if (body && typeof body === 'object' && 'message' in body) {
      const maybeMessage = (body as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') {
        message = maybeMessage;
      }
    }

    throw new ApiError(message, response.status, body);
  }

  return (body as T) ?? (undefined as T);
}

export const apiClient = {
  get<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(path, { method: 'GET', ...(init ?? {}) });
  },
  // post/put/patch/delete omitted for brevity…
};
```

---

## Prerequisites

```bash
# Install fnm (Fast Node Manager)
curl -fsSL https://fnm.vercel.app/install | bash

# Install Node.js 20 LTS
fnm install 20
fnm use 20

# Install pnpm globally
npm install -g pnpm
```

### ESLint + Prettier Configuration

**ESLint Rules (enforced):**

- No `any` type (`@typescript-eslint/no-explicit-any`)
- No unused variables (`@typescript-eslint/no-unused-vars`)
- No console.log in production (`no-console`)
- Explicit return types on functions (`@typescript-eslint/explicit-function-return-type`)

**Prettier Rules:**

- Single quotes
- Trailing commas (ES5)
- 2-space indentation
- 100 character line width
- Semicolons required

---

## Module Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      app.module.ts                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ categories  │  │  providers  │  │   clients   │     │
│  │   module    │  │   module    │  │   module    │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │            │
│         ▼                ▼                ▼            │
│  ┌─────────────────────────────────────────────────┐   │
│  │              expenses module                     │   │
│  │  (references: providers, categories, importJobs)│   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │            import-jobs module                    │   │
│  │  (references: expenses for rollback)            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌──────────────────────┼──────────────────────────┐   │
│  │              incomes module                      │   │
│  │  (references: clients)                          │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                              │
│                         ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │               bas module (read-only)            │   │
│  │  (injects: ExpenseRepository, IncomeRepository) │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │             backup module (utility)             │   │
│  │  (system management, pg_dump wrapper)           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rule

- `bas/` module injects **Repositories** directly, not Services
- This avoids circular dependencies between modules

---

## The "Provider" Registry

Instead of hardcoding apps, we use a Registry.

- Every expense belongs to a `Provider` (e.g., VentraIP, Github).
- Providers define default GST rules (e.g., VentraIP = 10% GST, Github = 0% GST/Free).
- Providers have `is_international` flag → auto-sets GST to $0 for foreign vendors.

### Example Provider Seed Data

| Provider           | is_international | Default Category |
| ------------------ | ---------------- | ---------------- |
| VentraIP           | false            | Hosting          |
| iinet              | false            | Internet         |
| GitHub             | true             | Software         |
| Warp               | true             | Software         |
| Bytedance (Trae)   | true             | Software         |
| NordVPN            | true             | VPN              |
| Google (Workspace) | true             | Software         |

### Provider `is_international` Behavior

The `is_international` flag on a Provider determines GST treatment:

| Flag Value | GST Behavior                                           | Example Provider |
| ---------- | ------------------------------------------------------ | ---------------- |
| `false`    | GST auto-calculated as 1/11 of total (if not provided) | VentraIP, iinet  |
| `true`     | GST **always** set to $0, regardless of input          | GitHub, AWS      |

**Implementation in `ExpensesService.create()`:**

```typescript
if (provider.isInternational) {
  gstCents = 0; // Override any user-provided GST
} else if (createExpenseDto.gstCents !== undefined) {
  gstCents = createExpenseDto.gstCents; // Use provided value
} else {
  gstCents = this.moneyService.calcGstFromTotal(amountCents); // Auto-calculate
}
```

**Why?** International providers (GitHub, AWS, etc.) don't charge GST to Australian customers. Any GST entered would be incorrect and inflate BAS deductions.

---

## Expenses: GST Auto-Calculation Logic

When creating/updating an expense, GST is handled as follows:

```
┌─────────────────────────────────────────────────────────┐
│                   CREATE EXPENSE                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Is provider international?                             │
│  ├─ YES → gst_cents = 0 (always, ignore input)         │
│  └─ NO  → Is gst_cents provided?                       │
│           ├─ YES → Use provided value                  │
│           └─ NO  → Calculate: amount_cents / 11        │
│                                                         │
│  Validate: gst_cents ≤ amount_cents                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Business Use Percentage (`biz_percent`)

For mixed-use expenses (e.g., home internet), only a portion is deductible:

| Field             | Value | Description           |
| ----------------- | ----- | --------------------- |
| amount_cents      | 11000 | Total bill: $110.00   |
| gst_cents         | 1000  | GST component: $10.00 |
| biz_percent       | 50    | 50% business use      |
| **Claimable GST** | 500   | $10.00 × 50% = $5.00  |

The `biz_percent` is applied at BAS calculation time, not when saving the expense.

---

## Incomes: Total Auto-Calculation

Income records track freelance revenue with automatic total calculation:

```
┌─────────────────────────────────────────────────────────┐
│                   CREATE/UPDATE INCOME                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  total_cents = subtotal_cents + gst_cents              │
│                                                         │
│  Example:                                               │
│  ├─ subtotal_cents: 100000  ($1,000.00 ex-GST)        │
│  ├─ gst_cents:       10000  ($100.00 GST)             │
│  └─ total_cents:    110000  ($1,100.00 inc-GST)       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Implementation in `IncomesService`:**

```typescript
// On create
const totalCents = this.moneyService.addAmounts(
  createIncomeDto.subtotalCents,
  createIncomeDto.gstCents,
);

// On update (always recalculate)
income.totalCents = this.moneyService.addAmounts(income.subtotalCents, income.gstCents);
```

**Why auto-calculate?** Ensures data integrity - `total_cents` can never be out of sync with its components. The BAS module relies on accurate totals for G1 calculation.

---

## BAS (Business Activity Statement) Module

The BAS module generates quarterly GST reports following ATO Simpler BAS requirements.

### Module Architecture

```
modules/bas/
├── dto/
│   ├── bas-summary.dto.ts    # Response type
│   └── index.ts
├── bas.controller.ts         # REST endpoints
├── bas.controller.spec.ts    # 15 tests
├── bas.service.ts            # Business logic
├── bas.service.spec.ts       # 38 tests
├── bas.module.ts
└── index.ts
```

### Avoiding Circular Dependencies

Per AGENTS.md guidelines, the BAS module injects **repositories directly** rather than importing full service modules:

```typescript
// ✅ CORRECT - Direct repository injection
@Injectable()
export class BasService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly moneyService: MoneyService,
  ) {}
}

// ❌ WRONG - Would cause circular dependencies
constructor(
  private expensesService: ExpensesService,  // Bad!
  private incomesService: IncomesService,    // Bad!
) {}
```

### BAS Calculation Formulas

| BAS Label | Description          | Formula                                           |
| --------- | -------------------- | ------------------------------------------------- |
| **G1**    | Total Sales          | `SUM(incomes.total_cents)` for period             |
| **1A**    | GST Collected        | `SUM(incomes.gst_cents)` for period               |
| **1B**    | GST Paid (Claimable) | `SUM(expenses.gst_cents × biz_percent / 100)` ¹   |
| **Net**   | GST Payable/Refund   | `1A - 1B` (positive = pay ATO, negative = refund) |

¹ Only includes expenses where `provider.is_international = false`

### Quarter Date Calculations

Australian Financial Year quarters use string-based dates (YYYY-MM-DD) to avoid timezone issues:

```typescript
private getQuarterDateRange(quarter: Quarter, financialYear: number) {
  const fyStartYear = financialYear - 1;

  switch (quarter) {
    case 'Q1': return { start: `${fyStartYear}-07-01`, end: `${fyStartYear}-09-30` };
    case 'Q2': return { start: `${fyStartYear}-10-01`, end: `${fyStartYear}-12-31` };
    case 'Q3': return { start: `${financialYear}-01-01`, end: `${financialYear}-03-31` };
    case 'Q4': return { start: `${financialYear}-04-01`, end: `${financialYear}-06-30` };
  }
}
```

### API Endpoints

| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| GET    | `/bas/:quarter/:year` | Get BAS summary for a quarter  |
| GET    | `/bas/quarters/:year` | Get all quarter dates for a FY |

### Example Response

```json
GET /bas/Q1/2025

{
  "quarter": "Q1",
  "financialYear": 2025,
  "periodStart": "2024-07-01",
  "periodEnd": "2024-09-30",
  "g1TotalSalesCents": 1100000,
  "label1aGstCollectedCents": 100000,
  "label1bGstPaidCents": 45000,
  "netGstPayableCents": 55000,
  "incomeCount": 8,
  "expenseCount": 25
}
```

---

## FY Summary Reporting

The FY Summary endpoint provides annual totals for tax return preparation.

### API Endpoint

| Method | Endpoint            | Description                      |
| ------ | ------------------- | -------------------------------- |
| GET    | `/reports/fy/:year` | Get complete FY summary for year |

### FY Date Range Calculation

```typescript
// FY2026 = July 2025 to June 2026
private getFYDateRange(financialYear: number) {
  const fyStartYear = financialYear - 1;
  return {
    start: `${fyStartYear}-07-01`,  // July 1 of previous calendar year
    end: `${financialYear}-06-30`,   // June 30 of FY year
  };
}
```

### Response Structure

| Field                         | Description                                |
| ----------------------------- | ------------------------------------------ |
| `income.totalIncomeCents`     | All income (including GST)                 |
| `income.paidIncomeCents`      | Paid invoices only                         |
| `income.unpaidIncomeCents`    | Outstanding invoices                       |
| `income.gstCollectedCents`    | Total GST on income                        |
| `expenses.totalExpensesCents` | All expenses                               |
| `expenses.gstPaidCents`       | Claimable GST (domestic, with biz_percent) |
| `expenses.byCategory`         | Breakdown by category with BAS labels      |
| `netProfitCents`              | Income - Expenses                          |
| `netGstPayableCents`          | GST Collected - GST Paid                   |

### Example Response

```json
GET /reports/fy/2026

{
  "financialYear": 2026,
  "fyLabel": "FY2026",
  "periodStart": "2025-07-01",
  "periodEnd": "2026-06-30",
  "income": {
    "totalIncomeCents": 5500000,
    "paidIncomeCents": 5000000,
    "unpaidIncomeCents": 500000,
    "gstCollectedCents": 500000,
    "count": 45
  },
  "expenses": {
    "totalExpensesCents": 2200000,
    "gstPaidCents": 200000,
    "count": 156,
    "byCategory": [
      {
        "categoryId": 1,
        "name": "Software",
        "basLabel": "1B",
        "totalCents": 500000,
        "gstCents": 45454,
        "count": 24
      }
    ]
  },
  "netProfitCents": 3300000,
  "netGstPayableCents": 300000
}
```

---

## PDF Export

The PDF Export feature generates downloadable PDF reports for BAS and FY summaries.

### Technology Choice

**PDFKit** (v0.17.x) - ~500KB bundle, pure JavaScript, no external dependencies.

| Option    | Bundle Size | Pros                         | Cons              |
| --------- | ----------- | ---------------------------- | ----------------- |
| PDFKit ✅ | ~500KB      | Lightweight, no dependencies | Manual layout     |
| Puppeteer | ~300MB      | HTML/CSS templates           | Chrome dependency |
| pdfmake   | ~2MB        | JSON templates               | Large bundle      |

### API Endpoints

| Method | Endpoint                          | Description                 |
| ------ | --------------------------------- | --------------------------- |
| GET    | `/reports/fy/:year/pdf`           | Download FY summary as PDF  |
| GET    | `/reports/bas/:quarter/:year/pdf` | Download BAS summary as PDF |

### PDF Configuration

```typescript
const PDF_CONFIG = {
  margin: { left: 50, right: 50, top: 50, bottom: 50 },
  fontSize: { title: 24, subtitle: 16, heading: 14, body: 11, small: 9 },
  colors: { primary: '#2c3e50', secondary: '#7f8c8d', accent: '#3498db' },
  table: { labelWidth: 250, valueWidth: 150, rowHeight: 25 },
};
```

### Response Headers

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="BAS-Q1-2026.pdf"
```

### PDF Structure

**BAS Summary PDF:**

- Title with quarter/year
- Period dates (e.g., "1 Jul 2025 - 30 Sep 2025")
- GST breakdown table (Collected, Paid, Net Payable)
- Income and Expense totals
- Summary section

**FY Summary PDF:**

- Title with financial year
- Income section (Total, Paid, Unpaid, GST Collected)
- Expenses by category (with BAS labels)
- Net profit calculation
- Generated timestamp footer

---

## Recurring Expenses (Automation)

The Recurring Expenses feature automates repetitive expense entries.

### API Endpoints

| Method | Endpoint                       | Description                           |
| ------ | ------------------------------ | ------------------------------------- |
| POST   | `/recurring-expenses`          | Create recurring expense template     |
| GET    | `/recurring-expenses`          | List all templates                    |
| GET    | `/recurring-expenses/active`   | List active templates (for dashboard) |
| GET    | `/recurring-expenses/due`      | List templates due for generation     |
| GET    | `/recurring-expenses/:id`      | Get single template                   |
| PATCH  | `/recurring-expenses/:id`      | Update template                       |
| DELETE | `/recurring-expenses/:id`      | Delete template                       |
| POST   | `/recurring-expenses/generate` | Generate expenses from due templates  |

### Schedule Types

| Schedule    | Period         | Use Case                    |
| ----------- | -------------- | --------------------------- |
| `monthly`   | Every month    | iinet, GitHub subscriptions |
| `quarterly` | Every 3 months | Quarterly software licenses |
| `yearly`    | Every year     | Annual domain renewals      |

### Entity Fields

```typescript
RecurringExpense {
  // Template fields (same as Expense)
  name: string;          // e.g., "iinet Internet"
  amountCents: number;   // $89.99 = 8999
  gstCents: number;      // Auto-calculated or 0 for international
  bizPercent: number;    // Business use % (0-100)
  providerId: string;
  categoryId: string;

  // Schedule fields
  schedule: 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth: number;    // 1-28 (avoids month-end issues)
  startDate: Date;       // When to start generating
  endDate?: Date;        // Optional end date
  isActive: boolean;     // Can pause/resume

  // Tracking
  lastGeneratedDate?: Date;  // Last expense created
  nextDueDate: Date;         // Computed next due date
}
```

### Generation Logic

```
┌─────────────────────────────────────────────────────────┐
│            POST /recurring-expenses/generate            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  For each RecurringExpense where:                       │
│  ├─ isActive = true                                    │
│  ├─ nextDueDate <= today                               │
│  └─ (endDate is null OR nextDueDate <= endDate)        │
│                                                         │
│  Create Expense:                                        │
│  ├─ date = nextDueDate                                 │
│  ├─ Copy: amount, gst, bizPercent, provider, category  │
│  └─ description = template.description or auto-generate│
│                                                         │
│  Update RecurringExpense:                              │
│  ├─ lastGeneratedDate = nextDueDate                    │
│  └─ nextDueDate = calculateNextDueDate(schedule)       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Example Usage

```bash
# Create monthly iinet subscription
curl -X POST http://localhost:3000/recurring-expenses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iinet Internet",
    "amountCents": 8999,
    "schedule": "monthly",
    "dayOfMonth": 15,
    "startDate": "2025-07-01",
    "bizPercent": 50,
    "providerId": "<iinet-uuid>",
    "categoryId": "<internet-uuid>"
  }'

# Generate all due expenses
curl -X POST http://localhost:3000/recurring-expenses/generate

# Response:
{
  "generated": 2,
  "skipped": 0,
  "expenseIds": ["uuid-1", "uuid-2"],
  "details": [
    {
      "recurringExpenseId": "...",
      "recurringExpenseName": "iinet Internet",
      "expenseId": "uuid-1",
      "date": "2025-07-15",
      "amountCents": 8999
    }
  ]
}
```

### Duplicate Prevention

- `lastGeneratedDate` tracks when an expense was last created
- `nextDueDate` is calculated after each generation
- Won't create two expenses for the same period
- Safe to call `generate` multiple times

---

## ATO GST Logic (Simpler BAS)

| BAS Label | Description                 | Source                                   |
| --------- | --------------------------- | ---------------------------------------- |
| **G1**    | Total Sales (including GST) | `SUM(incomes.total_cents)`               |
| **1A**    | GST Collected on Sales      | `SUM(incomes.gst_cents)`                 |
| **1B**    | GST Paid on Purchases       | `SUM(expenses.gst_cents)` where domestic |

### GST Calculation Rules

1. **Domestic Provider** → GST = 10% of subtotal (1/11 of total)
2. **International Provider** → GST = $0 (GST-Free)
3. **Business Use %** → Only claim `biz_percent` of GST
   - Example: iinet $110 at 50% business use → Claim $5 GST (not $10)

### BAS Period Mapping (Australian FY)

| Quarter | Months             | FY Example               |
| ------- | ------------------ | ------------------------ |
| Q1      | July - September   | Q1 FY2025 = Jul-Sep 2024 |
| Q2      | October - December | Q2 FY2025 = Oct-Dec 2024 |
| Q3      | January - March    | Q3 FY2025 = Jan-Mar 2025 |
| Q4      | April - June       | Q4 FY2025 = Apr-Jun 2025 |

---

## Data Entry Flow

```
┌──────────────────┐
│  Manual Entry    │  ← PRIMARY method
│  (UI / API)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Select Provider │ ──► │ Auto-fill:       │
│  (e.g., GitHub)  │     │ - is_international│
└──────────────────┘     │ - default_category│
                         │ - GST = $0        │
                         └──────────────────┘
         │
         ▼
┌──────────────────┐
│  Override if     │
│  needed          │
│  (biz_percent,   │
│   category)      │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│  Save to DB      │
│  (encrypted)     │
└──────────────────┘
```

---

## Currency Handling

- All amounts stored as **cents** (integers): `amount_cents`, `gst_cents`
- Use `decimal.js` for calculations, convert to cents for storage
- Frontend sends **cents** (e.g., `11000` for $110.00)
- Frontend displays **AUD** (e.g., `$110.00`)

**Why cents?**

- Avoids floating-point precision errors
- Simpler integer math in SQL aggregations
- Industry standard for financial systems (Stripe, etc.)

---

## MoneyService

Centralized service for all GST and currency calculations using `decimal.js`.

```typescript
@Injectable()
export class MoneyService {
  /**
   * Extract GST from a GST-inclusive total (1/11)
   * @param totalCents - Total amount in cents (e.g., 11000 for $110.00)
   * @returns GST component in cents (e.g., 1000 for $10.00)
   */
  calcGstFromTotal(totalCents: number): number;

  /**
   * Add 10% GST to a subtotal
   * @param subtotalCents - Amount before GST in cents
   * @returns Total with GST in cents
   */
  addGst(subtotalCents: number): number;

  /**
   * Apply business use percentage to GST
   * @param gstCents - Full GST amount in cents
   * @param bizPercent - Business use percentage (0-100)
   * @returns Claimable GST in cents
   */
  applyBizPercent(gstCents: number, bizPercent: number): number;

  /**
   * Convert cents to display string
   * @param cents - Amount in cents
   * @returns Formatted string (e.g., "$110.00")
   */
  formatAud(cents: number): string;
}
```

**Usage in Services:**

```typescript
// In expenses.service.ts
const claimableGst = this.moneyService.applyBizPercent(expense.gst_cents, expense.biz_percent);
```

---

## FYService (Financial Year Utilities)

Centralized service for Australian Financial Year and BAS quarter calculations.

**Australian FY Rules:**

- FY runs from 1 July to 30 June
- FY2026 = 1 July 2025 to 30 June 2026
- The FY number is the calendar year in which the FY **ends**

**BAS Quarters:**
| Quarter | Months | Example for FY2026 |
|---------|--------|-------------------|
| Q1 | July - September | Jul 2025 - Sep 2025 |
| Q2 | October - December | Oct 2025 - Dec 2025 |
| Q3 | January - March | Jan 2026 - Mar 2026 |
| Q4 | April - June | Apr 2026 - Jun 2026 |

```typescript
@Injectable()
export class FYService {
  /**
   * Get FY number for a date
   * @example getFYFromDate(new Date('2025-07-01')) // Returns 2026
   */
  getFYFromDate(date: Date): number;

  /**
   * Get BAS quarter for a date
   * @example getQuarterFromDate(new Date('2025-08-15')) // Returns 'Q1'
   */
  getQuarterFromDate(date: Date): AustralianQuarter;

  /**
   * Get complete FY info including labels
   * @returns { financialYear, quarter, fyLabel, quarterLabel }
   */
  getFYInfo(date: Date): FYInfo;

  /**
   * Get date range for a specific quarter
   * @example getQuarterDateRange('Q1', 2026) // Jul 1 2025 - Sep 30 2025
   */
  getQuarterDateRange(quarter: AustralianQuarter, financialYear: number): QuarterDateRange;
}
```

**Usage Example:**

```typescript
// Get FY info for a transaction date
const fyInfo = fyService.getFYInfo(expense.date);
// { financialYear: 2026, quarter: 'Q1', fyLabel: 'FY2026', quarterLabel: 'Q1 FY2026' }
```

---

## ImportJob Module (CSV Import Tracking)

The ImportJob module tracks CSV import batches for expenses, enabling rollback functionality and import history.

### Module Architecture

```
modules/import-jobs/
├── dto/
│   ├── create-import-job.dto.ts
│   ├── update-import-job.dto.ts
│   └── index.ts
├── entities/
│   ├── import-job.entity.ts
│   └── index.ts
├── import-jobs.controller.ts
├── import-jobs.service.ts
├── import-jobs.service.spec.ts
├── import-jobs.module.ts
└── index.ts
```

### ImportJob Entity

```typescript
interface ImportJob {
  id: string; // UUID
  filename: string; // Original CSV filename
  source: ImportSource; // Bank source (commbank, nab, westpac, anz, manual, other)
  status: ImportStatus; // pending, completed, rolled_back, failed
  totalRows: number; // Total rows in CSV
  importedCount: number; // Successfully imported
  skippedCount: number; // Duplicates skipped
  errorCount: number; // Failed rows
  completedAt?: Date; // When import finished
  errorMessage?: string; // Error details if failed
  createdAt: Date;
  updatedAt: Date;
}
```

### Bank Sources

| Source     | Description                             |
| ---------- | --------------------------------------- |
| `commbank` | Commonwealth Bank of Australia          |
| `nab`      | National Australia Bank                 |
| `westpac`  | Westpac Banking Corporation             |
| `anz`      | Australia and New Zealand Banking Group |
| `manual`   | Custom/manual CSV format                |
| `other`    | Other bank or source                    |

### Import Status Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PENDING   │ ──► │  COMPLETED  │ ──► │ ROLLED_BACK │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     (can rollback)
│   FAILED    │
└─────────────┘
```

### Rollback Functionality

Rollback performs a **hard delete** of all expenses associated with an import job:

```typescript
// Service method
async rollback(id: string): Promise<{ deletedCount: number }>

// What happens:
// 1. Delete all expenses WHERE import_job_id = id
// 2. Set import job status to ROLLED_BACK
// 3. Return count of deleted expenses
```

**Why hard delete?**

- This is a personal tool - if you rollback, you can re-import the CSV
- Keeps the database clean without orphan data
- Simpler than soft delete with `deleted_at` tracking

### Expense Relationship

Expenses have an optional `importJobId` field:

```typescript
// In Expense entity
@Column({ name: 'import_job_id', type: 'uuid', nullable: true })
importJobId?: string | null;
```

- `null` = Manually created expense
- UUID = Created via CSV import

### API Endpoints

| Method | Endpoint                      | Description                             |
| ------ | ----------------------------- | --------------------------------------- |
| POST   | `/import-jobs`                | Create new import job                   |
| GET    | `/import-jobs`                | List all import jobs (paginated)        |
| GET    | `/import-jobs/:id`            | Get single import job                   |
| GET    | `/import-jobs/:id/expenses`   | Get import job with expenses            |
| GET    | `/import-jobs/:id/statistics` | Get import statistics                   |
| PATCH  | `/import-jobs/:id`            | Update import job                       |
| POST   | `/import-jobs/:id/rollback`   | Rollback import (delete expenses)       |
| DELETE | `/import-jobs/:id`            | Delete import job (only if no expenses) |

---

## Error Handling

The application uses a global exception filter to standardize all error responses.

### Architecture

```
src/common/filters/
├── all-exceptions.filter.ts       # Global exception filter
├── all-exceptions.filter.spec.ts  # 26 comprehensive tests
└── index.ts                       # Barrel export
```

### Error Response Format

All errors return a consistent JSON structure:

```typescript
interface ErrorResponse {
  statusCode: number; // HTTP status code (400, 404, 500, etc.)
  message: string; // Human-readable error message
  error: string; // HTTP status text (e.g., "Bad Request")
  timestamp: string; // ISO 8601 timestamp
  path: string; // Request URL path
}
```

### Hybrid Error Strategy

| Error Type              | Behavior                               | Rationale                        |
| ----------------------- | -------------------------------------- | -------------------------------- |
| **4xx (Client Errors)** | Preserve NestJS detailed messages      | Helps debugging, safe to expose  |
| **5xx (Server Errors)** | Generic "An unexpected error occurred" | Security: hides internal details |

### Examples

**400 Bad Request** (validation error):

```json
{
  "statusCode": 400,
  "message": ["amountCents must be a positive number"],
  "error": "Bad Request",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/expenses"
}
```

**404 Not Found**:

```json
{
  "statusCode": 404,
  "message": "Provider with ID 999 not found",
  "error": "Not Found",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/providers/999"
}
```

**500 Internal Server Error** (client sees generic message):

```json
{
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "error": "Internal Server Error",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/bas/Q1/2025"
}
```

### Logging Strategy

| Status Code | Log Level | Details Logged                      |
| ----------- | --------- | ----------------------------------- |
| 4xx         | WARN      | Request path + error message        |
| 5xx         | ERROR     | Full stack trace (server-side only) |

**Security Principle:** Stack traces are **never** sent to the client. Internal error messages for 5xx errors are only logged server-side.

### Registration

The filter is registered globally in `main.ts`:

```typescript
import { AllExceptionsFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  // ...
}
```

---

## API Documentation (Swagger/OpenAPI)

Interactive API documentation is available via Swagger UI.

### Access

| Environment | URL                            |
| ----------- | ------------------------------ |
| Development | http://localhost:3000/api/docs |

### Configuration

Swagger is configured in `main.ts`:

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('EasyTax-AU API')
  .setDescription('Local-first tax management API for Australian sole traders')
  .setVersion('1.0')
  .addTag('categories', 'Expense categories')
  .addTag('providers', 'Expense providers with GST rules')
  .addTag('clients', 'Income clients (encrypted)')
  .addTag('expenses', 'Business expenses with GST tracking')
  .addTag('incomes', 'Business income/invoices')
  .addTag('bas', 'BAS reporting')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Available Endpoints

| Tag        | Endpoints                              | Description                   |
| ---------- | -------------------------------------- | ----------------------------- |
| categories | CRUD `/categories`                     | Expense categorization        |
| providers  | CRUD `/providers`                      | Vendor management             |
| clients    | CRUD `/clients`                        | Client management (encrypted) |
| expenses   | CRUD `/expenses`                       | Expense tracking              |
| incomes    | CRUD `/incomes`, `/incomes/:id/paid`   | Income/invoice tracking       |
| bas        | `/bas/:quarter/:year`, `/bas/quarters` | BAS reporting                 |

### Decorators Used

- `@ApiTags()` - Groups endpoints by resource
- `@ApiOperation()` - Describes endpoint purpose
- `@ApiProperty()` / `@ApiPropertyOptional()` - Documents DTO fields
- `@ApiOkResponse()` / `@ApiCreatedResponse()` - Documents success responses
- `@ApiNotFoundResponse()` / `@ApiBadRequestResponse()` - Documents error responses
- `@ApiParam()` / `@ApiQuery()` - Documents path and query parameters

---

## Docker Deployment

### Container Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Network                         │
│              easytax-au-network (bridge)                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌─────────────────┐      ┌─────────────────────────┐  │
│   │  easytax-au-db  │      │    easytax-au-api       │  │
│   │ ─────────────── │      │ ─────────────────────── │  │
│   │ postgres:15     │◄────►│ node:22-alpine          │  │
│   │ alpine          │      │ Multi-stage build       │  │
│   │                 │      │                         │  │
│   │ Port: 5432      │      │ Port: 3000              │  │
│   │ Health: pg_ready│      │ Health: wget /          │  │
│   └─────────────────┘      └─────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Dockerfile (Multi-Stage Build)

The API uses a 3-stage build for minimal image size:

1. **deps** - Install all dependencies including devDependencies
2. **builder** - Compile TypeScript, then prune to production deps
3. **production** - Minimal runtime with only compiled JS + prod deps

**Features:**

- Non-root user (`nestjs:nodejs`) for security
- Health check via wget
- ~200MB final image (vs ~1GB single-stage)

### Running the Stack

```bash
# Development: DB container + local API
docker compose up -d easytax-au-db
pnpm run start:dev

# Production: Full containerized stack
DB_PASSWORD=xxx ENCRYPTION_KEY=xxx docker compose up -d

# View container status
docker ps --filter "name=easytax-au"

# View API logs
docker compose logs -f easytax-au-api
```

### Environment Variables

| Variable         | Required | Default     | Description                             |
| ---------------- | -------- | ----------- | --------------------------------------- |
| `DB_PASSWORD`    | Yes      | -           | PostgreSQL password                     |
| `ENCRYPTION_KEY` | Yes      | -           | 64 hex chars (32 bytes) for AES-256-GCM |
| `DB_HOST`        | No       | localhost   | Auto-set to `easytax-au-db` in Docker   |
| `DB_PORT`        | No       | 5432        | PostgreSQL port                         |
| `DB_NAME`        | No       | easytax-au  | Database name                           |
| `DB_USERNAME`    | No       | postgres    | Database user                           |
| `PORT`           | No       | 3000        | API server port                         |
| `NODE_ENV`       | No       | development | Environment mode                        |

**Note:** `ENCRYPTION_KEY` is validated at startup. The app will fail to start if it's missing or not exactly 64 hexadecimal characters. Generate one with `openssl rand -hex 32`.
