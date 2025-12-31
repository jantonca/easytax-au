# Architecture: Tax Intelligence

## Tech Stack

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

### Prerequisites

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
│  │  (references: providers, categories)            │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                              │
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
  calcGstFromTotal(totalCents: number): number

  /**
   * Add 10% GST to a subtotal
   * @param subtotalCents - Amount before GST in cents
   * @returns Total with GST in cents
   */
  addGst(subtotalCents: number): number

  /**
   * Apply business use percentage to GST
   * @param gstCents - Full GST amount in cents
   * @param bizPercent - Business use percentage (0-100)
   * @returns Claimable GST in cents
   */
  applyBizPercent(gstCents: number, bizPercent: number): number

  /**
   * Convert cents to display string
   * @param cents - Amount in cents
   * @returns Formatted string (e.g., "$110.00")
   */
  formatAud(cents: number): string
}
```

**Usage in Services:**

```typescript
// In expenses.service.ts
const claimableGst = this.moneyService.applyBizPercent(
  expense.gst_cents,
  expense.biz_percent
)
```
