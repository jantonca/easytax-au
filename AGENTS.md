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
import Decimal from 'decimal.js';

const subtotal = new Decimal('100.00');
const gst = subtotal.times('0.10');
const total = subtotal.plus(gst);

// Store as integers (cents)
expense.amount_cents = total.times(100).toNumber();
expense.gst_cents = gst.times(100).toNumber();
```

```typescript
// ❌ WRONG - Never use floats for money
const total = 100.0 * 1.1; // Floating point errors!
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
  expense.gst_cents = 0; // GST-Free
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
    private incomeRepo: Repository<Income>,
  ) {}
}
```

```typescript
// ❌ WRONG - Don't inject full services (causes circular deps)
constructor(
  private expensesService: ExpensesService,  // Bad!
) {}
```

### Multipart/Form-Data and Boolean Parameters

**Known Issue**: NestJS `@Transform` decorators don't work reliably with multipart/form-data. When sending booleans via FormData (e.g., file uploads with metadata), they're sent as strings but may not convert properly.

**Solution 1 (Recommended)**: Use separate endpoints for different boolean values:

```typescript
// ✅ BEST - Separate endpoints make intent explicit
@Post('import/expenses/preview')
@UseInterceptors(FileInterceptor('file'))
async previewImport(@UploadedFile() file: Express.Multer.File, @Body() dto: CsvImportDto) {
  const options = this.buildOptions({ ...dto, dryRun: true });  // Hardcoded
  return this.service.importFromBuffer(file.buffer, options);
}

@Post('import/expenses')
@UseInterceptors(FileInterceptor('file'))
async actualImport(@UploadedFile() file: Express.Multer.File, @Body() dto: CsvImportDto) {
  const options = this.buildOptions({ ...dto, dryRun: false });  // Hardcoded
  return this.service.importFromBuffer(file.buffer, options);
}
```

**Solution 2 (Alternative)**: Explicitly handle boolean conversion in controller:

```typescript
// ✅ ACCEPTABLE - Manual conversion for multipart endpoints
@Post()
@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() dto: MyDto) {
  const normalizedDto = {
    ...dto,
    dryRun: dto.dryRun === 'true' || dto.dryRun === true,
  };
  return this.service.process(file, normalizedDto);
}
```

```typescript
// ❌ WRONG - Relying on @Transform with multipart/form-data
// This may not work as expected:
export class MyDto {
  @Transform(({ value }) => value === 'true')
  dryRun?: boolean; // May receive 'false' string and convert to true!
}
```

**Real-World Example**: CSV Import module uses separate endpoints (`/import/expenses/preview` and `/import/expenses`) to avoid boolean conversion issues entirely. See `src/modules/csv-import/csv-import.controller.ts` lines 43 and 201.

---

## Parser Rules (Phase 2)

When parsing my CSVs (e.g., `GST-expenses.xlsx`):

1. Match "Item" keywords to "Providers".
2. If "GST" is missing, check if the Provider is international (GST-Free).
3. Support "Business Use %" (e.g., iinet Internet at 50% deduction).
4. Create an `ImportJob` record to track each import batch.

---

## Frontend Development Rules

### Component Patterns

```typescript
// ✅ CORRECT - Feature-based organization
web/src/features/expenses/
├── expenses-page.tsx
├── components/
│   ├── expenses-table.tsx
│   └── expense-form.tsx
├── hooks/
│   ├── use-expenses.ts
│   └── use-expense-mutations.ts
└── schemas/
    └── expense.schema.ts
```

### Data Fetching

```typescript
// ✅ CORRECT - Use TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => api.get('/expenses', { params: filters }),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseDto) => api.post('/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
```

> In the current frontend, this pattern is implemented by `useCreateExpense` in `web/src/features/expenses/hooks/use-expense-mutations.ts`, which invalidates the `['expenses']` query and surfaces success/error via toasts.

```typescript
// ❌ WRONG - Don't use useEffect for data fetching
useEffect(() => {
  fetch('/api/expenses').then(setExpenses); // Bad!
}, []);
```

### Form Validation

```typescript
// ✅ CORRECT - Use Zod schemas with React Hook Form
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  amountCents: z.number().int().positive('Amount must be positive'),
  bizPercent: z.number().int().min(0).max(100),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { amountCents: 0, bizPercent: 100 },
});
```

### Shared Types

```typescript
// ✅ CORRECT - Import from shared types
import type { Expense, CreateExpenseDto } from '@shared/types';

// ❌ WRONG - Don't duplicate types
interface Expense { ... } // Bad!
```

### Currency Display

```typescript
// ✅ CORRECT - Format cents to dollars in UI
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);
}

// Display: $110.00
// Store in API/DB: 11000 (cents)
```

### Accessibility Requirements

```typescript
// ✅ CORRECT - Keyboard accessible, ARIA labels
<Button
  onClick={onSubmit}
  disabled={isLoading}
  aria-busy={isLoading}
>
  {isLoading ? 'Saving...' : 'Save Expense'}
</Button>

// ✅ CORRECT - Form labels
<Label htmlFor="amount">Amount (AUD)</Label>
<Input id="amount" type="number" {...register('amountCents')} />
```

### Error Handling

```typescript
// ✅ CORRECT - User-friendly error messages
function ExpensesList() {
  const { data, error, isLoading } = useExpenses();

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorAlert message="Failed to load expenses" />;
  if (!data?.length) return <EmptyState action="Add your first expense" />;

  return <ExpensesTable data={data} />;
}
```

---

## Testing Guidelines

### Backend Tests

- Use mock data, never real client names or ABNs
- Test GST calculations with edge cases:
  - 100% business use
  - 50% business use
  - International (0% GST)
  - Exact cent amounts (no rounding errors)

### Frontend Tests

- Use MSW for API mocking
- Test user interactions, not implementation
- Cover loading, error, and empty states

```typescript
// ✅ CORRECT - Test user behavior
test('creates expense when form is submitted', async () => {
  render(<ExpenseForm />);

  await userEvent.type(screen.getByLabelText(/amount/i), '110');
  await userEvent.click(screen.getByRole('button', { name: /save/i }));

  expect(await screen.findByText(/expense created/i)).toBeInTheDocument();
});
```

---

## Documentation References

| Document            | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `SCHEMA.md`         | Entity definitions, relationships, SQL examples |
| `ARCHITECTURE.md`   | Module structure, tech stack, patterns          |
| `ROADMAP.md`        | MVP scope, phases, definition of done           |
| `SECURITY.md`       | Encryption rules, public repo guidelines        |
| `BACKUP.md`         | 3-2-1 backup strategy                           |
| `TASKS.md`          | Backend development tasks                       |
| `TASKS-FRONTEND.md` | Frontend development tasks                      |

---

## AI Agent Workflow

### Before Starting Any Task

1. **Read related documentation** - Check TASKS\*.md for context
2. **Verify API exists** - Test endpoint in Swagger before building UI
3. **Check shared types** - Ensure types exist in `/shared/types`
4. **Understand the UX** - Know the user flow before coding

### During Development

1. **Test incrementally** - Run tests after each significant change
2. **No `any` types** - Use proper TypeScript types
3. **No console.log** - Use proper logging or remove
4. **Handle all states** - Loading, error, empty, success

### Before Marking Complete

1. **All tests pass** - `pnpm test` (backend), `pnpm --filter web test` (frontend)
2. **TypeScript compiles** - No type errors
3. **ESLint passes** - No warnings
4. **Commit atomically** - One logical change per commit
5. **Update docs** - Mark task complete in TASKS\*.md
