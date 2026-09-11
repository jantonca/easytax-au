# OpenCode handoff: maintenance remediation and independent review

## Objective

Remediate audit findings **M01–M07** below in EasyTax-AU. Deliver tested changes,
an explicit record of unresolved limitations, and evidence suitable for a fresh
Codex review. This is implementation work, not another general audit. Recheck
each finding against the current checkout before changing it; correct the audit
if evidence contradicts it.

Do not declare the work accepted on Codex's behalf. Codex will independently
inspect the resulting diff, tests, dependency evidence, and migration behaviour.

Repository: the local `easytax-au` checkout (repo root).

## Scope and authority

- Implement M01–M07, including relevant regression tests, CI, generated contracts,
  deployment configuration, and maintenance documentation.
- Repo edits and normal local test/build artifacts are part of this implementation
  task. The previous audit's read-only execution restriction does not turn this
  implementation task into another read-only audit.
- Follow the actual applicable `AGENTS.md` and host approval rules. This handoff
  does not authorize Git mutations, installs requiring approval, changes outside
  the repo, remote operations, production migrations, or deployment. Prepare the
  exact proposal required by those rules and wait where required. Continue
  independent authorized work while a genuinely necessary action is pending.
- Do not commit, stage, branch, stash, pull, merge, reset, push, or edit remotes
  without the specific authorization required by the project. A handoff file is
  not that authorization. Do not discard or overwrite existing user changes.
- Do not read `.env`, credentials, private infrastructure inventory, production
  data, or secret values. Use synthetic fixtures and disposable local databases.
  Do not capture real customer information in logs, screenshots, or reports.
- Never run a repository setup/update script merely to provision test services.
  Read it first; host and infrastructure work requires its own preflight.
- Do not weaken tests, disable lifecycle-script protection, widen security
  exceptions, remove features, or add a new test framework to obtain green checks.
- Do not implement advanced filtering, analytics, a framework rewrite, a Node
  manager migration, or unrelated cleanup.
- Authentication is a recorded follow-on milestone, not one of M01–M07. Preserve
  and document the current no-auth limitation and the prerequisite for broader
  exposure. Do not silently add an authentication system or claim LAN-only access
  makes the application authenticated. Live network restrictions remain unverified.

## Baseline to verify before work

The audit was performed on 2026-09-11 against local `main`, commit `79403f2`
(2026-06-22). At audit time:

- `STATUS.md` was untracked, pre-existing user work. It must be preserved.
- Cached upstream was one documentation commit ahead: `3f87068`, changing
  `AGENTS.md`. This was cached Git evidence, not a freshly fetched remote state.
- Root lockfile importers were `.` and `web`; `web/pnpm-lock.yaml` also existed
  and was referenced by the frontend Dockerfile. Do not delete it as presumed
  debris without reconciling every consumer.
- Package manager pin and installed-tree metadata reported pnpm `11.8.0`.
  The package engine range was Node `>=22 <23`. Verify actual execution separately;
  a declaration is not proof of the running binary.
- Inspected installed versions included Nest platform-express `11.1.11`, direct
  Multer `1.4.5-lts.2`, TypeORM `0.3.28`, React `19.2.3`, Vite `7.3.0`, and Vitest
  `2.1.9`. The Nest package declares its own Multer `2.0.2` dependency.
- Backend non-autofix lint passed with zero warnings. Frontend lint passed with
  three warnings. Backend and frontend application/tooling TypeScript checks
  passed with emit and incremental writes disabled.
- There were 25 backend unit-test files, 59 frontend test files, and 6 Playwright
  spec files. These are file counts, not test counts or coverage measurements.
- Unit tests, builds, coverage, and E2E were not run in the read-only audit.
- `pnpm audit --json` reported 123 entries: 2 critical, 70 high, 43 moderate,
  8 low. These are scanner metadata counts, not 123 proven application exploits.
  A second query stalled and was cancelled. Refresh evidence before choosing fixes.

Record current HEAD, branch, tracking comparison, and `git status --short` first.
If the implementation baseline differs, explain relevant differences without
automatically resetting or updating the checkout.

Read `AGENTS.md`, `STATUS.md`, `NEXT-TASKS.md`, `docs/core/PATTERNS.md`,
`ARCHITECTURE.md`, `SCHEMA.md`, `SECURITY.md`, `ATO-LOGIC.md`, and
`TROUBLESHOOTING.md` under `docs/core/` as applicable. Read the existing February
audit conclusions and current remediation history; do not reopen resolved items.
There was no `docs/MAINTENANCE.md` at audit time. Two inherited domain instruction
paths were missing; do not invent their contents.

Use available `deploy-safety`, `node-toolchain`, and `web-research` skills where
applicable. Discover their actual paths in your environment. Read-only audit
guidance is useful for evidence gathering, but this task also authorizes repo
implementation under the rules above. No sub-agents are required.

## Execution order

1. Capture the baseline and inspect script/test side effects. Run existing unit,
   lint, and build gates when prerequisites are available. Separate baseline
   failures from regressions introduced by your changes.
2. Reproduce M04 and M02 with failing tests before changing their implementation.
   Prioritize the small dry-run fix while preparing the payment-date design.
3. Resolve M01 dependency exposure and M03 CI gaps, retaining compatible versions.
4. Implement M02 schema/API changes and M06 nullable metadata. Apply migrations
   only to a disposable database; start that backend and generate shared types
   before dependent frontend changes.
5. Finish the frontend behaviour, M05 Docker configuration, and M07 documentation.
6. Run final gates once the implementation is stable. Repeat checks only when new
   changes or failures justify it. Deliver the review record described below.

For behaviour changes, follow TDD: add the regression, show the relevant test
fails for the expected reason, implement the smallest fix, then show it passes.
Do not write artificial tests for prose or configuration simply to mimic a diff;
validate those through their actual consumers.

## M01 — dependency vulnerabilities (High)

### Evidence and targets

Inspect root `package.json`, `web/package.json`, both lockfiles,
`pnpm-workspace.yaml`, the Nest adapter's dependency path, and
`src/modules/csv-import/csv-import.module.ts` and controller.

The maintainer advisory below was read on 2026-09-11. It states Multer versions
below `2.3.0` are affected by a crafted multipart request that can crash the Node
process. Treat `2.3.0` as that advisory's patch floor, not a promise that it fixes
all advisories at implementation time:

https://github.com/expressjs/multer/security/advisories/GHSA-wc9g-mqfw-jrwm

### Required work

- Refresh the complete dependency audit. Summarize JSON before displaying it;
  do not dump thousands of dependency paths. Preserve the audit command's exit
  status when piping through a summarizer, so a successful parser cannot hide a
  failed audit or network error.
- Identify the two critical entries as well as high-priority runtime findings.
  For each remaining advisory record ID, package/resolved version, shortest
  dependency path, runtime/build/test exposure, reachability evidence, patch
  availability, and disposition. Group identical advisories without hiding
  distinct affected versions.
- Check primary maintainer advisories and registry metadata for compatible patch
  targets. Prefer supported updates within the existing framework majors. Do not
  upgrade everything to latest merely because newer versions exist.
- Fix both the direct Multer dependency and the parser actually loaded by the
  Nest adapter. Updating the direct dependency alone is insufficient. Prefer a
  compatible Nest update; use a narrow override only with documented compatibility
  evidence and an explicit removal condition.
- Preserve `allowBuilds` protection and narrow exceptions. Reconcile lockfile and
  installed-tree evidence; do not claim a lockfile edit proves the installed tree
  was updated. Follow approval requirements before installations.
- Validate normal CSV upload, preview, malformed multipart handling, and the 5 MB
  limit in a disposable local test environment. Any request that can crash a
  parser must run in an isolated child process or disposable service, never
  against a shared or deployed service. Do not copy exploit code into the report.
- Do not use broad audit suppressions or `audit fix --force`. A remaining advisory
  needs a reasoned disposition; a lower scanner count alone is not acceptance.

### Acceptance and recovery

No known reachable High/Critical runtime vulnerability remains without explicit
user acceptance of the residual risk. Every other remaining advisory has a
documented disposition. Unit, upload/E2E, clean-install, and build checks pass.
Changes normally affect manifests/lockfile only, with no schema migration.
Recovery is restoring the prior reviewed manifest/lockfile set and reinstalling
that set under the same approval rules, not a destructive Git reset.

## M02 — cash-basis BAS uses invoice date (High)

### Confirmed trigger

`src/modules/bas/bas.service.ts` filters both bases by `income.date`, adding
`is_paid = true` for CASH. `src/modules/incomes/entities/income.entity.ts`
documents `date` as invoice date and has no payment-date field.
`IncomesService.markAsPaid` only sets a boolean.

An invoice dated 2026-06-30 and paid 2026-07-02 is therefore included in Q4 FY2026
once marked paid, instead of its payment period Q1 FY2027. Existing BAS tests
assert the boolean filter but do not establish cross-quarter payment attribution.

### Design and implementation requirements

- Reverify applicable current ATO guidance using authoritative sources before
  calling the result compliant. The audit could not retrieve full ATO pages and
  established this defect from code and the repository's own documented contract.
- Implement explicit date-only payment-date semantics for the existing fully
  paid/unpaid income workflow. Preserve invoice date for ACCRUAL reporting.
  Use consistent Australian FY boundaries; avoid timezone-dependent day shifts.
- Before migration work, write a short design covering the field, null meaning,
  paid/unpaid transitions, create/update/import paths, validation, API responses,
  UI date entry, and legacy records. Review all callers of mark-paid/update,
  both JSON and multipart imports, and any reports claiming CASH behaviour.
- Do not infer historical receipt dates from invoice date, `updatedAt`, migration
  time, or the current date. Legacy paid records must retain an explicit unknown
  state until reconciled from evidence. Specify a visible, safe response to
  unresolved records: an apparently complete BAS total must not silently omit
  them or treat the invoice date as payment date. Avoid assigning an unknown
  receipt to an arbitrary quarter merely to produce a warning.
- Choose a conservative policy for legacy unknown dates and document its user
  impact before implementation. If policy requires a consequential user decision,
  ask one focused question and keep independent work moving. Do not perform live
  backfills or reconciliation as part of this task.
- Require or explicitly collect a receipt date when newly marking an income paid.
  Validate contradictory states; clearing payment status must handle its date
  consistently. Specify behaviour for imported historical paid rows that lack a
  receipt-date column, rather than silently assigning dates.
- Investigate partial-payment support and expense-date semantics. Do not claim
  general cash-accounting correctness from a paid-date field alone. If partial
  receipts or unpaid purchases are outside the existing model, document those
  limitations accurately and do not add a payment-ledger redesign silently.
  Escalate scope only if evidence shows it is necessary for the agreed fix.
- Preserve integer cents and `MoneyService`; do not change unrelated GST rounding.
- Add an additive, reviewed TypeORM migration following project instructions.
  Generate it against a disposable database at the baseline migration state.
  Inspect every generated SQL statement for unrelated schema drift. Keep
  `synchronize: false`. Do not hand-wave away a generation or schema-check failure.
- Start the backend against that disposable migrated database, then run
  `pnpm run generate:types` before frontend work. Do not hand-edit generated types.

### Minimum regression scenarios

1. June invoice / July receipt: CASH Q4 excludes it, CASH Q1 next FY includes it;
   ACCRUAL remains attributed to the invoice period.
2. Same-quarter payment; quarter end and next-quarter start; financial-year end.
3. Unpaid invoice; paid-to-unpaid transition; payment-date correction.
4. Legacy paid record with unknown receipt date produces the documented safe
   result and visible reconciliation requirement.
5. Invalid date and contradictory paid/date payloads are rejected at the actual
   HTTP validation boundary, not only in direct service calls.
6. Manual entry, mark-paid UI, and CSV import preserve the same semantics.
7. A database-backed reporting regression uses synthetic persisted invoices; a
   mocked query-builder assertion alone is not proof of correct attribution.

### Migration safety and acceptance

Test migration up on a baseline disposable schema, application startup with no
pending migrations, and rollback/reapply in disposable data only. Document that
dropping the new field loses captured receipt dates and that a code rollback may
restore incorrect cash reporting. Before any future live migration, require a
verified database backup and a separate plan for preserving/reconciling receipt
dates. No live migration is authorized by this handoff.

Accept only when receipt-period behaviour, legacy handling, UI, contracts, and
tests agree. List any partial-payment or purchase-side limitation explicitly.

## M03 — incomplete CI quality gates (Medium)

Inspect `.github/workflows/e2e-tests.yml`, root and web scripts, runner configs,
and shared types. The existing workflow builds the backend and runs Playwright
against Vite dev; it omits both unit suites, linting, and the web production build.

- Add non-autofix backend lint, frontend lint, backend unit tests, one-shot frontend
  unit tests, and both production builds to CI. Preserve relevant Playwright flows.
- Keep pnpm and Node selection consistent with supported project pins. Verify the
  action/runtime interaction; do not make an unrelated major action upgrade just
  because a newer tag exists.
- Use synthetic CI-only configuration. Never use a production encryption key or
  database to run tests. Do not log secrets or upload sensitive artifacts.
- Make failed gates fail the workflow. Replace build-output checks that mask errors
  using `|| echo` with a check that actually fails if the entrypoint is absent.
- Keep database integration and migrations isolated to ephemeral test services.
- Prevent uncontrolled watch mode and service leaks. CI should terminate after
  one run, preserve useful failure artifacts, and clean up owned processes.
- Verify coverage for changed money/reporting/mutation paths with the existing
  runner: project targets are critical paths 80%+, UI 60%+, pure functions 90%+.
  Do not add a global threshold that unrelated baseline debt cannot meet without
  explaining it, and do not lower targets. Separate unchanged debt from changed
  code. Any required coverage provider dependency follows normal install approval.
- Report local validation separately from actual CI results. If pushing/running
  remote CI is unavailable or not authorized, label remote CI unverified.

No data migration is needed. Recovery is restoring the prior workflow/configuration.

## M04 — dry-run flag is ignored (Medium)

Inspect `src/modules/csv-import/csv-import.controller.ts`, `dto/csv-import.dto.ts`,
both import services, frontend callers, and global validation configuration.
Both actual file-import handlers overwrite `dryRun` with false. The DTO advertises
that true means preview without writes. Dedicated preview endpoints also exist.

- Prefer honouring the advertised flag while retaining the dedicated previews.
  Do not remove the option as an unannounced API contract change.
- Reproduce through the HTTP/multipart transformation path. The existing comments
  describe a boolean-coercion workaround: replacing a literal is not sufficient
  if implicit conversion still makes the string `"false"` truthy.
- Cover true, false, omitted, and invalid booleans; cover `"1"`/`"0"` if they
  remain supported. Specify and test the JSON-body behaviour too. Ensure the
  same coercion issue does not break `skipDuplicates` or income paid status.
- Prove dry-run creates no expense, income, import-job, matched entity, or other
  persistent record. Also prove the ordinary false/omitted import still writes
  correctly and duplicate handling still works. Exercise both income and expense
  paths; method-call assertions alone do not establish zero database writes.
- Do not change global coercion in a way that breaks unrelated DTOs. If a global
  fix is justified, test the affected boundary contracts explicitly.

No schema migration is expected. Recovery is restoring the prior code, with the
known dry-run defect documented; do not delete user imports to simulate rollback.

## M05 — Docker workspace build context (Medium)

Inspect `docker-compose.yml`, both Dockerfiles, both lockfiles, `.dockerignore`
files, web TypeScript aliases, nginx configuration, and deployment documentation.
Compose uses context `./web`, but `web/Dockerfile` attempts to copy
`../pnpm-workspace.yaml`. Shared contracts also live outside `web`.

Docker source paths are relative to the context; `../` cannot import its parent:
https://docs.docker.com/reference/dockerfile/#copying-from-the-build-context
(read during the audit on 2026-09-11; reverify if relevant behaviour changes).

- Repair the existing Docker path; keep it clearly separate from the native
  deployment. Prefer an intentional repository-root context and correct COPY
  paths, with dependency installation using the authoritative workspace lockfile.
- Include required workspace manifests and shared types at the correct stages.
  Check the backend Dockerfile too: dependency installation must see the intended
  workspace and lifecycle policy, and pruning must match the chosen pnpm version.
- Exclude `.env`, data, local dependency trees, and generated local artifacts from
  build context where appropriate. Never test secret handling with actual secrets.
- Resolve the nested web lockfile only after mapping consumers. Remove it only if
  all supported consumers now use the root lockfile and document that decision.
- Validate frozen installation and both image builds from a clean disposable
  source/dependency environment using approved tooling. Do not replace the
  original installed tree before collecting its evidence.
- Verify frontend runtime serving, API proxy path/build-time URL, backend entrypoint,
  migrations, and health checks using disposable containers/data. No deployment
  or restart of the existing service. If Docker access is unavailable, complete
  the code/config changes and mark image/runtime verification blocked explicitly.
- Use the existing API service key discovered from Compose when giving commands;
  do not guess it. Record exact build/test commands and cleanup ownership.

Builds write images/cache and may download dependencies; runtime tests create
containers/volumes. Obtain applicable approval. Rollback restores the old
configuration/images; clean up only disposable resources you created, never live
database volumes. A successful native build is not Docker validation.

## M06 — nullable response contracts (Low)

Correct Swagger nullability metadata for:

- `src/modules/expenses/dto/expense-response.dto.ts`: `description`, `fileRef`,
  `importJobId`.
- `src/modules/recurring-expenses/dto/recurring-expense-response.dto.ts`:
  `description`, `endDate`, `lastGeneratedDate`.

Verify actual response serialization first. Distinguish omitted and explicit-null
values. Add a focused OpenAPI/schema regression so optional fields do not regress
to non-null metadata; check representative runtime responses too.

Generate `shared/types/api.d.ts` through the project's live OpenAPI generator on
the disposable backend. Inspect the generated diff for unrelated drift. Fix
frontend consumers using shared types and proper null handling, not duplicate
interfaces, unsafe assertions, or placeholder values that erase meaning.

No database migration is required for this metadata fix itself. Coordinate with
M02 so generation occurs after backend schema/DTO changes and before frontend
implementation. Recovery restores metadata and its corresponding generated types
together. Both builds and null-value UI tests must pass.

## M07 — maintenance documentation and instruction drift (Low)

- Reconcile current priorities in `NEXT-TASKS.md` with the verified state. Preserve
  feature backlog items but place required maintenance ahead of optional features.
- Preserve the pre-existing untracked `STATUS.md`; do not stage it, replace it, or
  treat its deployment statements as live verification. Reference it as recorded
  operational context where useful. Ask before overwriting user-authored content.
- Inspect the cached upstream instruction fix before proposing another fix.
  `AGENTS.md` has a generated safety-kernel header: do not hand-edit generated
  content or modify the sibling generator repository under this task. If the
  missing-link repair is already upstream, record the exact commit and required
  separately authorized Git integration instead of duplicating it locally.
- Fix stale project-owned documentation claims where directly supported by code,
  including the contradictory cash-basis quarter example in `ATO-LOGIC.md`.
  Do not invent live deployment status, current tax thresholds, or framework
  support dates; cite verified primary sources for external claims.
- Keep native and Docker instructions distinct. Record authentication as pending;
  do not imply a public exposure check or restore drill has occurred.
- Update relevant active documentation and create the review report below. Avoid
  rewriting archived audits or performing a general documentation reorganization.

Validate links/paths and documented script names against actual files. Documentation
changes need no data backup. Generated/external instruction fixes that require
separate authority may remain explicitly blocked, not falsely marked completed.

## Final validation commands and prerequisites

Inspect current scripts before executing: these were the relevant commands at
audit time. Run from the repository root unless stated otherwise. Preserve real
exit codes and summarize failures without secrets.

```bash
pnpm exec eslint 'src/**/*.ts' 'test/**/*.ts'
pnpm run test --runInBand
pnpm run build
pnpm --filter web lint
pnpm --filter web exec vitest run
pnpm --filter web build
pnpm audit --json
```

Lint above is non-autofix. Jest and Vitest may write caches; builds write outputs.
Do not substitute root `pnpm run lint` without acknowledging its `--fix` effect.
Inspect diffs if autofix is intentionally used. The direct one-shot Vitest command
avoids the web `test` script's interactive/watch behaviour.

With an explicitly disposable, configured database/backend and synthetic key:

```bash
pnpm run migration:show
pnpm run generate:types
pnpm run test:e2e --runInBand
pnpm --filter web test:e2e
```

The migration CLI reads exported DB configuration; never assume a secret `.env`
was loaded or localhost points to disposable data. `test:e2e` imports the app and
may run migrations/seeders. Inspect and correct its setup/teardown if necessary.
Playwright may reuse an existing dev server locally: explicitly prevent connecting
to an unknown existing process/database and ensure the test owns its services.

Type generation needs the disposable backend on port 3000. If that port is owned
by another service, do not stop it; resolve a safe test arrangement first. Run
migration generation/up/down/reapply and Docker builds with exact reviewed
commands derived from the final config, recording their effects and results.
Do not install missing tools or start unknown services silently.

After final changes, run all applicable gates, targeted regressions, and relevant
Playwright import/income/report flows. Verify frozen installation in a clean
disposable environment once dependency/config changes settle. If full verification
is blocked, finish independent work and state the exact remaining prerequisite.

## Required delivery to Codex

Create `docs/audits/MAINTENANCE-REMEDIATION-2026-09.md` with:

1. Baseline and final HEAD, branch, starting user changes, and final diff summary.
   If no Git mutation was authorized, say changes remain uncommitted.
2. A table for M01–M07: `fixed`, `partially fixed`, `blocked`, or `not applicable`,
   with paths/lines, rationale, and evidence. Do not mark blocked runtime checks as
   passed. Any claim that an original finding was wrong needs concrete evidence.
3. For each behaviour fix, the regression scenario, command and expected failure
   before implementation, followed by command/result after implementation.
4. Exact commands, working directories, exit codes, test totals, coverage results,
   and warnings. Separate baseline failures, new failures, skipped checks, and
   unavailable checks. Include local versus CI versus Docker results distinctly.
5. Before/after direct and resolved dependency versions, advisory dispositions,
   dated primary-source links, and any justified override/exception.
6. Migration SQL summary, legacy-payment policy, disposable up/down/reapply results,
   data-loss risks, future backup/recovery requirements, and whether any live data
   was touched (it must not be under this handoff).
7. Generated-contract diff summary and evidence that generation used the final
   disposable backend schema. Do not include endpoint credentials or private URLs.
8. Remaining product limitations, approvals needed, and deferred live operations.
   Include authentication and historical receipt-date reconciliation explicitly.
9. A short reviewer checklist: areas most likely to hide regressions and exact
   commands needed to reproduce verification in a disposable environment.

Finish with a concise message identifying the report path, changed files, final
gate results, and unresolved items. Do not commit or deploy as a final convenience.
Stop when the implementation and evidence are ready for independent review.
