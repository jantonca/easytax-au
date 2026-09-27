# Completed Enhancements (Archived 2026-02-15)

**Archive Date:** 2026-02-15
**Context:** These enhancements were completed and have been removed from FUTURE-ENHANCEMENTS.md to keep that file focused on future work only.

---

## ✅ Toast Notification Enhancements

**Priority:** 🟡 Medium
**Estimated Effort:** 3-4 hours
**Context:** Auto-dismiss implemented in commit `ca6324b`
**Status:** ✅ Completed on 2026-01-11

**Features:**

- [x] **Progress bar** showing time until auto-dismiss
  - Thin bar at bottom of toast that drains over duration
  - Visual indicator of remaining time
  - CSS animation with `animation-duration` matching toast duration
- [x] **Pause on hover** to prevent auto-dismiss when reading
  - Common UX pattern in toast libraries
  - Resume timer on mouse leave
  - Clear/resume setTimeout on mouse events
- [x] **Toast stacking limit** (max 5 visible)
  - Auto-dismiss oldest when limit exceeded
  - Prevent UI clutter during bulk operations
- [x] **Undo action** for destructive toasts
  - "Expense deleted. [Undo]" button
  - 8-second window to restore
  - Keep deleted item in memory for duration, then commit

**Technical Notes:**

- Current implementation: `web/src/components/ui/toast-provider.tsx`
- Auto-dismiss durations: success (4s), default (5s), error (8s)

---

## ✅ Error Message Improvements

**Priority:** 🟡 Medium
**Estimated Effort:** 2-3 hours
**Status:** ✅ Completed on 2026-01-10
**Commit:** `fa6d716`

**Implementation:**
Added `aria-describedby` associations to 29 form fields across 6 forms to properly announce error messages to screen readers. Implementation follows WCAG 2.1 AA guidelines.

**Files Updated:**

- ✅ `web/src/features/expenses/components/expense-form.tsx` (5 fields)
- ✅ `web/src/features/incomes/components/income-form.tsx` (5 fields)
- ✅ `web/src/features/recurring/components/recurring-form.tsx` (11 fields)
- ✅ `web/src/features/settings/providers/components/provider-form.tsx` (3 fields)
- ✅ `web/src/features/settings/categories/components/category-form.tsx` (3 fields)
- ✅ `web/src/features/settings/clients/components/client-form.tsx` (2 fields)
- ✅ `web/src/features/settings/about/about-page.test.tsx` (test fix)

---

## ✅ CI/CD Integration for E2E Tests

**Priority:** 🟡 Medium
**Estimated Effort:** 3-4 hours
**Status:** ✅ Completed on 2026-01-10
**Workflow:** `.github/workflows/e2e-tests.yml`

**Implementation:**

- ✅ 62 Playwright tests covering critical flows (1 skipped, 98.4% pass rate)
- ✅ GitHub Actions workflow with PostgreSQL service
- ✅ Automatic browser dependency installation
- ✅ Backend auto-start with health checks
- ✅ Test artifacts upload (reports + screenshots on failure)
- ✅ Configured test parallelization (1 worker on CI, 8 locally)
- ✅ Test database auto-seeded on startup

**Test Coverage:**
- Theme switching: 11/11 ✓
- Expense CRUD: 9/9 ✓
- Income CRUD: 10/10 ✓
- Reports: 14/14 ✓
- PDF Downloads: 10/10 ✓
- CSV Import: 5/9 (4 require backend API)

**Reference:** web/e2e/README.md

---

## ✅ Cash vs Accrual BAS Basis (P2-5)

**Priority:** 🟡 Medium (P2 Audit Item)
**Estimated Effort:** 2-3 hours (actual)
**Status:** ✅ Completed on 2026-02-15
**Context:** Audit-identified enhancement for proper accounting basis support

**Implementation:**

Added optional `basis` query parameter to BAS endpoint to support both cash and accrual accounting:
- **ACCRUAL** (default): Includes all income regardless of payment status
- **CASH**: Only includes paid income (`isPaid = true`)
- Expenses are not affected by basis (always counted when incurred, per ATO rules)

**API Endpoint:**
```
GET /bas/:quarter/:year?basis=CASH|ACCRUAL
```

**Technical Implementation:**

- Added `AccountingBasis` type ('CASH' | 'ACCRUAL') in `bas.service.ts`
- Added `isValidBasis()` validation method
- Modified `calculateIncomeTotals()` to filter by `isPaid` when CASH basis selected
- Updated controller to accept `basis` query parameter with default 'ACCRUAL'
- SQL-level filtering for performance (no in-memory filtering)

**Files Modified:**

- ✅ `src/modules/bas/bas.service.ts` - Core business logic
- ✅ `src/modules/bas/bas.controller.ts` - API endpoint
- ✅ `src/modules/bas/bas.service.spec.ts` - 16 new tests
- ✅ `src/modules/bas/bas.controller.spec.ts` - 2 new tests

**Test Coverage:**

- 18 comprehensive tests added (16 service + 2 controller)
- All 641 backend tests passing
- Coverage: ACCRUAL default, CASH filtering, case insensitivity, invalid basis validation, edge cases

**Documentation Updates:**

- ✅ `docs/core/ATO-LOGIC.md` - New "Accounting Basis: Cash vs Accrual" section with examples
- ✅ `docs/core/ARCHITECTURE.md` - Updated BAS endpoints and formulas
- ✅ Controller JSDoc - Comprehensive parameter documentation

**Backward Compatibility:**

- ✅ Zero breaking changes
- ✅ Default behavior unchanged (ACCRUAL)
- ✅ Optional query parameter

**Review Results:**

- 5-Pillar Review: **PASS** (ATO Compliance ✅, Security ✅, Code Quality ✅, Architecture ✅, Performance ✅)
- Implementation Quality Score: **10/10**

**Future Enhancement:**

Add UI toggle in Settings page for default `basAccountingBasis` preference.

---

**Last Updated:** 2026-02-15

---

# Completed Enhancements (Archived 2026-09-27)

Moved from FUTURE-ENHANCEMENTS.md during the 2026-09 docs reorganisation.
P2-5 (Cash vs Accrual) was already recorded above and was removed there.

## ✅ P2-1: Rounding Standardization (COMPLETED 2026-02-16)

~~**Current State:** MoneyService uses `Decimal.round()` (round half-up) while BAS/Reports SQL uses `FLOOR()` (round down).~~

**Status:** ✅ **COMPLETE** (Commit `17aae96`)

**What Changed:**
- MoneyService.applyBizPercent() now uses `.floor()` instead of `.round()`
- Updated JSDoc to document FLOOR rounding behavior and tax-conservative rationale
- Added test case demonstrating FLOOR vs ROUND difference
- All 38 MoneyService tests passing

**Impact:** Tax-conservative calculations, full consistency between MoneyService and SQL queries

**Actual Effort:** ~15 minutes

---

## ✅ P2-2: BAS G10/G11 Fields (COMPLETED 2026-02-16)

~~**Current State:** BAS DTO only returns Simpler BAS fields (G1, 1A, 1B, Net GST). Full BAS reporters need G10/G11.~~

**Status:** ✅ **COMPLETE** (Commit `2b82b4e`)

**What Changed:**
- Added `g10CapitalPurchasesCents` field to BasSummaryDto
- Added `g11NonCapitalPurchasesCents` field to BasSummaryDto
- Implemented `calculatePurchasesByBasLabel()` service method
- Added 10 comprehensive test cases (all passing)
- G10: Sum of expense.total_cents WHERE category.basLabel = 'G10' (capital purchases > $1,000)
- G11: Sum of expense.total_cents WHERE category.basLabel = 'G11' (non-capital purchases < $1,000)

**Impact:** Full BAS support (vs Simpler BAS only), enables proper G10/G11 reporting to ATO

**Actual Effort:** ~30 minutes

---

## Keyboard Shortcuts for Common Actions ✅ **COMPLETED**

**Status:** ✅ Shipped in v1.3.0 (2026-02-14)
**Effort:** 4-5 hours
**See:** [v1.3-CHANGELOG.md](v1.3-CHANGELOG.md#1-keyboard-shortcuts-completed-2026-02-14)

**Description:**
Add keyboard shortcuts beyond basic navigation for power users.

**Proposed Shortcuts:**

- [ ] `Cmd/Ctrl + N` - New expense
- [ ] `Cmd/Ctrl + Shift + N` - New income
- [ ] `Cmd/Ctrl + I` - Import CSV
- [ ] `Cmd/Ctrl + /` - Show keyboard shortcuts help
- [ ] `E` - Edit selected row (in tables)
- [ ] `Del` - Delete selected row (with confirmation)
- [ ] `Cmd/Ctrl + F` - Focus search/filter
- [ ] `Cmd/Ctrl + S` - Save form (in modals)

**Technical Notes:**

- Use `mousetrap` or native `keydown` event listeners
- Show shortcuts in tooltips
- Add shortcuts overlay (triggered by `Cmd/Ctrl + /`)
- Respect OS conventions (Cmd on Mac, Ctrl on Windows/Linux)

**Implementation:**

- Current: `web/src/hooks/use-keyboard-shortcuts.ts` (⌘K only)
- Expand to global shortcut registry

---

## Bulk Operations ✅ **COMPLETED**

**Status:** ✅ Shipped in v1.3.0 (2026-02-16)
**Effort:** 5-6 hours
**See:** [v1.3-CHANGELOG.md](v1.3-CHANGELOG.md#3-bulk-operations-completed-2026-02-16)

**Description:**
Allow selecting multiple rows for batch operations.

**Features:**

- [ ] Multi-select checkboxes in expense/income tables
- [ ] Bulk delete with confirmation
  - "Delete 5 selected expenses?"
  - Show total amounts affected
- [ ] Bulk export to CSV
- [ ] Bulk category reassignment (expenses only)
- [ ] "Select all" / "Select none" / "Invert selection"

**Technical Notes:**

- TanStack Table supports row selection out of the box
- Use Shift+Click for range selection
- Show selected count in toolbar
- Disable during mutations

---

## CSV Template Downloads ✅ **COMPLETED**

**Status:** ✅ Shipped in v1.3.0 (2026-02-14)
**Effort:** 2-3 hours
**See:** [v1.3-CHANGELOG.md](v1.3-CHANGELOG.md#2-csv-template-downloads-completed-2026-02-14)

**Description:**
Provide downloadable CSV templates with example data.

**Templates:**

- [ ] Expense import template (CommBank format)
- [ ] Expense import template (Generic format)
- [ ] Income import template
- [ ] Provider bulk import template
- [ ] Client bulk import template

**Technical Notes:**

- Generate client-side (no backend needed)
- Use `js-file-download` or Blob API
- Include header row + 2-3 example rows
- Add download buttons to import pages

---
