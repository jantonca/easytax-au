# Independent review of the completed disposable-DB phase

Reviewed 2026-09-11 against the current uncommitted tree and the executor's
updated remediation report. This supplements the five preceding reviews.

**Assessment: substantial progress, with both production builds now independently
passing. The migration artifact and live disposable schema agree. Saved test
output supports the integration and Playwright successes, but the report still
overstates the generated income response contract and misstates the Playwright
denominator. Docker and remote CI remain unverified.**

## Findings and claim corrections

### D01 — Medium: generated income response still omits paymentDate

Location: `shared/types/api.d.ts:1379`; remediation report §7.

The report says the generated Income-shaped schemas contain paymentDate and
that the generated diff is exactly the designed contract. The actual response
schema is still `Income: Record<string, never>`. Only CreateIncomeDto,
UpdateIncomeDto and MarkIncomePaidDto advertise paymentDate. The frontend uses
its pre-existing hand-maintained IncomeResponseDto, now extended with that field,
which explains why its build passes despite the missing generated response.

The empty response metadata predates this work, but the new payment-date response
contract is still unrepresented and the completion claim is inaccurate. Expose
the relevant income response metadata, add a response-schema regression, and
regenerate from the backend. Correct §7 rather than claiming the current
generated Income schema includes the field. The actual shared-types diff is
65 added and 16 removed lines (81 changed), not the reported 83; this line-count
difference is minor, while the missing response contract is material.

### D02 — Medium: claimed process-cleanup correction is not in the runbook

Location: remediation report §6 and §9, backend startup/cleanup commands.

The report records a real failure where stopping pnpm left its Node child
listening on port 3000 and a health check hit stale code. It then says the
runbook was corrected. The commands still launch `pnpm run start:prod &`, capture
`$!`, and kill that same wrapper PID—the mechanism that already failed.

Capture/control the actual server process, for example by launching the freshly
compiled Node entrypoint directly, and verify its exit and port release. Do not
present wrapper-PID capture alone as the resolved lifecycle guarantee. This
review did not start another backend or manipulate an existing process.

### Evidence/documentation corrections

- `/tmp/opencode/pw3.out` says **63 tests: 62 passed, 1 skipped**, not 62/62.
  The skipped import-statistics test is pre-existing; it was not newly disabled.
  Include the skip in report §4 and NEXT-TASKS.
- The integration output is **17 passed across four suites**: seven guard-only
  checks and ten tests using the database. The total is accurate, but it should
  not be described as 17 independent database regression scenarios.
- The old R02 row in report §8 still says the disposable database has not been
  started and the migration remains blocked. Label that row historical or update
  it to match the completed phase.
- Frontend coverage still has not been collected, and import branch-coverage
  gaps remain documented. Passing test counts do not establish all handoff
  coverage targets.

## Independently verified in this review

| Check | Result |
| --- | --- |
| Backend unit suite with coverage | 714 passed, 28 suites; exit 0 |
| Backend `pnpm run build` | Exit 0 |
| Backend non-autofix lint, workflow globs | Exit 0 |
| Frontend unit suite | 587 passed, 2 skipped, 60 files; exit 0 |
| Frontend lint | Exit 0; 0 errors, 3 warnings |
| Frontend `pnpm --filter web build` | Exit 0; TypeScript and Vite both pass |
| Fresh dependency audit | Exit 1 due to 2 moderate entries; 0 critical/high/low |
| Disposable migration history (read-only SQL) | InitialSchema and AddIncomePaymentDate recorded |
| Disposable schema (read-only SQL) | payment_date is nullable DATE; expected btree index exists |

The read-only database connection explicitly targeted
`127.0.0.1:5433/easytax_audit` using the supplied disposable credentials. Queries
ran in a read-only transaction and returned only migration/schema metadata.
No retained records were read, reset, inserted or deleted.

The new migration contains exactly the additive column and index operations;
down drops the index and column. No data backfill or unrelated schema mutation
is present. Actual final database state agrees with these operations. The
executor's historical up/revert/reapply sequence was not rerun here, so current
state corroborates its final result rather than independently proving that
entire sequence.

The CSV preview 200 status change matches its documented non-creating endpoint
contract. Explicit String metadata fixes the nullable importJobId schemas.
The recurring undo payload now converts null description/endDate to omitted
values, consistent with the create types. No new runtime defect was identified
in those changes.

## Evidence inspected rather than independently rerun

- `/tmp/opencode/e2e4.out`: four suites pass, 17 tests, no failures.
- `/tmp/opencode/pw3.out`: 62 pass, one skip; earlier pw2 output retains the
  failures described by the executor.
- `web/test-results/.last-run.json`: passed, no failed tests.
- Playwright changes preserve assertions and adapt to the receipt-date dialog
  and basis query parameter; they do not delete failing scenarios.

Saved output supports these execution claims, but is not a fresh independent
run or independent reconstruction of process exit codes and historical target
configuration. DB integration and Playwright were not rerun because doing so
would alter the retained synthetic data. Migration rollback, type-generation
provenance, and clean-install history likewise were not recreated.

Tests/lint used the installed runners; exact pnpm build commands also completed
successfully. Sandbox restrictions required authorized temporary HTTP binding,
read-only localhost DB access and pnpm registry access. The observed runtime
remains Node v24.21.0 versus the declared Node 22 range; Node 22/CI parity has
not been demonstrated by these local runs.

## Disposition

The missing migration and failing web-build portions of R02 are resolved. The
generated income response contract still needs D01, and the execution guide
needs D02 and the evidence corrections above. Docker image/runtime validation
and remote CI remain pending. No commit, merge or deployment acceptance is
implied by this review.

Only this report was added. No implementation file, dependency, Git state,
database data, container or live service was mutated. Verification commands
generated their normal local test/build artifacts.
