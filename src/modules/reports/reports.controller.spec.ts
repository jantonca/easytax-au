import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PdfService } from './pdf.service';
import { BasService } from '../bas/bas.service';
import { FYSummaryDto } from './dto/fy-summary.dto';
import { BasSummaryDto } from '../bas/dto/bas-summary.dto';

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: jest.Mocked<ReportsService>;
  let pdfService: jest.Mocked<PdfService>;
  let basService: jest.Mocked<BasService>;

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

  const mockPdfBuffer = Buffer.from('mock-pdf-content');

  const mockResponse = {
    set: jest.fn(),
  } as unknown as Response;

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
        {
          provide: PdfService,
          useValue: {
            generateFYPdf: jest.fn(),
            generateBasPdf: jest.fn(),
          },
        },
        {
          provide: BasService,
          useValue: {
            getSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get(ReportsService);
    pdfService = module.get(PdfService);
    basService = module.get(BasService);
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

  describe('getFYSummaryPdf', () => {
    it('should return StreamableFile with PDF content', async () => {
      reportsService.getFYSummary.mockResolvedValue(mockFYSummary);
      pdfService.generateFYPdf.mockResolvedValue(mockPdfBuffer);

      const result = await controller.getFYSummaryPdf(2026, mockResponse);

      expect(result).toBeInstanceOf(StreamableFile);
      expect(reportsService.getFYSummary).toHaveBeenCalledWith(2026);
      expect(pdfService.generateFYPdf).toHaveBeenCalledWith(mockFYSummary);
    });

    it('should set correct response headers', async () => {
      reportsService.getFYSummary.mockResolvedValue(mockFYSummary);
      pdfService.generateFYPdf.mockResolvedValue(mockPdfBuffer);

      await controller.getFYSummaryPdf(2026, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="fy2026-summary.pdf"',
        'Content-Length': mockPdfBuffer.length,
      });
    });

    it('should pass through service errors', async () => {
      reportsService.getFYSummary.mockRejectedValue(new BadRequestException('Invalid year'));

      await expect(controller.getFYSummaryPdf(1990, mockResponse)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getBasSummaryPdf', () => {
    it('should return StreamableFile with PDF content', async () => {
      basService.getSummary.mockResolvedValue(mockBasSummary);
      pdfService.generateBasPdf.mockResolvedValue(mockPdfBuffer);

      const result = await controller.getBasSummaryPdf('Q1', 2026, mockResponse);

      expect(result).toBeInstanceOf(StreamableFile);
      expect(basService.getSummary).toHaveBeenCalledWith('Q1', 2026);
      expect(pdfService.generateBasPdf).toHaveBeenCalledWith(mockBasSummary);
    });

    it('should set correct response headers', async () => {
      basService.getSummary.mockResolvedValue(mockBasSummary);
      pdfService.generateBasPdf.mockResolvedValue(mockPdfBuffer);

      await controller.getBasSummaryPdf('Q1', 2026, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="bas-q1-fy2026.pdf"',
        'Content-Length': mockPdfBuffer.length,
      });
    });

    it('should normalize quarter to uppercase', async () => {
      basService.getSummary.mockResolvedValue(mockBasSummary);
      pdfService.generateBasPdf.mockResolvedValue(mockPdfBuffer);

      await controller.getBasSummaryPdf('q2', 2026, mockResponse);

      expect(basService.getSummary).toHaveBeenCalledWith('Q2', 2026);
    });

    it('should pass through service errors', async () => {
      basService.getSummary.mockRejectedValue(new BadRequestException('Invalid quarter'));

      await expect(controller.getBasSummaryPdf('Q5', 2026, mockResponse)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
