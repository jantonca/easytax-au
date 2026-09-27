# Independent remediation review — round 3

Reviewed 2026-09-11 on local `main`, HEAD `3f87068`, against the current
uncommitted changes and remediation report. Supplements the first two reviews.

**Verdict: four round-two fixes are supported; S05 is not fully resolved.**
The claimed available gate results reproduce. However, the teardown change
introduces an undefined variable into the multipart integration suite. The
database is therefore not the only remaining obstacle to passing integration.
Migration/shared-type work and actual DB/Docker/CI verification remain open.

## T01 — High: multipart integration teardown references an undeclared variable

Location: `test/multer-hardening.e2e-spec.ts:45-49`.

The new afterAll calls `app.close()`, then reads `dataSource` and calls its
`destroy()` method. This file never declares or initializes `dataSource`.
After a successful application shutdown, the suite will throw ReferenceError
while evaluating the condition. This is a defect introduced by the S05 fix,
independent of whether the multipart assertions pass.

Independent verification: running the installed TypeScript compiler with
`--noEmit --incremental false` reports TS2304 at line 47 twice and line 48
once: “Cannot find name 'dataSource'.” No database connection was needed.

The production build excludes test files. The configured Jest transform runs
isolated transpilation, so a green unit run does not establish that integration
test code type-checks. The existing backend lint command also exits 0 here.

Remove redundant pool cleanup if Nest owns and closes the connection, or
explicitly obtain and declare the correct DataSource before using it. Verify
the corrected teardown and, once the disposable database exists, require the
entire integration command to exit naturally without `--forceExit`.

## Assessment of S01–S05

| Finding | Current evidence and disposition |
| --- | --- |
| S01 mismatched CI database | Fixed in YAML: service POSTGRES_DB and test DB_NAME both equal `easytax_it_au_disposable_test`; actual CI remains unrun |
| S02 stale date on paid-to-unpaid edit | Fixed: payload conditions on final paid state; permanent component regression passes; legacy-paid editing regression also passes |
| S03 accidental substring/default port | Addressed: separator-bounded name token and explicit valid port required; independent guard suite passes 7/7 |
| S04 missing HTTP null cases | Tests now exist: null unpaid-to-paid rejection plus unchanged persistence, paid-to-null success, contradictory create rejection; execution still pending DB |
| S05 unclosed application | AppController suite now closes its app, but multipart teardown is broken by T01; cannot mark the overall finding resolved |

The guard is appropriately described as an accidental-target configuration
check, not proof of infrastructure isolation. Operator responsibility for the
actual disposable target remains. Guard execution itself was tested without
connecting to a database.

## Independently executed checks

Every exit below came directly from the process result, not a filtering pipe.

| Check | Exit | Result |
| --- | ---: | --- |
| `pnpm run build` | 0 | Backend builds |
| Installed Jest, `--coverage --runInBand` | 0 | 712 passed, 28 suites |
| Installed ESLint, backend workflow globs | 0 | No problems |
| Installed Vitest, `run` in web | 0 | 587 passed, 2 skipped, 60 files |
| Installed ESLint, `.` in web | 0 | 0 errors, 4 warnings |
| Installed frontend TypeScript, `-b` | 2 | Four stale shared BAS type errors |
| Guard suite alone through `test/jest-e2e.json` | 0 | 7/7 passed; no database used |
| `pnpm audit --json` | 1 | 0 critical/high, 2 moderate, 0 low |
| Root TypeScript including test files, `--noEmit --incremental false` | 2 | 15 diagnostics, including T01 |

The root type-check is an additional diagnostic, not an established clean
baseline gate. Its other errors include existing test debt and errors in
remediation-added tests. Do not attribute all 15 to this latest iteration.
Examples relevant to the new work: the guard test imports `@jest/globals`,
which Jest resolves at execution but the root TypeScript resolver cannot find;
the null-policy service tests also expose that the declared update DTO still
types paymentDate as `string | undefined`, despite deliberate runtime support
for null on an already-paid income. Align that nullable update contract before
final shared-type generation; avoid simply casting away the discrepancy.

Installed runners were invoked directly for tests, lint and compilation.
Backend Jest used authorized local HTTP binding outside the sandbox. The build
reported Node v24.21.0 versus the declared Node 22 range, so Node 22 and CI parity
remain unverified. Audit metadata was refreshed; the remaining entries are
Vitest and @vitest/mocker, GHSA-82fw-gwwq-j7x9. Clean-install and historical
fail-first evidence were not independently recreated in this round.

## Remaining acceptance and runbook issues

No new migration or regenerated shared contract is present. No database was
contacted in this review. Migration up/down/reapply, database-backed suites,
Playwright, successful frontend production build, Docker images/runtime and
remote CI remain unverified. A passing frontend build after generation is an
expectation, not yet a result.

The previously identified runbook gaps remain in remediation report §9:
it starts a fresh database and runs `migration:show` then `migration:generate`
without first applying the baseline migration. Listing migrations does not
establish the required baseline schema. It also starts the compiled backend
without rebuilding after migration generation, omits explicit synthetic
encryption configuration, and does not wait for backend readiness before type
generation. Correct that sequence before calling it ready to execute.

Only this report was added. Implementation files were not changed, dependencies
were not installed, Git was not mutated, and no database or live service was
started. Test/build artifacts were generated by the verification commands.
