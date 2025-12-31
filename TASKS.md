# Development Tasks: EasyTax-AU

## How to Use This File

Each task follows a **Documentation → Code → Test → Review** workflow.

**Status Legend:**

- ⬜ Not started
- 🟡 In progress
- ✅ Complete
- ⏸️ Blocked

---

## Phase 1: Project Foundation

### 1.1 Project Scaffold

| #     | Task                                                  | Status |
| ----- | ----------------------------------------------------- | ------ |
| 1.1.1 | Initialize NestJS project with TypeScript strict mode | ⬜     |
| 1.1.2 | Configure ESLint with strict TypeScript rules         | ⬜     |
| 1.1.3 | Configure Prettier with project standards             | ⬜     |
| 1.1.4 | Configure TypeORM with PostgreSQL                     | ⬜     |
| 1.1.5 | Set up Docker Compose (API + DB)                      | ⬜     |
| 1.1.6 | Create `.env.example` with all required variables     | ⬜     |
| 1.1.7 | Verify `docker compose up` starts cleanly             | ⬜     |

**Documentation Required:**

- [ ] Update README.md with installation steps
- [ ] Document environment variables in `.env.example`
- [ ] Document ESLint/Prettier rules in ARCHITECTURE.md

**Tests Required:**

- [ ] Health check endpoint returns 200
- [ ] Database connection successful
- [ ] ESLint passes with no errors
- [ ] Prettier check passes

**Definition of Done:**

- [ ] `pnpm run start:dev` works
- [ ] `docker compose up` works
- [ ] No TypeScript errors
- [ ] README has working quick-start guide

---

### 1.2 Common Module (Encryption + Utilities)

| #     | Task                                                | Status |
| ----- | --------------------------------------------------- | ------ |
| 1.2.1 | Create `EncryptedColumnTransformer` (AES-256-GCM)   | ⬜     |
| 1.2.2 | Create `MoneyService` for GST/currency calculations | ⬜     |
| 1.2.3 | Create base entity with `created_at`, `updated_at`  | ⬜     |
| 1.2.4 | Set up global validation pipe (class-validator)     | ⬜     |

**Documentation Required:**

- [ ] TSDoc for `EncryptedColumnTransformer` explaining usage
- [ ] TSDoc for `MoneyService` with all method signatures
- [ ] Add encryption details to SECURITY.md

**Tests Required:**

- [ ] Encryption: encrypt → decrypt returns original value
- [ ] Encryption: different IVs for same plaintext
- [ ] MoneyService: `calcGstFromTotal(11000)` returns `1000` (cents)
- [ ] MoneyService: `addGst(10000)` returns `11000` (cents)
- [ ] MoneyService: `applyBizPercent(1000, 50)` returns `500` (cents)
- [ ] MoneyService: handles edge cases (0, rounding)

**Definition of Done:**

- [ ] Transformers work in isolation (unit tests pass)
- [ ] No `any` types
- [ ] TSDoc comments on all exported functions

---

## Phase 2: Core Entities (CRUD)

### 2.1 Categories Module

| #     | Task                                              | Status |
| ----- | ------------------------------------------------- | ------ |
| 2.1.1 | Create `Category` entity matching SCHEMA.md       | ⬜     |
| 2.1.2 | Create `CreateCategoryDto` with validation        | ⬜     |
| 2.1.3 | Create `UpdateCategoryDto` (partial)              | ⬜     |
| 2.1.4 | Implement `CategoriesService` (CRUD)              | ⬜     |
| 2.1.5 | Implement `CategoriesController` (REST endpoints) | ⬜     |
| 2.1.6 | Create seed data for default categories           | ⬜     |

**Documentation Required:**

- [ ] TSDoc for all DTO properties
- [ ] TSDoc for service methods
- [ ] Swagger decorators on controller

**Tests Required:**

- [ ] Service: create category
- [ ] Service: find all categories
- [ ] Service: find one by ID (success + not found)
- [ ] Service: update category
- [ ] Service: delete category
- [ ] DTO: validation rejects invalid `bas_label`
- [ ] DTO: validation rejects empty `name`

**Definition of Done:**

- [ ] All CRUD operations work via API
- [ ] Seed data populates on first run
- [ ] 80%+ test coverage on service

---

### 2.2 Providers Module

| #     | Task                                                  | Status |
| ----- | ----------------------------------------------------- | ------ |
| 2.2.1 | Create `Provider` entity with `is_international` flag | ⬜     |
| 2.2.2 | Create `CreateProviderDto` with validation            | ⬜     |
| 2.2.3 | Create `UpdateProviderDto` (partial)                  | ⬜     |
| 2.2.4 | Implement `ProvidersService` (CRUD)                   | ⬜     |
| 2.2.5 | Implement `ProvidersController` (REST endpoints)      | ⬜     |
| 2.2.6 | Create seed data (VentraIP, GitHub, iinet, etc.)      | ⬜     |

**Documentation Required:**

- [ ] TSDoc for all DTO properties
- [ ] Document `is_international` behavior in ARCHITECTURE.md
- [ ] Swagger decorators on controller

**Tests Required:**

- [ ] Service: create provider
- [ ] Service: find all providers
- [ ] Service: find one by ID
- [ ] Service: update provider
- [ ] Service: delete provider (cascade check)
- [ ] Service: find by `is_international = true`

**Definition of Done:**

- [ ] All CRUD operations work via API
- [ ] Seed includes 10+ common providers
- [ ] 80%+ test coverage on service

---

### 2.3 Clients Module

| #     | Task                                                | Status |
| ----- | --------------------------------------------------- | ------ |
| 2.3.1 | Create `Client` entity with encrypted `name`, `abn` | ⬜     |
| 2.3.2 | Create `CreateClientDto` with validation            | ⬜     |
| 2.3.3 | Create `UpdateClientDto` (partial)                  | ⬜     |
| 2.3.4 | Implement `ClientsService` (CRUD)                   | ⬜     |
| 2.3.5 | Implement `ClientsController` (REST endpoints)      | ⬜     |

**Documentation Required:**

- [ ] TSDoc for all DTO properties
- [ ] Note encrypted fields in SCHEMA.md
- [ ] Swagger decorators on controller

**Tests Required:**

- [ ] Service: create client (verify encryption)
- [ ] Service: find all clients (verify decryption)
- [ ] Service: find one by ID
- [ ] Service: update client
- [ ] Service: delete client (cascade check)
- [ ] Encryption: `name` and `abn` stored encrypted in DB

**Definition of Done:**

- [ ] All CRUD operations work via API
- [ ] Encrypted fields not readable in raw DB query
- [ ] 80%+ test coverage on service

---

### 2.4 Expenses Module

| #     | Task                                                  | Status |
| ----- | ----------------------------------------------------- | ------ |
| 2.4.1 | Create `Expense` entity with all fields per SCHEMA.md | ⬜     |
| 2.4.2 | Create `CreateExpenseDto` with validation             | ⬜     |
| 2.4.3 | Create `UpdateExpenseDto` (partial)                   | ⬜     |
| 2.4.4 | Implement `ExpensesService` (CRUD)                    | ⬜     |
| 2.4.5 | Add GST auto-calculation for international providers  | ⬜     |
| 2.4.6 | Add `biz_percent` validation (0-100)                  | ⬜     |
| 2.4.7 | Implement `ExpensesController` (REST endpoints)       | ⬜     |

**Documentation Required:**

- [ ] TSDoc for all DTO properties
- [ ] Document GST auto-calc logic in ARCHITECTURE.md
- [ ] Swagger decorators on controller

**Tests Required:**

- [ ] Service: create expense with domestic provider → GST calculated
- [ ] Service: create expense with international provider → GST = 0
- [ ] Service: create expense with 50% biz_percent
- [ ] Service: reject biz_percent > 100
- [ ] Service: reject biz_percent < 0
- [ ] Service: reject gst_cents > amount_cents
- [ ] Service: find expenses by date range
- [ ] Service: find expenses by category

**Definition of Done:**

- [ ] All CRUD operations work via API
- [ ] GST auto-sets to 0 for international providers
- [ ] biz_percent constraints enforced
- [ ] 80%+ test coverage on service

---

### 2.5 Incomes Module

| #     | Task                                                 | Status |
| ----- | ---------------------------------------------------- | ------ |
| 2.5.1 | Create `Income` entity with all fields per SCHEMA.md | ⬜     |
| 2.5.2 | Create `CreateIncomeDto` with validation             | ⬜     |
| 2.5.3 | Create `UpdateIncomeDto` (partial)                   | ⬜     |
| 2.5.4 | Implement `IncomesService` (CRUD)                    | ⬜     |
| 2.5.5 | Add `total_cents` auto-calculation (subtotal + gst)  | ⬜     |
| 2.5.6 | Implement `IncomesController` (REST endpoints)       | ⬜     |

**Documentation Required:**

- [ ] TSDoc for all DTO properties
- [ ] Document total calculation in ARCHITECTURE.md
- [ ] Swagger decorators on controller

**Tests Required:**

- [ ] Service: create income → total = subtotal + gst
- [ ] Service: find incomes by client
- [ ] Service: find incomes by date range
- [ ] Service: find paid vs unpaid incomes
- [ ] Service: update income (recalculate total)

**Definition of Done:**

- [ ] All CRUD operations work via API
- [ ] `total_cents` always equals `subtotal_cents + gst_cents`
- [ ] 80%+ test coverage on service

---

## Phase 3: BAS Reporting

### 3.1 BAS Module

| #     | Task                                                  | Status |
| ----- | ----------------------------------------------------- | ------ |
| 3.1.1 | Create `BasSummaryDto` response type                  | ⬜     |
| 3.1.2 | Implement `BasService` with repository injection      | ⬜     |
| 3.1.3 | Implement G1 calculation (total sales)                | ⬜     |
| 3.1.4 | Implement 1A calculation (GST collected)              | ⬜     |
| 3.1.5 | Implement 1B calculation (GST paid, with biz_percent) | ⬜     |
| 3.1.6 | Implement `BasController` (GET /bas/:quarter/:year)   | ⬜     |

**Documentation Required:**

- [ ] TSDoc for `BasSummaryDto` explaining each field
- [ ] Document BAS calculation formulas in ARCHITECTURE.md
- [ ] Swagger decorators on controller

**Tests Required:**

- [ ] G1: sums all income totals for quarter
- [ ] 1A: sums all income GST for quarter
- [ ] 1B: sums expense GST × biz_percent for domestic only
- [ ] 1B: excludes international provider expenses
- [ ] Quarter boundary: Q1 = Jul-Sep, Q2 = Oct-Dec, etc.
- [ ] Empty quarter returns zeros (not null/error)

**Definition of Done:**

- [ ] GET `/bas/Q1/2025` returns correct G1, 1A, 1B
- [ ] No circular dependencies (uses repositories, not services)
- [ ] 90%+ test coverage (this is critical business logic)

---

## Phase 4: Integration & Polish

### 4.1 API Documentation

| #     | Task                                      | Status |
| ----- | ----------------------------------------- | ------ |
| 4.1.1 | Configure Swagger/OpenAPI                 | ⬜     |
| 4.1.2 | Add Swagger decorators to all controllers | ⬜     |
| 4.1.3 | Verify all endpoints documented           | ⬜     |

**Definition of Done:**

- [ ] `/api/docs` shows all endpoints
- [ ] Request/response schemas visible
- [ ] Can test endpoints from Swagger UI

---

### 4.2 Error Handling

| #     | Task                                 | Status |
| ----- | ------------------------------------ | ------ |
| 4.2.1 | Create global exception filter       | ⬜     |
| 4.2.2 | Standardize error response format    | ⬜     |
| 4.2.3 | Ensure no stack traces in production | ⬜     |

**Tests Required:**

- [ ] 404 returns standard error format
- [ ] Validation error returns field-level messages
- [ ] 500 does not expose internal details

---

### 4.3 Final Verification

| #     | Task                                      | Status |
| ----- | ----------------------------------------- | ------ |
| 4.3.1 | Run full test suite                       | ⬜     |
| 4.3.2 | Verify Docker Compose works from scratch  | ⬜     |
| 4.3.3 | Test with realistic data (mock, not real) | ⬜     |
| 4.3.4 | Verify encrypted fields in DB             | ⬜     |
| 4.3.5 | Check for console.logs in code            | ⬜     |
| 4.3.6 | Check for `any` types                     | ⬜     |
| 4.3.7 | Verify all promises have error handling   | ⬜     |

---

## Pre-Task Checklist (Before Starting Any Task)

- [ ] I understand the requirements
- [ ] I've read related documentation (SCHEMA.md, ARCHITECTURE.md)
- [ ] I know what tests I need to write
- [ ] I know what documentation to update

## Post-Task Checklist (Before Marking Complete)

- [ ] Code compiles with no errors
- [ ] All new code has TSDoc comments
- [ ] Unit tests written and passing
- [ ] No `any` types introduced
- [ ] No `console.log` statements
- [ ] Related documentation updated
- [ ] Commit message follows Conventional Commits

---

## Progress Tracker

| Phase            | Tasks  | Done  | Progress |
| ---------------- | ------ | ----- | -------- |
| 1. Foundation    | 9      | 0     | 0%       |
| 2. Core Entities | 30     | 0     | 0%       |
| 3. BAS Reporting | 6      | 0     | 0%       |
| 4. Integration   | 10     | 0     | 0%       |
| **Total**        | **55** | **0** | **0%**   |
