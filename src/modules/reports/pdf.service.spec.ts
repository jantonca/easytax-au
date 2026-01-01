import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import { MoneyService } from '../../common/services/money.service';
import { BasSummaryDto } from '../bas/dto/bas-summary.dto';
import { FYSummaryDto } from './dto/fy-summary.dto';

describe('PdfService', () => {
  let service: PdfService;

  const mockBasSummary: BasSummaryDto = {
    quarter: 'Q1',
    financialYear: 2026,
    periodStart: '2025-07-01',
    periodEnd: '2025-09-30',
    g1TotalSalesCents: 1100000,
    label1aGstCollectedCents: 100000,
    label1bGstPaidCents: 50000,
    netGstPayableCents: 50000,
    incomeCount: 5,
    expenseCount: 12,
  };

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
        {
          categoryId: 2,
          name: 'Office Supplies',
          basLabel: '1B',
          totalCents: 200000,
          gstCents: 18182,
          count: 10,
        },
      ],
    },
    netProfitCents: 3300000,
    netGstPayableCents: 300000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService, MoneyService],
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  describe('generateBasPdf', () => {
    it('should generate a valid PDF buffer', async () => {
      const result = await service.generateBasPdf(mockBasSummary);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include PDF header signature', async () => {
      const result = await service.generateBasPdf(mockBasSummary);

      // PDF files start with %PDF-
      const pdfHeader = result.toString('utf8', 0, 5);
      expect(pdfHeader).toBe('%PDF-');
    });

    it('should handle zero values', async () => {
      const zeroSummary: BasSummaryDto = {
        ...mockBasSummary,
        g1TotalSalesCents: 0,
        label1aGstCollectedCents: 0,
        label1bGstPaidCents: 0,
        netGstPayableCents: 0,
        incomeCount: 0,
        expenseCount: 0,
      };

      const result = await service.generateBasPdf(zeroSummary);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle negative net GST (refund due)', async () => {
      const refundSummary: BasSummaryDto = {
        ...mockBasSummary,
        label1aGstCollectedCents: 30000,
        label1bGstPaidCents: 50000,
        netGstPayableCents: -20000,
      };

      const result = await service.generateBasPdf(refundSummary);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle all quarters', async () => {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

      for (const quarter of quarters) {
        const summary = { ...mockBasSummary, quarter };
        const result = await service.generateBasPdf(summary);
        expect(result).toBeInstanceOf(Buffer);
      }
    });

    it('should handle different financial years', async () => {
      const years = [2024, 2025, 2026, 2027];

      for (const financialYear of years) {
        const summary = { ...mockBasSummary, financialYear };
        const result = await service.generateBasPdf(summary);
        expect(result).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('generateFYPdf', () => {
    it('should generate a valid PDF buffer', async () => {
      const result = await service.generateFYPdf(mockFYSummary);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include PDF header signature', async () => {
      const result = await service.generateFYPdf(mockFYSummary);

      // PDF files start with %PDF-
      const pdfHeader = result.toString('utf8', 0, 5);
      expect(pdfHeader).toBe('%PDF-');
    });

    it('should handle empty categories', async () => {
      const noCategories: FYSummaryDto = {
        ...mockFYSummary,
        expenses: {
          ...mockFYSummary.expenses,
          byCategory: [],
        },
      };

      const result = await service.generateFYPdf(noCategories);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle zero income', async () => {
      const zeroIncome: FYSummaryDto = {
        ...mockFYSummary,
        income: {
          totalIncomeCents: 0,
          paidIncomeCents: 0,
          unpaidIncomeCents: 0,
          gstCollectedCents: 0,
          count: 0,
        },
      };

      const result = await service.generateFYPdf(zeroIncome);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle negative net profit (loss)', async () => {
      const lossSummary: FYSummaryDto = {
        ...mockFYSummary,
        netProfitCents: -500000, // $5,000 loss
      };

      const result = await service.generateFYPdf(lossSummary);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle negative net GST (refund)', async () => {
      const refundSummary: FYSummaryDto = {
        ...mockFYSummary,
        netGstPayableCents: -150000, // $1,500 refund
      };

      const result = await service.generateFYPdf(refundSummary);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle many categories', async () => {
      const manyCategories: FYSummaryDto = {
        ...mockFYSummary,
        expenses: {
          ...mockFYSummary.expenses,
          byCategory: Array.from({ length: 20 }, (_, i) => ({
            categoryId: i + 1,
            name: `Category ${i + 1}`,
            basLabel: '1B',
            totalCents: 10000 * (i + 1),
            gstCents: 909 * (i + 1),
            count: i + 1,
          })),
        },
      };

      const result = await service.generateFYPdf(manyCategories);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle different financial years', async () => {
      const years = [2024, 2025, 2026, 2027];

      for (const financialYear of years) {
        const summary = {
          ...mockFYSummary,
          financialYear,
          fyLabel: `FY${financialYear}`,
        };
        const result = await service.generateFYPdf(summary);
        expect(result).toBeInstanceOf(Buffer);
      }
    });

    it('should handle large currency values', async () => {
      const largeSummary: FYSummaryDto = {
        ...mockFYSummary,
        income: {
          ...mockFYSummary.income,
          totalIncomeCents: 100000000, // $1,000,000
        },
        expenses: {
          ...mockFYSummary.expenses,
          totalExpensesCents: 50000000, // $500,000
        },
        netProfitCents: 50000000,
      };

      const result = await service.generateFYPdf(largeSummary);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('PDF content consistency', () => {
    it('should generate consistent size for same BAS input', async () => {
      const result1 = await service.generateBasPdf(mockBasSummary);
      const result2 = await service.generateBasPdf(mockBasSummary);

      // PDFs may have slight size differences due to timestamps,
      // but should be in the same ballpark
      expect(Math.abs(result1.length - result2.length)).toBeLessThan(500);
    });

    it('should generate consistent size for same FY input', async () => {
      const result1 = await service.generateFYPdf(mockFYSummary);
      const result2 = await service.generateFYPdf(mockFYSummary);

      // PDFs may have slight size differences due to timestamps,
      // but should be in the same ballpark
      expect(Math.abs(result1.length - result2.length)).toBeLessThan(500);
    });

    it('should generate larger PDF for FY than BAS', async () => {
      const basPdf = await service.generateBasPdf(mockBasSummary);
      const fyPdf = await service.generateFYPdf(mockFYSummary);

      // FY summary has more content, so should be larger
      expect(fyPdf.length).toBeGreaterThan(basPdf.length);
    });
  });
});
