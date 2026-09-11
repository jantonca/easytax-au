import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CsvImportController } from './csv-import.controller';
import { CsvImportService } from './csv-import.service';
import { IncomeCsvImportService } from './income-csv-import.service';
import {
  CsvImportOptions,
  CsvImportResult,
  IncomeCsvImportOptions,
  IncomeCsvImportResult,
} from './csv-import.types';

/**
 * Controller-level regression for the CSV import boolean options.
 *
 * These tests exercise the real HTTP multipart/JSON transformation path with
 * the same ValidationPipe configuration as main.ts, because the multipart
 * form fields arrive as strings and must survive the boolean coercion.
 */

const EXPENSE_CSV = 'Date,Item,Total,GST\n2026-07-15,Internet,$88.00,$8.00\n';
const INCOME_CSV = 'Client,Invoice #,Subtotal,GST,Total\nAcme Corp,INV-001,$1000,$100,$1100\n';

const cannedExpenseResult = (importJobId: string | null): CsvImportResult => ({
  importJobId: importJobId ?? '',
  totalRows: 1,
  successCount: 1,
  failedCount: 0,
  duplicateCount: 0,
  totalAmountCents: 8800,
  totalGstCents: 800,
  processingTimeMs: 1,
  rows: [],
});

const cannedIncomeResult = (importJobId: string | null): IncomeCsvImportResult => ({
  importJobId: importJobId,
  totalRows: 1,
  successCount: 1,
  failedCount: 0,
  duplicateCount: 0,
  warningCount: 0,
  totalSubtotalCents: 100000,
  totalGstCents: 10000,
  totalAmountCents: 110000,
  processingTimeMs: 1,
  rows: [],
});

describe('CsvImportController boolean options (HTTP path)', () => {
  let app: INestApplication;
  let importFromBuffer: jest.Mock;
  let importFromString: jest.Mock;
  let importIncomeFromBuffer: jest.Mock;
  let importIncomeFromString: jest.Mock;

  const lastExpenseOptions = (): CsvImportOptions | undefined =>
    (importFromBuffer.mock.calls.at(-1)?.[1] as CsvImportOptions | undefined) ??
    (importFromString.mock.calls.at(-1)?.[1] as CsvImportOptions | undefined);

  const lastIncomeOptions = (): IncomeCsvImportOptions | undefined =>
    (importIncomeFromBuffer.mock.calls.at(-1)?.[1] as IncomeCsvImportOptions | undefined) ??
    (importIncomeFromString.mock.calls.at(-1)?.[1] as IncomeCsvImportOptions | undefined);

  beforeAll(async () => {
    importFromBuffer = jest.fn().mockResolvedValue(cannedExpenseResult(null));
    importFromString = jest.fn().mockResolvedValue(cannedExpenseResult(null));
    importIncomeFromBuffer = jest.fn().mockResolvedValue(cannedIncomeResult(null));
    importIncomeFromString = jest.fn().mockResolvedValue(cannedIncomeResult(null));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CsvImportController],
      providers: [
        { provide: CsvImportService, useValue: { importFromBuffer, importFromString } },
        {
          provide: IncomeCsvImportService,
          useValue: {
            importFromBuffer: importIncomeFromBuffer,
            importFromString: importIncomeFromString,
          },
        },
      ],
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /import/expenses multipart dryRun', () => {
    it('honours dryRun=true without writes', async () => {
      const res = await request(app.getHttpServer())
        .post('/import/expenses')
        .field('dryRun', 'true')
        .attach('file', Buffer.from(EXPENSE_CSV), 'test.csv');
      expect(res.status).toBe(201);
      expect(lastExpenseOptions()?.dryRun).toBe(true);
    });

    it('honours dryRun=false', async () => {
      const res = await request(app.getHttpServer())
        .post('/import/expenses')
        .field('dryRun', 'false')
        .attach('file', Buffer.from(EXPENSE_CSV), 'test.csv');
      expect(res.status).toBe(201);
      expect(lastExpenseOptions()?.dryRun).toBe(false);
    });

    it('defaults dryRun to false when omitted', async () => {
      const res = await request(app.getHttpServer())
        .post('/import/expenses')
        .attach('file', Buffer.from(EXPENSE_CSV), 'test.csv');
      expect(res.status).toBe(201);
      expect(lastExpenseOptions()?.dryRun).toBe(false);
    });

    it.each([
      ['1', true],
      ['0', false],
    ])('supports numeric boolean string %s', async (value, expected) => {
      await request(app.getHttpServer())
        .post('/import/expenses')
        .field('dryRun', value)
        .attach('file', Buffer.from(EXPENSE_CSV), 'test.csv');
      expect(lastExpenseOptions()?.dryRun).toBe(expected);
    });

    it('rejects invalid boolean strings', async () => {
      const res = await request(app.getHttpServer())
        .post('/import/expenses')
        .field('dryRun', 'maybe')
        .attach('file', Buffer.from(EXPENSE_CSV), 'test.csv');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /import/expenses multipart skipDuplicates', () => {
    it('honours skipDuplicates=false', async () => {
      await request(app.getHttpServer())
        .post('/import/expenses')
        .field('skipDuplicates', 'false')
        .attach('file', Buffer.from(EXPENSE_CSV), 'test.csv');
      expect(lastExpenseOptions()?.skipDuplicates).toBe(false);
    });

    it('honours skipDuplicates=true', async () => {
      await request(app.getHttpServer())
        .post('/import/expenses')
        .field('skipDuplicates', 'true')
        .attach('file', Buffer.from(EXPENSE_CSV), 'test.csv');
      expect(lastExpenseOptions()?.skipDuplicates).toBe(true);
    });

    it('rejects invalid skipDuplicates strings', async () => {
      const res = await request(app.getHttpServer())
        .post('/import/expenses')
        .field('skipDuplicates', 'sometimes')
        .attach('file', Buffer.from(EXPENSE_CSV), 'test.csv');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /import/expenses/content JSON body', () => {
    it('honours dryRun=true in JSON', async () => {
      await request(app.getHttpServer())
        .post('/import/expenses/content')
        .send({ content: EXPENSE_CSV, dryRun: true });
      expect(lastExpenseOptions()?.dryRun).toBe(true);
    });

    it('honours dryRun=false in JSON', async () => {
      await request(app.getHttpServer())
        .post('/import/expenses/content')
        .send({ content: EXPENSE_CSV, dryRun: false });
      expect(lastExpenseOptions()?.dryRun).toBe(false);
    });

    it('rejects invalid dryRun in JSON', async () => {
      const res = await request(app.getHttpServer())
        .post('/import/expenses/content')
        .send({ content: EXPENSE_CSV, dryRun: 'nope' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /import/incomes multipart boolean options', () => {
    it('honours dryRun=true without writes', async () => {
      await request(app.getHttpServer())
        .post('/import/incomes')
        .field('dryRun', 'true')
        .attach('file', Buffer.from(INCOME_CSV), 'incomes.csv');
      expect(lastIncomeOptions()?.dryRun).toBe(true);
    });

    it('honours dryRun=false', async () => {
      await request(app.getHttpServer())
        .post('/import/incomes')
        .field('dryRun', 'false')
        .attach('file', Buffer.from(INCOME_CSV), 'incomes.csv');
      expect(lastIncomeOptions()?.dryRun).toBe(false);
    });

    it('defaults dryRun to false when omitted', async () => {
      await request(app.getHttpServer())
        .post('/import/incomes')
        .attach('file', Buffer.from(INCOME_CSV), 'incomes.csv');
      expect(lastIncomeOptions()?.dryRun).toBe(false);
    });

    it('honours markAsPaid=true', async () => {
      await request(app.getHttpServer())
        .post('/import/incomes')
        .field('markAsPaid', 'true')
        .attach('file', Buffer.from(INCOME_CSV), 'incomes.csv');
      expect(lastIncomeOptions()?.markAsPaid).toBe(true);
    });

    it('honours markAsPaid=false', async () => {
      await request(app.getHttpServer())
        .post('/import/incomes')
        .field('markAsPaid', 'false')
        .attach('file', Buffer.from(INCOME_CSV), 'incomes.csv');
      expect(lastIncomeOptions()?.markAsPaid).toBe(false);
    });

    it('rejects invalid markAsPaid strings', async () => {
      const res = await request(app.getHttpServer())
        .post('/import/incomes')
        .field('markAsPaid', 'certainly')
        .attach('file', Buffer.from(INCOME_CSV), 'incomes.csv');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /import/incomes/content JSON body', () => {
    it('honours markAsPaid in JSON', async () => {
      await request(app.getHttpServer())
        .post('/import/incomes/content')
        .send({ content: INCOME_CSV, markAsPaid: true });
      expect(lastIncomeOptions()?.markAsPaid).toBe(true);
    });

    it('rejects invalid markAsPaid in JSON', async () => {
      const res = await request(app.getHttpServer())
        .post('/import/incomes/content')
        .send({ content: INCOME_CSV, markAsPaid: 'maybe' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /import/expenses/preview and /import/incomes/preview', () => {
    it('preview endpoints always import without writes', async () => {
      await request(app.getHttpServer())
        .post('/import/expenses/preview')
        .attach('file', Buffer.from(EXPENSE_CSV), 'test.csv');
      expect(lastExpenseOptions()?.dryRun).toBe(true);

      await request(app.getHttpServer())
        .post('/import/incomes/preview')
        .field('dryRun', 'false')
        .attach('file', Buffer.from(INCOME_CSV), 'incomes.csv');
      expect(lastIncomeOptions()?.dryRun).toBe(true);
    });
  });
});
