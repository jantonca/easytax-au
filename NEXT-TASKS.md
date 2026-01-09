# NEXT: Upcoming Tasks

**Status:** App is 98% complete (99/101 frontend tasks done). Production-ready.

**Purpose:** Track upcoming tasks for the next release (v1.1.0).

---

## System Management Features (v1.1.0) - NEW

**Priority:** HIGH | **Target:** Next minor release

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| **Version Display** - Show app version in UI footer and Settings | 3-4 hours | 🔥 HIGH | ✅ Done |
| **Database Export** - Download backup from Settings page | 7-8 hours | 🔥 HIGH | Planned |
| **Update Notification** - Check GitHub for updates (optional) | 4-6 hours | 🟡 MEDIUM | Deferred |

**Implementation Notes:**
- Version: Add `/api/version` endpoint + footer component
- DB Export: Add `/api/backup/export` endpoint with rate limiting + Settings UI
- See `docs/archive/FUTURE-ENHANCEMENTS.md` for detailed requirements

---

## Frontend Optional Enhancements (Deferred)

See [FUTURE-ENHANCEMENTS.md](docs/archive/FUTURE-ENHANCEMENTS.md) for additional nice-to-have features (inline editing, toast enhancements, keyboard shortcuts, etc.).

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
- 461 Vitest unit/integration tests passing
- 40+ Playwright E2E tests covering critical flows
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

See [TASKS-FRONTEND.md](TASKS-FRONTEND.md) for the complete task breakdown with ✅ status indicators.

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

**Last Updated:** 2026-01-09 (Version Display feature completed)
