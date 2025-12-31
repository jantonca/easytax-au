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

| Environment | URL                         |
| ----------- | --------------------------- |
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

| Tag        | Endpoints                               | Description                  |
| ---------- | --------------------------------------- | ---------------------------- |
| categories | CRUD `/categories`                      | Expense categorization       |
| providers  | CRUD `/providers`                       | Vendor management            |
| clients    | CRUD `/clients`                         | Client management (encrypted)|
| expenses   | CRUD `/expenses`                        | Expense tracking             |
| incomes    | CRUD `/incomes`, `/incomes/:id/paid`    | Income/invoice tracking      |
| bas        | `/bas/:quarter/:year`, `/bas/quarters`  | BAS reporting                |

### Decorators Used

- `@ApiTags()` - Groups endpoints by resource
- `@ApiOperation()` - Describes endpoint purpose
- `@ApiProperty()` / `@ApiPropertyOptional()` - Documents DTO fields
- `@ApiOkResponse()` / `@ApiCreatedResponse()` - Documents success responses
- `@ApiNotFoundResponse()` / `@ApiBadRequestResponse()` - Documents error responses
- `@ApiParam()` / `@ApiQuery()` - Documents path and query parameters
