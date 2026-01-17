# AI Pair Programmer: Collaboration Protocol

**Governance Framework**: Cortex TMS 2.6.0-beta.1
**Full Constitution**: `.cortex/constitution.md`
**This File**: GitHub Copilot-specific rules and technical map

---

## ⚡ Critical Rules (Always Apply)

**These rules prevent the most common AI hallucination errors. Read these first.**

### 🇦🇺 Domain Context
- **Project**: EasyTax-AU (Australian sole trader tax management)
- **Australian Financial Year**: July 1 - June 30 (NOT calendar year)
- **Tax System**: GST at 10% (NOT "sales tax"), BAS reporting (NOT "IRS")
- **FORBIDDEN terminology**: IRS, sales tax, W-2, Form 1040, April 15, fiscal year ending Dec 31

### 💰 Data Constraints
- **Currency**: ALWAYS store as **integers in cents** (never floats or dollars)
- **Display**: Use `formatCents(amountInCents)` from `@/lib/currency` for UI
- **Example**: $123.45 is stored as `12345` cents

### 🏗️ Architecture
- **Monorepo**: `/web` (Vite + React) and `/shared` (types only)
- **Type Imports**: ALWAYS import from `@shared/types` (never duplicate types)
- **Type Generation**: If `SCHEMA.md` or backend entity changes, **MUST** run `pnpm run generate:types` before frontend work
- **Styling**: Tailwind CSS only (no styled-components, no CSS-in-JS)

### 📋 Active Work
- **Current tasks**: See `NEXT-TASKS.md` in project root
- **Ignore**: `docs/archive/` (read-only changelogs)

---

## 🏗️ Technical Map (Where to Look)

Follow the **Rule-Reference Pattern**: Rules are cheap (always loaded), implementations are expensive (loaded on-demand).

| When Working On | Check This File First | Why |
|----------------|----------------------|-----|
| Tax/GST/BAS calculations | `docs/core/ATO-LOGIC.md` | Prevents US tax hallucinations |
| Code patterns & examples | `docs/core/PATTERNS.md` | Working code templates (use Search Anchors like `#currency-math`) |
| System design & tech stack | `docs/core/ARCHITECTURE.md` | Understand module relationships |
| NestJS gotchas, framework bugs | `docs/core/TROUBLESHOOTING.md` | Known issues & workarounds |
| Database queries & schema | `docs/core/SCHEMA.md` | Entity relationships & SQL examples |
| Encryption & security | `docs/core/SECURITY.md` | Key management & field-level encryption |

**Search Anchor Usage**: When you see a reference like "Check `PATTERNS.md#currency-math`", use grep or search to jump directly to that section. Don't read the entire file.

---

## 🧪 Mandatory TDD Workflow

**Never skip tests. Follow this sequence:**

1. **Read the task** from `NEXT-TASKS.md`
2. **Write test first** (`.test.ts` or `.test.tsx`)
3. **Run test** to confirm it fails: `pnpm --filter web test [path]`
4. **Implement** minimal code to pass
5. **Verify**: `pnpm --filter web lint && pnpm --filter web test`

**Coverage Targets**:
- Critical paths (tax calculations, mutations): 80%+
- UI components: 60%+
- Pure functions: 90%+

---

## 🤔 Collaboration Protocol

### The "Propose, Justify, Recommend" Framework

For any significant architectural or implementation decision (e.g., choosing a library, designing state structure, defining API contracts):

1. **Propose**: Present 2-3 clear options
2. **Justify**: Briefly list pros and cons for each option in project context
3. **Recommend**: State which option you **recommend** and why

**Example**:
> "For managing this form state, we could use: 1) Local `useState`, 2) Formik, or 3) React Hook Form. I recommend **React Hook Form** because it provides better performance for complex forms and has built-in Zod integration."

### Clarify Ambiguity
If my request is vague or incomplete, **ask clarifying questions** before generating code. Do not make assumptions on major features.

### Low-Level Autonomy
You have full autonomy for low-level decisions (e.g., variable names, loop structures) as long as they align with all principles in this document.

---

## ✔️ Pre-Submission Checklist

**Generic:**
- [ ] No `console.log` in production code
- [ ] No `any` types (use specific types or generics)
- [ ] All promises have error handling
- [ ] No unused imports or variables
- [ ] Props are properly typed (TypeScript)

**Project-Specific:**
- [ ] Currency values are integers in cents (not floats or dollars)
- [ ] Types imported from `@shared/types` (not duplicated)
- [ ] If backend entity changed, ran `pnpm run generate:types`
- [ ] No US tax terminology (IRS, sales tax, W-2, Form 1040, April 15)
- [ ] Tests written and passing (`pnpm --filter web test`)
- [ ] Linting passes (`pnpm --filter web lint`)
- [ ] If tax/GST logic changed, validated against `docs/core/ATO-LOGIC.md`

---

## 🔒 Core Principles (Non-Negotiables)

### Security First
- **Untrusted Input**: Treat all inputs as untrusted. Always sanitize and validate.
- **No Hardcoded Secrets**: Never write secrets directly in code. Use placeholders for environment variables.
- **Secure Logging**: Do not log PII or sensitive data.

### Performance & Optimization
- **Efficiency**: Use optimal algorithms and data structures. Avoid nested loops where better alternatives exist (e.g., use maps over nested `find`s).
- **Bundle-Size Conscious**: Prefer modern, tree-shakeable, lightweight solutions.
- **Lazy Loading**: For frontend components, routes, or heavy assets, default to lazy loading.

### Accessibility (A11y)
- **Semantic HTML**: Always use semantically correct HTML5 elements (`<nav>`, `<main>`, `<button>`, etc.).
- **ARIA Standards**: Apply WAI-ARIA roles and attributes where necessary, but prioritize semantic HTML first.
- **Keyboard Navigation**: Ensure all interactive elements are focusable and usable via keyboard.

---

## 📚 Documentation Tier (AI Search Order)

### ⭐ Priority Files (Read First)
- **`NEXT-TASKS.md`**: Active tasks (current backlog)
- **`docs/core/ATO-LOGIC.md`**: **CRITICAL** - Australian tax rules (prevents US tax hallucinations)
- **`CLAUDE.md`**: Extended instructions for Claude Code CLI

### 🏗️ Core Documentation (Reference as Needed)
- **`docs/core/ARCHITECTURE.md`**: System design and tech stack
- **`docs/core/PATTERNS.md`**: Implementation patterns and code conventions (use Search Anchors)
- **`docs/core/TROUBLESHOOTING.md`**: Common issues and solutions
- **`docs/core/SCHEMA.md`**: Database structure and entity relationships
- **`docs/core/SECURITY.md`**: Encryption, key management, security protocols

### 🔮 Planning Documentation (Active Backlog)
- **`NEXT-TASKS.md`**: Current sprint tasks (v1.2.0 UX Enhancements)
- **`docs/FUTURE-ENHANCEMENTS.md`**: Deferred features (living backlog)

### 📦 Archive (Read-Only History)
- **`docs/archive/v1.0-CHANGELOG.md`**: MVP release summary
- **`docs/archive/v1.1-CHANGELOG.md`**: System management features summary
- **AI Note**: Only read archive files if user explicitly asks "What shipped in v1.0?"

---

## 🔀 Version Control

### Atomic Commits
Each commit should represent one logical change.

### Branch Naming
Follow pattern: `type/brief-description` (e.g., `feat/user-auth`)

### Commit Messages
Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `docs:` Documentation update
- `test:` Test additions/updates

### PR Descriptions
Include:
- **What**: Description of changes
- **Why**: Rationale and context
- **Testing steps**: How to verify the changes

---

## 🤖 Cortex TMS Integration

This project uses **Cortex TMS 2.6.0-beta.1** for governance automation.

**Before committing**:
```bash
pnpm run cortex:validate          # Automated quality gates
pnpm run lint                     # Code formatting
pnpm run test                     # Run tests
```

**Constitution Location**: `.cortex/constitution.md` (source of truth for all governance rules)

<!-- @cortex-tms-version 2.6.0-beta.1 -->
