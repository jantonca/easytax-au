# Project Overview: [Project Name]

## 🏗 Architecture & Stack

- **Monorepo Structure:** Managed via `pnpm`.
  - `/web`: Primary frontend (React/Next.js).
  - `/shared`: Shared logic and `@shared/types`.
- **Type System:** Strict TypeScript. **Never duplicate types**; always import from `@shared/types` or `@api-types`.
- **Styling:** Tailwind CSS following "Vibe Coding" rules in `.github/copilot-instructions.md`.
- **Data:** All currency amounts are stored and handled as **integers in cents**. Use `formatCents()` for display logic.

## 🛠 Mandatory Workflow (TDD)

1. **Planning (Opus 4.5):** Analyze `TASKS-FRONTEND.md` and `ROADMAP.md` to define the next logical sub-task.
2. **Test First (Sonnet 4.5):** - You MUST create or update the unit test file (`.test.ts/tsx`) before writing implementation code.
   - Run `pnpm --filter web test [path]` to verify the test fails.
3. **Implementation:** Write the minimal code needed to pass the test.
4. **Verification:** Run `pnpm --filter web lint` and `pnpm --filter web test` again.
5. **Documentation:** Update relevant `.md` files (TASKS, ARCHITECTURE, etc.) upon completion.

## 💻 Common Commands

- **Lint:** `pnpm --filter web lint`
- **Build:** `pnpm --filter web build`
- **Test (All):** `pnpm --filter web test`
- **Test (File):** `pnpm --filter web test [filename]`
- **Format:** `pnpm --filter web format`

## 📚 Key Context Files

- `ARCHITECTURE.md`: High-level system design.
- `TASKS-FRONTEND.md`: Current frontend backlog and progress.
- `SCHEMA.md`: Database and API contract definitions.
- `SECURITY.md`: Authentication and authorization rules.
- `.github/copilot-instructions.md`: UI "vibe" and coding patterns.

## ⚠️ Guardrails

- **No `any`:** Forbidden. Use proper interfaces.
- **Optimistic UI:** All mutations must implement optimistic updates with rollback logic.
- **Accessibility:** Mandatory ARIA labels and keyboard navigation for all interactive components.
