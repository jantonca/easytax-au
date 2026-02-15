# /debug - Structured Debugging Workflow

## Purpose
Systematic bug investigation. Check known issues FIRST, then diagnose.

## Context
Bug description: $ARGUMENTS

## Workflow

### 1. Check Known Issues
**Read FIRST:**
- `docs/core/TROUBLESHOOTING.md` - Known framework bugs/workarounds
- Recent commits: `git log --oneline -20`
- Current branch status: `git status`

**Common issues to check:**
- NestJS multipart/form-data boolean coercion (`string "false"` != `boolean false`)
- Circular dependencies (backend modules)
- TypeORM lazy loading issues
- React hook dependency arrays

### 2. Reproduce the Bug
**Frontend:**
```bash
pnpm --filter web dev
# Open browser, follow reproduction steps
```

**Backend:**
```bash
pnpm run start:dev
# Check terminal logs for stack traces
```

**Capture:**
- Error message (full stack trace)
- Browser console logs (frontend)
- Network tab (API errors)
- Database state (if relevant)

### 3. Isolate the Root Cause
**Check layers from UI down:**
1. **Frontend (web/src/)**: Component logic, state management
2. **API Layer**: Network requests, error handling
3. **Backend (backend/src/)**: Controllers, services, validation
4. **Database**: Entity definitions, migrations, queries
5. **Environment**: `.env` variables, Docker config

**Read relevant files:**
- Component/service with bug
- Related test files
- `docs/core/SCHEMA.md` (if database-related)
- `docs/core/ATO-LOGIC.md` (if tax calculation-related)

### 4. Hypothesize & Test
**Create minimal reproduction:**
- Write failing test case
- Verify test fails with current code
- Apply fix
- Verify test passes

**Test commands:**
```bash
# Frontend
pnpm --filter web test [path]

# Backend
pnpm run test [path]
```

### 5. Implement Fix
**Code Quality Checklist:**
- [ ] Fix addresses root cause (not symptom)
- [ ] No new `any` types introduced
- [ ] Error handling improved (if relevant)
- [ ] Input validation added (if relevant)
- [ ] No breaking changes to existing functionality

**If schema changed:**
```bash
pnpm run generate:types
```

### 6. Regression Testing
**Run full test suite:**
```bash
# Frontend
pnpm --filter web test
pnpm --filter web lint

# Backend
pnpm run test
pnpm run lint
```

**Manual smoke test:**
- Test the fixed bug scenario
- Test adjacent features (ensure no regressions)
- Check error states still work

## Output Format
```markdown
## Bug Fix: [Brief Description]

### Root Cause
[Explain what was actually broken and why]

### Investigation Path
1. Checked TROUBLESHOOTING.md: [Found/Not Found]
2. Reproduced in: [Environment]
3. Isolated to: [Layer/File]
4. Related to: [Known issue/New bug]

### Fix Applied
**Files modified:**
- `path/to/file1.ts` - [Change description]
- `path/to/file2.tsx` - [Change description]

**Tests added:**
- `path/to/test.spec.ts` - [Test coverage description]

### Verification
- [ ] Bug reproduction: FIXED
- [ ] Tests: PASS
- [ ] Lint: PASS
- [ ] Regression tests: PASS
- [ ] Manual smoke test: PASS

### Prevention
[Optional: How to prevent this class of bug in future]
- Add validation rule
- Update TROUBLESHOOTING.md
- Add guardrail to CLAUDE.md
```

## Guardrails
- **NEVER** apply fixes without understanding root cause
- **NEVER** skip writing a test for the bug
- **ALWAYS** check TROUBLESHOOTING.md first
- **ALWAYS** run full test suite after fix
- **FLAG** if fix requires database migration or encryption changes

## Australian Domain Context
- GST rounding: Always round to 2 decimal places (cents)
- Tax year boundaries: June 30 / July 1
- BAS due dates: Oct 28, Feb 28, Apr 28, Jul 28
- ABN validation: 11 digits, weighted checksum
