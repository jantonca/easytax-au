# /import-data - CSV Import Specialist

## Purpose
**⚠️ HIGH-RISK OPERATION:** CSV import can corrupt data if GST/BAS calculations are wrong. This skill provides specialized guidance for implementing, testing, and debugging CSV import functionality.

## Context
Import task: $ARGUMENTS

## Workflow

### 1. Read Domain Documentation FIRST
**MANDATORY reads before ANY import code:**
- `docs/core/ATO-LOGIC.md` - GST calculation rules (CRITICAL)
- `docs/core/SCHEMA.md` - Transaction entity structure
- `docs/core/PATTERNS.md` - Data import patterns
- `docs/core/SECURITY.md` - Input validation requirements

**Understand:**
- GST-inclusive vs GST-exclusive amounts
- BAS label mapping (G1, G10, G11, 1A, 1B)
- Transaction type rules (sale, purchase, capital, non-capital)
- Date parsing (Australian DD/MM/YYYY format)

### 2. Define CSV Format & Validation

**Required columns (example):**
- `date` (DD/MM/YYYY)
- `description` (string, max 255 chars)
- `amount` (dollars, will convert to cents)
- `gst_treatment` (GST-inclusive | GST-exclusive | GST-free)
- `transaction_type` (sale | purchase)
- `is_capital` (yes/no for purchases only)

**Validation rules:**
- [ ] Date parsing: DD/MM/YYYY → ISO 8601
- [ ] Amount: Convert dollars to cents (multiply by 100, round to integer)
- [ ] GST calculation:
  - GST-inclusive: `gst = Math.round(total / 11)`
  - GST-exclusive: `gst = Math.round(total * 0.10)`
  - GST-free: `gst = 0`
- [ ] BAS label mapping:
  - Sale → G1 (total sales), 1A (GST on sales)
  - Purchase (non-capital) → G11, 1B
  - Purchase (capital) → G10, 1B
- [ ] ABN validation (if importing business data)

### 3. Implementation Checklist

**Backend (NestJS):**
- [ ] Create DTO for CSV row validation (`class-validator`)
- [ ] Service method: `importTransactions(file: Express.Multer.File, businessId: string)`
- [ ] CSV parsing library (e.g., `papaparse`, `csv-parser`)
- [ ] Transaction: Wrap all inserts in database transaction (rollback on error)
- [ ] Error handling: Collect all row errors, return detailed report

**Frontend (React):**
- [ ] File upload component (drag-drop or file input)
- [ ] Progress indicator (show row processing)
- [ ] Error display (which rows failed + why)
- [ ] Preview table (show parsed data before import)
- [ ] Confirmation dialog (show totals: X rows, $Y GST)

**Example flow:**
```typescript
// Backend validation
@ValidateNested({ each: true })
@Type(() => CsvTransactionDto)
class CsvTransactionDto {
  @IsDateString()
  date: string;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumber()
  @Min(0)
  amountInCents: number;  // Already converted from dollars

  @IsEnum(['GST-inclusive', 'GST-exclusive', 'GST-free'])
  gstTreatment: string;

  @IsEnum(['sale', 'purchase'])
  transactionType: string;

  @IsBoolean()
  isCapital: boolean;
}
```

### 4. Testing Strategy (MANDATORY)

**Unit tests (.spec.ts):**
```bash
pnpm run test backend/src/import/import.service.spec.ts
```

**Test cases:**
- [ ] GST-inclusive calculation: $110 → GST = $10
- [ ] GST-exclusive calculation: $100 → GST = $10
- [ ] GST-free calculation: $100 → GST = $0
- [ ] Date parsing: "15/02/2026" → ISO 8601
- [ ] Amount conversion: $100.50 → 10050 cents
- [ ] BAS label mapping (all transaction types)
- [ ] Invalid data rejection (future dates, negative amounts, invalid GST treatment)
- [ ] Duplicate detection (same date + amount + description)
- [ ] Large file handling (1000+ rows)
- [ ] Rollback on partial failure (database transaction)

**Integration tests:**
- [ ] Upload CSV → verify all rows inserted
- [ ] Upload with errors → verify error report + no partial inserts
- [ ] Verify BAS report reflects imported transactions

**Test data files:**
```bash
# Create test CSV files
mkdir -p backend/test/fixtures/csv/
# valid-transactions.csv - all correct
# invalid-gst.csv - wrong GST calculations
# invalid-dates.csv - bad date formats
# mixed-errors.csv - some valid, some invalid
```

### 5. Common Pitfalls & Fixes

**Pitfall 1: Float precision errors**
```typescript
// ❌ BAD
const gst = amount * 0.10;  // Float precision issues

// ✅ GOOD
const gst = Math.round(amountInCents / 11);  // Integer math
```

**Pitfall 2: Incorrect GST rounding**
```typescript
// ❌ BAD
const gst = Math.floor(total / 11);  // Always rounds down

// ✅ GOOD
const gst = Math.round(total / 11);  // Banker's rounding
```

**Pitfall 3: Not validating file size**
```typescript
// ✅ GOOD
@ApiConsumes('multipart/form-data')
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv)$/)) {
      return cb(new Error('Only CSV files allowed'), false);
    }
    cb(null, true);
  },
}))
```

**Pitfall 4: No database transaction**
```typescript
// ❌ BAD
for (const row of rows) {
  await this.transactionRepo.save(row);  // Partial inserts on error
}

// ✅ GOOD
await this.entityManager.transaction(async (manager) => {
  for (const row of rows) {
    await manager.save(Transaction, row);
  }
  // Auto-rollback if any row fails
});
```

**Pitfall 5: Date format confusion**
```typescript
// ❌ BAD (US format)
new Date('02/15/2026');  // Feb 15 (MM/DD/YYYY)

// ✅ GOOD (Australian format)
const [day, month, year] = '15/02/2026'.split('/');
new Date(`${year}-${month}-${day}`);  // ISO 8601
```

### 6. Debugging Import Issues

**Check TROUBLESHOOTING.md first:**
```bash
grep -i "import\|csv" docs/core/TROUBLESHOOTING.md
```

**Common issues:**
- NestJS multipart boolean coercion: `"false"` string != `false` boolean
- CSV encoding: UTF-8 vs Windows-1252 (Excel exports)
- Line endings: CRLF (Windows) vs LF (Unix)
- Decimal separators: Comma vs period (regional settings)

**Debugging steps:**
1. Log raw CSV content: `console.log(file.buffer.toString())`
2. Log parsed rows: `console.log(JSON.stringify(parsedRows, null, 2))`
3. Log GST calculations: `console.log({ total, gst, gstTreatment })`
4. Check database: Verify inserted transactions match CSV
5. Run BAS report: Verify totals match manual calculation

### 7. Post-Import Verification

**Verify data integrity:**
```sql
-- Check GST calculations
SELECT
  description,
  total_amount,
  gst_amount,
  ROUND(total_amount / 11) as calculated_gst,
  gst_amount - ROUND(total_amount / 11) as diff
FROM transactions
WHERE gst_treatment = 'GST-inclusive'
  AND ABS(gst_amount - ROUND(total_amount / 11)) > 1;  -- Allow 1 cent rounding

-- Check BAS labels
SELECT
  bas_label,
  COUNT(*),
  SUM(total_amount) as total,
  SUM(gst_amount) as gst
FROM transactions
GROUP BY bas_label;
```

**Compare with BAS report:**
- [ ] G1 total matches sum of all sales
- [ ] 1A total matches sum of GST on sales
- [ ] G10 total matches sum of capital purchases
- [ ] G11 total matches sum of non-capital purchases
- [ ] 1B total matches sum of GST on purchases

## Output Format
```markdown
# CSV Import Implementation: [Feature Name]

## CSV Format Defined
**Columns:**
- [Column name]: [Data type] - [Validation rules]

**Sample row:**
```csv
date,description,amount,gst_treatment,transaction_type,is_capital
15/02/2026,Office supplies,110.00,GST-inclusive,purchase,no
```

---

## Validation Rules
- Date: [Format + parsing logic]
- Amount: [Conversion logic + range]
- GST: [Calculation formulas]
- BAS Labels: [Mapping rules]

---

## Implementation Files
- Backend DTO: `backend/src/import/dto/csv-transaction.dto.ts`
- Backend Service: `backend/src/import/import.service.ts`
- Backend Tests: `backend/src/import/import.service.spec.ts`
- Frontend Component: `web/src/components/import/CsvImport.tsx`
- Frontend Tests: `web/src/components/import/CsvImport.test.tsx`

---

## Test Results
**Unit Tests:**
- GST calculations: [PASS/FAIL] (X/Y cases)
- Date parsing: [PASS/FAIL]
- Validation: [PASS/FAIL]

**Integration Tests:**
- Valid CSV import: [PASS/FAIL]
- Error handling: [PASS/FAIL]
- Database rollback: [PASS/FAIL]

**Test Coverage:**
- Import service: X%
- CSV component: Y%

---

## Verification
- [ ] Manual test: Import test CSV
- [ ] Check database: All rows inserted correctly
- [ ] BAS report: Totals match expected values
- [ ] Error handling: Invalid CSV rejected with clear errors

---

## Known Issues / Edge Cases
[Document any limitations or special handling needed]

---

## Next Steps
Use `/review` to audit GST calculations and BAS label correctness
```

## Guardrails
- **NEVER** skip GST calculation validation tests
- **NEVER** allow import without database transaction (rollback safety)
- **ALWAYS** validate against ATO-LOGIC.md rules
- **ALWAYS** test with large files (1000+ rows)
- **ALWAYS** verify BAS report after import
- **FLAG** if any GST calculation differs from expected by > 1 cent

## Australian Domain Context
- GST rate: 10% (total/11 for inclusive, total*0.10 for exclusive)
- Date format: DD/MM/YYYY (Australian standard)
- BAS labels: G1 (sales), G10 (capital purchases), G11 (non-capital purchases), 1A (GST on sales), 1B (GST on purchases)
- Financial year: July 1 - June 30
- Decimal separator: Period (.) not comma (,)
