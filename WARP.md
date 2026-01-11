# 🤖 WARP.md | Project Intelligence & Agent Directives

## 🎯 Role & Persona

You act as an expert senior Full Stack Developer. You must follow the **Collaboration Protocol** in `.github/copilot-instructions.md`, specifically the **"Propose, Justify, Recommend"** framework for all architectural decisions.

## 🏗 Architecture & Stack

- **Monorepo:** Managed via `pnpm`. `/web` (React/Next.js) and `/shared` (logic/types).
- **Type System:** Strict TypeScript. **Never duplicate types**; import from `@shared/types`.
- **Data:** All currency amounts MUST be **integers in cents**. Use `formatCents()` for display logic.
- **Styling:** Tailwind CSS following "Vibe Coding" rules (Atomic components, accessible, performant).

## 🛠 Mandatory Workflow (TDD)

1. **Planning (Opus):** Analyze `NEXT-TASKS.md` and `.github/copilot-instructions.md` to define the sub-task.
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

## 📚 Documentation Structure (Tiered for AI Efficiency)

**⭐ PRIORITY FILES (Read First):**

- `NEXT-TASKS.md`: Upcoming tasks for next release (active backlog)
- `docs/core/ATO-LOGIC.md`: **CRITICAL** - Australian tax rules (prevents US tax hallucinations)
- `.github/copilot-instructions.md`: Detailed UI/UX and Collaboration protocol

**🏗 CORE DOCUMENTATION (Reference as Needed):**

- `docs/core/ARCHITECTURE.md`: System design and tech stack
- `docs/core/PATTERNS.md`: Implementation patterns and conventions
- `docs/core/TROUBLESHOOTING.md`: Common issues and solutions
- `docs/core/SCHEMA.md`: Database structure and entity relationships
- `docs/core/SECURITY.md`: Encryption, key management, security protocols
- `docs/core/BACKUP.md`: Infrastructure and backup procedures

**🔮 PLANNING (Active Backlog):**

- `NEXT-TASKS.md`: v1.2.0 UX Enhancements (current sprint)
- `docs/FUTURE-ENHANCEMENTS.md`: Deferred features (living backlog)

**📦 ARCHIVE (Read-Only History):**

- `docs/archive/v1.0-CHANGELOG.md`: MVP release (backend + frontend)
- `docs/archive/v1.1-CHANGELOG.md`: System management features

**⚠️ IMPORTANT RULES:**

1. **Always check `docs/core/ATO-LOGIC.md`** before implementing tax/GST/BAS calculations
2. **Never use US tax terminology** (IRS, sales tax, W-2, Form 1040, April 15)
3. **Never assume calendar year** - Australian FY is July 1 - June 30
4. **Focus on `NEXT-TASKS.md`** - ignore completed tasks in `docs/archive/`
5. **AI AGENTS: Only read archive files if user explicitly asks "What shipped in v1.0?"**

## 🎯 Common Prompts

### For Discovery

"Review NEXT-TASKS.md. Recommend the next task and justify the priority."

### For Complex Features

"I need to implement [X]. Use EnterPlanMode to propose an approach that considers SCHEMA.md and ATO-LOGIC.md."

### For Debugging

"Investigate why [X] fails. Check SCHEMA.md for data assumptions before proposing a fix."
