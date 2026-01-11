# NEXT: Upcoming Tasks

**Status:** v1.1.0 shipped. Planning v1.2.0 UX Enhancements.

**Purpose:** Track upcoming tasks for the next release (v1.2.0).

---

## UX Enhancements (v1.2.0) - IN PROGRESS

**Priority:** MEDIUM | **Target:** Q1 2026

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| **Toast Notification Enhancements** - Progress bar, pause on hover, stacking, undo | 3-4 hours | 🟡 MEDIUM | ✅ Done |
| **Keyboard Shortcuts** - Power user shortcuts (⌘N, ⌘I, etc.) | 4-5 hours | 🟡 MEDIUM | ⬜ Todo |
| **Bulk Operations** - Multi-select for batch delete/export/categorize | 5-6 hours | 🟡 MEDIUM | ⬜ Todo |
| **CSV Template Downloads** - Downloadable templates with examples | 2-3 hours | 🟢 LOW | ⬜ Todo |
| **Advanced Filtering** - Saved filters, multi-select, amount ranges | 6-8 hours | 🟡 MEDIUM | ⬜ Todo |

**Implementation Notes:**
- Toast: Enhance `web/src/components/ui/toast-provider.tsx` with progress bar (CSS animation), pause on hover (setTimeout control), max 5 stack limit, undo action (8s window)
- Keyboard: Extend `web/src/hooks/use-keyboard-shortcuts.ts` with ⌘N (new expense), ⌘⇧N (new income), ⌘I (import), ⌘/ (help overlay)
- Bulk: TanStack Table row selection, bulk delete/export/recategorize, "Select all/none/invert" toolbar
- Templates: Client-side CSV generation (Blob API), example rows for CommBank/Generic/Income formats
- Filtering: localStorage for saved filters, multi-select dropdowns, amount min/max, quick filters (This month, Last quarter)

---

## Completed Releases

- **v1.1.0** (2026-01-10): System Management Features - See [v1.1-CHANGELOG.md](docs/archive/v1.1-CHANGELOG.md)

---

## Additional Future Enhancements

See [FUTURE-ENHANCEMENTS.md](docs/archive/FUTURE-ENHANCEMENTS.md) for additional nice-to-have features (dashboard analytics, receipt uploads, multi-currency, screen reader testing, etc.).

---

## Production Readiness Status

### ✅ Core Functionality (100%)
- Full CRUD for Expenses, Incomes, Recurring Expenses
- CSV Import with preview and validation
- BAS and FY Reports with PDF download
- Dashboard with GST summary
- Settings for Providers, Categories, Clients

### ✅ Infrastructure (100%)
- API client with error handling
- TanStack Query for data fetching
- React Router with lazy loading
- Toast notifications
- Error boundaries

### ✅ Polish (96%)
- Loading skeletons for all data fetches
- Empty states for all lists
- Success/error toasts for all mutations
- Dark mode toggle with persistence
- Keyboard accessibility audit complete
- Focus-visible styles
- Skip links
- Color contrast WCAG AA compliant
- *Deferred: Screen reader testing (manual QA)*

### ✅ Testing (100%)
- 482 Vitest unit/integration tests passing
- 62 Playwright E2E tests (1 skipped, 98.4% pass rate)
- Test coverage on critical paths

### ✅ Deployment (100%)
- Production Docker build with nginx
- Gzip compression
- SPA routing fallback
- API proxy configuration
- Traefik integration for HTTPS

### ✅ Documentation (100%)
- README with setup instructions
- Environment variables documented
- Keyboard shortcuts documented
- Screenshots captured (8 screenshots: 7 dark mode, 1 light mode)

---

## What's Already Done

See [v1.0-CHANGELOG.md](docs/archive/v1.0-CHANGELOG.md) for the complete MVP release summary.

**Highlights:**
- Phase F1 (Scaffold): 100% (22/22 tasks)
- Phase F2 (Core Features): 91% (40/44 tasks)
- Phase F3 (Reports & Polish): 92% (24/26 tasks)
- Phase F4 (Production): 100% (9/9 tasks)

---

## Definition of "Production Ready"

The frontend is **production ready** when:

- [x] All CRUD operations work
- [x] CSV import functional
- [x] Reports generate correctly
- [x] PDF downloads work
- [x] Forms are validated
- [x] Error states handled gracefully
- [x] Loading states prevent confusion
- [x] Responsive on mobile
- [x] Keyboard accessible
- [x] Tests pass (unit, integration, E2E)
- [x] Docker deployment configured
- [x] Documentation complete

**Current Status:** ✅ **PRODUCTION READY**

The remaining 5 tasks are nice-to-have polish items that do not block daily use.

---

**Last Updated:** 2026-01-11 (v1.1.0 archived, v1.2.0 UX Enhancements planned - 5 tasks promoted from FUTURE-ENHANCEMENTS.md)
