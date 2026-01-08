# Frontend Backlog: Future Features & Enhancements

> **📚 Reference Documentation:** See [TASKS-FRONTEND.md](TASKS-FRONTEND.md) for:
>
> - Architecture decisions and rationale
> - Implementation patterns and conventions
> - Completed work with detailed notes
> - Testing standards and examples

**Purpose:** This document tracks future improvements, UX enhancements, and nice-to-have features that are not critical for the current MVP but would improve the user experience.

**Project Status:** 94% complete (95/101 tasks done) - Production-ready with core functionality complete.

---

## 🔴 Priority: High (Next Sprint Candidates)

These tasks are deferred from the current sprint but are important for a polished product.

### F2.2.4: Add Pagination to Expenses List ✅

**Status:** ✅ Completed (2026-01-08)
**Phase:** F2.2 Expenses CRUD
**Actual Effort:** 3 hours

**Implementation:**
Implemented client-side pagination with 25 expenses per page. Pagination controls appear only when expenses exceed 25, showing "Showing X-Y of Z" count and "Page X of Y" indicator. Previous/Next buttons are disabled appropriately on first/last pages. ARIA labels ensure accessibility. Sorting is preserved across page navigation.

**Testing:**
11 comprehensive tests cover all pagination scenarios including edge cases (zero amounts, last page, disabled states, ARIA labels, sorting preservation).

**Technical Decision:**
Used client-side pagination instead of server-side because backend doesn't currently support pagination parameters. This is acceptable for <1000 expenses and provides instant navigation without API calls.

**Reference:** TASKS-FRONTEND.md F2.2.4

---

### F2.3.4: Add Pagination to Incomes List ✅

**Status:** ✅ Completed (2026-01-08)
**Phase:** F2.3 Incomes CRUD
**Actual Effort:** 1 hour

**Implementation:**
Implemented client-side pagination with 25 incomes per page, matching expense pagination pattern (90% code reuse). Pagination controls show/hide based on data count, with proper disabled states and ARIA labels. Sorting preserved across pages.

**Testing:**
11 comprehensive tests ensure consistent behavior with expenses pagination. Fixed one test for zero amount handling (multiple $0.00 values in table).

**Reference:** TASKS-FRONTEND.md F2.3.4

---

### F2.2.6: Implement Provider Dropdown with Search ✅

**Status:** ✅ Completed (2026-01-09)
**Phase:** F2.2 Expenses CRUD
**Actual Effort:** ~2 hours

**Implementation:**
Implemented searchable, accessible provider dropdown using ARIA combobox pattern. Features include: (1) Client-side case-insensitive filtering by provider name, (2) Alphabetical sorting (A-Z), (3) Search term highlighting with `<mark>` tag, (4) Empty states ("No providers available" and "No provider found"), (5) Full keyboard navigation (Arrow Up/Down, Enter to select, Escape to close, Tab), (6) ARIA labels and roles for screen readers, (7) Outside click to close, (8) Auto-focus search input on open, (9) Mobile-optimized with touch-friendly targets, (10) Dark mode support via Tailwind. Component integrates with React Hook Form's `setValue()` method.

**Testing:**
22 comprehensive tests covering: basic rendering (3), dropdown interaction (3), search functionality (4), keyboard navigation (4), edge cases (2), accessibility (4), validation state (2).

**Technical Decision:**
Built custom component rather than using shadcn/ui Combobox to achieve exact UX requirements: inline search field, client-side filtering with highlighting, and seamless integration with React Hook Form. Component is self-contained and reusable.

**Code Quality:**
Zero new linting errors. No `any` types. All functions have explicit return types. Self-documenting code with clear naming.

**Reference:** TASKS-FRONTEND.md F2.2.6

---

### F2.2.7: Implement Category Dropdown ✅

**Status:** ✅ Completed (2026-01-09)
**Phase:** F2.2 Expenses CRUD
**Actual Effort:** ~10 minutes

**Implementation:**
Implemented searchable, accessible category dropdown with 95% code reuse from ProviderSelect (F2.2.6). Identical feature set: client-side filtering, alphabetical sorting, search highlighting, empty states, keyboard navigation, ARIA combobox pattern, outside click close, auto-focus, mobile optimization, and dark mode. Component handles `CategoryDto` instead of `ProviderDto` with all labels updated ("provider" → "category", "Provider options" → "Category options", etc.). Integrated with React Hook Form in `ExpenseForm` via `setValue()`.

**Testing:**
22 comprehensive tests ensure feature parity with provider dropdown covering all scenarios: basic rendering, dropdown interaction, search functionality, keyboard navigation, edge cases, accessibility, and validation states.

**Code Reuse Efficiency:**
95% code reuse from ProviderSelect. Changes limited to: component name, DTO type, label text, ARIA labels, placeholder text, and empty state messages. No new patterns introduced.

**Quality Metrics:**
✅ No new linting errors. ✅ No `any` types. ✅ All functions typed. ✅ Self-documenting code. ✅ Full ARIA compliance.

**Reference:** TASKS-FRONTEND.md F2.2.7

---

### F3.4.3: Screen Reader Testing

**Status:** ⬜ Not started
**Phase:** F3.4 Polish & Accessibility
**Estimated Effort:** 4-6 hours (manual QA)
**Dependencies:** Access to screen reader software

**Description:**
Manual testing with assistive technology to ensure full accessibility compliance.

**Testing Checklist:**

- [ ] Test with NVDA (Windows) or JAWS
- [ ] Test with VoiceOver (macOS)
- [ ] All forms navigable and understandable
- [ ] Data tables properly announced
- [ ] Modal dialogs trap focus correctly
- [ ] Error messages announced
- [ ] Loading states announced
- [ ] Document findings and fix issues

**Reference:** TASKS-FRONTEND.md line 1078

---

## 🟡 Priority: Medium (UX Polish)

These enhancements improve user experience but are not blocking.

### Toast Notification Enhancements

**Status:** ⬜ Not started
**Context:** Auto-dismiss implemented in commit `ca6324b`
**Estimated Effort:** 3-4 hours

**Future Enhancements:**

- [ ] **Progress bar** showing time until auto-dismiss
  - Thin bar at bottom of toast that drains over duration
  - Visual indicator of remaining time
- [ ] **Pause on hover** to prevent auto-dismiss when reading
  - Common UX pattern in toast libraries
  - Resume timer on mouse leave
- [ ] **Toast stacking limit** (max 5 visible)
  - Auto-dismiss oldest when limit exceeded
  - Prevent UI clutter during bulk operations
- [ ] **Sound effects** for accessibility
  - Optional audio cue for toast appearance
  - Configurable in settings
- [ ] **Undo action** for destructive toasts
  - "Expense deleted. [Undo]" button
  - 8-second window to restore

**Technical Notes:**

- Progress bar: CSS animation with `animation-duration` matching toast duration
- Pause on hover: Clear/resume setTimeout on mouse events
- Undo: Keep deleted item in memory for duration, then commit

---

### Loading Skeleton Screens

**Status:** ⬜ Not started
**Estimated Effort:** 2-3 hours

**Description:**
Replace spinners with content-aware skeleton screens for better perceived performance.

**Scope:**

- [ ] Expense list skeleton (table rows)
- [ ] Income list skeleton
- [ ] BAS report skeleton
- [ ] Dashboard skeleton
- [ ] Form field skeletons (provider/client dropdowns)

**Technical Notes:**

- Use shadcn/ui Skeleton component
- Match actual content layout
- Animate with pulse effect

**Reference:** Common UX best practice

---

### Keyboard Shortcuts for Common Actions

**Status:** ⬜ Not started
**Estimated Effort:** 4-5 hours

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

---

### Bulk Operations

**Status:** ⬜ Not started
**Estimated Effort:** 5-6 hours

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

- TanStack Table supports row selection
- Use Shift+Click for range selection
- Show selected count in toolbar
- Disable during mutations

---

### CSV Template Downloads

**Status:** ⬜ Not started
**Estimated Effort:** 2-3 hours

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

## 🟢 Priority: Low (Nice-to-Have)

Features that would be nice but are not essential for the MVP.

### F2.2.11: Inline Editing for Quick Updates

**Status:** ⬜ Explicitly deferred
**Phase:** F2.2 Expenses CRUD
**Estimated Effort:** 8-10 hours (complex UX)

**Description:**
Edit expense fields directly in the table without opening modal.

**Rationale for Deferral:**
Modal-based editing provides full CRUD functionality with simpler implementation. Inline editing requires:

- Field-level validation
- Conflict resolution (if data changed by another operation)
- Complex UX patterns (click to edit, save/cancel controls)
- Not essential for MVP

**If Implemented:**

- [ ] Click cell to edit (text fields, dropdowns)
- [ ] Tab navigation between fields
- [ ] Auto-save on blur or Enter
- [ ] Cancel on Escape
- [ ] Visual indicator for "editing" state
- [ ] Optimistic updates with rollback

**Reference:** TASKS-FRONTEND.md line 405 (explicit deferral note)

---

### Dashboard Analytics & Insights

**Status:** ⬜ Not started
**Estimated Effort:** 10-15 hours

**Description:**
Enhanced dashboard with charts and insights beyond current GST summary.

**Features:**

- [ ] **Expense trends chart** (line chart, last 6 months)
- [ ] **Category breakdown** (pie chart)
- [ ] **Top 5 providers** by spend
- [ ] **Income vs Expenses** comparison
- [ ] **Upcoming recurring expenses** (next 30 days)
- [ ] **GST position forecast** (based on current quarter)
- [ ] **Year-over-year comparison**

**Technical Notes:**

- Use lightweight charting library (Recharts or Chart.js)
- Calculate insights client-side from existing data
- Consider backend aggregation endpoints for performance

---

### Receipt/Invoice Image Uploads

**Status:** ⬜ Not started
**Estimated Effort:** 15-20 hours (requires backend changes)

**Description:**
Attach receipt/invoice images to expenses and incomes.

**Features:**

- [ ] Upload button in expense/income forms
- [ ] Image preview in form
- [ ] Drag-and-drop upload
- [ ] Support common formats (JPG, PNG, PDF)
- [ ] Max file size validation (5MB)
- [ ] View attachments in detail view
- [ ] Download/delete attachments
- [ ] Thumbnail gallery for multiple images

**Technical Notes:**

- Requires backend storage (S3, local filesystem, or database)
- Image optimization (compress/resize before upload)
- Security: Validate file types server-side
- Privacy: Consider encryption for sensitive documents

**Dependencies:**

- Backend API for file uploads
- Storage solution decision

---

### Advanced Filtering

**Status:** ⬜ Not started
**Estimated Effort:** 6-8 hours

**Description:**
More sophisticated filtering beyond current date range and dropdowns.

**Features:**

- [ ] **Saved filters** (name and persist common filter combinations)
- [ ] **Multi-select filters** (multiple providers, categories)
- [ ] **Amount range filter** (min/max)
- [ ] **Tag/label system** for custom categorization
- [ ] **Quick filters** (This month, Last quarter, This year)
- [ ] **Filter builder UI** (add/remove conditions)

**Technical Notes:**

- Store saved filters in localStorage or backend
- Generate SQL WHERE clauses for server-side filtering
- Debounce filter inputs to reduce API calls

---

### Multi-Currency Support

**Status:** ⬜ Not started
**Estimated Effort:** 20+ hours (major feature)

**Description:**
Support expenses/incomes in foreign currencies with exchange rate tracking.

**Scope:**

- [ ] Currency field in expense/income forms
- [ ] Exchange rate lookup (manual or API integration)
- [ ] Convert to AUD for GST calculations
- [ ] Display original amount + converted amount
- [ ] Historical exchange rates for accurate reporting
- [ ] Multi-currency BAS/FY reports

**Technical Notes:**

- Requires database schema changes
- Exchange rate API (free tier: exchangerate-api.com)
- Store both original and converted amounts
- Complex GST rules for international transactions

**Dependencies:**

- Backend schema migration
- Exchange rate data source

---

### Export to Accounting Software

**Status:** ⬜ Not started
**Estimated Effort:** 15-20 hours per integration

**Description:**
Export data to popular accounting formats (Xero, MYOB, QuickBooks).

**Scope:**

- [ ] Export to Xero format (CSV or API)
- [ ] Export to MYOB format
- [ ] Export to QuickBooks format
- [ ] Custom CSV export with field mapping

**Technical Notes:**

- Research each platform's import requirements
- Field mapping UI for custom exports
- OAuth integration for API-based exports (complex)

---

## 🔧 Technical Debt & Infrastructure

### CI/CD Integration for E2E Tests

**Status:** ⬜ Not started
**Context:** E2E tests configured locally (F3.5)
**Estimated Effort:** 3-4 hours

**Tasks:**

- [ ] Add Playwright to GitHub Actions workflow
- [ ] Run E2E tests on PR creation
- [ ] Upload test results and screenshots as artifacts
- [ ] Configure test parallelization
- [ ] Set up test database for CI

**Reference:** TASKS-FRONTEND.md line 1135

---

### Migrate to React Router v7

**Status:** ⬜ Not started
**Context:** Currently on React Router v6
**Estimated Effort:** 4-6 hours (when v7 stable)

**Tasks:**

- [ ] Upgrade to React Router v7
- [ ] Migrate to new data loading patterns (if applicable)
- [ ] Update tests
- [ ] Verify all routes work
- [ ] Update documentation

**Notes:**
Wait for React Router v7 stable release and migration guide.

---

### Performance Optimization

**Status:** ⬜ Not started
**Estimated Effort:** Ongoing

**Opportunities:**

- [ ] **Code splitting** by route
- [ ] **Lazy load** components
- [ ] **Virtual scrolling** for long tables (100+ rows)
- [ ] **Memoization** for expensive calculations
- [ ] **Bundle size analysis** and optimization
- [ ] **Lighthouse audit** and fixes

---

## 📋 Design System Enhancements

### Custom Component Variants

**Status:** ⬜ Not started
**Estimated Effort:** 2-3 hours per component

**Components to enhance:**

- [ ] **Button variants** (ghost, link, icon-only)
- [ ] **Badge variants** (outline, subtle)
- [ ] **Alert variants** (warning, info, tip)
- [ ] **Card variants** (elevated, bordered, interactive)

---

### Iconography Consistency

**Status:** ⬜ Not started
**Estimated Effort:** 2-3 hours

**Tasks:**

- [ ] Audit all icon usage
- [ ] Standardize icon sizes (16px, 20px, 24px)
- [ ] Create icon component wrapper
- [ ] Document icon conventions

---

## 🎨 UX Micro-Interactions

**Status:** ⬜ Not started
**Estimated Effort:** 4-6 hours

**Enhancements:**

- [ ] **Hover states** for table rows (subtle background change)
- [ ] **Success animations** (checkmark, confetti on major actions)
- [ ] **Form field focus animations** (smooth transitions)
- [ ] **Loading state transitions** (fade in/out instead of instant)
- [ ] **Empty state illustrations** (custom graphics instead of text)
- [ ] **Haptic feedback** for mobile interactions
- [ ] **Smooth scroll** to validation errors in forms

---

## 📝 Documentation Improvements

### User Guide / Help Documentation

**Status:** ⬜ Not started
**Estimated Effort:** 6-8 hours

**Content:**

- [ ] Getting started guide
- [ ] CSV import guide with examples
- [ ] BAS/FY reporting explained
- [ ] Recurring expenses guide
- [ ] Keyboard shortcuts reference
- [ ] Troubleshooting common issues
- [ ] Video tutorials (optional)

---

### Developer Onboarding

**Status:** ⬜ Not started
**Estimated Effort:** 3-4 hours

**Content:**

- [ ] Contributing guide (CONTRIBUTING.md)
- [ ] Code style guide
- [ ] Component architecture patterns
- [ ] Testing guidelines
- [ ] PR template
- [ ] Issue templates

---

## 🔒 Security Enhancements

### Security Hardening

**Status:** ⬜ Not started
**Estimated Effort:** 4-6 hours

**Tasks:**

- [ ] Content Security Policy (CSP) headers
- [ ] Subresource Integrity (SRI) for CDN assets
- [ ] Security headers audit
- [ ] OWASP Top 10 review
- [ ] Dependency vulnerability scanning (Snyk, npm audit)
- [ ] Rate limiting on API calls

---

## 📊 Monitoring & Analytics

### Error Tracking

**Status:** ⬜ Not started
**Estimated Effort:** 3-4 hours

**Tools:**

- [ ] Sentry integration for frontend errors
- [ ] Error boundary with reporting
- [ ] Source map upload for production
- [ ] User context in error reports

---

### Usage Analytics (Privacy-Friendly)

**Status:** ⬜ Not started
**Estimated Effort:** 2-3 hours

**Scope:**

- [ ] Self-hosted analytics (Plausible, Umami)
- [ ] Page view tracking
- [ ] Feature usage metrics
- [ ] No personal data collection
- [ ] GDPR compliant

---

## 🗂 Backlog Management

**Last Updated:** 2026-01-08
**Next Review:** When Phase F2 pagination/search tasks start

**Process:**

1. Review backlog quarterly
2. Promote high-priority items to TASKS-FRONTEND.md when ready
3. Archive completed items
4. Re-prioritize based on user feedback

---

## 📌 Notes

- **All tasks are optional** - Core functionality is complete (92%)
- **User feedback** will drive prioritization
- **Effort estimates** are rough and may vary
- **Dependencies** should be resolved before starting tasks
- **Reference TASKS-FRONTEND.md** for implementation patterns

**Questions or suggestions?** Add items to this backlog via pull request or issue.
