# AI Instruction Migration Summary

**Date**: 2026-01-11
**Version**: Instruction Layering v2.0
**Strategy**: "Harvest & Prune" Documentation Optimization

---

## What Changed

### Files Deleted ❌
- **`AGENTS.md`** (374 lines) - Content distributed to `PATTERNS.md` and `copilot-instructions.md`
- **`WARP.md`** (89 lines) - 100% duplicate of `CLAUDE.md`, no unique value

### Files Updated ✅
- **`docs/core/PATTERNS.md`** - Reorganized with Search Anchor format (`# [Pattern Name] Pattern`)
- **`copilot-instructions.md`** - Streamlined from 226 lines → 170 lines (~25% reduction)
- **`CLAUDE.md`** - Updated from 89 lines → 96 lines (more actionable with CLI tables and example prompts)

---

## New Structure: "Rule-Reference Pattern"

### Philosophy
**Before**: Repeat everything in every file (high token usage, instruction drift risk)
**After**: Contextual layering (rules are cheap, implementations are expensive)

### Instruction Hierarchy

```
copilot-instructions.md  →  "What rules always apply + where to look"
CLAUDE.md                →  "How to use the CLI workflow"
docs/core/PATTERNS.md    →  "Code examples (load on-demand via Search Anchors)"
```

---

## Key Improvements

### 1. **Search Anchor Standard** (Refinement 1)
All patterns in `PATTERNS.md` now use standardized headers:

```markdown
### [Currency & Math] Pattern
### [Data Fetching] Pattern
### [Searchable Dropdown] Pattern
```

**How to use**: AI agents can grep or search to jump directly to sections:
- `grep "# \[Currency"` → Jump to Currency & Math pattern
- Search for `#currency-math` → Jump to anchor

**Why**: Enables "random-access" code library instead of linear scanning.

---

### 2. **Type Integrity Trigger** (Refinement 2)
Added to `copilot-instructions.md` (line 21):

> "If `SCHEMA.md` or backend entity changes, **MUST** run `pnpm run generate:types` before frontend work"

**Why**: Prevents type drift between backend and frontend. Creates a dependency rule that AI agents must follow.

---

### 3. **Technical Map** (New)
Added to `copilot-instructions.md` as a table:

| When Working On | Check This File First | Why |
|----------------|----------------------|-----|
| Tax/GST/BAS calculations | `docs/core/ATO-LOGIC.md` | Prevents US tax hallucinations |
| Code patterns & examples | `docs/core/PATTERNS.md` | Working code templates (use Search Anchors) |
| System design & tech stack | `docs/core/ARCHITECTURE.md` | Understand module relationships |

**Why**: Explicit pointers reduce token usage. AI follows directions instead of scanning all files.

---

## Token Savings Analysis

### Before (Total: ~768 lines)
- `AGENTS.md`: 374 lines
- `WARP.md`: 89 lines
- `copilot-instructions.md`: 226 lines
- `CLAUDE.md`: 89 lines

### After (Total: ~411 lines)
- `copilot-instructions.md`: 170 lines
- `CLAUDE.md`: 96 lines
- `docs/core/PATTERNS.md`: ~855 lines (but loaded on-demand)

**Net Savings**: ~48% reduction in always-loaded agent instructions

---

## Content Distribution

### Where Did AGENTS.md Content Go?

| Original Section | New Location |
|-----------------|-------------|
| Currency & Math snippets | `docs/core/PATTERNS.md#currency-math` |
| Entity Structure examples | `docs/core/PATTERNS.md#entity-structure` |
| Data Fetching (TanStack Query) | `docs/core/PATTERNS.md#data-fetching` |
| Form Validation (Zod + RHF) | `docs/core/PATTERNS.md#form-validation` |
| Multipart Boolean workaround | `docs/core/PATTERNS.md#multipart-boolean` |
| Testing guidelines | `docs/core/PATTERNS.md#testing` |
| Core philosophy | `copilot-instructions.md` (Core Principles section) |

### Why WARP.md Was Deleted
- 100% identical to `CLAUDE.md`
- No Warp-specific features documented
- Wasted tokens with no unique value

---

## Search Anchor Examples

When you see references like this in agent instructions:

> "Check `PATTERNS.md#currency-math` for implementation"

**AI agents should**:
1. Use grep: `grep "# \[Currency" docs/core/PATTERNS.md`
2. Or use markdown anchor: Navigate to `#currency-math` section
3. Read **only** that section, not the entire file

**Developers should**:
1. Use Ctrl+F (Cmd+F on Mac) to search for `[Currency`
2. Or navigate directly to the anchor in their IDE/browser

---

## Migration Checklist

- [x] Extract code snippets from `AGENTS.md` to `PATTERNS.md`
- [x] Add Search Anchor format to all patterns
- [x] Update `copilot-instructions.md` with Type Integrity Trigger
- [x] Update `CLAUDE.md` with CLI commands and Documentation Triggers
- [x] Delete `AGENTS.md` and `WARP.md`
- [x] Verify no broken references in remaining files

---

## Context Reset Prompt (For Next Session)

**Use this prompt at the start of your next AI session to force re-indexing:**

> "I have reorganized the AI instruction files. Please read `copilot-instructions.md` to see the new Tiered Documentation structure and Rule-Reference Pattern. The files `AGENTS.md` and `WARP.md` have been deleted and their content has been distributed to `PATTERNS.md` (for code examples) and `copilot-instructions.md` (for rules)."

**Why**: Clears the AI's "context ghost" and forces it to re-read the new structure.

---

## Additional Refinements Applied

### Standardized Headers
All patterns follow the format:
```markdown
### [Pattern Name] Pattern

**Rule**: The principle to follow

**Code**: Working implementation example

**Reference**: Links to related documentation
```

### Cross-References
Patterns reference each other using Search Anchors:
- `[CSV Import] Pattern` references `[Multipart Boolean] Pattern`
- `[Type Safety] Pattern` includes the Type Integrity Trigger

### Real-World Usage Citations
Each pattern includes references to actual files:
- `web/src/features/expenses/components/provider-select.tsx`
- `src/modules/csv-import/csv-import.controller.ts` (line numbers)

**Why**: Provides "proof of implementation" and helps AI understand real-world context.

---

## Rollback Plan (If Needed)

If you need to revert these changes:

1. **Restore from git**:
   ```bash
   git checkout HEAD~1 -- AGENTS.md WARP.md CLAUDE.md .github/copilot-instructions.md docs/core/PATTERNS.md
   ```

2. **Or retrieve from git history**:
   ```bash
   git log --all --full-history -- AGENTS.md WARP.md
   git show <commit-hash>:AGENTS.md > AGENTS.md
   git show <commit-hash>:WARP.md > WARP.md
   ```

---

## Future Enhancements

### Phase 2 (Optional)
- Add version numbers to instructions (e.g., `<!-- v2.0 - Instruction Layering -->`)
- Create a `docs/core/AI-CHANGELOG.md` to track instruction changes over time
- Add automated tests to verify no broken Search Anchor references

### Phase 3 (Advanced)
- Implement "Instruction Linting" to ensure Search Anchors are valid
- Create a documentation index generator that lists all available Search Anchors
- Add telemetry to track which patterns AI agents access most frequently

---

## Questions & Answers

### Q: Why not keep WARP.md for Warp-specific features?
**A**: WARP.md was 100% identical to CLAUDE.md. Unless Warp has unique capabilities (like special terminal integration or AI commands), there's no value in maintaining a duplicate file.

### Q: What if I need to add a new pattern?
**A**: Add it to `docs/core/PATTERNS.md` using the Search Anchor format:
```markdown
### [New Pattern Name] Pattern

**Rule**: ...
**Code**: ...
**Reference**: ...
```

Then reference it in `copilot-instructions.md` or `CLAUDE.md` using the anchor:
> "See `PATTERNS.md#new-pattern-name` for implementation"

### Q: How do I know if a Search Anchor is valid?
**A**: Use grep to verify:
```bash
grep -n "### \[Pattern Name\]" docs/core/PATTERNS.md
```

If it returns a line number, the anchor exists.

---

## Success Metrics

**Token Efficiency**: ~48% reduction in always-loaded instructions
**Mental Model**: Clear hierarchy (rules → references → implementations)
**Maintainability**: Single source of truth for each concept
**AI Performance**: Faster context loading, more precise pattern matching

---

**Status**: ✅ Migration Complete
**Next Steps**: Use the Context Reset Prompt in your next AI session

---

**Migration to Cortex TMS 2.6.0-beta.1**: 2026-01-17
See: MIGRATION-PLAN-cortex-tms.md

