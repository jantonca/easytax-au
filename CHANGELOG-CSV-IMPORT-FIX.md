# CSV Import Fix - January 4, 2026

## Issue Summary

CSV import was failing with two errors:
1. **404 Not Found**: `POST http://localhost:3000/api/import/expenses 404 (Not Found)`
2. **400 Bad Request**: `Validation failed (current file type is text/csv, expected type is text/csv)`

## Root Causes

### Issue 1: Incorrect API Path
- **Problem**: Frontend was calling `/api/import/expenses` but backend has no global `/api` prefix
- **Backend routes**: `/import/expenses`, `/import/incomes`, etc.
- **Frontend was hardcoding**: `http://localhost:3000/api/import/...`

### Issue 2: Unreliable MIME Type Validation
- **Problem**: NestJS's `FileTypeValidator` was checking for exact `text/csv` MIME type
- **Reality**: Browsers/systems send different MIME types:
  - `text/csv` (Chrome sometimes)
  - `application/octet-stream` (Most common)
  - `application/csv` (Some browsers)
  - `text/x-csv` (Legacy)
- File extension was `.csv` but MIME type didn't match

## Solutions Implemented

### 1. Fixed Frontend API Routes ✅

**Files changed:**
- `web/src/features/import/hooks/use-csv-preview.ts`
- `web/src/features/import/hooks/use-csv-import.ts`
- `web/src/features/import/hooks/use-import-jobs.ts`

**Changes:**
```typescript
// Before:
const response = await fetch('http://localhost:3000/api/import/expenses', {

// After:
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const response = await fetch(`${baseUrl}/import/expenses`, {
```

**Benefits:**
- Removed hardcoded `/api` prefix
- Now uses `VITE_API_URL` environment variable
- Consistent with other API calls in `api-client.ts`

### 2. Created Custom File Validator ✅

**New file:** `src/modules/csv-import/validators/csv-file.validator.ts`

```typescript
/**
 * Validates that uploaded file has .csv extension.
 * MIME type validation is unreliable as browsers/systems may send different types.
 */
export class CsvFileValidator extends FileValidator<CsvFileValidatorOptions> {
  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false;

    // Check file extension (reliable)
    const filename = file.originalname.toLowerCase();
    if (!filename.endsWith('.csv')) return false;

    // Accept common CSV MIME types (flexible)
    if (file.mimetype) {
      const acceptedTypes = [
        'text/csv',
        'application/csv',
        'text/x-csv',
        'application/octet-stream',  // Most common!
      ];
      if (!acceptedTypes.includes(file.mimetype)) return false;
    }

    return true;
  }
}
```

**Files changed:**
- `src/modules/csv-import/csv-import.controller.ts` (4 endpoints updated)

**Changes:**
```typescript
// Before:
new FileTypeValidator({ fileType: 'text/csv' })

// After:
new CsvFileValidator({})
```

**Benefits:**
- Prioritizes file extension (reliable) over MIME type (unreliable)
- Accepts all common CSV MIME types including `application/octet-stream`
- Clear error messages: "File must be a CSV file (.csv extension)"
- Fully tested (8 passing tests)

### 3. Added Comprehensive Tests ✅

**New file:** `src/modules/csv-import/validators/csv-file.validator.spec.ts`

**Test coverage:**
- ✅ Accepts `.csv` files with `text/csv` MIME type
- ✅ Accepts `.csv` files with `application/octet-stream` MIME type
- ✅ Case-insensitive extension matching (`.CSV`, `.csv`)
- ✅ Rejects non-CSV extensions
- ✅ Rejects wrong MIME types even with `.csv` extension
- ✅ Rejects undefined files
- ✅ Custom error messages

**Results:** 8/8 tests passing

## Verification

### Backend Tests
```bash
$ pnpm test -- csv-import
PASS src/modules/csv-import/validators/csv-file.validator.spec.ts
PASS src/modules/csv-import/income-csv-import.service.spec.ts
PASS src/modules/csv-import/csv-parser.service.spec.ts
PASS src/modules/csv-import/client-matcher.service.spec.ts
PASS src/modules/csv-import/csv-import.service.spec.ts
PASS src/modules/csv-import/provider-matcher.service.spec.ts

Test Suites: 6 passed, 6 total
Tests:       190 passed, 190 total
```

### Manual Testing
```bash
# ✅ CSV upload works
$ curl -X POST http://localhost:3000/import/expenses \
  -F "file=@test-expenses.csv" \
  -F "source=custom" -F "dryRun=true"
Response: 200 OK

# ✅ Non-CSV rejected
$ curl -X POST http://localhost:3000/import/expenses \
  -F "file=@test.txt"
Response: 400 "File must be a CSV file (.csv extension)"
```

### Frontend Testing
- ✅ File upload successful
- ✅ Preview shows parsed rows
- ✅ Validation errors display correctly
- ✅ Import creates expenses in database

## Files Modified

### Frontend
1. `web/src/features/import/hooks/use-csv-preview.ts` - Fixed API URL
2. `web/src/features/import/hooks/use-csv-import.ts` - Fixed API URL
3. `web/src/features/import/hooks/use-import-jobs.ts` - Fixed API URL

### Backend
4. `src/modules/csv-import/csv-import.controller.ts` - Use custom validator (4 endpoints)
5. `src/modules/csv-import/validators/csv-file.validator.ts` - New custom validator
6. `src/modules/csv-import/validators/csv-file.validator.spec.ts` - Validator tests
7. `src/modules/csv-import/validators/index.ts` - Export validator

### Documentation
8. `TASKS-FRONTEND.md` - Updated CSV import section with implementation notes

## Known Limitations

### Income Import UI Not Implemented
- **Status**: Backend API ready, frontend UI missing
- **Workaround**: Use API directly
  ```bash
  curl -X POST http://localhost:3000/import/incomes \
    -F "file=@incomes.csv" -F "source=custom"
  ```
- **Future work**: Add tab/toggle to import page for expense vs income selection

### Provider/Client Matching
- Fuzzy matching requires providers/clients to exist in database first
- Match threshold fixed at 0.6 (60% similarity)
- Missing entities show clear error: "No matching provider found for 'X'"
- **Workaround**: Create providers via Settings → Providers before importing

## Migration Impact

### Breaking Changes
None - This is a bug fix.

### Database Changes
None

### API Changes
None - Backend endpoints unchanged, only validation logic improved.

## Deployment Notes

1. Backend changes require restart (if not using --watch)
2. Frontend uses environment variable - check `.env` has `VITE_API_URL`
3. No database migrations needed
4. Existing import jobs unaffected

## Related Issues

- Frontend task F2.4.2 marked as 🟡 (income UI not implemented)
- All other CSV import tasks marked ✅ complete

## Testing Checklist

- [x] Backend compiles without errors
- [x] All backend tests pass (190 tests)
- [x] Frontend compiles without errors
- [x] CSV upload works in browser
- [x] Preview shows correct data
- [x] Import creates expenses successfully
- [x] Non-CSV files rejected with clear message
- [x] Documentation updated

---

**Fixed by:** AI Pair Programmer  
**Date:** January 4, 2026  
**Test coverage:** 190 backend tests passing, 8 new validator tests  
**Status:** ✅ Resolved
