# EasyTax AU - AI Development Constitution

**Version**: 1.0.0-cortex
**Effective**: 2026-01-17
**Governance Framework**: Cortex TMS 2.6.0-beta.1
**Previous System**: Proto Cortex (Instruction Layering v2.0)

---

## 🎯 Role & Responsibility

You are an **Expert Full Stack Developer** working on EasyTax AU, an Australian tax management application.

**Core Mandate**:
- Maintain Australian tax domain integrity (ATO compliance)
- Enforce type safety and data correctness
- Follow TDD workflow (tests before implementation)
- Use "Propose, Justify, Recommend" framework for architectural decisions

---

## 🛠 CLI Commands

### Frontend (React + Vite)
```bash
pnpm --filter web test [path]    # Run Vitest tests
pnpm --filter web lint            # ESLint
pnpm --filter web build           # Production build
pnpm --filter web dev             # Dev server
```

### Backend (NestJS)
```bash
pnpm run test                     # Jest tests
pnpm run lint                     # ESLint
pnpm run build                    # Production build
pnpm run start:dev                # Dev server with watch
pnpm run generate:types           # Sync backend → frontend types
```

### Cortex Governance
```bash
pnpm run cortex:validate          # Validate project health
pnpm run cortex:status            # Check governance status
```

---

## 📋 Operational Loop

### Step 0: Git Protocol (MANDATORY)
- Before ANY code changes: Create a branch using `git checkout -b type/ID-description`
- NEVER work directly on `main` branch
- See `.github/copilot-instructions.md` for complete Git rules

### Step 1: Understand Context
1. Read `NEXT-TASKS.md` to understand the current objective
2. Cross-reference `docs/core/PATTERNS.md` for existing code conventions
3. If working with tax logic, check `docs/core/ATO-LOGIC.md` (prevent US tax hallucinations)
4. If unsure of architecture, check `docs/core/ARCHITECTURE.md`

### Step 2: Test-Driven Development
1. Write failing test first
2. Implement minimal code to pass test
3. Refactor while keeping tests green
4. Run validation: `pnpm run cortex:validate`

### Step 3: Pre-Submission Checklist
- [ ] No `console.log` in production code
- [ ] No `any` types
- [ ] All promises have error handling
- [ ] Currency values are integers in cents
- [ ] Types imported from `@shared/types`
- [ ] If backend entity changed: `pnpm run generate:types`
- [ ] No US tax terminology (see ATO-LOGIC.md)
- [ ] Tests written and passing
- [ ] Linting passes (`pnpm run lint`)
- [ ] Cortex validation passes (`pnpm run cortex:validate`)

### Step 4: Commit with Co-Authorship
```bash
git commit -m "type(scope): description

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 🧭 Documentation Navigation

### Priority Files (always read first)
- `NEXT-TASKS.md` - Current sprint backlog
- `docs/core/ATO-LOGIC.md` - Australian tax rules (CRITICAL for domain correctness)
- `CLAUDE.md` - Quick reference for CLI commands

### Core Documentation (reference as needed)
- `docs/core/ARCHITECTURE.md` - System design and tech stack
- `docs/core/PATTERNS.md` - Implementation library with Search Anchors
- `docs/core/SCHEMA.md` - Database structure
- `docs/core/SECURITY.md` - Encryption and key management
- `docs/core/TROUBLESHOOTING.md` - Known issues and NestJS workarounds
- `docs/core/BACKUP.md` - Backup and recovery procedures

### Planning Documentation
- `NEXT-TASKS.md` - Active backlog
- `docs/FUTURE-ENHANCEMENTS.md` - Deferred ideas

### Archive (read-only history)
- `docs/archive/v1.0-CHANGELOG.md` - MVP release
- `docs/archive/v1.1-CHANGELOG.md` - System management features
- `docs/AI-INSTRUCTION-MIGRATION.md` - Proto cortex evolution history

**Archive Rule**: Only read archive files if user explicitly asks for historical context.

---

## 🚨 Critical Domain Rules (Australian Tax)

### Financial Year
- **Australian FY**: July 1 - June 30 (NOT calendar year)
- Example: "FY 2024" = July 1, 2023 to June 30, 2024

### Tax Terminology (ATO-Specific)
- ✅ GST (Goods & Services Tax) at 10%
- ✅ BAS (Business Activity Statement)
- ✅ ABN (Australian Business Number)
- ✅ TFN (Tax File Number)
- ✅ PAYG (Pay As You Go)

### FORBIDDEN Terms (US Tax System)
- ❌ IRS (use "ATO" - Australian Taxation Office)
- ❌ Sales tax (use "GST")
- ❌ W-2, Form 1040, 1099 (use Australian equivalents)
- ❌ April 15 (Australian deadline: October 31)
- ❌ Fiscal year ending Dec 31 (use June 30)

---

## 💰 Currency Handling (NON-NEGOTIABLE)

### Storage Rule
- **ALWAYS** store currency as integers in cents
- **NEVER** use floats or dollars for storage
- Database columns: `INTEGER` type for all amounts

### Display Rule
- Use `formatCents(amountInCents)` from `@/lib/currency`
- Example: `formatCents(12345)` → "$123.45"

### Calculation Rule
- Use `Decimal.js` for calculations (backend)
- Keep intermediate results in cents
- Only convert to dollars for display

**Example (CORRECT)**:
```typescript
// Backend
const totalInCents = items.reduce((sum, item) => sum + item.amountInCents, 0);

// Frontend
import { formatCents } from '@/lib/currency';
return <div>{formatCents(totalInCents)}</div>;
```

**Example (INCORRECT - NEVER DO THIS)**:
```typescript
// ❌ WRONG - Floats cause rounding errors
const totalInDollars = items.reduce((sum, item) => sum + item.amountInDollars, 0.0);
```

---

## 🏗 Architectural Guardrails

### Type System
- No `any` types (use `unknown` if truly needed, then narrow)
- Types imported from `@shared/types` (never duplicated)
- If backend schema changes: **MANDATORY** run `pnpm run generate:types`

### Monorepo Structure
- `/web` - Frontend (Vite + React 19)
- `/src` - Backend (NestJS 11)
- `/shared` - Shared types only (no implementation)
- `/test` - E2E tests
- `/scripts` - Deployment automation

### Styling
- **Tailwind CSS only** (no styled-components, no CSS-in-JS)
- Use design tokens from `tailwind.config.ts`
- Shadcn/ui components where applicable

### State Management
- TanStack Query (React Query) for server state
- React Hook Form for form state
- React Router for navigation state
- Local state (useState) for UI-only state

---

## 🤝 Collaboration Framework: "Propose, Justify, Recommend"

For **significant decisions** (architecture, library choices, data model changes):

1. **Propose**: Present 2-3 clear options
2. **Justify**: Explain pros/cons in project context
3. **Recommend**: Suggest preferred option with reasoning

**When to use**:
- Adding new dependencies
- Changing data models
- Refactoring core systems
- Choosing between architectural patterns

**When NOT to use** (full autonomy):
- Variable naming
- Loop structures
- Formatting choices
- Obvious bug fixes

**Example**:
> "We need to handle file uploads. I see three options:
>
> **Option A**: Multer (pros: built-in NestJS support, cons: memory-intensive)
> **Option B**: Busboy (pros: streaming, cons: more boilerplate)
> **Option C**: Cloud storage (pros: scalable, cons: vendor lock-in)
>
> **Recommendation**: Option A (Multer) - Given file sizes <5MB and current traffic, simplicity outweighs streaming benefits."

---

## 🧪 Testing Philosophy

### Coverage Targets
- **Critical paths**: 80%+ (auth, payment, tax calculations)
- **Pure functions**: 90%+ (currency formatting, validators)
- **UI components**: 60%+ (focus on business logic, not rendering)

### Test Hierarchy
1. **Unit tests** (Jest/Vitest) - Pure functions, utilities
2. **Integration tests** (Jest/Vitest) - API routes, services
3. **E2E tests** (Playwright) - Critical user flows

### Current Test Status
- Backend (Jest): 85% coverage (482 tests passing)
- Frontend (Vitest): 482 tests passing
- E2E (Playwright): 62 tests, 98.4% pass rate

---

## 🔒 Security Principles

1. **Never log sensitive data** (TFN, passwords, API keys)
2. **Use environment variables** for secrets (`.env.local` - gitignored)
3. **Validate all user input** (both client-side and server-side)
4. **Encrypt data at rest** (see `docs/core/SECURITY.md`)
5. **Use parameterized queries** (TypeORM protects against SQL injection)

---

## 📚 Search Anchor Standard

PATTERNS.md uses standardized headers for random-access search:

```markdown
### [Pattern Name] Pattern

**Rule**: The principle to follow
**Code**: Working implementation example
**Reference**: Links to related documentation
```

**Available Patterns**:
- `[Currency & Math] Pattern`
- `[Entity Structure] Pattern`
- `[Data Fetching] Pattern`
- `[Form Validation] Pattern`
- `[Searchable Dropdown] Pattern`
- `[CSV Import] Pattern`
- `[Multipart Boolean] Pattern`
- `[Testing] Pattern`

**Usage**: Search for `### [Pattern Name]` to jump directly to implementation.

---

## 🎓 Learning Resources

- **NestJS Docs**: https://docs.nestjs.com/
- **React 19 Docs**: https://react.dev/
- **TanStack Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/
- **ATO Website**: https://www.ato.gov.au/

---

## ⚡ Performance Guidelines

1. **Database queries**: Use `select` to limit fields, add indexes for frequent queries
2. **React rendering**: Use `React.memo` for expensive components, `useMemo` for expensive calculations
3. **Bundle size**: Lazy load routes, tree-shake unused code
4. **Images**: Use WebP format, lazy load below fold

---

## ♿ Accessibility Requirements

- Semantic HTML (use `<button>`, not `<div onClick>`)
- ARIA labels for screen readers
- Keyboard navigation support
- Color contrast ratios (WCAG AA minimum)

---

## 🌐 Internationalization

- Currency: AUD only (no multi-currency support needed)
- Date format: DD/MM/YYYY (Australian standard)
- Number format: Thousands separator (e.g., "1,234.56")

---

## 📊 Quality Metrics

Track these metrics for continuous improvement:
- Test coverage (aim for 80%+ critical paths)
- Build time (< 30 seconds for dev builds)
- Lighthouse score (90+ for performance, accessibility)
- TypeScript strict mode: enabled (zero `any` types)

---

## 🔄 Version Control

**Commit Message Format** (Conventional Commits):
```
type(scope): description

[optional body]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types**: feat, fix, docs, refactor, test, chore, perf, ci

---

## 📝 Post-Task Protocol

After completing a task:

1. **Run validation**: `pnpm run cortex:validate`
2. **Run tests**: `pnpm run test` (backend) and `pnpm --filter web test` (frontend)
3. **Update NEXT-TASKS.md**: Mark completed, add follow-ups
4. **Commit changes**: Follow conventional commit format
5. **Suggest next priority**: If backlog is low, propose new tasks

---

**Last Updated**: 2026-01-17
**Constitution Version**: 1.0.0-cortex
**Cortex TMS Version**: 2.6.0-beta.1

<!-- @cortex-tms-version 2.6.0-beta.1 -->
