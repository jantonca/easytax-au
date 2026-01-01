import { Controller, Get, Param, ParseIntPipe, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { PdfService } from './pdf.service';
import { BasService } from '../bas/bas.service';
import { FYSummaryDto } from './dto/fy-summary.dto';

/**
 * Controller for financial reports.
 *
 * Provides endpoints for generating FY summaries and PDF exports.
 */
@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfService: PdfService,
    private readonly basService: BasService,
  ) {}

  /**
   * Get FY summary for tax return preparation.
   *
   * @param year - Financial year (e.g., 2026 for FY2025-26)
   * @returns Complete FY summary
   */
  @Get('fy/:year')
  @ApiOperation({
    summary: 'Get FY summary',
    description:
      'Returns a complete financial year summary including income, expenses by category, and GST position. Useful for tax return preparation.',
  })
  @ApiParam({
    name: 'year',
    description: 'Financial year (e.g., 2026 for July 2025 - June 2026)',
    example: 2026,
  })
  @ApiResponse({
    status: 200,
    description: 'FY summary returned successfully',
    type: FYSummaryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid financial year',
  })
  async getFYSummary(@Param('year', ParseIntPipe) year: number): Promise<FYSummaryDto> {
    return this.reportsService.getFYSummary(year);
  }

  /**
   * Download FY summary as PDF.
   *
   * @param year - Financial year (e.g., 2026 for FY2025-26)
   * @param res - Express response for setting headers
   * @returns PDF file as StreamableFile
   */
  @Get('fy/:year/pdf')
  @ApiOperation({
    summary: 'Download FY summary as PDF',
    description:
      'Generates a downloadable PDF report of the financial year summary. Useful for tax records and accountant submissions.',
  })
  @ApiParam({
    name: 'year',
    description: 'Financial year (e.g., 2026 for July 2025 - June 2026)',
    example: 2026,
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF file generated successfully',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid financial year',
  })
  async getFYSummaryPdf(
    @Param('year', ParseIntPipe) year: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const summary = await this.reportsService.getFYSummary(year);
    const pdfBuffer = await this.pdfService.generateFYPdf(summary);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fy${year}-summary.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }

  /**
   * Download BAS summary as PDF.
   *
   * @param quarter - Quarter (Q1, Q2, Q3, Q4)
   * @param year - Financial year
   * @param res - Express response for setting headers
   * @returns PDF file as StreamableFile
   */
  @Get('bas/:quarter/:year/pdf')
  @ApiOperation({
    summary: 'Download BAS summary as PDF',
    description:
      'Generates a downloadable PDF report of the BAS quarterly summary. Useful for ATO submission records.',
  })
  @ApiParam({
    name: 'quarter',
    description: 'Quarter (Q1, Q2, Q3, Q4)',
    example: 'Q1',
  })
  @ApiParam({
    name: 'year',
    description: 'Financial year (e.g., 2026 for FY2025-26)',
    example: 2026,
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF file generated successfully',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid quarter or year',
  })
  async getBasSummaryPdf(
    @Param('quarter') quarter: string,
    @Param('year', ParseIntPipe) year: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const summary = await this.basService.getSummary(quarter.toUpperCase(), year);
    const pdfBuffer = await this.pdfService.generateBasPdf(summary);

    const filename = `bas-${quarter.toLowerCase()}-fy${year}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }
}
