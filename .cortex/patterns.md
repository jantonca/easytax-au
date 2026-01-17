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
