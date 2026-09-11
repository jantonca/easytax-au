# Troubleshooting Guide

## Common Issues & Solutions

This document contains solutions to recurring technical challenges discovered during development.

---

## NestJS Multipart/Form-Data Boolean Parameters

**Problem:** Multipart form fields always arrive as strings. With the global
ValidationPipe's `enableImplicitConversion: true`, class-transformer coerces
primitives with `Boolean(value)` **before** custom `@Transform()` decorators
run, so a `"false"` multipart field arrives at the transform as the boolean
`true`. JSON bodies carry real booleans, so the two transports need one
coercion that works for both.

**Solution:** Combine an explicit pass-through `@Type(() => Object)` (which
suppresses the implicit pre-coercion) with a strict `@Transform` that accepts
`true/1` and `false/0/''` and leaves anything else untouched so `@IsBoolean`
rejects it with 400. The shared helper lives in
`src/modules/csv-import/dto/csv-import.dto.ts` (`parseBoolean` /
`StrictBoolean`). Dedicated preview endpoints are retained as an explicit
contract (the request DTO flag is honoured too), and dry runs persist nothing
(no expenses/incomes/import-job rows).

```typescript
// ❌ Don't do this - implicit conversion makes Boolean("false") === true
dryRun?: boolean; // no @Type marker, no strict transform

// ✅ Do this - suppress implicit conversion, then coerce strictly
@StrictBoolean() // = @Type(() => Object) + @Transform(parseBoolean)
@IsBoolean()
@IsOptional()
dryRun?: boolean;
```

**Reference:** M04 remediation (docs/audits/MAINTENANCE-REMEDIATION-2026-09.md);
original CSV Import notes (F2.4)

**Related Files:**
- `src/modules/csv-import/dto/csv-import.dto.ts`
- `src/modules/csv-import/csv-import.controller.spec.ts`

---

## CSV File Validation

**Problem:** Browser MIME types for CSV files are unreliable. The same `.csv` file can have different MIME types:
- `text/csv` (most common)
- `application/csv` (some browsers)
- `text/plain` (fallback)
- `application/vnd.ms-excel` (Windows)

**Solution:** Validate file extension instead of MIME type.

```typescript
// ❌ Don't do this - MIME type is unreliable
if (file.mimetype !== 'text/csv') {
  throw new BadRequestException('Invalid file type');
}

// ✅ Do this instead - check file extension
if (!file.originalname.toLowerCase().endsWith('.csv')) {
  throw new BadRequestException('Only .csv files are allowed');
}
```

**Implementation:**

```typescript
// src/modules/csv-import/validators/csv-file.validator.ts
import { FileValidator } from '@nestjs/common';

export class CsvFileValidator extends FileValidator {
  isValid(file: Express.Multer.File): boolean {
    return file?.originalname?.toLowerCase().endsWith('.csv') ?? false;
  }

  buildErrorMessage(): string {
    return 'Only .csv files are allowed';
  }
}
```

**Reference:** CSV Import file validation (F2.4)

**Related Files:**
- `src/modules/csv-import/validators/csv-file.validator.ts`
- `src/modules/csv-import/validators/csv-file.validator.spec.ts`

---

## API Client 404 Errors

**Problem:** Frontend hooks adding `/api` prefix to endpoints when the NestJS backend has no global prefix configured.

**Root Cause:** Hardcoded `/api` prefix in frontend API client calls, but backend routes start at root (`/`).

**Solution:** Remove hardcoded prefixes. Use base URL from environment variable only.

```typescript
// ❌ Don't do this - adds unnecessary /api prefix
const response = await apiClient.post('/api/import/expenses', formData);

// ✅ Do this instead - backend has no global prefix
const response = await apiClient.post('/import/expenses', formData);
```

**Configuration:**
- Backend: No global prefix (routes start at `/`)
- Frontend: `VITE_API_URL=http://localhost:3000` (no `/api` suffix)

**Reference:** CSV Import 404 debugging (F2.4)

**Related Files:**
- `web/src/lib/api-client.ts`
- `web/src/features/import/hooks/use-csv-preview.ts`
- `web/src/features/import/hooks/use-csv-import.ts`

---

## NaN Database Errors from CSV Import

**Problem:** PostgreSQL rejects numeric values with `NaN` error when importing CSV data with comma-formatted amounts.

**Root Cause:** CSV amounts like `$1,250.00` fail to parse as numbers. The comma is interpreted incorrectly.

**Solution:** Remove commas from currency values before parsing.

```typescript
// ❌ Don't use values with commas directly
const amount = parseFloat('$1,250.00'); // Results in NaN

// ✅ Strip formatting first
const cleanValue = '$1,250.00'.replace(/[,$]/g, '');
const amount = parseFloat(cleanValue); // Correctly parses to 1250
```

**Test Data Fix:**
```csv
// ❌ Before (causes NaN)
date,description,amount
2024-01-15,Service fee,$1,250.00

// ✅ After (works correctly)
date,description,amount
2024-01-15,Service fee,$1250.00
```

**Reference:** CSV Import data validation (F2.4)

---

## Preview Data Saving to Database

**Problem:** CSV import previews must not create database records. Historically
the actual-import endpoints also force-overwrote `dryRun` to `false`, and even
a correctly-flagged dry run still wrote an import-job row.

**Root Cause:** the `dryRun` boolean was silently coerced (see
"NestJS Multipart/Form-Data Boolean Parameters" above) and the import services
created an `ImportJob` unconditionally.

**Solution:** the import services skip import-job creation entirely when
`dryRun` is set, so a dry run persists nothing (no expenses, incomes, import
jobs, or matched entities); the response's `importJobId` is `null` for dry
runs. Both the dedicated `/preview` endpoints and the `dryRun=true` request
flag behave identically.

**Verification:**
```bash
# Preview should NOT create any database records (importJobId comes back null)
POST /import/expenses/preview

# Actual import SHOULD create records and an import job
POST /import/expenses
```

**Reference:** CSV Import dry-run fix (F2.4); M04 remediation
(docs/audits/MAINTENANCE-REMEDIATION-2026-09.md)

---

## TypeScript `any` Type Violations

**Problem:** Strict TypeScript mode forbids the `any` type, but some library types require it.

**Solution:** Use proper type annotations or `unknown` with type guards.

```typescript
// ❌ Don't use any
function processData(data: any) {
  return data.value;
}

// ✅ Use proper types
interface DataType {
  value: string;
}
function processData(data: DataType) {
  return data.value;
}

// ✅ Or use unknown with type guards when type is truly unknown
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data structure');
}
```

**Project Rule:** Zero `any` types allowed. All TypeScript errors must be resolved with proper typing.

---

## React Hook Form Integration with Custom Components

**Problem:** Custom form components (like searchable dropdowns) need to integrate with React Hook Form's validation and state management.

**Solution:** Use `setValue()` method from React Hook Form to update form state programmatically.

```typescript
// In custom component
interface ProviderSelectProps {
  value?: number;
  onChange: (value: number) => void;
  error?: string;
}

// In form component
const { setValue, formState: { errors } } = useForm();

<ProviderSelect
  value={watch('providerId')}
  onChange={(value) => setValue('providerId', value, { shouldValidate: true })}
  error={errors.providerId?.message}
/>
```

**Reference:** Searchable dropdown implementation (F2.2.6)

**Related Files:**
- `web/src/features/expenses/components/provider-select.tsx`
- `web/src/features/expenses/components/expense-form.tsx`

---

## ARIA Combobox Cross-Browser Compatibility

**Problem:** ARIA combobox pattern requires careful implementation for screen reader and keyboard navigation support across different browsers.

**Solution:** Follow these essential ARIA attributes:

```tsx
// Input element
<input
  role="combobox"
  aria-expanded={isOpen}
  aria-controls="listbox-id"
  aria-activedescendant={highlightedOptionId}
  aria-autocomplete="list"
/>

// Listbox container
<ul
  id="listbox-id"
  role="listbox"
  aria-label="Provider options"
>
  {/* Options */}
</ul>

// Option element
<li
  id={`option-${index}`}
  role="option"
  aria-selected={isSelected}
>
  {/* Content */}
</li>
```

**Keyboard Navigation:**
- Arrow Up/Down: Navigate options
- Enter: Select highlighted option
- Escape: Close dropdown
- Tab: Move to next form field (closes dropdown)

**Reference:** Searchable dropdown accessibility (F2.2.6)

---

## Client-Side Filtering Performance

**Problem:** When to use client-side vs. server-side filtering for searchable dropdowns and tables.

**Solution:**
- **Client-side:** Use for <100 items (instant response, no API calls)
- **Server-side:** Use for >100 items (reduces payload, scales better)

**Current Implementation:** All dropdowns and tables use client-side filtering because:
- Provider list: ~20-30 items (small business)
- Category list: ~15-20 items (fixed set)
- Client list: ~10-50 items (freelancer)

**When to Switch:** If provider/client lists exceed 100 items, implement server-side search with debouncing.

**Reference:** Searchable dropdown performance considerations (F2.2.6)

---

## Date Handling: Australian Financial Year

**Problem:** JavaScript Date objects use calendar year (Jan-Dec), but Australian financial year runs July-June.

**Solution:** Use helper functions that account for FY offset.

```typescript
// ❌ Don't use calendar year
const year = new Date().getFullYear(); // 2024

// ✅ Use FY helper
import { getFY } from './utils/fy-helper';
const fy = getFY(new Date()); // "2024-2025" for dates Jul 2024 - Jun 2025
```

**Common Pitfall:** Assuming April 15 tax deadline (US) instead of July 1 - June 30 (Australia).

**Reference:** See `docs/core/ATO-LOGIC.md` for full Australian tax rules.

**Related Files:**
- `src/common/utils/fy-helper.ts`
- `src/common/utils/fy-helper.spec.ts`

---

## Toast Notification Timing

**Problem:** Toasts dismissing too quickly for users to read error messages.

**Solution:** Use variant-based durations:
- Success: 4 seconds
- Default/Info: 5 seconds
- Error: 8 seconds (critical messages need more time)

```typescript
toast({
  title: 'Expense deleted',
  variant: 'success', // Auto-dismisses after 4s
});

toast({
  title: 'Failed to save expense',
  description: 'Database connection error. Please try again.',
  variant: 'error', // Auto-dismisses after 8s
});
```

**Reference:** Toast notification enhancements (v1.1.0)

**Related Files:**
- `web/src/components/ui/toast-provider.tsx`

---

## Need More Help?

If you encounter an issue not listed here:

1. Check `docs/core/ARCHITECTURE.md` for system design decisions
2. Check `docs/core/PATTERNS.md` for implementation patterns
3. Search the codebase for similar implementations
4. Check git history for context on why code was written a certain way

