# Project Status & Next Steps

Current deployed state — read this first. The prioritised backlog is `NEXT-TASKS.md`.

**Updated:** 2026-09-27

> Note: this file is in a public repo. Private homelab specifics (CT IDs, IPs,
> hostnames, the internal service domain, secret locations) are intentionally
> kept out — they live in the gitignored homelab inventory
> (`personal-ai-assistant/homelab/easytax.local.md`, with host context in
> `proxmox.local.md` and `pihole-bobelia.local.md`).

## Current state
**Deployed and live on the Proxmox homelab** (native multi-LXC, no Docker),
reachable **LAN-only** over HTTPS behind the existing Traefik reverse proxy with
a trusted Let's Encrypt cert. Two containers: a PostgreSQL 15 DB CT and an app
CT (NestJS API + nginx-served frontend). Migrations and seed data (categories,
providers) applied automatically on first boot; verified API↔DB connectivity and
frontend serving end to end. Both CTs auto-start on host reboot and are covered
by the weekly vzdump backup (plus a one-off backup taken at deploy). The app
**has no application-level auth** — LAN-only is a trust boundary, not a security
boundary.

Recent merges to `main`:
- PR #3 (`1ae0351`) — deploy-readiness (build, migrations, toolchain pinning)
- PR #4 — fix LXC setup scripts so the documented path runs on Debian 12
  (CRLF→LF + `.gitattributes`, install `sudo`, remove duplicate nginx `gzip`;
  plus SQL single-quote escaping + fixed-string `pg_hba` IP match)
- PR #5 — reconcile `docs/DEPLOYMENT-PROXMOX-LXC.md` with the real Debian-12
  deploy (template, PVE version, CT-ID caveats, nginx gzip, minimal-template note)
- PR #6 (`a6b777d`, 2026-09-11) — maintenance remediation M01–M07, 9 atomic
  commits, CI green on all four jobs: multer 2.3.0 + dependency chain (audit
  123→2, remainder dev-only vitest moderate); **cash-basis BAS now attributes
  income by receipt date** (`incomes.payment_date`, additive migration
  `1789113727162-AddIncomePaymentDate`, mark-paid requires a date, legacy
  paid-without-date rows are excluded from CASH totals and reported); CI gates
  (lint/unit/build, guarded backend-integration job, Playwright); CSV `dryRun`
  honoured with zero writes; Docker images rebuilt on the repo-root context and
  validated in disposable containers; nullable response contracts + regenerated
  shared types; docs reconciled. Record: `docs/archive/maintenance-2026-09/MAINTENANCE-REMEDIATION-2026-09.md`
  (§8 maps every review finding, §9 lists the residual follow-ups).

**The homelab deployment runs `main` (`a15e5f4`) since 2026-09-25** — PRs #4–#7
are live, and the `AddIncomePaymentDate` migration has been applied. Both CTs were
backed up first (vzdump + a logical DB dump) and had their Debian packages updated
in the same window. Existing paid incomes now show as "Paid · no date" and stay
out of CASH-basis totals until a receipt date is entered per record.

## Next steps
The prioritised backlog is `NEXT-TASKS.md`. Headlines:
1. **P0 — live deployment safety:** verify the live frontend against the
   `VITE_API_URL=/api` defect before the next `update-app.sh` run, then fix
   API-URL resolution everywhere (audit findings C01/I05/N05).
2. **P0 — stop financial data corruption:** income-edit GST, CSV import
   parsing/duplicates/rollback, recurring generation, undo and CSV export
   (2026-09-26 audits in `docs/audits/`).
3. **P1 — tax model and authentication:** GST registration profile, FY report
   rebuild, BAS labelling, PSI; app-level auth + HTTPS-only before ANY
   internet exposure. The app is currently no-auth — keep it LAN-only.
4. **Owner data task:** enter receipt dates for existing paid incomes before
   the next CASH-basis BAS (they are excluded from CASH totals until then).

## Operating the deployment
- Update app to latest: back up both CTs first, then on the app CT stop
  `easytax-api`, fast-forward to `origin/main`, `pnpm install --frozen-lockfile`,
  build backend and web, and start the service; migrations auto-apply on start.
  `scripts/update-app.sh` does the same interactively (see its caveats in `NEXT-TASKS.md`).
  The exact procedure used is in the gitignored homelab inventory.
- Backups: weekly vzdump covers both CTs; the DB CT also runs a daily `pg_dump`
  (30-day retention, kept on the CT itself). That cron entry has only existed
  since 2026-09-25 — before then the weekly vzdump was the only DB backup.
- The encryption key (decrypts stored PII) is backed up off-box — must never
  change. Connection/host specifics: see the gitignored homelab inventory.

## Verification gates (run before committing)
- Backend: `pnpm exec eslint "src/**/*.ts" "test/**/*.ts"` + `pnpm run test` + `pnpm run build`
  (note: `pnpm run lint` uses `--fix` and mutates files)
- Backend integration (`pnpm run test:e2e`): needs a **disposable** Postgres and
  explicit `DB_*` + `NODE_ENV=test`; the suites refuse any DB name without a
  `test`/`audit` token and wipe all data. Runbook: `docs/core/TESTING.md`.
- CI (PR to `main`) runs all of the above plus Playwright; it is the acceptance gate.
- Web: `pnpm --filter web lint` + `pnpm --filter web exec vitest run` + `pnpm --filter web build`
- Shell scripts: `bash -n scripts/<name>.sh` (and keep them LF per `.gitattributes`)
