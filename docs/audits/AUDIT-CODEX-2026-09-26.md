# EasyTax-AU — Repository Audit (Codex)

**Date:** 2026-09-26

I assessed it for both employment plus freelance work and full-time sole traders, including GST-registered and non-registered users.

The audit covered main at `a9dc7fc`: backend, frontend, database models and migrations, imports, reports, security, deployment configuration, and existing audit records. No source, schema, or Git changes were made.

## Tax correctness

The most important findings concern tax correctness.

### T01 — High · Confirmed: annual “Net Profit” is not a reliable tax-preparation figure

The report subtracts gross expenses from GST-inclusive income. It does not apply business-use percentages to expense deductions, exclude non-deductible categories, or separate capital purchases from ordinary deductions. The UI and PDF nevertheless present the result as “Net Profit.”

A synthetic example reproduced this:

| GST-registered business; ordinary deductible expense | Amount |
| --- | --- |
| Sale, including $100 GST | $1,100 |
| Expense, including $20 GST; 50% business use | $220 |
| App’s reported profit | $880 |
| Business profit after the relevant GST and business-use adjustments | $900 |

ATO guidance distinguishes deductible expenditure from claimable GST and limits mixed-use deductions to the business portion. ATO deduction guidance, ATO GST treatment examples.

**Action:** separate bookkeeping totals, GST credits, deductible operating expenses, capital expenditure, and tax adjustments. **Evidence:** `src/modules/reports/reports.service.ts:67`.

### T02 — High · Confirmed functionality gap: GST registration is not modelled

The app has no business GST-registration setting or effective dates. Income entry automatically calculates 10% GST, and expense reporting calculates claimable credits regardless of the business’s registration status.

This prevents dependable support for the non-registered freelancer use case. ATO examples explicitly distinguish non-registered businesses, which cannot claim GST credits, from registered businesses. ATO guidance.

**Action:** introduce an explicit business tax profile and apply registration status consistently to entry, imports, and reports. **Evidence:** `web/src/features/incomes/components/income-form.tsx:88`, `src/modules/bas/bas.service.ts:274`.

### T03 — High · Confirmed: editing an income can silently change its GST

Opening an existing income with a $100 subtotal and $0 GST runs the automatic calculation and changes the form to $10 GST. Saving an unrelated edit can therefore change both income and BAS totals.

I reproduced the form effect using synthetic values and mocked hooks.

**Action:** preserve stored GST when opening an existing record; recalculate only following an intentional relevant change. **Evidence:** `web/src/features/incomes/components/income-form.tsx:90`.

### T04 — High · Confirmed: expense imports replace explicit zero GST

Importing a domestic expense of $110 with GST explicitly set to 0 produces $10 GST. The parser and import service conflate “GST omitted” with “GST is zero.”

This can invent credits for purchases with no GST, such as purchases from unregistered suppliers. ATO guidance excludes purchases without GST from GST-credit claims. ATO exclusions.

**Action:** preserve zero; distinguish missing, invalid, and explicitly supplied GST. **Evidence:** `src/modules/csv-import/csv-import.service.ts:276`.

### T05 — High · Confirmed: 1% business use imports as 100%

The percentage parser removes %, then treats any number between zero and one as a fractional percentage. My probe confirmed that 1% becomes 100%.

**Action:** distinguish percentage notation from fractional notation and reject ambiguous or invalid inputs. **Evidence:** `src/modules/csv-import/csv-parser.service.ts:208`.

### T06 — High · Confirmed: imports can silently lose or alter financial data

Reproduced behaviours include:

- Invalid expense rows disappear without increasing the failure count.
- Vendor names containing “total” are treated as summary rows and discarded.
- Impossible calendar dates are normalised instead of rejected.
- Invalid income dates become today.
- Invalid income amounts become zero.
- Income currency parsing uses floating-point arithmetic instead of `MoneyService`.

In one four-row expense probe, the response reported two successful rows and zero failures, with the other two rows absent.

**Action:** retain a result for every input row, validate strictly, and require explicit correction before insertion. **Evidence:** expense parser (`src/modules/csv-import/csv-parser.service.ts:31`), income parser (`src/modules/csv-import/income-csv-import.service.ts:140`).

### T07 — High · Confirmed: duplicate detection misses duplicates within the same import

Both importers check existing database records before performing their bulk insert. They do not check records already accepted from the current file.

Two identical rows passed with `duplicateCount: 0`. The same problem affects repeated invoice numbers within an income import.

**Action:** detect duplicates within each batch and define safe behaviour for concurrent imports. **Evidence:** expense import (`src/modules/csv-import/csv-import.service.ts:259`), income import (`src/modules/csv-import/income-csv-import.service.ts:390`).

### T08 — High for full-BAS users · Confirmed: default categories are omitted from G11

Default operating categories—including Software, Internet, and Office Supplies—are seeded with `basLabel: '1B'`. The G11 calculation includes only categories explicitly labelled G11.

Consequently, ordinary expenses entered using the default categories do not contribute to G11.

**Action:** separate purchase classification from GST-credit calculation and reconcile existing category mappings. **Evidence:** `src/modules/categories/categories.seeder.ts:10`, BAS query (`src/modules/bas/bas.service.ts:307`).

### Existing limitations relevant to the intended users

Several existing limitations also matter directly to your intended users.

| Area | Current limitation and consequence |
| --- | --- |
| Cash-basis BAS | Receipt dates now correctly drive fully paid income, but partial payments are unsupported. Expenses still use expense date as a payment-date proxy. These are documented limitations, not newly discovered regressions. |
| Annual accounting basis | The FY report always uses invoice dates. Selecting CASH for BAS does not change the yearly report. GST and income-tax accounting methods need separate treatment; ATO guidance explicitly distinguishes them. ATO accounting guidance |
| Personal services income | A client has an `isPsiEligible` flag, but reports do not use it. There is no implemented PSI/PSB assessment or corresponding deduction handling. This is particularly relevant to professional freelancing. ATO PSI guidance |
| Capital assets | There is no asset register, depreciation calculation, or year-specific eligibility handling. Buying equipment cannot automatically be treated as an ordinary annual deduction. |
| GST eligibility | Supplier location is used as the main GST rule. The app cannot reliably distinguish taxable, GST-free, input-taxed, and non-creditable transactions, or establish tax-invoice eligibility. |
| Supporting records | A receipt filename reference is not a managed receipt archive. Records and substantiation need an explicit workflow, even if documents remain outside the app. |

The internal tax reference also needs correction. It says personal expenses can generate GST credits and presents $1,000 as a general capital/operating threshold. Those are unsafe general rules. The ATO’s $1,000 BAS concession has specific conditions; it is not a universal asset-deduction rule. **Evidence:** `docs/core/ATO-LOGIC.md:182`, ATO BAS instructions.

## Implementation, security, and reliability

Implementation, security, and reliability findings follow.

| ID / severity | Finding, evidence, and recommended action |
| --- | --- |
| I01 — High | Recurring generation can duplicate expenses. Saving an expense and advancing its schedule are separate operations without a transaction or locking. Two concurrent synthetic calls generated the same occurrence twice. Use an atomic transaction and a unique occurrence identity. Service (`src/modules/recurring-expenses/recurring-expenses.service.ts:285`) |
| I02 — Medium | Undo fails for paid incomes. The recreate payload omits `paymentDate`, which the create endpoint requires for paid records. Preserve receipt dates and define restoration for legacy paid records. Undo payload (`web/src/features/incomes/hooks/use-income-mutations.ts:84`) |
| I03 — Medium | CSV exports corrupt larger amounts and omit receipt dates. A reproduced eight-column income export produced ten fields because `$1,000.00` was unquoted. Income exports also omit `paymentDate`. Export machine-readable amounts with consistent escaping and preserve essential accounting fields. Exporter (`web/src/lib/export-csv.ts:112`) |
| S01 — Medium | CSV formula injection is possible. User-controlled text such as `=1+1` passes through into exported spreadsheet cells. Apply spreadsheet-safe text handling. I confirmed the generated CSV; spreadsheet execution was not tested. Escaping (`web/src/lib/export-csv.ts:24`), OWASP explanation |
| I04 — Medium | Report caches are not invalidated after financial mutations. Income/expense mutations invalidate their lists, but not BAS, FY reports, or dashboard summaries. Users can see old totals after saving changes. Invalidate all affected summaries. Mutation hooks (`web/src/features/incomes/hooks/use-income-mutations.ts:24`) |
| I05 — High for Docker deployment | The configured API URL breaks the frontend. Docker supplies `/api`, but `new URL(path, baseUrl)` rejects that relative base. An absolute base ending `/api` also loses the prefix when path starts `/`. Both behaviours were reproduced. Centralise URL resolution and test the deployed path. API client (`web/src/lib/api-client.ts:16`), Docker default (`web/Dockerfile:43`) |
| I06 — Medium, configuration-confirmed | Docker backup export has missing prerequisites. It invokes `docker exec` inside the API container, but the supplied image/configuration provides neither the Docker CLI nor daemon access. Prefer a PostgreSQL client connecting to the database service. This endpoint was not exercised in a container. Backup service (`src/modules/backup/backup.service.ts:32`) |

Authentication remains a known High-priority security gap: the application has no identity or authorisation checks. Anyone able to reach the API can access or change its records. Encryption at rest does not protect those API operations. This is already documented in `STATUS.md:21`; I did not inspect the live network.

The refreshed dependency audit found two moderate entries representing one development-only advisory, affecting Vitest and its mocker. No high or critical entries were reported. The applicable advisory describes a development-server file-read issue; I found no evidence of that vulnerable integration in the production app. Maintainer advisory.

Performance has identifiable scaling limits, but I have not measured production latency.

Expense and income endpoints return all records with relations. The dashboard downloads all expenses to show ten. Imports make sequential duplicate queries per row, while frontend bulk operations issue one mutation per selected record.

These patterns increase database work, decryption, payload size, and browser processing as records accumulate. Prioritise server-side pagination/filtering, a limited recent-expenses query, and batched import lookups after the correctness repairs. **Evidence:** expense listing (`src/modules/expenses/expenses.service.ts:106`), dashboard retrieval (`web/src/lib/api-client.ts:200`).

The sound parts are worth retaining: modular NestJS services, integer-cent storage, Decimal-based core money calculations, SQL aggregation, date indexes, migration-managed schema, authenticated field encryption, and substantial automated tests.

## Verification

Verification results and limits:

| Check | Result |
| --- | --- |
| Backend unit tests | 716 passed, 28 suites |
| Frontend unit tests | 587 passed, 2 skipped, 60 files |
| Backend lint without autofix | Passed |
| Frontend lint | Passed; 3 warnings |
| Backend production-source type check | Passed |
| Frontend application/configuration type checks | Passed |
| Broader backend type check including tests | Failed: 3 test-fixture typing errors |
| Synthetic defect probes | Reproduced the import, report arithmetic, recurring concurrency, edit-form, CSV, and URL behaviours above |
| Dependency advisory refresh | 2 moderate development entries |

Checks ran with the installed Node 24.21.0, while the project requires Node 22. This limits production-environment parity. Frontend tests used the existing configuration through an in-memory loader adjustment; no configuration file was edited.

Production builds, database integration, application Playwright flows, restore testing, and live performance were not rerun. The audit skill (`~/.codex/skills/repo-maintenance-audit/SKILL.md`) explicitly says to defer “builds, code generation, coverage output” and startup that can run migrations; I used no-emit checks and isolated synthetic probes.

ATO research was performed on 26 September 2026. Direct retrieval and the isolated browser both received 403 responses, so the tax references above rely on retrieved ATO search-index content. I cannot claim complete verification against every current ATO rule, particularly changing year-specific concessions.

## Recommendation

My recommendation is to repair the financial data and annual-report logic before adding more features.

Fix T03–T07 and I01–I03 with regression tests first. Then identify potentially affected existing records; do not automatically invent replacement dates, GST, or percentages.

Define the supported tax profiles: GST registration and effective dates, separate accounting bases, business-use allocation, PSI review, and asset treatment.

Rework annual reports and category mappings, and make unsupported cases visible.

Complete authentication, deployment fixes, and report-cache invalidation.

Validate on Node 22 using the project’s lint, unit-test, and build commands, followed by database integration and Playwright tests against a disposable database.

Schema changes and historical-data corrections need a verified database backup and a reviewed migration/recovery plan. Source-only fixes can be reviewed as ordinary diffs.

For both of your target users, the right first deliverable is a reconciled freelance business tax-preparation report with clear supporting records and unresolved adjustments. The current report does not yet provide that reliably.
