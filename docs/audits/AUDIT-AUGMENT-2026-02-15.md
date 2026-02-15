# EasyTax-AU — Architecture + ATO (GST/BAS) Audit (Augment)

**Date:** 2026-02-15

## Scope & posture assumptions
- Reviewed core docs: `docs/core/ATO-LOGIC.md`, `docs/core/SCHEMA.md`, `docs/core/SECURITY.md`, `docs/core/BACKUP.md`, plus key NestJS modules (BAS, CSV import, expenses, reports, backup).
- **Current deployment posture:** “local-network trusted” (LAN / private container network). 
- **Target posture (future):** “self-contained secured app” (built-in authn/z + safer defaults).

## Executive summary
EasyTax-AU has a strong local-first base (Postgres + Docker, cents-as-integers, modular NestJS design, encrypted columns). However, there are **two critical blockers** affecting correctness and data safety:

1) **CRITICAL correctness:** `bizPercent` is applied twice for imported expenses (once at import-time, again at report/BAS query-time) → **systematically understates claimable GST (BAS 1B)**.
2) **CRITICAL security (if port reachable):** `/backup/export` returns full DB SQL dump and appears **unauthenticated**. Even in “trusted LAN”, this is a high-value exfil endpoint.

## Critical vulnerabilities (priority)
### P0 — Fix immediately
- **Double application of business-use % (`bizPercent`)** for expense GST/amounts (import vs reporting).
- **Unauthenticated DB export endpoint** (`GET /backup/export`).

### P1 — Next
- **Rounding inconsistency** between app logic (`Decimal.round`) and SQL aggregation (`FLOOR`) → cent-level drift and systematic under-claim in some paths.
- **BAS scope mismatch:** docs mention **G10/G11** but service outputs appear limited to **G1/1A/1B**.

### P2 — Roadmap
- GST treatment oversimplified (domestic vs international only).
- Cash vs accrual BAS basis not modeled.
- PSI tracking flag present but not used in reporting/warnings.

## Pillar 1 — Logic & compliance (“ATO check”)
### 1) **CRITICAL:** `bizPercent` double-applied (import + BAS/Reports)
- **Observed pattern:** CSV import stores `amountCents` and `gstCents` already reduced by `bizPercent`, while BAS/Reports compute claimable GST using `gst_cents * biz_percent / 100` again.
- **Impact:** If biz use is 50%, claimable GST can become ~25% of original instead of 50%.
- **Required decision (canonical model):**
  - **Recommended:** Store *full* `amountCents` + *full* `gstCents` (tax invoice values); apply `bizPercent` **only when deriving** claimable GST / deductible amounts.
  - Alternative: store already-adjusted values and never re-apply in queries (but then `bizPercent` becomes informational only).
- **Data repair:** If imports already happened, you likely need a one-off migration/repair strategy.

### 2) BAS mapping completeness
- Docs define G1, 1A, 1B and also G10/G11 (capital/non-capital purchases).
- Implementation appears to return only G1/1A/1B. Decide whether to:
  - implement G10/G11 in `BasService` + API DTO, or
  - explicitly document them as out-of-scope.

### 3) GST treatment model is too coarse
- `provider.isInternational` is not enough to model:
  - **Input-taxed** (no GST credit),
  - **GST-free** domestic,
  - **out-of-scope** amounts,
  - mixed/partial credit scenarios beyond business-use %.
- Recommend a per-transaction `gstTreatment` (e.g., `TAXABLE | GST_FREE | INPUT_TAXED | OUT_OF_SCOPE`) or `gstRate` + flags.

### 4) BAS accounting basis (cash vs accrual)
- Many small AU businesses report BAS on **cash basis**. Current income model includes `isPaid`, but BAS logic should be able to switch basis.
- Recommend setting: `basAccountingBasis = CASH | ACCRUAL`.

### 5) PSI readiness
- `Client.isPsiEligible` exists, but there’s no PSI-focused reporting/warnings (80% rule, deductions restrictions, alerts).

## Pillar 2 — Security & data sovereignty
### 1) **CRITICAL:** backup export endpoint (exfil risk)
- `/backup/export` serves a full SQL dump; throttling exists but **auth guard not evident**.
- **Local-network trusted mitigation (minimum):** bind API to localhost/private interface, firewall, or reverse-proxy with auth.
- **Future self-contained posture:** require authn/z; treat backup export as admin-only, optionally disabled by default.

### 2) Encryption at rest
- AES-256-GCM encrypted columns are a good baseline.
- Risks/improvements:
  - plaintext fallback behavior can allow “silently unencrypted” values to persist if formatting doesn’t match.
  - consider explicit version/prefix (e.g., `enc:v1:`) + logging/metrics for plaintext reads.

### 3) Data sovereignty
- Local Postgres is aligned with data sovereignty.
- Backups: ensure encrypted-at-rest wherever they’re stored, and test restores.

## Pillar 3 — Code quality & architecture
- Strengths: modular NestJS layout; Money handling in cents; shared API typing via OpenAPI output.
- Key issues:
  - rounding rule divergence (app vs SQL) should be standardized.
  - currency parsing inconsistencies between import pipelines (Decimal vs `parseFloat`/`Math.round`).
  - duplicate detection heuristics likely produce false positives (same date/provider/amount subscriptions).

## Pillar 4 — DevOps & resilience
- Strengths: Dockerized; DB persistence via volume; healthchecks present; non-root API container.
- Improvements:
  - pin toolchain versions (e.g., avoid `pnpm@latest` in builds).
  - document and periodically run restore drills.
  - consider container resource limits for Proxmox/LXC.

## Refactoring roadmap
### Phase 0 (stop-the-bleeding)
- Fix canonical `bizPercent` handling + repair existing data.
- Protect `/backup/export` (network restriction now; auth guard later).
- Align rounding logic (remove/replace `FLOOR` if not intended).

### Phase 1 (compliance uplift)
- Add `gstTreatment` / GST-free / input-taxed modeling.
- Implement (or formally defer) BAS G10/G11.
- Add BAS accounting basis (cash vs accrual).

### Phase 2 (product hardening)
- Built-in authn/z with local admin.
- Better duplicate fingerprinting.
- ABN validation and “GST-registered” toggle.

## Key code pointers (for follow-up fixes)
- CSV expense import: `src/modules/csv-import/csv-import.service.ts`
- BAS calculations: `src/modules/bas/bas.service.ts`
- Backup export endpoint: `src/modules/backup/backup.controller.ts`
- Money rounding/utilities: `src/common/services/money.service.ts`

