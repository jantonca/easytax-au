# /review - 5-Pillar Code Review

## Purpose
Comprehensive code review across 5 specialist domains: ATO Compliance, Security, Code Quality, Architecture, Performance.

## Context
Files to review: $ARGUMENTS

## Workflow

### 1. Read Files & Context
- Read all files specified in `$ARGUMENTS`
- Read related test files (`.test.ts`, `.spec.ts`)
- Check git diff if reviewing uncommitted changes: `git diff`

### 2. 5-Pillar Review Checklist

---

#### Pillar 1: ATO Compliance Auditor
**Read:** `docs/core/ATO-LOGIC.md`

**GST Calculations:**
- [ ] GST rate = 10% (total/11 for GST-inclusive)
- [ ] GST rounded to 2 decimal places (cents)
- [ ] GST amounts stored separately (not recalculated)
- [ ] BAS labels correct: G1, G10, G11, 1A, 1B

**Tax Year Logic:**
- [ ] Financial year = July 1 - June 30
- [ ] Quarter boundaries correct (Q1=Jul-Sep, Q2=Oct-Dec, Q3=Jan-Mar, Q4=Apr-Jun)
- [ ] Date comparisons use correct FY logic

**Forbidden Terms:**
- [ ] No "IRS", "sales tax", "W-2", "1040", "April 15"
- [ ] Use "GST" not "VAT" or "sales tax"
- [ ] Use "ABN" not "EIN" or "tax ID"

**Result:** [PASS / CONDITIONAL / FAIL]

---

#### Pillar 2: Security Engineer
**Read:** `docs/core/SECURITY.md`

**Field-Level Encryption:**
- [ ] PII encrypted at rest (ABN, business name if sensitive)
- [ ] Encrypted fields use `@Encrypted()` decorator
- [ ] No plaintext sensitive data in logs

**Input Validation:**
- [ ] All user inputs validated (DTO classes with `class-validator`)
- [ ] SQL injection prevention (TypeORM parameterized queries)
- [ ] XSS prevention (React auto-escapes, no `dangerouslySetInnerHTML`)

**Authentication/Authorization:**
- [ ] Protected routes check user authentication
- [ ] Business data scoped to authenticated user
- [ ] No hardcoded credentials or secrets

**Result:** [PASS / CONDITIONAL / FAIL]

---

#### Pillar 3: Code Quality Specialist

**Type Safety:**
- [ ] No `any` types (use `@shared/types` or create new types)
- [ ] No `@ts-ignore` or `@ts-expect-error` without justification
- [ ] Proper error handling (try/catch with typed errors)

**Currency Math:**
- [ ] All currency amounts as cents (integers)
- [ ] No `parseFloat()` for currency
- [ ] Math operations use integer arithmetic

**Code Cleanliness:**
- [ ] No `console.log` (use proper logger)
- [ ] No commented-out code
- [ ] No unused imports or variables
- [ ] Functions < 50 lines (refactor if longer)

**Testing:**
- [ ] Tests exist for new/modified code
- [ ] Tests cover edge cases (empty, null, invalid)
- [ ] Test coverage meets targets (see `/tdd`)

**Result:** [PASS / CONDITIONAL / FAIL]

---

#### Pillar 4: Architecture Consultant
**Read:** `docs/core/ARCHITECTURE.md`, `docs/core/PATTERNS.md`

**Frontend Patterns:**
- [ ] Components follow atomic design (atoms/molecules/organisms)
- [ ] Data fetching uses Tanstack Query (no raw `fetch`)
- [ ] Form state uses React Hook Form + Zod
- [ ] No prop drilling (use context or state management)

**Backend Patterns:**
- [ ] Controllers are thin (delegate to services)
- [ ] Services contain business logic
- [ ] No circular dependencies between modules
- [ ] DTOs for all API inputs/outputs

**Database:**
- [ ] Entity relationships correct (OneToMany, ManyToOne)
- [ ] Migrations created for schema changes
- [ ] Indexes on foreign keys and frequently queried columns

**Result:** [PASS / CONDITIONAL / FAIL]

---

#### Pillar 5: Performance Analyst

**Database Queries:**
- [ ] No N+1 queries (use `relations` in `find` options)
- [ ] Pagination for large datasets
- [ ] Indexes on filter/sort columns

**Frontend Optimization:**
- [ ] Memoization for expensive calculations (`useMemo`, `useCallback`)
- [ ] Code splitting for large components (`React.lazy`)
- [ ] Debounce/throttle for search inputs

**API Efficiency:**
- [ ] Batch operations where possible
- [ ] Caching for static/infrequent data
- [ ] Compression enabled (gzip)

**Result:** [PASS / CONDITIONAL / FAIL]

---

### 3. Consolidate Findings

## Output Format
```markdown
# Code Review: [Feature/File Name]

## Summary
**Overall Result:** [PASS / CONDITIONAL / FAIL]

**Files Reviewed:**
- `path/to/file1.ts`
- `path/to/file2.tsx`

---

## Pillar Results

| Pillar | Result | Critical Issues |
|--------|--------|----------------|
| ATO Compliance | [PASS/CONDITIONAL/FAIL] | [Count] |
| Security | [PASS/CONDITIONAL/FAIL] | [Count] |
| Code Quality | [PASS/CONDITIONAL/FAIL] | [Count] |
| Architecture | [PASS/CONDITIONAL/FAIL] | [Count] |
| Performance | [PASS/CONDITIONAL/FAIL] | [Count] |

---

## Critical Issues (Must Fix)
[List P0/P1 issues that block merge]

1. **[Pillar]**: [Issue description]
   - File: `path/to/file.ts:line`
   - Fix: [Recommendation]

---

## Recommendations (Should Fix)
[List P2 issues that improve quality]

1. **[Pillar]**: [Issue description]
   - File: `path/to/file.ts:line`
   - Fix: [Recommendation]

---

## Nice-to-Have (Optional)
[List P3 optimizations]

---

## Approval Status
- [ ] All critical issues resolved
- [ ] Tests pass: `pnpm --filter web test && pnpm run test`
- [ ] Lint passes: `pnpm --filter web lint && pnpm run lint`
- [ ] Ready to merge

**Next Steps:**
[If CONDITIONAL/FAIL, list required actions before approval]
```

## Guardrails
- **FAIL** if any P0 issue found (security vulnerability, incorrect tax logic)
- **CONDITIONAL** if P1 issues exist (missing tests, type safety issues)
- **PASS** only if all critical checks pass
- **FLAG** if reviewing encrypted field changes or schema migrations
