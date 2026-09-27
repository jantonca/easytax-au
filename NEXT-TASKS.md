# NEXT: Active Backlog

**Purpose:** the single prioritised list of open work. Current deployed state
lives in `STATUS.md`; this file says what to do next.

**Last Updated:** 2026-09-27

**Source:** the 2026-09-26 audits in `docs/audits/`:

- `AUDIT-CODEX-2026-09-26.md`, which defines T01–T08, I01–I06 and S01;
- `AUDIT-OPENCODE-REVIEW-2026-09-26.md`, which defines C01–C06 and the consolidated plan;
- `AUDIT-EVALUATION-2026-09-27.md`, which defines N01–N07 and the plan amendments.

Finding IDs below refer to those reports; read the report before starting an
item. Every code fix follows the TDD rule in `AGENTS.md`: write the failing
regression test first. Schema changes and historical-data corrections need a
verified DB backup and a reviewed migration (`/schema-change`).

---

## P0: Live deployment safety

1. **Verify the live LXC frontend (C01)** before the next `update-app.sh` run.
   The deploy writes `VITE_API_URL=/api`, and the main API client throws on a
   relative base. Check the host's `web/.env` and the browser's API calls, and
   record the result in the homelab inventory.
2. **One API-URL helper (I05, N05).** Replace all nine `VITE_API_URL` read
   sites: three in `web/src/lib/api-client.ts`, five import hooks, and
   `bas-report-page.tsx`. Test both a relative `/api` base and an absolute
   base with a path suffix.

## P0: Stop financial data corruption

3. **T03:** keep the stored GST when editing an income. Recalculate only when
   the subtotal is intentionally changed.
4. **T04:** GST on import has three states: missing → calculate; explicit 0 →
   keep 0; invalid → fail the row.
5. **T05 + N03:** strict business-use % parsing. Reject non-numeric and
   out-of-range values (no `NaN`, no silent clamp to 100), and define how
   `%` notation and fractional notation are read.
6. **T06 + N02:** return a result for every input row, so parser drops become
   row failures. Also:
   - strict calendar dates (reuse `parseStrictDateOnly`);
   - no substituting today's date or zero;
   - explicit summary-row handling, not a "total" substring match;
   - income amounts parsed via Decimal/`MoneyService`;
   - an explicit refund/negative-row policy;
   - an unmatched category becomes "needs review", never `categories[0]`.
7. **T07 + N04:** in-batch duplicate detection with one batched DB lookup.
   Flag same-key rows for review rather than dropping them: the
   (date, amount, provider) key also matches genuine identical purchases.
8. **N01:** link imported incomes to their import job (migration adds
   `incomes.import_job_id`), and make rollback cover incomes. Until then,
   rollback must refuse income jobs instead of reporting success.
9. **I01 (Medium):** generate a recurring expense and advance its schedule in
   one transaction, with a unique occurrence identity (migration).
10. **I02 + N07:** make undo restore `paymentDate` for paid incomes, and
    `importJobId`/`currency` for expenses.
11. **I03 + S01:** export machine-readable, escaped amounts, include
    `paymentDate`, and neutralise spreadsheet formula prefixes.
12. **After the fixes above,** identify records damaged by these paths. Never
    auto-invent replacement dates, GST or percentages.

## P1: Tax model

13. **Business tax profile (T02).** It covers:
    - GST registration with effective dates;
    - separate GST and income-tax accounting bases;
    - Simpler vs full BAS;
    - small-business entity (SBE) and instant asset write-off (IAWO) eligibility;
    - the GST treatment model (was FUTURE-ENHANCEMENTS P2-3).

    Apply it consistently to entry, imports and reports.
14. **FY report rebuild (T01).** Report assessable income ex-GST, minus
    deductible expenses (apportioned by business use, `isDeductible`
    enforced). Separate capital purchases into an asset register ($20k IAWO /
    small business pool), and surface unresolved adjustments.
15. **T08:** separate purchase classification (G10/G11) from the GST-credit
    label. `docs/core/ATO-LOGIC.md` already maps operating categories to
    G11. Ship this as a data migration, because the seeder never re-runs.
16. **C03:** declare the reporting method on the BAS output and PDF.
17. **PSI:** implement the per-contract test, the 80% rule and the PSB tests
    as a guided workflow, or label `isPsiEligible` as advisory.
18. **C06:** correct `docs/core/ATO-LOGIC.md` and the seeder descriptions:
    personal-use GST credits, $20k IAWO, the conditions on the $1,000 G10/G11
    concession, and the PSI rules.
19. **Substantiation:** track whether a tax invoice is held for purchases over
    $82.50, with a 5-year retention view built on `fileRef`.

## P1: Security

20. **Authentication + HTTPS-only.** This is a hard prerequisite for any
    internet exposure; keep the app LAN-only until it lands. Treat
    `/backup/export` as the highest-value endpoint (C02): amounts and dates in
    a dump are plaintext.
21. **C04:** set upload size limits on all CSV `FileInterceptor` endpoints.

## P1: Before the AI statement reconciliation plan

22. **N06:** fix or remove the unmounted `ImportHistory` component. It calls
    `/import/jobs`, but the backend route is `/import-jobs`.
23. **Then** `docs/plans/AI-STATEMENT-RECONCILIATION.md`, which depends on
    item 8 (rollback) and the P0 import fixes.

## P2: Performance and UX correctness

24. Add server-side pagination and filtering for expenses and incomes, a
    limited recent-expenses endpoint, and batched import lookups.
25. **I04:** invalidate the `bas`, `bas-report`, `fy-report` and `dashboard`
    query keys from every financial mutation.
26. **C05:** apply the accrual "earlier of invoice or payment" rule once
    partial payments exist.

---

## Operations and housekeeping

- **Enter receipt dates for existing paid incomes.** This is a manual,
  one-time task in the app, needed before the next CASH-basis BAS. Until it's
  done, those incomes are excluded from CASH totals.
- **Deploy scripts** (found in the 2026-09-25 rollout):
  - `setup-db-lxc.sh` did not leave the daily `pg_dump` cron entry (cause not
    identified; the entry was added by hand);
  - `update-app.sh` runs plain `pnpm install` rather than `--frozen-lockfile`,
    prompts interactively, and is overwritten by its own `git pull` while
    running.
- **I06:** the Docker `/backup/export` has no Docker CLI or socket in the API
  image; use a PostgreSQL client against the DB service instead. The Docker
  deployment path has never been deployed (see `docs/DEPLOYMENT-DOCKER.md`).
- **Remediation follow-ups (2026-09):**
  - compare parsed dates, not raw strings, in the income future-date check;
  - apply the same check to CSV receipt dates;
  - add a UI confirmation before clearing a captured receipt date;
  - upgrade to vitest 4 (clears the last audit advisory);
  - drop the multer override once `@nestjs/platform-express` requires ≥ 2.3.0.

## Feature backlog (after P0/P1)

- **Advanced Filtering:** the last open v1.3.0 item, covering saved filters,
  multi-select and amount ranges.
- Everything else is in `docs/FUTURE-ENHANCEMENTS.md`.

## Release history

- **v1.3.0** (in progress): see [v1.3-CHANGELOG.md](docs/archive/v1.3-CHANGELOG.md)
- **v1.2.0** (2026-02-15): audit remediation, commit `9d88296`
- **v1.1.0** (2026-01-10): see [v1.1-CHANGELOG.md](docs/archive/v1.1-CHANGELOG.md)
- **v1.0.0**: see [v1.0-CHANGELOG.md](docs/archive/v1.0-CHANGELOG.md)
- **2026-09 maintenance (M01–M07, PR #6):** see
  `docs/archive/maintenance-2026-09/MAINTENANCE-REMEDIATION-2026-09.md`
