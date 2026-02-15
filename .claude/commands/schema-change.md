# /schema-change - Database Schema Migration

## Purpose
**⚠️ HIGH-RISK OPERATION:** Schema changes can break encrypted fields, cause data loss, or invalidate type generation. This skill provides specialized guidance for safe database migrations.

## Context
Schema change description: $ARGUMENTS

## Workflow

### 1. Read Documentation FIRST
**MANDATORY reads:**
- `docs/core/SCHEMA.md` - Current entity structure
- `docs/core/SECURITY.md` - Encrypted field handling
- `docs/core/BACKUP.md` - Backup/recovery procedures
- `docs/core/ARCHITECTURE.md` - Database layer patterns

**Understand:**
- Which fields are encrypted (`@Encrypted()` decorator)
- Entity relationships (OneToMany, ManyToOne, ManyToMany)
- Existing migrations (`backend/src/migrations/`)
- Type generation workflow

### 2. Plan Schema Change

**Change types:**
- **Low-risk:** Add new column (nullable), add new table, add index
- **Medium-risk:** Rename column, change column type (compatible), add constraint
- **High-risk:** Drop column, change encrypted field, change primary/foreign key

**Pre-change checklist:**
- [ ] Backup database (MANDATORY for production)
- [ ] Review existing entity definition
- [ ] Check for dependent code (grep for field name)
- [ ] Plan rollback strategy

### 3. Create Migration

**Generate migration:**
```bash
# Backend directory
cd backend

# Generate migration from entity changes
pnpm run migration:generate src/migrations/MigrationName

# Or create empty migration for manual SQL
pnpm run migration:create src/migrations/MigrationName
```

**Migration structure:**
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationName1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Forward migration
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD COLUMN "new_field" VARCHAR(255) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback migration
    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP COLUMN "new_field";
    `);
  }
}
```

### 4. Handle Encrypted Fields (CRITICAL)

**⚠️ NEVER modify encrypted columns directly in SQL**

**Safe pattern for encrypted field changes:**
```typescript
// 1. Read encrypted data with entity (auto-decrypts)
const records = await this.repo.find();

// 2. Modify entity definition (add @Encrypted() to new field)
@Entity()
class MyEntity {
  @Column()
  @Encrypted()
  newEncryptedField: string;
}

// 3. Save via entity (auto-encrypts)
for (const record of records) {
  record.newEncryptedField = transformOldData(record);
  await this.repo.save(record);
}
```

**Anti-pattern (WILL CORRUPT DATA):**
```typescript
// ❌ NEVER DO THIS
await queryRunner.query(`
  UPDATE businesses
  SET encrypted_field = CONCAT(encrypted_field, '-suffix');
  -- This operates on encrypted bytes, not plaintext!
`);
```

### 5. Migration Testing Strategy

**Test in this order:**
1. **Local development database**
2. **Staging environment** (with production-like data)
3. **Production** (with backup ready)

**Test steps:**
```bash
# 1. Show pending migrations
pnpm run migration:show

# 2. Dry-run (if supported, or test on dev DB)
pnpm run migration:run

# 3. Verify data integrity
# - Check row counts
# - Check encrypted fields decrypt correctly
# - Check foreign key constraints
# - Check indexes exist

# 4. Test rollback
pnpm run migration:revert

# 5. Re-run migration
pnpm run migration:run
```

**Data integrity checks:**
```sql
-- Check row counts match before/after
SELECT COUNT(*) FROM businesses;
SELECT COUNT(*) FROM transactions;

-- Check no NULL values in NOT NULL columns
SELECT * FROM transactions WHERE required_field IS NULL;

-- Check foreign key integrity
SELECT t.*
FROM transactions t
LEFT JOIN businesses b ON t.business_id = b.id
WHERE b.id IS NULL;

-- Check encrypted fields (should show gibberish in DB)
SELECT id, encrypted_abn FROM businesses LIMIT 5;
-- If you see plaintext, encryption is broken!
```

### 6. Type Generation (MANDATORY)

**After schema changes, regenerate types:**
```bash
# Root directory
pnpm run generate:types
```

**This updates:**
- `@shared/types` - Type definitions
- Frontend imports - Auto-completion and type checking

**Verify type generation:**
```bash
# Check for type errors
pnpm --filter web type-check
cd backend && pnpm run build
```

**Common type generation issues:**
- Circular dependencies (fix with forward refs)
- Enum changes not reflected (restart dev server)
- DTO/Entity mismatch (sync DTO definitions)

### 7. Update Related Code

**Search for affected code:**
```bash
# Find all references to changed field
grep -r "oldFieldName" backend/src/ web/src/ --include="*.ts" --include="*.tsx"

# Find all uses of entity
grep -r "EntityName" backend/src/ web/src/ --include="*.ts" --include="*.tsx"
```

**Update:**
- [ ] DTOs (create, update, response DTOs)
- [ ] Services (business logic using field)
- [ ] Controllers (API endpoints)
- [ ] Frontend components (displaying data)
- [ ] Tests (unit tests, integration tests)
- [ ] Type imports (`@shared/types`)

### 8. Migration Checklist by Change Type

---

#### Adding a New Column

**Steps:**
1. Add property to entity class
2. Generate migration: `pnpm run migration:generate`
3. Review generated SQL
4. Run migration: `pnpm run migration:run`
5. Regenerate types: `pnpm run generate:types`
6. Update DTOs if exposing in API
7. Add tests

**Considerations:**
- Make nullable first, then add NOT NULL constraint after data backfill
- Set default values if appropriate
- Add index if used in WHERE/ORDER BY clauses

---

#### Renaming a Column

**Steps:**
1. Rename property in entity class
2. Generate migration (TypeORM may drop+add instead of rename)
3. **Manually edit migration to use RENAME:**
```typescript
await queryRunner.query(`
  ALTER TABLE "table_name"
  RENAME COLUMN "old_name" TO "new_name";
`);
```
4. Run migration
5. Regenerate types
6. Update all code references (grep for old name)
7. Update tests

**Considerations:**
- Data preserved (no copy needed)
- Check for hardcoded column names in raw SQL queries

---

#### Changing Column Type

**Steps:**
1. Change property type in entity class
2. Generate migration
3. **Review data compatibility** (e.g., VARCHAR → INT requires data cleanup)
4. Add data transformation if needed:
```typescript
// Example: Convert string to integer
await queryRunner.query(`
  UPDATE table_name
  SET column_name = column_name::INTEGER
  WHERE column_name ~ '^[0-9]+$';
`);
await queryRunner.query(`
  ALTER TABLE "table_name"
  ALTER COLUMN "column_name" TYPE INTEGER USING column_name::INTEGER;
`);
```
5. Run migration
6. Regenerate types
7. Update code to handle new type

**Considerations:**
- Incompatible types may require intermediate steps
- Test with production-like data (edge cases)

---

#### Dropping a Column

**⚠️ HIGH-RISK - Data loss is permanent**

**Steps:**
1. **Ensure column is truly unused** (grep all code)
2. **Backup database** (MANDATORY)
3. Remove property from entity class
4. Generate migration
5. **Test rollback** (down migration should restore column)
6. Run migration
7. Regenerate types
8. Remove related code

**Considerations:**
- Consider soft-delete first (rename to `deprecated_field`, drop later)
- Check for any serialized/JSON data referencing field
- Document in CHANGELOG.md

---

#### Adding/Modifying Encrypted Field

**⚠️ CRITICAL - Wrong approach corrupts data**

**Steps:**
1. **Backup database** (MANDATORY)
2. Add `@Encrypted()` decorator to entity property
3. **Do NOT generate migration** (encryption happens in app layer)
4. Create data migration script:
```typescript
// scripts/migrate-encrypted-field.ts
const businesses = await businessRepo.find();
for (const business of businesses) {
  business.newEncryptedField = transformData(business);
  await businessRepo.save(business);  // Auto-encrypts
}
```
5. Run data migration script
6. Verify encryption: Check DB shows ciphertext, app shows plaintext
7. Regenerate types

**Considerations:**
- NEVER use SQL ALTER on encrypted columns
- NEVER copy encrypted data between columns (decrypt/encrypt via entity)
- Test decryption after migration

---

### 9. Rollback Procedure

**If migration fails or causes issues:**

**Development:**
```bash
# Revert last migration
pnpm run migration:revert

# Or drop database and recreate
pnpm run db:drop
pnpm run db:create
pnpm run migration:run
```

**Production:**
```bash
# 1. Stop application
systemctl stop easytax-backend

# 2. Restore database from backup (see BACKUP.md)
# ... backup restore commands ...

# 3. Revert code to previous version
git checkout [previous-commit]
pnpm install --frozen-lockfile

# 4. Restart application
systemctl start easytax-backend

# 5. Verify data integrity
```

## Output Format
```markdown
# Schema Migration: [Change Description]

## Change Summary
**Type:** [Add Column / Rename Column / Change Type / Drop Column / Add Table / etc.]
**Risk Level:** [Low / Medium / High]
**Affects Encrypted Fields:** [Yes / No]

---

## Entity Changes

**Before:**
```typescript
@Entity()
class MyEntity {
  @Column()
  oldField: string;
}
```

**After:**
```typescript
@Entity()
class MyEntity {
  @Column()
  newField: number;
}
```

---

## Migration File
**Path:** `backend/src/migrations/1234567890123-MigrationName.ts`

**SQL (up):**
```sql
ALTER TABLE "my_table" ADD COLUMN "new_field" INTEGER NULL;
```

**SQL (down):**
```sql
ALTER TABLE "my_table" DROP COLUMN "new_field";
```

---

## Testing Results

**Development:**
- [ ] Migration runs successfully
- [ ] Rollback works
- [ ] Data integrity verified
- [ ] Encrypted fields decrypt correctly (if applicable)

**Staging:**
- [ ] Migration runs successfully
- [ ] Application works with new schema
- [ ] No errors in logs

---

## Type Generation
**Command run:** `pnpm run generate:types`
**Result:** [PASS / FAIL]

**Type check results:**
- Frontend: [PASS / FAIL]
- Backend: [PASS / FAIL]

---

## Related Code Updates
**Files modified:**
- `backend/src/dto/my.dto.ts` - Updated DTO
- `web/src/components/MyComponent.tsx` - Updated frontend
- `backend/src/my/my.service.spec.ts` - Updated tests

---

## Deployment Checklist
- [ ] Backup database (production)
- [ ] Test migration in staging
- [ ] Schedule maintenance window (if downtime needed)
- [ ] Prepare rollback plan
- [ ] Run migration
- [ ] Verify data integrity
- [ ] Monitor logs for errors

---

## Rollback Plan
**If migration fails:**
1. Stop application
2. Restore database from backup: [Backup file name]
3. Revert code: `git checkout [commit-hash]`
4. Restart application
5. Verify functionality

---

## Documentation Updates
- [ ] Update `docs/core/SCHEMA.md` with new entity structure
- [ ] Update `CHANGELOG.md` with migration details
- [ ] Update API docs (if endpoints changed)
```

## Guardrails
- **NEVER** modify encrypted columns via SQL
- **NEVER** run migrations in production without backup
- **NEVER** skip type generation after schema changes
- **ALWAYS** test rollback before production deployment
- **ALWAYS** verify data integrity after migration
- **FLAG** if dropping columns (data loss risk)
- **FLAG** if changing foreign key relationships

## Australian Domain Context
- ABN field: 11 characters, encrypted
- Business name: May be encrypted (sensitive data)
- Transaction dates: Must support FY boundaries (June 30 / July 1)
- GST amounts: Integer cents, no decimal columns
- BAS labels: Enum or VARCHAR, check constraints
