# CASH-basis BAS: payment-date design (M02)

**Status:** Approved scope for the 2026-09 maintenance remediation (finding M02).
**ATO basis (verified 2026-09-11, primary sources):**
- Cash basis: "You account for the GST payable on the sales you make in the
  reporting period in which you receive payment for them" —
  https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/accounting-for-gst-in-your-business/choosing-an-accounting-method
- GSTR 2000/13 [12]: GST payable is attributed "to the tax period in which you
  receive consideration for the supply".
- Partial payments: only the GST in the part payment received is attributed in
  that period (same page, and GSTR 2000/13 [12] "only to the extent ...").

## Problem

CASH-basis BAS filtered paid income by the **invoice date** (`incomes.date`),
so an invoice dated 2026-06-30 and paid 2026-07-02 was reported in Q4 FY2026
once marked paid, instead of Q1 FY2027. ACCRUAL (invoice-date) reporting was
correct.

## Field

`incomes.payment_date DATE NULL`, entity property `paymentDate?: Date | null`.

- **`payment_date IS NULL` and `is_paid = true`** — "paid, receipt date not yet
  recorded". This is the legacy/unknown state; it is never inferred from
  invoice date, `updatedAt`, migration time, or the current date.
- **`is_paid = false`** — `payment_date` must be `NULL` (enforced by the
  service; clearing payment status clears the date).
- Index `idx_incomes_payment_date` supports the CASH-basis range query.

## Attribution rules

| Basis | Income attribution | Includes |
|-------|--------------------|----------|
| ACCRUAL | invoice `date` (unchanged) | all incomes |
| CASH | `payment_date` | only paid incomes with a known `payment_date` |

Expenses are unchanged on both bases (attributed by expense date); this matches
the pre-existing documented behaviour and is recorded as a limitation below.

## Paid/unpaid transitions

- `PATCH /incomes/:id/paid` requires a body `{ "paymentDate": "YYYY-MM-DD" }`.
  Missing or invalid date → 400 (previously accepted any payload and inferred
  nothing — there was no date at all).
- `PATCH /incomes/:id/unpaid` clears `payment_date` to `NULL`.
- `PATCH /incomes/:id` (update):
  - `isPaid: true` + `paymentDate` → set both (receipt-date correction or
    newly-paid).
  - `isPaid: true` on an income that is currently **unpaid** without
    `paymentDate` → 400; a receipt date must be supplied when newly marking an
    income paid.
  - `isPaid: true` on an income that is already paid without `paymentDate` →
    allowed; keeps the unknown state until a date is entered (reconciliation
    must be explicit, not silent).
  - `isPaid: false` + `paymentDate` → 400 (contradictory).
  - `paymentDate` on an unpaid income without `isPaid: true` → 400
    (contradictory).
  - `paymentDate: null` on a paid income → allowed: deliberately re-enters the
    unknown state (this drops a captured date; no UI confirmation step exists
    for this API-level operation today — record one as a follow-up if the
    workflow needs it).
  - `POST /incomes` with `isPaid: true` requires `paymentDate`.
- A future receipt date is rejected (400); a receipt date earlier than the
  invoice date is **allowed** (payment before invoicing is legitimate).

## Import paths (multipart + JSON, incomes)

New optional column mapping `receiptDate` (header `Receipt Date` in the
`custom` mapping). Semantics per row:

- `markAsPaid=true`, receipt date present → paid with that date.
- `markAsPaid=true`, no receipt date → paid with `payment_date NULL` **plus a
  visible row warning** ("excluded from CASH BAS until receipt date is
  reconciled"). Historical paid rows are never assigned invented dates.
- `markAsPaid=false` → unpaid; `payment_date` stays `NULL`; a supplied receipt
  date on an unpaid row produces a warning that the date was ignored.

## Legacy records policy (no data backfill)

Existing paid rows keep `payment_date NULL` after migration. Consequences:

- CASH-basis BAS excludes them from G1/1A attribution **and reports them
  explicitly** in the summary as `unreconciledPaidIncomeCount` /
  `unreconciledPaidIncomeTotalCents` (global figures — they cannot be assigned
  to any quarter). The frontend shows a visible banner on the CASH view; a
  CASH total is therefore never "apparently complete" while unknowns exist.
- ACCRUAL view is unaffected (invoice-date attribution includes them).
- Reconciliation = a human enters the real receipt date per record (mark-paid
  UI for already-paid records with unknown date, or edit form). No automatic
  backfill, no date inference, no live migration of data.

## API responses

`BasSummaryDto` gains `basis` (echo), `unreconciledPaidIncomeCount` and
`unreconciledPaidIncomeTotalCents` (0 for ACCRUAL; actuals for CASH).
`Income` responses include `paymentDate: string | null`. Shared types are
regenerated from the live OpenAPI document.

## UI date entry

- Mark-as-paid in the income table requires a receipt date (defaults to today,
  editable, required).
- The income form shows a "Receipt date" input when "Mark as paid" is checked
  (create) and for paid records in edit mode (to reconcile unknowns).
- Paid rows with unknown receipt date are visibly marked ("Paid · receipt date
  unknown") in the table.
- The BAS report page gains a basis selector (defaults to ACCRUAL, preserving
  current behaviour) and displays the reconciliation banner for CASH.

## Known limitations (documented, not silently redesignable)

- **No partial-payment model.** ATO cash accounting attributes part payments
  pro rata across periods; the boolean `isPaid` cannot express that. Until a
  payment-ledger exists, CASH attribution is all-or-nothing per invoice.
- **Expense side unchanged.** GST credits (1B) and G10/G11 are attributed by
  expense date on both bases; on the cash basis the ATO attributes GST credits
  when payment is provided. The model has no payment tracking for expenses —
  the expense date is used as the payment-date proxy (pre-existing behaviour).
- **ACCRUAL uses invoice date only.** GSTR 2000/13 [14] attributes accrual GST
  to the earlier of payment receipt or invoice issue; the model cannot express
  payment-before-invoice for ACCRUAL.

## Migration and rollback

Additive migration only (`payment_date` column + index), generated against a
disposable database. Dropping the column later loses any captured receipt
dates; rolling back the code while rows carry real dates would restore
incorrect (invoice-date) CASH reporting only for records with NULL dates —
records with a captured date would keep it but the old code ignores it.
Before any live migration: take a verified backup and plan receipt-date
preservation/reconciliation separately.
