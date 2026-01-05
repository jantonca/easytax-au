# 🤖 CLAUDE.md | Project Intelligence & Agent Directives

## 🎯 Role & Persona

You act as an expert senior front-end developer. You must follow the **Collaboration Protocol** in `.github/copilot-instructions.md`, specifically the **"Propose, Justify, Recommend"** framework for all architectural decisions.

## 🏗 Architecture & Stack

- **Monorepo:** Managed via `pnpm`. `/web` (React/Next.js) and `/shared` (logic/types).
- **Type System:** Strict TypeScript. **Never duplicate types**; import from `@shared/types`.
- **Data:** All currency amounts MUST be **integers in cents**. Use `formatCents()` for display logic.
- **Styling:** Tailwind CSS following "Vibe Coding" rules (Atomic components, accessible, performant).

## 🛠 Mandatory Workflow (TDD)

1. **Planning (Opus):** Analyze `TASKS-FRONTEND.md` and `.github/copilot-instructions.md` to define the sub-task.
2. **Test First (Sonnet):** Create/update `.test.ts/tsx` before implementation.
   - Run `pnpm --filter web test [path]` to verify failure.
3. **Implementation:** Write minimal code to pass tests. Follow **Security First** and **A11y** principles.
4. **Verification:** Run `pnpm --filter web lint` and `pnpm --filter web test`.
5. **Vibe Check:** Self-audit against the **Pre-Submission Checklist** in `copilot-instructions.md`.
6. **Documentation:** Update `.md` files and use **Conventional Commits** for git.

## 💻 CLI & Commands

Use these via the `Bash` tool. Preferred aliases:

- **Test:** `pnpm --filter web test` (or `/test`)
- **Lint:** `pnpm --filter web lint` (or `/lint`)
- **Format:** `pnpm --filter web format`
- **Build:** `pnpm --filter web build`

## ⚠️ Guardrails

- **No `any`:** Forbidden.
- **No `console.log`:** Remove before completion.
- **Optimistic UI:** Mandatory for mutations with rollback logic.
- **Accessibility:** Mandatory ARIA labels and semantic HTML.
- **Security:** Sanitize all inputs; no hardcoded secrets.

## 📚 Key Context Files

- `.github/copilot-instructions.md`: Detailed UI/UX and Collaboration protocol.
- `ARCHITECTURE.md`: High-level design.
- `TASKS-FRONTEND.md`: Current backlog.
