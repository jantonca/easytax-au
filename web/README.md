# EasyTax-AU — Web Client

React 19 + Vite 7 + Tailwind CSS 4 frontend for EasyTax-AU. It is part of the
pnpm workspace; run commands from the repository root:

| Task | Command |
|------|---------|
| Dev server (`http://localhost:5173`) | `pnpm --filter web dev` |
| Lint | `pnpm --filter web lint` |
| Unit tests (one-shot) | `pnpm --filter web exec vitest run` |
| Build | `pnpm --filter web build` |
| Playwright e2e | `pnpm --filter web test:e2e` (see `e2e/README.md`) |

**Configuration:** `VITE_API_URL` sets the API base (default
`http://localhost:3000`; see `.env.example`). A relative base such as `/api`
is currently broken in the main API client (I05 in `NEXT-TASKS.md`).

API types come from `@shared/types`, generated from the backend's OpenAPI spec
(`pnpm run generate:types`). Never hand-write them.

**Project docs:**

- Rules: `../AGENTS.md`
- State: `../STATUS.md`
- Backlog: `../NEXT-TASKS.md`
- Testing: `../docs/core/TESTING.md`
