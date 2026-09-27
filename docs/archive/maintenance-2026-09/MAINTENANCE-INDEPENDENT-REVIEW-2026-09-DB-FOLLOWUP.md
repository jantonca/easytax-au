# Independent review — income response and process cleanup follow-up

## E01 closure — subsequent verification, 2026-09-11

**E01 is resolved.** The response metadata and regenerated shared types now
advertise invoice date and paymentDate as date-only strings with date-only
examples. Income/client creation and update timestamps retain date-time format.
The new Swagger regression passes; all seven contract tests pass within the
full backend suite. No new blocking defect was found in this targeted change.

Fresh independent process results: backend 716/716 tests (28 suites), backend
build exit 0, backend lint exit 0; frontend 587 passed and two skipped (60 files),
TypeScript plus Vite production build exit 0, frontend lint exit 0 with three
existing warnings. Tests/lint/frontend build used the installed runners;
backend build used `pnpm run build`. Backend Jest had authorized temporary
local HTTP binding. Runtime remains Node v24.21.0 rather than declared Node 22.

The report honestly states that the fix and regression were added together.
That does not satisfy fail-first TDD history, but the independent pre-fix
reproduction and passing post-fix schema assertions establish the defect and
its correction. No claim of a separately executed failing test is made here.

Live fixture creation/removal, type-generation provenance and backend shutdown
were not independently repeated in this follow-up. No database records or
services were touched. Docker image/runtime and remote CI remain unverified;
previously documented coverage and baseline diagnostic limitations still apply.
This closes E01, not deployment acceptance. Only this review addendum was edited.

## Original finding and evidence (before the correction)

Reviewed 2026-09-11 against the current working tree.

**D01's empty response schema and D02's wrapper-PID issue are fixed.** The
reported local tests/build/lint results reproduce. One small mismatch remains
in the newly introduced response metadata: invoice dates are advertised as
timestamps even though persistence hydrates them as date-only strings.

## E01 — Medium: invoice date response format does not match serialized values

Location: `src/modules/incomes/dto/income-response.dto.ts:43-47`;
`shared/types/api.d.ts`, IncomeResponseDto.date.

The new DTO uses a Date property without an explicit Swagger date format,
producing `type: string, format: date-time`. Its description also explicitly
claims an ISO timestamp response. However, Income.date is a PostgreSQL `date`
column, and the controller returns repository-hydrated entities directly.
TypeORM's PostgreSQL hydration converts that column to a date-only string.

Independent reproduction with the installed driver's date hydration produced
`{"date":"2026-06-30"}`. A separate Swagger document generated from the newly
compiled response DTO advertises `format: date-time` and an example ending in
`T00:00:00.000Z`. This is an invalid value/format combination for consumers that
validate the generated OpenAPI contract. The current frontend accepts plain
strings, so its green build does not catch this mismatch.

Declare invoice date explicitly as a date-only string in the response metadata
and correct its description/example. The paymentDate field already has the
correct `format: date`, but its timestamp example should likewise become
`2026-07-02`. Preserve date-time for actual createdAt/updatedAt timestamps.
Extend the response contract test to check date formats/examples against the
serialization semantics, then regenerate shared types.

## Verified resolutions

- IncomeResponseDto has 13 schema properties; paymentDate is a nullable string
  with date format. All six income response decorators reference the DTO.
- The generated dead Income schema is removed. Create/update/payment request
  schemas remain present, and the new IncomeClientDto is generated.
- The response regression now checks the schema is non-empty and includes
  paymentDate and the client relationship. All six contract tests pass.
- The runbook launches `node dist/src/main.js` directly and captures that PID,
  eliminating the known pnpm-wrapper problem. It explicitly fails readiness
  timeout and checks that the health endpoint stops responding after shutdown.
  This review inspected those controls but did not repeat their live execution.
- Integration and Playwright denominator corrections are recorded. Their prior
  execution evidence remains as assessed in the preceding DB-phase review.

## Fresh independent gates

| Check | Result |
| --- | --- |
| Backend unit suite with coverage | 715 passed, 28 suites; exit 0 |
| Backend production build | Exit 0 |
| Backend non-autofix lint | Exit 0 |
| Frontend unit suite | 587 passed, 2 skipped, 60 files; exit 0 |
| Frontend production TypeScript and Vite build | Exit 0 |
| Frontend lint | Exit 0; 0 errors, 3 warnings |
| Fresh pnpm audit | Exit 1; 0 critical/high, 2 moderate, 0 low |

Exit codes came directly from process results. Tests/lint/frontend build used
installed runners; backend build used `pnpm run build`. Backend Jest used
authorized temporary HTTP ports. The observed runtime remains Node v24.21.0
against the declared Node 22 range. Docker, remote CI and Node 22 parity remain
unverified; the previous DB integration/Playwright suites were not rerun here.

No new migration or runtime calculation defect was found in this follow-up.
E01 is a targeted response-contract correction. The overall remediation still
requires Docker image/runtime and remote CI evidence; no commit or deployment
approval is implied.

Only this review report was added. Implementation files and Git were unchanged;
no database data, container or live service was read or mutated. Normal local
test/build artifacts were generated.
