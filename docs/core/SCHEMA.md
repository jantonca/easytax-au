# Database Schema

## Overview

All monetary values are stored as **integers in cents** to avoid floating-point errors.
Sensitive fields use **AES-256-GCM encryption** via TypeORM column transformers.

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
┌─────────────────┐                     ┌─────────────────┐
│    Providers    │                     │    Expenses     │
├─────────────────┤                     ├─────────────────┤
│ id (PK)         │◄────────────────────│ provider_id(FK) │
│ name            │                     │ category_id(FK) │──┘
│ is_international│                     │ id (PK)         │
│ default_cat_id  │──┘                  │ date            │
│ abn_arn         │                     │ description 🔒  │
└─────────────────┘                     │ amount_cents    │
                                        │ gst_cents       │
                                        │ biz_percent     │
┌─────────────────┐                     │ currency        │
│     Clients     │                     │ file_ref        │
├─────────────────┤                     │ created_at      │
│ id (PK)         │◄────────┐           │ updated_at      │
│ name 🔒         │         │           └─────────────────┘
│ abn 🔒          │         │
│ is_psi_eligible │         │
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
                  │ created_at      │
                  │ updated_at      │
                  └─────────────────┘

🔒 = AES-256-GCM Encrypted Column
```

---

## Table Definitions

### Categories

Maps expense types to ATO BAS labels.

| Column          | Type         | Nullable | Description                         |
| --------------- | ------------ | -------- | ----------------------------------- |
| `id`            | UUID         | No       | Primary key                         |
| `name`          | VARCHAR(100) | No       | e.g., "Software", "Internet", "VPN" |
| `bas_label`     | VARCHAR(10)  | No       | ATO label: "1B", "G10", etc.        |
| `is_deductible` | BOOLEAN      | No       | Can this be claimed? Default: true  |
| `description`   | TEXT         | Yes      | Optional notes                      |
| `created_at`    | TIMESTAMP    | No       | Auto-set                            |
| `updated_at`    | TIMESTAMP    | No       | Auto-updated                        |

**Seed Data:**

```
| name       | bas_label | is_deductible |
|------------|-----------|---------------|
| Software   | 1B        | true          |
| Hosting    | 1B        | true          |
| Internet   | 1B        | true          |
| VPN        | 1B        | true          |
| Hardware   | 1B        | true          |
| Office     | 1B        | true          |
```

---

### Providers

Vendors you pay for business expenses.

| Column                | Type         | Nullable | Description                |
| --------------------- | ------------ | -------- | -------------------------- |
| `id`                  | UUID         | No       | Primary key                |
| `name`                | VARCHAR(100) | No       | e.g., "GitHub", "VentraIP" |
| `is_international`    | BOOLEAN      | No       | true = GST-Free            |
| `default_category_id` | UUID (FK)    | Yes      | Auto-assigns category      |
| `abn_arn`             | VARCHAR(20)  | Yes      | Australian Business Number |
| `created_at`          | TIMESTAMP    | No       | Auto-set                   |
| `updated_at`          | TIMESTAMP    | No       | Auto-updated               |

**Seed Data:**

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

| Column            | Type         | Nullable | Encrypted  | Description                    |
| ----------------- | ------------ | -------- | ---------- | ------------------------------ |
| `id`              | UUID         | No       | No         | Primary key                    |
| `name`            | VARCHAR(255) | No       | **Yes** 🔒 | Client name                    |
| `abn`             | VARCHAR(20)  | Yes      | **Yes** 🔒 | Their ABN                      |
| `is_psi_eligible` | BOOLEAN      | No       | No         | Personal Services Income rules |
| `created_at`      | TIMESTAMP    | No       | No         | Auto-set                       |
| `updated_at`      | TIMESTAMP    | No       | No         | Auto-updated                   |

---

### Expenses

Core ledger for business purchases.

| Column         | Type         | Nullable | Encrypted  | Description            |
| -------------- | ------------ | -------- | ---------- | ---------------------- |
| `id`           | UUID         | No       | No         | Primary key            |
| `date`         | DATE         | No       | No         | Transaction date       |
| `description`  | VARCHAR(500) | Yes      | **Yes** 🔒 | What was purchased     |
| `amount_cents` | INTEGER      | No       | No         | Total amount in cents  |
| `gst_cents`    | INTEGER      | No       | No         | GST component in cents |
| `biz_percent`  | INTEGER      | No       | No         | Business use % (1-100) |
| `provider_id`  | UUID (FK)    | No       | No         | Links to Provider      |
| `category_id`  | UUID (FK)    | No       | No         | Links to Category      |
| `currency`     | VARCHAR(3)   | No       | No         | Default: "AUD"         |
| `file_ref`     | VARCHAR(255) | Yes      | No         | Receipt filename       |
| `created_at`   | TIMESTAMP    | No       | No         | Auto-set               |
| `updated_at`   | TIMESTAMP    | No       | No         | Auto-updated           |

**Calculated Fields (in service layer):**

- `claimable_gst = gst_cents * (biz_percent / 100)`
- `net_amount = amount_cents - gst_cents`

---

### Incomes

Revenue from freelance work.

| Column           | Type         | Nullable | Encrypted  | Description         |
| ---------------- | ------------ | -------- | ---------- | ------------------- |
| `id`             | UUID         | No       | No         | Primary key         |
| `date`           | DATE         | No       | No         | Invoice date        |
| `client_id`      | UUID (FK)    | No       | No         | Links to Client     |
| `invoice_num`    | VARCHAR(50)  | Yes      | No         | Your invoice number |
| `description`    | VARCHAR(500) | Yes      | **Yes** 🔒 | Work description    |
| `subtotal_cents` | INTEGER      | No       | No         | Amount before GST   |
| `gst_cents`      | INTEGER      | No       | No         | GST collected       |
| `total_cents`    | INTEGER      | No       | No         | subtotal + gst      |
| `is_paid`        | BOOLEAN      | No       | No         | Payment received?   |
| `created_at`     | TIMESTAMP    | No       | No         | Auto-set            |
| `updated_at`     | TIMESTAMP    | No       | No         | Auto-updated        |

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

## Recurring Expenses

Templates for automatically generating regular expenses.

| Column                | Type         | Nullable | Encrypted  | Description                   |
| --------------------- | ------------ | -------- | ---------- | ----------------------------- |
| `id`                  | UUID         | No       | No         | Primary key                   |
| `name`                | VARCHAR(100) | No       | No         | Template name (e.g., "iinet") |
| `description`         | TEXT         | Yes      | **Yes** 🔒 | Description for expenses      |
| `amount_cents`        | INTEGER      | No       | No         | Amount in cents               |
| `gst_cents`           | INTEGER      | No       | No         | GST in cents (0 if intl)      |
| `biz_percent`         | INTEGER      | No       | No         | Business use % (0-100)        |
| `currency`            | VARCHAR(3)   | No       | No         | Default: "AUD"                |
| `schedule`            | ENUM         | No       | No         | monthly/quarterly/yearly      |
| `day_of_month`        | INTEGER      | No       | No         | Day to generate (1-28)        |
| `start_date`          | DATE         | No       | No         | When to start generating      |
| `end_date`            | DATE         | Yes      | No         | When to stop generating       |
| `is_active`           | BOOLEAN      | No       | No         | Can pause/resume              |
| `last_generated_date` | DATE         | Yes      | No         | Last expense created          |
| `next_due_date`       | DATE         | No       | No         | Next generation date          |
| `provider_id`         | UUID (FK)    | No       | No         | Links to Provider             |
| `category_id`         | UUID (FK)    | No       | No         | Links to Category             |
| `created_at`          | TIMESTAMP    | No       | No         | Auto-set                      |
| `updated_at`          | TIMESTAMP    | No       | No         | Auto-updated                  |

---

## Constraints

```sql
-- Ensure valid percentages
ALTER TABLE expenses ADD CONSTRAINT chk_biz_percent
  CHECK (biz_percent >= 0 AND biz_percent <= 100);

-- Ensure positive amounts
ALTER TABLE expenses ADD CONSTRAINT chk_amount_positive
  CHECK (amount_cents >= 0);
ALTER TABLE expenses ADD CONSTRAINT chk_gst_positive
  CHECK (gst_cents >= 0);

-- GST cannot exceed amount
ALTER TABLE expenses ADD CONSTRAINT chk_gst_lte_amount
  CHECK (gst_cents <= amount_cents);
```

---

## BAS Query Examples

### Label 1B - GST Paid (Claimable Credits)

```sql
SELECT
  SUM(
    CASE
      WHEN p.is_international = false
      THEN e.gst_cents * e.biz_percent / 100
      ELSE 0
    END
  ) AS gst_credits_cents
FROM expenses e
JOIN providers p ON e.provider_id = p.id
WHERE e.date BETWEEN '2024-07-01' AND '2024-09-30';  -- Q1 FY2025
```

### Label G1 & 1A - Sales & GST Collected

```sql
SELECT
  SUM(total_cents) AS g1_total_sales_cents,
  SUM(gst_cents) AS label_1a_gst_collected_cents
FROM incomes
WHERE date BETWEEN '2024-07-01' AND '2024-09-30';  -- Q1 FY2025
```
