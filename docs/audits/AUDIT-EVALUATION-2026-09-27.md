# EasyTax-AU — Evaluation of the Codex Audit and the OpenCode Meta-Audit

**Date:** 2026-09-27
**Subjects:**
- `docs/audits/AUDIT-CODEX-2026-09-26.md` ("Codex")
- `docs/audits/AUDIT-OPENCODE-REVIEW-2026-09-26.md` ("OpenCode")

**Baseline:** `main` @ `a9dc7fc` (same commit both reports audited). The working tree was
clean apart from the two untracked reports and `docs/plans/`. No source, schema, or Git changes
were made.

## Verdict

**Codex is accurate.** I re-checked every finding (T01–T08, I01–I06, S01, the limitations
table, and the ATO-LOGIC note) against source, and all of them hold. Its severities are
defensible, with one exception: I01 (recurring duplicates) is Medium in practice, not
High. Its main weaknesses are coverage and traceability, not correctness:

- Its ATO citations have no URLs.
- It scoped I05 to Docker only.
- It missed several import-path defects of the same kind as the ones it did find (N01–N04 below).

**OpenCode is also accurate, and it adds real value.** It pins exact line ranges, adds the LXC
scope for I05 (C01) and the unauthenticated dump (C02), and makes the ATO-LOGIC corrections (C06). I
spot-checked its ATO claims against ato.gov.au (see Sources) and they hold. Its weaknesses:

- It endorsed all 15 Codex findings and every severity without challenging any of them.
- Its I05 fix plan undercounts the affected call sites ("all three" — there are nine).
- It did not re-execute the dynamic probes, which it discloses.
- It shares most of Codex's blind spots in the import path.

Both reports reach the right overall conclusion: fix data-corrupting paths first, then model the
tax profile, then rebuild the FY report. The consolidated plan in OpenCode §5 is a sound basis
for the plan, with the amendments in §5 of this document.

## 1. Method

- Read every file and line both reports cite, plus neighbouring code where a claim depended on
  control flow (for example callers, fallbacks, and alternative URL construction sites).
- Re-ran the verification table (§4) on this machine.
- Executed small, isolated probes for claims that can be checked without a database:
  - `parsePercentage` inputs;
  - `new URL()` with the relative `/api` base and a `/api`-suffixed absolute base.
- Verified OpenCode's most consequential ATO claims (IAWO permanence, low-value pool threshold,
  the G10/G11 $1,000 concession) against ato.gov.au via its search index.
- Not done:
  - no database, container, Playwright, or live-host checks;
  - no re-execution of the concurrency probe (I01);
  - no test of spreadsheet formula execution (S01).

## 2. Codex — finding-by-finding

| ID | Codex severity | My verdict | Notes |
|---|---|---|---|
| T01 Net Profit | High | **Correct** | `reports.service.ts:67-70` subtracts GST-inclusive `SUM(amount_cents)` from GST-inclusive `SUM(total_cents)`. `biz_percent` is applied only to GST (`:172`, `:213`). `isDeductible` is not read by any report. The $880 vs $900 example is arithmetically correct: income ex-GST is $1,000; deduction is (220 − 10 credit) × 50% = $100. |
| T02 GST registration | High | **Correct** | Nothing in `src/` or `web/src/` models registration. The income form auto-applies 10% GST. The 1B query is unconditional (`bas.service.ts:272-291`). |
| T03 Edit changes GST | High | **Correct** | `isGstManuallyEdited` starts `false` (`income-form.tsx:26`). The effect at `:89-101` runs on mount with the stored subtotal and overwrites the stored GST. This affects any non-10% record, not only $0. |
| T04 Explicit zero GST | High | **Correct** | Parser: `gstValue ? (parseCurrency ?? 0) : 0` (`csv-parser.service.ts:102`). Service: `gstCents === 0` → auto-calculate (`csv-import.service.ts:276-278`). Invalid GST text is treated the same way (it parses to `null`, which becomes 0 and then 1/11). |
| T05 1% → 100% | High | **Correct** | Probe: `1%`→100, `1`→100, `0.5%`→50. See N03 for further defects in the same function. |
| T06 Silent import loss | High | **Correct** | All six sub-claims hold (`csv-parser.service.ts:50-67`, `:122-129`, `:145/151`; `income-csv-import.service.ts:166-167`, `:205-215`). The ImportJob's `totalRows` also counts only rows that survived parsing (`csv-import.service.ts:103`). |
| T07 In-file duplicates | High | **Correct** | The duplicate check queries only the database (`:259`, `:308-318`), and the bulk insert happens after the loop (`:127-129`). See N04: the fix must account for the lossy duplicate key. |
| T08 G11 omission | High (full BAS) | **Correct, and understated** | The seeder assigns `'1B'` (`categories.seeder.ts:10-95`); the G11 query needs `'G11'`. The project's own `ATO-LOGIC.md:177-179` maps Software/Office Supplies to **G11**, so this is a code/doc divergence, not only a modelling gap. The seeder skips when any category exists (`:121`), so fixing it will not repair existing installs. |
| Limitations table | — | **Correct** | Checked: cash-basis expense proxy (`bas.service.ts:282` uses `expense.date`); FY report ignores basis; `isPsiEligible` is unused outside clients; no asset register exists. |
| ATO-LOGIC note | — | **Correct but incomplete** | `ATO-LOGIC.md:182` and `:191-194` are wrong. OpenCode C06 covers the fuller list. |
| I01 Recurring duplicates | High | **Correct mechanism; Medium severity** | `save(expense)` then `save(recurring)` runs without a transaction (`recurring-expenses.service.ts:285-295`). But generation is manual-only (`recurring-expenses.controller.ts:132`; there is no `@Cron`), and the button is disabled while pending (`generate-button.tsx:96,101`). A race needs two tabs or direct API calls. The more likely trigger is a failure between the two saves, which the same transaction fix covers. |
| I02 Undo paid income | Medium | **Correct** | `incomes.service.ts:54-58` rejects `isPaid` without `paymentDate`; the payload at `use-income-mutations.ts:84-92` omits it. |
| I03 CSV export | Medium | **Correct** | Amounts from `formatCents` are unescaped (`export-csv.ts:87-88`, `:129-131`), and there is no `paymentDate` column. |
| S01 Formula injection | Medium | **Correct**; Low–Medium in context | The realistic vector is imported bank/vendor text reaching a spreadsheet. The app is single-user and LAN-only. |
| I04 Cache invalidation | Medium | **Correct** | Only `categories`, `clients`, `expenses`, `incomes`, `providers`, and `recurring-expenses` are ever invalidated. |
| I05 `/api` base | High (Docker) | **Correct; under-scoped** | Probe: `new URL('/expenses','/api')` throws `Invalid URL`, and `new URL('/expenses','http://h/api')` resolves to `http://h/expenses`. It also affects LXC (OpenCode C01) and is only partial breakage (N05). |
| I06 Docker backup | Medium | **Correct (by configuration)** | `backup.service.ts:32-44` runs `docker exec` inside a `node:22-alpine` image that has no Docker CLI and no mounted socket. |
| Auth / deps / perf / "sound parts" | — | **Correct** | `pnpm audit` → 2 moderate (GHSA-82fw-gwwq-j7x9, dev-only); `--prod` → none. |

### Codex — quality assessment

**Strengths**
- It found no false positives.
- It separates "confirmed" from "configuration-confirmed" and "not exercised".
- It states its environment limits: Node 24 vs 22, and a 403 from the ATO site.
- It frames the audit around the user's actual profiles (employee plus freelancer; registered and
  unregistered).
- Its remediation order is right (repair corrupting paths before adding features).
- It explicitly refuses to back-fill invented GST, dates, or percentages into historical data.

**Weaknesses**
1. **Its citations do not resolve.** "ATO deduction guidance", "ATO exclusions", "ATO PSI guidance"
   and similar references carry no URL. The links were apparently lost when the report was
   rendered to Markdown. A tax-correctness audit whose tax sources cannot be followed is weaker
   than it needs to be. OpenCode §7 partly repairs this.
2. **Coverage stops at the first defect per function.** It found T05 in `parsePercentage` but not
   NaN or silent clamping (N03). It found T06 in the importers but not the category fallback (N02)
   or the missing income import-job linkage (N01).
3. **I05 was scoped to Docker**, although `scripts/setup-app-lxc.sh:141` writes the same value for
   the documented live deployment.
4. **Severity inflation on I01** (see table).
5. **One method is unexplained.** Codex ran frontend tests "through an in-memory loader
   adjustment" and does not say what that was. This is moot, because a plain `vitest run`
   reproduces its numbers.
6. **Minor:** it embeds an absolute home-directory path to a Codex skill. That is not a secret,
   but it is machine-specific noise in a committed document.

## 3. OpenCode — evaluation

### 3.1 Verification of its verification

Every line range in OpenCode's §1 table matches the source at `a9dc7fc`. Its §2 re-run table is
reproduced exactly (§4 below). It discloses that Codex's dynamic probes were re-derived statically
rather than re-executed. That is honest, but it means the headline "all 15 independently
confirmed" rests on code reading for I01 and I06.

### 3.2 Its corrections (C01–C06)

| ID | Verdict | Notes |
|---|---|---|
| C01 LXC also affected | **Correct and valuable** | Confirmed at `setup-app-lxc.sh:141` and `DEPLOYMENT-PROXMOX-LXC.md:541`; the `new URL` client dates from `bd219c2` (2026-01-01). **Missed nuance:** 6 of the 9 `VITE_API_URL` call sites use string concatenation (the import hooks, the BAS PDF, and `use-import-jobs`). Those work with `/api`. A `/api` build therefore breaks the dashboard and CRUD while imports and the BAS PDF still work. That is a plausible way a smoke test recorded as "frontend serving verified end to end" could pass. The live-host check it recommends remains necessary. |
| C02 Unauthenticated dump | **Correct; slightly understated** | It frames the risk around the encryption key. But only descriptive text and client identity fields are encrypted. Amounts, GST, dates, and business-use percentages are plain integer/date columns, readable from the dump without any key. |
| C03 BAS method undeclared | **Reasonable** | This is a labelling and product-honesty issue, not an arithmetic defect. Medium is acceptable. |
| C04 No upload limit | **Correct** | No `limits` are set on the `FileInterceptor` endpoints. Low is correct for a LAN-only, single-user app. |
| C05 Accrual earlier-of rule | **Correct** | The ATO non-cash basis uses the earlier of invoice and payment. Deferring it until partial payments exist is right. |
| C06 ATO-LOGIC corrections | **Verified on the points I checked** | ato.gov.au confirms: the $20k IAWO is permanent from 1 July 2026; the low-value pool threshold is $1,000 → $20,000 from 1 July 2026; assets ≥ $20k go to the small business pool (15% then 30%); the G10/G11 $1,000 split applies only when purchases aren't recorded separately **and** GST turnover is < $1M. I did not independently re-verify the PSI, tax-invoice ($82.50), or 4/5-year claims; they match long-standing ATO rules. |

### 3.3 Weaknesses

1. **It challenged nothing.** A meta-audit that agrees with 15 of 15 findings and every severity
   has not really tested the severities. I01's rating needed a look at the trigger path, which is
   manual-only with the UI guarded.
2. **Remediation step 2 undercounts the I05 fix** ("single helper for all three call sites"). The
   helper must replace nine `VITE_API_URL` read sites across six files. Otherwise the
   `/api`-suffixed absolute-base case stays inconsistent between modules.
3. **It shares Codex's import-path blind spots.** N01–N04 are in the same files it read line by
   line.
4. **One plan step leans on a defective mechanism.** Step 11 ("identify records damaged") relies
   on import-job rollback, which is a no-op for incomes (N01). The related
   `docs/plans/AI-STATEMENT-RECONCILIATION.md` creates only expenses, so it is affected by N07
   (undo drops `importJobId`), not N01 (corrected 2026-09-27).
5. **Minor:** ATO sources are given as path fragments, not full URLs.

## 4. Verification re-run (2026-09-27, Node v24.21.0 — same parity caveat as both reports)

| Check | Result | Matches Codex/OpenCode |
|---|---|---|
| `pnpm run test` | 716 passed, 28 suites | Yes |
| `pnpm --filter web exec vitest run` | 587 passed, 2 skipped, 60 files | Yes |
| `pnpm exec tsc --noEmit -p tsconfig.json` | 3 errors: `app.controller.spec.ts:45`, `csv-import.service.spec.ts:38`, `recurring-expenses.controller.spec.ts:90` | Yes |
| `pnpm audit` / `--prod` | 2 moderate (GHSA-82fw-gwwq-j7x9) / none | Yes |

Lint was not re-run; both reports agree on it and it adds nothing here. I did not run builds, e2e,
database integration, or Node 22 checks.

## 5. Findings missed by both reports

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| **N01** | **Medium** | **Income imports cannot be rolled back.** The income importer creates an ImportJob but never links incomes to it: `_importJobId` is unused, and the source comment says so. `rollback()` deletes only expenses, then marks the job `ROLLED_BACK` and returns `deletedCount: 0`. The user is told the import was reverted while every income remains. | `income-csv-import.service.ts:359`, `:445`; `import-jobs.service.ts:149-166` |
| **N02** | **Medium** | **Silent category misclassification on expense import.** When no category matches, the importer tries a keyword substring match, then `'other'`, then `categories[0]`. No `Other` category is seeded, so unmatched rows land in whichever category the database returns first. Keyword matching can also route rows into *Capital Purchases* (G10) or *Non-Deductible*. None of this is reported as a warning. It directly feeds T01/T08 errors. | `csv-import.service.ts:224-245` |
| **N03** | Low–Medium | **`parsePercentage` has more defects than T05.** `parseFloat` never throws, so the `catch` is dead code: non-numeric input (`"abc"`) returns `NaN`. That goes into an `integer` column, which (by inference, not executed) fails the **whole** bulk transaction. Values above 100 are silently clamped to 100, and `"0.5%"` becomes 50. | `csv-parser.service.ts:208-228`; probe output |
| **N04** | Medium (design) | **The duplicate key is lossy.** Expense duplicates are keyed on `(date, amount, provider)`, so two genuine same-day identical purchases are treated as duplicates of each other. A naive in-batch `Set` fix for T07 would extend that false positive to rows within a file. T07 should flag in-file matches for review, or use a source transaction reference, rather than drop them. | `csv-import.service.ts:308-318` |
| **N05** | — (I05 scope) | **I05 is partial breakage, and the fix touches nine sites.** Three sites use `new URL` (`api-client.ts:19`, `:242`, `:269`) and six use concatenation (`use-csv-import.ts:27`, `use-csv-preview.ts:26`, `use-income-csv-import.ts:27`, `use-income-csv-preview.ts:28`, `use-import-jobs.ts:18`, `bas-report-page.tsx:31`). | grep of `VITE_API_URL` |
| **N06** | Low | **Dead code calls a non-existent route.** `ImportHistory` / `useImportJobs` fetch `/import/jobs`, but the backend route is `/import-jobs`. The component is not mounted anywhere, so this is latent. It will 404 if it is wired up, for example by the reconciliation plan. | `use-import-jobs.ts:19`; `import-jobs.controller.ts:25` |
| **N07** | Low | **Expense undo loses import linkage.** The restore payload drops `importJobId` (and `currency`), so a restored imported expense escapes any later rollback of its job. | `use-expense-mutations.ts:84-93` |

## 6. Recommended amendments to OpenCode's consolidated plan (§5)

1. **P0 step 2 (I05):** replace all nine `VITE_API_URL` read sites with one `apiUrl(path)` helper,
   and test both a relative `/api` base and an absolute base with a path suffix.
2. **P0, new step (N01):** add `import_job_id` to `incomes` via a reviewed migration, and make
   `rollback()` delete both kinds. Until then, have `rollback()` refuse income jobs rather than
   report success. This is a prerequisite for OpenCode step 11. It would only
   block `AI-STATEMENT-RECONCILIATION.md` if that plan reconciled incomes: the
   plan creates expenses, and expense rollback works (corrected 2026-09-27).
3. **P0 step 6 (T06):**
   - Add N02: an unmatched category becomes a row error or an explicit "needs review" result,
     never `categories[0]`.
   - Add N03: reject non-numeric or out-of-range percentages as row errors.
4. **P0 step 7 (T07):** design the in-file duplicate rule with N04 in mind: flag rather than drop
   same-key rows, unless a source transaction ID is available.
5. **P0 step 8 (I01):** keep the transaction plus a unique occurrence identity, but treat it as
   Medium. Order it after the silent-data-loss import fixes, not before them.
6. **P1 step 14 (T08):** the fix direction is already documented in `ATO-LOGIC.md:177-179`
   (G11). Ship it as a data migration: the seeder never re-runs on existing databases.
7. **P1 step 19 (C02):** record that amounts and dates in a dump are plaintext, so encryption
   does not mitigate `/backup/export` exposure.
8. **Housekeeping:** add full ATO URLs to the Codex report (or cite OpenCode §7), and remove or
   fix the dead `ImportHistory` component (N06) before the reconciliation plan builds on import
   history.

## 7. Sources

ATO pages checked 2026-09-27 via ato.gov.au search results. Direct page retrieval was not
attempted, following Codex's reported 403.

- [$20,000 instant asset write-off (IAWO) here to stay](https://www.ato.gov.au/businesses-and-organisations/small-business-newsroom/20000-instant-asset-writeoff-iawo-here-to-stay) — permanent from 1 Jul 2026; low-value pool $1,000 → $20,000
- [$20,000 Instant Asset Write-off (new legislation)](https://www.ato.gov.au/about-ato/new-legislation/in-detail/businesses/20000-dollars-instant-asset-write-off)
- [Instant asset write-off for eligible businesses](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/depreciation-and-capital-expenses-and-allowances/simpler-depreciation-for-small-business/instant-asset-write-off)
- [Small business pool calculations](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/depreciation-and-capital-expenses-and-allowances/simpler-depreciation-for-small-business/small-business-pool-calculations)
- [Step 3: Purchases](https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/in-detail/managing-gst-in-your-business/reporting-paying-and-activity-statements/completing-your-bas-for-gst/complete-your-bas/step-3-purchases) — G10/G11 $1,000 split only if not recorded separately and GST turnover < $1M; amounts GST-inclusive
