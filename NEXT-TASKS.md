# NEXT: Upcoming Tasks

**Status:** v1.3.0 (UX Enhancements) in progress. CSV Template Downloads, Keyboard Shortcuts, Cash vs Accrual BAS, and Bulk Operations complete.

**Purpose:** Track upcoming tasks for the next release.

**Last Updated:** 2026-02-16 (Bulk Operations completed)

---

## v1.3.0: UX Enhancements

**Priority:** MEDIUM | **Target:** Q1 2026

**Context:** These UX polish items were originally planned for v1.2.0 but deferred to prioritize audit remediation. Toast notifications have been completed.

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| **Keyboard Shortcuts** - Power user shortcuts (Ctrl+Alt+N, Ctrl+Alt+I, etc.) | 4-5 hours | 🟡 MEDIUM | ✅ Done |
| **CSV Template Downloads** - Downloadable templates with examples | 2-3 hours | 🟢 LOW | ✅ Done |
| **Bulk Operations** - Multi-select for batch delete/export/categorize | 5-6 hours | 🟡 MEDIUM | ✅ Done |
| **Advanced Filtering** - Saved filters, multi-select, amount ranges | 6-8 hours | 🟡 MEDIUM | ⬜ Todo |

**Implementation Notes:**
- **Keyboard**: ✅ COMPLETED - Global shortcuts using Ctrl+Alt combinations. See `web/src/hooks/use-global-shortcuts.ts`, `web/src/components/keyboard-shortcuts-help.tsx`. Shortcuts: Ctrl+Alt+N (expense), Ctrl+Alt+Shift+N (income), Ctrl+Alt+I (import), Ctrl+/ (help), Ctrl+K (command palette), Ctrl+F (search)
- **Templates**: ✅ COMPLETED - Client-side CSV generation (Blob API), example rows for CommBank/Generic/Income formats. See `web/src/features/import/utils/generate-csv-template.ts` and `web/src/features/import/components/csv-template-downloads.tsx`
- **Cash vs Accrual BAS** (P2-5): ✅ COMPLETED - Added `AccountingBasis` type with `?basis=CASH|ACCRUAL` query parameter. Cash basis filters income to `isPaid = true`, accrual includes all income. See `src/modules/bas/bas.service.ts`, `bas.controller.ts`. 18 tests added. Documented in ATO-LOGIC.md.
- **Bulk**: ✅ COMPLETED - Multi-select checkboxes with shift-click range selection, bulk delete with confirmation, CSV export (Australian date format), bulk category change for expenses. See `web/src/features/expenses/components/expenses-table.tsx`, `web/src/features/incomes/components/incomes-table.tsx`, `web/src/lib/export-csv.ts`. 26 tests added (64 total passing). Toast notifications for all operations.
- **Filtering**: localStorage for saved filters, multi-select dropdowns, amount min/max, quick filters (This month, Last quarter)

---

## Completed Releases

- **v1.2.0** (2026-02-15): Audit Remediation (P0/P1 fixes)
  - ✅ Fixed bizPercent double-application bug in CSV import
  - ✅ Added encryption fallback logging for security audit trail
  - ✅ Verified test coverage (critical services: 94-100%)
  - See commit: `9d88296`
- **v1.1.0** (2026-01-10): System Management Features - See [v1.1-CHANGELOG.md](docs/archive/v1.1-CHANGELOG.md)
- **v1.0.0**: MVP Release - See [v1.0-CHANGELOG.md](docs/archive/v1.0-CHANGELOG.md)

---

## Additional Future Enhancements

See [FUTURE-ENHANCEMENTS.md](docs/FUTURE-ENHANCEMENTS.md) for additional nice-to-have features:
- **Audit-identified (P2)**: Rounding standardization, BAS G10/G11 fields, GST treatment model, authentication
- **Advanced features**: Dashboard analytics, receipt uploads, multi-currency, export to accounting software
- **Technical debt**: React Router v7 migration, performance optimization
- **Design & docs**: Component variants, user guide, developer onboarding

---

## Archive

Historical planning documents can be found in:
- [v1.2-pre-audit-snapshot.md](docs/archive/v1.2-pre-audit-snapshot.md) - Original v1.2.0 UX plan (before audit)
- [completed-enhancements.md](docs/archive/completed-enhancements.md) - Completed enhancements archive

---
