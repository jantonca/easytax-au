# NEXT: Upcoming Tasks

**Status:** v1.3.0 nearly complete (3/4 features done). Only Advanced Filtering remains.

**Purpose:** Track upcoming tasks for the next release.

**Last Updated:** 2026-02-16 (Archived completed v1.3.0 tasks)

---

## 🎯 Next Up: Choose Your Path

With v1.3.0 nearly complete, here are the recommended options for what to tackle next:

### Option A: Complete v1.3.0 (Recommended)
**Advanced Filtering** - Saved filters, multi-select, amount ranges | **6-8 hours** | 🟡 MEDIUM

**Benefits:** Ships complete v1.3.0 release with all planned UX enhancements
**Current State:** Basic filtering exists (provider, category, date range)
**Additions:** Saved filters, multi-select dropdowns, amount min/max, quick filters

---

### Option B: Quick Wins (Audit P2 Items)
High-value, low-effort improvements from audit recommendations:

| Task | Effort | Priority | Impact |
|------|--------|----------|--------|
| **P2-1: Rounding Standardization** | 1-2 hours | 🟡 MEDIUM | Consistency & tax-conservatism |
| **P2-2: BAS G10/G11 Fields** | 2-3 hours | 🟡 MEDIUM | Full BAS support (vs Simpler BAS) |

**Benefits:** Small, focused improvements with immediate value
**Details:** See [FUTURE-ENHANCEMENTS.md](docs/FUTURE-ENHANCEMENTS.md#audit-identified-enhancements-p2)

---

### Option C: High-Impact Features
Larger features that significantly extend functionality:

| Task | Effort | Priority | User Value |
|------|--------|----------|------------|
| **Dashboard Analytics** | 10-15 hours | 🟡 MEDIUM | Insights & trends visualization |
| **P2-3: GST Treatment Model** | 4-6 hours | 🟡 MEDIUM | Complex supply type support |
| **P2-4: Authentication** | 6-8 hours | 🟢 LOW* | Internet-facing deployment |

*P2-4 Priority: LOW for LAN-only, HIGH if internet-facing

---

## 📊 Recommendation

**Suggested Next Task:** **Advanced Filtering** (Option A)

**Rationale:**
1. Completes v1.3.0 for a clean release
2. Natural progression from bulk operations (filter → bulk operate)
3. High user value for power users
4. Moderate effort (6-8 hours)
5. Builds on existing filter infrastructure

**Alternative:** If you prefer quick wins, do **P2-1** (1-2 hours) + **P2-2** (2-3 hours) = 3-5 hours total for two solid improvements.

---

## 📋 v1.3.0 Status

**Progress:** 3 of 4 complete (75%) | **See:** [v1.3-CHANGELOG.md](docs/archive/v1.3-CHANGELOG.md)

| Task | Status |
|------|--------|
| Keyboard Shortcuts | ✅ Done |
| CSV Template Downloads | ✅ Done |
| Bulk Operations | ✅ Done |
| Cash vs Accrual BAS | ✅ Done (bonus) |
| **Advanced Filtering** | ⬜ **Remaining** |

---

## 🗂 Completed Releases

- **v1.3.0** (In Progress): UX Enhancements - See [v1.3-CHANGELOG.md](docs/archive/v1.3-CHANGELOG.md)
- **v1.2.0** (2026-02-15): Audit Remediation - See commit `9d88296`
- **v1.1.0** (2026-01-10): System Management - See [v1.1-CHANGELOG.md](docs/archive/v1.1-CHANGELOG.md)
- **v1.0.0**: MVP Release - See [v1.0-CHANGELOG.md](docs/archive/v1.0-CHANGELOG.md)

---

## 📚 Additional Resources

- **Future Enhancements:** [FUTURE-ENHANCEMENTS.md](docs/FUTURE-ENHANCEMENTS.md)
- **Audit Findings:** P2 items in FUTURE-ENHANCEMENTS.md
- **Archive:** [docs/archive/](docs/archive/) - Historical planning docs

---
