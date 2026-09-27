# Database Schema

## Overview

All monetary values are stored as **integers in cents** to avoid floating-point errors.
Sensitive fields use **AES-256-GCM encryption** via TypeORM column transformers.

**Source of truth:** the migrations in `src/migrations/`, which are
`1781938771544-InitialSchema` and `1789113727162-AddIncomePaymentDate`.
`synchronize` is off, so the entities only describe the schema. This document
summarises it (verified against the migrations 2026-09-27). If the two
disagree, the migrations win.

Every table has `id` (UUID, `uuid_generate_v4()`), `created_at` and
`updated_at` (`TIMESTAMP WITH TIME ZONE`, default `now()`).

---

## Entity Relationship Diagram

```
┌─────────────────┐
│   Categories    │
├─────────────────┤
│ id (PK)         │
│ name            │
│ bas_label       │◄──────────────────────────────┐
│ is_deductible   │                               │
│ description     │                               │
└─────────────────┘                               │
        ▲                                         │
        │ default_category_id (FK)                │
        │                                         │
┌─────────────────┐                     ┌─────────────────┐     ┌─────────────────┐
│    Providers    │                     │    Expenses     │     │   Import Jobs   │
├─────────────────┤                     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────────────────────│ provider_id(FK) │     │ id (PK)         │
│ name            │                     │ category_id(FK) │──┘  │ filename        │
│ is_international│                     │ import_job_id   │────►│ source / status │
│ default_cat_id  │──┘                  │ id (PK)         │     │ row counters    │
│ abn_arn         │                     │ date            │     └─────────────────┘
└─────────────────┘                     │ description 🔒  │
                                        │ amount_cents    │
                                        │ gst_cents       │
┌─────────────────┐                     │ biz_percent     │
│     Clients     │                     │ currency        │
├─────────────────┤                     │ file_ref        │
│ id (PK)         │◄────────┐           └─────────────────┘
│ name 🔒         │         │
│ abn 🔒          │         │           Recurring Expenses → Providers,
│ is_psi_eligible │         │           Categories (templates; see below)
└─────────────────┘         │
                            │
                  ┌─────────────────┐
                  │     Incomes     │
                  ├─────────────────┤
                  │ id (PK)         │
                  │ client_id (FK)  │──┘
                  │ date            │
                  │ invoice_num     │
                  │ description 🔒  │
                  │ subtotal_cents  │
                  │ gst_cents       │
                  │ total_cents     │
                  │ is_paid         │
                  │ payment_date    │
                  └─────────────────┘

🔒 = AES-256-GCM Encrypted Column
```

---

## Table Definitions

`created_at`/`updated_at` are omitted from the tables below; see Overview.

### Categories

Maps expense types to ATO BAS labels.

| Column          | Type         | Nullable | Description                         |
| --------------- | ------------ | -------- | ----------------------------------- |
| `id`            | UUID         | No       | Primary key                         |
| `name`          | VARCHAR(100) | No       | e.g., "Software", "Internet", "VPN" |
| `bas_label`     | VARCHAR(10)  | No       | ATO label: "1B", "G10", etc.        |
| `is_deductible` | BOOLEAN      | No       | Default: true                       |
| `description`   | TEXT         | Yes      | Optional notes                      |

**Seed data:** `src/modules/categories/categories.seeder.ts` creates 14 default
categories. Twelve operating categories are labelled `1B`, `Capital Purchases`
is `G10`, and `Non-Deductible` is `N/A`. The seeder only runs on an empty
table.

> Known issue (T08, `NEXT-TASKS.md`): `ATO-LOGIC.md` maps operating categories
> to **G11**, but the seeder labels them `1B`, so they are excluded from the
> G11 total.

---

### Providers

Vendors you pay for business expenses.

| Column                | Type         | Nullable | Description                              |
| --------------------- | ------------ | -------- | ---------------------------------------- |
| `id`                  | UUID         | No       | Primary key                              |
| `name`                | VARCHAR(100) | No       | e.g., "GitHub", "VentraIP"               |
| `is_international`    | BOOLEAN      | No       | true = no claimable GST. Default: false  |
| `default_category_id` | UUID (FK)    | Yes      | → categories, `ON DELETE SET NULL`       |
| `abn_arn`             | VARCHAR(20)  | Yes      | Australian Business / Registered Number  |

**Seed Data** (`src/modules/providers/providers.seeder.ts`):

```
| name              | is_international | category    |
|-------------------|------------------|-------------|
| VentraIP          | false            | Hosting     |
| iinet             | false            | Internet    |
| GitHub            | true             | Software    |
| Warp              | true             | Software    |
| Bytedance (Trae)  | true             | Software    |
| NordVPN           | true             | VPN         |
| Google Workspace  | true             | Software    |
| JetBrains         | true             | Software    |
| Apple (App Store) | true             | Software    |
| Amazon AWS        | true             | Hosting     |
```

---

### Clients

People/companies who pay you (for freelance income).

| Column            | Type    | Nullable | Encrypted  | Description                    |
| ----------------- | ------- | -------- | ---------- | ------------------------------ |
| `id`              | UUID    | No       | No         | Primary key                    |
| `name`            | TEXT    | No       | **Yes** 🔒 | Client name                    |
| `abn`             | TEXT    | Yes      | **Yes** 🔒 | Their ABN                      |
| `is_psi_eligible` | BOOLEAN | No       | No         | Default: false. Not yet used by reports |

---

### Expenses

Core ledger for business purchases.

| Column          | Type         | Nullable | Encrypted  | Description                                 |
| --------------- | ------------ | -------- | ---------- | ------------------------------------------- |
| `id`            | UUID         | No       | No         | Primary key                                 |
| `date`          | DATE         | No       | No         | Transaction date                            |
| `description`   | TEXT         | Yes      | **Yes** 🔒 | What was purchased                          |
| `amount_cents`  | INTEGER      | No       | No         | Total amount in cents (GST-inclusive)       |
| `gst_cents`     | INTEGER      | No       | No         | GST component in cents                      |
| `biz_percent`   | INTEGER      | No       | No         | Business use %. Default: 100                |
| `currency`      | VARCHAR(3)   | No       | No         | Default: "AUD"                              |
| `file_ref`      | VARCHAR(255) | Yes      | No         | Receipt filename (reference only)           |
| `provider_id`   | UUID (FK)    | No       | No         | → providers, `ON DELETE RESTRICT`           |
| `category_id`   | UUID (FK)    | No       | No         | → categories, `ON DELETE RESTRICT`          |
| `import_job_id` | UUID (FK)    | Yes      | No         | → import_jobs, `ON DELETE SET NULL`; set by CSV import, used by rollback |

**Calculated at query time (BAS/reports):**

- claimable GST = `FLOOR(gst_cents * biz_percent / 100)`, domestic providers only
- `biz_percent` is **not** applied to `amount_cents` in any report (T01)

---

### Incomes

Revenue from freelance work.

| Column           | Type        | Nullable | Encrypted  | Description                                  |
| ---------------- | ----------- | -------- | ---------- | -------------------------------------------- |
| `id`             | UUID        | No       | No         | Primary key                                  |
| `date`           | DATE        | No       | No         | Invoice date                                 |
| `client_id`      | UUID (FK)   | No       | No         | → clients, `ON DELETE RESTRICT`              |
| `invoice_num`    | VARCHAR(50) | Yes      | No         | Your invoice number                          |
| `description`    | TEXT        | Yes      | **Yes** 🔒 | Work description                             |
| `subtotal_cents` | INTEGER     | No       | No         | Amount before GST                            |
| `gst_cents`      | INTEGER     | No       | No         | GST collected                                |
| `total_cents`    | INTEGER     | No       | No         | subtotal + gst                               |
| `is_paid`        | BOOLEAN     | No       | No         | Payment received? Default: false             |
| `payment_date`   | DATE        | Yes      | No         | Receipt date; drives CASH-basis BAS (see `CASH-BASIS-DESIGN.md`). Required by the API when `is_paid`; legacy paid rows may be NULL |

There is no `import_job_id` on incomes, so income imports cannot be rolled back
(N01, `NEXT-TASKS.md`).

---

### Import Jobs

One row per CSV import, used for tracking and rollback.

| Column           | Type         | Nullable | Description                                                    |
| ---------------- | ------------ | -------- | -------------------------------------------------------------- |
| `id`             | UUID         | No       | Primary key                                                    |
| `filename`       | VARCHAR(255) | No       | Generated name (`import-<timestamp>.csv`)                      |
| `source`         | ENUM         | No       | `commbank`, `nab`, `westpac`, `anz`, `manual`, `other`. Default: `manual` |
| `status`         | ENUM         | No       | `pending`, `completed`, `rolled_back`, `failed`. Default: `pending` |
| `total_rows`     | INTEGER      | No       | Rows that survived parsing (not raw file rows). Default: 0     |
| `imported_count` | INTEGER      | No       | Default: 0                                                     |
| `skipped_count`  | INTEGER      | No       | Default: 0                                                     |
| `error_count`    | INTEGER      | No       | Default: 0                                                     |
| `completed_at`   | TIMESTAMPTZ  | Yes      | When processing or rollback finished                           |
| `error_message`  | TEXT         | Yes      | Failure detail                                                 |

Dry runs create no import job.

---

### Recurring Expenses

Templates for generating regular expenses (generation is triggered manually via
`POST /recurring-expenses/generate`).

| Column                | Type         | Nullable | Encrypted  | Description                   |
| --------------------- | ------------ | -------- | ---------- | ----------------------------- |
| `id`                  | UUID         | No       | No         | Primary key                   |
| `name`                | VARCHAR(100) | No       | No         | Template name (e.g., "iinet") |
| `description`         | TEXT         | Yes      | **Yes** 🔒 | Description for expenses      |
| `amount_cents`        | INTEGER      | No       | No         | Amount in cents               |
| `gst_cents`           | INTEGER      | No       | No         | GST in cents (0 if intl)      |
| `biz_percent`         | INTEGER      | No       | No         | Business use %. Default: 100  |
| `currency`            | VARCHAR(3)   | No       | No         | Default: "AUD"                |
| `schedule`            | ENUM         | No       | No         | `monthly`, `quarterly`, `yearly`. Default: `monthly` |
| `day_of_month`        | INTEGER      | No       | No         | Day to generate. Default: 1   |
| `start_date`          | DATE         | No       | No         | When to start generating      |
| `end_date`            | DATE         | Yes      | No         | When to stop generating       |
| `is_active`           | BOOLEAN      | No       | No         | Can pause/resume              |
| `last_generated_date` | DATE         | Yes      | No         | Last expense created          |
| `next_due_date`       | DATE         | No       | No         | Next generation date          |
| `provider_id`         | UUID (FK)    | No       | No         | → providers, `ON DELETE RESTRICT` |
| `category_id`         | UUID (FK)    | No       | No         | → categories, `ON DELETE RESTRICT` |

Generated expenses carry no reference back to their template (see I01).

---

## Indexes

```sql
-- Fast lookups for BAS reporting
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_provider ON expenses(provider_id);
CREATE INDEX idx_expenses_import_job ON expenses(import_job_id);
CREATE INDEX idx_incomes_date ON incomes(date);
CREATE INDEX idx_incomes_client ON incomes(client_id);
CREATE INDEX idx_incomes_is_paid ON incomes(is_paid);
CREATE INDEX idx_incomes_payment_date ON incomes(payment_date);  -- AddIncomePaymentDate

-- Provider lookups
CREATE INDEX idx_providers_international ON providers(is_international);

-- Import job lookups
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_created ON import_jobs(created_at);

-- Recurring expense lookups
CREATE INDEX idx_recurring_expenses_provider ON recurring_expenses(provider_id);
CREATE INDEX idx_recurring_expenses_category ON recurring_expenses(category_id);
CREATE INDEX idx_recurring_expenses_active ON recurring_expenses(is_active);
CREATE INDEX idx_recurring_expenses_next_due ON recurring_expenses(next_due_date);
```

---

## Constraints

**The database has no CHECK constraints.** Only primary keys, NOT NULL and
the foreign keys listed above exist. These rules are enforced only by DTO
validation and service code, never by the database:

- valid ranges for `biz_percent`;
- non-negative amounts;
- GST no greater than the amount;
- receipt-date rules.

Anything that bypasses the service layer is unchecked. This includes CSV
import paths that build entities directly (for example N03: a non-numeric
business-use value parses to `NaN`).

---

## BAS Query Examples

These mirror `src/modules/bas/bas.service.ts`. The code is authoritative.

### Label 1B - GST Paid (Claimable Credits)

```sql
SELECT COALESCE(SUM(FLOOR(e.gst_cents * e.biz_percent / 100)), 0) AS gst_credits_cents
FROM expenses e
JOIN providers p ON e.provider_id = p.id
WHERE p.is_international = false
  AND e.date BETWEEN '2025-07-01' AND '2025-09-30';  -- Q1 FY2026
```

### Label G1 & 1A - Sales & GST Collected

```sql
-- ACCRUAL: attributed by invoice date
SELECT SUM(total_cents) AS g1_total_sales_cents,
       SUM(gst_cents)   AS label_1a_gst_collected_cents
FROM incomes
WHERE date BETWEEN '2025-07-01' AND '2025-09-30';

-- CASH: paid incomes attributed by receipt date; paid rows with
-- payment_date IS NULL are reported separately as unreconciled
SELECT SUM(total_cents), SUM(gst_cents)
FROM incomes
WHERE is_paid = true
  AND payment_date BETWEEN '2025-07-01' AND '2025-09-30';
```
