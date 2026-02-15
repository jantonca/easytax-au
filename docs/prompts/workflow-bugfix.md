# Workflow: Structured Bug Fix

## Purpose
Systematic workflow for investigating and fixing bugs in EasyTax-AU, from reproduction to verification.

## When to Use
- User reports a bug
- User says "this isn't working"
- Error messages in logs
- Test failures

---

## Phase 1: Triage & Reproduction

### Step 1: Bug Intake
**Gather information:**
- What's broken? (Expected vs. actual behavior)
- Where? (Frontend, backend, specific page/endpoint)
- When? (Always, intermittent, after specific action)
- Error messages? (Stack traces, console logs)
- Environment? (Dev, staging, production)

**Severity assessment:**
- **P0 (Critical)**: App crash, data corruption, security vulnerability
- **P1 (High)**: Feature broken, incorrect tax calculations, auth failure
- **P2 (Medium)**: UI glitch, performance issue, edge case
- **P3 (Low)**: Cosmetic, minor UX improvement

---

### Step 2: Check Known Issues
**Use `/debug` skill** - checks TROUBLESHOOTING.md first

**Common issues:**
- NestJS multipart boolean coercion (`"false"` string != `false` boolean)
- Circular dependencies (backend modules)
- TypeORM lazy loading issues
- React hook dependency arrays
- Date parsing (DD/MM/YYYY vs MM/DD/YYYY)
- GST rounding errors (float vs integer math)

**If found in TROUBLESHOOTING.md:**
→ Apply documented workaround
→ Skip to Phase 4 (Verification)

**If not found:**
→ Proceed to Phase 2 (Investigation)

---

## Phase 2: Investigation

### Step 3: Reproduce the Bug
**Frontend bugs:**
```bash
pnpm --filter web dev
# Open browser, follow reproduction steps
```

**Capture:**
- Browser console logs
- Network tab (API errors)
- React DevTools (component state)
- Screenshots (if UI bug)

**Backend bugs:**
```bash
pnpm run start:dev
# Trigger bug via API or frontend
```

**Capture:**
- Terminal logs (stack trace)
- Database state (query results)
- Request/response payloads

---

### Step 4: Isolate Root Cause
**Check layers from UI down:**

1. **Frontend (web/src/)**
   - Component logic errors
   - State management issues
   - Hook dependencies
   - Type mismatches

2. **API Layer**
   - Network request errors
   - Error handling logic
   - Response parsing

3. **Backend (backend/src/)**
   - Controller validation
   - Service business logic
   - DTO mapping
   - Exception handling

4. **Database**
   - Entity definitions
   - Query logic (N+1, missing relations)
   - Data integrity (constraints, indexes)
   - Migration issues

5. **Environment**
   - `.env` variables
   - Docker config
   - Dependencies (package.json)

**Read relevant files:**
```bash
# Find files related to bug
grep -r "errorKeyword" backend/src/ web/src/ --include="*.ts" --include="*.tsx"
```

**Read documentation:**
- Tax/GST bug? → `docs/core/ATO-LOGIC.md`
- Database bug? → `docs/core/SCHEMA.md`
- Security bug? → `docs/core/SECURITY.md`
- Pattern violation? → `docs/core/PATTERNS.md`

---

### Step 5: Hypothesize & Validate
**Form hypothesis:**
"The bug occurs because [specific reason]"

**Validate hypothesis:**
1. Add debug logging
2. Inspect variables at breakpoint
3. Check database state
4. Review git history (`git log --oneline -20`)

**Confirm root cause:**
- Can you trigger bug reliably?
- Does fix hypothesis address root cause?
- Are there other instances of same bug?

---

## Phase 3: Fix Implementation

### Step 6: Write Failing Test
**🚨 MANDATORY: Write test that reproduces bug**

**Frontend test:**
```typescript
// web/src/components/MyComponent.test.tsx
it('should handle edge case that caused bug', async () => {
  // Arrange: Set up bug scenario
  // Act: Trigger bug
  // Assert: Verify expected behavior (will fail until fixed)
});
```

**Backend test:**
```typescript
// backend/src/my/my.service.spec.ts
it('should correctly handle edge case', async () => {
  // Arrange: Set up bug scenario
  // Act: Call method that has bug
  // Assert: Verify correct behavior (will fail until fixed)
});
```

**Run test (verify failure):**
```bash
pnpm --filter web test [path]
pnpm run test [path]
```

---

### Step 7: Implement Fix
**Apply fix with code quality checklist:**
- [ ] Fix addresses root cause (not symptom)
- [ ] No new `any` types introduced
- [ ] Error handling improved (if relevant)
- [ ] Input validation added (if relevant)
- [ ] No breaking changes to existing functionality
- [ ] Currency math uses integers (if relevant)
- [ ] GST calculations correct (if tax-related)

**Example fixes:**

**Bug: Float precision in GST calculation**
```typescript
// ❌ BEFORE (buggy)
const gst = totalAmount * 0.10;  // Float precision error

// ✅ AFTER (fixed)
const gst = Math.round(totalAmountInCents / 11);  // Integer math
```

**Bug: Missing input validation**
```typescript
// ❌ BEFORE (buggy)
async createTransaction(data: any) {
  return this.repo.save(data);  // No validation
}

// ✅ AFTER (fixed)
async createTransaction(dto: CreateTransactionDto) {
  // Validation happens via class-validator decorators
  return this.repo.save(dto);
}
```

**Bug: N+1 query**
```typescript
// ❌ BEFORE (buggy)
const transactions = await this.repo.find();
for (const tx of transactions) {
  const business = await this.businessRepo.findOne(tx.businessId);  // N+1!
}

// ✅ AFTER (fixed)
const transactions = await this.repo.find({
  relations: ['business'],  // Eager load, single query
});
```

---

### Step 8: Verify Fix
**Run test (verify pass):**
```bash
pnpm --filter web test [path]
pnpm run test [path]
```

**Run full test suite:**
```bash
pnpm --filter web test
pnpm run test
```

**Lint:**
```bash
pnpm --filter web lint
pnpm run lint
```

**If schema changed:**
```bash
pnpm run generate:types
```

---

## Phase 4: Verification & Documentation

### Step 9: Regression Testing
**Manual smoke test:**
- Test the fixed bug scenario
- Test adjacent features (ensure no regressions)
- Test edge cases related to bug

**Check affected areas:**
- If frontend fix: Test all pages using fixed component
- If backend fix: Test all endpoints using fixed service
- If database fix: Verify data integrity

---

### Step 10: Code Review
**Use `/review` skill**

**Focus areas:**
1. **ATO Compliance** (if tax-related bug)
2. **Security** (if input validation or auth bug)
3. **Code Quality** (fix doesn't introduce new issues)
4. **Architecture** (fix follows patterns)
5. **Performance** (fix doesn't create new bottlenecks)

**Output:** Pass/Conditional/Fail

---

### Step 11: Update Documentation
**Update TROUBLESHOOTING.md if:**
- Bug was hard to diagnose
- Bug is framework-specific (NestJS, React, TypeORM)
- Workaround needed (not a clean fix)
- Other developers likely to encounter

**Format:**
```markdown
### [Brief Bug Description]

**Symptom:** [What developer sees]

**Root Cause:** [Why it happens]

**Fix/Workaround:**
[Code example or steps]

**Related:** [Links to issues, docs]
```

---

### Step 12: Git Commit
**Commit message format:**
```bash
git commit -m "$(cat <<'EOF'
fix: [brief description of bug fix]

[Longer explanation of what was broken and how it's fixed]

Fixes: [Issue description or link]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**Example:**
```
fix: correct GST calculation for GST-inclusive amounts

Previous implementation used float multiplication (amount * 0.10)
which caused precision errors. Now uses integer division
(Math.round(amountInCents / 11)) as per ATO-LOGIC.md.

Fixes: GST showing as $10.000000000001 instead of $10.00

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Phase 5: Post-Fix Actions

### Step 13: Prevention Analysis
**Ask: How can we prevent this class of bug?**

**Possible actions:**
- Add validation rule
- Add lint rule
- Update CLAUDE.md guardrails
- Add pre-commit hook
- Improve error messages
- Add monitoring/alerting

**Example:**
```
Bug: Float precision in currency math
Prevention: Add ESLint rule to flag `parseFloat` on currency variables
```

---

### Step 14: Deployment (if urgent)
**For P0/P1 bugs in production:**
1. **Use `/deploy` skill**
2. **Follow hotfix process:**
   - Deploy to staging first
   - Verify fix works
   - Deploy to production
   - Monitor logs for errors

**For P2/P3 bugs:**
- Include in next regular deployment
- No special deployment needed

---

## Workflow Diagram

```
Start
  ↓
Bug Report → Gather Info → Assess Severity (P0/P1/P2/P3)
  ↓
[/debug] → Check TROUBLESHOOTING.md
  ↓
Known Issue? → Yes → Apply Workaround → Verify → Done
  ↓ No
Reproduce Bug → Capture Logs/State
  ↓
Isolate Root Cause → Read Relevant Docs
  ↓
Hypothesize → Validate Hypothesis
  ↓
Write Failing Test → Verify Test Fails
  ↓
Implement Fix → Apply Code Quality Checks
  ↓
Run Test → Verify Pass → Run Full Suite
  ↓
[/review] → 5-Pillar Review
  ↓
Pass? → No → Fix Issues → Re-review
  ↓ Yes
Regression Testing → Manual Smoke Test
  ↓
Update TROUBLESHOOTING.md (if applicable)
  ↓
Git Commit
  ↓
Prevention Analysis → Add Guardrails (if needed)
  ↓
Deploy (if urgent) → [/deploy]
  ↓
Done ✅
```

---

## Bug Fix Checklist

Before marking bug as fixed:
- [ ] Bug reproduced reliably
- [ ] Root cause identified (not just symptom)
- [ ] Failing test written
- [ ] Fix implemented
- [ ] Test now passes
- [ ] Full test suite passes
- [ ] Linting passes
- [ ] Type generation run (if schema changed)
- [ ] Code review passed
- [ ] Regression testing done
- [ ] TROUBLESHOOTING.md updated (if applicable)
- [ ] Git commit created
- [ ] Prevention analysis done
- [ ] Deployed (if urgent P0/P1)

---

## Common Bug Patterns & Fixes

### Currency Math Bugs
```typescript
// ❌ Bug: Float precision
const gst = amount * 0.10;

// ✅ Fix: Integer math
const gst = Math.round(amountInCents / 11);
```

### Date Parsing Bugs
```typescript
// ❌ Bug: US format assumed
new Date('02/15/2026');  // Feb 15 or 15 Feb?

// ✅ Fix: Explicit ISO format
const [day, month, year] = '15/02/2026'.split('/');
new Date(`${year}-${month}-${day}`);  // ISO 8601
```

### N+1 Query Bugs
```typescript
// ❌ Bug: N+1 queries
for (const tx of transactions) {
  const business = await this.businessRepo.findOne(tx.businessId);
}

// ✅ Fix: Eager loading
const transactions = await this.repo.find({
  relations: ['business'],
});
```

### Type Coercion Bugs
```typescript
// ❌ Bug: String boolean from form-data
if (dto.isCapital) {  // "false" is truthy!

// ✅ Fix: Explicit boolean conversion
if (dto.isCapital === true || dto.isCapital === 'true') {
```

### Encryption Bugs
```typescript
// ❌ Bug: SQL on encrypted field
await queryRunner.query(`UPDATE businesses SET abn = CONCAT(abn, '-suffix')`);

// ✅ Fix: Entity-based update
const businesses = await this.repo.find();
for (const b of businesses) {
  b.abn = b.abn + '-suffix';  // Decrypts, modifies, re-encrypts
  await this.repo.save(b);
}
```

---

## Success Criteria

Bug fix is complete when:
- ✅ Bug no longer reproducible
- ✅ Root cause understood and documented
- ✅ Test prevents regression
- ✅ All tests pass
- ✅ Code review passed
- ✅ No new bugs introduced
- ✅ Prevention measures considered
- ✅ TROUBLESHOOTING.md updated (if applicable)

---

## Escalation

**Escalate to user if:**
- Root cause unclear after investigation
- Fix requires breaking changes
- Fix requires data migration
- Multiple valid fix approaches exist
- Bug is in external dependency (framework, library)
