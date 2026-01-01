import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { FYSummaryDto } from './dto/fy-summary.dto';

/**
 * Controller for financial reports.
 *
 * Provides endpoints for generating FY summaries and other reports.
 */
@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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
}
