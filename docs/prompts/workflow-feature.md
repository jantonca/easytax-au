# Workflow: End-to-End Feature Development

## Purpose
Complete workflow for implementing a new feature in EasyTax-AU, from task discovery to deployment-ready code.

## When to Use
- User asks to "implement [feature]"
- User says "add [functionality]"
- Starting work on a task from NEXT-TASKS.md

---

## Phase 1: Discovery & Planning

### Step 1: Task Selection
**Use `/plan` skill to:**
- Analyze NEXT-TASKS.md for current tasks
- Review FUTURE-ENHANCEMENTS.md if no current tasks
- Apply priority framework (P0 > P1 > P2 > P3)
- Recommend highest-value task

**Output:** Recommended task with justification

---

### Step 2: Requirements Clarification
**Ask user if needed:**
- Acceptance criteria unclear?
- Multiple valid approaches?
- Dependencies on other features?

**Read relevant documentation:**
- Feature involves tax/GST? → Read `docs/core/ATO-LOGIC.md`
- Feature involves database? → Read `docs/core/SCHEMA.md`
- Feature involves UI patterns? → Read `docs/core/PATTERNS.md`
- Feature involves encryption? → Read `docs/core/SECURITY.md`

---

### Step 3: Plan Mode (for complex features)
**Use `EnterPlanMode` if:**
- Feature touches 3+ files
- Multiple valid implementation approaches
- Architectural decisions needed
- User wants to review approach before coding

**In plan mode:**
1. Explore codebase (Glob, Grep, Read)
2. Design implementation approach
3. Identify files to create/modify
4. Present plan to user for approval
5. Exit plan mode with `ExitPlanMode`

**Skip plan mode if:**
- Simple feature (1-2 files)
- User gave very specific instructions
- Obvious implementation path

---

## Phase 2: Implementation

### Step 4: Test-Driven Development
**🚨 MANDATORY: Use `/tdd` skill**

**Workflow:**
1. **Write tests FIRST**
   - Frontend: `web/src/components/[Component].test.tsx`
   - Backend: `backend/src/[module]/[file].spec.ts`

2. **Run tests (verify failure)**
   ```bash
   pnpm --filter web test [path]
   pnpm run test [path]
   ```

3. **Write minimal implementation code**
   - No `any` types
   - Currency as cents (integers)
   - Use types from `@shared/types`

4. **Run tests (verify pass)**
   ```bash
   pnpm --filter web test
   pnpm run test
   ```

5. **Lint & type-check**
   ```bash
   pnpm --filter web lint
   pnpm run lint
   ```

6. **If schema changed:**
   ```bash
   pnpm run generate:types
   ```

---

### Step 5: Manual Testing (UI features only)
**Start dev server:**
```bash
pnpm --filter web dev
```

**Test edge cases:**
- Empty states
- Loading states
- Error states
- Validation errors
- Form submission

---

## Phase 3: Quality Assurance

### Step 6: 5-Pillar Code Review
**Use `/review` skill**

**Reviews across:**
1. **ATO Compliance**: GST calculations, BAS labels, tax year logic
2. **Security**: Encryption, input validation, authentication
3. **Code Quality**: No `any`, tests exist, currency as cents
4. **Architecture**: Follows patterns, no circular deps, type generation
5. **Performance**: No N+1 queries, pagination, memoization

**Output:** Pass/Conditional/Fail with issue list

---

### Step 7: Fix Critical Issues
**If review = CONDITIONAL or FAIL:**
1. Address all P0 (critical) issues
2. Address all P1 (high priority) issues
3. Consider P2 (medium priority) issues
4. Re-run `/review` to verify fixes

**If review = PASS:**
→ Proceed to Phase 4

---

## Phase 4: Documentation & Commit

### Step 8: Update Documentation (if needed)
**Update files if applicable:**
- `docs/core/PATTERNS.md` - If new reusable pattern created
- `docs/core/TROUBLESHOOTING.md` - If workaround discovered
- `CLAUDE.md` - If new guardrail needed
- API docs - If new endpoint added

---

### Step 9: Git Commit
**Follow git workflow from CLAUDE.md:**

1. **Check status:**
   ```bash
   git status
   git diff
   ```

2. **Stage files:**
   ```bash
   git add [specific files]
   ```

3. **Create commit:**
   ```bash
   git commit -m "$(cat <<'EOF'
   [type]: [brief description]

   [Optional: longer explanation if complex change]

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

   **Commit types:**
   - `feat`: New feature
   - `fix`: Bug fix
   - `refactor`: Code restructure (no behavior change)
   - `test`: Add/update tests
   - `docs`: Documentation changes
   - `chore`: Build/config changes

4. **Verify commit:**
   ```bash
   git log -1
   git status
   ```

---

## Phase 5: Deployment Readiness

### Step 10: Pre-Deployment Checklist
**Verify:**
- [ ] All tests pass
- [ ] Linting passes
- [ ] Type generation run (if schema changed)
- [ ] Code review passed
- [ ] No P0/P1 issues
- [ ] Documentation updated
- [ ] Commit created

---

### Step 11: Deployment (if requested)
**Use `/deploy` skill for:**
- Development: Docker Compose
- Staging: Docker build + deploy
- Production: Proxmox LXC (with backup first!)

**Output:** Deployment steps + verification results

---

## Example Feature: "Add Business Name to Transaction List"

**Phase 1: Discovery**
```
User: "Add business name to transaction list"
Claude: Uses `/plan` to verify this is next task
Claude: Reads SCHEMA.md to understand Transaction entity
Claude: Asks: "Should business name be clickable to filter transactions?"
User: "Yes, filter by business"
```

**Phase 2: Implementation**
```
Claude: Uses `/tdd` skill
1. Write test: `TransactionList.test.tsx` - renders business name, clicking filters
2. Run test (fails)
3. Implement:
   - Update TransactionList component
   - Add filter state
   - Fetch business data (already in Transaction entity)
4. Run test (passes)
5. Lint (passes)
```

**Phase 3: QA**
```
Claude: Uses `/review` skill
- ATO Compliance: PASS (no tax logic involved)
- Security: PASS (data scoped to user)
- Code Quality: PASS (no `any`, tests exist)
- Architecture: PASS (follows Tanstack Query pattern)
- Performance: CONDITIONAL (should memoize filter function)

Claude: Adds useMemo to filter function
Claude: Re-runs `/review` → PASS
```

**Phase 4: Documentation & Commit**
```
Claude: No docs to update (simple UI change)
Claude: Creates commit:
  "feat(web): add business name to transaction list with filter

  - Display business name in transaction table
  - Add click handler to filter by business
  - Memoize filter function for performance

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Phase 5: Deployment**
```
User: "Deploy to staging"
Claude: Uses `/deploy` skill
- Builds Docker image
- Deploys to staging
- Runs health checks
- Verifies feature works
```

---

## Workflow Diagram

```
Start
  ↓
[/plan] → Task Selection
  ↓
Requirements Clear? → No → Ask User
  ↓ Yes
Complex Feature? → Yes → EnterPlanMode → User Approves
  ↓ No                      ↓
[/tdd] → Write Tests → Implement → Tests Pass
  ↓
[/review] → 5-Pillar Review
  ↓
Pass? → No → Fix Issues → Re-review
  ↓ Yes
Update Docs (if needed)
  ↓
Git Commit
  ↓
[/deploy] → Deploy (if requested)
  ↓
Done ✅
```

---

## Success Criteria

Feature is complete when:
- ✅ All tests pass (unit + integration)
- ✅ Linting passes (no warnings)
- ✅ Code review = PASS (all 5 pillars)
- ✅ No P0 or P1 issues
- ✅ Type generation run (if schema changed)
- ✅ Documentation updated (if needed)
- ✅ Git commit created
- ✅ Manual testing done (UI features)
- ✅ Deployment verified (if deployed)

---

## Anti-Patterns to Avoid

❌ **Skipping tests** → Always use TDD workflow
❌ **Implementing before understanding** → Read docs first
❌ **Gold-plating** → Only implement what's requested
❌ **Skipping review** → Use `/review` to catch issues
❌ **Using `any` types** → Use proper types
❌ **Forgetting type generation** → Run after schema changes
❌ **Committing without verification** → Verify tests + lint pass

---

## Guardrails Checklist

Before marking feature complete:
- [ ] No `any` types used
- [ ] No `console.log` in code
- [ ] Currency amounts as cents (integers)
- [ ] No US tax terms (IRS, sales tax, W-2, 1040)
- [ ] GST calculations correct (if applicable)
- [ ] BAS labels correct (if applicable)
- [ ] Encrypted fields handled properly (if applicable)
- [ ] Input validation added (if user input)
- [ ] Tests cover edge cases
- [ ] Test coverage meets targets
