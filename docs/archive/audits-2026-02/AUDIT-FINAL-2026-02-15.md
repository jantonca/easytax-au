# EasyTax-AU Consolidated Audit Report

**Date:** 2026-02-15
**Auditor:** Claude Opus 4.6 (Consolidation of Claude Sonnet 4.5 + GPT-5.2 audits)
**Scope:** Full codebase verification of critical claims from competing audits
**Method:** Every critical claim independently verified against source code with line-number evidence

---

## 1. Executive Summary

| Category | Verdict | Grade | Notes |
|----------|---------|-------|-------|
| **ATO Compliance** | CONDITIONAL PASS | 7/10 | bizPercent double-application bug confirmed in CSV import path |
| **Security** | PASS WITH NOTES | 7/10 | No auth, but deployment posture is LAN-only; encryption solid |
| **Code Quality** | PASS | 8/10 | Clean architecture, good patterns, minor rounding inconsistency |
| **Production Readiness** | CONDITIONAL | -- | One data-correctness bug must be fixed before relying on BAS numbers |

**Overall Grade: B+ (85/100)**

The application is well-architected with correct GST formulas and solid encryption. However, one confirmed correctness bug (bizPercent double-application for CSV-imported expenses) means BAS 1B figures will be wrong for any imported expense with bizPercent < 100. This is fixable and scoped to a single code path.

---

## 2. Critical Claim Verification (Ground Truth)

Before prioritizing issues, here is the factual verdict on each disputed claim between the two audits.

### Claim 1: bizPercent Double-Application

**Verdict: TRUE -- Confirmed Bug**

**Evidence:**

The CSV import service applies bizPercent to both `amountCents` and `gstCents` before storing:

```
File: src/modules/csv-import/csv-import.service.ts
Lines 278-285:

    const bizPercent = row.bizPercent;
    const adjustedAmount = this.applyBizPercent(row.totalCents, bizPercent);
    const adjustedGst = this.applyBizPercent(gstCents, bizPercent);

    const expenseData: Partial<Expense> = {
      ...
      amountCents: adjustedAmount,   // <-- ALREADY reduced by bizPercent
      gstCents: adjustedGst,         // <-- ALREADY reduced by bizPercent
      bizPercent: bizPercent,         // <-- Still stores the original percentage
      ...
    };
```

Then the BAS service applies bizPercent again at query time:

```
File: src/modules/bas/bas.service.ts
Line 192:

    .select('COALESCE(SUM(FLOOR(expense.gst_cents * expense.biz_percent / 100)), 0)', 'gstPaid')
```

And the Reports service does the same:

```
File: src/modules/reports/reports.service.ts
Line 172:

    .select('COALESCE(SUM(FLOOR(expense.gst_cents * expense.biz_percent / 100)), 0)', 'gstPaid')
```

**Impact calculation:** For an expense with $10.00 GST at 50% business use:
- CSV import stores: gstCents = 500 (already halved), bizPercent = 50
- BAS query computes: 500 * 50 / 100 = 250 (halved again)
- **Result:** $2.50 claimed instead of correct $5.00 -- a 50% understatement

**Contrast with manual expense creation** (`expenses.service.ts` lines 83-93): The manual path stores the FULL amountCents and gstCents, and sets bizPercent. This is the correct pattern. Only the CSV import path has the bug.

**Scope:** This bug ONLY affects CSV-imported expenses where bizPercent < 100. Manually created expenses are correct.

---

### Claim 2: Unauthenticated Backup Endpoint

**Verdict: PARTIALLY TRUE -- Correct observation, but missing deployment context**

**Evidence:**

```
File: src/modules/backup/backup.controller.ts
Lines 1-57:

    @Controller('backup')
    export class BackupController {
      @Get('export')
      @Throttle({ default: { limit: 3, ttl: 300000 } })
      async exportDatabase(...) { ... }
    }
```

There is no `@UseGuards(AuthGuard)` on the controller or method. There is no `AuthGuard` anywhere in the codebase -- grep confirms only `ThrottlerGuard` exists as a global guard:

```
File: src/app.module.ts
Lines 66-68:

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
```

**However**, this application has NO authentication system at all. It is designed as a single-user, LAN-deployed tool (Docker on Proxmox LXC). The backup endpoint is no more or less "unprotected" than every other endpoint in the application. Calling it out as a special vulnerability overstates the issue -- the entire API is unauthenticated by design.

**Risk assessment:** Low for current deployment (LAN-only, single user). Medium if the app is ever exposed to the internet. Rate limiting (3 per 5 min) provides minimal abuse protection.

---

### Claim 3: Rounding Inconsistency (Decimal.round vs SQL FLOOR)

**Verdict: TRUE -- Minor inconsistency, low practical impact**

**Evidence:**

The MoneyService uses `Decimal.round()` which rounds to nearest (half-up by default):

```
File: src/common/services/money.service.ts
Line 111:

    return amount.times(percentage).round().toNumber();
```

The BAS and Reports SQL queries use `FLOOR()` which always rounds down:

```
File: src/modules/bas/bas.service.ts
Line 192:

    FLOOR(expense.gst_cents * expense.biz_percent / 100)
```

**Impact:** For a single expense, the difference is at most 1 cent. For example:
- gst_cents = 1001, biz_percent = 50
- `Decimal.round()`: 1001 * 50 / 100 = 500.5 -> 501 (rounds up)
- `FLOOR()`: 1001 * 50 / 100 = 500.5 -> 500 (rounds down)

Over many expenses, this creates a systematic 0-1 cent per transaction under-claim in SQL. For an application with hundreds of transactions per quarter, the drift is negligible (likely under $1 total), but it is technically an inconsistency.

**Note:** Using FLOOR for tax calculations is actually the more conservative (taxpayer-safe) approach. The ATO will never penalize you for under-claiming GST. This is arguably the correct choice for the SQL path.

---

### Claim 4: BAS G10/G11 Missing from Implementation

**Verdict: PARTIALLY TRUE -- By design, not a bug**

**Evidence:**

The documentation (`docs/core/ATO-LOGIC.md` lines 75-76) defines G10 and G11:
```
| G10 | Capital Purchases     | Purchases of business assets > $1,000 |
| G11 | Non-Capital Purchases | Operating expenses < $1,000           |
```

The BAS DTO (`src/modules/bas/dto/bas-summary.dto.ts`) only returns G1, 1A, 1B, and Net GST. No G10/G11 fields exist.

**However**, the data model supports G10/G11:
- Categories have `basLabel` field (see `src/modules/categories/entities/category.entity.ts` line 29)
- The seeder creates a "Capital Purchases" category with `basLabel: 'G10'` (see `src/modules/categories/categories.seeder.ts` line 85)
- The Reports service already groups expenses by category with basLabel (see `src/modules/reports/reports.service.ts` lines 201-233)

The BAS DTO header comment explicitly states: "This contains the key fields needed for **Simpler BAS** reporting" (line 6). Under the ATO's Simpler BAS system, small businesses only need to report G1, 1A, and 1B. G10/G11 are only required for full BAS reporters.

**Verdict:** This is a deliberate scope decision (Simpler BAS only), not a missing feature. The data is available via the Reports service for anyone who needs G10/G11 breakdowns. Adding G10/G11 to the BAS DTO would be a nice enhancement but is not required for correctness.

---

## 3. Prioritized Issues

### P0 -- Fix Immediately

#### P0-1: bizPercent Double-Application in CSV Import

**File:** `src/modules/csv-import/csv-import.service.ts` lines 278-285

**Problem:** CSV import pre-adjusts amountCents and gstCents by bizPercent before storing, but the BAS and Reports services apply bizPercent again at query time. This causes systematic under-claiming of GST for all CSV-imported expenses where bizPercent < 100.

**Fix (recommended approach):** Store FULL amounts in the CSV import path, matching the manual expense creation pattern:

```typescript
// Lines 282-286 should become:
const expenseData: Partial<Expense> = {
  date: row.date,
  amountCents: row.totalCents,       // Store FULL amount (not adjusted)
  gstCents: gstCents,                // Store FULL GST (not adjusted)
  bizPercent: bizPercent,             // bizPercent applied only at query time
  ...
};
```

Also remove lines 279-280 (the `applyBizPercent` calls) and the private `applyBizPercent` method (lines 305-308) if it is no longer used elsewhere.

**Data repair:** If CSV imports with bizPercent < 100 have already been performed, existing data needs correction. A migration script should:
1. Find expenses with `importJobId IS NOT NULL AND bizPercent < 100`
2. Reverse the pre-application: `amountCents = amountCents * 100 / bizPercent`, same for gstCents
3. Verify with a spot-check against original CSV data

**Severity:** P0 (data correctness -- produces incorrect BAS figures)

---

### P1 -- Fix Before Full Production Reliance

#### P1-1: Encryption Fallback Returns Plaintext Silently

**File:** `src/common/transformers/encrypted-column.transformer.ts` lines 87-91

**Problem:** If encrypted data does not match the `iv:authTag:ciphertext` three-part format, the transformer silently returns the raw database value as plaintext. This could mask data corruption or key rotation issues.

```typescript
const parts = value.split(':');
if (parts.length !== 3) {
  return value;  // Silent fallback to plaintext
}
```

**Fix:** Log a warning or throw, depending on whether legacy plaintext data needs to be supported:
- If legacy data exists: log a warning and return value (current behavior, but add logging)
- If no legacy data: throw an error to surface corruption immediately

**Severity:** P1 (security hygiene -- silent failures are dangerous)

#### P1-2: Test Coverage Unverified

**Evidence:** 31 backend spec files and 162 frontend test files exist, but no coverage report has been generated to verify the claimed targets (80% critical paths, 60% UI, 90% pure functions).

**Fix:** Run `pnpm --filter web test -- --coverage` and `pnpm run test -- --coverage` to generate reports. If coverage falls short, prioritize tests for:
1. `MoneyService` (pure functions, target 90%+)
2. `BasService` and `ReportsService` (critical paths, target 80%+)
3. `CsvImportService` (the bizPercent bug should have been caught by a test)

**Severity:** P1 (quality assurance -- tests exist but coverage is unproven)

---

### P2 -- Roadmap Items

#### P2-1: Rounding Inconsistency (Decimal.round vs FLOOR)

**Files:** `src/common/services/money.service.ts` line 111 vs `src/modules/bas/bas.service.ts` line 192

**Problem:** MoneyService uses banker's rounding (round half-up) while SQL queries use FLOOR. Maximum drift is 1 cent per transaction.

**Recommendation:** Standardize on FLOOR in both paths for consistency and tax-conservatism. Alternatively, document the intentional use of FLOOR in SQL as the authoritative calculation method for BAS/Reports.

**Severity:** P2 (cosmetic -- under $1 total drift per quarter, taxpayer-safe direction)

#### P2-2: BAS DTO Missing G10/G11 Fields

**File:** `src/modules/bas/dto/bas-summary.dto.ts`

**Problem:** Only Simpler BAS fields (G1, 1A, 1B) are returned. Full BAS reporters need G10/G11.

**Recommendation:** Add optional G10/G11 fields to the BAS DTO, populated from the category basLabel grouping that already exists in the Reports service. This is an enhancement, not a bug fix.

**Severity:** P2 (feature gap -- only needed for full BAS reporters, not Simpler BAS)

#### P2-3: GST Treatment Model is Binary

**Problem:** The current model only supports `domestic` (10% GST) vs `international` (0% GST). It does not model GST-free domestic supplies, input-taxed supplies, or mixed-rate scenarios.

**Recommendation:** Add a `gstTreatment` enum to expenses (`TAXABLE | GST_FREE | INPUT_TAXED | OUT_OF_SCOPE`) for future flexibility. Low priority because the current binary model is correct for the typical freelancer use case (the target user).

**Severity:** P2 (feature gap -- only matters for complex supply types)

#### P2-4: No Authentication System

**Problem:** The entire API (including backup export) has no authentication. This is by design for LAN deployment but would be a blocker for any internet-facing deployment.

**Recommendation:** Not needed for current deployment. If internet exposure is planned, add a simple local-admin auth system (e.g., session-based with a single admin password). Do not over-engineer this for a single-user tool.

**Severity:** P2 for current posture (LAN-only). Would be P0 if internet-facing.

#### P2-5: Cash vs Accrual BAS Basis

**Problem:** BAS queries include all income regardless of payment status. Many small AU businesses report on cash basis (only count income when received).

**Evidence:** The Income entity has an `isPaid` field, so the data is available. The BAS service does not filter by it.

**Recommendation:** Add a `basAccountingBasis` setting (CASH | ACCRUAL) and filter income queries accordingly in BasService.

**Severity:** P2 (compliance enhancement -- important for cash-basis reporters)

---

## 4. Code Quality Assessment

### Strengths

1. **Clean architecture**: NestJS modules are well-separated with proper dependency injection. Direct repository injection in BAS/Reports avoids circular dependencies.

2. **Correct GST formula**: The core `total / 11` calculation in MoneyService is mathematically correct and uses Decimal.js for precision.

3. **Cents-as-integers**: All monetary values stored as integer cents, eliminating floating-point errors at the storage layer.

4. **Strong encryption**: AES-256-GCM with unique 12-byte IV per encryption, 16-byte auth tag. Cryptographically sound.

5. **Type safety**: Shared types generated from OpenAPI, TypeScript strict mode, no `any` types found in core modules.

6. **Australian tax correctness**: FY quarters (Jul-Jun), GST terminology, BAS labels all correct. No US tax assumptions found.

### Weaknesses

1. **Inconsistent bizPercent handling**: CSV import path vs manual creation path handle bizPercent differently (the P0 bug).

2. **No integration tests for the import-to-BAS pipeline**: The double-application bug would have been caught by a test that imports a CSV with bizPercent < 100 and then generates a BAS summary.

3. **Silent encryption fallback**: Could mask data corruption without any logging.

---

## 5. Production Readiness Checklist

| Item | Status | Notes |
|------|--------|-------|
| GST calculation (1/11) | PASS | Verified in MoneyService |
| BAS quarter date ranges | PASS | Q1-Q4 mapped correctly to Jul-Jun |
| BAS G1/1A/1B calculations | CONDITIONAL | Correct formulas, but 1B affected by P0 bug for imported data |
| Manual expense creation | PASS | Stores full amounts, bizPercent applied at query time |
| CSV expense import | FAIL | Stores pre-adjusted amounts (P0 bug) |
| Encryption at rest | PASS | AES-256-GCM, proper IV handling |
| Data sovereignty (local-first) | PASS | No external API calls, self-hosted Postgres |
| Rate limiting | PASS | Global ThrottlerGuard + per-endpoint overrides |
| Docker deployment | PASS | Multi-stage build, non-root user, health checks |
| Backup export | PASS (with caveat) | Works, but no restore documentation |
| Test suite exists | PASS | 31 backend + 162 frontend test files |
| Test coverage verified | UNVERIFIED | No coverage report generated |

---

## 6. Recommendations

### Immediate (before trusting BAS numbers)

1. **Fix the bizPercent double-application** in `csv-import.service.ts`. This is the only true correctness bug found.
2. **Write a regression test** that imports a CSV with bizPercent=50, then calls `BasService.getSummary()` and verifies the 1B amount is correct.
3. **Audit existing imported data** -- if any CSV imports with bizPercent < 100 have been performed, the stored amounts need correction.

### Short-term (1-2 weeks)

4. **Add logging to encryption fallback** (or throw if no legacy plaintext data exists).
5. **Generate and review test coverage reports** for MoneyService, BasService, CsvImportService.

### Medium-term (1-3 months)

6. **Standardize rounding** (FLOOR everywhere for tax calculations).
7. **Add G10/G11 to BAS DTO** (if full BAS reporting is needed).
8. **Add cash-basis BAS option** (filter by isPaid).

### Not recommended (avoid overengineering)

- **Full auth system** -- not needed for LAN-only single-user tool
- **Input-taxed/GST-free modeling** -- overkill for freelancer use case
- **E2E test suite with Playwright** -- nice to have but low ROI for a personal tax tool
- **PWA/offline support** -- the app requires Postgres, so offline mode is not meaningful
- **WCAG AAA compliance** -- AA is sufficient for a personal tool

---

## 7. Audit Comparison: Where Each Audit Was Right and Wrong

| Claim | Sonnet Audit | GPT-5.2 Audit | Ground Truth |
|-------|-------------|---------------|--------------|
| bizPercent double-application | MISSED | CORRECT | True bug (P0) |
| Unauthenticated backup endpoint | Not flagged | OVERSTATED | Whole API is unauthenticated by design; backup is no special case |
| Rounding inconsistency | Not flagged | CORRECT (but severity overstated) | True but negligible (P2) |
| G10/G11 missing | Flagged as depreciation gap | CORRECT observation, WRONG severity | By design (Simpler BAS scope) |
| Encryption fallback | CORRECT | CORRECT | Both audits agree (P1) |
| Overall grade | A- (92/100) | Implied C+ (two "critical blockers") | B+ (85/100) -- one real bug, one overstated |

The Sonnet audit was too optimistic by missing the bizPercent bug. The GPT-5.2 audit correctly identified it but overstated the backup endpoint issue (framing an unauthenticated endpoint as special when the entire API is unauthenticated). The true state is between the two: one real P0 bug that is easily fixable, solid architecture otherwise.

---

**Audit Complete**
**Signed:** Claude Opus 4.6 (Consolidated Verification)
**Date:** 2026-02-15
