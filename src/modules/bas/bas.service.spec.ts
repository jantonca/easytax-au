import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { BasService } from './bas.service';
import { Income } from '../incomes/entities/income.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { MoneyService } from '../../common/services/money.service';

describe('BasService', () => {
  let service: BasService;
  let mockIncomeCreateQueryBuilder: jest.Mock;
  let mockExpenseCreateQueryBuilder: jest.Mock;

  // Mock query builder chain
  const createMockQueryBuilder = (): {
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    innerJoin: jest.Mock;
    getRawOne: jest.Mock;
  } => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  });

  let mockIncomeQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockExpenseQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(async () => {
    mockIncomeQueryBuilder = createMockQueryBuilder();
    mockExpenseQueryBuilder = createMockQueryBuilder();
    mockIncomeCreateQueryBuilder = jest.fn().mockReturnValue(mockIncomeQueryBuilder);
    mockExpenseCreateQueryBuilder = jest.fn().mockReturnValue(mockExpenseQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BasService,
        MoneyService,
        {
          provide: getRepositoryToken(Income),
          useValue: {
            createQueryBuilder: mockIncomeCreateQueryBuilder,
          },
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: {
            createQueryBuilder: mockExpenseCreateQueryBuilder,
          },
        },
      ],
    }).compile();

    service = module.get<BasService>(BasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should inject income repository directly', () => {
      expect(mockIncomeCreateQueryBuilder).toBeDefined();
    });

    it('should inject expense repository directly', () => {
      expect(mockExpenseCreateQueryBuilder).toBeDefined();
    });
  });

  describe('getSummary', () => {
    beforeEach(() => {
      // Default mock returns
      mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
        totalSales: '110000',
        gstCollected: '10000',
        count: '5',
      });
      mockExpenseQueryBuilder.getRawOne.mockResolvedValue({
        gstPaid: '3000',
        count: '10',
      });
    });

    describe('quarter validation', () => {
      it('should throw BadRequestException for invalid quarter', async () => {
        await expect(service.getSummary('Q5', 2025)).rejects.toThrow(BadRequestException);
        await expect(service.getSummary('Q5', 2025)).rejects.toThrow(
          'Invalid quarter "Q5". Must be Q1, Q2, Q3, or Q4.',
        );
      });

      it('should throw BadRequestException for empty quarter', async () => {
        await expect(service.getSummary('', 2025)).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for random string', async () => {
        await expect(service.getSummary('INVALID', 2025)).rejects.toThrow(BadRequestException);
      });

      it.each(['Q1', 'Q2', 'Q3', 'Q4'])('should accept valid quarter %s', async (quarter) => {
        const result = await service.getSummary(quarter, 2025);
        expect(result).toBeDefined();
        expect(result.quarter).toBe(quarter);
      });

      it.each([
        ['q1', 'Q1'],
        ['q2', 'Q2'],
        ['q3', 'Q3'],
        ['q4', 'Q4'],
      ])('should normalize lowercase quarter %s to %s', async (input, expected) => {
        const result = await service.getSummary(input, 2025);
        expect(result).toBeDefined();
        expect(result.quarter).toBe(expected);
      });
    });

    describe('Australian FY quarter date ranges', () => {
      it('should calculate correct dates for Q1 FY2025 (Jul-Sep 2024)', async () => {
        const result = await service.getSummary('Q1', 2025);
        expect(result.periodStart).toBe('2024-07-01');
        expect(result.periodEnd).toBe('2024-09-30');
      });

      it('should calculate correct dates for Q2 FY2025 (Oct-Dec 2024)', async () => {
        const result = await service.getSummary('Q2', 2025);
        expect(result.periodStart).toBe('2024-10-01');
        expect(result.periodEnd).toBe('2024-12-31');
      });

      it('should calculate correct dates for Q3 FY2025 (Jan-Mar 2025)', async () => {
        const result = await service.getSummary('Q3', 2025);
        expect(result.periodStart).toBe('2025-01-01');
        expect(result.periodEnd).toBe('2025-03-31');
      });

      it('should calculate correct dates for Q4 FY2025 (Apr-Jun 2025)', async () => {
        const result = await service.getSummary('Q4', 2025);
        expect(result.periodStart).toBe('2025-04-01');
        expect(result.periodEnd).toBe('2025-06-30');
      });

      it('should handle different financial years correctly', async () => {
        const fy2024 = await service.getSummary('Q1', 2024);
        expect(fy2024.periodStart).toBe('2023-07-01');
        expect(fy2024.periodEnd).toBe('2023-09-30');

        const fy2026 = await service.getSummary('Q1', 2026);
        expect(fy2026.periodStart).toBe('2025-07-01');
        expect(fy2026.periodEnd).toBe('2025-09-30');
      });
    });

    describe('G1 calculation (total sales)', () => {
      it('should sum all income total_cents for the period', async () => {
        mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
          totalSales: '500000', // $5000.00
          gstCollected: '45455',
          count: '3',
        });

        const result = await service.getSummary('Q1', 2025);

        expect(result.g1TotalSalesCents).toBe(500000);
        expect(mockIncomeCreateQueryBuilder).toHaveBeenCalledWith('income');
        expect(mockIncomeQueryBuilder.where).toHaveBeenCalled();
        expect(mockIncomeQueryBuilder.andWhere).toHaveBeenCalled();
      });

      it('should return 0 when no incomes in period', async () => {
        mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
          totalSales: '0',
          gstCollected: '0',
          count: '0',
        });

        const result = await service.getSummary('Q1', 2025);
        expect(result.g1TotalSalesCents).toBe(0);
        expect(result.incomeCount).toBe(0);
      });

      it('should handle null result from query', async () => {
        mockIncomeQueryBuilder.getRawOne.mockResolvedValue(null);

        const result = await service.getSummary('Q1', 2025);
        expect(result.g1TotalSalesCents).toBe(0);
      });
    });

    describe('1A calculation (GST collected)', () => {
      it('should sum all income gst_cents for the period', async () => {
        mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
          totalSales: '110000',
          gstCollected: '10000', // $100.00 GST
          count: '2',
        });

        const result = await service.getSummary('Q1', 2025);
        expect(result.label1aGstCollectedCents).toBe(10000);
      });

      it('should return 0 when no GST collected', async () => {
        mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
          totalSales: '100000',
          gstCollected: '0',
          count: '1',
        });

        const result = await service.getSummary('Q1', 2025);
        expect(result.label1aGstCollectedCents).toBe(0);
      });
    });

    describe('1B calculation (GST paid/claimable)', () => {
      it('should sum expense gst_cents with biz_percent applied', async () => {
        mockExpenseQueryBuilder.getRawOne.mockResolvedValue({
          gstPaid: '5000', // $50.00 claimable GST
          count: '8',
        });

        const result = await service.getSummary('Q1', 2025);

        expect(result.label1bGstPaidCents).toBe(5000);
        expect(mockExpenseCreateQueryBuilder).toHaveBeenCalledWith('expense');
        expect(mockExpenseQueryBuilder.innerJoin).toHaveBeenCalledWith(
          'expense.provider',
          'provider',
        );
      });

      it('should only include domestic providers (is_international = false)', async () => {
        await service.getSummary('Q1', 2025);

        expect(mockExpenseQueryBuilder.andWhere).toHaveBeenCalledWith(
          'provider.is_international = :isInternational',
          { isInternational: false },
        );
      });

      it('should return 0 when no claimable expenses', async () => {
        mockExpenseQueryBuilder.getRawOne.mockResolvedValue({
          gstPaid: '0',
          count: '0',
        });

        const result = await service.getSummary('Q1', 2025);
        expect(result.label1bGstPaidCents).toBe(0);
      });

      it('should handle null result from query', async () => {
        mockExpenseQueryBuilder.getRawOne.mockResolvedValue(null);

        const result = await service.getSummary('Q1', 2025);
        expect(result.label1bGstPaidCents).toBe(0);
      });
    });

    describe('net GST calculation', () => {
      it('should calculate net GST payable (1A - 1B)', async () => {
        mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
          totalSales: '110000',
          gstCollected: '10000', // $100.00 collected
          count: '1',
        });
        mockExpenseQueryBuilder.getRawOne.mockResolvedValue({
          gstPaid: '3000', // $30.00 paid
          count: '3',
        });

        const result = await service.getSummary('Q1', 2025);
        expect(result.netGstPayableCents).toBe(7000); // $70.00 to pay ATO
      });

      it('should return negative when refund is due (1B > 1A)', async () => {
        mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
          totalSales: '22000',
          gstCollected: '2000', // $20.00 collected
          count: '1',
        });
        mockExpenseQueryBuilder.getRawOne.mockResolvedValue({
          gstPaid: '5000', // $50.00 paid
          count: '5',
        });

        const result = await service.getSummary('Q1', 2025);
        expect(result.netGstPayableCents).toBe(-3000); // $30.00 refund due
      });

      it('should return 0 when GST collected equals GST paid', async () => {
        mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
          totalSales: '55000',
          gstCollected: '5000',
          count: '2',
        });
        mockExpenseQueryBuilder.getRawOne.mockResolvedValue({
          gstPaid: '5000',
          count: '4',
        });

        const result = await service.getSummary('Q1', 2025);
        expect(result.netGstPayableCents).toBe(0);
      });
    });

    describe('counts', () => {
      it('should return correct income count', async () => {
        mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
          totalSales: '100000',
          gstCollected: '9091',
          count: '7',
        });

        const result = await service.getSummary('Q1', 2025);
        expect(result.incomeCount).toBe(7);
      });

      it('should return correct expense count', async () => {
        mockExpenseQueryBuilder.getRawOne.mockResolvedValue({
          gstPaid: '5000',
          count: '15',
        });

        const result = await service.getSummary('Q1', 2025);
        expect(result.expenseCount).toBe(15);
      });
    });

    describe('complete summary output', () => {
      it('should return all required fields', async () => {
        mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
          totalSales: '110000',
          gstCollected: '10000',
          count: '2',
        });
        mockExpenseQueryBuilder.getRawOne.mockResolvedValue({
          gstPaid: '3000',
          count: '5',
        });

        const result = await service.getSummary('Q1', 2025);

        expect(result).toEqual({
          quarter: 'Q1',
          financialYear: 2025,
          periodStart: '2024-07-01',
          periodEnd: '2024-09-30',
          g1TotalSalesCents: 110000,
          label1aGstCollectedCents: 10000,
          label1bGstPaidCents: 3000,
          netGstPayableCents: 7000,
          incomeCount: 2,
          expenseCount: 5,
        });
      });
    });
  });

  describe('getQuartersForYear', () => {
    it('should return all 4 quarters with correct date ranges', () => {
      const quarters = service.getQuartersForYear(2025);

      expect(quarters).toHaveLength(4);
      expect(quarters).toEqual([
        { quarter: 'Q1', start: '2024-07-01', end: '2024-09-30' },
        { quarter: 'Q2', start: '2024-10-01', end: '2024-12-31' },
        { quarter: 'Q3', start: '2025-01-01', end: '2025-03-31' },
        { quarter: 'Q4', start: '2025-04-01', end: '2025-06-30' },
      ]);
    });

    it('should work for different financial years', () => {
      const fy2024 = service.getQuartersForYear(2024);
      expect(fy2024[0].start).toBe('2023-07-01');
      expect(fy2024[3].end).toBe('2024-06-30');

      const fy2030 = service.getQuartersForYear(2030);
      expect(fy2030[0].start).toBe('2029-07-01');
      expect(fy2030[3].end).toBe('2030-06-30');
    });
  });

  describe('edge cases', () => {
    it('should handle very large amounts without overflow', async () => {
      mockIncomeQueryBuilder.getRawOne.mockResolvedValue({
        totalSales: '999999999999', // ~$10 billion
        gstCollected: '90909090909',
        count: '1000',
      });
      mockExpenseQueryBuilder.getRawOne.mockResolvedValue({
        gstPaid: '45454545454',
        count: '500',
      });

      const result = await service.getSummary('Q1', 2025);

      expect(result.g1TotalSalesCents).toBe(999999999999);
      expect(result.label1aGstCollectedCents).toBe(90909090909);
      expect(result.label1bGstPaidCents).toBe(45454545454);
      expect(result.netGstPayableCents).toBe(45454545455);
    });

    it('should execute both income and expense queries', async () => {
      await service.getSummary('Q1', 2025);

      expect(mockIncomeCreateQueryBuilder).toHaveBeenCalledWith('income');
      expect(mockExpenseCreateQueryBuilder).toHaveBeenCalledWith('expense');
    });
  });
});
