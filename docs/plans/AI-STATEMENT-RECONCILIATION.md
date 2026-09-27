# Plan: AI Statement Reconciliation (MCP)

**Status:** Proposed (2026-09-26) · not started
**Priority:** P2 feature, gated by P1 import fixes (Phase 0)
**Complexity:** Complex overall; each phase is Moderate and ships on its own

## Goal

Let a user-chosen agent (Claude Code, OpenCode, Codex — any model, run on
the user's own subscriptions) reconcile a CommBank or Amex statement
against EasyTax-AU:

1. read the statement CSV,
2. drop lines already recorded,
3. classify each remaining line business / personal / unsure,
4. match business lines to invoices in a local inbox folder and read GST
   and ABN from the invoice,
5. report: ready to add · business but invoice missing · already recorded ·
   personal · needs a decision,
6. create the approved expenses as one import job (revertible via the
   existing `POST /import-jobs/:id/rollback`; rollback covers expenses
   only — income imports are not linked to their job (N01), and undoing a
   deleted expense drops its `importJobId` (N07)),
7. remember the user's decisions as per-merchant rules.

## Non-goals

- The app never calls an LLM, stores an LLM key, or depends on a provider.
- No PDF bank statements (CSV only — exact amounts, no OCR error).
- No automatic saving: every write needs an explicit approval in the chat.
- No internet exposure: the MCP server runs on the user's machine against
  the LAN instance. Authentication (P2-4) stays the separate top priority;
  Phase 1 must add a token header path once auth lands.

## Why an MCP server

- Provider-agnostic: any MCP-capable harness can drive it.
- Subscription-compatible: the model runs inside the vendor's own client
  (Claude Pro/Max OAuth may only be used in Claude Code / claude.ai; OpenCode
  Go is scoped to coding agents), so the app itself never needs API access.
- Narrow, typed tools instead of letting an agent send arbitrary HTTP.
- One measurement point: every proposal passes through the server, so
  results can be compared across harnesses and models (Phase 3).

---

## Phase 0 — Fix the importer first (prerequisite, P1)

The reconciliation reads statements through the existing CSV code. The
2026-09-26 audit (`docs/audits/AUDIT-CODEX-2026-09-26.md`, confirmed in
`AUDIT-OPENCODE-REVIEW-2026-09-26.md`; see also
`AUDIT-EVALUATION-2026-09-27.md` for N01–N07) found that code loses and alters data:

| Audit | Problem | Impact on reconciliation |
|---|---|---|
| T06 | Rows silently dropped (vendor names containing "total", e.g. "Total Tools"; rows missing fields; negative amounts = refunds); impossible dates normalised | Agent never sees some statement lines; the report would look complete when it is not |
| T07 + N04 | Duplicates within one file not detected; the (date, amount, provider) key also matches genuine identical purchases | Two identical charges in one statement both pass as new — the fix must flag them for a decision, not drop them |
| N02 | Unmatched category falls back to `categories[0]` silently | Approved lines could be filed under an arbitrary category |
| T04 | Explicit 0 GST replaced by 1/11 | GST-free purchases get invented credits |
| T05 | "1%" business use parses as 100% | Only if biz% ever comes from a CSV; fix alongside |

**Also verify the bank mappings** (`CSV_COLUMN_MAPPINGS` in
`src/modules/csv-import/csv-import.types.ts`). The current `commbank`
mapping expects headers `Date, Description, Debit`. As far as I know, a
NetBank CSV export has **no header row** and a single signed amount column
(date, amount, description, balance); the Amex AU export has headers and
positive charges / negative credits. **Unverified** — confirm with one
redacted real export of each before changing the mappings.

Deliverables:
- Every input row produces a result (success / failed / skipped with reason).
- Strict date and amount parsing; refunds kept as their own row type.
- Tri-state GST (missing → calculate; explicit 0 → keep; invalid → fail).
- In-batch duplicate detection.
- Fixture tests using redacted CommBank and Amex samples.
- Workflow: `/tdd`. No schema change.

## Phase 1 — `mcp/` package: the reconciliation tools

A new pnpm workspace package `mcp/` (add to `pnpm-workspace.yaml`),
TypeScript, stdio transport, using the official MCP TypeScript SDK (pin the
version current at implementation time). It talks to the existing REST API
over the LAN — it does **not** touch the database — and imports types from
`@shared/types`.

Configuration (env or a small config file, never committed): API base URL,
inbox folder path, proposals log path.

### Backend addition (small)

`POST /csv-import/statement/parse` — parse a CommBank/Amex CSV into
normalised lines **without** provider/category matching or saving:
`{ rowNumber, date, description, amountCents, direction: debit|credit,
status: ok|failed, error? }`. The existing preview can't be reused as-is
because it errors every row whose merchant is not yet a known provider,
which is exactly the case reconciliation must handle.

### Tools

| Tool | Does | Backed by |
|---|---|---|
| `parse_statement(path, source)` | Normalised statement lines | new parse endpoint |
| `list_expenses(from, to)` | Recorded expenses for dedupe | `GET /expenses?startDate&endDate` |
| `list_categories`, `list_providers` | Valid targets (with `isInternational`, `defaultCategoryId`, `abnArn`) | existing endpoints |
| `match_provider(description)` | Fuzzy supplier match | expose `ProviderMatcherService` via a small endpoint |
| `get_rules()` | Saved per-merchant decisions | Phase 2 (returns empty until then) |
| `last_expense_for_provider(id)` | Biz% / category from history | `GET /expenses?providerId` |
| `list_inbox()` | Invoice files in the configured folder | local fs |
| `read_document(file)` | PDF → text (server-side, identical for every harness); images returned as image content for vision models | local PDF text extraction library |
| `propose_expenses(items)` | Validates proposals against the rules below; appends them to the proposals log; saves nothing | local + read-only API calls |
| `create_expenses(proposalId)` | Creates an approved proposal set as **one import job** | import-jobs + expenses API |

### Rules enforced in code, not in the prompt

- `read_document` / `list_inbox` resolve paths with `realpath` and refuse
  anything outside the inbox folder (no traversal, no symlink escape).
- `propose_expenses` rejects: GST ≠ 0 for international providers; GST >
  total/11 (rounded per `MoneyService`); purchases over **$82.50 incl. GST**
  claiming GST with no invoice attached (ATO tax-invoice threshold); unknown
  category or provider ids; dates outside the statement range; a line
  proposed twice.
- `create_expenses` accepts only a proposal id previously returned by
  `propose_expenses`, so the harness shows the user a separate tool call to
  approve. Batches go in as an import job so a bad batch is one rollback.
- Money stays integer cents end to end.

### Agent instructions

`mcp/RECONCILE.md` — one prompt shared by every harness: the workflow
above, the report format, "ask when unsure", "never call `create_expenses`
without the user's explicit approval". Harness-specific setup snippets
(Claude Code `.mcp.json`, OpenCode config, Codex config) in `mcp/README.md`
— verify each harness's current MCP config format at implementation time.

### Tests

Unit tests per tool with a mocked API client; path-guard tests
(traversal, symlink); proposal-validation tests for every rule above.

## Phase 2 — Per-merchant rules (schema change)

Personal merchants aren't providers, so rules get their own table rather
than more columns on `providers`:

`merchant_rules`: `id`, `pattern` (normalised statement description),
`decision` (`business | personal | ask`), `provider_id` (nullable FK),
`biz_percent` (nullable int 0–100), `category_id` (nullable FK),
timestamps.

- Workflow: `/schema-change` — entity, `pnpm run migration:generate`,
  review SQL, regenerate `shared/types`. Take a verified DB backup before
  applying to the real instance.
- CRUD endpoints + `get_rules` / `save_rule` MCP tools.
- `propose_expenses` applies rules first; the agent only decides lines
  with no rule.
- Optional later: a rules list in the web UI.

## Phase 3 — Harness × model evaluation

Goal: pick the harness and model that reconcile most accurately per dollar.

- **Fixtures** (`mcp/eval/fixtures/<case>/`), all synthetic, no real data
  committed: a statement CSV (CommBank and Amex variants), an inbox folder
  of invoice PDFs, a DB seed (categories, providers, existing expenses,
  rules), and `expected.json` — the correct decision for every line.
- **Cases to cover:** already-recorded line; missing invoice over $82.50;
  small purchase without invoice; refund/credit; international supplier
  (GST 0); GST-free domestic purchase; split-use item; personal merchant;
  two identical charges; merchant name containing "total"; invoice with a
  different date than the charge; an ambiguous line that should be "ask".
- **Running:** reset a disposable DB from the seed → run one harness with
  one model on `RECONCILE.md`, answering "approve all proposals" → the MCP
  proposals log is the output. One run per (harness, model, case); repeat
  runs to see variance.
- **Scoring** (`mcp/eval/score.ts`, deterministic, no LLM judge):
  business/personal precision and recall; invoice-match accuracy; GST exact
  to the cent; category accuracy; duplicates avoided; zero writes before
  approval; plus tokens / cost / wall time as reported by the harness.
- **Output:** a results table per run, committed as a dated report; raw logs
  gitignored.
- Include at least one local model (e.g. via Ollama in OpenCode) to measure
  the privacy option.

---

## Order and dependencies

1. **Phase 0** — no dependencies; also fixes live import bugs for manual
   use. Do first regardless of this feature.
2. **Phase 1** — needs Phase 0 and a user-provided redacted CommBank + Amex
   sample.
3. **Phase 3 (fixtures + scorer)** can start in parallel with Phase 1 once
   the proposal JSON shape is fixed.
4. **Phase 2** — after a few real reconciliations show which rules matter.

Authentication (P2-4) is independent. Before auth: local use only. After
auth: the MCP server needs a token, and nothing else changes.

## Risks

| Risk | Mitigation |
|---|---|
| Model misclassifies or mismatches | Code-enforced validation; proposals only; explicit approval; import-job rollback |
| Statement data sent to a model provider | User's choice per harness; local-model option measured in Phase 3 |
| Prompt injection via invoice or statement text | Tools are narrow; writes need a proposal id plus approval; no generic HTTP or shell tools in the server |
| Harness MCP support differs or changes | Plain stdio MCP; per-harness setup documented and checked at implementation |
| Bank export formats change | Fixture tests on real (redacted) samples fail loudly |

## Open questions for the user

1. Can you provide one redacted CSV export each from NetBank and Amex?
2. Where should the inbox folder live, and are invoices mostly PDF or
   photos? (Photos need a vision-capable model.)
3. Which harnesses and models go into the first eval round?
