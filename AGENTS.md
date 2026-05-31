# easytax-au — AGENTS.md

## Purpose
EasyTax-AU — Australian sole-trader tax management. Full-stack monorepo:
a NestJS API + a React/Vite web client, with a generated shared types
layer.

## Stack
pnpm monorepo (`.` = NestJS 11 backend with TypeORM + Postgres, Swagger,
class-validator, decimal.js; `web/` = React 19 + Vite 7 + Tailwind v4;
`shared/` = generated types). TypeScript throughout. Deploy via Docker /
docker-compose. (Source exact versions from `package.json`, not the docs.)

## Package manager
pnpm workspace (`pnpm-workspace.yaml`: `.`, `web`). Lockfile committed —
do not run npm/yarn or regenerate it without reason.

## Commands
Backend (root):
- Dev: `pnpm run start:dev` · Build: `pnpm run build` (nest build)
- Test: `pnpm run test` (jest) · Coverage: `pnpm run test:cov` · E2E: `pnpm run test:e2e`
- Lint (autofix): `pnpm run lint` · Format: `pnpm run format`
- Types: `pnpm run generate:types`

Frontend (`web/`):
- Dev: `pnpm --filter web dev` · Build: `pnpm --filter web build` (tsc -b && vite build)
- Test: `pnpm --filter web test` (vitest) · E2E: `pnpm --filter web test:e2e` (playwright)
- Lint: `pnpm --filter web lint`

## Architecture constraints
- **Monorepo layout:** NestJS backend at the root, `web/` is the Vite +
  React client, `shared/` holds generated shared types. Import shared
  types from `@shared/types` — never duplicate them.
- **Type generation:** after any backend schema/entity change, **start the
  backend first**, then run `pnpm run generate:types` (it reads the live
  OpenAPI endpoint at `http://localhost:3000/api/docs-json` → `shared/types`)
  before frontend work.
- **Australian tax domain (critical):** Australian FY is **July 1 – June 30**
  (not calendar year). GST is **10%** ("GST", never "sales tax"). Reporting
  is **BAS** (never "IRS"). FORBIDDEN US terms: IRS, sales tax, W-2,
  Form 1040, April 15, Dec-31 fiscal year.
- **Currency:** always store as **integer cents**. Frontend display/parsing
  uses `web/src/lib/currency` (`formatCents`, `parseCurrency`). Backend
  money and GST calculations use `MoneyService`
  (`src/common/services/money.service.ts`, decimal.js). Never use
  floats/dollars for stored values or tax math.
- **Styling:** Tailwind only — no styled-components, no CSS-in-JS.
- **Backend:** NestJS modules; TypeORM entities + migrations;
  class-validator DTOs at boundaries; field-level encryption per
  `docs/core/SECURITY.md`.

## TDD (mandatory)
Write the test first and run it to confirm it FAILS, then implement the
minimal code to pass, then refactor. Coverage targets: critical paths (tax
calculations, mutations) 80%+, UI components 60%+, pure functions 90%+.

## Read-first doc map
| Task | Read first |
|------|------------|
| Tax / GST / BAS logic | `docs/core/ATO-LOGIC.md` |
| Code patterns | `docs/core/PATTERNS.md` |
| System design | `docs/core/ARCHITECTURE.md` |
| DB queries / schema | `docs/core/SCHEMA.md` |
| Security / encryption | `docs/core/SECURITY.md` |
| Framework bugs / workarounds | `docs/core/TROUBLESHOOTING.md` |

Active work: `NEXT-TASKS.md`. Ignore `docs/archive/` unless explicitly
asked about a past version.

## Tooling
Claude Code skills live in `.claude/commands/` (`/plan`, `/tdd`, `/debug`,
`/review`, `/audit`, `/deploy`, `/import-data`, `/schema-change`).

## Verification requirements
Backend: `pnpm run test && pnpm run build` must pass. Note `pnpm run lint`
runs ESLint with `--fix` — it **mutates files**, so it is not a read-only
check; run it when autofix is acceptable, then inspect the diff.
Frontend: `pnpm --filter web lint && pnpm --filter web test && pnpm --filter web build`
(frontend `lint` is `eslint .`, non-mutating).
Run relevant Playwright e2e for user-facing flows. Inherited rules apply
primarily to new and changed work.

## Inherited rules
Follow:
- /home/jantonca/Projects/github/jantonca/personal-ai-assistant/templates/core-rules.md
- /home/jantonca/Projects/github/jantonca/personal-ai-assistant/domains/backend.md
- /home/jantonca/Projects/github/jantonca/personal-ai-assistant/domains/frontend.md

Project-specific rules above override these.
