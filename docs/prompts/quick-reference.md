# Quick Reference: EasyTax-AU Cheat Sheet

**One-page reference for common commands, tax rules, BAS labels, and file locations.**

---

## 🎯 Custom Skills (Slash Commands)

| Command | Purpose | Example Use |
|---------|---------|-------------|
| `/plan` | Task discovery & prioritization | "What should I work on next?" |
| `/tdd` | Test-driven development workflow | "Implement feature X" |
| `/debug` | Structured debugging | "Fix bug in transaction list" |
| `/review` | 5-pillar code review | "Review my changes before merge" |
| `/audit` | Full codebase health check | "Generate quarterly audit report" |
| `/deploy` | Deployment guidance | "Deploy to production" |
| `/import-data` | CSV import specialist | "Implement CSV transaction import" |
| `/schema-change` | Database migration | "Add new column to businesses table" |

---

## 💻 CLI Commands

### Frontend (web/)
```bash
# Development
pnpm --filter web dev

# Testing
pnpm --filter web test [path]
pnpm --filter web test --coverage

# Linting
pnpm --filter web lint
pnpm --filter web type-check

# Build
pnpm --filter web build
```

### Backend (backend/)
```bash
# Development
pnpm run start:dev

# Testing
pnpm run test [path]
pnpm run test --coverage

# Linting
pnpm run lint

# Build
pnpm run build

# Migrations
pnpm run migration:generate src/migrations/Name
pnpm run migration:run
pnpm run migration:revert
pnpm run migration:show

# Type Generation (after schema changes)
pnpm run generate:types
```

### Git
```bash
# Status
git status
git diff

# Commit
git add [files]
git commit -m "type: message"

# Push
git push origin [branch]

# Create PR
gh pr create --title "Title" --body "Description"
```

---

## 🧾 Australian Tax Rules

### GST Calculation
- **Rate:** 10%
- **GST-inclusive:** `gst = Math.round(total / 11)`
- **GST-exclusive:** `gst = Math.round(total * 0.10)`
- **GST-free:** `gst = 0`

### Financial Year
- **Start:** July 1
- **End:** June 30
- **Quarters:**
  - Q1: Jul-Sep
  - Q2: Oct-Dec
  - Q3: Jan-Mar
  - Q4: Apr-Jun

### BAS Due Dates
- **Q1 (Jul-Sep):** October 28
- **Q2 (Oct-Dec):** February 28
- **Q3 (Jan-Mar):** April 28
- **Q4 (Apr-Jun):** July 28

### Date Format
- **Australian standard:** DD/MM/YYYY
- **ISO 8601 (database):** YYYY-MM-DD

---

## 📋 BAS Labels

| Label | Description | Transaction Type |
|-------|-------------|------------------|
| **G1** | Total sales | Sales (all types) |
| **G10** | Capital purchases | Purchases (capital) |
| **G11** | Non-capital purchases | Purchases (non-capital) |
| **1A** | GST on sales | Sales (GST-inclusive or GST-exclusive) |
| **1B** | GST on purchases | Purchases (all types with GST) |

### Label Mapping Logic
```typescript
// Sales
if (transactionType === 'sale') {
  totalLabel = 'G1';
  gstLabel = '1A';
}

// Purchases
if (transactionType === 'purchase') {
  totalLabel = isCapital ? 'G10' : 'G11';
  gstLabel = '1B';
}
```

---

## 🗂️ File Locations

### Core Documentation
| File | Purpose |
|------|---------|
| `CLAUDE.md` | CLI workflow, commands, guardrails |
| `docs/core/ATO-LOGIC.md` | Tax, GST, BAS calculation rules |
| `docs/core/ARCHITECTURE.md` | System design, module structure |
| `docs/core/PATTERNS.md` | Code patterns, examples |
| `docs/core/SCHEMA.md` | Database entities, relationships |
| `docs/core/SECURITY.md` | Encryption, auth, input validation |
| `docs/core/TROUBLESHOOTING.md` | Known issues, workarounds |
| `docs/core/BACKUP.md` | Backup/recovery procedures |

### Task Planning
| File | Purpose |
|------|---------|
| `NEXT-TASKS.md` | Current sprint tasks |
| `FUTURE-ENHANCEMENTS.md` | Backlog ideas |
| `docs/archive/CHANGELOG.md` | Version history |

### Orchestrator Prompts
| File | Purpose |
|------|---------|
| `docs/prompts/orchestrator.md` | Session initialization |
| `docs/prompts/workflow-feature.md` | Feature development workflow |
| `docs/prompts/workflow-bugfix.md` | Bug fix workflow |
| `docs/prompts/quick-reference.md` | This file |

### Custom Skills
| File | Command |
|------|---------|
| `.claude/commands/plan.md` | `/plan` |
| `.claude/commands/tdd.md` | `/tdd` |
| `.claude/commands/debug.md` | `/debug` |
| `.claude/commands/review.md` | `/review` |
| `.claude/commands/audit.md` | `/audit` |
| `.claude/commands/deploy.md` | `/deploy` |
| `.claude/commands/import-data.md` | `/import-data` |
| `.claude/commands/schema-change.md` | `/schema-change` |

### Code Structure
```
easytax-au/
├── backend/
│   ├── src/
│   │   ├── business/        # Business entity module
│   │   ├── transaction/     # Transaction entity module
│   │   ├── auth/            # Authentication module
│   │   ├── entities/        # TypeORM entities
│   │   ├── migrations/      # Database migrations
│   │   └── shared/          # Shared utilities
│   └── test/
│       └── fixtures/        # Test data
├── web/
│   └── src/
│       ├── components/      # React components
│       ├── pages/           # Page components
│       ├── hooks/           # Custom hooks
│       ├── services/        # API services
│       └── utils/           # Utility functions
├── shared/
│   └── types/               # Shared TypeScript types
└── docs/
    ├── core/                # Core documentation
    ├── prompts/             # Orchestrator prompts
    ├── reports/audit/       # Audit reports
    └── archive/             # Historical docs
```

---

## ✅ Code Quality Guardrails

### Mandatory
- ✅ **TDD:** Tests FIRST, implementation SECOND
- ✅ **Currency:** Always in cents (integers), never floats
- ✅ **Types:** Use `@shared/types`, no `any`
- ✅ **Type Gen:** Run `pnpm run generate:types` after schema changes
- ✅ **Validation:** All user inputs validated (DTO classes)
- ✅ **Encryption:** PII fields use `@Encrypted()` decorator

### Forbidden
- ❌ **No `any` types** (use proper types)
- ❌ **No `console.log`** (use proper logger)
- ❌ **No floats for currency** (use integers)
- ❌ **No US tax terms** (IRS, sales tax, W-2, 1040, April 15)
- ❌ **No skipping tests** (TDD is mandatory)
- ❌ **No SQL on encrypted fields** (use entity methods)

---

## 🧪 Test Coverage Targets

| Area | Target | Example |
|------|--------|---------|
| Tax calculations | 80%+ | GST calculation functions |
| Mutations (DB writes) | 80%+ | Create/update transactions |
| UI components | 60%+ | TransactionList, BusinessForm |
| Pure functions | 90%+ | Date formatters, math utilities |

---

## 🔒 Security Checklist

- [ ] PII fields encrypted (`@Encrypted()`)
- [ ] User inputs validated (DTO with `class-validator`)
- [ ] No hardcoded secrets or credentials
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (no `dangerouslySetInnerHTML`)
- [ ] Authentication required on protected routes
- [ ] Data scoped to authenticated user

---

## 🚨 High-Risk Operations

**Extra caution required:**
- CSV imports (can corrupt data if GST wrong)
- Schema changes to encrypted fields (can corrupt data)
- Database migrations in production (backup MANDATORY)
- Deployment to production (freeze window, rollback plan)

**Safety measures:**
1. Backup database first
2. Test in staging
3. Write tests for edge cases
4. Use `/review` to audit
5. Have rollback plan ready

---

## 🎨 Common Patterns

### Currency Math
```typescript
// ✅ Correct
const totalInCents = 11000;  // $110.00
const gstInCents = Math.round(totalInCents / 11);  // $10.00

// ❌ Wrong
const total = 110.00;
const gst = total * 0.10;  // Float precision error
```

### Date Parsing
```typescript
// ✅ Correct (Australian DD/MM/YYYY)
const [day, month, year] = '15/02/2026'.split('/');
const date = new Date(`${year}-${month}-${day}`);  // ISO 8601

// ❌ Wrong
const date = new Date('02/15/2026');  // US format, ambiguous
```

### Data Fetching (Frontend)
```typescript
// ✅ Correct (Tanstack Query)
const { data, isLoading, error } = useQuery({
  queryKey: ['transactions', businessId],
  queryFn: () => fetchTransactions(businessId),
});

// ❌ Wrong
const [data, setData] = useState([]);
useEffect(() => {
  fetch('/api/transactions').then(r => r.json()).then(setData);
}, []);
```

### Form Validation (Backend)
```typescript
// ✅ Correct (class-validator)
import { IsString, IsNumber, Min, IsEnum } from 'class-validator';

class CreateTransactionDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amountInCents: number;

  @IsEnum(['sale', 'purchase'])
  transactionType: string;
}

// ❌ Wrong
async createTransaction(data: any) {  // No validation
  return this.repo.save(data);
}
```

---

## 📊 5-Pillar Review Checklist

| Pillar | Key Checks |
|--------|------------|
| **ATO Compliance** | GST = 10%, BAS labels correct, tax year Jul-Jun, no US terms |
| **Security** | PII encrypted, inputs validated, no SQL injection, auth required |
| **Code Quality** | No `any`, currency as cents, tests exist, coverage targets met |
| **Architecture** | Thin controllers, business logic in services, no circular deps, types synced |
| **Performance** | No N+1 queries, pagination on large data, memoization for expensive ops |

---

## 🔍 Quick Debugging

### Check Known Issues First
```bash
grep -i "keyword" docs/core/TROUBLESHOOTING.md
```

### Common Framework Issues
- **NestJS:** Multipart boolean coercion (`"false"` string != `false` boolean)
- **TypeORM:** N+1 queries (use `relations` option)
- **React:** Hook dependency warnings (check useEffect deps)

### Verify Data Integrity
```sql
-- Check GST calculations
SELECT *, ROUND(total_amount / 11) as calc_gst, gst_amount
FROM transactions
WHERE ABS(gst_amount - ROUND(total_amount / 11)) > 1;

-- Check encrypted fields (should show gibberish)
SELECT id, encrypted_abn FROM businesses LIMIT 5;
```

---

## 🎯 Workflow Quick Start

**New feature:**
```bash
/plan → /tdd → /review → git commit → /deploy
```

**Bug fix:**
```bash
/debug → write test → fix → /review → git commit
```

**Schema change:**
```bash
/schema-change → migration → pnpm run generate:types → /review
```

**Code review:**
```bash
/review [files]
```

**Full audit:**
```bash
/audit
```

---

## 📝 Commit Message Format

```
<type>: <brief description>

<optional longer explanation>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructure (no behavior change)
- `test`: Add/update tests
- `docs`: Documentation changes
- `chore`: Build/config changes

---

## 🆘 Getting Help

- **Project issues:** Check `docs/core/TROUBLESHOOTING.md`
- **Claude Code help:** `/help` command
- **Feedback:** https://github.com/anthropics/claude-code/issues

---

**Last updated:** 2026-02-15
**Version:** 1.3.0 (in development)
