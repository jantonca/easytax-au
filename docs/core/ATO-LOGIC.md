# ATO Logic: Australian Tax Reference

**Purpose:** Single source of truth for Australian tax calculations and Business Activity Statement (BAS) rules.

---

## Financial Year (FY) Structure

### Date Range
- **Starts:** July 1 (e.g., FY2026 starts July 1, 2025)
- **Ends:** June 30 (e.g., FY2026 ends June 30, 2026)

### Quarters (BAS Reporting Periods)

| Quarter | Months       | Start Date | End Date |
|---------|--------------|------------|----------|
| Q1      | Jul-Aug-Sep  | Jul 1      | Sep 30   |
| Q2      | Oct-Nov-Dec  | Oct 1      | Dec 31   |
| Q3      | Jan-Feb-Mar  | Jan 1      | Mar 31   |
| Q4      | Apr-May-Jun  | Apr 1      | Jun 30   |

**Example for FY2026:**
- Q1: 2025-07-01 to 2025-09-30
- Q2: 2025-10-01 to 2025-12-31
- Q3: 2026-01-01 to 2026-03-31
- Q4: 2026-04-01 to 2026-06-30

---

## GST (Goods and Services Tax)

### Rate
- **Standard GST:** 10% (applies to most goods and services)
- **Formula:** GST = Total Amount × 10/110 = Total Amount ÷ 11

### Example Calculation
```
Total Amount (including GST): $110.00
GST Component: $110.00 ÷ 11 = $10.00
Net Amount (excluding GST): $110.00 - $10.00 = $100.00
```

### GST-Free Items (0% GST)
The following are NOT subject to GST:
- Basic food items (bread, milk, eggs, vegetables, meat)
- Most health and medical services
- Educational courses
- Exports (goods/services sold overseas)
- International transport

### When to Charge GST
- **You must charge GST** if:
  - You are registered for GST (mandatory if turnover > $75,000/year)
  - You provide taxable supplies (most goods/services in Australia)
  - The customer is in Australia (domestic supply)

- **You do NOT charge GST** if:
  - Customer is international (export of services)
  - Supply is GST-free (see list above)
  - You are not registered for GST (under $75,000 threshold)

---

## Accounting Basis: Cash vs Accrual

**Purpose:** Australian businesses can report GST on either a cash or accrual basis. This affects **when** you report income in your BAS.

### Cash Basis (When Money is Received)

- **Report income when:** You receive payment from customers
- **Unpaid invoices:** Do NOT count toward BAS until paid
- **Example:**
  ```
  Invoice #001: $1,100 (inc $100 GST) - Sent Jan 15, Paid Feb 20

  Q3 BAS (Jan-Mar): Report $0 if unpaid by Mar 31
  Q4 BAS (Apr-Jun): Report $1,100 if paid in Feb (carry forward)
  ```

### Accrual Basis (When Invoice is Issued)

- **Report income when:** You issue an invoice to customers
- **Unpaid invoices:** COUNT toward BAS immediately
- **Example:**
  ```
  Invoice #001: $1,100 (inc $100 GST) - Sent Jan 15, Paid Feb 20

  Q3 BAS (Jan-Mar): Report $1,100 (issued in Jan)
  ```

### Which Should You Use?

| Cash Basis | Accrual Basis |
|------------|---------------|
| ✅ Simpler for small businesses | ✅ Required if turnover > $10M |
| ✅ Better cash flow (defer GST until paid) | ✅ Matches accounting standards |
| ✅ Less accounting knowledge needed | ✅ More accurate business performance |
| ❌ Can't use if turnover > $10M/year | ❌ May pay GST before receiving payment |

**ATO Default:** Most small businesses use **cash basis** for simpler BAS reporting.

### How EasyTax-AU Handles This

**API Endpoint:** `GET /bas/:quarter/:year?basis=CASH|ACCRUAL`

- **Default:** `ACCRUAL` (includes all income regardless of payment status)
- **Cash Basis:** Add `?basis=CASH` to only count paid income (`isPaid = true`)
- **Expenses:** Not affected by basis (always counted when incurred, per ATO rules)

**Example:**
```bash
# Accrual basis (all income)
GET /bas/Q1/2026?basis=ACCRUAL

# Cash basis (paid income only)
GET /bas/Q1/2026?basis=CASH
```

---

## BAS (Business Activity Statement)

### Reporting Fields

The BAS has specific labels for each type of transaction:

| BAS Label | Full Name                        | Description                              | Source                          |
|-----------|----------------------------------|------------------------------------------|---------------------------------|
| **G1**    | Total Sales                      | All income (including GST)               | Sum of all income records       |
| **1A**    | GST on Sales                     | GST you collected from customers         | Sum of `income.gst_cents`       |
| **1B**    | GST on Purchases                 | GST you paid on business expenses        | Sum of `expense.gst_cents`      |
| **G10**   | Capital Purchases                | Purchases of business assets > $1,000    | Expenses with `category.bas_label = 'G10'` |
| **G11**   | Non-Capital Purchases            | Operating expenses < $1,000              | Expenses with `category.bas_label = 'G11'` |

### Net GST Calculation

```
Net GST = 1A (GST Collected) - 1B (GST Paid)
```

- **Positive result:** You owe the ATO (GST payable)
- **Negative result:** The ATO owes you (GST refund)

**Example:**
```
1A (GST Collected): $5,000
1B (GST Paid):      $3,200
Net GST:            $1,800 (payable to ATO)
```

---

## Expense Categories & BAS Labels

### Category Mapping

All expense categories map to one of three BAS labels:

| Category Example       | BAS Label | Deductible? | Description                                    |
|------------------------|-----------|-------------|------------------------------------------------|
| Advertising            | G11       | Yes         | Non-capital operating expense                  |
| Software Subscriptions | G11       | Yes         | Non-capital operating expense                  |
| Office Supplies        | G11       | Yes         | Non-capital operating expense (< $1,000)       |
| Computer Equipment     | G10       | Partial     | Capital purchase (> $1,000, depreciate)        |
| Laptop                 | G10       | Partial     | Capital purchase (> $1,000, depreciate)        |
| Personal Expenses      | 1B        | No          | GST claimed but not deductible for income tax  |

### Deductible vs Claimable GST

**Important distinction:**
- **Claimable GST (1B):** You can claim the GST component if the expense is for business use
- **Deductible Expense:** You can deduct the full amount from taxable income (for income tax)

**These are separate:**
- An expense can be **claimable for GST** but **not deductible for income tax**
  - Example: Personal expense with GST ($100 + $10 GST)
  - You claim $10 GST (goes to 1B)
  - You do NOT deduct $100 from taxable income

---

## Business Use Percentage

### Purpose
Splits mixed-use expenses between business and personal use.

### Calculation
```
Claimable GST = Full GST Amount × (Business % ÷ 100)
```

**Example:**
```
Expense: Mobile phone bill = $110.00 (inc. $10 GST)
Business Use: 60%

Claimable GST: $10.00 × 60% = $6.00
```

### Common Business Use %
- **100%:** Dedicated business expense (e.g., business-only software)
- **80%:** Mostly business (e.g., home office space)
- **50%:** Mixed use (e.g., mobile phone)
- **20%:** Mostly personal (e.g., car for occasional business trips)

---

## International vs Domestic Providers

### Domestic Provider (Australian)
- **ABN/ACN:** Has Australian Business Number or Company Number
- **GST:** Charges 10% GST on taxable supplies
- **BAS Label:** Expenses go to G10 or G11

**Example:**
```
Provider: Telstra (Australian)
Invoice: $110.00 (inc. $10 GST)
Claimable GST: $10.00 → goes to 1B
```

### International Provider
- **ABN/ACN:** None (foreign entity)
- **GST:** Does NOT charge Australian GST
- **BAS Label:** Expenses go to G10 or G11 (no GST component)

**Example:**
```
Provider: AWS (International)
Invoice: $100.00 USD (no GST)
Claimable GST: $0.00
```

**Note:** You may still claim the expense as a deduction for income tax, but there's no GST to claim.

---

## PSI (Personal Services Income)

### Definition
Income earned mainly from your personal skills and efforts (e.g., consulting, freelance work).

### PSI Rules (Alienation Test)
If 80%+ of your income is PSI, you may NOT be able to claim certain deductions:
- Home office expenses (limited)
- Travel (limited)
- Must pass "Results Test" or "Unrelated Clients Test"

### PSI Eligible Clients
The `Client.is_psi_eligible` flag indicates whether income from this client counts as PSI.

**Use cases:**
- **True:** Freelance consulting, personal services
- **False:** Product sales, royalties, business income

**Impact:**
- Affects which expenses you can deduct
- May limit deductions if 80%+ of clients are PSI-eligible
- Requires separate calculation at tax time (not in BAS)

---

## Important Dates

### BAS Lodgment Deadlines (Quarterly)

Assuming you lodge quarterly (not monthly):

| Quarter | Period End | Lodgment Due   |
|---------|------------|----------------|
| Q1      | Sep 30     | Oct 28         |
| Q2      | Dec 31     | Feb 28         |
| Q3      | Mar 31     | Apr 28         |
| Q4      | Jun 30     | Jul 28         |

**Note:** If you use a registered tax agent, you get an extension (usually +2 weeks).

### Annual Tax Return Deadlines
- **Non-agent:** October 31 (for FY ending June 30)
- **With tax agent:** March 31 (next year)

---

## Data Storage Rules

### Currency (Cents)
All amounts stored as **integers in cents** to avoid floating-point errors.

```typescript
// Example: $110.50
amount_cents: 11050  // stored in database
gst_cents: 1005      // $10.05 GST (11050 ÷ 11)
```

### Encryption
Sensitive fields use **AES-256-GCM** encryption:
- Client names and ABNs
- Expense/income descriptions

### Date Format
All dates stored as **ISO 8601** strings (YYYY-MM-DD):
```
2025-07-15  // July 15, 2025
```

---

## Common Calculations

### 1. Calculate GST from Total (including GST)
```typescript
gst = totalAmount / 11
netAmount = totalAmount - gst
```

**Example:**
```
Total: $110.00
GST: $110.00 ÷ 11 = $10.00
Net: $110.00 - $10.00 = $100.00
```

### 2. Calculate Total from Net (excluding GST)
```typescript
gst = netAmount * 0.10
totalAmount = netAmount + gst
```

**Example:**
```
Net: $100.00
GST: $100.00 × 10% = $10.00
Total: $100.00 + $10.00 = $110.00
```

### 3. Calculate Claimable GST with Business %
```typescript
claimableGst = fullGst * (bizPercent / 100)
```

**Example:**
```
Full GST: $10.00
Business %: 60%
Claimable: $10.00 × 60% = $6.00
```

### 4. BAS Net GST Position
```typescript
netGst = gstCollected - gstPaid
```

**Example:**
```
1A (Collected): $5,000
1B (Paid): $3,200
Net GST: $1,800 (you owe ATO)
```

---

## AI Agent Guardrails

### DO NOT Use US Tax Rules
❌ **Wrong:** "Sales tax", "IRS", "Form 1040", "W-2", "April 15 deadline"
✅ **Correct:** "GST", "ATO", "BAS", "Income Tax Return", "October 31 deadline"

### DO NOT Assume Calendar Year
❌ **Wrong:** Financial year = Jan 1 - Dec 31
✅ **Correct:** Financial year = Jul 1 - Jun 30

### DO NOT Calculate GST as 10% of Total
❌ **Wrong:** GST = $110.00 × 10% = $11.00
✅ **Correct:** GST = $110.00 ÷ 11 = $10.00

### DO NOT Mix Claimable GST and Deductible Expense
- **1B (BAS):** Claimable GST only (goes on quarterly BAS)
- **Deductions:** Full expense amount (goes on annual tax return)
- These are separate calculations for separate forms

---

## Quick Reference

### Key Numbers
- **GST Rate:** 10% (1/11 of total)
- **Registration Threshold:** $75,000/year turnover
- **PSI Threshold:** 80% of income from personal services
- **Capital Purchase:** Expenses > $1,000 (depreciate, not instant deduct)

### Key Dates
- **FY Starts:** July 1
- **FY Ends:** June 30
- **BAS Due:** 28th of month after quarter end
- **Tax Return Due:** October 31 (or March 31 with agent)

### Key Formulas
- **GST from Total:** `total ÷ 11`
- **Net GST:** `1A - 1B`
- **Claimable GST:** `full_gst × biz_percent ÷ 100`

---

## External References

- **ATO Website:** https://www.ato.gov.au/
- **GST Guide:** https://www.ato.gov.au/business/gst/
- **BAS Instructions:** https://www.ato.gov.au/business/business-activity-statements-bas/
- **PSI Rules:** https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/income-and-deductions-for-business/personal-services-income

---

**Last Updated:** 2026-01-09
**Maintained by:** Project owner (update when ATO rules change)
