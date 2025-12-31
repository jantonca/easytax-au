# AI Agent Directives for EasyTax-AU

## Core Philosophy

We are building a production-grade, local-first finance tool for **personal use only**.

- **Privacy:** Never suggest hardcoding my local CSV data. Use mock data for tests.
- **Math:** Use `decimal.js` for all GST and Currency calculations. No Floats.
- **Encryption:** Implement an `EncryptionService` to wrap TypeORM entities for sensitive fields.
- **Simplicity:** No auth, no multi-tenancy, no Redis. Keep it lean.

---

## Coding Standards

### Currency & Math

```typescript
// ✅ CORRECT - Use decimal.js, store as cents
import Decimal from 'decimal.js'

const subtotal = new Decimal('100.00')
const gst = subtotal.times('0.10')
const total = subtotal.plus(gst)

// Store as integers (cents)
expense.amount_cents = total.times(100).toNumber()
expense.gst_cents = gst.times(100).toNumber()
```

```typescript
// ❌ WRONG - Never use floats for money
const total = 100.0 * 1.1 // Floating point errors!
```

### Entity Structure

Each module follows this pattern:

```
modules/expenses/
├── dto/
│   ├── create-expense.dto.ts
│   └── update-expense.dto.ts
├── entities/
│   └── expense.entity.ts
├── expenses.controller.ts
├── expenses.service.ts
└── expenses.module.ts
```

### Encrypted Columns

Use the custom transformer for sensitive data:

```typescript
@Column({
  transformer: new EncryptedColumnTransformer(),
})
description: string;
```

Encrypted fields (per SECURITY.md):

- `clients.name`
- `clients.abn`
- `expenses.description`
- `incomes.description`

### GST Auto-Calculation

When creating/updating an expense:

```typescript
// In expenses.service.ts
if (provider.is_international) {
  expense.gst_cents = 0 // GST-Free
}
```

### BAS Module - Avoid Circular Dependencies

```typescript
// ✅ CORRECT - Inject repositories directly
@Injectable()
export class BasService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
    @InjectRepository(Income)
    private incomeRepo: Repository<Income>
  ) {}
}
```

```typescript
// ❌ WRONG - Don't inject full services (causes circular deps)
constructor(
  private expensesService: ExpensesService,  // Bad!
) {}
```

---

## Parser Rules (Phase 2)

When parsing my CSVs (e.g., `GST-expenses.xlsx`):

1. Match "Item" keywords to "Providers".
2. If "GST" is missing, check if the Provider is international (GST-Free).
3. Support "Business Use %" (e.g., iinet Internet at 50% deduction).
4. Create an `ImportJob` record to track each import batch.

---

## Testing Guidelines

- Use mock data, never real client names or ABNs
- Test GST calculations with edge cases:
  - 100% business use
  - 50% business use
  - International (0% GST)
  - Exact cent amounts (no rounding errors)

---

## Documentation References

| Document          | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `SCHEMA.md`       | Entity definitions, relationships, SQL examples |
| `ARCHITECTURE.md` | Module structure, tech stack, ATO logic         |
| `ROADMAP.md`      | MVP scope, phases, definition of done           |
| `SECURITY.md`     | Encryption rules, public repo guidelines        |
| `BACKUP.md`       | 3-2-1 backup strategy                           |
