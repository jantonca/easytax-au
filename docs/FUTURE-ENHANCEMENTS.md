# Future Enhancements: EasyTax-AU

**Purpose:** This document tracks features, improvements, and nice-to-have enhancements that are not critical for the current production release but would improve the user experience in future iterations.

**Project Status:** see `STATUS.md` (current state) and `NEXT-TASKS.md` (active backlog). Audit remediation from `docs/audits/` and authentication come before anything here. Completed items are moved to `docs/archive/completed-enhancements.md`.

**Last Updated:** 2026-09-27 (completed items archived; statuses re-pointed at NEXT-TASKS.md)

---

## 🎯 When to Revisit These Enhancements

- After 3-6 months of daily use to identify pain points
- When specific features are repeatedly requested
- When technical debt becomes a blocker
- When dependencies are updated (e.g., React Router v7 stable)

---

## 📊 Enhancement Categories

- [Audit-Identified Enhancements (P2)](#audit-identified-enhancements-p2)
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

## 🔍 Audit-Identified Enhancements (P2)

**Source:** Consolidated audit (`docs/archive/audits-2026-02/AUDIT-FINAL-2026-02-15.md`)
**Priority:** 🟡 Medium (nice-to-have improvements, not blockers)

These items were identified during the audit process as potential enhancements but are not critical for production use. They represent opportunities for future refinement.

---

### P2-3: GST Treatment Model

**Current State:** Binary model supports only `domestic` (10% GST) vs `international` (0% GST). Does not model GST-free domestic supplies, input-taxed supplies, or mixed-rate scenarios.

**Recommendation:** Add a `gstTreatment` enum to expenses (`TAXABLE | GST_FREE | INPUT_TAXED | OUT_OF_SCOPE`) for future flexibility.

**Context:** Low priority because current binary model is correct for the typical freelancer use case (target user). Only matters for complex supply types.

**Effort:** 4-6 hours (requires schema migration)

**2026-09 update:** the 2026-09-26 audits (T02, GST eligibility limitation) make this part of the P1 "business tax profile" work in `NEXT-TASKS.md`; it is no longer low priority for non-GST-registered users.

---

### P2-4: Authentication System

**Current State:** Entire API has no authentication. By design for LAN deployment (Docker on Proxmox LXC, single user).

**Context:** Not needed for current deployment. Would be a blocker for any internet-facing deployment.

**Recommendation:** If internet exposure is planned, add a simple local-admin auth system (e.g., session-based with a single admin password). Do not over-engineer for a single-user tool.

**Priority:** P2 for current posture (LAN-only). Would be P0 if internet-facing.

**Effort:** 6-8 hours (simple session auth)

**2026-09 update:** promoted: authentication is the top security item in `NEXT-TASKS.md` (P1), with `/backup/export` the highest-value endpoint to protect.

---

## 🎨 UX Polish & Interactions

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
**Reference:** See PATTERNS.md for inline editing implementation patterns

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

## ♿ Accessibility

### F3.4.3: Screen Reader Testing

**Priority:** 🔴 High (Deferred for now as we don't currently have access to screen reader software,)
**Estimated Effort:** 4-6 hours (manual QA)
**Reference:** See v1.0-CHANGELOG.md for existing implementation patterns
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

### Advanced Filtering

**Priority:** 🟡 Medium
**Estimated Effort:** 6-8 hours
**Status:** Last open v1.3.0 item; deferred until audit remediation and auth land (see NEXT-TASKS.md)

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
- [ ] Testing guidelines (see PATTERNS.md for conventions)
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
2. Promote high-priority items to NEXT-TASKS.md when ready to implement
3. Archive completed items
4. Re-prioritize based on usage patterns and pain points

---

## 📌 Notes

- **All enhancements are optional** - correctness gaps found by the 2026-09-26 audits are tracked in `NEXT-TASKS.md`, not here
- **User experience** (daily use for 3-6 months) will drive prioritization
- **Effort estimates** are rough approximations
- **Dependencies** should be resolved before starting tasks
- **Reference PATTERNS.md** for implementation patterns and conventions

**Questions or suggestions?** Add items to this document via pull request or create an issue for discussion.
