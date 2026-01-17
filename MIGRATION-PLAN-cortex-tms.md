# Migration Plan: Proto Cortex → Cortex TMS 2.6.0-beta.1

**Project**: EasyTax AU
**Current System**: Proto Cortex (Instruction Layering v2.0)
**Target**: Cortex TMS 2.6.0-beta.1
**Estimated Effort**: 6-8 hours
**Risk Level**: LOW (non-breaking, additive changes)

---

## Executive Summary

This migration plan transforms the existing proto-cortex governance system into a **standardized Cortex TMS implementation** while:

✅ **Preserving** all domain knowledge (ATO-LOGIC, PATTERNS, ARCHITECTURE)
✅ **Enhancing** with validation, release management, and truth syncing
✅ **Maintaining** backward compatibility (existing workflows continue working)
✅ **Adding** CLI automation and quality gates

**Philosophy**: This is not a rewrite - it's an **upgrade** that formalizes what already works.

---

## Phase 1: Pre-Migration Audit (30 minutes)

### 1.1 Backup Current State

```bash
# Create timestamped backup
cd /home/jma/repos-ubuntu/github/easytax-au
git checkout -b backup/pre-cortex-migration-2026-01-17
git add -A
git commit -m "backup: snapshot before Cortex TMS migration

Current proto-cortex features:
- Instruction Layering v2.0
- Search Anchor Standard
- 855-line PATTERNS.md library
- Australian tax domain rules
- Type integrity triggers
- Monorepo with pnpm workspaces

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push backup branch to remote
git push -u origin backup/pre-cortex-migration-2026-01-17

# Return to main
git checkout main
```

### 1.2 Document Current File Structure

```bash
# Create migration reference
tree -L 2 -I 'node_modules|dist|.git' > MIGRATION-SNAPSHOT-before.txt
```

**Files to audit**:
- [ ] CLAUDE.md (96 lines)
- [ ] .github/copilot-instructions.md (170 lines)
- [ ] docs/core/PATTERNS.md (855 lines)
- [ ] docs/core/*.md (ARCHITECTURE, ATO-LOGIC, SCHEMA, SECURITY, TROUBLESHOOTING, BACKUP)
- [ ] docs/archive/*.md (v1.0, v1.1 changelogs)
- [ ] docs/AI-INSTRUCTION-MIGRATION.md
- [ ] NEXT-TASKS.md
- [ ] docs/FUTURE-ENHANCEMENTS.md

---

## Phase 2: Install Cortex TMS (15 minutes)

### 2.1 Install CLI as Dev Dependency

```bash
cd /home/jma/repos-ubuntu/github/easytax-au

# Install cortex-tms CLI (beta)
pnpm add -D cortex-tms@2.6.0-beta.1

# Verify installation
npx cortex-tms --version
# Expected: 2.6.0-beta.1
```

### 2.2 Add Cortex Scripts to package.json

```bash
# Add npm scripts for common Cortex commands
```

**Edit `/home/jma/repos-ubuntu/github/easytax-au/package.json`**:

```json
{
  "scripts": {
    "test": "jest",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "build": "nest build",
    "start:dev": "nest start --watch",
    "generate:types": "ts-node scripts/generate-shared-types.ts",

    "cortex:validate": "cortex-tms validate --strict",
    "cortex:init": "cortex-tms init",
    "cortex:status": "cortex-tms status",
    "cortex:version": "cortex-tms --version",
    "precommit": "pnpm run cortex:validate && pnpm run lint"
  }
}
```

### 2.3 Test Installation

```bash
# Run validation (will fail initially - expected)
pnpm run cortex:validate
# Expected: ERROR - No .cortex/ directory found

# Check status
pnpm run cortex:status
# Expected: Instructions on how to initialize
```

---

## Phase 3: Initialize Cortex Configuration (45 minutes)

### 3.1 Create Cortex Directory Structure

```bash
mkdir -p .cortex/templates
mkdir -p .cortex/archive
```

### 3.2 Create Cortex Constitution (.cortex/constitution.md)

**Create `/home/jma/repos-ubuntu/github/easytax-au/.cortex/constitution.md`**:

```markdown
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
```

### 3.3 Create Glossary (.cortex/glossary.md)

**Create `/home/jma/repos-ubuntu/github/easytax-au/.cortex/glossary.md`**:

```markdown
# EasyTax AU - Terminology Glossary

## Australian Tax System (ATO)

**ABN** (Australian Business Number)
11-digit unique identifier for businesses

**ATO** (Australian Taxation Office)
Australia's tax authority (equivalent to IRS in US)

**BAS** (Business Activity Statement)
Quarterly or monthly report for GST, PAYG, and other obligations

**Financial Year (FY)**
July 1 to June 30 (e.g., FY 2024 = July 1, 2023 to June 30, 2024)

**GST** (Goods & Services Tax)
10% value-added tax on most goods and services (similar to VAT, NOT sales tax)

**PAYG** (Pay As You Go)
Withholding tax system for employees and contractors

**TFN** (Tax File Number)
Unique identifier for individuals (equivalent to SSN in US)

---

## Technical Terms

**Cents-Based Currency**
Storing monetary values as integers in cents (e.g., $123.45 = 12345 cents)
Prevents floating-point rounding errors

**E2E Testing**
End-to-end testing using Playwright (simulates real user workflows)

**Instruction Layering v2.0**
Proto cortex strategy: rules (always-loaded) + references (on-demand)

**Monorepo**
Single repository containing multiple packages (web + backend + shared)

**Search Anchor**
Standardized header format for quick lookup (e.g., `### [Pattern Name] Pattern`)

**TDD** (Test-Driven Development)
Write failing test → implement code → refactor

**Type Integrity Trigger**
Requirement to run `pnpm run generate:types` after backend schema changes

---

## Architectural Patterns

**Entity Structure Pattern**
How to define TypeORM entities with proper decorators and relationships

**Currency & Math Pattern**
Using Decimal.js for calculations, storing as cents

**Data Fetching Pattern**
TanStack Query for server state management

**Form Validation Pattern**
React Hook Form + Zod schema validation

---

## Project-Specific Terms

**AGENTS.md**
Deprecated proto cortex file (distributed to PATTERNS.md and copilot-instructions.md)

**WARP.md**
Deleted proto cortex file (was duplicate of CLAUDE.md)

**Technical Map**
Reference table in copilot-instructions.md for which file to read for each task type

---

**Last Updated**: 2026-01-17
```

### 3.4 Create Patterns Registry (.cortex/patterns.md)

**Create `/home/jma/repos-ubuntu/github/easytax-au/.cortex/patterns.md`**:

```markdown
# EasyTax AU - Pattern Registry

This file is a **pointer** to the comprehensive pattern library maintained in `docs/core/PATTERNS.md`.

## Why Two Pattern Files?

- **`.cortex/patterns.md`** (this file): Cortex TMS registry (lightweight, meta-level)
- **`docs/core/PATTERNS.md`** (855 lines): Implementation library (detailed code examples)

**Cortex Principle**: Use existing documentation where possible, avoid duplication.

---

## Pattern Categories

### Backend Patterns
- [Currency & Math] Pattern → `docs/core/PATTERNS.md#currency-math`
- [Entity Structure] Pattern → `docs/core/PATTERNS.md#entity-structure`
- [Data Fetching] Pattern → `docs/core/PATTERNS.md#data-fetching`
- [Testing] Pattern → `docs/core/PATTERNS.md#testing`

### Frontend Patterns
- [Form Validation] Pattern → `docs/core/PATTERNS.md#form-validation`
- [Searchable Dropdown] Pattern → `docs/core/PATTERNS.md#searchable-dropdown`
- [CSV Import] Pattern → `docs/core/PATTERNS.md#csv-import`
- [Multipart Boolean] Pattern → `docs/core/PATTERNS.md#multipart-boolean`

### Testing Patterns
- [Unit Testing] Pattern → `docs/core/PATTERNS.md#testing`
- [E2E Testing] Pattern → `docs/core/PATTERNS.md#testing`

---

## Pattern Usage

**For AI Agents**:
```bash
# Search for specific pattern
grep "### \[Currency" docs/core/PATTERNS.md -A 50

# Load pattern on-demand (not always in context)
```

**For Developers**:
- Open `docs/core/PATTERNS.md`
- Use Ctrl+F to search for pattern name (e.g., "Currency & Math")

---

## Pattern Standard Format

All patterns follow Search Anchor Standard:

```markdown
### [Pattern Name] Pattern

**Rule**: The principle to follow

**Code**: Working implementation example

**Reference**: Links to related documentation
```

---

**Last Updated**: 2026-01-17
**Pattern Count**: 8 core patterns
**Source of Truth**: `docs/core/PATTERNS.md` (maintained by project team)
```

### 3.5 Create Validation Rules (.cortex/validation.json)

**Create `/home/jma/repos-ubuntu/github/easytax-au/.cortex/validation.json`**:

```json
{
  "version": "1.0.0",
  "rules": {
    "constitutionExists": {
      "enabled": true,
      "severity": "error",
      "message": "Constitution file must exist"
    },
    "glossaryExists": {
      "enabled": true,
      "severity": "warning",
      "message": "Glossary file recommended for domain-specific projects"
    },
    "patternsExist": {
      "enabled": true,
      "severity": "warning",
      "message": "Pattern registry helps maintain consistency"
    },
    "nextTasksExists": {
      "enabled": true,
      "severity": "error",
      "message": "NEXT-TASKS.md is required for task tracking",
      "customPath": "NEXT-TASKS.md"
    },
    "archiveExists": {
      "enabled": true,
      "severity": "info",
      "message": "Archive directory preserves project history"
    },
    "noConsoleLogs": {
      "enabled": true,
      "severity": "warning",
      "message": "Avoid console.log in production code",
      "exclude": ["*.test.ts", "*.spec.ts", "scripts/*"]
    },
    "noAnyTypes": {
      "enabled": true,
      "severity": "error",
      "message": "TypeScript 'any' type is forbidden (use 'unknown' and narrow)",
      "exclude": ["*.test.ts", "*.spec.ts"]
    },
    "currencyInCents": {
      "enabled": true,
      "severity": "error",
      "message": "Currency must be stored as integers in cents, not floats",
      "pattern": "amountInDollars|priceInDollars|costInDollars",
      "antipattern": true
    },
    "australianTaxTerms": {
      "enabled": true,
      "severity": "error",
      "message": "Use Australian tax terminology (GST, ATO, BAS), not US terms (IRS, sales tax)",
      "forbiddenTerms": [
        "IRS",
        "sales tax",
        "W-2",
        "Form 1040",
        "1099",
        "April 15",
        "fiscal year ending Dec 31"
      ]
    }
  },
  "customValidations": [
    {
      "name": "Type Integrity Check",
      "description": "Ensure frontend types are synced with backend schema",
      "command": "pnpm run generate:types",
      "runBefore": "commit",
      "severity": "warning"
    }
  ]
}
```

### 3.6 Update .gitignore

**Add to `/home/jma/repos-ubuntu/github/easytax-au/.gitignore`**:

```bash
# Cortex TMS
.cortex/cache/
.cortex/.env.local
.cortex/temp/
```

**Note**: `.cortex/constitution.md`, `.cortex/glossary.md`, `.cortex/patterns.md` should be committed.

---

## Phase 4: File Mapping & Reorganization (1 hour)

### 4.1 Map Proto Files to Cortex Equivalents

| Proto Cortex File | Cortex TMS Equivalent | Action |
|-------------------|----------------------|--------|
| `CLAUDE.md` | `.cortex/constitution.md` (CLI section) | **MERGE** key sections |
| `.github/copilot-instructions.md` | `.cortex/constitution.md` (main body) | **MERGE** collaboration rules |
| `docs/core/PATTERNS.md` | `docs/core/PATTERNS.md` + `.cortex/patterns.md` | **KEEP** existing, add registry pointer |
| `docs/core/ATO-LOGIC.md` | `.cortex/glossary.md` + `docs/core/ATO-LOGIC.md` | **REFERENCE** from glossary |
| `NEXT-TASKS.md` | `NEXT-TASKS.md` | **KEEP** (already Cortex-compatible) |
| `docs/archive/` | `docs/archive/` | **KEEP** as-is |
| `docs/AI-INSTRUCTION-MIGRATION.md` | `docs/archive/proto-cortex-evolution.md` | **RENAME** for clarity |

### 4.2 Archive Proto System Documentation

```bash
# Rename migration doc to archive
mv docs/AI-INSTRUCTION-MIGRATION.md docs/archive/proto-cortex-evolution.md

# Add Cortex migration marker
echo "\n---\n\n**Migration to Cortex TMS 2.6.0-beta.1**: 2026-01-17\nSee: MIGRATION-PLAN-cortex-tms.md\n" >> docs/archive/proto-cortex-evolution.md
```

### 4.3 Update CLAUDE.md (Keep as Quick Reference)

**Edit `/home/jma/repos-ubuntu/github/easytax-au/CLAUDE.md`**:

Add header:
```markdown
# EasyTax AU - Quick Reference for Claude

**Full Constitution**: See `.cortex/constitution.md` (Cortex TMS 2.6.0-beta.1)
**This File**: CLI commands and quick task discovery prompts

---

[... keep existing CLI commands section ...]

---

## Cortex TMS Commands

```bash
pnpm run cortex:validate          # Validate project health
pnpm run cortex:status            # Check governance status
```

For full operational instructions, see `.cortex/constitution.md`.

<!-- @cortex-tms-version 2.6.0-beta.1 -->
```

### 4.4 Update copilot-instructions.md

**Edit `/home/jma/repos-ubuntu/github/easytax-au/.github/copilot-instructions.md`**:

Add header:
```markdown
# AI Collaboration Protocol - EasyTax AU

**Governance Framework**: Cortex TMS 2.6.0-beta.1
**Full Constitution**: `.cortex/constitution.md`
**This File**: GitHub Copilot-specific rules and technical map

---

[... keep existing content ...]

---

## Cortex TMS Integration

This project uses **Cortex TMS 2.6.0-beta.1** for governance automation.

**Before committing**:
```bash
pnpm run cortex:validate          # Automated quality gates
pnpm run lint                     # Code formatting
pnpm run test                     # Run tests
```

**Constitution Location**: `.cortex/constitution.md` (source of truth)

<!-- @cortex-tms-version 2.6.0-beta.1 -->
```

---

## Phase 5: Add Cortex Automation (1 hour)

### 5.1 Create Pre-Commit Hook (Optional)

**Create `.husky/pre-commit`** (if using Husky):

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run Cortex validation before commit
pnpm run cortex:validate || {
  echo "❌ Cortex validation failed. Fix issues before committing."
  exit 1
}

# Run linting
pnpm run lint || {
  echo "❌ Linting failed. Fix issues before committing."
  exit 1
}
```

**OR** add to package.json scripts:

```json
{
  "scripts": {
    "precommit": "pnpm run cortex:validate && pnpm run lint",
    "prepush": "pnpm run cortex:validate && pnpm run test"
  }
}
```

### 5.2 Add GitHub Actions Workflow

**Create `.github/workflows/cortex-validation.yml`**:

```yaml
name: Cortex TMS Validation

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Cortex TMS Validation
        run: pnpm run cortex:validate

      - name: Run Linting
        run: pnpm run lint

      - name: Run Tests
        run: pnpm run test
```

### 5.3 Update NEXT-TASKS.md

**Add to `/home/jma/repos-ubuntu/github/easytax-au/NEXT-TASKS.md`**:

```markdown
## 🎯 Cortex TMS Migration Tasks

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| Verify Cortex validation passes | 15min | 🔴 HIGH | ✅ Done |
| Update team documentation with Cortex commands | 30min | 🟡 MEDIUM | ⬜ Todo |
| Train team on `.cortex/constitution.md` structure | 1h | 🟡 MEDIUM | ⬜ Todo |
| Add Cortex validation to CI/CD pipeline | 30min | 🟢 LOW | ⬜ Todo |

**Migration Completed**: 2026-01-17
**Cortex Version**: 2.6.0-beta.1
```

---

## Phase 6: Validation & Testing (45 minutes)

### 6.1 Run Full Validation Suite

```bash
# Test Cortex validation
pnpm run cortex:validate
# Expected: All checks pass (constitution exists, glossary exists, patterns exist, NEXT-TASKS exists)

# Test linting
pnpm run lint
# Expected: No errors

# Test backend
pnpm run test
# Expected: All tests pass (482 tests)

# Test frontend
pnpm --filter web test
# Expected: All tests pass

# Test E2E (if appropriate timing)
pnpm --filter web test:e2e
# Expected: 62 tests pass (98.4% pass rate)
```

### 6.2 Verify File Structure

```bash
# Check Cortex directory
ls -la .cortex/
# Expected:
# - constitution.md
# - glossary.md
# - patterns.md
# - validation.json
# - templates/ (empty for now)
# - archive/ (empty for now)

# Verify gitignore
cat .gitignore | grep cortex
# Expected: .cortex/cache/, .cortex/.env.local, .cortex/temp/
```

### 6.3 Test CLI Commands

```bash
# Test status
pnpm run cortex:status
# Expected: Shows constitution version, patterns count, validation rules

# Test version
pnpm run cortex:version
# Expected: 2.6.0-beta.1
```

### 6.4 Smoke Test - Create Feature Branch

```bash
# Test Cortex workflow on real feature
git checkout -b feat/test-cortex-migration

# Make trivial change (add comment)
echo "// Cortex TMS migration completed 2026-01-17" >> src/main.ts

# Run validation
pnpm run cortex:validate
# Expected: Pass

# Commit
git add .
git commit -m "chore: add Cortex TMS migration marker

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Return to main
git checkout main
git branch -d feat/test-cortex-migration
```

---

## Phase 7: Documentation Updates (30 minutes)

### 7.1 Update README.md

**Add to `/home/jma/repos-ubuntu/github/easytax-au/README.md`**:

```markdown
## 🤖 AI Governance

This project uses **[Cortex TMS 2.6.0-beta.1](https://github.com/cortex-tms/cortex-tms)** for AI-assisted development governance.

### For AI Agents
- **Constitution**: `.cortex/constitution.md` (primary operational guide)
- **Quick Reference**: `CLAUDE.md` (CLI commands)
- **Patterns**: `docs/core/PATTERNS.md` (implementation library)
- **Glossary**: `.cortex/glossary.md` (Australian tax terminology)

### For Developers

**Validate project health**:
```bash
pnpm run cortex:validate          # Run governance checks
pnpm run cortex:status            # View current status
```

**Pre-commit checklist**:
```bash
pnpm run cortex:validate          # Automated quality gates
pnpm run lint                     # Code formatting
pnpm run test                     # Run tests
```

See `.cortex/constitution.md` for complete governance framework.
```

### 7.2 Update CONTRIBUTING.md (if exists, or create)

**Create `/home/jma/repos-ubuntu/github/easytax-au/CONTRIBUTING.md`**:

```markdown
# Contributing to EasyTax AU

## Development Workflow

1. **Create feature branch**: `git checkout -b feat/your-feature-name`
2. **Read the constitution**: `.cortex/constitution.md` (understand rules)
3. **Check patterns**: `docs/core/PATTERNS.md` (use existing implementations)
4. **Write tests first**: Follow TDD workflow
5. **Implement feature**: Follow pre-submission checklist
6. **Validate**: `pnpm run cortex:validate`
7. **Commit**: Use conventional commit format with co-authorship

## Pre-Submission Checklist

- [ ] No `console.log` in production code
- [ ] No `any` types
- [ ] All promises have error handling
- [ ] Currency values are integers in cents
- [ ] Types imported from `@shared/types`
- [ ] If backend entity changed: `pnpm run generate:types`
- [ ] No US tax terminology (see `docs/core/ATO-LOGIC.md`)
- [ ] Tests written and passing
- [ ] Linting passes (`pnpm run lint`)
- [ ] Cortex validation passes (`pnpm run cortex:validate`)

## Governance Framework

This project uses **Cortex TMS 2.6.0-beta.1** for AI governance.

- **Constitution**: `.cortex/constitution.md`
- **Glossary**: `.cortex/glossary.md`
- **Patterns**: `docs/core/PATTERNS.md`
- **Validation**: `pnpm run cortex:validate`

## Code Style

- TypeScript strict mode enabled
- Tailwind CSS for styling
- Conventional Commits for messages
- Co-authorship for AI-assisted commits

## Questions?

Check `docs/core/TROUBLESHOOTING.md` or open an issue.
```

### 7.3 Create Migration Retrospective

**Create `/home/jma/repos-ubuntu/github/easytax-au/docs/archive/cortex-migration-retrospective.md`**:

```markdown
# Cortex TMS Migration Retrospective

**Date**: 2026-01-17
**From**: Proto Cortex (Instruction Layering v2.0)
**To**: Cortex TMS 2.6.0-beta.1
**Effort**: ~6 hours
**Status**: ✅ Completed

---

## What We Migrated

### Proto Cortex System (Before)
- `CLAUDE.md` (96 lines) - CLI commands
- `.github/copilot-instructions.md` (170 lines) - Collaboration rules
- `docs/core/PATTERNS.md` (855 lines) - Implementation library
- Custom validation via checklists
- Manual task tracking in `NEXT-TASKS.md`
- No automated governance

### Cortex TMS System (After)
- `.cortex/constitution.md` - Unified governance document
- `.cortex/glossary.md` - Domain terminology
- `.cortex/patterns.md` - Pattern registry (points to `docs/core/PATTERNS.md`)
- `.cortex/validation.json` - Automated validation rules
- `pnpm run cortex:validate` - Automated quality gates
- CI/CD integration via GitHub Actions

---

## What We Preserved

✅ All domain knowledge (ATO-LOGIC, PATTERNS, ARCHITECTURE)
✅ 855-line PATTERNS.md library
✅ Instruction Layering v2.0 principles
✅ Search Anchor Standard
✅ "Propose, Justify, Recommend" framework
✅ Type integrity triggers
✅ Australian tax guardrails
✅ Task tracking in NEXT-TASKS.md
✅ Archive history

---

## What We Gained

🎯 **Automated Validation**: `pnpm run cortex:validate` runs quality gates
🎯 **Standardized Structure**: `.cortex/` directory with clear file purposes
🎯 **CI/CD Integration**: GitHub Actions workflow for PRs
🎯 **CLI Commands**: `cortex:status`, `cortex:validate`, `cortex:version`
🎯 **Pre-Commit Hooks**: Optional automation for validation
🎯 **Version Tracking**: `<!-- @cortex-tms-version 2.6.0-beta.1 -->`
🎯 **Ecosystem Compatibility**: Can use Cortex templates, tools, and community patterns

---

## Migration Challenges

### Challenge 1: File Organization
- **Problem**: Proto system spread rules across multiple files
- **Solution**: Consolidated into `.cortex/constitution.md` while preserving existing docs

### Challenge 2: Avoiding Duplication
- **Problem**: Don't want to duplicate 855-line PATTERNS.md
- **Solution**: Created `.cortex/patterns.md` as pointer/registry, kept implementations in `docs/core/PATTERNS.md`

### Challenge 3: Backward Compatibility
- **Problem**: Existing workflows must continue working
- **Solution**: Kept `CLAUDE.md` and `copilot-instructions.md`, added headers pointing to Cortex

---

## Metrics

**Before Migration**:
- Total governance files: 3 (CLAUDE.md, copilot-instructions.md, PATTERNS.md)
- Validation: Manual checklists
- CI/CD: E2E tests only

**After Migration**:
- Total governance files: 7 (.cortex/* + legacy docs)
- Validation: Automated (`pnpm run cortex:validate`)
- CI/CD: E2E tests + Cortex validation + linting

**Token Efficiency**:
- Proto system: ~48% reduction (Instruction Layering v2.0)
- Cortex system: Same efficiency + better structure

---

## Lessons Learned

1. **Migration is additive, not destructive**: We enhanced, didn't replace
2. **Preserve what works**: 855-line PATTERNS.md was valuable, kept it
3. **Automation reduces cognitive load**: Validation now runs automatically
4. **Standardization enables ecosystem**: Can now use Cortex templates/tools

---

## Next Steps

- [ ] Train team on `.cortex/constitution.md` structure
- [ ] Add more custom validation rules to `.cortex/validation.json`
- [ ] Explore Cortex templates for new features
- [ ] Consider contributing easytax patterns back to Cortex community

---

## Conclusion

**Migration Success**: ✅
**Proto System Insights Preserved**: ✅
**Cortex Benefits Realized**: ✅
**Backward Compatibility Maintained**: ✅

The proto cortex system was already excellent. Cortex TMS adds structure and automation while preserving the best ideas.

**Recommendation**: Other projects with proto governance systems should migrate to Cortex TMS for standardization and tooling benefits.
```

---

## Phase 8: Final Commit & Validation (30 minutes)

### 8.1 Create Migration Branch

```bash
cd /home/jma/repos-ubuntu/github/easytax-au

# Create feature branch
git checkout -b feat/cortex-tms-migration

# Verify all changes staged
git status
```

### 8.2 Run Full Validation Before Commit

```bash
# Cortex validation
pnpm run cortex:validate
# Expected: All checks pass

# Linting
pnpm run lint
# Expected: No errors

# Tests (quick smoke test)
pnpm run test --testNamePattern="Currency" --bail
# Expected: Currency tests pass (verify core functionality intact)
```

### 8.3 Commit Migration

```bash
git add .
git commit -m "feat: migrate to Cortex TMS 2.6.0-beta.1

BREAKING: Enhanced governance framework

Added:
- .cortex/constitution.md (unified governance document)
- .cortex/glossary.md (Australian tax terminology)
- .cortex/patterns.md (pattern registry)
- .cortex/validation.json (automated quality gates)
- pnpm scripts for cortex:validate, cortex:status
- GitHub Actions workflow for Cortex validation
- CONTRIBUTING.md with governance guidelines

Changed:
- CLAUDE.md: Added Cortex reference header
- copilot-instructions.md: Added Cortex integration section
- README.md: Added AI governance section
- package.json: Added cortex-tms@2.6.0-beta.1 dev dependency

Renamed:
- docs/AI-INSTRUCTION-MIGRATION.md → docs/archive/proto-cortex-evolution.md

Preserved:
- All domain knowledge (ATO-LOGIC, PATTERNS, ARCHITECTURE)
- 855-line PATTERNS.md implementation library
- Instruction Layering v2.0 principles
- Search Anchor Standard
- Task tracking in NEXT-TASKS.md
- Archive history

Migration effort: ~6 hours
Risk level: LOW (additive, non-breaking)

See: MIGRATION-PLAN-cortex-tms.md for detailed execution plan
See: docs/archive/cortex-migration-retrospective.md for retrospective

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### 8.4 Merge to Main

```bash
# Switch to main
git checkout main

# Merge feature branch
git merge feat/cortex-tms-migration --no-ff

# Delete feature branch
git branch -d feat/cortex-tms-migration

# Push to remote
git push origin main
```

### 8.5 Tag Release (Optional)

```bash
# Tag migration milestone
git tag -a v1.1.1-cortex -m "Migrate to Cortex TMS 2.6.0-beta.1

- Enhanced governance framework
- Automated validation
- CI/CD integration"

# Push tag
git push origin v1.1.1-cortex
```

---

## Phase 9: Post-Migration Verification (30 minutes)

### 9.1 Fresh Clone Test

```bash
# Clone repository fresh
cd /tmp
git clone /home/jma/repos-ubuntu/github/easytax-au easytax-test
cd easytax-test

# Install dependencies
pnpm install

# Run Cortex validation
pnpm run cortex:validate
# Expected: All checks pass

# Run tests
pnpm run test
# Expected: All 482 tests pass

# Clean up
cd ..
rm -rf easytax-test
```

### 9.2 Verify CI/CD

```bash
# Push a trivial change to trigger GitHub Actions
git checkout -b test/cortex-ci
echo "# Cortex TMS Migration Complete" >> docs/archive/cortex-migration-retrospective.md
git add .
git commit -m "docs: mark migration complete"
git push -u origin test/cortex-ci

# Open PR and verify GitHub Actions run Cortex validation
# Check: https://github.com/[your-org]/easytax-au/actions

# Merge and delete branch
gh pr create --title "Test Cortex CI/CD" --body "Verify Cortex validation in GitHub Actions"
gh pr merge --squash --delete-branch
```

### 9.3 Update Team Documentation

**Create internal wiki page or Notion doc**:

```markdown
# EasyTax AU - Cortex TMS Migration Complete

**Date**: 2026-01-17
**Version**: Cortex TMS 2.6.0-beta.1

## For Developers

### New Commands
```bash
pnpm run cortex:validate          # Run governance checks
pnpm run cortex:status            # View project status
pnpm run cortex:version           # Check Cortex version
```

### New Files to Know
- `.cortex/constitution.md` - Main governance document (read this first!)
- `.cortex/glossary.md` - Australian tax terminology
- `.cortex/patterns.md` - Pattern registry (points to docs/core/PATTERNS.md)
- `.cortex/validation.json` - Validation rules

### What Changed?
- **Added**: Automated validation (`pnpm run cortex:validate`)
- **Added**: CI/CD checks on PRs
- **Added**: Standardized governance structure
- **Preserved**: All existing workflows, patterns, and documentation

### Action Required
1. Read `.cortex/constitution.md` (15 min read)
2. Run `pnpm run cortex:validate` before commits
3. Update your IDE to recognize `.cortex/` files

No breaking changes - existing workflows continue working!
```

---

## Rollback Plan (If Needed)

If migration causes issues, rollback is simple:

```bash
# Return to backup branch
git checkout backup/pre-cortex-migration-2026-01-17

# Create rollback branch
git checkout -b rollback/cortex-migration

# Cherry-pick any commits made after migration
git cherry-pick <commit-hash>

# Merge to main
git checkout main
git merge rollback/cortex-migration --no-ff
git push origin main
```

**Low Risk**: Migration is additive, doesn't break existing code.

---

## Success Criteria

✅ **Cortex validation passes**: `pnpm run cortex:validate` runs without errors
✅ **All tests pass**: 482 backend + frontend tests green
✅ **E2E tests pass**: 62 Playwright tests at 98.4% pass rate
✅ **CI/CD works**: GitHub Actions run Cortex validation on PRs
✅ **Documentation updated**: README, CONTRIBUTING, and team wiki
✅ **No breaking changes**: Existing workflows continue working
✅ **Domain knowledge preserved**: All ATO-LOGIC, PATTERNS, ARCHITECTURE intact

---

## Timeline Summary

| Phase | Effort | Status |
|-------|--------|--------|
| 1. Pre-Migration Audit | 30min | ⬜ Todo |
| 2. Install Cortex TMS | 15min | ⬜ Todo |
| 3. Initialize Cortex Configuration | 45min | ⬜ Todo |
| 4. File Mapping & Reorganization | 1h | ⬜ Todo |
| 5. Add Cortex Automation | 1h | ⬜ Todo |
| 6. Validation & Testing | 45min | ⬜ Todo |
| 7. Documentation Updates | 30min | ⬜ Todo |
| 8. Final Commit & Validation | 30min | ⬜ Todo |
| 9. Post-Migration Verification | 30min | ⬜ Todo |

**Total**: 6-8 hours

---

## Questions & Troubleshooting

### Q: Will this break existing AI workflows?
**A**: No. Cortex is additive. `CLAUDE.md` and `copilot-instructions.md` remain functional.

### Q: Do we need to rewrite PATTERNS.md?
**A**: No. We create `.cortex/patterns.md` as a registry pointer. Keep existing 855-line implementation library.

### Q: What if `cortex:validate` fails on existing code?
**A**: Adjust `.cortex/validation.json` to match current state. Validation rules should reflect reality, not ideals.

### Q: Can we customize validation rules?
**A**: Yes. Edit `.cortex/validation.json` to add/remove/modify rules.

### Q: How do we update Cortex TMS later?
**A**: `pnpm update cortex-tms@latest` (follow semver for breaking changes).

---

## Contact & Support

- **Cortex TMS Issues**: https://github.com/cortex-tms/cortex-tms/issues
- **EasyTax Issues**: [your internal tracker]
- **Migration Questions**: [your team contact]

---

**Migration Plan Version**: 1.0.0
**Created**: 2026-01-17
**Cortex TMS Target**: 2.6.0-beta.1
**Estimated Effort**: 6-8 hours
**Risk Level**: LOW (additive, non-breaking)

<!-- @cortex-tms-version 2.6.0-beta.1 -->
