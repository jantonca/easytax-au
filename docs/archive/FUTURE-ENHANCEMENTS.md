# Future Enhancements: EasyTax-AU

**Purpose:** This document tracks features, improvements, and nice-to-have enhancements that are not critical for the current production release but would improve the user experience in future iterations.

**Project Status:** Core functionality is production-ready (98% complete, 99/101 tasks done). These enhancements are optional improvements based on user feedback and evolving needs.

**Last Updated:** 2026-01-11 (5 tasks promoted to NEXT-TASKS.md for v1.2.0)

---

## 🎯 When to Revisit These Enhancements

- After 3-6 months of daily use to identify pain points
- When specific features are repeatedly requested
- When technical debt becomes a blocker
- When dependencies are updated (e.g., React Router v7 stable)

---

## 📊 Enhancement Categories

- [UX Polish & Interactions](#ux-polish--interactions)
- [Deferred Features](#deferred-features)
- [Accessibility](#accessibility)
- [Dashboard & Analytics](#dashboard--analytics)
- [Advanced Features](#advanced-features)
- [Technical Debt & Infrastructure](#technical-debt--infrastructure)
- [Design System](#design-system)
- [Documentation](#documentation)
- [Security & Monitoring](#security--monitoring)

---

## 🎨 UX Polish & Interactions

### Toast Notification Enhancements ⬆️ **PROMOTED TO v1.2.0**

**Priority:** 🟡 Medium
**Estimated Effort:** 3-4 hours
**Context:** Auto-dismiss implemented in commit `ca6324b`
**Status:** Moved to NEXT-TASKS.md on 2026-01-11

**Features:**

- [ ] **Progress bar** showing time until auto-dismiss
  - Thin bar at bottom of toast that drains over duration
  - Visual indicator of remaining time
  - CSS animation with `animation-duration` matching toast duration
- [ ] **Pause on hover** to prevent auto-dismiss when reading
  - Common UX pattern in toast libraries
  - Resume timer on mouse leave
  - Clear/resume setTimeout on mouse events
- [ ] **Toast stacking limit** (max 5 visible)
  - Auto-dismiss oldest when limit exceeded
  - Prevent UI clutter during bulk operations
- [ ] **Undo action** for destructive toasts
  - "Expense deleted. [Undo]" button
  - 8-second window to restore
  - Keep deleted item in memory for duration, then commit

**Technical Notes:**

- Current implementation: `web/src/components/ui/toast-provider.tsx`
- Auto-dismiss durations: success (4s), default (5s), error (8s)

---

### Loading Skeleton Enhancements

**Priority:** 🟢 Low
**Estimated Effort:** 1-2 hours
**Context:** Base skeletons implemented in F3.4.6

**Current State:**

- ✅ TableSkeleton with configurable columns/rows
- ✅ CardSkeleton for dashboard summaries
- ✅ Integrated across all data-fetching pages

**Future Improvements:**

- [ ] Content-aware skeletons that match actual content layout more closely
- [ ] Shimmer effect instead of pulse animation (more modern)
- [ ] Skeleton variants for forms and modals
- [ ] Progressive loading (show skeleton for first 200ms, then spinner if still loading)

---

### Keyboard Shortcuts for Common Actions ⬆️ **PROMOTED TO v1.2.0**

**Priority:** 🟡 Medium
**Estimated Effort:** 4-5 hours
**Status:** Moved to NEXT-TASKS.md on 2026-01-11

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

### UX Micro-Interactions

**Priority:** 🟢 Low
**Estimated Effort:** 4-6 hours

**Enhancements:**

- [ ] **Hover states** for table rows (subtle background change)
- [ ] **Success animations** (checkmark, confetti on major actions)
- [ ] **Form field focus animations** (smooth transitions)
- [ ] **Loading state transitions** (fade in/out instead of instant)
- [ ] **Empty state illustrations** (custom graphics instead of text icons)
- [ ] **Haptic feedback** for mobile interactions
- [ ] **Smooth scroll** to validation errors in forms

**Technical Notes:**

- Use Framer Motion or CSS animations
- Keep animations subtle (< 300ms)
- Respect `prefers-reduced-motion` for accessibility

---

## 🚫 Deferred Features

### F2.2.11: Inline Editing for Quick Updates

**Priority:** 🟢 Low (Explicitly Deferred)
**Estimated Effort:** 8-10 hours (complex UX)
**Original Task:** TASKS-FRONTEND.md line 405

**Description:**
Edit expense/income fields directly in the table without opening modal.

**Rationale for Deferral:**
Modal-based editing provides full CRUD functionality with simpler implementation. Inline editing requires:

- Field-level validation
- Conflict resolution (if data changed by another operation)
- Complex UX patterns (click to edit, save/cancel controls)
- Not essential for MVP (current modal workflow is functional)

**If Implemented:**

- [ ] Click cell to edit (text fields, dropdowns)
- [ ] Tab navigation between fields
- [ ] Auto-save on blur or Enter
- [ ] Cancel on Escape
- [ ] Visual indicator for "editing" state
- [ ] Optimistic updates with rollback

**Files to Modify:**

- `web/src/features/expenses/components/expenses-table.tsx`
- `web/src/features/incomes/components/incomes-table.tsx`

---

### Bulk Operations ⬆️ **PROMOTED TO v1.2.0**

**Priority:** 🟡 Medium
**Estimated Effort:** 5-6 hours
**Status:** Moved to NEXT-TASKS.md on 2026-01-11

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

### CSV Template Downloads ⬆️ **PROMOTED TO v1.2.0**

**Priority:** 🟢 Low
**Estimated Effort:** 2-3 hours
**Status:** Moved to NEXT-TASKS.md on 2026-01-11

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

## ♿ Accessibility

### F3.4.3: Screen Reader Testing

**Priority:** 🔴 High (Deferred for now as we don't currently have access to screen reader software,)
**Estimated Effort:** 4-6 hours (manual QA)
**Original Task:** TASKS-FRONTEND.md line 1078
**Dependencies:** Access to NVDA (Windows) or VoiceOver (macOS)

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

**Current Accessibility Status:**

- ✅ Keyboard navigation implemented (F3.4.1)
- ✅ Focus-visible styles (F3.4.2)
- ✅ Skip links (F3.4.4)
- ✅ WCAG AA color contrast (F3.4.5)
- ✅ ARIA labels on interactive elements
- ✅ Semantic HTML throughout

**Known Issues to Validate:**

- Error messages may need `aria-describedby` association
- Custom combobox pattern (provider/category dropdowns) needs validation
- Table pagination ARIA may need refinement

**When to Implement:**

- Before public release or multi-user deployment
- If application will be used by visually impaired users
- For compliance with accessibility regulations (WCAG 2.1 AA)

---

### Error Message Improvements ✅ **COMPLETED**

**Priority:** 🟡 Medium
**Estimated Effort:** 2-3 hours
**Completed:** 2026-01-10
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

## 📊 Dashboard & Analytics

### Dashboard Analytics & Insights

**Priority:** 🟡 Medium
**Estimated Effort:** 10-15 hours

**Description:**
Enhanced dashboard with charts and insights beyond current GST summary.

**Features:**

- [ ] **Expense trends chart** (line chart, last 6 months)
- [ ] **Category breakdown** (pie chart)
- [ ] **Top 5 providers** by spend
- [ ] **Income vs Expenses** comparison
- [ ] **Upcoming recurring expenses** (next 30 days) - ✅ Already implemented
- [ ] **GST position forecast** (based on current quarter)
- [ ] **Year-over-year comparison**

**Technical Notes:**

- Use lightweight charting library (Recharts ~15KB or Chart.js ~60KB)
- Calculate insights client-side from existing data
- Consider backend aggregation endpoints for performance
- Current dashboard: `web/src/features/dashboard/dashboard-page.tsx`

---

## 🚀 Advanced Features

### Receipt/Invoice Image Uploads

**Priority:** 🟢 Low
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

### Advanced Filtering ⬆️ **PROMOTED TO v1.2.0**

**Priority:** 🟡 Medium
**Estimated Effort:** 6-8 hours
**Status:** Moved to NEXT-TASKS.md on 2026-01-11

**Description:**
More sophisticated filtering beyond current date range and dropdowns.

**Current State:**

- ✅ Client-side filtering by provider, category, date range (expenses)
- ✅ Client-side filtering by client, paid status, date range (incomes)

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
- Current implementation: `web/src/features/expenses/components/expense-filters.tsx`

---

### Multi-Currency Support

**Priority:** 🟢 Low
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

**Priority:** 🟢 Low
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

### CI/CD Integration for E2E Tests ✅ **COMPLETED**

**Priority:** 🟡 Medium
**Estimated Effort:** 3-4 hours
**Completed:** 2026-01-10
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

**Reference:** TASKS-FRONTEND.md line 1135, web/e2e/README.md

---

### Migrate to React Router v7

**Priority:** 🟢 Low
**Estimated Effort:** 4-6 hours (when v7 stable)
**Context:** Currently on React Router v6

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

**Priority:** 🟡 Medium
**Estimated Effort:** Ongoing

**Opportunities:**

- [ ] **Code splitting** by route (partially done with lazy routes)
- [ ] **Lazy load** heavy components
- [ ] **Virtual scrolling** for long tables (100+ rows using TanStack Virtual)
- [ ] **Memoization** for expensive calculations
- [ ] **Bundle size analysis** and optimization
- [ ] **Lighthouse audit** and fixes

**Current State:**

- Frontend bundle: ~100KB gzipped (excellent)
- React 19 with automatic memoization
- Vite production build with tree-shaking

---

## 📋 Design System

### Custom Component Variants

**Priority:** 🟢 Low
**Estimated Effort:** 2-3 hours per component

**Components to enhance:**

- [ ] **Button variants** (ghost, link, icon-only)
- [ ] **Badge variants** (outline, subtle)
- [ ] **Alert variants** (warning, info, tip)
- [ ] **Card variants** (elevated, bordered, interactive)

**Current State:**

- Basic shadcn/ui components implemented
- Button has primary/secondary variants
- File: `web/src/components/ui/button.tsx`

---

### Iconography Consistency

**Priority:** 🟢 Low
**Estimated Effort:** 2-3 hours

**Tasks:**

- [ ] Audit all icon usage
- [ ] Standardize icon sizes (16px, 20px, 24px)
- [ ] Create icon component wrapper
- [ ] Document icon conventions

**Current State:**

- Using Lucide React icons
- Icons imported individually (good for tree-shaking)
- Sizes vary between components

---

## 📝 Documentation

### User Guide / Help Documentation

**Priority:** 🟡 Medium
**Estimated Effort:** 6-8 hours

**Content:**

- [ ] Getting started guide
- [ ] CSV import guide with examples
- [ ] BAS/FY reporting explained
- [ ] Recurring expenses guide
- [ ] Keyboard shortcuts reference (partially done in README)
- [ ] Troubleshooting common issues (partially done in README)
- [ ] Video tutorials (optional)

**Current State:**

- README has comprehensive setup and feature documentation
- Screenshots guide created in `docs/screenshots/README.md`

---

### Developer Onboarding

**Priority:** 🟢 Low
**Estimated Effort:** 3-4 hours

**Content:**

- [ ] Contributing guide (CONTRIBUTING.md)
- [ ] Code style guide (covered in CLAUDE.md and copilot-instructions.md)
- [ ] Component architecture patterns (covered in ARCHITECTURE.md)
- [ ] Testing guidelines (covered in TASKS-FRONTEND.md)
- [ ] PR template
- [ ] Issue templates

---

## 🔒 Security & Monitoring

### Security Hardening

**Priority:** 🟡 Medium
**Estimated Effort:** 4-6 hours

**Tasks:**

- [ ] Content Security Policy (CSP) headers
- [ ] Subresource Integrity (SRI) for CDN assets
- [ ] Security headers audit (X-Frame-Options, X-Content-Type-Options)
- [ ] OWASP Top 10 review
- [ ] Dependency vulnerability scanning (Snyk, npm audit)
- [ ] Rate limiting on API calls

**Current State:**

- ✅ AES-256-GCM encryption for sensitive fields
- ✅ No hardcoded secrets
- ✅ Input validation with class-validator
- ✅ Error handling doesn't leak sensitive data

---

### Error Tracking

**Priority:** 🟡 Medium
**Estimated Effort:** 3-4 hours

**Tools:**

- [ ] Sentry integration for frontend errors
- [ ] Error boundary with reporting
- [ ] Source map upload for production
- [ ] User context in error reports

**Current State:**

- ✅ App-level error boundary in place
- ❌ No external error tracking

---

### Usage Analytics (Privacy-Friendly)

**Priority:** 🟢 Low
**Estimated Effort:** 2-3 hours

**Scope:**

- [ ] Self-hosted analytics (Plausible, Umami)
- [ ] Page view tracking
- [ ] Feature usage metrics
- [ ] No personal data collection
- [ ] GDPR compliant

**Note:** For single-user personal tool, analytics may not be necessary.

---

## 🗂 Management

**Review Cadence:** Quarterly or based on user feedback

**Process:**

1. Review enhancements quarterly
2. Promote high-priority items to TASKS-FRONTEND.md when ready to implement
3. Archive completed items
4. Re-prioritize based on usage patterns and pain points

---

## 📌 Notes

- **All enhancements are optional** - Core functionality is production-ready (98%)
- **User experience** (daily use for 3-6 months) will drive prioritization
- **Effort estimates** are rough approximations
- **Dependencies** should be resolved before starting tasks
- **Reference TASKS-FRONTEND.md** for implementation patterns and completed examples

**Questions or suggestions?** Add items to this document via pull request or create an issue for discussion.
