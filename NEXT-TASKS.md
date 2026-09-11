# NEXT: Upcoming Tasks

**Status:** Maintenance remediation 2026-09 (M01-M07) executed and verified locally, including the disposable-DB phase (migration, generated types, integration suites 17/17 (7 guard + 10 DB), Playwright 62 passed + 1 skipped, both production builds green). Docker image/runtime validation executed (owner-run commands, executor-validated; two image defects found and fixed). Pending: remote CI verification only. Next release focus: authentication.

**Purpose:** Track upcoming tasks for the next release.

**Last Updated:** 2026-09-11 (maintenance remediation M01-M07; report: docs/audits/MAINTENANCE-REMEDIATION-2026-09.md)

---

## Maintenance First (2026-09 remediation)

Remediation of the September maintenance audit (M01-M07) is committed on branch `fix/maintenance-remediation-2026-09` and verified locally through the disposable-DB and Docker phases - see [MAINTENANCE-REMEDIATION-2026-09.md](docs/audits/MAINTENANCE-REMEDIATION-2026-09.md):

| Item | What it was | Outcome |
|------|-------------|---------|
| M01 | Multer 1.x/2.0.2 multipart DoS (High) | Fixed: multer 2.3.0 everywhere (direct dep + override), Nest 11.2.3, audit reduced 123->2 advisories (the remainder is a documented dev-only vitest moderate) |
| M02 | Cash-basis BAS used invoice date (High) | Fixed: `incomes.payment_date`, CASH attribution by receipt date, legacy unknowns reported explicitly (see [CASH-BASIS-DESIGN.md](docs/core/CASH-BASIS-DESIGN.md)); migration generated + up/down/reapplied on the disposable DB; DB-backed attribution regression passes |
| M03 | CI omitted lint/unit/build gates | Fixed: backend/frontend gate jobs + dedicated backend-integration job, real entrypoint checks (remote CI run itself unverified - not authorized from this task) |
| M04 | `dryRun` flag silently ignored (Medium) | Fixed: flag honoured at the HTTP boundary; dry runs persist nothing (`importJobId: null`) |
| M05 | Docker web build context `./web` (Medium) | Fixed + validated: images build and run (disposable containers); fixed `USER nginx` (could not bind port 80) and the IPv6 healthcheck probe; root nginx master with unprivileged workers, documented in the Dockerfile |
| M06 | Nullable response fields lacked `nullable: true` (Low) | Fixed: metadata + contract regression + shared types regenerated; web build green |
| M07 | Documentation drift | Fixed: ATO-LOGIC cash example, TROUBLESHOOTING dry-run entries, this file |

**Review status:** rounds 1-5 of independent review addressed (R01-R10, S01-S05, T01, U01); the DB-dependent phase has now been executed with real exit codes (remediation report section 4). Remaining: remote CI verification only (needs push authorization). The Docker validation phase is complete.

**Before merging:** the migration/types/build/integration blockers have cleared; run the reviewer checklist in the remediation report. Independent review: docs/audits/MAINTENANCE-INDEPENDENT-REVIEW-2026-09.md (verdict: changes required; R01-R10 tracked in the remediation report).

---

## Next Up: Authentication (from STATUS.md)

**Authentication (P2-4) + HTTPS-only** - the key remaining milestone and a hard prerequisite before ANY internet exposure. The app has no application-level auth; LAN-only is a trust boundary, not a security boundary. Scope: app-level auth + force HTTPS. Keep LAN-only until this lands.

---

## Optional: reconcile docs/DEPLOYMENT.md (Docker path)

The Docker Compose path got an M05 config fix and the image/runtime validation was executed during the remediation's Docker phase (disposable containers only; two image defects found and fixed). STATUS.md records that only the native Proxmox LXC path was ever deployed and verified in production terms - the Docker path remains a secondary, undeployed option worth reconciling in its documentation.

---

## Feature Backlog: Choose Your Path (after auth)

With v1.3.0 nearly complete, here are the recommended options for what to tackle next:

### Option A: Complete v1.3.0 (Recommended)
**Advanced Filtering** - Saved filters, multi-select, amount ranges | **6-8 hours** | MEDIUM

**Benefits:** Ships complete v1.3.0 release with all planned UX enhancements
**Current State:** Basic filtering exists (provider, category, date range)
**Additions:** Saved filters, multi-select dropdowns, amount min/max, quick filters

---

### Option B: Quick Wins (Audit P2 Items) DONE

~~High-value, low-effort improvements from audit recommendations.~~

| Task | Status | Commit | Actual Time |
|------|--------|--------|-------------|
| **P2-1: Rounding Standardization** | Done | `17aae96` | ~15 min |
| **P2-2: BAS G10/G11 Fields** | Done | `2b82b4e` | ~30 min |

**Total Effort:** 45 minutes (well under 3-5 hour estimate!)

**Completed:** 2026-02-16
**Impact:** Tax-conservative calculations, Full BAS support, MoneyService <-> SQL consistency

---

### Option C: High-Impact Features
Larger features that significantly extend functionality:

| Task | Effort | Priority | User Value |
|------|--------|----------|------------|
| **Dashboard Analytics** | 10-15 hours | MEDIUM | Insights & trends visualization |
| **P2-3: GST Treatment Model** | 4-6 hours | MEDIUM | Complex supply type support |
| **P2-4: Authentication** | 6-8 hours | top priority (see above) | Internet-facing deployment |

---

## Recommendation

**Suggested Next Task:** **Authentication** (see above), then Advanced Filtering (Option A).

---

## v1.3.0 Status

**Progress:** 3 of 4 complete (75%) + 2 bonus P2 items | **See:** [v1.3-CHANGELOG.md](docs/archive/v1.3-CHANGELOG.md)

| Task | Status |
|------|--------|
| Keyboard Shortcuts | Done |
| CSV Template Downloads | Done |
| Bulk Operations | Done |
| Cash vs Accrual BAS | Done (bonus) |
| P2-1: Rounding Standardization | Done (bonus) |
| P2-2: BAS G10/G11 Fields | Done (bonus) |
| **Advanced Filtering** | **Remaining** |

---

## Completed Releases

- **v1.3.0** (In Progress): UX Enhancements - See [v1.3-CHANGELOG.md](docs/archive/v1.3-CHANGELOG.md)
- **v1.2.0** (2026-02-15): Audit Remediation - See commit `9d88296`
- **v1.1.0** (2026-01-10): System Management - See [v1.1-CHANGELOG.md](docs/archive/v1.1-CHANGELOG.md)
- **v1.0.0**: MVP Release - See [v1.0-CHANGELOG.md](docs/archive/v1.0-CHANGELOG.md)

---

## Additional Resources

- **Future Enhancements:** [FUTURE-ENHANCEMENTS.md](docs/FUTURE-ENHANCEMENTS.md)
- **Audit Findings:** P2 items in FUTURE-ENHANCEMENTS.md
- **Archive:** [docs/archive/](docs/archive/) - Historical planning docs

---
