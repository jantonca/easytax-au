# Frontend Patterns & Conventions

## Overview

This document describes implementation patterns extracted from production code in the EasyTax-AU web application. These patterns represent battle-tested solutions to common frontend challenges.

For system architecture and tech stack information, see `ARCHITECTURE.md`.
For troubleshooting common issues, see `TROUBLESHOOTING.md`.

---

## CSV Import Pattern

**Context:** Bulk import of expenses and incomes from bank exports and spreadsheets.

**Key Files:**
- `web/src/features/import/unified-import-page.tsx`
- `web/src/features/import/utils/detect-csv-type.ts`
- `web/src/features/import/components/smart-file-dropzone.tsx`

### Auto-Detection Logic

The CSV type detector analyzes file headers to determine whether the file contains expenses or incomes:

```typescript
// detectCsvType() utility
// Expense detection: Requires "amount" + ("description" OR "date")
// Income detection: Requires ("client" OR "invoice") + ("subtotal" OR "total")
```

**Supported Formats:**
- CommBank exports
- Amex exports
- Generic CSV (custom format)

**Implementation Details:**
- Case-insensitive header matching
- Handles various column name variations
- Falls back to "unknown" if pattern doesn't match

### Inline Entity Creation

**Problem:** User drops CSV with unknown provider/client names → validation errors → workflow interruption.

**Solution:** Create missing entities inline without leaving the import workflow.

**Flow:**
1. CSV preview detects missing provider/client errors
2. "Create Provider/Client" buttons appear next to error messages
3. Modal dialogs open with pre-filled names from CSV data
4. User edits and saves
5. Preview automatically re-runs to show successful matches

**Key Components:**
- `CreateProviderModal` - Pre-fills name, sets safe defaults (domestic: 10% GST)
- `CreateClientModal` - Pre-fills name, sets safe defaults (PSI eligible: false)

**UX Benefits:**
- No context switching
- Maintains import flow
- Reduces friction for new users

### Preview vs. Import Endpoints

**Architecture:**
- `/import/expenses/preview` → `dryRun: true` (no database save)
- `/import/expenses` → `dryRun: false` (actual import with save)

**Rationale:** NestJS `@Transform` decorators don't work with multipart/form-data. Instead of fighting the framework, we use separate endpoints with hardcoded boolean values. See `TROUBLESHOOTING.md` for details.

**Testing Strategy:**
- Preview endpoint: Verify no database writes occur
- Import endpoint: Verify records are created and returned

---

## Searchable Dropdown Pattern (ARIA Combobox)

**Context:** Select providers, categories, and clients from filterable dropdowns.

**Key Files:**
- `web/src/features/expenses/components/provider-select.tsx`
- `web/src/features/incomes/components/client-select.tsx`

### Implementation

**Features:**
- Client-side filtering (fast for <100 items)
- Search term highlighting with `<mark>` tag
- Alphabetical sorting (A-Z)
- Empty states ("No providers available", "No provider found")
- Mobile-optimized with touch-friendly targets
- Dark mode support

**Why Custom Component:** Built instead of using shadcn/ui Combobox to achieve exact UX requirements: inline search field, client-side filtering with highlighting, seamless React Hook Form integration.

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Up/Down | Navigate options |
| Enter | Select highlighted option |
| Escape | Close dropdown |
| Tab | Move to next form field (closes dropdown) |

### Accessibility

**ARIA Attributes:**
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
    {/* Content */}
  </li>
</ul>
```

**Screen Reader Support:**
- Announces number of options available
- Announces highlighted option on arrow key navigation
- Announces selection on Enter

### React Hook Form Integration

```typescript
const { setValue, watch } = useForm();

<ProviderSelect
  value={watch('providerId')}
  onChange={(value) => setValue('providerId', value, { shouldValidate: true })}
  error={errors.providerId?.message}
/>
```

**Key Point:** Use `setValue()` with `shouldValidate: true` to trigger validation on selection.

---

## Pagination Pattern

**Context:** All list views (expenses, incomes, providers, categories, clients, import jobs).

**Key Files:**
- `web/src/features/expenses/components/expenses-table.tsx`
- `web/src/features/incomes/components/incomes-table.tsx`

### Client-Side Implementation

**Specifications:**
- 25 items per page (consistent across all tables)
- Conditional rendering: Hide controls if <25 items
- Sort preservation across page navigation
- Current page resets to 1 when filters change

**Why Client-Side:** Backend doesn't support pagination parameters yet. Acceptable for <1000 records and provides instant navigation without API calls.

**When to Migrate to Server-Side:** If any list exceeds 1000 items or if initial page load becomes slow.

### UI Components

**Pagination Controls:**
```tsx
<div className="flex items-center justify-between">
  <div className="text-sm text-gray-600">
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

### ARIA Labels

**Required Attributes:**
- `aria-label="Go to previous page"` on Previous button
- `aria-label="Go to next page"` on Next button
- Live region for "Showing X-Y of Z" (announces changes to screen readers)
- `disabled` attribute on buttons when on first/last pages

**Testing Checklist:**
- [ ] Pagination controls hide when <25 items
- [ ] Previous disabled on page 1
- [ ] Next disabled on last page
- [ ] Correct item range displayed
- [ ] Sort order preserved across page changes

---

## Modal Form Pattern

**Context:** All create/edit forms (expenses, incomes, providers, categories, clients).

**Key Files:**
- `web/src/features/expenses/components/expense-form.tsx`
- `web/src/features/incomes/components/income-form.tsx`

### Structure

**Stack:**
- React Hook Form for form state
- Zod for schema validation
- TanStack Query mutations for API calls
- Toast notifications for feedback

**Example:**
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
      toast({ title: 'Failed to create expense', description: error.message, variant: 'error' });
    },
  });
};
```

### Optimistic UI Updates

**Pattern:** Show immediate feedback while API request is pending.

**Implementation:**
1. Call mutation with `onMutate` callback
2. Update cache optimistically
3. If mutation fails, rollback cache changes
4. Show toast on success/error

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
  },
  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries(['expenses']);
  },
});
```

### Error Handling

**Field-Level Errors:** Display below input fields using React Hook Form's `formState.errors`.

**API Errors:** Show in toast notifications with descriptive messages.

```tsx
{errors.description && (
  <p className="text-sm text-red-600">{errors.description.message}</p>
)}
```

### Auto-Focus

**UX Pattern:** When modal opens, focus the first input field automatically.

```tsx
<input
  {...register('description')}
  autoFocus
/>
```

**Accessibility Note:** Auto-focus is acceptable in modals because the modal is a new context. Avoid auto-focus on page load.

---

## Data Fetching Conventions

**Context:** All API interactions using TanStack Query.

**Key Files:**
- `web/src/lib/query-client.ts`
- `web/src/features/*/hooks/use-*-query.ts`

### Query Keys

**Format:** `['entity', ...params]`

**Examples:**
```typescript
['expenses']           // List all expenses
['expenses', id]       // Single expense by ID
['providers']          // List all providers
['categories']         // List all categories
['import-jobs']        // List import jobs
```

**Rationale:** Hierarchical structure allows precise cache invalidation. Deleting an expense invalidates `['expenses']` and `['expenses', id]`.

### Mutation Returns

**Convention:** All mutations return the updated entity for cache updates.

**Example:**
```typescript
// Backend controller
@Post()
create(@Body() dto: CreateExpenseDto): Promise<Expense> {
  return this.expensesService.create(dto);
}

// Frontend mutation
const { mutate } = useMutation({
  mutationFn: (data) => apiClient.post('/expenses', data),
  onSuccess: (newExpense) => {
    // TanStack Query can update cache directly
    queryClient.setQueryData(['expenses', newExpense.id], newExpense);
    queryClient.invalidateQueries(['expenses']); // Refresh list
  },
});
```

**Benefits:**
- Optimistic updates
- No unnecessary refetches
- Cache stays synchronized

### Loading States

**Pattern Hierarchy:**
1. **Initial Load:** Show skeleton components (not spinners)
2. **Pagination/Filtering:** Show inline loaders
3. **Mutations:** Show optimistic updates + toast on completion

**Skeleton Components:**
```tsx
{isLoading ? (
  <TableSkeleton columns={5} rows={10} />
) : (
  <ExpensesTable data={expenses} />
)}
```

**Why Skeletons Over Spinners:** Skeletons provide better perceived performance by showing content structure immediately.

---

## Component Organization

**Convention:** Feature-based structure, not type-based.

### Directory Structure

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

### Naming Conventions

**Files:** kebab-case
- `expense-form.tsx`
- `use-expenses-query.ts`

**Components:** PascalCase
- `ExpenseForm`
- `ExpensesTable`

**Hooks:** camelCase with `use` prefix
- `useExpenses()`
- `useCreateExpense()`

**Test Files:** Co-located with component
- `expense-form.tsx`
- `expense-form.test.tsx`

### Types

**Convention:** Import from `@shared/types`, never duplicate.

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

**Rationale:** Single source of truth. Types are generated from OpenAPI spec, ensuring frontend/backend alignment.

---

## Form Validation Pattern

**Stack:** React Hook Form + Zod

### Schema Definition

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

### Form Component

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
```

### Validation Timing

- **On Submit:** Always validate (default behavior)
- **On Blur:** For long forms with complex validation
- **On Change:** For fields with interdependencies

**Example:**
```typescript
const form = useForm({
  mode: 'onBlur', // Validate on blur
  reValidateMode: 'onChange', // Re-validate on change after first submit
});
```

---

## Toast Notification Pattern

**Context:** User feedback for all mutations and important events.

**Key Files:**
- `web/src/components/ui/toast-provider.tsx`
- `web/src/lib/toast-context.ts`

### Usage

```typescript
import { useToast } from '@/lib/toast-context';

const { toast } = useToast();

// Success
toast({
  title: 'Expense created',
  variant: 'success', // Auto-dismisses after 4s
});

// Error
toast({
  title: 'Failed to save expense',
  description: 'Database connection error. Please try again.',
  variant: 'error', // Auto-dismisses after 8s
});

// With undo action
toast({
  title: 'Expense deleted',
  variant: 'success',
  action: (
    <button onClick={handleUndo}>Undo</button>
  ),
});
```

### Variants

| Variant | Duration | Use Case |
|---------|----------|----------|
| `success` | 4s | Successful mutations |
| `default` | 5s | Info messages |
| `error` | 8s | Error messages (longer to read) |

### Features

**Auto-Dismiss:** Toasts automatically dismiss based on variant duration.

**Pause on Hover:** Timer pauses when user hovers over toast, resumes on mouse leave.

**Progress Bar:** Visual indicator showing time until auto-dismiss.

**Stacking Limit:** Maximum 5 toasts visible. Oldest is removed when limit exceeded.

**Undo Actions:** 8-second window to restore deleted items.

---

## Testing Conventions

**Framework:** Vitest + React Testing Library

### Test Structure

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
      // ...
    });
  });
});
```

### Coverage Targets

- **Critical Paths:** 80%+ (forms, API calls, calculations)
- **UI Components:** 60%+ (visual components, layout)
- **Utilities:** 90%+ (pure functions, helpers)

### Mocking API Calls

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

## Accessibility Patterns

### Focus Management

**Modal Dialogs:**
- Trap focus within modal when open
- Return focus to trigger element on close
- Auto-focus first interactive element

**Keyboard Navigation:**
- All interactive elements accessible via Tab
- Skip links for main content
- Escape key closes modals and dropdowns

### ARIA Labels

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

### Color Contrast

**Standard:** WCAG AA compliant (4.5:1 for normal text)

**Testing:** Use browser DevTools to verify contrast ratios.

---

## Performance Optimization

### Code Splitting

**Route-Based:**
```typescript
import { lazy } from 'react';

const ExpensesPage = lazy(() => import('./features/expenses/expenses-page'));
```

**Benefits:**
- Smaller initial bundle
- Faster time to interactive
- Better caching

### Memo and Callback Hooks

**Use Sparingly:** Only when profiling shows performance issues.

```typescript
// ❌ Don't memoize everything
const MemoizedComponent = React.memo(SimpleComponent);

// ✅ Memoize expensive computations
const sortedExpenses = useMemo(
  () => expenses.sort((a, b) => new Date(b.date) - new Date(a.date)),
  [expenses]
);
```

### Bundle Size Monitoring

**Tools:**
- Vite build analyzer
- Bundle Buddy

**Target:** <250KB gzipped for initial bundle

---

## Additional Resources

- **Architecture:** See `ARCHITECTURE.md` for system design
- **Troubleshooting:** See `TROUBLESHOOTING.md` for common issues
- **Australian Tax Rules:** See `ATO-LOGIC.md` for GST/BAS calculations
- **Database Schema:** See `SCHEMA.md` for entity relationships

