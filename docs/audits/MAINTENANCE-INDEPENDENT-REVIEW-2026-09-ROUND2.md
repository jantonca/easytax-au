# Independent remediation review — round 2

Reviewed 2026-09-11 against the current uncommitted working tree on `3f87068`.
This supplements, rather than replaces, the first independent review.

**Verdict: materially improved; changes still required.** The reported local
test counts, backend build, lint results and coverage figures now reproduce.
However, “all ten findings addressed” and “everything else ready” overstate the
result: R02 is still open, the new CI job has a configuration defect, the
destructive-test guard is incomplete, and a paid-to-unpaid form regression
remains. These defects can be addressed without a running database.

## Findings

### S01 — High: integration CI creates a different database from the one it uses

Location: `.github/workflows/e2e-tests.yml:229,266`.

The Postgres service declares `POSTGRES_DB: easytax_it_au`; the test step declares
`DB_NAME: easytax_it_au_disposable_test`. There is no step creating the latter
database. The new integration job will fail to connect even after the missing
migration is supplied. The report's statement that the service itself uses
`easytax_it_au_disposable_test` is incorrect.

Make provisioning and client configuration name the same disposable database.
Validate their agreement locally and then run the actual job. R09 is only
partially resolved until this is corrected and the suites execute successfully.

### S02 — High: editing a paid income to unpaid submits a contradictory date

Location: `web/src/features/incomes/components/income-form.tsx:128-134,300-311`.

When editing a paid income with a receipt date, unchecking “Mark as paid” hides
the date field but retains its React Hook Form value. Submission includes that
date whenever it is truthy, even when `isPaid` is false. The backend correctly
rejects this contradictory payload, so the user cannot save this transition
through the edit form. The separate table badge action is unaffected.

Independently reproduced with a temporary Vitest component test: render a paid
income dated July 2, uncheck the checkbox, click the update button and inspect
the mutation. It sends `isPaid: false, paymentDate: '2026-07-02'`; an assertion
that the date be omitted fails. The temporary review test was removed afterward.

Only submit a receipt date when the final paid state requires it, or clear the
field when changing state. Add a permanent regression covering this UI flow.
Also reconcile the legacy-unknown editing policy: the form schema currently
requires a date for any paid record, so unrelated edits to a legacy paid record
cannot be saved without entering a date, despite the form comment saying its
unknown state is preserved.

### S03 — Medium: disposable guard still accepts accidental application targets

Location: `test/guards/disposable-db-guard.ts:30-47`.

Loading the guard first is an improvement. But `/test|audit/i` is an arbitrary
substring check, and the guard requires no explicit DB_PORT. A direct, isolated
module invocation accepted `NODE_ENV=test`, `DB_NAME=contest`, a synthetic user,
localhost, and an unset DB_PORT. The data source can consequently default to
5432 rather than the intended disposable instance on 5433. No database was
contacted during this reproduction.

Use explicit destructive-test opt-in plus exact allowed disposable target names
or a harness-owned database; require the complete connection target, including
port, and validate it before loading the app. Reject accidental substrings and
missing target fields in guard tests. This need not prove an infrastructure
security boundary, but it should prevent the accidental ambient-target case
R10 was intended to address. R10 is partially resolved, not closed.

### S04 — Medium: claimed HTTP null regression does not exist

Locations: remediation report §3.3 and §8/R04;
`test/bas-payment-date.e2e-spec.ts:212-246`;
`src/modules/incomes/incomes.controller.spec.ts`.

The report explicitly says HTTP regressions for the null case are encoded in
the database suite. They are not. That suite checks a missing date, an invalid
string and contradictory non-null dates; its only `paymentDate: null` is a
legacy fixture inserted directly into persistence. The controller suite also
does not send a null date. The new service-level null test exists and passes,
and the implementation closes the original bypass, but HTTP verification is
being claimed beyond the evidence.

Add an HTTP request `{ isPaid: true, paymentDate: null }` against an unpaid
income, assert 400 and unchanged persisted state, and distinguish written tests
from executed tests. Test the documented already-paid-to-null policy as well.

### S05 — Medium: newly gated integration suite leaves its application open

Location: `test/app.e2e-spec.ts:13-27`.

The suite creates and initializes AppModule in beforeEach but never calls
`app.close()`. Unlike the two new suites, it has no teardown. With the new CI
job invoking all backend integration tests, the initialized TypeORM pool can
keep Jest alive until the 15-minute job timeout. This is inherited test debt
made relevant by the new gate; a one-shot command alone does not close resources.

Pair application initialization with teardown and verify the entire command
exits naturally, without `--forceExit`. This finding is based on lifecycle
inspection; a database-backed hang was not reproduced in this review.

## Original finding disposition

| Finding | Round 2 assessment |
| --- | --- |
| R01 backend compiler error | Fixed; `pnpm run build` exits 0 |
| R02 migration/shared contracts | Still open; no new migration or generated types |
| R03 Docker workspace links | COPY defect fixed by inspection; image build still unverified |
| R04 null transition | Service fix verified; promised HTTP regression absent (S04) |
| R05 CSV calendar rollover | Strict parser and invalid-row regressions verified |
| R06 incomplete PDF | Basis/warning content tests pass; visual layout not independently checked |
| R07 Australian today | Backend fixed-clock boundary tests pass; frontend implementation corrected |
| R08 lint/build evidence | Backend build and lint now pass; reported counts reproduce |
| R09 integration CI | Job added but wrong database target (S01); lifecycle issue S05 |
| R10 destructive setup | Guard added but incomplete (S03) |

The synthetic CI key references are now literals rather than repository secrets.
The previously contradictory multipart pattern advice and completion labels
were updated. Clearing a known receipt date on an already-paid record is now a
documented policy and is service-tested; it is no longer an unexplained bypass.

## Independently executed checks

Exit codes were obtained directly from each process, with no output-filter pipe.

| Check | Exit | Result |
| --- | ---: | --- |
| `pnpm run build` | 0 | Backend builds successfully without a database |
| Installed Jest, `--coverage --runInBand` | 0 | 712/712 tests, 28 suites |
| Installed ESLint, backend workflow globs | 0 | No problems |
| Installed Vitest, `run` in web | 0 | 585 passed, 2 skipped, 60 files |
| Installed ESLint, `.` in web | 0 | 0 errors, 4 warnings |
| Installed frontend TypeScript, `-b` | 2 | Four TS2339 errors from stale shared BAS types |
| `pnpm audit --json` | 1 | 0 critical/high, 2 moderate, 0 low |
| Temporary paid-to-unpaid component regression | 1 | Confirms retained-date payload defect S02 |

The existing installed runners were used directly for tests/lint/frontend
compilation. Backend Jest used authorized temporary local HTTP binding outside
the sandbox. Build output reports Node v24.21.0 against the declared Node 22
range; Node 22/CI parity remains unverified.

Coverage reproduces the executor's table: au-date 100% statements/branches/lines;
incomes 97.22%/93.93%/97.14%; income CSV 84.70%/73.61%/85.98%.
The statement that *all* remaining income-import branch gaps are legacy invoice
parsing is too broad: the coverage output also lists other paths, including
the bulk-save failure handler at lines 285-291. Frontend coverage remains
uncollected and the UI coverage target unproven. Full coverage of the new date
helper is positive evidence, not proof of every caller's state transition.

Fresh audit metadata matches the claim: Vitest and @vitest/mocker retain the
moderate GHSA-82fw-gwwq-j7x9 entries. Historical audit reduction, prior fail-first
execution order and clean-install evidence were not independently reconstructed.

No database, migration, type regeneration, backend integration, Playwright,
Docker image build/runtime or remote CI execution was performed. The frontend
build remains blocked at TypeScript; a successful post-regeneration Vite build
cannot be asserted in advance. The statement that both production builds need
Postgres is inaccurate: the backend build passed here without it.

## Remaining verification work

Correct S01-S05 and add the missing regressions. Then complete R02 against the
disposable baseline schema and rerun the real integration and image checks.
The report's database sequence also needs to be executable as written: on a
fresh empty container, apply the baseline migrations before generating the new
migration (`migration:show` only lists them); rebuild the backend after adding
the generated migration before using `start:prod`, since production loads the
compiled migration files. Supply explicit synthetic encryption configuration
and wait for readiness before generating types.

Only this report was retained from the review. Implementation files were not
changed, Git was not mutated, dependencies were not installed, and no database
or live service was touched. The temporary reproduction test was removed.
