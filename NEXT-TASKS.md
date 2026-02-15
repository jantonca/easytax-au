# NEXT: Upcoming Tasks

**Status:** v1.1.0 shipped. Audit remediation in progress (v1.2.0).

**Purpose:** Track upcoming tasks for the next release (v1.2.0) and beyond.

**Last Updated:** 2026-02-15 (restructured after audit)

---

## v1.2.0: Audit Remediation (CRITICAL)

**Priority:** HIGH | **Target:** Immediate

### P0 — Fix Immediately

#### 1. Fix bizPercent Double-Application in CSV Import

**File:** `src/modules/csv-import/csv-import.service.ts` (lines 278-285)

**Problem:** CSV import pre-adjusts amountCents and gstCents by bizPercent before storing, but the BAS and Reports services apply bizPercent again at query time. This causes systematic under-claiming of GST for all CSV-imported expenses where bizPercent < 100.

**Impact:** For an expense with $10.00 GST at 50% business use:
- CSV import stores: gstCents = 500 (already halved), bizPercent = 50
- BAS query computes: 500 * 50 / 100 = 250 (halved again)
- **Result:** $2.50 claimed instead of correct $5.00 (50% understatement)

**Fix:**
1. Store FULL amounts in the CSV import path (remove `applyBizPercent` calls)
2. Write regression test: Import CSV with bizPercent=50, verify BAS 1B is correct
3. Test both manual and imported expenses to ensure consistency

**Effort:** 2-3 hours (fix + test)

---

#### 2. Repair Existing Imported Data (If Applicable)

**Context:** If any CSV imports with bizPercent < 100 have already been performed, existing data needs correction.

**Fix:**
1. Migration script to find expenses with `importJobId IS NOT NULL AND bizPercent < 100`
2. Reverse the pre-adjustment: `amountCents = amountCents * 100 / bizPercent` (same for gstCents)
3. Verify with spot-check against original CSV data

**Effort:** 1-2 hours (only if data repair needed)

---

### P1 — Fix Before Production Reliance

#### 3. Fix Encryption Fallback (Silent Plaintext Return)

**File:** `src/common/transformers/encrypted-column.transformer.ts` (lines 87-91)

**Problem:** If encrypted data does not match the `iv:authTag:ciphertext` format, the transformer silently returns plaintext. This could mask data corruption or key rotation issues.

**Fix:** Add warning log or throw error on format mismatch (depends on whether legacy plaintext data exists).

**Effort:** 30 minutes

---

#### 4. Verify Test Coverage

**Context:** Test files exist (31 backend, 162 frontend), but coverage reports have not been generated to verify claimed targets (80% critical paths, 60% UI, 90% pure functions).

**Tasks:**
1. Run: `pnpm run test:cov` (backend)
2. Run: `pnpm --filter web test -- --coverage` (frontend)
3. Review coverage reports and prioritize gaps
4. Priority coverage targets:
   - MoneyService (pure functions, 90%+)
   - BasService and ReportsService (critical paths, 80%+)
   - CsvImportService (should catch bizPercent bug)

**Effort:** 2-3 hours (review + gap analysis)

---

## v1.3.0: UX Enhancements

**Priority:** MEDIUM | **Target:** After audit fixes

**Context:** These tasks were originally planned for v1.2.0 but have been deferred to allow audit remediation to take priority. Toast notifications have been completed.

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| **Keyboard Shortcuts** - Power user shortcuts (⌘N, ⌘I, etc.) | 4-5 hours | 🟡 MEDIUM | ⬜ Todo |
| **Bulk Operations** - Multi-select for batch delete/export/categorize | 5-6 hours | 🟡 MEDIUM | ⬜ Todo |
| **CSV Template Downloads** - Downloadable templates with examples | 2-3 hours | 🟢 LOW | ⬜ Todo |
| **Advanced Filtering** - Saved filters, multi-select, amount ranges | 6-8 hours | 🟡 MEDIUM | ⬜ Todo |

**Implementation Notes:**
- Keyboard: Extend `web/src/hooks/use-keyboard-shortcuts.ts` with ⌘N (new expense), ⌘⇧N (new income), ⌘I (import), ⌘/ (help overlay)
- Bulk: TanStack Table row selection, bulk delete/export/recategorize, "Select all/none/invert" toolbar
- Templates: Client-side CSV generation (Blob API), example rows for CommBank/Generic/Income formats
- Filtering: localStorage for saved filters, multi-select dropdowns, amount min/max, quick filters (This month, Last quarter)

---

## Completed Releases

- **v1.1.0** (2026-01-10): System Management Features - See [v1.1-CHANGELOG.md](docs/archive/v1.1-CHANGELOG.md)
- **v1.0.0**: MVP Release - See [v1.0-CHANGELOG.md](docs/archive/v1.0-CHANGELOG.md)

---

## Additional Future Enhancements

See [FUTURE-ENHANCEMENTS.md](docs/FUTURE-ENHANCEMENTS.md) for additional nice-to-have features (dashboard analytics, receipt uploads, multi-currency, audit-identified enhancements, etc.).

---

## Archive

Historical v1.2.0 planning content (prior to audit) can be found in [v1.2-pre-audit-snapshot.md](docs/archive/v1.2-pre-audit-snapshot.md).

---

**Notes:**
- P0 items MUST be completed before relying on BAS numbers from the system
- P1 items should be completed before production deployment
- v1.3.0 UX items can proceed after P0/P1 fixes are verified
