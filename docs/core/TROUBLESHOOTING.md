# Troubleshooting Guide

## Common Issues & Solutions

This document contains solutions to recurring technical challenges discovered during development.

---

## NestJS Multipart/Form-Data Boolean Parameters

**Problem:** `@Transform()` decorators don't work for multipart/form-data uploads. Boolean query parameters arrive as strings (`"true"`, `"false"`) and aren't automatically converted.

**Solution:** Use separate endpoints with hardcoded boolean values instead of relying on query parameters.

```typescript
// ❌ Don't do this - @Transform doesn't work with multipart
@Post('import')
import(@Query('dryRun') dryRun: boolean, @UploadedFile() file: Express.Multer.File) {
  // dryRun will be a string, not boolean
}

// ✅ Do this instead - separate endpoints with explicit values
@Post('import/preview')
async preview(@UploadedFile() file: Express.Multer.File) {
  return this.csvImportService.import(file, true);  // dryRun: true
}

@Post('import')
async import(@UploadedFile() file: Express.Multer.File) {
  return this.csvImportService.import(file, false); // dryRun: false
}
```

**Reference:** Implementation notes from CSV Import feature (F2.4)

**Related Files:**
- `src/modules/csv-import/csv-import.controller.ts`

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

**Problem:** CSV import preview endpoint was saving data to the database instead of just returning a dry-run preview.

**Root Cause:** Using the same endpoint for both preview and actual import with a `dryRun` query parameter that wasn't being correctly parsed from multipart/form-data requests.

**Solution:** Create separate endpoints for preview and import (see "NestJS Multipart/Form-Data Boolean Parameters" above).

**Verification:**
```bash
# Preview should NOT create database records
POST /import/expenses/preview

# Actual import SHOULD create database records
POST /import/expenses
```

**Reference:** CSV Import dry-run fix (F2.4)

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

