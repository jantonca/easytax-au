# EasyTax-AU — Review of the Codex Repository Audit (Meta-Audit)

**Date:** 2026-09-26
**Subject:** `docs/audits/AUDIT-CODEX-2026-09-26.md`
**Baseline:** `main` @ `a9dc7fc`, working tree clean except the (then untracked) Codex report.

Independent verification of every Codex finding against source, re-execution of its
verification claims, and an ATO requirements review against primary ato.gov.au
sources (all fetched 2026-09-26). No source, schema, or Git changes were made
during the review.

## Overall verdict

**The Codex audit is high-quality and accurate.** All 15 findings (T01–T08,
I01–I06, S01) were independently confirmed against the code, and every entry in
its verification table reproduced exactly. It has one significant under-scoping
(I05 also affects the documented live LXC deployment path — see C01) and several
additional gaps recorded in section 3. Its remediation sequencing is endorsed,
with the corrections folded in (section 5).

## 1. Finding-by-finding verification

| ID | Codex severity | Verdict | Verification evidence |
|---|---|---|---|
| T01 Net Profit unreliable | High | **Confirmed** | `reports.service.ts:67` subtracts GST-inclusive `SUM(expense.amount_cents)` from GST-inclusive `SUM(income.total_cents)`. `biz_percent` is applied only to GST credits (`:172`, `:213`), never to deductions. `Category.isDeductible` is not referenced by any report/BAS query; Non-Deductible (personal) expenses flow fully into "Net Profit". Labels: `web/src/features/reports/components/fy-summary.tsx:95`, `src/modules/reports/pdf.service.ts:257`. Codex's $880-vs-$900 example is arithmetically correct under ATO apportionment (assessable income ex-GST $1,000; deductible business portion $200 × 50% = $100). |
| T02 GST registration not modelled | High | **Confirmed** | No GST-registration/business-profile concept exists anywhere in `src` or `web` (exhaustive grep). Income form auto-calculates 10% GST (`income-form.tsx:89-101`); 1B credits computed unconditionally (`bas.service.ts:272-291`). ATO: credits require GST registration; unregistered businesses must not charge GST nor claim credits; no credits for pre-registration purchases. |
| T03 Edit silently changes GST | High | **Confirmed** | The auto-calc effect in `income-form.tsx:89-101` has no edit-mode guard and runs on mount: opening a record with stored GST of $0 (or any non-10% value, e.g. GST-free) and saving an unrelated edit overwrites GST to 10% of subtotal. |
| T04 Explicit zero GST replaced | High | **Confirmed** | `csv-import.service.ts:276-278` treats `gstCents === 0` as "not provided" and auto-calculates 1/11 of the total. `csv-parser.service.ts:102` collapses omitted, empty, and *invalid* GST values to `0`. Invents credits on GST-free purchases (ATO excludes purchases without GST in the price from credits). |
| T05 1% → 100% | High | **Confirmed** | `csv-parser.service.ts:208-228`: strips `%`, then `num > 0 && num <= 1` → ×100. `"1%"` and `"1"` both parse as 100. Overclaims GST credits by 100×. |
| T06 Silent import data loss | High | **Confirmed (all six sub-claims)** | Parser-level drops never reach `results`, so `failedCount` stays 0 and `totalRows` counts only survivors: missing required fields (`csv-parser.service.ts:50`), vendor names containing "total" (`:122-129` — e.g. "Total Tools"), rows that throw (`:64-67`). `new Date(y, m-1, d)` normalises impossible dates such as 31/02 (`:145`, `:151-153`). Income importer: invalid/missing date → today (`income-csv-import.service.ts:166-167`); invalid amount → 0 (`:205-215`); currency parsed with `parseFloat` + `Math.round(x*100)` (`:211-215`), violating the project's integer-cents/MoneyService rule (AGENTS.md). Additional: negative totals (refunds/credits) are silently discarded (`csv-parser.service.ts:97`). |
| T07 In-file duplicates missed | High | **Confirmed** | Both importers check only the database per row (`csv-import.service.ts:259`, `:308-318`; `income-csv-import.service.ts:390`, `:461-488`) and bulk-insert after the loop (`:127-129`; `:281-283`). Identical rows in one file — including repeated invoice numbers — all pass with `duplicateCount: 0`. |
| T08 Default categories absent from G11 | High (full-BAS users) | **Confirmed** | Seeder labels every default operating category `'1B'` (`categories.seeder.ts:10-95`); the G11 query filters `category.bas_label = 'G11'` (`bas.service.ts:307-319`) → default G11 = $0 while 1B > 0 (internally inconsistent output). Codex's scoping is right: ATO defaults businesses with GST turnover < $10M to Simpler BAS (G1/1A/1B only), which the app computes label-independently — impact is confined to full-BAS reporters; for everyone else G10/G11 are misleading informational zeros. |
| Limitations table (cash-basis partial payments; expense-date proxy; FY report always invoice-date; `isPsiEligible` collected but unused; no asset register/depreciation; domestic-vs-international as the only GST rule; `fileRef` is a bare filename) | — | **All verified accurate** | `reports.service.ts:113-146` (no basis parameter); `isPsiEligible` referenced only in the clients module; no depreciation/asset code exists in the repo; `expense.entity.ts:88` (`varchar(255)` filename). |
| ATO-LOGIC.md doc errors (personal-expense GST credits; $1,000 threshold) | — | **Confirmed and strengthened** | See C06 for the current ATO positions. Evidence: `docs/core/ATO-LOGIC.md:182`, `:191-194`, `:148-149`, `:405`. |
| I01 Recurring generation duplicates | High | **Confirmed** | `recurring-expenses.service.ts:264-306`: expense save (`:285`) and schedule advance (`:288-295`) are separate non-transactional operations with no locking; generated expenses carry no reference to the template, so no unique occurrence identity exists. Concurrent calls duplicate the same occurrence. |
| I02 Undo fails for paid incomes | Medium | **Confirmed** | Create requires `paymentDate` when `isPaid` (`incomes.service.ts:54-58`); the undo recreate payload omits it (`use-income-mutations.ts:84-92`) → guaranteed 400 on restore of any paid income. |
| I03 CSV export corruption | Medium | **Confirmed** | `formatCents` emits `$1,000.00` (`web/src/lib/currency.ts:5-15`) and is used unescaped in export rows (`export-csv.ts:87-88`, `:129-131`) — embedded commas split fields. Income export has no `paymentDate` column (`:112-121`) despite cash-basis BAS depending on receipt dates. |
| S01 CSV formula injection | Medium | **Confirmed** | `escapeCsvField` (`export-csv.ts:24-37`) quotes only on comma/quote/newline; values starting with `=`, `+`, `-`, `@` pass through into spreadsheet cells. |
| I04 Report caches not invalidated | Medium | **Confirmed** | Full cross-grep of `queryKey` vs `invalidateQueries`: mutations invalidate `expenses`/`incomes`/`recurring-expenses`/`categories`/`clients`/`providers` only. `['bas', …]` (`use-dashboard-data.ts:30`), `['dashboard', …]`, `['bas-report', …]` (`use-bas-report.ts:18`), `['fy-report', …]` (`use-fy-report.ts:14`) are never invalidated. |
| I05 `/api` base breaks the frontend | High (Docker) | **Confirmed — and under-scoped** | `web/Dockerfile:43` and `docker-compose.yml:56` bake `VITE_API_URL=/api`; `new URL(path, '/api')` throws `TypeError: Invalid base URL` (`api-client.ts:15-19`, same pattern at `:239-242`, `:266-269`). The nginx `/api` proxy (`web/nginx.conf`) is correct — the JS throws before any fetch. **See C01: the live LXC path has the same defect.** |
| I06 Docker backup export broken | Medium | **Confirmed by configuration** | `docker-compose.yml:33` sets `IS_DOCKER=true`; `backup.service.ts:32-44` then runs `docker exec easytax-au-db pg_dump …` inside the API image (`node:22-alpine`, no Docker CLI, no `/var/run/docker.sock` mount). Not exercised in a container during this review. |
| Auth gap | High (known) | **Confirmed** | No identity/authorisation anywhere; `api-client.ts` sends `credentials: 'omit'`. Documented at `STATUS.md:21` and top of `NEXT-TASKS.md`. See C02 for the backup-endpoint aggravator. |
| Performance claims | — | **Confirmed** | `expenses.service.ts:106-111` / `incomes.service.ts:92` return all records with relations, unpaginated; `getRecentExpenses` downloads everything and slices 10 client-side (`api-client.ts:200-205`); imports issue one duplicate-check query per row; bulk UI actions fire one mutation per record (`expenses-page.tsx:118`, `:164`); encrypted columns force per-row decryption. |
| "Sound parts" | — | **Confirmed** | Integer-cent storage; decimal.js `MoneyService` (`money.service.ts:44-46`, `:73-76`); SQL aggregation in reports/BAS; date indexes (`expense.entity.ts:29-32`, `income.entity.ts:28-31`); `synchronize: false` + `migrationsRun: true` (`data-source.ts:27`, `database.config.ts:17`); AES-256-GCM field encryption with random 12-byte IV and 16-byte auth tag (`encrypted-column.transformer.ts`); 716 backend + 587 frontend unit tests. |

## 2. Verification claims — all reproduced

| Check | Codex claim | Re-run result (2026-09-26) |
|---|---|---|
| Backend unit tests (`pnpm run test`) | 716 passed, 28 suites | **Identical** |
| Frontend unit tests (`pnpm --filter web exec vitest run`) | 587 passed, 2 skipped, 60 files | **Identical** |
| Backend lint without autofix (`pnpm exec eslint "src/**/*.ts" "test/**/*.ts"`) | Passed | **Passed (exit 0)** |
| Frontend lint (`pnpm --filter web lint`) | Passed, 3 warnings | **Identical (3 `react-hooks/incompatible-library` warnings)** |
| Full backend `tsc --noEmit -p tsconfig.json` | 3 test-fixture errors | **Identical 3 errors** (`app.controller.spec.ts:45`, `csv-import.service.spec.ts:38`, `recurring-expenses.controller.spec.ts:90`); production sources clean |
| Dependency advisories | 2 moderate, dev-only (Vitest + mocker) | **Identical**: `pnpm audit` → 2 moderate via `web>vitest>@vitest/mocker` (GHSA-82fw-gwwq-j7x9); `pnpm audit --prod` → none |
| Node parity caveat | Ran on Node 24.21.0 vs required 22 | **Same environment**: `node -v` = v24.21.0; `engines` = `>=22 <23`; `.node-version` = 22; Node 22 not installed locally (installing deferred — audit is read-only) |

Codex's "synthetic probe" reproductions were re-derived from code reading rather
than re-executed; each derivation is recorded in section 1.

## 3. Corrections and gaps in the Codex audit

- **C01 — High: I05 also applies to the live homelab (LXC) deployment.**
  `scripts/setup-app-lxc.sh:141` and `docs/DEPLOYMENT-PROXMOX-LXC.md:541` write
  the same `VITE_API_URL=/api`, and the deployed `main` (`a15e5f4`, confirmed via
  `git show`) already contains the `new URL`-based client (introduced `bd219c2`,
  2026-01-01). Therefore either the live UI's API calls all throw, or the machine
  carries an undocumented hand-edited `web/.env` (config drift). `STATUS.md`
  records "frontend serving verified end to end", which cannot be reconciled with
  the repo state from here. **Requires live-host verification** (out of scope for
  a repo audit) before the next `update-app.sh` run, which would bake the broken
  value in either case. Codex scoped I05 to "Docker deployment" only.
- **C02 — Medium (aggravates the auth gap): unauthenticated full database dump.**
  `GET /backup/export` (`backup.controller.ts:18-19`) has no auth — only a
  3-per-5-minute throttle. Anyone on the LAN can exfiltrate the entire database,
  including the encrypted columns; field encryption provides no protection if the
  key (backed up off-box, "must never change" per `STATUS.md`) is later obtained.
- **C03 — Medium: BAS reporting method undeclared / hybrid label set.**
  GST-inclusive G1 is correct for Simpler BAS and for the calculation-worksheet
  method (ATO Step 1: the worksheet method *requires* GST-inclusive amounts at all
  labels; the accounts method requires indicating the GST-inclusive/exclusive
  choice). The worksheet method, however, also requires G12–G20, which the app
  does not produce; the accounts-method election is not surfaced. Output is a
  hybrid (Simpler-BAS labels + full-BAS G10/G11 without the chain), and the PDF
  titles itself "Business Activity Statement" (`pdf.service.ts:137`). It does
  disclose "(including GST)" per label (`:168`, `:216`). Fix: label the output as
  a Simpler BAS preparation summary, or complete the worksheet labels.
- **C04 — Low: no upload size limit** on the four CSV `FileInterceptor` endpoints
  (`csv-import.controller.ts:51`, `:201`, `:285`, `:431`) — multer defaults to
  unlimited; memory-DoS vector on an unauthenticated LAN API.
- **C05 — Low: accrual-basis edge case.** ATO accrual (non-cash) accounting
  attributes a sale to the *earlier of* invoice issuance or payment receipt; the
  app's ACCRUAL mode uses invoice date only (`bas.service.ts:209-212`).
  Prepayments received before invoicing are misattributed. Fits under the
  documented partial-payments limitation.
- **C06 — `docs/core/ATO-LOGIC.md` needs corrections beyond Codex's note**
  (verified against ato.gov.au, fetched 2026-09-26):
  - `:182`, `:191-194` — "personal expense → claim the GST at 1B" is wrong.
    Credits are excluded to the extent a purchase is private or domestic; only the
    business portion is claimable (apportion per BAS, or via the annual private
    apportionment election).
  - `:148-149`, `:179-181`, `:405` and `categories.seeder.ts:87` — "capital =
    > $1,000, depreciate not instant deduct" is outdated. The **$20,000 instant
    asset write-off** (aggregated turnover < $10M, simplified depreciation)
    applies for 2025–26 (Treasury Laws Amendment (Tax Incentives and Integrity)
    Act 2025) and is **permanent from 1 July 2026**; assets ≥ $20k go to the
    small business pool (15% first year, 30% thereafter); the low-value pool
    threshold itself rose from $1,000 to $20,000 on 2026-07-01. Car limit
    2025–26: $69,674.
  - The $1,000 G10/G11 split is a *concession* that applies only when
    capital/non-capital purchases are not recorded separately **and** GST
    turnover is expected < $1M (ATO Step 3). The app's explicit "Capital
    Purchases" category is the ATO-preferred "record separately" approach — the
    docs should say so instead of presenting $1,000 as the universal rule.
  - `:254-275` — PSI rules misstated. PSI is determined **per contract** (if
    > 50% of the contract income is for personal skills/efforts, all of that
    contract's income is PSI); the **80% rule** concerns PSI from *one client and
    its associates* (≥ 80% → PSI rules apply absent a Commissioner determination),
    not "80%+ of your income is PSI". PSB self-assessment: results test (≥ 75% of
    PSI) or another PSB test (unrelated clients / employment / business premises)
    plus passing the 80% rule. When the PSI rules apply, deductions are limited
    to employee-like ones (no residence rent/mortgage interest/rates, no payments
    to associates for non-principal work).
  - Missing substantiation rules relevant to this app: a **tax invoice is
    required to claim credits for purchases > $82.50** (GST-inclusive); a
    **4-year** credit time limit applies; credits require the supplier to be
    GST-registered (ABN Lookup); business records must be kept **5 years**.
  - BAS quarterly due dates in the doc (28 Oct / 28 Feb / 28 Apr / 28 Jul) are
    correct; "tax agent = usually +2 weeks" is imprecise (the ATO's extra two
    weeks applies to online lodgers; agent deferrals follow the lodger program).

## 4. ATO fitness assessment

The app's BAS *arithmetic* (1A/1B/net GST, GST-inclusive G1) is broadly aligned
with Simpler BAS for a GST-registered sole trader under $10M turnover, and the
cash-basis income attribution (post-M02) matches ATO cash accounting for sales.
It is **not yet fit for reliable tax preparation** for either target user
(GST-registered or not; employee-plus-freelancer or full-time), because:

1. It cannot represent a non-GST-registered business (T02) — the ATO treats
   registered and unregistered businesses oppositely on both charging GST and
   claiming credits.
2. Its annual "Net Profit" mixes GST-inclusive totals and ignores apportionment,
   deductibility, and capital/operating separation (T01) — it does not map to
   assessable income minus allowable deductions.
3. Imports can silently alter financial data (T04–T07), which undermines the
   "complete and accurate records" obligation and the 5-year substantiation
   position (tax invoices, receipt dates).
4. Depreciation is absent while its own docs give outdated capital-allowance
   guidance ($1,000 rule vs the permanent $20k IAWO) (C06).
5. PSI is collected but never assessed — the most common freelancer trap.
6. Cash-basis purchase attribution (expense-date proxy) and partial payments are
   documented limitations that remain non-conformant with ATO cash accounting
   for purchases.

## 5. Remediation plan (consolidated)

**P0 — Live deployment safety**
1. Verify the live LXC frontend against C01 (host `web/.env`, browser API calls)
   before any further update; record the result in the homelab inventory.
2. Fix `api-client.ts` URL resolution: accept a relative base (`/api`) and
   preserve a path-suffixed absolute base; single helper for all three call
   sites; unit + Playwright coverage of the deployed path.

**P0 — Stop financial data corruption (regression tests first, per AGENTS.md TDD)**
3. T03: preserve stored GST in edit mode; recalculate only on an intentional
   subtotal change.
4. T04: tri-state GST in both importers (missing → calculate; explicit 0 →
   keep 0; invalid → fail the row).
5. T05: strict percentage parsing — honour `%` notation, reject ambiguous
   `0 < n <= 1` bare numbers or define the convention explicitly.
6. T06: per-row result accounting for *every* input row (parser failures become
   row results, not silent drops); strict calendar validation (reuse
   `parseStrictDateOnly`); no today/zero substitution; drop the
   "total"-substring summary heuristic in favour of explicit summary-row
   handling; route income currency parsing through Decimal/MoneyService; decide
   refund/negative-row policy explicitly.
7. T07: in-batch duplicate detection (Set on the dedupe key) plus a single
   batched DB lookup; define concurrent-import behaviour.
8. I01: wrap generate-and-advance in one transaction; add a
   `(recurring_expense_id, occurrence_date)` unique identity (schema migration,
   reviewed per the migration rules in AGENTS.md).
9. I02: include `paymentDate` in the undo payload; define restoration for legacy
   paid-without-date records.
10. I03 + S01: machine-readable export amounts (cents or unformatted decimal,
    escaped), include `paymentDate`, and neutralise spreadsheet formula prefixes.
11. Post-fix: identify records damaged by the above paths; never auto-invent
    replacement dates, GST, or percentages.

**P1 — Tax model**
12. Business tax profile: GST registration + effective dates, accounting-basis
    elections (GST and income tax separately), Simpler vs full BAS, SBE/IAWO
    eligibility; apply consistently to entry, imports, and reports (T02).
13. FY report rebuild (T01): assessable income (ex-GST) − deductible expenses
    (business-use apportioned, `isDeductible` enforced) with capital separated
    into an asset register applying the $20k IAWO / small-business pool rules;
    surface unresolved adjustments rather than a bare "Net Profit".
14. T08: separate purchase classification (G10/G11) from the GST-credit label;
    reconcile existing category mappings (data migration + user review).
15. C03: declare the reporting method on BAS output/PDF.
16. PSI: implement the per-contract >50% determination, the 80% rule and PSB
    tests as a guided workflow, or explicitly label `isPsiEligible` advisory.
17. C06: correct `docs/core/ATO-LOGIC.md` and the seeder descriptions.
18. Substantiation: track tax-invoice-held status for purchases > $82.50 and
    receipt references with a 5-year retention view (extends the existing
    `fileRef` field).

**P1 — Security**
19. Authentication (already the project's #1 milestone), treating
    `/backup/export` as the highest-value endpoint (C02); HTTPS-only per
    `NEXT-TASKS.md`.
20. C04: upload size limits on all `FileInterceptor` endpoints.

**P2 — Performance and UX correctness**
21. Server-side pagination/filtering for expenses/incomes; a limited
    recent-expenses endpoint; batched import lookups (also fixes the per-row
    N+1 duplicate queries).
22. I04: invalidate `bas`, `bas-report`, `fy-report`, and `dashboard` keys from
    all financial mutations.
23. C05: accrual earlier-of rule once partial payments exist.

Schema changes and historical-data corrections require a verified database
backup and a reviewed migration/recovery plan first (per `STATUS.md` operating
notes); source-only fixes can be reviewed as ordinary diffs.

## 6. Execution constraints

**Checks run (read-only):** backend jest (no coverage), backend eslint without
`--fix`, web eslint, web vitest run (no coverage), full backend `tsc --noEmit`,
`pnpm audit` / `pnpm audit --prod`, read-only Git inspection, targeted source
review of every file cited by Codex.

**Deferred (writes, live resources, or mutations):** `pnpm run build` and
`tsc -b` (emit artifacts), Playwright e2e, backend DB integration
(`test:e2e` requires a disposable Postgres), any live-host inspection (requires
the proxmox-operations workflow), Node 22 installation for runtime parity,
lint with `--fix` (mutating by project note).

**Limitations:** the live LXC frontend's actual behaviour (C01) is unverified
from the repo; Codex's dynamic probes were re-derived statically; ATO pages
reflect their stated last-updated dates (Aug–Sep 2026) — year-specific
concessions must be re-checked each budget cycle.

## 7. Sources (all fetched 2026-09-26)

- ATO — Step 1: Sales (`…/completing-your-bas-for-gst/complete-your-bas/step-1-sales`)
- ATO — Step 3: Purchases, last updated 9 Sep 2026 (`…/complete-your-bas/step-3-purchases`)
- ATO — Step 4: Calculating purchases using the calculation worksheet (`…/complete-your-bas/step-4-calculating-purchases-using-the-calculation-worksheet`)
- ATO — Choosing an accounting method for GST (`…/accounting-for-gst-in-your-business/choosing-an-accounting-method`)
- ATO — Identify your accounting basis (`…/completing-your-bas-for-gst/identify-your-accounting-basis`)
- ATO — GST reporting methods (Simpler BAS default < $10M) (`…/gst-reporting-methods`)
- ATO — When you can claim a GST credit, last updated 14 Sep 2026 (`…/claiming-gst-credits/when-you-can-claim-a-gst-credit`)
- ATO — When you can't claim a GST credit (`…/claiming-gst-credits/when-you-cannot-claim-a-gst-credit`)
- ATO — Business or private? Check your GST credit claims (newsroom, 29 Jan 2026)
- ATO — Calculate your GST credits (annual private apportionment)
- ATO — Instant asset write-off for eligible businesses, last updated 28 Aug 2026
- ATO — $20,000 instant asset write-off for 2025–26 (newsroom)
- ATO — $20,000 Instant Asset Write-off (new legislation; permanent from 1 Jul 2026, 27 Aug 2026)
- ATO — $20,000 instant asset write-off (IAWO) here to stay (newsroom, 4 Sep 2026; low-value pool threshold $1,000 → $20,000)
- ATO — Guide to depreciating assets 2026 (legal database)
- ATO — Assets and exclusions (simplified depreciation; car limit $69,674 for 2025–26)
- ATO — Working out if the PSI rules apply / Self-assessing as a PSB / Results test / Unrelated clients test
- ATO — myTax 2025 Personal services income help (>50% per-contract PSI test)
- ATO — Business and professional items schedule, item P1 (PSI deductions)
- ATO — Overview of record-keeping rules for business (5-year retention)
- ATO — Due dates for lodging and paying your BAS, last updated 17 Sep 2026 (28 Oct / 28 Feb / 28 Apr / 28 Jul)

**Not verified:** live-host configuration and runtime behaviour (C01);
container-runtime behaviour of `/backup/export` (I06, configuration-confirmed
only); spreadsheet execution of injected formulas (S01).
