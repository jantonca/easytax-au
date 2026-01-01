import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { FYSummaryDto } from './dto/fy-summary.dto';

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: jest.Mocked<ReportsService>;

  const mockFYSummary: FYSummaryDto = {
    financialYear: 2026,
    fyLabel: 'FY2026',
    periodStart: '2025-07-01',
    periodEnd: '2026-06-30',
    income: {
      totalIncomeCents: 5500000,
      paidIncomeCents: 5000000,
      unpaidIncomeCents: 500000,
      gstCollectedCents: 500000,
      count: 45,
    },
    expenses: {
      totalExpensesCents: 2200000,
      gstPaidCents: 200000,
      count: 156,
      byCategory: [
        {
          categoryId: 1,
          name: 'Software',
          basLabel: '1B',
          totalCents: 500000,
          gstCents: 45454,
          count: 24,
        },
      ],
    },
    netProfitCents: 3300000,
    netGstPayableCents: 300000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            getFYSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFYSummary', () => {
    it('should return FY summary for valid year', async () => {
      reportsService.getFYSummary.mockResolvedValue(mockFYSummary);

      const result = await controller.getFYSummary(2026);

      expect(result).toEqual(mockFYSummary);
      expect(reportsService.getFYSummary).toHaveBeenCalledWith(2026);
    });

    it('should pass through service BadRequestException', async () => {
      reportsService.getFYSummary.mockRejectedValue(
        new BadRequestException('Invalid financial year'),
      );

      await expect(controller.getFYSummary(1990)).rejects.toThrow(BadRequestException);
    });

    it('should call service with correct year parameter', async () => {
      reportsService.getFYSummary.mockResolvedValue(mockFYSummary);

      await controller.getFYSummary(2025);

      expect(reportsService.getFYSummary).toHaveBeenCalledWith(2025);
    });

    it('should return correct FY label', async () => {
      const fy2025Summary = { ...mockFYSummary, financialYear: 2025, fyLabel: 'FY2025' };
      reportsService.getFYSummary.mockResolvedValue(fy2025Summary);

      const result = await controller.getFYSummary(2025);

      expect(result.fyLabel).toBe('FY2025');
    });

    it('should return income breakdown', async () => {
      reportsService.getFYSummary.mockResolvedValue(mockFYSummary);

      const result = await controller.getFYSummary(2026);

      expect(result.income).toBeDefined();
      expect(result.income.totalIncomeCents).toBe(5500000);
      expect(result.income.paidIncomeCents).toBe(5000000);
      expect(result.income.unpaidIncomeCents).toBe(500000);
    });

    it('should return expense breakdown by category', async () => {
      reportsService.getFYSummary.mockResolvedValue(mockFYSummary);

      const result = await controller.getFYSummary(2026);

      expect(result.expenses.byCategory).toHaveLength(1);
      expect(result.expenses.byCategory[0].name).toBe('Software');
    });

    it('should return net calculations', async () => {
      reportsService.getFYSummary.mockResolvedValue(mockFYSummary);

      const result = await controller.getFYSummary(2026);

      expect(result.netProfitCents).toBe(3300000);
      expect(result.netGstPayableCents).toBe(300000);
    });
  });
});
