# Independent review of September maintenance remediation

Review date: 2026-09-11. Baseline: local `main`, HEAD `3f87068`.
Scope: current tracked and untracked remediation files against
`docs/prompts/opencode-maintenance-remediation.md` and the executor's report.

**Decision: changes requested. Do not accept or deploy this checkout.**
There is useful implementation work, but the outstanding work is not limited
to starting a disposable database. Both production builds fail, backend lint
fails, and payment-date and packaging defects remain.

This review added only this report. It did not modify implementation files,
install dependencies, mutate Git, start a database, run migrations, or deploy.
Test/build artifacts were generated. Existing `STATUS.md` was preserved.

## Findings

### R01 — High: backend production build fails in the changed PDF endpoint

Location: `src/modules/reports/reports.controller.ts:142-143`.

`basis?: string` precedes required `res: Response`, causing TS1016: “A required
parameter cannot follow an optional parameter.” Independently reproduced with
`pnpm run build` (exit 1), and directly with the installed Nest CLI. This is
independent of the database and generated shared types. The reported final
backend build success does not describe this checkout.

Fix the signature while preserving optional query behaviour and update callers.
Require a passing production build, not just unit tests.

### R02 — High: entity changes have no migration and shared contracts remain stale

Locations: `src/modules/incomes/entities/income.entity.ts:97`,
`src/migrations/`, `shared/types/api.d.ts`,
`web/src/features/reports/bas-report-page.tsx:25`.

The entity now maps `payment_date`, but only the initial migration exists.
With synchronization disabled, applying the checked-in migrations cannot create
the column. Income queries against that schema will reference a missing column.
The generated types are unchanged; frontend TypeScript compilation fails with
four TS2339 errors for the new unreconciled fields.

The executor disclosed these omissions. They are acceptance blockers, rather
than completed implementation awaiting optional verification. Generate and
review the additive migration against a disposable baseline database; validate
up/down/reapply; start the migrated backend and regenerate shared types; then
complete both builds and integration checks.

### R03 — High: the web Docker builder loses workspace dependency links

Location: `web/Dockerfile:31-37`; `.dockerignore:3`.

The dependency stage installs both workspace packages, but the builder copies
only `/app/node_modules`. pnpm puts frontend package links and executable
wrappers in `/app/web/node_modules`; that directory is neither copied from the
dependency stage nor available from the source context (`**/node_modules` is
excluded). Installed-tree inspection confirms React and the Vite executable are
under `web/node_modules`, not the root equivalents. The frontend build cannot
resolve its dependency graph in this stage even after type regeneration.

Copy `/app/web/node_modules` from the dependency stage too, preserving the root
virtual store, or build in a stage that retains the entire installed workspace.
Validate an actual clean image build. Finding established by COPY paths and
installed layout; no Docker image was built during this review.

### R04 — High: null bypasses the required receipt date on unpaid-to-paid updates

Location: `src/modules/incomes/incomes.service.ts:193-214`.

`setsPaymentDate` tests only for `undefined`. The actual ValidationPipe accepts
`{ isPaid: true, paymentDate: null }` because the optional DTO validation skips
null. The service then treats the date as supplied and saves an unpaid income
as paid with a null date. A caller can also clear an already known paid date.

Independently reproduced by running the repository's ValidationPipe with
`UpdateIncomeDto`, then `IncomesService.update` with a synthetic unpaid entity
and mocked persistence. The result was `isPaid: true, paymentDate: null`.
This defeats the intended distinction between imported/legacy unknown dates
and newly marked-paid incomes.

Require a real validated date for the transition; define and enforce whether
an existing known date may be cleared. Add HTTP regressions for explicit null.
Also make create reject an unpaid payload carrying a date: it currently silently
discards that contradictory date instead of applying update's rejection policy.

### R05 — High: CSV receipt parsing silently changes calendar dates

Location: `src/modules/csv-import/income-csv-import.service.ts:240-259`.

`Date.UTC` normalizes impossible dates instead of rejecting them. Directly
reproduced: `2026-06-31` and `31/06/2026` both become `2026-07-01`. This changes
the quarter and financial year used for cash reporting. The Date.parse fallback
also accepts timestamp inputs: `2026-07-01T00:30:00+10:00` becomes an instant on
June 30 UTC, contradicting the advertised date-only semantics.

Use strict calendar validation with component round-tripping for supported ISO
and Australian formats; reject invalid supplied dates with row errors. Share
the payment-date policy across manual and import paths and test boundary dates.

### R06 — High: cash-basis PDF omits the incomplete-data warning

Locations: `src/modules/reports/reports.controller.ts:145-150`,
`src/modules/reports/pdf.service.ts:132`.

The changed endpoint now permits CASH summaries, but the PDF renderer never
reads `basis` or either unreconciled field. The UI warning therefore disappears
when the user downloads the report. A summary with unknown historical receipts
can become an apparently complete PDF with reduced totals and no reconciliation
notice. The PDF also does not identify which accounting basis produced it.

Render the basis and prominent incomplete-data warning/count/amount in the PDF,
or refuse incomplete CASH exports with an actionable response. Test generated
document content, not just that a PDF buffer exists.

### R07 — Medium: UTC “today” rejects valid Australian receipt dates

Locations: `src/modules/incomes/incomes.service.ts:306-309`,
`web/src/features/incomes/incomes-page.tsx:26-29`.

The API compares against UTC today and the new dialog suggests UTC today.
At July 1, 01:00 in Sydney, UTC is still June 30. A valid July 1 receipt is
rejected as future; the suggested June 30 date is in the wrong quarter/FY.
Reproduced with the clock fixed to `2026-06-30T15:00:00Z` and receipt date
`2026-07-01`: the parser throws the future-date error.

Use an explicit business-timezone policy consistently for the date suggestion
and future-date validation. Test early-morning Australian quarter/FY boundaries.

### R08 — Medium: backend lint fails, contrary to the report

Locations: `src/modules/reports/reports.controller.spec.ts:239`,
`test/bas-payment-date.e2e-spec.ts:9,24,60,91,241,249`.

The installed ESLint runner with the workflow's exact file globs reports seven
errors: four formatting errors and three unused identifiers (`Category`,
`paidIncome`, `ids`). The new CI lint gate will fail before integration work.
Correct these and update the report from a fresh final run.

### R09 — Medium: CI never runs the new database regression suites

Location: `.github/workflows/e2e-tests.yml:181-184`.

CI runs backend unit tests under `src` and frontend Playwright tests. It never
invokes the backend `test:e2e` script, so the new BAS persistence, dry-run
zero-write, and multipart-hardening suites under `test/` are not gates. A
successful workflow would not establish those regression guarantees.

Run backend integration tests against an explicitly isolated ephemeral database
with synthetic configuration. Keep their data lifecycle separate from
Playwright fixtures and run them once without watch mode.

### R10 — Medium: the new integration suite has unguarded destructive setup

Location: `test/bas-payment-date.e2e-spec.ts:25-57`.

The suite imports AppModule (which loads environment configuration) and issues
unconditional DELETEs across five tables in `beforeEach`. Its “disposable DB”
comment is not an enforced target check. Invoking the documented command with
incorrect or incomplete environment setup could delete application records.

Require explicit disposable-test configuration and reject a non-test target
before application startup/migrations or any cleanup. Prefer a harness that
owns a uniquely named disposable database. Do not run the current suite using
ambient application configuration.

## Independent validation

| Check | Result |
| --- | --- |
| Backend unit tests with coverage | 700/700 passed, **28** suites |
| Backend production build | Failed: TS1016 in reports controller |
| Backend non-autofix lint | Failed: 7 errors |
| Frontend unit tests | 585 passed, 2 skipped, 60 files |
| Frontend lint | 0 errors, 4 warnings |
| Frontend production TypeScript stage | Failed: 4 TS2339 errors; Vite bundling not reached |
| Fresh `pnpm audit --json` | Exit 1: 0 critical/high, 2 moderate, 0 low |
| Database integration, migrations, generated types | Not run |
| Docker builds/runtime, Playwright, remote CI | Not run |
| Fresh clean installation | Not repeated; executor's claim remains unverified here |

pnpm initially stalled and then reported registry/version-identity errors in
the sandbox. The installed Jest, Vitest, ESLint, TypeScript and Nest runners
were used directly for local checks. The initial sandboxed Jest run could not
bind controller-test ports; the authorized rerun outside the sandbox passed
all 700 tests. `pnpm run build` and `pnpm audit --json` were subsequently
rerun with authorized network access. The build reported Node v24.21.0 versus
the declared Node 22 range; CI/Node 22 parity is not established by these runs.

Fresh audit output confirms the remaining entries are Vitest and
`@vitest/mocker`, GHSA-82fw-gwwq-j7x9, moderate, patched at >=4.1.11.
This verifies the scanner count, not every historical disposition or the
claim that all exploitable runtime paths have been examined.

Backend coverage from the final successful run:

| Changed service | Statements | Branches | Lines |
| --- | ---: | ---: | ---: |
| BAS | 100% | 86% | 100% |
| Incomes | 95.77% | 90.62% | 95.65% |
| Expense CSV import | 94.26% | 78.70% | 94.54% |
| Income CSV import | 83.52% | 71.62% | 85.18% |

Statement/line coverage exceeds 80% on those services; import branch coverage
does not. The executor's blanket coverage statement needs this distinction.
Frontend coverage was not collected; passing test totals do not establish the
required UI coverage target. Prior fail-before-fix history cannot be verified
from the final working tree alone.

## Other handoff gaps

- `.github/workflows/e2e-tests.yml:160` still prefers a repository encryption
  secret over the synthetic fallback despite its new “Synthetic CI-only”
  comment. This expression was inherited, but the handoff explicitly required
  synthetic-only CI configuration. Remove the secret reference. No secret
  value was read and this review does not assert what that secret contains.
- `docs/core/PATTERNS.md` still instructs actual imports to force `dryRun: false`,
  contradicting the new implementation and updated troubleshooting document.
- `NEXT-TASKS.md` calls remediation complete even though migration/contracts
  are absent and local gates fail. Correct completion labels and the executor's
  final validation table, including 28 backend suites rather than 26.

## Acceptance disposition

M01: scanner improvement verified; runtime upload/clean-image evidence pending.
M02: changes required (R02, R04-R07).
M03: changes required (R01, R08-R10 and synthetic configuration).
M04: implementation and controller regressions look sound; DB zero-write proof
still pending, so full acceptance remains open.
M05: changes required (R03), then actual image/runtime verification.
M06: metadata tests pass; generated and runtime contract verification pending.
M07: partly resolved; contradictory pattern/completion documentation remains.

Fix the independently reproducible defects first. Then complete the disposable
database phase, regenerate contracts, run all relevant gates and flows, validate
images, and replace the remediation report's final evidence with actual results.
