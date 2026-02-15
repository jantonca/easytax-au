# 🤖 CLAUDE.md | CLI Workflow & Commands

**This File**: CLI commands and quick task discovery prompts

---

## 🎯 Role & Persona

Expert Full Stack Developer. Follow the **"Propose, Justify, Recommend"** framework for all architectural decisions.

---

## 🛠 TDD Workflow

**Never skip tests. This is the mandatory sequence:**

1. **Plan**: Analyze `NEXT-TASKS.md` for current task
2. **Test**: Write `.test.ts/.tsx` first
3. **Run**: `pnpm --filter web test [path]` (verify failure)
4. **Build**: Minimal code to pass test
5. **Verify**: `pnpm --filter web lint && pnpm --filter web test`

**Coverage Targets**:
- Critical paths (tax calculations, mutations): 80%+
- UI components: 60%+
- Pure functions: 90%+

---

## 💻 CLI Commands

**Frontend:**
- **Test**: `pnpm --filter web test [path]`
- **Lint**: `pnpm --filter web lint`
- **Build**: `pnpm --filter web build`
- **Dev**: `pnpm --filter web dev`

**Backend:**
- **Test**: `pnpm run test`
- **Lint**: `pnpm run lint`
- **Build**: `pnpm run build`
- **Dev**: `pnpm run start:dev`

**Types:**
- **Generate**: `pnpm run generate:types` (run after Schema/Entity changes)

---

## ⚠️ Quick Guardrails

**Code Quality:**
- No `any`, no `console.log`
- Currency as cents (integers)
- Types from `@shared/types`

**Workflow:**
- TDD: Tests first, implementation second
- Type Generation: Run `pnpm run generate:types` after backend schema changes
- No US tax terms (IRS, sales tax, W-2, 1040, April 15)

**Domain:**
- Australian FY: July 1 - June 30
- GST: 10% (not "sales tax")
- BAS reporting (not "IRS")

---

## 📚 Documentation Triggers

When you encounter these tasks, read the corresponding file **first**:

| Task | Read This First | Search Anchor Example |
|------|----------------|----------------------|
| Tax/GST/BAS calculations | `docs/core/ATO-LOGIC.md` | Entire file (critical) |
| Code patterns & examples | `docs/core/PATTERNS.md` | `#currency-math`, `#data-fetching` |
| System design questions | `docs/core/ARCHITECTURE.md` | `#backend-modules`, `#frontend-structure` |
| Framework bugs/workarounds | `docs/core/TROUBLESHOOTING.md` | `#nestjs-multipart-booleans`, `#circular-dependencies` |
| Database queries | `docs/core/SCHEMA.md` | `#entity-relationships` |
| Security/encryption | `docs/core/SECURITY.md` | `#field-level-encryption` |

**Search Anchor Usage**: Use grep or Ctrl+F to jump to specific sections (e.g., `grep "# \[Currency"` or search for `#currency-math`).

**Archive Rule**: Only read `docs/archive/` if user explicitly asks "What shipped in v1.0?" or "Show me v1.1 changes."

---

## 🛠️ Custom Skills (Slash Commands)

**Claude Code provides specialized workflow skills for common development tasks:**

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/plan` | Task discovery & prioritization from NEXT-TASKS.md | Start of work session, choosing next task |
| `/tdd` | Test-driven development workflow | Implementing features (MANDATORY for all development) |
| `/debug` | Structured debugging with TROUBLESHOOTING.md check | Investigating bugs, errors, test failures |
| `/review` | 5-pillar code review (compliance, security, quality, architecture, performance) | Before merge, after feature complete |
| `/audit` | Full codebase health check with formal report | Quarterly audits, pre-release validation |
| `/deploy` | Deployment guidance for Docker/Proxmox LXC | Deploying to dev/staging/production |
| `/import-data` | CSV import specialist (high-risk operation) | Implementing/debugging CSV transaction imports |
| `/schema-change` | Database migration with encryption safety | Any schema/entity changes |

**Orchestrator Prompts** (reference documentation):
- `docs/prompts/orchestrator.md` - Session initialization & specialist knowledge
- `docs/prompts/workflow-feature.md` - End-to-end feature development workflow
- `docs/prompts/workflow-bugfix.md` - Structured bug fix workflow
- `docs/prompts/quick-reference.md` - One-page cheat sheet

**How to use:**
- Type `/command` in Claude Code to invoke a skill
- Skills embed all 5 specialist domains (ATO Compliance, Security, Code Quality, Architecture, Performance)
- Skills automatically reference relevant documentation (ATO-LOGIC.md, SCHEMA.md, etc.)
- Skills include Australian domain guardrails and safety checks

---

## 🎯 Example Prompts

### For Task Discovery
> "Review NEXT-TASKS.md. Recommend the next task and justify the priority."
>
> Or use: `/plan`

### For Complex Features
> "I need to implement [X]. Use EnterPlanMode to propose an approach that considers SCHEMA.md and ATO-LOGIC.md."
>
> Then use: `/tdd` to implement with test-first workflow

### For Debugging
> "Investigate why [X] fails. Check SCHEMA.md for data assumptions and TROUBLESHOOTING.md for known issues before proposing a fix."
>
> Or use: `/debug` for structured debugging workflow

### For Code Patterns
> "I need to add a new searchable dropdown. Show me the pattern from PATTERNS.md#searchable-dropdown."

---
