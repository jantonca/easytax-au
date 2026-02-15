# NEXT: Upcoming Tasks

**Status:** v1.2.0 (Audit Remediation) complete. Planning v1.3.0 (UX Enhancements).

**Purpose:** Track upcoming tasks for the next release.

**Last Updated:** 2026-02-15 (v1.2.0 completed and merged to main)

---

## v1.3.0: UX Enhancements

**Priority:** MEDIUM | **Target:** Q1 2026

**Context:** These UX polish items were originally planned for v1.2.0 but deferred to prioritize audit remediation. Toast notifications have been completed.

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| **Keyboard Shortcuts** - Power user shortcuts (⌘N, ⌘I, etc.) | 4-5 hours | 🟡 MEDIUM | ⬜ Todo |
| **Bulk Operations** - Multi-select for batch delete/export/categorize | 5-6 hours | 🟡 MEDIUM | ⬜ Todo |
| **CSV Template Downloads** - Downloadable templates with examples | 2-3 hours | 🟢 LOW | ⬜ Todo |
| **Advanced Filtering** - Saved filters, multi-select, amount ranges | 6-8 hours | 🟡 MEDIUM | ⬜ Todo |

**Implementation Notes:**
- **Keyboard**: Extend `web/src/hooks/use-keyboard-shortcuts.ts` with ⌘N (new expense), ⌘⇧N (new income), ⌘I (import), ⌘/ (help overlay)
- **Bulk**: TanStack Table row selection, bulk delete/export/recategorize, "Select all/none/invert" toolbar
- **Templates**: Client-side CSV generation (Blob API), example rows for CommBank/Generic/Income formats
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
- **Audit-identified (P2)**: Rounding standardization, BAS G10/G11 fields, GST treatment model, authentication, cash vs accrual BAS
- **Advanced features**: Dashboard analytics, receipt uploads, multi-currency, export to accounting software
- **Technical debt**: React Router v7 migration, performance optimization
- **Design & docs**: Component variants, user guide, developer onboarding

---

## Archive

Historical planning documents can be found in:
- [v1.2-pre-audit-snapshot.md](docs/archive/v1.2-pre-audit-snapshot.md) - Original v1.2.0 UX plan (before audit)
- [completed-enhancements.md](docs/archive/completed-enhancements.md) - Completed enhancements archive

---
