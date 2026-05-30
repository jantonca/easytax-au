# GitHub Copilot — Critical Guardrails

**Source of truth:** `AGENTS.md` (it carries the full project rules and
inherits the shared collaboration + backend + frontend rules). Copilot
does not read `AGENTS.md` reliably, so this file keeps the critical,
project-specific guardrails that prevent the most common AI errors. When
in doubt, follow `AGENTS.md`.

## ⚡ Critical Rules (Always Apply)

### 🇦🇺 Australian tax domain
- Australian Financial Year: **July 1 – June 30** (NOT calendar year).
- GST at **10%** (NOT "sales tax"); **BAS** reporting (NOT "IRS").
- FORBIDDEN terms: IRS, sales tax, W-2, Form 1040, April 15, Dec-31 fiscal year.

### 💰 Currency
- ALWAYS store as **integer cents** (never floats or dollars). Example:
  $123.45 → `12345`.
- Frontend display/parsing: `web/src/lib/currency` (`formatCents`,
  `parseCurrency`).
- Backend money & GST math: `MoneyService`
  (`src/common/services/money.service.ts`, decimal.js).

### 🏗️ Architecture
- **Monorepo:** NestJS backend at the root, `web/` (Vite + React),
  `shared/` (generated types).
- Import shared types from `@shared/types` — never duplicate them.
- After a backend schema/entity change, **start the backend**, then run
  `pnpm run generate:types` before frontend work.
- Styling: **Tailwind only** (no styled-components, no CSS-in-JS).

### 🧪 TDD (mandatory)
Tests first. Coverage: critical paths (tax calcs, mutations) 80%+, UI 60%+,
pure functions 90%+.

## 🗺️ Read-first doc map
| Working on | Read first |
|------------|------------|
| Tax / GST / BAS | `docs/core/ATO-LOGIC.md` |
| Code patterns | `docs/core/PATTERNS.md` |
| System design | `docs/core/ARCHITECTURE.md` |
| DB / schema | `docs/core/SCHEMA.md` |
| Security / encryption | `docs/core/SECURITY.md` |
| Framework bugs | `docs/core/TROUBLESHOOTING.md` |

Active work: `NEXT-TASKS.md`. Ignore `docs/archive/` unless asked about a
past version.

## ✔️ Project-specific pre-submission checklist
- [ ] Currency stored as integer cents (not floats/dollars)
- [ ] Types imported from `@shared/types` (not duplicated)
- [ ] Ran `pnpm run generate:types` if a backend entity changed
- [ ] No US tax terminology
- [ ] Tax/GST logic validated against `docs/core/ATO-LOGIC.md`
- [ ] Tests written and passing
