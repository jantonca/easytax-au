# /plan - Task Discovery & Prioritization

## Purpose
Analyze `NEXT-TASKS.md` and `FUTURE-ENHANCEMENTS.md` to recommend the next highest-priority task with justification.

## Context
User arguments: $ARGUMENTS

## Workflow

### 1. Read Task Files
- Read `NEXT-TASKS.md` (current sprint/version tasks)
- Read `FUTURE-ENHANCEMENTS.md` (backlog ideas)
- Read `docs/archive/CHANGELOG.md` (understand what's shipped)

### 2. Analyze Current State
- Check git status for work-in-progress
- Identify which version milestone is active
- Review task dependencies (blocked vs. ready)

### 3. Apply Priority Framework
**Rank tasks by:**
1. **Severity**: P0 (blocker) > P1 (critical) > P2 (important) > P3 (nice-to-have)
2. **Readiness**: No blockers > Has dependencies
3. **Impact**: Compliance/Security > Core Features > UX > Performance
4. **Complexity**: High-value, low-effort tasks first (quick wins)

### 4. Recommend & Justify
Output format:
```markdown
## Recommended Task
**[Task Title from NEXT-TASKS.md]**

**Priority**: [P0/P1/P2/P3]
**Estimated Complexity**: [Simple/Moderate/Complex]

### Justification
- Why this task now? [Strategic reasoning]
- What's the impact? [User/business value]
- Dependencies resolved? [Yes/No + details]

### Implementation Approach
[High-level steps, reference relevant docs]

### Next Steps
Use `/tdd` to implement with test-first workflow
```

## Guardrails
- **Never** recommend tasks with unresolved blockers
- **Prefer** compliance/security tasks over features when both are P1
- **Flag** if NEXT-TASKS.md is empty or outdated
- **Check** for P0/P1 items in recent audit reports (`docs/reports/audit/`)

## Australian Domain Context
- Tax year = July 1 - June 30
- BAS reporting = Quarterly (Q1=Jul-Sep, Q2=Oct-Dec, Q3=Jan-Mar, Q4=Apr-Jun)
- GST = 10% (total/11 for GST-inclusive)
- Forbidden terms: IRS, sales tax, W-2, 1040, April 15
