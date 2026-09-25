# Project Status & Next Steps

Single source of truth for any agent or human. Read this first.

**Updated:** 2026-09-25

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
  shared types; docs reconciled. Record: `docs/audits/MAINTENANCE-REMEDIATION-2026-09.md`
  (§8 maps every review finding, §9 lists the residual follow-ups).

**The homelab deployment runs `main` (`a15e5f4`) since 2026-09-25** — PRs #4–#7
are live, and the `AddIncomePaymentDate` migration has been applied. Both CTs were
backed up first (vzdump + a logical DB dump) and had their Debian packages updated
in the same window. Existing paid incomes now show as "Paid · no date" and stay
out of CASH-basis totals until a receipt date is entered per record.

## Next steps (priority order)
1. **Authentication (P2-4) + HTTPS-only** — the key remaining milestone, and a
   hard prerequisite before ANY internet exposure. The app is currently no-auth;
   anyone on the LAN can reach it. Scope: app-level auth + force HTTPS. Keep
   LAN-only until this lands.
2. **Enter receipt dates for existing paid incomes** — a manual, one-time data
   task in the app, needed before preparing the next CASH-basis BAS (Jul–Sep
   quarter). Until then those incomes are excluded from CASH totals.
3. **Remediation follow-ups** (non-blocking, from the report §9): LF-only line 13
   in `NEXT-TASKS.md`; compare the parsed date rather than the raw string in the
   future-date check (`incomes.service.ts`); apply the same future-date check to
   CSV receipt dates; UI confirmation before clearing a captured receipt date;
   vitest 4 upgrade (clears the last audit entry); drop the multer override once
   `@nestjs/platform-express` declares ≥ 2.3.0.
   Deploy scripts, found during the 2026-09-25 rollout: `setup-db-lxc.sh` did not
   leave the daily `pg_dump` cron entry at the original deploy (cause not
   identified; the entry was added by hand); `update-app.sh` runs plain
   `pnpm install` rather than `--frozen-lockfile`, prompts interactively, and is
   overwritten by its own `git pull` while running.
4. **Optional: reconcile `docs/DEPLOYMENT.md`** (the Docker Compose path) — still
   references Ubuntu 22.04. The images now build and run (validated in
   disposable containers during PR #6), but the Docker path has never been
   deployed; only worth reconciling if you intend to support it.

## Operating the deployment
- Update app to latest: back up both CTs first, then on the app CT stop
  `easytax-api`, fast-forward to `origin/main`, `pnpm install --frozen-lockfile`,
  build backend and web, and start the service; migrations auto-apply on start.
  `scripts/update-app.sh` does the same interactively (see its caveats above).
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
  `test`/`audit` token and wipe all data. Runbook: remediation report §9.
- CI (PR to `main`) runs all of the above plus Playwright; it is the acceptance gate.
- Web: `pnpm --filter web lint` + `pnpm --filter web exec vitest run` + `pnpm --filter web build`
- Shell scripts: `bash -n scripts/<name>.sh` (and keep them LF per `.gitattributes`)
