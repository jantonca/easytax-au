# Testing & Verification

How to run each test tier, and which ones need a disposable database. For the
TDD rule and coverage targets, see `AGENTS.md`.

## Tiers

| Tier | Command | Needs | Notes |
|------|---------|-------|-------|
| Doc references | `pnpm run docs:check` | — | Paths in Markdown links, code spans and code blocks must exist (`docs/archive/` skipped) |
| Backend lint (non-mutating) | `pnpm exec eslint "src/**/*.ts" "test/**/*.ts"` | — | `pnpm run lint` runs `--fix` and **mutates files** |
| Backend unit | `pnpm run test` | — | Jest, `rootDir: src`, `*.spec.ts` only |
| Backend build | `pnpm run build` | — | `tsconfig.build.json` excludes `test/` and `*spec.ts` |
| Full type check | `pnpm exec tsc --noEmit -p tsconfig.json` | — | Includes `src` and `test`. Known baseline: 3 errors (see below) |
| Guard unit | `pnpm exec jest --config test/jest-e2e.json test/guards` | — | Only touches `process.env`; no database |
| Backend integration | `pnpm run test:e2e --runInBand` | **Disposable Postgres** | `test/*.e2e-spec.ts`; guarded, wipes all data |
| Web lint | `pnpm --filter web lint` | — | Non-mutating |
| Web unit | `pnpm --filter web exec vitest run` | — | One-shot (`pnpm --filter web test` watches) |
| Web build | `pnpm --filter web build` | — | `tsc -b && vite build`; fails on stale shared types |
| Playwright | `CI=1 pnpm --filter web test:e2e` | Backend on `:3000` + DB | Starts Vite on `:5173`; `CI=1` forbids reusing a running dev server |

**Type-check baseline (2026-09-27):** these three test-fixture errors are
pre-existing. Any other error is new.

- `src/app.controller.spec.ts:45`
- `src/modules/csv-import/csv-import.service.spec.ts:38`
- `src/modules/recurring-expenses/recurring-expenses.controller.spec.ts:90`

## CI

`.github/workflows/e2e-tests.yml` runs four jobs on PRs to `main`, and CI is
the acceptance gate:

1. `backend-checks` runs the doc-reference check, lint, unit tests with coverage
   and the build.
2. `frontend-checks` runs lint, vitest and the build.
3. `backend-integration` runs the integration suites against an ephemeral
   Postgres service.
4. Playwright runs against the built backend and a Postgres service.

## Disposable database (integration tests)

The integration suites import `AppModule`, which connects and runs
migrations, and they **delete all application data** between tests.
`test/guards/disposable-db-guard.ts` refuses to run unless all of these hold:

- `NODE_ENV` is exactly `test`;
- `DB_NAME` contains `test` or `audit` as a separated token (for example
  `easytax_audit`; `contest` is rejected);
- `DB_PORT` is set and is a valid port. An unset port would silently fall back
  to 5432;
- `DB_HOST` and `DB_USERNAME` are set explicitly.

The guard checks configuration only. It does not prove the target is isolated,
so point `DB_*` at a throwaway instance, never at the homelab database.

```bash
# 1) Throwaway Postgres, bound to localhost only
docker run -d --name easytax-audit-pg -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=easytax_audit \
  -p 127.0.0.1:5433:5432 postgres:15-alpine

# 2) Explicit test configuration (never reuse a real ENCRYPTION_KEY)
export DB_HOST=localhost DB_PORT=5433 DB_USERNAME=postgres DB_PASSWORD=postgres
export DB_NAME=easytax_audit NODE_ENV=test
export ENCRYPTION_KEY=$(openssl rand -hex 32)

# 3) Run
pnpm run migration:run
pnpm run test:e2e --runInBand

# 4) Remove when finished
docker rm -f easytax-audit-pg
```

## Regenerating shared types against a disposable backend

Regenerate shared types after any entity or DTO change (see `AGENTS.md`). Run
the compiled entrypoint **directly**: when `pnpm run start:prod &` is killed,
it can leave the Node child process holding port 3000.

```bash
pnpm run build
node dist/src/main.js > /tmp/easytax-backend.log 2>&1 &
BACKEND_PID=$!
for i in $(seq 1 30); do
  curl -sf http://localhost:3000/health >/dev/null && break
  sleep 2
  [ "$i" = 30 ] && { tail -50 /tmp/easytax-backend.log; kill "$BACKEND_PID"; exit 1; }
done
pnpm run generate:types          # then review the shared/types diff
pnpm --filter web build          # stale-type errors surface here
kill "$BACKEND_PID"              # stop only the process started above
```

The same backend and database serve a local Playwright run
(`CI=1 pnpm --filter web test:e2e`).

## History

This runbook was extracted on 2026-09-27 from §9 of
`docs/archive/maintenance-2026-09/MAINTENANCE-REMEDIATION-2026-09.md`. That
report also holds the one-off migration and Docker image validation
procedures used during that remediation.
