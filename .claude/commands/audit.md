# /audit - Full Codebase Health Check

## Purpose
Comprehensive codebase audit across all 5 specialist domains. Generates formal audit report.

## Context
Audit scope: $ARGUMENTS (default: full codebase)

## Workflow

### 1. Pre-Audit Setup
**Read existing audit reports:**
```bash
ls -lh docs/reports/audit/
```

**Check current version:**
- Read `package.json` (web & backend)
- Read `NEXT-TASKS.md` for version milestone

**Determine scope:**
- Full audit (all files)
- Incremental audit (since last report)
- Targeted audit (specific domain, e.g., "security only")

### 2. Execute 5-Domain Audit

---

#### Domain 1: ATO Compliance
**Read:** `docs/core/ATO-LOGIC.md`

**Scan files:**
```bash
# Find all tax calculation files
grep -r "gst" backend/src/ web/src/ --include="*.ts" --include="*.tsx"
grep -r "BAS" backend/src/ web/src/ --include="*.ts" --include="*.tsx"
```

**Audit checklist:**
- [ ] GST calculation correctness (total/11 for inclusive)
- [ ] BAS label accuracy (G1, G10, G11, 1A, 1B)
- [ ] Tax year logic (July 1 - June 30)
- [ ] Forbidden US tax terms check
- [ ] ABN validation logic

**Output:** List of compliance violations by severity (P0-P3)

---

#### Domain 2: Security
**Read:** `docs/core/SECURITY.md`, `docs/core/SCHEMA.md`

**Scan files:**
```bash
# Check for hardcoded secrets
grep -r "password\|secret\|api_key" backend/src/ web/src/ --include="*.ts" --include="*.tsx"

# Check encrypted fields
grep -r "@Encrypted" backend/src/entities/
```

**Audit checklist:**
- [ ] Field-level encryption on PII (ABN, sensitive business data)
- [ ] No hardcoded credentials
- [ ] Input validation on all DTOs
- [ ] Authentication guards on protected routes
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (no `dangerouslySetInnerHTML`)

**Output:** List of security vulnerabilities by severity (P0-P3)

---

#### Domain 3: Code Quality
**Run automated checks:**
```bash
# Frontend
pnpm --filter web lint
pnpm --filter web type-check
pnpm --filter web test --coverage

# Backend
pnpm run lint
pnpm run test --coverage
```

**Audit checklist:**
- [ ] No `any` types (scan with `grep -r ":\s*any" --include="*.ts"`)
- [ ] Currency as cents (scan for `parseFloat.*price|amount|gst`)
- [ ] Test coverage targets met (tax: 80%+, UI: 60%+, utils: 90%+)
- [ ] No `console.log` in production code
- [ ] Error handling patterns consistent

**Output:** Code quality metrics + violation list

---

#### Domain 4: Architecture
**Read:** `docs/core/ARCHITECTURE.md`, `docs/core/SCHEMA.md`

**Scan structure:**
```bash
# Backend modules
tree -L 2 backend/src/

# Frontend structure
tree -L 3 web/src/
```

**Audit checklist:**
- [ ] Backend: Thin controllers, business logic in services
- [ ] Frontend: Atomic design structure (atoms/molecules/organisms)
- [ ] No circular dependencies (check NestJS module imports)
- [ ] Database: Entity relationships correct, migrations exist
- [ ] Type generation synced (`@shared/types` matches backend DTOs)

**Output:** Architecture violations + refactor recommendations

---

#### Domain 5: Performance
**Scan for anti-patterns:**
```bash
# N+1 queries
grep -r "\.map.*await" backend/src/ --include="*.ts"

# Missing pagination
grep -r "\.find({" backend/src/ --include="*.ts"
```

**Audit checklist:**
- [ ] No N+1 database queries
- [ ] Pagination on large datasets
- [ ] Indexes on foreign keys and frequently queried columns
- [ ] Frontend: Memoization for expensive calculations
- [ ] API: Batch operations where applicable

**Output:** Performance bottlenecks + optimization recommendations

---

### 3. Generate Audit Report

**Create report file:**
```bash
# Filename: docs/reports/audit/vX.Y.Z-audit-YYYY-MM-DD.md
# Example: docs/reports/audit/v1.3.0-audit-2026-02-15.md
```

## Output Format
```markdown
# EasyTax-AU Audit Report: v[X.Y.Z]

**Audit Date:** YYYY-MM-DD
**Auditor:** Claude Code (Sonnet 4.5)
**Scope:** [Full Codebase / Incremental / Targeted]

---

## Executive Summary

**Overall Health:** [Excellent / Good / Fair / Poor]

**Critical Issues (P0):** [Count]
**High Priority (P1):** [Count]
**Medium Priority (P2):** [Count]
**Low Priority (P3):** [Count]

**Key Findings:**
- [Bullet points of most important discoveries]

---

## Domain Findings

### 1. ATO Compliance
**Status:** [PASS / CONDITIONAL / FAIL]

**Issues Found:**
| Severity | File | Line | Issue | Recommendation |
|----------|------|------|-------|----------------|
| P0 | `path/to/file.ts` | 123 | [Description] | [Fix] |

**Strengths:**
- [What's working well]

---

### 2. Security
**Status:** [PASS / CONDITIONAL / FAIL]

**Issues Found:**
[Same table format as above]

**Strengths:**
- [What's working well]

---

### 3. Code Quality
**Status:** [PASS / CONDITIONAL / FAIL]

**Test Coverage:**
- Frontend: X% (Target: 60%+)
- Backend: Y% (Target: 80%+)
- Critical paths: Z% (Target: 80%+)

**Issues Found:**
[Same table format as above]

**Strengths:**
- [What's working well]

---

### 4. Architecture
**Status:** [PASS / CONDITIONAL / FAIL]

**Issues Found:**
[Same table format as above]

**Strengths:**
- [What's working well]

---

### 5. Performance
**Status:** [PASS / CONDITIONAL / FAIL]

**Issues Found:**
[Same table format as above]

**Strengths:**
- [What's working well]

---

## Remediation Plan

### Immediate Actions (P0 - must fix before next release)
1. [Issue description + file + recommended fix]

### Short-Term (P1 - should fix in current sprint)
1. [Issue description + file + recommended fix]

### Medium-Term (P2 - plan for next version)
1. [Issue description + file + recommended fix]

### Long-Term (P3 - backlog)
1. [Issue description + file + recommended fix]

---

## Metrics Trends
[If previous audit exists, compare metrics]

| Metric | Previous | Current | Delta |
|--------|----------|---------|-------|
| Test Coverage | X% | Y% | +Z% |
| P0 Issues | A | B | -C |

---

## Recommendations

### Technical Debt
[List areas needing refactoring]

### Process Improvements
[Suggest guardrails, automation, documentation updates]

### Next Audit
**Recommended date:** [3 months from now]
**Focus areas:** [Based on current findings]

---

## Appendix

### Audit Methodology
- Static analysis tools: ESLint, TypeScript compiler
- Dynamic analysis: Test suite execution
- Manual review: Critical business logic files
- Documentation review: Compliance with CLAUDE.md, ARCHITECTURE.md

### Files Reviewed
[List of all files scanned, grouped by domain]
```

## Guardrails
- **NEVER** mark audit as PASS if any P0 issues exist
- **ALWAYS** save report to `docs/reports/audit/` with version + date
- **ALWAYS** compare with previous audit if one exists
- **FLAG** if test coverage drops below targets
- **FLAG** if P0 count increases since last audit

## Australian Domain Context
- GST rate: 10% (never changes, but verify calculations)
- BAS labels: G1, G10, G11, 1A, 1B (verify correct usage)
- Tax year: July 1 - June 30 (verify FY boundary logic)
- ABN: 11 digits, weighted checksum algorithm
