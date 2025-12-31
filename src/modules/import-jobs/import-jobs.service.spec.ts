import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ImportJobsService } from './import-jobs.service';
import { ImportJob, ImportSource, ImportStatus } from './entities/import-job.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { CreateImportJobDto } from './dto/create-import-job.dto';
import { UpdateImportJobDto } from './dto/update-import-job.dto';

describe('ImportJobsService', () => {
  let service: ImportJobsService;
  let importJobRepository: jest.Mocked<Repository<ImportJob>>;
  let expenseRepository: jest.Mocked<Repository<Expense>>;

  const mockImportJob: ImportJob = {
    id: 'job-uuid-1',
    filename: 'commbank-2025-01.csv',
    source: ImportSource.COMMBANK,
    status: ImportStatus.PENDING,
    totalRows: 100,
    importedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    completedAt: null,
    errorMessage: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockCompletedJob: ImportJob = {
    ...mockImportJob,
    id: 'job-uuid-2',
    status: ImportStatus.COMPLETED,
    importedCount: 95,
    skippedCount: 3,
    errorCount: 2,
    completedAt: new Date('2025-01-01'),
  };

  const mockRolledBackJob: ImportJob = {
    ...mockImportJob,
    id: 'job-uuid-3',
    status: ImportStatus.ROLLED_BACK,
    completedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const mockImportJobRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      remove: jest.fn(),
    };

    const mockExpenseRepo = {
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportJobsService,
        {
          provide: getRepositoryToken(ImportJob),
          useValue: mockImportJobRepo,
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepo,
        },
      ],
    }).compile();

    service = module.get<ImportJobsService>(ImportJobsService);
    importJobRepository = module.get(getRepositoryToken(ImportJob));
    expenseRepository = module.get(getRepositoryToken(Expense));
  });

  describe('create', () => {
    it('should create an import job with minimal data', async () => {
      const dto: CreateImportJobDto = {
        filename: 'test.csv',
      };

      importJobRepository.create.mockReturnValue({
        ...mockImportJob,
        filename: dto.filename,
        source: ImportSource.MANUAL,
      } as ImportJob);
      importJobRepository.save.mockResolvedValue({
        ...mockImportJob,
        filename: dto.filename,
        source: ImportSource.MANUAL,
      } as ImportJob);

      const result = await service.create(dto);

      expect(result.filename).toBe('test.csv');
      expect(importJobRepository.create).toHaveBeenCalledWith(dto);
      expect(importJobRepository.save).toHaveBeenCalled();
    });

    it('should create an import job with source specified', async () => {
      const dto: CreateImportJobDto = {
        filename: 'commbank-export.csv',
        source: ImportSource.COMMBANK,
      };

      importJobRepository.create.mockReturnValue({
        ...mockImportJob,
        ...dto,
      } as ImportJob);
      importJobRepository.save.mockResolvedValue({
        ...mockImportJob,
        ...dto,
      } as ImportJob);

      const result = await service.create(dto);

      expect(result.source).toBe(ImportSource.COMMBANK);
    });
  });

  describe('findAll', () => {
    it('should return paginated import jobs', async () => {
      const jobs = [mockImportJob, mockCompletedJob];
      importJobRepository.findAndCount.mockResolvedValue([jobs, 2]);

      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(importJobRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination correctly', async () => {
      importJobRepository.findAndCount.mockResolvedValue([[], 100]);

      const result = await service.findAll(3, 10);

      expect(result.page).toBe(3);
      expect(importJobRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 20, // (3-1) * 10
        take: 10,
      });
    });

    it('should use default pagination values', async () => {
      importJobRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll();

      expect(importJobRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return an import job by ID', async () => {
      importJobRepository.findOne.mockResolvedValue(mockImportJob);

      const result = await service.findOne('job-uuid-1');

      expect(result).toEqual(mockImportJob);
      expect(importJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'job-uuid-1' },
      });
    });

    it('should throw NotFoundException when import job not found', async () => {
      importJobRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneWithExpenses', () => {
    it('should return import job with expenses loaded', async () => {
      const jobWithExpenses = { ...mockImportJob, expenses: [] };
      importJobRepository.findOne.mockResolvedValue(jobWithExpenses);

      const result = await service.findOneWithExpenses('job-uuid-1');

      expect(result.expenses).toBeDefined();
      expect(importJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'job-uuid-1' },
        relations: ['expenses'],
      });
    });

    it('should throw NotFoundException when not found', async () => {
      importJobRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneWithExpenses('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an import job', async () => {
      const dto: UpdateImportJobDto = {
        totalRows: 150,
        status: ImportStatus.COMPLETED,
      };

      importJobRepository.findOne.mockResolvedValue({ ...mockImportJob });
      importJobRepository.save.mockResolvedValue({
        ...mockImportJob,
        ...dto,
      } as ImportJob);

      const result = await service.update('job-uuid-1', dto);

      expect(result.totalRows).toBe(150);
      expect(result.status).toBe(ImportStatus.COMPLETED);
    });

    it('should throw NotFoundException when updating non-existent job', async () => {
      importJobRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', { totalRows: 10 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markCompleted', () => {
    it('should mark import job as completed with counts', async () => {
      importJobRepository.findOne.mockResolvedValue({ ...mockImportJob });
      importJobRepository.save.mockImplementation(async (job) => job as ImportJob);

      const result = await service.markCompleted('job-uuid-1', {
        importedCount: 95,
        skippedCount: 3,
        errorCount: 2,
      });

      expect(result.status).toBe(ImportStatus.COMPLETED);
      expect(result.importedCount).toBe(95);
      expect(result.skippedCount).toBe(3);
      expect(result.errorCount).toBe(2);
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('markFailed', () => {
    it('should mark import job as failed with error message', async () => {
      importJobRepository.findOne.mockResolvedValue({ ...mockImportJob });
      importJobRepository.save.mockImplementation(async (job) => job as ImportJob);

      const result = await service.markFailed('job-uuid-1', 'Invalid CSV format');

      expect(result.status).toBe(ImportStatus.FAILED);
      expect(result.errorMessage).toBe('Invalid CSV format');
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('rollback', () => {
    it('should delete all expenses and mark job as rolled back', async () => {
      importJobRepository.findOne.mockResolvedValue({ ...mockCompletedJob });
      expenseRepository.delete.mockResolvedValue({ affected: 95, raw: [] });
      importJobRepository.save.mockImplementation(async (job) => job as ImportJob);

      const result = await service.rollback('job-uuid-2');

      expect(result.deletedCount).toBe(95);
      expect(expenseRepository.delete).toHaveBeenCalledWith({
        importJobId: 'job-uuid-2',
      });
    });

    it('should throw BadRequestException when job already rolled back', async () => {
      importJobRepository.findOne.mockResolvedValue({ ...mockRolledBackJob });

      await expect(service.rollback('job-uuid-3')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when job not found', async () => {
      importJobRepository.findOne.mockResolvedValue(null);

      await expect(service.rollback('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should handle rollback with zero expenses', async () => {
      importJobRepository.findOne.mockResolvedValue({ ...mockImportJob });
      expenseRepository.delete.mockResolvedValue({ affected: 0, raw: [] });
      importJobRepository.save.mockImplementation(async (job) => job as ImportJob);

      const result = await service.rollback('job-uuid-1');

      expect(result.deletedCount).toBe(0);
    });
  });

  describe('remove', () => {
    it('should delete an import job with no expenses', async () => {
      importJobRepository.findOne.mockResolvedValue({ ...mockImportJob });
      expenseRepository.count.mockResolvedValue(0);

      await service.remove('job-uuid-1');

      expect(importJobRepository.remove).toHaveBeenCalledWith(mockImportJob);
    });

    it('should throw BadRequestException when job has expenses', async () => {
      importJobRepository.findOne.mockResolvedValue({ ...mockCompletedJob });
      expenseRepository.count.mockResolvedValue(95);

      await expect(service.remove('job-uuid-2')).rejects.toThrow(BadRequestException);
      expect(importJobRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when job not found', async () => {
      importJobRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for an import job', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalExpenses: '95',
          totalAmountCents: '1000000',
          totalGstCents: '90909',
        }),
      };
      expenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as never);

      const result = await service.getStatistics('job-uuid-1');

      expect(result.totalExpenses).toBe(95);
      expect(result.totalAmountCents).toBe(1000000);
      expect(result.totalGstCents).toBe(90909);
    });

    it('should return zeros for import job with no expenses', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalExpenses: '0',
          totalAmountCents: '0',
          totalGstCents: '0',
        }),
      };
      expenseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as never);

      const result = await service.getStatistics('job-uuid-1');

      expect(result.totalExpenses).toBe(0);
      expect(result.totalAmountCents).toBe(0);
      expect(result.totalGstCents).toBe(0);
    });
  });

  describe('ImportSource enum coverage', () => {
    it.each([
      [ImportSource.COMMBANK, 'commbank'],
      [ImportSource.NAB, 'nab'],
      [ImportSource.WESTPAC, 'westpac'],
      [ImportSource.ANZ, 'anz'],
      [ImportSource.MANUAL, 'manual'],
      [ImportSource.OTHER, 'other'],
    ])('should handle source %s', async (source, expectedValue) => {
      const dto: CreateImportJobDto = {
        filename: 'test.csv',
        source,
      };

      importJobRepository.create.mockReturnValue({
        ...mockImportJob,
        source,
      } as ImportJob);
      importJobRepository.save.mockResolvedValue({
        ...mockImportJob,
        source,
      } as ImportJob);

      const result = await service.create(dto);

      expect(result.source).toBe(expectedValue);
    });
  });

  describe('ImportStatus enum coverage', () => {
    it.each([
      ImportStatus.PENDING,
      ImportStatus.COMPLETED,
      ImportStatus.ROLLED_BACK,
      ImportStatus.FAILED,
    ])('should handle status %s', async (status) => {
      const jobWithStatus = { ...mockImportJob, status };
      importJobRepository.findOne.mockResolvedValue(jobWithStatus);

      const result = await service.findOne('job-uuid-1');

      expect(result.status).toBe(status);
    });
  });
});
