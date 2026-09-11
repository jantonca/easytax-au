// Guard runs before anything reads application configuration: these suites
// delete data and refuse non-disposable targets.
import { assertDisposableDatabaseTarget } from './guards/disposable-db-guard';

assertDisposableDatabaseTarget();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Income } from '../src/modules/incomes/entities/income.entity';
import { Expense } from '../src/modules/expenses/entities/expense.entity';
import { Provider } from '../src/modules/providers/entities/provider.entity';
import { Client } from '../src/modules/clients/entities/client.entity';
import { ImportJob } from '../src/modules/import-jobs/entities/import-job.entity';

/**
 * DB-backed regression for M02 cash-basis payment-date attribution.
 *
 * Uses synthetic persisted records in a disposable database (DB_* env vars,
 * migrations applied on startup by the app). A mocked query-builder assertion
 * alone is not proof of correct attribution.
 */
describe('BAS payment-date attribution (e2e, disposable DB)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // The Item column must match a provider seeded by this suite
  // (seedFixtures creates 'Synthetic Provider')
  const expenseCsv = (providerName: string): string =>
    `Date,Item,Total,GST\n2026-05-10,${providerName},$88.00,$8.00\n`;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
    dataSource = module.get(DataSource);
  });

  // Explicit connection teardown: without it the TypeORM pool can keep the
  // Jest process alive until the job timeout (S05).
  afterAll(async () => {
    await app.close();
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clean slate between scenarios (order respects FKs)
    await dataSource.createQueryBuilder().delete().from(Expense).execute();
    await dataSource.createQueryBuilder().delete().from(Income).execute();
    await dataSource.createQueryBuilder().delete().from(Client).execute();
    await dataSource.createQueryBuilder().delete().from(Provider).execute();
    await dataSource.createQueryBuilder().delete().from(ImportJob).execute();
  });

  async function seedFixtures(): Promise<{
    clientId: string;
    providerId: string;
    categoryId: string;
  }> {
    const categoryRepo = dataSource.getRepository('categories');
    const providerRepo = dataSource.getRepository(Provider);
    const clientRepo = dataSource.getRepository(Client);

    const category = await categoryRepo.save({
      name: 'Other',
      basLabel: 'G11',
      isDeductible: true,
    });
    const provider = await providerRepo.save({
      name: 'Synthetic Provider',
      isInternational: false,
      defaultCategoryId: category.id,
    });
    const client = await clientRepo.save({
      name: 'Synthetic Client',
      isPsiEligible: false,
    });

    return {
      categoryId: String(category.id),
      providerId: provider.id,
      clientId: client.id,
    };
  }

  it('attributes a June invoice paid in July to Q1 FY2027 on CASH, and to Q4 FY2026 on ACCRUAL', async () => {
    const ids = await seedFixtures();

    // June invoice (Q4 FY2026), paid 2026-07-02 (Q1 FY2027)
    const paidIncomeId = (
      await dataSource.getRepository(Income).save({
        date: new Date('2026-06-30T00:00:00.000Z'),
        clientId: ids.clientId,
        invoiceNum: 'INV-CROSS-QUARTER',
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
        isPaid: true,
        paymentDate: new Date('2026-07-02T00:00:00.000Z'),
      })
    ).id;

    const cashQ4 = await request(app.getHttpServer()).get('/bas/Q4/2026?basis=CASH');
    const cashQ1Next = await request(app.getHttpServer()).get('/bas/Q1/2027?basis=CASH');
    const accrualQ4 = await request(app.getHttpServer()).get('/bas/Q4/2026?basis=ACCRUAL');

    expect(cashQ4.status).toBe(200);
    expect(cashQ1Next.status).toBe(200);
    expect(accrualQ4.status).toBe(200);

    // CASH: excluded from the invoice quarter, included in the payment quarter
    expect(cashQ4.body.g1TotalSalesCents).toBe(0);
    expect(cashQ4.body.incomeCount).toBe(0);
    expect(cashQ1Next.body.g1TotalSalesCents).toBe(110000);
    expect(cashQ1Next.body.incomeCount).toBe(1);
    expect(cashQ1Next.body.label1aGstCollectedCents).toBe(10000);

    // ACCRUAL: stays on the invoice period
    expect(accrualQ4.body.g1TotalSalesCents).toBe(110000);
    expect(accrualQ4.body.incomeCount).toBe(1);

    const persisted = await dataSource.getRepository(Income).findOneByOrFail({
      id: paidIncomeId,
    });
    expect(persisted.paymentDate).not.toBeNull();

    // Same-quarter payment: paid 2026-05-15 -> CASH Q4 FY2026
    await dataSource.getRepository(Income).save({
      date: new Date('2026-05-01T00:00:00.000Z'),
      clientId: ids.clientId,
      subtotalCents: 20000,
      gstCents: 2000,
      totalCents: 22000,
      isPaid: true,
      paymentDate: new Date('2026-05-15T00:00:00.000Z'),
    });

    const cashQ4After = await request(app.getHttpServer()).get('/bas/Q4/2026?basis=CASH');
    expect(cashQ4After.body.g1TotalSalesCents).toBe(22000);
    expect(cashQ4After.body.incomeCount).toBe(1);

    // FY-end boundary: paid exactly 2026-06-30 belongs to Q4 FY2026
    await dataSource.getRepository(Income).save({
      date: new Date('2026-04-01T00:00:00.000Z'),
      clientId: ids.clientId,
      subtotalCents: 10000,
      gstCents: 1000,
      totalCents: 11000,
      isPaid: true,
      paymentDate: new Date('2026-06-30T00:00:00.000Z'),
    });

    const cashQ4Boundary = await request(app.getHttpServer()).get('/bas/Q4/2026?basis=CASH');
    expect(cashQ4Boundary.body.g1TotalSalesCents).toBe(33000);
    expect(cashQ4Boundary.body.incomeCount).toBe(2);

    // Paid-to-unpaid transition removes it from CASH entirely
    const unpaidIncome = await dataSource.getRepository(Income).save({
      date: new Date('2026-05-02T00:00:00.000Z'),
      clientId: ids.clientId,
      subtotalCents: 50000,
      gstCents: 5000,
      totalCents: 55000,
      isPaid: true,
      paymentDate: new Date('2026-05-20T00:00:00.000Z'),
    });
    await request(app.getHttpServer()).patch(`/incomes/${unpaidIncome.id}/unpaid`);

    const cashQ4AfterUnpaid = await request(app.getHttpServer()).get('/bas/Q4/2026?basis=CASH');
    expect(cashQ4AfterUnpaid.body.g1TotalSalesCents).toBe(33000);
    expect(cashQ4AfterUnpaid.body.incomeCount).toBe(2);
  });

  it('reports legacy paid incomes without a receipt date instead of attributing them', async () => {
    const ids = await seedFixtures();

    // Simulated legacy row: paid, no receipt date (pre-migration data shape)
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(Income)
      .values({
        date: new Date('2026-05-01T00:00:00.000Z'),
        clientId: ids.clientId,
        subtotalCents: 30000,
        gstCents: 3000,
        totalCents: 33000,
        isPaid: true,
        paymentDate: null,
      })
      .execute();

    const cash = await request(app.getHttpServer()).get('/bas/Q4/2026?basis=CASH');
    expect(cash.status).toBe(200);
    // Unknown receipt date must never be attributed to an arbitrary quarter
    expect(cash.body.g1TotalSalesCents).toBe(0);
    expect(cash.body.unreconciledPaidIncomeCount).toBe(1);
    expect(cash.body.unreconciledPaidIncomeTotalCents).toBe(33000);

    const accrual = await request(app.getHttpServer()).get('/bas/Q4/2026?basis=ACCRUAL');
    expect(accrual.body.g1TotalSalesCents).toBe(33000);
    expect(accrual.body.unreconciledPaidIncomeCount).toBe(0);
  });

  it('rejects contradictory paid/date payloads over HTTP', async () => {
    const ids = await seedFixtures();
    const income = await dataSource.getRepository(Income).save({
      date: new Date('2026-05-01T00:00:00.000Z'),
      clientId: ids.clientId,
      subtotalCents: 10000,
      gstCents: 1000,
      totalCents: 11000,
      isPaid: false,
    });

    // Invalid date string rejected at the boundary
    const invalid = await request(app.getHttpServer())
      .patch(`/incomes/${income.id}/paid`)
      .send({ paymentDate: '07/02/2026' });
    expect(invalid.status).toBe(400);

    // Contradictory: unpaid with a payment date
    const contradictory = await request(app.getHttpServer())
      .patch(`/incomes/${income.id}`)
      .send({ paymentDate: '2026-07-02' });
    expect(contradictory.status).toBe(400);

    // isPaid=false with a payment date
    const both = await request(app.getHttpServer())
      .patch(`/incomes/${income.id}`)
      .send({ isPaid: false, paymentDate: '2026-07-02' });
    expect(both.status).toBe(400);

    // Newly paid without a payment date is rejected
    const missing = await request(app.getHttpServer())
      .patch(`/incomes/${income.id}`)
      .send({ isPaid: true });
    expect(missing.status).toBe(400);

    // Explicit null does NOT satisfy the receipt-date requirement (S04/R04):
    // the persisted record must stay unpaid with no date.
    const nullOnUnpaid = await request(app.getHttpServer())
      .patch(`/incomes/${income.id}`)
      .send({ isPaid: true, paymentDate: null });
    expect(nullOnUnpaid.status).toBe(400);

    const stillUnpaid = await dataSource.getRepository(Income).findOneByOrFail({
      id: income.id,
    });
    expect(stillUnpaid.isPaid).toBe(false);
    expect(stillUnpaid.paymentDate).toBeNull();

    // An unpaid create payload carrying a date is rejected at the boundary.
    const createWithDate = await request(app.getHttpServer()).post('/incomes').send({
      date: '2026-05-01',
      clientId: income.clientId,
      subtotalCents: 10000,
      gstCents: 1000,
      isPaid: false,
      paymentDate: '2026-05-02',
    });
    expect(createWithDate.status).toBe(400);

    // Clearing payment status clears the date
    const marked = await request(app.getHttpServer())
      .patch(`/incomes/${income.id}/paid`)
      .send({ paymentDate: '2026-07-02' });
    expect(marked.status).toBe(200);
    expect(marked.body.paymentDate).toContain('2026-07-02');

    const cleared = await request(app.getHttpServer()).patch(`/incomes/${income.id}/unpaid`);
    expect(cleared.status).toBe(200);
    expect(cleared.body.isPaid).toBe(false);
    expect(cleared.body.paymentDate).toBeNull();
  });

  it('re-enters the documented unknown state when a paid date is cleared to null (S04)', async () => {
    const ids = await seedFixtures();
    const paid = await dataSource.getRepository(Income).save({
      date: new Date('2026-05-01T00:00:00.000Z'),
      clientId: ids.clientId,
      subtotalCents: 10000,
      gstCents: 1000,
      totalCents: 11000,
      isPaid: true,
      paymentDate: new Date('2026-05-20T00:00:00.000Z'),
    });

    const res = await request(app.getHttpServer())
      .patch(`/incomes/${paid.id}`)
      .send({ isPaid: true, paymentDate: null });
    expect(res.status).toBe(200);
    expect(res.body.isPaid).toBe(true);
    expect(res.body.paymentDate).toBeNull();

    const persisted = await dataSource.getRepository(Income).findOneByOrFail({
      id: paid.id,
    });
    expect(persisted.isPaid).toBe(true);
    expect(persisted.paymentDate).toBeNull();
  });

  it('CSV dry-run persists nothing; a real import writes rows and an import job (M04/M02)', async () => {
    const seeded = await seedFixtures();
    expect(seeded.clientId).toBeDefined();

    const countAll = async (): Promise<Record<string, number>> => ({
      expenses: await dataSource.getRepository(Expense).count(),
      incomes: await dataSource.getRepository(Income).count(),
      importJobs: await dataSource.getRepository(ImportJob).count(),
      providers: await dataSource.getRepository(Provider).count(),
      clients: await dataSource.getRepository(Client).count(),
    });

    const before = await countAll();

    // Dry run through the HTTP multipart path: must write NOTHING
    // (the real frontend always sends `source`; the API requires source or
    // mapping for expense imports)
    const dryRun = await request(app.getHttpServer())
      .post('/import/expenses')
      .field('source', 'custom')
      .field('dryRun', 'true')
      .field('skipDuplicates', 'true')
      .attach('file', Buffer.from(expenseCsv('Synthetic Provider')), 'expenses.csv');
    expect(dryRun.status).toBe(201);
    expect(dryRun.body.importJobId).toBeNull();
    expect(dryRun.body.successCount).toBe(1);

    const afterDryRun = await countAll();
    expect(afterDryRun).toEqual(before);

    // Same content without dryRun: writes the expense + an import job
    const real = await request(app.getHttpServer())
      .post('/import/expenses')
      .field('source', 'custom')
      .field('skipDuplicates', 'true')
      .attach('file', Buffer.from(expenseCsv('Synthetic Provider')), 'expenses.csv');
    expect(real.status).toBe(201);
    expect(real.body.importJobId).not.toBeNull();

    const afterReal = await countAll();
    expect(afterReal.expenses).toBe(before.expenses + 1);
    expect(afterReal.importJobs).toBe(before.importJobs + 1);

    // Duplicate handling: same row again is skipped as duplicate
    const duplicate = await request(app.getHttpServer())
      .post('/import/expenses')
      .field('source', 'custom')
      .field('skipDuplicates', 'true')
      .attach('file', Buffer.from(expenseCsv('Synthetic Provider')), 'expenses.csv');
    expect(duplicate.status).toBe(201);
    expect(duplicate.body.duplicateCount).toBe(1);
    const afterDuplicate = await countAll();
    expect(afterDuplicate.expenses).toBe(afterReal.expenses);

    // Income CSV import with receipt date (M02 semantics): markAsPaid makes
    // the rows paid, and the receipt-date column supplies the attribution date
    const incomeCsv = `Client,Invoice #,Subtotal,GST,Total,Receipt Date\nSynthetic Client,INV-CSV-1,$1000,$100,$1100,2026-07-02\n`;
    const incomeImport = await request(app.getHttpServer())
      .post('/import/incomes')
      .field('markAsPaid', 'true')
      .attach('file', Buffer.from(incomeCsv), 'incomes.csv');
    expect(incomeImport.status).toBe(201);
    expect(incomeImport.body.successCount).toBe(1);

    const savedIncome = await dataSource.getRepository(Income).findOneBy({
      invoiceNum: 'INV-CSV-1',
    });
    expect(savedIncome?.isPaid).toBe(true);
    expect(savedIncome?.paymentDate).not.toBeNull();
  });
});
