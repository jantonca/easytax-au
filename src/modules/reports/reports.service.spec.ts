import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Income } from '../incomes/entities/income.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Category } from '../categories/entities/category.entity';
import { FYService } from '../../common/services/fy.service';
import { MoneyService } from '../../common/services/money.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let incomeRepository: jest.Mocked<Repository<Income>>;
  let expenseRepository: jest.Mocked<Repository<Expense>>;

  // Mock query builder chain
  const createMockQueryBuilder = (): Record<string, jest.Mock> => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  });

  beforeEach(async () => {
    const mockIncomeQueryBuilder = createMockQueryBuilder();
    const mockExpenseQueryBuilder = createMockQueryBuilder();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        FYService,
        MoneyService,
        {
          provide: getRepositoryToken(Income),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockIncomeQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockExpenseQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    incomeRepository = module.get(getRepositoryToken(Income));
    expenseRepository = module.get(getRepositoryToken(Expense));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFYSummary', () => {
    describe('validation', () => {
      it('should throw BadRequestException for year before 2000', async () => {
        await expect(service.getFYSummary(1999)).rejects.toThrow(BadRequestException);
        await expect(service.getFYSummary(1999)).rejects.toThrow(/Invalid financial year/);
      });

      it('should throw BadRequestException for year too far in future', async () => {
        const futureYear = new Date().getFullYear() + 10;
        await expect(service.getFYSummary(futureYear)).rejects.toThrow(BadRequestException);
      });

      it('should accept valid year 2026', async () => {
        // Setup mocks to return empty data
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          gst: '0',
          count: '0',
        });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          count: '0',
          gstPaid: '0',
        });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);
        expect(result.financialYear).toBe(2026);
      });
    });

    describe('FY date range', () => {
      beforeEach(() => {
        // Setup default mocks
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          gst: '0',
          count: '0',
        });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          count: '0',
          gstPaid: '0',
        });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);
      });

      it('should return correct period for FY2026 (Jul 2025 - Jun 2026)', async () => {
        const result = await service.getFYSummary(2026);

        expect(result.periodStart).toBe('2025-07-01');
        expect(result.periodEnd).toBe('2026-06-30');
        expect(result.fyLabel).toBe('FY2026');
      });

      it('should return correct period for FY2025 (Jul 2024 - Jun 2025)', async () => {
        const result = await service.getFYSummary(2025);

        expect(result.periodStart).toBe('2024-07-01');
        expect(result.periodEnd).toBe('2025-06-30');
        expect(result.fyLabel).toBe('FY2025');
      });
    });

    describe('income summary', () => {
      it('should calculate total income correctly', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        // First call: total income, second call: paid income
        (mockIncomeQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '5500000',
            gst: '500000',
            count: '45',
          })
          .mockResolvedValueOnce({
            total: '5000000',
          });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          count: '0',
          gstPaid: '0',
        });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.income.totalIncomeCents).toBe(5500000);
        expect(result.income.gstCollectedCents).toBe(500000);
        expect(result.income.count).toBe(45);
      });

      it('should calculate paid vs unpaid income', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '5500000',
            gst: '500000',
            count: '45',
          })
          .mockResolvedValueOnce({
            total: '5000000',
          });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          count: '0',
          gstPaid: '0',
        });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.income.paidIncomeCents).toBe(5000000);
        expect(result.income.unpaidIncomeCents).toBe(500000);
      });

      it('should handle zero income', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          gst: '0',
          count: '0',
        });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          count: '0',
          gstPaid: '0',
        });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.income.totalIncomeCents).toBe(0);
        expect(result.income.gstCollectedCents).toBe(0);
        expect(result.income.count).toBe(0);
      });

      it('should handle null results gracefully', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock).mockResolvedValue(null);

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock).mockResolvedValue(null);
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.income.totalIncomeCents).toBe(0);
        expect(result.income.gstCollectedCents).toBe(0);
      });
    });

    describe('expense summary', () => {
      it('should calculate total expenses correctly', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          gst: '0',
          count: '0',
        });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '2200000',
            count: '156',
          })
          .mockResolvedValueOnce({
            gstPaid: '200000',
          });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.expenses.totalExpensesCents).toBe(2200000);
        expect(result.expenses.gstPaidCents).toBe(200000);
        expect(result.expenses.count).toBe(156);
      });

      it('should calculate claimable GST (domestic only with biz_percent)', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          gst: '0',
          count: '0',
        });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '1100000',
            count: '10',
          })
          .mockResolvedValueOnce({
            gstPaid: '50000', // After biz_percent applied
          });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.expenses.gstPaidCents).toBe(50000);
      });
    });

    describe('expenses by category', () => {
      it('should return expenses grouped by category', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          gst: '0',
          count: '0',
        });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          count: '0',
          gstPaid: '0',
        });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([
          {
            categoryId: 1,
            name: 'Software',
            basLabel: '1B',
            totalCents: '500000',
            gstCents: '45454',
            count: '24',
          },
          {
            categoryId: 2,
            name: 'Internet',
            basLabel: '1B',
            totalCents: '120000',
            gstCents: '10909',
            count: '12',
          },
        ]);

        const result = await service.getFYSummary(2026);

        expect(result.expenses.byCategory).toHaveLength(2);
        expect(result.expenses.byCategory[0]).toEqual({
          categoryId: 1,
          name: 'Software',
          basLabel: '1B',
          totalCents: 500000,
          gstCents: 45454,
          count: 24,
        });
        expect(result.expenses.byCategory[1]).toEqual({
          categoryId: 2,
          name: 'Internet',
          basLabel: '1B',
          totalCents: 120000,
          gstCents: 10909,
          count: 12,
        });
      });

      it('should return empty array when no expenses', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          gst: '0',
          count: '0',
        });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          count: '0',
          gstPaid: '0',
        });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.expenses.byCategory).toEqual([]);
      });
    });

    describe('net calculations', () => {
      it('should calculate net profit correctly (income - expenses)', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '5500000',
            gst: '500000',
            count: '45',
          })
          .mockResolvedValueOnce({
            total: '5500000',
          });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '2200000',
            count: '156',
          })
          .mockResolvedValueOnce({
            gstPaid: '200000',
          });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.netProfitCents).toBe(3300000); // 5500000 - 2200000
      });

      it('should calculate negative net profit (loss)', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '1000000',
            gst: '90909',
            count: '5',
          })
          .mockResolvedValueOnce({
            total: '1000000',
          });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '2000000',
            count: '50',
          })
          .mockResolvedValueOnce({
            gstPaid: '181818',
          });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.netProfitCents).toBe(-1000000); // Loss
      });

      it('should calculate net GST payable (GST collected - GST paid)', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '5500000',
            gst: '500000',
            count: '45',
          })
          .mockResolvedValueOnce({
            total: '5500000',
          });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '2200000',
            count: '156',
          })
          .mockResolvedValueOnce({
            gstPaid: '200000',
          });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.netGstPayableCents).toBe(300000); // 500000 - 200000
      });

      it('should calculate negative net GST (refund due)', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '1100000',
            gst: '100000',
            count: '5',
          })
          .mockResolvedValueOnce({
            total: '1100000',
          });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock)
          .mockResolvedValueOnce({
            total: '3300000',
            count: '50',
          })
          .mockResolvedValueOnce({
            gstPaid: '300000',
          });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.netGstPayableCents).toBe(-200000); // Refund due
      });
    });

    describe('empty FY', () => {
      it('should return zeros for empty FY', async () => {
        const mockIncomeQB = incomeRepository.createQueryBuilder();
        (mockIncomeQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          gst: '0',
          count: '0',
        });

        const mockExpenseQB = expenseRepository.createQueryBuilder();
        (mockExpenseQB.getRawOne as jest.Mock).mockResolvedValue({
          total: '0',
          count: '0',
          gstPaid: '0',
        });
        (mockExpenseQB.getRawMany as jest.Mock).mockResolvedValue([]);

        const result = await service.getFYSummary(2026);

        expect(result.income.totalIncomeCents).toBe(0);
        expect(result.income.gstCollectedCents).toBe(0);
        expect(result.expenses.totalExpensesCents).toBe(0);
        expect(result.expenses.gstPaidCents).toBe(0);
        expect(result.netProfitCents).toBe(0);
        expect(result.netGstPayableCents).toBe(0);
      });
    });
  });
});
