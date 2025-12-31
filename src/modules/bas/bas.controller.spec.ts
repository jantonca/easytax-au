import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BasController } from './bas.controller';
import { BasService } from './bas.service';
import { BasSummaryDto } from './dto/bas-summary.dto';

describe('BasController', () => {
  let controller: BasController;
  let mockGetSummary: jest.Mock;
  let mockGetQuartersForYear: jest.Mock;

  const mockBasSummary: BasSummaryDto = {
    quarter: 'Q1',
    financialYear: 2025,
    periodStart: '2024-07-01',
    periodEnd: '2024-09-30',
    g1TotalSalesCents: 110000,
    label1aGstCollectedCents: 10000,
    label1bGstPaidCents: 3000,
    netGstPayableCents: 7000,
    incomeCount: 5,
    expenseCount: 12,
  };

  const mockQuarters = [
    { quarter: 'Q1' as const, start: '2024-07-01', end: '2024-09-30' },
    { quarter: 'Q2' as const, start: '2024-10-01', end: '2024-12-31' },
    { quarter: 'Q3' as const, start: '2025-01-01', end: '2025-03-31' },
    { quarter: 'Q4' as const, start: '2025-04-01', end: '2025-06-30' },
  ];

  beforeEach(async () => {
    mockGetSummary = jest.fn().mockResolvedValue(mockBasSummary);
    mockGetQuartersForYear = jest.fn().mockReturnValue(mockQuarters);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BasController],
      providers: [
        {
          provide: BasService,
          useValue: {
            getSummary: mockGetSummary,
            getQuartersForYear: mockGetQuartersForYear,
          },
        },
      ],
    }).compile();

    controller = module.get<BasController>(BasController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('GET /bas/:quarter/:year (getSummary)', () => {
    it('should return BAS summary for valid quarter and year', async () => {
      const result = await controller.getSummary('Q1', '2025');

      expect(result).toEqual(mockBasSummary);
      expect(mockGetSummary).toHaveBeenCalledWith('Q1', 2025);
    });

    it('should convert lowercase quarter to uppercase', async () => {
      await controller.getSummary('q1', '2025');

      expect(mockGetSummary).toHaveBeenCalledWith('Q1', 2025);
    });

    it('should handle mixed case quarters', async () => {
      await controller.getSummary('q2', '2025');
      expect(mockGetSummary).toHaveBeenCalledWith('Q2', 2025);

      await controller.getSummary('Q3', '2025');
      expect(mockGetSummary).toHaveBeenCalledWith('Q3', 2025);
    });

    it('should parse year string to number', async () => {
      await controller.getSummary('Q1', '2024');
      expect(mockGetSummary).toHaveBeenCalledWith('Q1', 2024);

      await controller.getSummary('Q4', '2030');
      expect(mockGetSummary).toHaveBeenCalledWith('Q4', 2030);
    });

    it('should pass through service errors', async () => {
      const error = new BadRequestException('Invalid quarter');
      mockGetSummary.mockRejectedValue(error);

      await expect(controller.getSummary('Q5', '2025')).rejects.toThrow(BadRequestException);
    });

    it.each(['Q1', 'Q2', 'Q3', 'Q4'])('should handle all valid quarters (%s)', async (quarter) => {
      await controller.getSummary(quarter, '2025');
      expect(mockGetSummary).toHaveBeenCalledWith(quarter, 2025);
    });

    it('should return all expected fields in response', async () => {
      const result = await controller.getSummary('Q1', '2025');

      expect(result).toHaveProperty('quarter');
      expect(result).toHaveProperty('financialYear');
      expect(result).toHaveProperty('periodStart');
      expect(result).toHaveProperty('periodEnd');
      expect(result).toHaveProperty('g1TotalSalesCents');
      expect(result).toHaveProperty('label1aGstCollectedCents');
      expect(result).toHaveProperty('label1bGstPaidCents');
      expect(result).toHaveProperty('netGstPayableCents');
      expect(result).toHaveProperty('incomeCount');
      expect(result).toHaveProperty('expenseCount');
    });
  });

  describe('GET /bas/quarters/:year (getQuarters)', () => {
    it('should return all quarters for a financial year', () => {
      const result = controller.getQuarters('2025');

      expect(result).toEqual(mockQuarters);
      expect(mockGetQuartersForYear).toHaveBeenCalledWith(2025);
    });

    it('should parse year string to number', () => {
      controller.getQuarters('2024');
      expect(mockGetQuartersForYear).toHaveBeenCalledWith(2024);

      controller.getQuarters('2030');
      expect(mockGetQuartersForYear).toHaveBeenCalledWith(2030);
    });

    it('should return array with 4 quarters', () => {
      const result = controller.getQuarters('2025');
      expect(result).toHaveLength(4);
    });

    it('should return quarters with correct structure', () => {
      const result = controller.getQuarters('2025');

      result.forEach((q) => {
        expect(q).toHaveProperty('quarter');
        expect(q).toHaveProperty('start');
        expect(q).toHaveProperty('end');
        expect(['Q1', 'Q2', 'Q3', 'Q4']).toContain(q.quarter);
      });
    });
  });
});
