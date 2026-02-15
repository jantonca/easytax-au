# /tdd - Test-Driven Development Workflow

## Purpose
Mandatory TDD workflow for implementing features. Tests FIRST, implementation SECOND.

## Context
Task description: $ARGUMENTS

## Workflow

### 1. Plan & Read Documentation
- Read `docs/core/PATTERNS.md` for code patterns
- Read `docs/core/SCHEMA.md` if touching database entities
- Read `docs/core/ATO-LOGIC.md` if implementing tax/GST/BAS logic
- Identify files to modify/create

### 2. Write Tests FIRST
**Before any implementation code:**

**Frontend (web/src/):**
```bash
# Create .test.tsx file next to component
touch web/src/components/[Component].test.tsx
```

**Backend (backend/src/):**
```bash
# Create .spec.ts file next to service/controller
touch backend/src/[module]/[file].spec.ts
```

**Test structure:**
- Arrange: Set up test data
- Act: Call function/render component
- Assert: Verify expected behavior

**Coverage targets:**
- Tax calculations/mutations: 80%+
- UI components: 60%+
- Pure functions: 90%+

### 3. Run Tests (Verify Failure)
**Frontend:**
```bash
pnpm --filter web test [path]
```

**Backend:**
```bash
pnpm run test
```

**Expected result:** Tests FAIL (red) - proves tests work

### 4. Implement Minimal Code
Write ONLY enough code to make tests pass. No gold-plating.

**Code Quality Checklist:**
- [ ] No `any` types (use `@shared/types` or create new type)
- [ ] No `console.log` (use proper logger)
- [ ] Currency as cents (integers, never floats)
- [ ] Error handling with try/catch
- [ ] Input validation

### 5. Run Tests Again (Verify Pass)
Same commands as step 3.

**Expected result:** Tests PASS (green)

### 6. Lint & Type-Check
**Frontend:**
```bash
pnpm --filter web lint
pnpm --filter web type-check
```

**Backend:**
```bash
pnpm run lint
```

**If schema/entity changed:**
```bash
pnpm run generate:types
```

### 7. Manual Testing (UI only)
**Frontend dev server:**
```bash
pnpm --filter web dev
```

Test edge cases in browser:
- Empty states
- Loading states
- Error states
- Validation errors

## Output Format
```markdown
## TDD Implementation: [Feature Name]

### Tests Written
- [ ] `path/to/test1.test.ts` (X test cases)
- [ ] `path/to/test2.spec.ts` (Y test cases)

### Implementation Files
- [ ] `path/to/implementation.ts`
- [ ] `path/to/component.tsx`

### Verification Results
**Test Results:**
- Frontend: [PASS/FAIL]
- Backend: [PASS/FAIL]

**Lint Results:**
- Frontend: [PASS/FAIL]
- Backend: [PASS/FAIL]

**Type Generation:** [Ran/Not Needed]

### Coverage Impact
- Previous: X%
- New: Y%
- Delta: +Z%

### Ready for Review
Use `/review` to audit compliance, security, and code quality
```

## Guardrails
- **NEVER** write implementation code before tests
- **NEVER** skip linting
- **NEVER** use floats for currency (cents only)
- **NEVER** use US tax terms (IRS, sales tax, W-2, 1040)
- **ALWAYS** run `pnpm run generate:types` after backend schema changes

## Australian Domain Context
- GST calculation: `total/11` for GST-inclusive amounts
- Tax year: July 1 - June 30
- BAS labels: Use `G1` (total sales), `G10` (capital purchases), `G11` (non-capital purchases), `1A` (GST on sales), `1B` (GST on purchases)
- Date formats: DD/MM/YYYY
