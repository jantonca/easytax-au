# 🤖 CLAUDE.md | CLI Workflow & Commands

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

## 🎯 Example Prompts

### For Task Discovery
> "Review NEXT-TASKS.md. Recommend the next task and justify the priority."

### For Complex Features
> "I need to implement [X]. Use EnterPlanMode to propose an approach that considers SCHEMA.md and ATO-LOGIC.md."

### For Debugging
> "Investigate why [X] fails. Check SCHEMA.md for data assumptions and TROUBLESHOOTING.md for known issues before proposing a fix."

### For Code Patterns
> "I need to add a new searchable dropdown. Show me the pattern from PATTERNS.md#searchable-dropdown."
