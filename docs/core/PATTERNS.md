# Implementation Patterns & Code Conventions

## Overview

This document contains battle-tested code patterns for EasyTax-AU. Each pattern includes:
- **Rule**: The principle to follow
- **Code**: Working implementation example
- **Reference**: Links to related documentation

**How to use this file:**
- AI agents: Use grep or search to jump directly to `# [Pattern Name]` sections
- Developers: Copy-paste code snippets as starting templates

For system architecture, see `ARCHITECTURE.md`.
For troubleshooting, see `TROUBLESHOOTING.md`.

---

## Backend Patterns

### [Currency & Math] Pattern

**Rule**: Store all currency as **integers in cents**. Use `decimal.js` for calculations to avoid floating-point errors.

**Code:**
```typescript
import Decimal from 'decimal.js';

// Calculate GST-inclusive total
const subtotal = new Decimal('100.00');
const gst = subtotal.times('0.10');  // 10% GST
const total = subtotal.plus(gst);    // $110.00

// Store as integers (cents)
expense.amount_cents = total.times(100).toNumber();  // 11000
expense.gst_cents = gst.times(100).toNumber();       // 1000
```

**Display Logic** (Frontend):
```typescript
// Import from shared utility
import { formatCents } from '@/lib/currency';

// Display: $110.00
// Stored in DB: 11000 (cents)
const display = formatCents(expense.amount_cents);
```

**Why:** JavaScript floats have precision errors (`0.1 + 0.2 !== 0.3`). Storing as cents (integers) ensures exact calculations for financial data.

**Reference:** `docs/core/ATO-LOGIC.md` for GST calculation rules.

---

### [Entity Structure] Pattern

**Rule**: Each backend module follows a standardized directory structure.

**Code:**
```
src/modules/expenses/
├── dto/
│   ├── create-expense.dto.ts
│   └── update-expense.dto.ts
├── entities/
│   └── expense.entity.ts
├── expenses.controller.ts
├── expenses.service.ts
└── expenses.module.ts
```

**Controller Example:**
```typescript
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(): Promise<Expense[]> {
    return this.expensesService.findAll();
  }

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto): Promise<Expense> {
    return this.expensesService.create(createExpenseDto);
  }
}
```

**Service Example:**
```typescript
@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
  ) {}

  findAll(): Promise<Expense[]> {
    return this.expenseRepo.find({ order: { date: 'DESC' } });
  }
}
```

**Reference:** `docs/core/ARCHITECTURE.md#backend-modules`

---

### [Encrypted Columns] Pattern

**Rule**: Use `EncryptedColumnTransformer` for sensitive data. Encryption happens at the application layer (TypeORM).

**Encrypted Fields:**
- `clients.name`, `clients.abn`
- `expenses.description`
- `incomes.description`

**Code:**
```typescript
import { EncryptedColumnTransformer } from '@/common/transformers/encrypted-column.transformer';

@Entity('expenses')
export class Expense {
  @Column({
    transformer: new EncryptedColumnTransformer(),
  })
  description: string;  // Encrypted in DB, decrypted in app
}
```

**How It Works:**
1. On `save()`: Plaintext → Encrypted (stored in DB)
2. On `find()`: Encrypted → Plaintext (returned to app)

**Security Note:** Encryption key must be in environment variable (`ENCRYPTION_KEY`). Never commit to git.

**Reference:** `docs/core/SECURITY.md#field-level-encryption`

---

### [GST Auto-Calculation] Pattern

**Rule**: GST is auto-calculated based on provider type. International providers are GST-free.

**Code:**
```typescript
// In expenses.service.ts
async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
  const provider = await this.providerRepo.findOne({
    where: { id: createExpenseDto.providerId },
  });

  const expense = new Expense();
  expense.amount_cents = createExpenseDto.amountCents;

  // Auto-calculate GST
  if (provider.is_international) {
    expense.gst_cents = 0;  // GST-free
  } else {
    const amount = new Decimal(expense.amount_cents).div(100);
    const gst = amount.div(11);  // Reverse GST (amount / 11)
    expense.gst_cents = gst.times(100).toNumber();
  }

  return this.expenseRepo.save(expense);
}
```

**GST Formulas:**
- **GST-Inclusive → GST**: `amount / 11`
- **GST-Exclusive → Total**: `amount * 1.10`

**Reference:** `docs/core/ATO-LOGIC.md#gst-calculations`

---

### [BAS Module] Pattern

**Rule**: Avoid circular dependencies. Inject repositories directly, not services.

**Code:**
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

  async calculateG1(): Promise<number> {
    const incomes = await this.incomeRepo.find();
    return incomes.reduce((sum, i) => sum + i.gst_cents, 0);
  }
}
```

```typescript
// ❌ WRONG - Don't inject full services (causes circular deps)
@Injectable()
export class BasService {
  constructor(
    private expensesService: ExpensesService,  // Bad! Creates circular dependency
  ) {}
}
```

**Why:** `ExpensesService` might inject `BasService` for reporting, creating a cycle. Repositories are side-effect-free and don't create cycles.

**Reference:** `docs/core/TROUBLESHOOTING.md#circular-dependencies`

---

### [Multipart Boolean] Pattern

**Rule**: NestJS `@Transform` decorators don't work reliably with multipart/form-data. Use **separate endpoints** with hardcoded boolean values.

**Problem:**
```typescript
// ❌ WRONG - @Transform may fail with multipart uploads
export class CsvImportDto {
  @Transform(({ value }) => value === 'true')
  dryRun?: boolean;  // May receive 'false' string and convert to true!
}
```

**Solution:**
```typescript
// ✅ CORRECT - Separate endpoints with hardcoded values
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

**Real-World Usage:**
- Expense import: `/import/expenses/preview` (dry run) vs `/import/expenses` (actual)
- Income import: `/import/incomes/preview` (dry run) vs `/import/incomes` (actual)

**Reference:** `src/modules/csv-import/csv-import.controller.ts` (lines ~137, ~229, ~380)

**Troubleshooting:** See `docs/core/TROUBLESHOOTING.md#nestjs-multipart-booleans`

---

## Frontend Patterns

### [Data Fetching] Pattern

**Rule**: Use TanStack Query (v5) for all API calls. Invalidate queries on mutation success.

**Query Hook:**
```typescript
import { useQuery } from '@tanstack/react-query';

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => apiClient.get('/expenses', { params: filters }),
  });
}
```

**Mutation Hook:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseDto) => apiClient.post('/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense created', variant: 'success' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create expense',
        description: error.message,
        variant: 'error'
      });
    },
  });
}
```

**Query Keys Convention:**
```typescript
['expenses']           // List all expenses
['expenses', id]       // Single expense by ID
['providers']          // List all providers
['import-jobs']        // List import jobs
```

**Why:** Hierarchical keys enable precise cache invalidation. Deleting an expense invalidates both `['expenses']` and `['expenses', id]`.

**Real-World Usage:** `web/src/features/expenses/hooks/use-expense-mutations.ts`

---

### [Form Validation] Pattern

**Rule**: Use Zod schemas with React Hook Form for type-safe validation.

**Schema Definition:**
```typescript
import { z } from 'zod';

export const expenseFormSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Amount must be a positive number'
  ),
  providerId: z.number().min(1, 'Provider is required'),
  date: z.string().min(1, 'Date is required'),
  bizPercent: z.number().min(0).max(100).optional(),
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
```

**Form Integration:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { handleSubmit, register, formState: { errors } } = useForm<ExpenseFormData>({
  resolver: zodResolver(expenseFormSchema),
  defaultValues: {
    description: '',
    bizPercent: 100,
  },
});

const onSubmit = (data: ExpenseFormData) => {
  createExpense(data);
};
```

**Error Display:**
```tsx
{errors.description && (
  <p className="text-sm text-red-600">{errors.description.message}</p>
)}
```

---

### [Searchable Dropdown] Pattern

**Rule**: Use custom ARIA combobox with client-side filtering and search highlighting.

**Features:**
- Alphabetical sorting (A-Z)
- Search term highlighting with `<mark>` tag
- Keyboard navigation (Arrow Up/Down, Enter, Escape, Tab)
- Empty states ("No providers available", "No provider found")
- Mobile-optimized with touch-friendly targets

**ARIA Structure:**
```tsx
<input
  role="combobox"
  aria-expanded={isOpen}
  aria-controls="listbox-id"
  aria-activedescendant={highlightedOptionId}
  aria-autocomplete="list"
/>

<ul
  id="listbox-id"
  role="listbox"
  aria-label="Provider options"
>
  <li
    id={`option-${index}`}
    role="option"
    aria-selected={isSelected}
  >
    <mark>{highlightedText}</mark>
  </li>
</ul>
```

**React Hook Form Integration:**
```typescript
const { setValue, watch } = useForm();

<ProviderSelect
  value={watch('providerId')}
  onChange={(value) => setValue('providerId', value, { shouldValidate: true })}
  error={errors.providerId?.message}
/>
```

**Why Custom Component:** Built instead of using shadcn/ui Combobox to achieve exact UX requirements: inline search field, client-side filtering with highlighting, seamless React Hook Form integration.

**Real-World Usage:**
- `web/src/features/expenses/components/provider-select.tsx`
- `web/src/features/incomes/components/client-select.tsx`

---

### [Pagination] Pattern

**Rule**: Client-side pagination with 25 items per page. Hide controls if fewer than 25 items.

**Specifications:**
- 25 items per page (consistent across all tables)
- Conditional rendering: Hide controls if <25 items
- Sort preservation across page navigation
- Current page resets to 1 when filters change

**UI Implementation:**
```tsx
<div className="flex items-center justify-between">
  <div className="text-sm text-gray-600" aria-live="polite" aria-atomic="true">
    Showing {startIndex + 1}-{endIndex} of {totalItems}
  </div>
  <div className="flex items-center gap-2">
    <span className="text-sm">Page {currentPage} of {totalPages}</span>
    <button
      onClick={goToPreviousPage}
      disabled={currentPage === 1}
      aria-label="Go to previous page"
    >
      Previous
    </button>
    <button
      onClick={goToNextPage}
      disabled={currentPage === totalPages}
      aria-label="Go to next page"
    >
      Next
    </button>
  </div>
</div>
```

**Why Client-Side:** Backend doesn't support pagination parameters yet. Acceptable for <1000 records and provides instant navigation without API calls.

**When to Migrate to Server-Side:** If any list exceeds 1000 items or initial page load becomes slow.

**Real-World Usage:**
- `web/src/features/expenses/components/expenses-table.tsx`
- `web/src/features/incomes/components/incomes-table.tsx`

---

### [CSV Import] Pattern

**Context:** Bulk import of expenses and incomes from bank exports and spreadsheets.

**Auto-Detection Logic:**
```typescript
// detectCsvType() utility
// Expense detection: Requires "amount" + ("description" OR "date")
// Income detection: Requires ("client" OR "invoice") + ("subtotal" OR "total")
```

**Supported Formats:**
- CommBank exports
- Amex exports
- Generic CSV (custom format)

**Inline Entity Creation Flow:**
1. CSV preview detects missing provider/client errors
2. "Create Provider/Client" buttons appear next to error messages
3. Modal dialogs open with pre-filled names from CSV data
4. User edits and saves
5. Preview automatically re-runs to show successful matches

**Key Components:**
- `CreateProviderModal` - Pre-fills name, sets safe defaults (domestic: 10% GST)
- `CreateClientModal` - Pre-fills name, sets safe defaults (PSI eligible: false)

**Architecture:**
- `/import/expenses/preview` → `dryRun: true` (no database save)
- `/import/expenses` → `dryRun: false` (actual import with save)

**Reference:** See `[Multipart Boolean] Pattern` for implementation details.

**Real-World Usage:** `web/src/features/import/unified-import-page.tsx`

---

### [CSV Template Export] Pattern

**Rule**: Client-side CSV file generation and download using Blob API. No backend required.

**Use Case:** Provide downloadable CSV templates with example data to help users understand expected import formats.

**Implementation:**
```typescript
// 1. Generate CSV content as string
function generateCsvTemplate(format: string): string {
  const headers = 'Date,Item,Total,GST,Biz%,Category';
  const example1 = '15/02/2026,GitHub,29.95,0.00,100,Software';
  const example2 = '14/02/2026,VentraIP,165.00,15.00,100,Hosting';

  return [headers, example1, example2].join('\n');
}

// 2. Download CSV file via Blob API
function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 3. Usage in component
<button onClick={() => {
  const csv = generateCsvTemplate('commbank');
  downloadCsv(csv, 'expense-template-commbank.csv');
}}>
  Download Template
</button>
```

**Best Practices:**
- **Date Format**: Use DD/MM/YYYY for Australian context (not MM/DD/YYYY)
- **Currency**: Format as decimal with 2 places (e.g., "165.00" not "16500")
- **Examples**: Include 2-3 realistic example rows showing different scenarios
- **GST**: Show both domestic (10% GST) and international (0% GST) examples
- **Cleanup**: Always call `URL.revokeObjectURL()` to prevent memory leaks
- **MIME Type**: Use `text/csv;charset=utf-8;` for proper encoding

**Testing Note:** Browser download functionality isn't testable in jsdom. Mock `URL.createObjectURL` in tests and verify Blob creation instead.

**Real-World Usage:**
- `web/src/features/import/utils/generate-csv-template.ts`
- `web/src/features/import/components/csv-template-downloads.tsx`

---

### [Modal Form] Pattern

**Rule**: Use React Hook Form + Zod + TanStack Query mutations + Toast notifications.

**Structure:**
```tsx
const formSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  providerId: z.number().min(1, 'Provider is required'),
});

const { mutate, isPending } = useCreateExpense();
const { handleSubmit, control } = useForm({
  resolver: zodResolver(formSchema),
});

const onSubmit = (data) => {
  mutate(data, {
    onSuccess: () => {
      toast({ title: 'Expense created', variant: 'success' });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to create expense',
        description: error.message,
        variant: 'error'
      });
    },
  });
};
```

**Auto-Focus Pattern:**
```tsx
<input
  {...register('description')}
  autoFocus  // Auto-focus first field on modal open
/>
```

**Accessibility Note:** Auto-focus is acceptable in modals because the modal is a new context. Avoid auto-focus on page load.

**Real-World Usage:**
- `web/src/features/expenses/components/expense-form.tsx`
- `web/src/features/incomes/components/income-form.tsx`

---

### [Optimistic UI] Pattern

**Rule**: Show immediate feedback while API request is pending. Rollback on error.

**Implementation:**
```typescript
const { mutate } = useDeleteExpense({
  onMutate: async (id) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(['expenses']);

    // Snapshot current state
    const previous = queryClient.getQueryData(['expenses']);

    // Optimistically update cache
    queryClient.setQueryData(['expenses'], (old) =>
      old.filter((expense) => expense.id !== id)
    );

    // Return context with snapshot
    return { previous };
  },
  onError: (err, id, context) => {
    // Rollback on error
    queryClient.setQueryData(['expenses'], context.previous);
    toast({ title: 'Failed to delete expense', variant: 'error' });
  },
  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries(['expenses']);
  },
});
```

**Why:** Provides instant feedback. If deletion fails, the UI reverts to the previous state.

---

### [Toast Notification] Pattern

**Rule**: Use toast notifications for all mutations and important events.

**Usage:**
```typescript
import { useToast } from '@/lib/toast-context';

const { toast } = useToast();

// Success
toast({
  title: 'Expense created',
  variant: 'success',  // Auto-dismisses after 4s
});

// Error
toast({
  title: 'Failed to save expense',
  description: 'Database connection error. Please try again.',
  variant: 'error',  // Auto-dismisses after 8s
});

// With undo action
toast({
  title: 'Expense deleted',
  variant: 'success',
  action: <button onClick={handleUndo}>Undo</button>,
});
```

**Variants:**
| Variant | Duration | Use Case |
|---------|----------|----------|
| `success` | 4s | Successful mutations |
| `default` | 5s | Info messages |
| `error` | 8s | Error messages (longer to read) |

**Features:**
- Auto-Dismiss with variant-specific durations
- Pause on Hover (timer pauses on mouse hover)
- Progress Bar (visual indicator of auto-dismiss countdown)
- Stacking Limit (maximum 5 toasts, oldest removed when exceeded)
- Undo Actions (8-second window for deletion rollback)

**Real-World Usage:** `web/src/components/ui/toast-provider.tsx`

---

### [Loading States] Pattern

**Rule**: Use skeleton components for initial loads, inline loaders for filtering, optimistic updates for mutations.

**Hierarchy:**
1. **Initial Load:** Show skeleton components (not spinners)
2. **Pagination/Filtering:** Show inline loaders
3. **Mutations:** Show optimistic updates + toast on completion

**Skeleton Example:**
```tsx
{isLoading ? (
  <TableSkeleton columns={5} rows={10} />
) : (
  <ExpensesTable data={expenses} />
)}
```

**Why Skeletons Over Spinners:** Skeletons provide better perceived performance by showing content structure immediately.

---

### [Component Organization] Pattern

**Rule**: Feature-based structure, not type-based.

**Directory Structure:**
```
web/src/features/
├── expenses/
│   ├── expenses-page.tsx          # Main page component
│   ├── components/
│   │   ├── expense-form.tsx       # Form component
│   │   ├── expenses-table.tsx     # Table component
│   │   └── provider-select.tsx    # Custom dropdown
│   ├── hooks/
│   │   ├── use-expenses-query.ts  # Data fetching
│   │   └── use-expense-mutations.ts
│   └── schemas/
│       └── expense.schema.ts      # Zod validation
```

**Naming Conventions:**
- **Files:** kebab-case (`expense-form.tsx`, `use-expenses-query.ts`)
- **Components:** PascalCase (`ExpenseForm`, `ExpensesTable`)
- **Hooks:** camelCase with `use` prefix (`useExpenses()`, `useCreateExpense()`)
- **Test Files:** Co-located (`expense-form.tsx` + `expense-form.test.tsx`)

---

### [Type Safety] Pattern

**Rule**: Import from `@shared/types`, never duplicate.

```typescript
// ❌ Don't duplicate types
interface Expense {
  id: number;
  description: string;
  // ...
}

// ✅ Import from shared types
import type { Expense } from '@shared/types';
```

**Type Generation:**
```bash
# Run after backend schema changes
pnpm run generate:types
```

**Why:** Single source of truth. Types are generated from OpenAPI spec, ensuring frontend/backend alignment.

**Dependency Rule:** If `SCHEMA.md` or a backend entity changes, you **MUST** run `pnpm run generate:types` before touching frontend code.

**Reference:** `docs/core/TROUBLESHOOTING.md#type-drift`

---

### [Testing] Pattern

**Framework:** Vitest + React Testing Library

**Test Structure:**
```typescript
describe('ExpenseForm', () => {
  it('renders form fields correctly', () => {
    render(<ExpenseForm />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('shows validation errors on submit with empty fields', async () => {
    render(<ExpenseForm />);
    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);
    expect(await screen.findByText('Description is required')).toBeInTheDocument();
  });

  it('calls onSubmit with form data', async () => {
    const onSubmit = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Description'), 'Office supplies');
    await userEvent.type(screen.getByLabelText('Amount'), '100');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      description: 'Office supplies',
      amount: 100,
    });
  });
});
```

**Coverage Targets:**
- **Critical Paths:** 80%+ (forms, API calls, tax calculations)
- **UI Components:** 60%+ (visual components, layout)
- **Utilities:** 90%+ (pure functions, helpers)

**Mocking API Calls:**
```typescript
import { vi } from 'vitest';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

describe('useExpenses', () => {
  it('fetches expenses successfully', async () => {
    const mockExpenses = [{ id: 1, description: 'Test' }];
    vi.mocked(apiClient.get).mockResolvedValue(mockExpenses);

    const { result } = renderHook(() => useExpenses());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockExpenses);
    });
  });
});
```

---

### [Accessibility] Pattern

**Focus Management:**
- Trap focus within modal when open
- Return focus to trigger element on close
- Auto-focus first interactive element

**Keyboard Navigation:**
- All interactive elements accessible via Tab
- Skip links for main content
- Escape key closes modals and dropdowns

**ARIA Labels:**

**Icon Buttons:**
```tsx
<button aria-label="Delete expense">
  <TrashIcon />
</button>
```

**Form Fields:**
```tsx
<label htmlFor="description">Description</label>
<input id="description" {...register('description')} />
```

**Live Regions:**
```tsx
<div aria-live="polite" aria-atomic="true">
  Showing {startIndex + 1}-{endIndex} of {totalItems}
</div>
```

**Color Contrast:**
- **Standard:** WCAG AA compliant (4.5:1 for normal text)
- **Testing:** Use browser DevTools to verify contrast ratios

---

### [Performance] Pattern

**Code Splitting (Route-Based):**
```typescript
import { lazy } from 'react';

const ExpensesPage = lazy(() => import('./features/expenses/expenses-page'));
```

**Benefits:**
- Smaller initial bundle
- Faster time to interactive
- Better caching

**Memoization:**
```typescript
// ❌ Don't memoize everything
const MemoizedComponent = React.memo(SimpleComponent);

// ✅ Memoize expensive computations
const sortedExpenses = useMemo(
  () => expenses.sort((a, b) => new Date(b.date) - new Date(a.date)),
  [expenses]
);
```

**Bundle Size Target:** <250KB gzipped for initial bundle

---

## Additional Resources

- **Architecture:** See `ARCHITECTURE.md` for system design
- **Troubleshooting:** See `TROUBLESHOOTING.md` for common issues
- **Australian Tax Rules:** See `ATO-LOGIC.md` for GST/BAS calculations
- **Database Schema:** See `SCHEMA.md` for entity relationships
- **Security:** See `SECURITY.md` for encryption and key management
