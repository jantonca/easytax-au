import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { IncomeCsvImportService } from './income-csv-import.service';
import { ClientMatcherService } from './client-matcher.service';
import { Client } from '../clients/entities/client.entity';
import { Income } from '../incomes/entities/income.entity';
import { ImportJob, ImportStatus, ImportSource } from '../import-jobs/entities/import-job.entity';
import { MoneyService } from '../../common/services/money.service';

describe('IncomeCsvImportService', () => {
  let service: IncomeCsvImportService;
  let incomeRepo: Repository<Income>;
  let importJobRepo: Repository<ImportJob>;
  let dataSource: DataSource;

  // Mock clients
  const mockClients: Partial<Client>[] = [
    { id: 'client-1', name: 'Aida Tomescu' },
    { id: 'client-2', name: 'John Smith' },
    { id: 'client-3', name: 'Acme Corporation Pty Ltd' },
  ];

  // Mock import job
  const mockImportJob: Partial<ImportJob> = {
    id: 'import-job-1',
    source: ImportSource.MANUAL,
    filename: 'test.csv',
    status: ImportStatus.PENDING,
    totalRows: 0,
    importedCount: 0,
    errorCount: 0,
  };

  const mockDataSource = {
    transaction: jest
      .fn()
      .mockImplementation(async <T>(callback: (manager: unknown) => Promise<T>): Promise<T> => {
        const mockManager = {
          create: jest.fn().mockImplementation((_entity: unknown, data: unknown) => data),
          save: jest.fn().mockImplementation((entities: unknown) => entities),
        };
        return callback(mockManager);
      }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeCsvImportService,
        ClientMatcherService,
        MoneyService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            find: jest.fn().mockResolvedValue(mockClients),
          },
        },
        {
          provide: getRepositoryToken(Income),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(ImportJob),
          useValue: {
            create: jest.fn().mockReturnValue(mockImportJob),
            save: jest.fn().mockResolvedValue(mockImportJob),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
      ],
    }).compile();

    service = module.get<IncomeCsvImportService>(IncomeCsvImportService);
    incomeRepo = module.get<Repository<Income>>(getRepositoryToken(Income));
    importJobRepo = module.get<Repository<ImportJob>>(getRepositoryToken(ImportJob));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('importFromString', () => {
    const validCsv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$560,$56,$616
John Smith,2,$1000,$100,$1100`;

    it('should import valid CSV successfully', async () => {
      const result = await service.importFromString(validCsv, {});

      expect(result.totalRows).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.importJobId).toBe('import-job-1');
    });

    it('should calculate correct totals', async () => {
      const result = await service.importFromString(validCsv, {});

      // Aida: $560 + John: $1000 = $1560 subtotal
      expect(result.totalSubtotalCents).toBe(156000);
      // Aida: $56 + John: $100 = $156 GST
      expect(result.totalGstCents).toBe(15600);
      // Aida: $616 + John: $1100 = $1716 total
      expect(result.totalAmountCents).toBe(171600);
    });

    it('should create import job', async () => {
      await service.importFromString(validCsv, {});

      expect(importJobRepo.create).toHaveBeenCalled();
      expect(importJobRepo.save).toHaveBeenCalled();
    });

    it('should update import job with final status', async () => {
      await service.importFromString(validCsv, {});

      expect(importJobRepo.update).toHaveBeenCalledWith(
        'import-job-1',
        expect.objectContaining({
          status: ImportStatus.COMPLETED,
          importedCount: 2,
          errorCount: 0,
        }),
      );
    });
  });

  describe('dry run mode', () => {
    const validCsv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$560,$56,$616`;

    it('should not create incomes in dry run mode', async () => {
      const result = await service.importFromString(validCsv, { dryRun: true });

      expect(result.successCount).toBe(1);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should still return row results in dry run', async () => {
      const result = await service.importFromString(validCsv, { dryRun: true });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].success).toBe(true);
      expect(result.rows[0].incomeData).toBeDefined();
    });
  });

  describe('client matching', () => {
    it('should fail row when client not found', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Unknown Client,1,$100,$10,$110`;

      const result = await service.importFromString(csv, {});

      expect(result.failedCount).toBe(1);
      expect(result.rows[0].success).toBe(false);
      expect(result.rows[0].error).toContain('No matching client found');
    });

    it('should match client with fuzzy matching', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu updates,1,$100,$10,$110`;

      const result = await service.importFromString(csv, {});

      expect(result.successCount).toBe(1);
      expect(result.rows[0].clientMatch?.clientName).toBe('Aida Tomescu');
    });

    it('should match client after normalization (Pty Ltd)', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Acme Corporation,1,$100,$10,$110`;

      const result = await service.importFromString(csv, {});

      expect(result.successCount).toBe(1);
      expect(result.rows[0].clientMatch?.clientName).toBe('Acme Corporation Pty Ltd');
    });

    it('should respect match threshold', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
AidaTom,1,$100,$10,$110`;

      // With high threshold, should fail
      const result = await service.importFromString(csv, { matchThreshold: 0.95 });

      expect(result.failedCount).toBe(1);
    });
  });

  describe('total validation', () => {
    it('should warn when Total does not match Subtotal + GST', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$100,$10,$120`; // Wrong: $100 + $10 = $110, not $120

      const result = await service.importFromString(csv, {});

      expect(result.successCount).toBe(1);
      expect(result.warningCount).toBe(1);
      expect(result.rows[0].warning).toContain('Total mismatch');
      // Should use calculated value ($110), not CSV value ($120)
      expect(result.rows[0].incomeData?.totalCents).toBe(11000);
    });

    it('should not warn when Total matches', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$100,$10,$110`;

      const result = await service.importFromString(csv, {});

      expect(result.warningCount).toBe(0);
      expect(result.rows[0].warning).toBeUndefined();
    });
  });

  describe('duplicate detection', () => {
    it('should detect duplicate by invoice number', async () => {
      (incomeRepo.findOne as jest.Mock).mockResolvedValueOnce({ id: 'existing-income' });

      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,INV-001,$100,$10,$110`;

      const result = await service.importFromString(csv, {});

      expect(result.failedCount).toBe(1);
      expect(result.duplicateCount).toBe(1);
      expect(result.rows[0].isDuplicate).toBe(true);
    });

    it('should detect duplicate by date + amount + client', async () => {
      // When no invoice number, only one findOne call is made (by date+amount+client)
      (incomeRepo.findOne as jest.Mock).mockResolvedValueOnce({ id: 'existing-income' });

      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,,$100,$10,$110`;

      const result = await service.importFromString(csv, {});

      expect(result.duplicateCount).toBe(1);
      expect(result.rows[0].isDuplicate).toBe(true);
    });

    it('should skip duplicate detection when option is false', async () => {
      (incomeRepo.findOne as jest.Mock).mockResolvedValue({ id: 'existing-income' });

      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,INV-001,$100,$10,$110`;

      const result = await service.importFromString(csv, { skipDuplicates: false });

      expect(result.successCount).toBe(1);
      expect(incomeRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('currency parsing', () => {
    it('should handle dollar signs', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$100.00,$10.00,$110.00`;

      const result = await service.importFromString(csv, {});

      expect(result.rows[0].incomeData?.subtotalCents).toBe(10000);
      expect(result.rows[0].incomeData?.gstCents).toBe(1000);
    });

    it('should handle amounts without dollar signs', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,100,10,110`;

      const result = await service.importFromString(csv, {});

      expect(result.rows[0].incomeData?.subtotalCents).toBe(10000);
    });

    it('should handle comma separators', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,"$1,000.00","$100.00","$1,100.00"`;

      const result = await service.importFromString(csv, {});

      expect(result.rows[0].incomeData?.subtotalCents).toBe(100000);
    });

    it('should handle cents correctly', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$99.99,$9.99,$109.98`;

      const result = await service.importFromString(csv, {});

      expect(result.rows[0].incomeData?.subtotalCents).toBe(9999);
      expect(result.rows[0].incomeData?.gstCents).toBe(999);
    });
  });

  describe('date parsing', () => {
    it('should use default date when not in CSV', async () => {
      const defaultDate = new Date('2025-06-15');
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$100,$10,$110`;

      const result = await service.importFromString(csv, { defaultDate });

      expect(result.rows[0].incomeData?.date).toEqual(defaultDate);
    });

    it('should use today when no default date provided', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$100,$10,$110`;

      const result = await service.importFromString(csv, {});

      expect(result.rows[0].incomeData?.date).toBeInstanceOf(Date);
    });
  });

  describe('markAsPaid option', () => {
    it('should set isPaid to true when option is set', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$100,$10,$110`;

      const result = await service.importFromString(csv, { markAsPaid: true });

      expect(result.rows[0].incomeData?.isPaid).toBe(true);
    });

    it('should default isPaid to false', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$100,$10,$110`;

      const result = await service.importFromString(csv, {});

      expect(result.rows[0].incomeData?.isPaid).toBe(false);
    });
  });

  describe('empty CSV handling', () => {
    it('should throw error for empty CSV', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total`;

      await expect(service.importFromString(csv, {})).rejects.toThrow(
        'CSV file contains no valid data rows',
      );
    });

    it('should skip empty rows', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$100,$10,$110

John Smith,2,$200,$20,$220`;

      const result = await service.importFromString(csv, {});

      expect(result.totalRows).toBe(2);
      expect(result.successCount).toBe(2);
    });
  });

  describe('importFromBuffer', () => {
    it('should convert buffer to string and import', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$100,$10,$110`;
      const buffer = Buffer.from(csv, 'utf-8');

      const result = await service.importFromBuffer(buffer, {});

      expect(result.successCount).toBe(1);
    });
  });

  describe('previewImport', () => {
    it('should run in dry run mode', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu,1,$100,$10,$110`;

      const result = await service.previewImport(csv, {});

      expect(result.successCount).toBe(1);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('real-world CSV format', () => {
    it('should handle the exact format from user spreadsheet', async () => {
      const csv = `Client,Invoice #,Subtotal,GST,Total
Aida Tomescu updates,9,$560,$56,$616.00
John Smith,10,$1000,$100,$1100`;

      const result = await service.importFromString(csv, {});

      expect(result.successCount).toBe(2);
      expect(result.rows[0].clientMatch?.clientName).toBe('Aida Tomescu');
      expect(result.rows[0].incomeData?.subtotalCents).toBe(56000);
      expect(result.rows[0].incomeData?.gstCents).toBe(5600);
      expect(result.rows[0].incomeData?.invoiceNum).toBe('9');
    });
  });
});
