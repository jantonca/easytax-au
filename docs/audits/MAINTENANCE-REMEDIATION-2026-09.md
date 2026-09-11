# Maintenance Remediation Report — September 2026

**Task:** remediation of maintenance-audit findings M01–M07
(**docs/prompts/opencode-maintenance-remediation.md**).
**Date:** 2026-09-11 (updated after both independent review rounds).
**Executor:** OpenCode (GLM).

> **Status:** all M01–M07 code, tests and configuration are implemented, and
> the **database phase has been executed** against the disposable
> `easytax_audit` database on `127.0.0.1:5433` (baseline migration applied,
> additive migration generated/inspected/up-down-reapplied, shared types
> regenerated, both production builds green, integration suites 17/17 (7
> guard-only checks + 10 database-backed tests), Playwright 62 passed + 1
> skipped of 63). The independent review rounds R01–R10, S01–S05, T01, U01
> and the DB-phase D01/D02 + follow-up E01 are addressed (§8). The Docker
> image/runtime validation phase has also been executed (owner-approved
> commands). The only outstanding verification is **remote CI** (not
> authorized to push/run). The remediation is committed on branch
> `fix/maintenance-remediation-2026-09` (9 atomic commits off `3f87068`),
> awaiting push + remote CI.

---

## 1. Baseline and final state

| | At start | At report update |
|---|---|---|
| HEAD | `79403f2` (2026-06-22, `main`), behind `origin/main` by 1 | `3f87068` (2026-08-30, `main`), in sync with `origin/main` |
| Untracked user files | `STATUS.md`, handoff prompt | unchanged, untouched |
| Working tree | clean | clean — the remediation is committed on branch `fix/maintenance-remediation-2026-09` (9 commits); `STATUS.md` and the handoff prompt remain intentionally untracked |

During the work the repository owner fast-forwarded `main` from `79403f2` to
`3f87068` (AGENTS.md precedence note) — which also resolved the M07
upstream-instruction finding (§2). The remediation diff carried over intact.

**Verification-method correction (R08):** the executor's first report captured
exit codes through pipes (`cmd | tail; echo $?`), which reported `tail`'s
status, not the command's. The "clean build/lint" claims in the first draft
did not hold. Every gate in §4 below has since been re-run with the exit code
captured directly, and the failures Codex found were fixed.

### Final diff summary (committed on the remediation branch)

- **Modified (47):** manifests + lockfile (`package.json`, `web/package.json`,
  `pnpm-lock.yaml`, `pnpm-workspace.yaml`), Docker/compose/dockerignore, CI
  workflow, BAS/Incomes/CSV-import services + DTOs + specs,
  expenses/recurring response DTO metadata, reports controller + PDF service,
  `NEXT-TASKS.md`, `docs/core/{ATO-LOGIC,PATTERNS,TROUBLESHOOTING}.md`.
- **Added (14):** `docs/core/CASH-BASIS-DESIGN.md`,
  `src/common/contracts/openapi-nullability.spec.ts`,
  `src/common/services/au-date.ts`,
  `src/modules/csv-import/csv-import.controller.spec.ts`,
  `src/modules/incomes/dto/mark-income-paid.dto.ts`,
  `src/modules/incomes/incomes.controller.spec.ts`,
  `test/bas-payment-date.e2e-spec.ts`, `test/multer-hardening.e2e-spec.ts`,
  `test/guards/disposable-db-guard.ts`,
  `web/src/features/reports/bas-report-page.test.tsx`, plus the handoff and
  the two audit reports.
- **Deleted (2):** `web/.dockerignore`, `web/pnpm-lock.yaml` — the nested
  lockfile's only consumer was the old context-scoped `web/Dockerfile`; all
  remaining install paths use the root workspace lockfile (frozen install
  verified in §4).
- `STATUS.md` preserved untracked and unmodified. Nothing staged; no commits,
  branches, stashes or pushes by the executor.

---

## 2. M01–M07 disposition table

| ID | Status | Key paths | Evidence / rationale |
|---|---|---|---|
| M01 Multer & dependency vulnerabilities | **fixed** (two runtime checks still require the disposable backend: malformed-multipart survival + 5 MB limit — `test/multer-hardening.e2e-spec.ts` is written and guarded) | `package.json` (multer ^2.3.0), `pnpm-workspace.yaml` (overrides), `web/package.json` (react-router 7.18.3, vitest 3.2.7, postcss ^8.5.23), lockfile | Both multer copies fixed: direct 1.4.5-lts.2 → **2.3.0** and the adapter-resolved parser 2.0.2 → **2.3.0** (verified via `require.resolve` from `@nestjs/platform-express`). Nest 11.1.11 → **11.2.3** (in-major; fixes its pinned `path-to-regexp` 8.3.0 → 8.4.2 and `file-type` 21.2.0 → 21.3.4). Audit: **123 → 2 entries** (0 critical/high; remaining 2 = documented dev-only vitest moderate, §5). `allowBuilds` preserved. Frozen clean install: exit 0, single multer 2.3.0. |
| M02 Cash-basis BAS used invoice date | **fixed** (migration generated, inspected, up/down/reapplied; DB-backed attribution regression executed) | `income.entity.ts` (`payment_date` + index), `bas.service.ts` (attribution + unreconciled), `incomes.service.ts` (transitions incl. R04 hardening), `mark-income-paid.dto.ts`, `income-csv-import.service.ts` (strict receipt-date column), `src/common/services/au-date.ts`, `docs/core/CASH-BASIS-DESIGN.md` | Design doc written before migration work; ATO cash-attribution guidance verified against primary sources (ATO "Choosing an accounting method" + GSTR 2000/13 [12]/[14], dated links in the design doc). CASH attributes by `payment_date`; ACCRUAL unchanged; legacy paid-with-unknown-date rows are excluded from CASH attribution **and reported** (`unreconciledPaidIncomeCount`/`…TotalCents` + UI banner); mark-paid requires a real receipt date (null bypass closed, R04); contradictory payloads 400 at the HTTP boundary; CSV `Receipt Date` column with strict validation (R05); AU-business-timezone "today" (R07). DB-backed regression **executed**: `test/bas-payment-date.e2e-spec.ts` passes against the disposable DB (cross-quarter attribution, legacy-unknown reporting, HTTP null rejections with unchanged persistence, dry-run zero-write counts). Migration `1789113727162-AddIncomePaymentDate` generated on the disposable DB (§6) and shared types regenerated (§7). |
| M03 Incomplete CI gates | **fixed** | `.github/workflows/e2e-tests.yml` | `backend-checks` (non-autofix lint, `test:cov --runInBand` + artifact, build, `test -f dist/src/main.js`), `frontend-checks` (lint, one-shot vitest, build, bundle check), `backend-integration` (own ephemeral Postgres, `test:e2e --runInBand` — runs the new DB-backed suites, R09), e2e Playwright job unchanged in flows; `|| echo` masking replaced with `test -f`; one-shot only; process cleanup retained; **encryption key is a synthetic literal — no repository secret is referenced**. Node 22 + pnpm 11.8.0 kept; no action upgrades. Remote CI execution itself remains **unverified** (not authorized). |
| M04 `dryRun` silently ignored | **fixed** (DB-backed zero-write run still needs the disposable DB) | `csv-import.controller.ts` (both force-`false` overrides removed), `csv-import.dto.ts` (`StrictBoolean`), new content DTOs, services skip import-job writes in dry-run, `csv-import.controller.spec.ts` | Reproduced first (11 failing HTTP-path tests, incl. multipart `"false"` → `true` via implicit conversion — evidence in §3.2), then fixed; 21/21 controller tests + 218/218 csv-import suite. Zero-write HTTP proof is encoded in `test/bas-payment-date.e2e-spec.ts` (counts across five tables before/after). |
| M05 Docker build context | **fixed + validated** (both images built and runtime-checked in disposable containers; two runtime defects found and fixed) | `docker-compose.yml` (web context `.`), `web/Dockerfile` (root-context COPY paths, root lockfile, **copies `/app/web/node_modules` too** — R03), `Dockerfile` (workspace manifests copied; `pnpm prune --prod` — a silent no-op in workspaces — replaced by `pnpm --filter easytax-au install --prod --frozen-lockfile`; healthcheck `/` → `/health`), `.dockerignore` rewritten | Install mechanics validated locally: frozen install fails without `pnpm-workspace.yaml` (lockfile records overrides); filtered prod install verified to drop jest/vite/eslint/typescript and keep runtime deps. **Docker phase executed 2026-09-11** (owner ran the approved commands; executor validated output): both images build from the rewritten Dockerfiles (`easytax-au-api:test` 856 MB, `easytax-au-web:test` 77 MB); containerised backend starts, applies no pending migrations against the disposable DB, `/health` = ok + `database: connected`, image HEALTHCHECK healthy; web container serves the SPA and proxies `/api/health` through nginx's rewrite to the compose service name. Two runtime defects were found and fixed **during** the phase: (1) `USER nginx` in the web image prevented binding port 80 (`bind() ... Permission denied`) — master now stays root to bind <1024 while workers stay unprivileged via nginx.conf's `user nginx;`; (2) the image HEALTHCHECK probed `localhost` (busybox tries `::1` first) against an IPv4-only listener and never passed — probe changed to `127.0.0.1`, container now reports `healthy`. Cleanup of all test containers/network/images after the phase (§9). Exact commands in §9. |
| M06 Nullable response contracts | **fixed** (metadata + contract regression + regeneration + runtime-verified consumers) | `expense-response.dto.ts` (description/fileRef/importJobId), `recurring-expense-response.dto.ts` (description/endDate/lastGeneratedDate), `src/common/contracts/openapi-nullability.spec.ts` | Serialization verified first: the service sets these fields **explicitly** (JSON `null`). Contract regression asserts `nullable: true` (failing → fixed → passing). `generate:types` executed on the final disposable backend schema (§7); frontend consumers compile against the regenerated types and the production web build is green; the one new consumer defect surfaced by regeneration (recurring undo-restore passing explicit null into a create DTO) was fixed with `?? undefined`. |
| M07 Documentation & instruction drift | **fixed** | `NEXT-TASKS.md`, `docs/core/ATO-LOGIC.md`, `docs/core/TROUBLESHOOTING.md`, `docs/core/PATTERNS.md`, `docs/core/CASH-BASIS-DESIGN.md` | ATO-LOGIC cash example corrected (paid Feb → Q3 reports it); handling section rewritten with payment-date semantics + explicit limitations. TROUBLESHOOTING multipart/dry-run entries updated to the current mechanism. PATTERNS multipart-boolean pattern rewritten (no more force-`false` advice). NEXT-TASKS: maintenance-first table with honest blockers, auth as next milestone, feature backlog preserved (file kept CRLF endings). Upstream instruction fix: owner's fast-forward to `3f87068` already replaced the inert inherited-rules block — **resolved upstream by commit `3f87068`, no local duplication, generator repo untouched**. `STATUS.md` preserved; its statements treated as recorded context, not live verification. |

The original audit findings were re-verified against the current checkout
before each change; none was contradicted. (Scope correction only: the
installed tree contained exactly **two** multer copies, both vulnerable; both
are now the single 2.3.0.)

---

## 3. Behaviour fixes: failing test → fix → passing

### 3.1 M04 — dryRun honoured at the HTTP boundary

- **Spec:** `src/modules/csv-import/csv-import.controller.spec.ts` (supertest
  over a TestingModule app with the exact production ValidationPipe config).
- **Before:** 11 failed / 10 passed — `dryRun=true` forced false; multipart
  `"false"` coerced to boolean `true`; invalid strings returned 201.
- **Root-cause evidence:** `plainToInstance` with `enableImplicitConversion`
  coerces primitives (`Boolean("false")` → true) **before** `@Transform` runs;
  verified with scratch scripts against the installed class-transformer 0.5.1
  (including proving `@Type(() => Object)` suppresses the pre-coercion).
- **After:** 21/21 controller tests; full csv-import suite 218/218 (with R05
  additions).

### 3.2 M02 payment-date semantics

- 14 new service-level tests failed first (create-paid-without-date,
  contradictory transitions, CASH `payment_date` attribution clauses,
  unreconciled totals); 4 new CSV receipt-date tests failed first.
- HTTP boundary: `incomes.controller.spec.ts` (empty body / invalid date /
  datetime-not-date-only → 400 at the boundary).
- Timezone bug caught by the first AU-format test (local-midnight shift under
  UTC+10) — fixed via UTC-midnight construction, later moved to the shared
  strict helper (R05/R07).
- DB-backed attribution regression: `test/bas-payment-date.e2e-spec.ts`
  (cross-quarter, same-quarter, quarter/FY boundaries, paid→unpaid, legacy
  unknown, HTTP validation rejections, dry-run zero-write counts across
  `expenses`/`incomes`/`import_jobs`/`providers`/`clients`). **Written,
  lint-clean, not yet executed** — needs the disposable DB.

### 3.3 R04 — null bypass of the required receipt date

- Failing tests added: `update({ isPaid: true, paymentDate: null })` on an
  unpaid income (currently saved as paid+null) and `create({ isPaid: false,
  paymentDate })` (silently discarded the contradictory date). Both red for
  the expected reason, then fixed.
- Contract (enforced in `IncomesService.update`/`create`, documented in the
  design doc): newly marking an unpaid income paid requires a **real** date —
  explicit null is rejected (class-validator `@IsOptional` skips null, so the
  service owns this rule). An **already-paid** income may receive
  `paymentDate: null` — a deliberate re-entry into the documented
  "receipt date unknown" state (drops a captured date). `isPaid: false` always
  clears the date.
- HTTP verification for the null cases lives in
  `test/bas-payment-date.e2e-spec.ts`: `PATCH { isPaid: true, paymentDate:
  null }` on an unpaid income → 400 with persisted state unchanged; on an
  already-paid income → 200, re-entering the unknown state; `POST /incomes`
  with `isPaid: false` + a date → 400. **Status: written and lint-checked,
  not yet executed** — they run in the DB-dependent phase and are not claimed
  as executed.

### 3.4 R05 — CSV receipt dates must not shift calendar days

- Failing tests: `2026-06-31` and `31/06/2026` previously rolled to July 1;
  timestamp values (`2026-07-01T00:30:00+10:00`) truncated silently.
- Fix: shared strict parser `parseStrictDateOnly` in
  `src/common/services/au-date.ts` — accepts only `YYYY-MM-DD` / `D/M/YYYY`,
  validates the calendar date by component round-trip, returns null otherwise;
  the import service **fails the row** with a clear error instead of
  guessing. The manual path (`IncomesService.parseDateOnly`) shares the same
  helper.

### 3.5 R06 — cash-basis PDF shows the basis and the incomplete-data warning

- Failing content tests first; `generateBasPdf`/`generateFYPdf` now emit
  uncompressed streams (`compress: false` — negligible size cost on one-page
  reports) so the rendered text is assertable without a new dependency:
  `Accounting basis: CASH` + `Incomplete data: N paid income(s) have no
  recorded receipt date ($X.XX including GST). Not included in the totals
  above; …`. 21/21 PDF tests pass.

### 3.6 R07 — "today" is the Australian business day

- Failing test with the clock fixed to `2026-06-30T15:00:00Z` (= July 1,
  01:00 Sydney): `markAsPaid '2026-07-01'` was rejected as "future".
- Fix: `australianTodayIso()` (Intl, `Australia/Sydney`, `en-CA`) used by the
  service's future-date check and by the web dialog's suggested date.
  Boundary tests included (accept today-in-Sydney, reject after it).

---

## 4. Commands, exit codes, totals (all captured directly, repo root)

Environment: Node v24.21.0 (declared engines `>=22 <23` — warns), pnpm 11.8.0.

**Final local gates (post-DB-phase, exit codes captured directly):**

| Gate | Command | Final result |
|---|---|---|
| Backend unit tests | `pnpm run test --runInBand` (exit 0) | **715 passed / 715, 28 suites** (incl. the U01 + D01 contract regressions) |
| Backend build | `pnpm run build` (exit 0) | pass |
| Backend lint (non-autofix) | `pnpm exec eslint 'src/**/*.ts' 'test/**/*.ts'` (exit 0) | 0 problems |
| Backend integration (disposable DB) | `pnpm run test:e2e --runInBand` (exit 0) | **17/17** |
| Web unit tests | `pnpm --filter web exec vitest run` (exit 0) | **587 passed + 2 skipped** (60 files) |
| Web lint | `pnpm --filter web lint` (exit 0) | 0 errors, **3 warnings** (the pre-existing `react-hooks/incompatible-library`; the interim `no-unsafe-argument` warning disappeared after type regeneration) |
| Web build | `pnpm --filter web build` (exit 0) | **pass** (the four stale-type TS2339 errors cleared after regeneration; one consumer null-handling fix applied, §7) |
| Playwright | `pnpm --filter web test:e2e` with CI=1 (exit 0) | **62 passed, 1 skipped (63 total)** (2.2 min; own dev server; the skip is pre-existing) |
| Audit | `pnpm audit --json` (exit 1 = advisories present) | `{critical: 0, high: 0, moderate: 2, low: 0}` — the 2 are `vitest` + `@vitest/mocker` (GHSA-82fw-gwwq-j7x9, dev-only; disposition in §5) |
| Frozen clean install | fresh dir: root+web manifests, root lockfile, workspace yaml → `pnpm install --frozen-lockfile` (exit 0) | pass; `multer` resolves to a single 2.3.0 |
| Root `tsc --noEmit` (supplementary) | `pnpm exec tsc --noEmit --incremental false --project tsconfig.json` | **3 diagnostics, all pre-existing baseline test debt** (`app.controller.spec.ts`, `csv-import.service.spec.ts` `recordsTotal`, `recurring-expenses.controller.spec.ts` fixture) |
| Docker image builds (owner-executed, executor-validated) | `docker build` (backend, repo-root context) + `docker build -f web/Dockerfile --build-arg VITE_API_URL=/api .` | both FINISHED; `easytax-au-api:test`, `easytax-au-web:test` |
| Docker runtime (disposable net + easytax_audit DB) | `docker run` backend + web; `/health`, `docker ps` health status, proxied `/api/health`, SPA index | backend healthy + DB connected; frontend serving OK; proxy rewrite OK; web `(healthy)` after the healthcheck fix |
| Docker cleanup | `docker rm -f` (2 containers) + `rmi` (2 images) done; `network rm` initially failed (`active endpoints` — the retained DB container was still attached), resolved by `docker network disconnect easytax-audit-net easytax-audit-pg` first; runbook cleanup corrected accordingly | disposable resources removed; `easytax-audit-pg` retained by owner |

**Earlier run (before the DB phase) recorded for history:** 712 tests, web
build blocked by 4 stale-type errors — superseded by the rows above.

Coverage of the changed critical paths (per-file, no global thresholds added):

| File | Stmts | Branch | Lines | Note |
|---|---:|---:|---:|---|
| `money.service.ts` | 100% | 100% | 100% | |
| `au-date.ts` (new) | 100% | 100% | 100% | |
| `bas.service.ts` | 100% | 86% | 100% | branch gaps are G10/G11 mock-shape branches |
| `incomes.service.ts` | 97.22% | 93.93% | 97.14% | target met |
| `csv-import.service.ts` (expense) | 94.26% | 78.70% | 94.54% | statements/lines above 80%; branch target not met |
| `income-csv-import.service.ts` | 84.70% | 73.61% | 85.98% | remaining branch gaps are the pre-existing legacy invoice-`parseDate` chain (unchanged debt) |

Statement/line coverage on every changed money/reporting/mutation path meets
the 80%+ project target; branch coverage on the two CSV importers does not,
and that is reported as-is (no threshold added, none lowered; no new coverage
provider dependency). Frontend coverage was **not** collected (no UI coverage
provider installed; adding one would need install approval) — the 587-test
total does not establish the 60% UI target.

**Executed during the DB phase (2026-09-11, disposable `easytax_audit` on 127.0.0.1:5433):**

- `migration:show` → pending InitialSchema shown; `migration:run` → baseline
  applied (exit 0); generated `AddIncomePaymentDate` (exit 0; SQL reviewed:
  `ADD COLUMN "payment_date" date` + `CREATE INDEX "idx_incomes_payment_date"`,
  nothing else); `migration:run` (up) → `migration:revert` (column gone) →
  `migration:run` (reapplied) → `migration:show` shows both migrations `[X]`.
- `pnpm run build` exit 0 → disposable backend started with the synthetic key
  → `/health` ready (`{"status":"ok","database":"connected"}`) →
  `pnpm run generate:types` exit 0 (§7) → `pnpm --filter web build` **exit 0**
  (the four stale-type TS2339 errors cleared as expected).
- Backend integration suites `pnpm run test:e2e --runInBand` **exit 0,
  17/17** (four suites: 7 guard-only checks + 10 database-backed tests) —
  first execution surfaced three fixture defects in the new specs
  themselves (missing `source` field on expense uploads — the real frontend
  always sends it; CSV `Item` not matching a seeded provider; income import
  missing `markAsPaid`) and one genuine endpoint defect: the preview
  endpoints returned the Nest-default 201 while their own Swagger documents
  200 — fixed with `@HttpCode(HttpStatus.OK)` (pre-existing mismatch,
  found during execution, not introduced by it).
- Playwright `pnpm --filter web test:e2e` **exit 0, 62 passed + 1 skipped (63 total)** — first run
  required the Playwright chromium download (standard tooling prerequisite,
  user-cache scoped), data-state correction (seeders were skipped because the
  jest suite had seeded a provider first; DB reset to clean seeded state),
  and spec updates to the M02 UI contract (receipt-date dialog flow, dated
  paid badge, `?basis=` route glob).

**Pending (exact prerequisite in §9):**

- Remote CI — pushing/running workflows not authorized; the YAML is validated
  locally (jobs parse; all ENCRYPTION_KEY values are synthetic literals).

---

## 5. Dependency work — before/after, dispositions

Direct + resolved version changes (installed-tree evidence, not lockfile-only
claims):

| Package | Before | After | Why |
|---|---|---|---|
| multer (direct) | 1.4.5-lts.2 | **2.3.0** | GHSA-wc9g-mqfw-jrwm + five other HIGH multipart advisories affect < 2.3.0 |
| multer (via `@nestjs/platform-express`) | 2.0.2 | **2.3.0** | same advisories; Nest 11.x pins below 2.3.0 (2.2.0 in 11.2.3) → override |
| @nestjs/{core,common,platform-express} | 11.1.11 | **11.2.3** | in-major minor bump; brings patched `path-to-regexp` 8.4.2 + `file-type` 21.3.4 |
| @nestjs/swagger | 11.2.3 | **11.4.7** | pins `js-yaml` 4.1.1/`path-to-regexp` 8.3.0 in 11.2.x; 11.4.7 pins fixed versions |
| typeorm | 0.3.28 | **0.3.31** | CVE-2026-73651 (`migration:generate` template-literal injection) — reachable via this project's own migration CLI |
| csv-parse | 6.1.0 | **7.0.2** | CVE-2026-85063 prototype pollution via `columns:true` — runtime-reachable through the import endpoints |
| body-parser / qs | 2.2.1 / 6.14.1 | **2.3.0 / 6.16.0** | in-range updates (express 5.2.1 chain) |
| handlebars | 4.7.8 | **4.7.9** | ts-jest chain (dev); critical fixed in-range |
| lodash | 4.17.21 | **4.18.0** | CVE-2026-4800 (GHSA advisory page fetched 2026-09-11; patched 4.18.0; the metadata's "4.17.24" does not exist in the registry) |
| react-router(-dom) | 7.11.0 / ^7.0.2 | **7.18.3** | 7 HIGH + 7 moderate advisories; max patch floor ≥ 7.18.0 (in-major) |
| vitest | 2.1.9 | **3.2.7** | critical < 3.2.6; also removes vite@5/esbuild@0.21 from the tree |
| postcss (web, exact pin) | 8.5.6 | **^8.5.23** | high/moderate advisories, patch ≥ 8.5.23 |
| serialize-javascript / ajv (8.x) / picomatch (4.x) | 6.0.2 / 8.17.1 / 4.0.2 | **7.0.5 / 8.20.0 / 4.0.7** | narrow overrides for dev-only chains |
| rollup, minimatch (3/5/9/10), brace-expansion (1/2), flatted, webpack, diff, @babel/core, ws, nanoid, browserslist, form-data, fast-uri, uuid, glob | vulnerable | in-range patched | dev/build chains; `pnpm update`/`dedupe` within declared ranges |

Overrides (in `pnpm-workspace.yaml` — pnpm 11 no longer reads
`pnpm.overrides` from package.json, which the first install silently proved)
— each with an explicit removal condition in the file:

1. `multer@<2.3.0 → 2.3.0` — remove when platform-express declares ≥ 2.3.0.
2. `lodash@<4.18.0 → 4.18.0` — remove when @nestjs/config declares ≥ 4.18.0.
3. `serialize-javascript@<7.0.5 → 7.0.5` — remove when terser-webpack-plugin
   supports ≥ 7 (dev-only @nestjs/cli chain).
4. `ajv@>=8 <8.20.0 → 8.20.0`, `picomatch@<4.0.4 → 4.0.7` — dev-only
   @nestjs/schematics chain; dependents' ranges accept the patches; **must
   stay scoped to major 8** (an unscoped ajv selector caught ajv 6 and broke
   eslint — caught locally).
5. `ajv@<8.18.0`/`picomatch@2`-class updates also fixed in-range; no
   suppression flags used anywhere; no `audit fix --force`.

**Remaining advisory (documented disposition):** `vitest@3.2.7` /
`@vitest/mocker@3.2.7` — CVE-2026-84373 (GHSA-82fw-gwwq-j7x9, moderate 5.9):
path traversal via the **test dev server's** mocker WebSocket; fixed only in
vitest 4.1.11+ (a two-major test-framework jump, out of scope; vitest never
ships in production runtime and its browser-mode registration is
token-authenticated). Recorded as accepted residual + follow-up, not as
"cleared".

---

## 6. Migration (M02) — design, expected SQL, and safety

**Status: not generated yet — environment blocker, not an omission of intent.**
`synchronize` is false everywhere; the checked-in migrations currently cannot
create the new column, so until the migration exists the entity must not ship
(R02, accepted). No live data exists on this machine; the homelab Postgres was
never touched.

Expected additive migration (to be **generated**, not hand-written, via
`pnpm run migration:generate src/migrations/AddIncomePaymentDate` against the
disposable DB at the baseline state):

```sql
ALTER TABLE "incomes" ADD COLUMN "payment_date" date NULL;
CREATE INDEX "idx_incomes_payment_date" ON "incomes" ("payment_date");
```

Any unrelated drift in the generated SQL → fix the entity, regenerate, never
hand-edit.

Validation sequence (disposable `easytax_audit` on port 5433) — **executed
2026-09-11 with exit 0 at every step; results in §4**:

1. **Apply the baseline migration first.** `migration:generate` diffs the
   entities against the CURRENT database: on an empty database it would emit
   the entire schema instead of the additive payment-date change. So:
   `pnpm run migration:show` (showed the pending InitialSchema) →
   `pnpm run migration:run` (baseline state established).
2. `pnpm run migration:generate src/migrations/AddIncomePaymentDate` →
   SQL reviewed: exactly `ALTER TABLE "incomes" ADD "payment_date" date` and
   `CREATE INDEX "idx_incomes_payment_date"` — no unrelated drift. (The
   generated file was then prettier-normalized to project style;
   formatting only.)
3. `migration:run` (up) → `migration:revert` (verified column/index gone) →
   `migration:run` (reapplied; `migration:show` shows both `[X]`).
4. `pnpm run build` (fresh dist), disposable backend started with the
   synthetic `ENCRYPTION_KEY` (one restart mishap recorded honestly: the
   first stop killed only the pnpm wrapper and left the node child holding
   port 3000, so a health check initially answered from stale code — resolved
   by killing the node process and restarting; the runbook now captures the
   PID and kills it at the end), `/health` readiness confirmed, then
   `pnpm run generate:types` → generated diff reviewed (§7) → web build gate
   → integration suites → Playwright.

Data-loss / rollback facts (also in the design doc): dropping `payment_date`
later loses captured receipt dates; a code rollback restores invoice-date cash
attribution only for records with NULL dates (records with a captured date
keep it, but pre-M02 code ignores it). Before any **future live** migration: a
verified DB backup and a separate receipt-date preservation/reconciliation
plan are mandatory — no live migration is authorized by the handoff.

**Legacy policy** (user impact): pre-existing paid incomes keep
`payment_date = NULL`; excluded from CASH quarter attribution, reported
explicitly (`unreconciledPaidIncomeCount`/`…TotalCents` + UI banner + PDF
warning). No dates inferred from invoice date, `updatedAt`, migration time, or
the current date; no unknown assigned to an arbitrary quarter; historical
paid CSV rows without a receipt date import as paid-with-unknown + a visible
row warning.

**Known limitations** (documented in `CASH-BASIS-DESIGN.md`): no partial-
payment model (ATO pro-rata attribution not expressible); expense GST credits
still attributed by expense date on both bases (no expense payment tracking);
ACCRUAL uses invoice date only (GSTR 2000/13 [14] "earlier of" rule).

---

## 7. Generated-contract changes (executed)

`shared/types/api.d.ts` was regenerated against the **final disposable
backend schema** (migration applied, backend rebuilt from the final DTO set,
`/health` confirmed `database: connected` immediately before generation).
Diff: 83 changed lines, exactly the designed contract and nothing else:

- `Income`-shaped schemas: `paymentDate?: string | null`;
- `IncomeResponseDto` field formats match the actual serialization:
  `date` and `paymentDate` are `type: string, format: date` (PostgreSQL date
  columns hydrate as plain date strings — verified live), `createdAt` /
  `updatedAt` (income and client) are `format: date-time`;
- `CreateIncomeDto` / `UpdateIncomeDto`: `paymentDate?: string | null` with
  `type: "string", format: "date"` (the U01 regression pins this shape);
  `MarkIncomePaidDto`: `paymentDate: string` with the paid-endpoint
  requestBody;
- `BasSummaryDto`: `basis`, `unreconciledPaidIncomeCount`,
  `unreconciledPaidIncomeTotalCents`;
- `ExpenseResponseDto` / `RecurringExpenseResponseDto`: `| null` on the six
  M06 fields;
- `CsvImportResponseDto` / `IncomeCsvImportResponseDto`: `importJobId:
  string | null` — the first regeneration emitted
  `Record<string, never> | null` for these two fields (the same missing
  explicit-type class as U01, on the CSV response DTOs); fixed by adding
  `type: String` and regenerating against the restarted backend.

Frontend consumers use the shared types (`components['schemas']`) or the
hand-maintained `IncomeResponseDto` (extended with `paymentDate`) — no
duplicates, no unsafe assertions, no placeholder values. Regeneration
surfaced exactly one new consumer defect: the recurring-expense undo-restore
copied response fields that are now explicitly `null` into a create DTO that
takes `undefined` — fixed with `?? undefined` in
`use-recurring-mutations.ts`; the production web build is green against the
regenerated types.

---

## 8. Response to the independent reviews

### Round 1 (R01–R10)

Source: `docs/audits/MAINTENANCE-INDEPENDENT-REVIEW-2026-09.md`
(verdict: changes required). Dispositions:

| ID | Verdict | Response |
|---|---|---|
| R01 Backend build fails (TS1016) | Confirmed — the executor's piped exit-code checks were unreliable | **Fixed**: `basis` is now a required TS parameter typed `string | undefined` placed after `res`; build re-run → exit 0 (captured directly); controller spec updated. |
| R02 No migration / stale shared types | Confirmed — environment blocker at the time | **HISTORICAL — resolved in the DB phase**: the disposable DB was started by the owner; the baseline was applied, the additive migration generated/inspected/up-down-reapplied, and the shared types regenerated from the final backend schema (see §6/§7 and §4 executed rows). |
| R03 Web builder loses `web/node_modules` | Confirmed | **Fixed**: builder stage copies `/app/web/node_modules` from the deps stage alongside the root store; comment explains the pnpm workspace layout. Verified by the executed Docker builds. |
| R04 `paymentDate: null` bypass | Confirmed | **Fixed**: newly-paid transition now requires a non-null validated date; create rejects a date on unpaid payloads; already-paid null = documented re-unknown; service tests + HTTP regressions added. |
| R05 CSV date rollover / timestamps | Confirmed | **Fixed**: shared strict `parseStrictDateOnly` (round-trip component validation, date-only formats only); invalid values **fail the row** with a clear error; covered by three new failing-first tests. |
| R06 Cash PDF omits warning | Confirmed | **Fixed**: PDF states `Accounting basis:` and renders a prominent incomplete-data warning (count + cents + reconciliation path) for CASH summaries with unknowns; content asserted by decoding the uncompressed streams. |
| R07 UTC "today" rejects early-morning AU dates | Confirmed | **Fixed**: `australianTodayIso()` (Australia/Sydney) for future-date validation and the web suggestion; boundary tests added (fail-first). |
| R08 Backend lint fails / report wrong | Confirmed | **Fixed**: formatting + unused identifiers corrected; every gate re-run with directly captured exit codes; this report corrected (28 suites, not 26; coverage branch distinction added; the piped-exit-code error acknowledged). |
| R09 CI never runs the integration suites | Confirmed | **Fixed**: new `backend-integration` job (own ephemeral Postgres, synthetic key, one-shot `test:e2e --runInBand`, data lifecycle separate from Playwright). Follow-up defect S01 corrected in round 2 (provisioned DB name now matches `DB_NAME` exactly — verified by parsing the workflow). |
| R10 Unguarded destructive setup | Confirmed | **Fixed**: `test/guards/disposable-db-guard.ts` runs at the top of all three integration specs; hardening follow-ups from round 2 (S03) applied: separator-bounded name tokens (rejects "contest"), explicit `DB_PORT` requirement (rejects the default-port case). Guard has its own 7-test regression suite. |
| Secret preference in CI | Confirmed | **Fixed**: `ENCRYPTION_KEY` is a synthetic literal everywhere; no repository secret referenced. |
| PATTERNS.md force-`false` advice | Confirmed | **Fixed**: pattern rewritten to the current `StrictBoolean` mechanism. |
| NEXT-TASKS "complete" labels / 26 suites | Confirmed | **Fixed**: labels corrected to "implemented, NOT complete" with named blockers; suite count corrected to 28. |

### Round 2 (S01–S05)

Source: `docs/audits/MAINTENANCE-INDEPENDENT-REVIEW-2026-09-ROUND2.md`.

| ID | Verdict | Response |
|---|---|---|
| S01 CI provisions a different DB than it connects to | Confirmed — the service created `easytax_it_au` while the step used `easytax_it_au_disposable_test` | **Fixed**: service `POSTGRES_DB` now equals the step's `DB_NAME` (`easytax_it_au_disposable_test`); agreement verified programmatically from the parsed workflow, and the name passes the guard's token check. Actual job execution still requires remote CI (unverified). |
| S02 Paid-to-unpaid edit submits a contradictory date | Confirmed | **Fixed** with fail-first tests: the form now carries `wasPaid` (previous state, never rendered); the receipt date is submitted only when the FINAL state is paid; unchecking clears it from the payload. Second part of the finding also fixed: the schema required a date for ANY paid record, blocking unrelated edits of legacy paid records — the requirement now applies only to newly marking an income paid, so a legacy record's unknown state is preserved as documented. Web suite: 587 passed + 2 skipped. |
| S03 Guard accepts accidental substrings / unspecified port | Confirmed | **Fixed**: token-bounded name check (`(?:^|[-_])(?:test|audit)(?:$|[-_])` rejects "contest"), explicit `DB_PORT` requirement (numeric, 1–65535) so the executor must name the intended instance; new `test/guards/disposable-db-guard.e2e-spec.ts` covers the accepted target, "contest", unseparated names, missing/non-numeric port, wrong NODE_ENV, missing host/user (7/7 passing, pure-function tests). |
| S04 Claimed HTTP null regression absent | Confirmed — the report claimed evidence that did not exist | **Fixed**: the null cases are now actually written into `test/bas-payment-date.e2e-spec.ts` (unpaid→paid with null → 400 + unchanged persistence; already-paid → 200 re-unknown; create with date-on-unpaid → 400) and §3.3 now distinguishes **written** from **executed** — these have not been executed (DB-dependent phase). |
| S05 `test/app.e2e-spec.ts` leaves the application open | Confirmed (lifecycle inspection) | **Fixed**: `afterEach` closes the app; the two new suites additionally destroy the DataSource explicitly after `app.close()` (guarded by `isInitialized`). Follow-up defect T01 (round 3) fixed — see below. The suites are expected to exit naturally without `--forceExit`; this is lifecycle-level verification only until the suites run against the disposable DB. |

### Round 3 (T01 + runbook)

Source: `docs/audits/MAINTENANCE-INDEPENDENT-REVIEW-2026-09-ROUND3.md`.

| ID | Verdict | Response |
|---|---|---|
| T01 multipart teardown references undeclared `dataSource` | Confirmed (TS2304 ×3, no DB needed) | **Fixed**: the suite now declares `dataSource` and obtains it from the testing module (`module.get(DataSource)`) before the guarded `destroy()`; verified by the direct TypeScript run (root `tsc --noEmit` diagnostics caused by remediation-added files: **0**; remaining root-tsc diagnostics are 3 pre-existing baseline test-debt items, listed below). |
| Runbook: baseline migration not applied before `migration:generate` | Confirmed — on an empty DB, generate emits the whole schema instead of the additive diff | **Fixed** in §6 and §9: the sequence now runs `migration:show` → `migration:run` (InitialSchema baseline) **before** `migration:generate`, with the rationale stated. |
| Runbook: stale dist before starting the compiled backend | Confirmed | **Fixed**: `pnpm run build` precedes `pnpm start:prod`, and a `/health` readiness wait precedes `generate:types` (§6 and §9). |
| Runbook: no explicit synthetic encryption config | Confirmed | **Fixed**: the runbook exports a literal synthetic `ENCRYPTION_KEY` for disposable local runs (matches the CI job's literal). |
| Root tsc diagnostic: `UpdateIncomeDto` types `paymentDate` as `string | undefined` while runtime supports null on already-paid records | Confirmed | **Fixed** (not cast away): `CreateIncomeDto.paymentDate` is now `string | null` (nullable in Swagger), `create()` builds the payment date without a non-null assertion, and `update()` uses the `paymentDate !== undefined` narrowing so the declared update contract matches the deliberate runtime behaviour. |
| Root tsc diagnostic: guard test imports `@jest/globals` (unresolvable to the root resolver) | Confirmed | **Fixed**: the guard spec now uses the ambient jest globals like every other spec in the project. |
| Root tsc diagnostic: stale `BasSummaryDto` fixtures | Partially pre-existing debt; completed where touched | `bas.controller.spec`, `reports.controller.spec`, `pdf.service.spec` fixtures now carry the full contract (they already missed `g10CapitalPurchasesCents`/`g11NonCapitalPurchasesCents` at baseline). Remaining root-tsc diagnostics: `app.controller.spec.ts` (pre-existing), `csv-import.service.spec.ts` `recordsTotal` (pre-existing), `recurring-expenses.controller.spec.ts` fixture (pre-existing) — unchanged baseline debt, not attributed to this iteration. |

### Round 4 (U01)

Source: `docs/audits/MAINTENANCE-INDEPENDENT-REVIEW-2026-09-ROUND4.md`.

| ID | Verdict | Response |
|---|---|---|
| U01 nullable `paymentDate` advertised as `type: object` in Swagger | Confirmed — reproduced independently from the compiled DTO before fixing (`{"type":"object","nullable":true}`) | **Fixed**: `CreateIncomeDto.paymentDate` now carries explicit `type: String, format: 'date', nullable: true`. **Fixed** the second part of the finding: `PartialType` (@nestjs/mapped-types) does not copy Swagger metadata, so `UpdateIncomeDto` had no `paymentDate` in the document at all — the field is now redeclared explicitly on the update DTO with identical validation decorators (runtime validation unchanged; all 47 incomes tests still pass) plus the Swagger metadata. Contract regressions added to `src/common/contracts/openapi-nullability.spec.ts` (fail-first): `CreateIncomeDto.paymentDate` and `UpdateIncomeDto.paymentDate` must both be `{type: "string", nullable: true}` and the update field must stay optional. 5/5 contract tests pass. |
| Runbook health loop falls through on timeout; no PID/cleanup | Confirmed | **Fixed** in §9: the readiness loop sets a flag and hard-fails (`tail` the log, kill the started process, `exit 1`) on timeout; the backend runs with a PID captured and a closing `kill "$BACKEND_PID"` step. |
### DB-phase review (D01/D02 + claim corrections)

Source: `docs/audits/MAINTENANCE-INDEPENDENT-REVIEW-2026-09-DB-PHASE.md`.

| ID | Verdict | Response |
|---|---|---|
| D01 generated `Income` response still empty (`Record<string, never>`), §7 overclaimed | Confirmed — the entity carried no Swagger metadata (pre-existing) | **Fixed**: new backend `IncomeResponseDto` (ExpenseResponseDto pattern; inlined client) wired into all income response decorators; the dead `Income` component is gone from the document; generated types now contain the real `IncomeResponseDto` with `paymentDate` (`string`, `format: date`, nullable). Response-schema regression added. §7 corrected with the actual diff. |
| D02 runbook still captures/kills the pnpm wrapper PID | Confirmed | **Fixed**: the runbook launches `node dist/src/main.js &` directly, kills that PID, and verifies port 3000 is released before finishing. |
| Playwright denominator (62/62) | Confirmed misstatement | **Corrected**: 62 passed, 1 skipped (63 total) in §4 and NEXT-TASKS. |
| Integration "17 independent database scenarios" | Confirmed imprecision | **Corrected**: 17 tests across four suites = 7 guard-only checks + 10 database-backed tests (§4). |
| §8 R02 row stale | Confirmed | **Corrected**: the row now reflects the completed phase. |

### DB-phase follow-up (E01)

Source: `docs/audits/MAINTENANCE-INDEPENDENT-REVIEW-2026-09-DB-FOLLOWUP.md`.

| ID | Verdict | Response |
|---|---|---|
| E01 invoice `date` advertised as `date-time` with a timestamp example while serialization is date-only | Confirmed — the executor re-verified against the live disposable backend (`{"date":"2026-06-30"}`, `{"paymentDate":"2026-07-02"}`, `createdAt` full timestamp) before correcting | **Fixed**: `IncomeResponseDto.date` now declares `type: String, format: 'date'` with a date-only example (description corrected — no timestamp claim); `paymentDate`'s example changed to the date-only `2026-07-02`; `createdAt`/`updatedAt` (income and client) declare `format: 'date-time'` explicitly. Contract regression added (`IncomeResponseDto date formats match the date-only serialization`): date must be `format: date` and not date-time with a date-only example, paymentDate example must not carry a time, timestamps keep date-time. Types regenerated from the rebuilt backend; the live document was re-inspected (`date: {type: string, format: date, example: 2026-06-30}`). Note: the fix and the regression landed together here — the reviewer's independent reproduction of the pre-fix behaviour (`format: date-time` + timestamp example) documents what the regression would have failed on. |


---

## 9. Remaining limitations, approvals, and reviewer checklist

**Product limitations:** no authentication (LAN-only is a trust boundary, not
a security boundary; top follow-on milestone — nothing here implies the app is
authenticated or that network restrictions were re-verified); no partial
payments; expense side has no payment tracking; historical paid incomes stay
visibly unreconciled until a human enters receipt dates (no reconciliation
performed or authorized).

**Owner actions still needed:**
1. **Disposable Postgres** — **done**: the owner started `easytax-audit-pg`
   (localhost-only binding) and the DB-dependent checklist ran end to end,
   clearing R02 and both build gates (§4). The container remains up with its
   disposable data, retained by the owner.
2. **Docker access** — **done** for this phase: the owner ran the approved
   build/run/cleanup commands with sudo and the executor validated the output
   (both images + runtime checks; see §2 M05 and §4).
3. **Git commits** — **done**: 9 atomic commits on branch
   `fix/maintenance-remediation-2026-09` (deps, ci, incomes payment-date,
   csv-import, api contracts + follow-up, web, docker, docs).
4. **Remote CI verification** — the next execution gate; needs the owner's
   authorization to push a branch / trigger the workflow.
5. Follow-ups (non-blocking): vitest 4 upgrade; drop the multer override when
   platform-express catches up; make `IncomesService.parseDateOnly`'s
   future-date comparison explicit date math instead of a raw string
   comparison (correct today because both sides are YYYY-MM-DD, but fragile);
   apply the same future-date check to CSV-imported receipt dates (currently
   only the manual path checks it); add a UI confirmation step before an
   already-paid record's captured receipt date is cleared to null.

**Reviewer checklist — where regressions most likely hide:**

1. class-transformer coercion edges (any new multipart DTO must use
   `StrictBoolean`; unscoped ajv-style overrides break eslint).
2. `importJobId: null` dry-run contract (regenerated types + preview flows).
3. Cash-basis SQL shape (`is_paid` moved from `andWhere` to `where` +
   `payment_date` range) — verify with the DB-backed spec, not mocked-QB
   assertions alone.
4. Income update validation — `PATCH /incomes/:id { isPaid: true }` without a
   date now 400s; only the mark-paid endpoint or a date-bearing PATCH works;
   `paymentDate: null` on unpaid→paid is rejected, on already-paid it
   deliberately clears.
5. Strict receipt-date rows — invalid dates now fail rows (Jun 31, 31/06/2026,
   timestamps); confirm no legit customer flow feeds such values.
6. Docker COPY paths — both Dockerfiles assume the repository-root context;
   `pnpm-workspace.yaml` must stay in the image or frozen installs fail.

**Reproduction commands (disposable environment):**

```bash
# 1) disposable DB (owner action; name must contain test/audit)
docker run -d --name easytax-audit-pg -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=easytax_audit \
  -p 5433:5432 postgres:15-alpine

# 2) gates (repo root)
pnpm exec eslint 'src/**/*.ts' 'test/**/*.ts'
pnpm run test --runInBand
pnpm run build
pnpm --filter web lint
pnpm --filter web exec vitest run

# 3) DB phase — disposable target only; explicit configuration required
export DB_HOST=localhost DB_PORT=5433 DB_USERNAME=postgres DB_PASSWORD=postgres
export DB_NAME=easytax_audit NODE_ENV=test
export ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Baseline FIRST (see §6 step 1: generate diffs against the current DB, so an
# empty database would otherwise produce the whole schema)
pnpm run migration:show            # pending InitialSchema visible
pnpm run migration:run             # establish baseline state
pnpm run migration:generate src/migrations/AddIncomePaymentDate   # review SQL: additive only
pnpm run migration:run && pnpm run migration:revert && pnpm run migration:run

# Rebuild, start, WAIT for readiness (fail hard on timeout), regenerate.
# Launch the compiled Node entrypoint DIRECTLY — `pnpm run start:prod &`
# captures the pnpm wrapper PID, and killing the wrapper has been shown to
# leave the Node child holding port 3000.
pnpm run build
node dist/src/main.js > /tmp/easytax-backend.log 2>&1 &
BACKEND_PID=$!
READY=0
for i in $(seq 1 30); do
  if curl -f http://localhost:3000/health >/dev/null 2>&1; then READY=1; break; fi
  sleep 2
done
if [ "$READY" != 1 ]; then
  echo "backend failed to become ready; log follows"
  tail -50 /tmp/easytax-backend.log
  kill "$BACKEND_PID"
  exit 1
fi
pnpm run generate:types            # then review shared/types diff

pnpm run test:e2e --runInBand      # guard enforces the disposable target
pnpm --filter web build            # stale-type errors must clear here
pnpm --filter web test:e2e         # CI=1 to forbid dev-server reuse

# Stop the backend this runbook started (never an unknown process) and
# VERIFY the port is released before finishing
kill "$BACKEND_PID"
for i in $(seq 1 10); do
  curl -s -o /dev/null http://localhost:3000/health || { echo "port 3000 released"; break; }
  sleep 1
  if [ "$i" = 10 ]; then echo "backend still holding port 3000"; exit 1; fi
done

# 3b) Docker phase (owner-executed with sudo; executor validated output)
sudo docker build -t easytax-au-api:test .
sudo docker build -t easytax-au-web:test -f web/Dockerfile --build-arg VITE_API_URL=/api .
sudo docker network create easytax-audit-net
sudo docker network connect easytax-audit-net easytax-audit-pg
sudo docker run -d --name easytax-au-api --network easytax-audit-net \
  -p 127.0.0.1:3001:3000 \
  -e DB_HOST=easytax-audit-pg -e DB_PORT=5432 \
  -e DB_USERNAME=postgres -e DB_PASSWORD=postgres -e DB_NAME=easytax_audit \
  -e NODE_ENV=production \
  -e ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
  easytax-au-api:test
sleep 8
sudo docker exec easytax-au-api wget -qO- http://localhost:3000/health
sudo docker run -d --name easytax-audit-web --network easytax-audit-net \
  -p 127.0.0.1:8081:80 easytax-au-web:test
sleep 40
sudo docker ps --filter name=easytax-audit-web --format '{{.Status}}'   # healthy
curl -s http://127.0.0.1:8081/api/health                                # proxied via /api rewrite
sudo docker exec easytax-audit-web wget -qO- http://127.0.0.1/ >/dev/null && echo OK
# cleanup (disposable only; disconnect the retained DB container FIRST,
# otherwise the network rm fails with "active endpoints")
sudo docker rm -f easytax-au-api easytax-audit-web
sudo docker network disconnect easytax-audit-net easytax-audit-pg
sudo docker network rm easytax-audit-net
sudo docker rmi easytax-au-api:test easytax-au-web:test

# 4) dependency evidence
pnpm why multer
node -e "const r=require('module').createRequire(require.resolve('@nestjs/platform-express/package.json'));console.log(r('multer/package.json').version)"
pnpm audit --json
```

*Nothing in this report is marked passed that was not executed with its exit
code captured directly (Docker runtime results are owner-executed with
executor-validated output, as recorded in §4). Remote CI verification remains
pending and is not implied.*
