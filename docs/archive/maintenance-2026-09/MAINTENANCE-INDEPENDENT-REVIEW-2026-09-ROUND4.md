# Independent remediation review — round 4

Reviewed 2026-09-11 on local `main` (`3f87068`), current uncommitted tree.

**Verdict: the round-three teardown/compiler fixes are verified, but the new
nullable DTO change introduces an OpenAPI contract defect.** Available local
gate claims reproduce. Migration, generated contracts and DB/Docker/CI execution
remain outstanding; the work is not yet ready for final acceptance.

## U01 — Medium: nullable paymentDate is advertised as an object

Location: `src/modules/incomes/dto/create-income.dto.ts:115-125`.

Changing `paymentDate?: string` to `paymentDate?: string | null` fixes TypeScript
acceptance of null but changes emitted decorator metadata from String to Object.
The Swagger decorator specifies `nullable: true` without specifying its type.

Independent reproduction used the freshly compiled DTO with
`SwaggerModule.createDocument` in an empty testing module, without a database
or listening socket. The actual CreateIncomeDto property is:

```json
{"type":"object","nullable":true,"example":"2026-07-02"}
```

This is the wrong contract for an API field requiring a date string. Running
shared-type generation now will propagate the incorrect object schema rather
than fix it. The existing nullability tests inspect different response DTOs
and do not cover this input field.

Specify the string type explicitly, with date format as appropriate, and add a
Swagger contract regression asserting both type and nullability. Check the
update schema too: the same reproduction found no paymentDate property on
UpdateIncomeDto. It extends `PartialType` from `@nestjs/mapped-types`, which
does not copy the Swagger property metadata here. That inheritance predates
this iteration, but the promised nullable update API contract still needs to
be represented and verified before final generation. Do not hand-edit the
generated file or treat TypeScript assignability as OpenAPI verification.

## Round-three response assessment

- T01 is fixed: the multipart suite imports, declares and obtains DataSource
  before using it in teardown. Its three undefined-variable diagnostics are gone.
- Baseline migration application now precedes migration generation in the runbook.
- The runbook now rebuilds compiled output, supplies a synthetic encryption key
  and polls health before regeneration.
- Null is accepted by the TypeScript DTO declaration without casting away the
  discrepancy, but U01 remains at the Swagger layer.
- Guard tests now use ambient Jest globals; their resolver diagnostic is gone.
- Touched BAS fixtures now contain the required fields; the reported root
  compiler diagnostic reduction reproduces.

One runbook detail still needs correction before calling it execution-ready:
at remediation report line 457, the health loop falls through successfully
after all 30 requests fail (the last `sleep` succeeds). It proceeds to type
generation without confirmed readiness. Explicitly fail on timeout and stop
the sequence when prerequisites fail. The process also has no recorded PID or
cleanup step; manage the backend started by the runbook so reruns are controlled.
These are execution-guide gaps, not evidence of a database-backed failure.

## Independently executed gates

Exit codes were captured directly from process results, without filtering pipes.

| Check | Exit | Result |
| --- | ---: | --- |
| `pnpm run build` | 0 | Backend builds |
| Installed Jest, coverage, `--runInBand` | 0 | 712 passed, 28 suites |
| Installed ESLint, backend workflow globs | 0 | No problems |
| Guard suite alone via integration Jest config | 0 | 7/7 passed; no database |
| Installed Vitest `run` in web | 0 | 587 passed, 2 skipped, 60 files |
| Installed ESLint `.` in web | 0 | 0 errors, 4 warnings |
| Frontend TypeScript `-b` | 2 | Four stale BAS shared-type errors |
| Root TypeScript `--noEmit --incremental false` | 2 | Exactly three diagnostics |
| Fresh `pnpm audit --json` | 1 | 0 critical/high, 2 moderate, 0 low |

The three root compiler errors are in app.controller.spec.ts (readonly
isInitialized), csv-import.service.spec.ts (recordsTotal), and the
recurring-expenses controller fixture (missing required fields). These files
have no working-tree diff against HEAD and the same errors were present in the
preceding review. A clean historical dependency installation was not recreated,
so this verifies unchanged source/previous-review debt, not a fully reproduced
historical baseline environment.

Tests/lint/type checks used the installed runners directly. Backend Jest used
authorized temporary HTTP binding outside the sandbox. Build output reported
Node v24.21.0 versus the declared Node 22 range; Node 22/CI parity is unverified.
Audit metadata was refreshed and matches the reported remaining Vitest/mocker
moderate advisory entries. Historical fail-first execution and clean-install
claims were not reconstructed.

No database connection, migration, shared-type regeneration, DB-backed suite,
Playwright flow, Docker build/runtime or remote CI run was performed. No
implementation file was changed; only this review report was added. Git was
not mutated and no dependencies or services were installed or started.

Correct U01 and the remaining runbook controls, then complete the disposable
database phase. Passing unit tests and production backend compilation remain
useful evidence; they do not establish generated API contracts or persistence
behaviour.
