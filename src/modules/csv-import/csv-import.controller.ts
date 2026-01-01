import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CsvImportService } from './csv-import.service';
import { IncomeCsvImportService } from './income-csv-import.service';
import {
  CsvImportRequestDto,
  CsvImportResponseDto,
  IncomeCsvImportRequestDto,
  IncomeCsvImportResponseDto,
} from './dto';
import {
  CsvImportResult,
  CsvImportOptions,
  IncomeCsvImportResult,
  IncomeCsvImportOptions,
} from './csv-import.types';

/**
 * Controller for CSV expense and income imports.
 */
@ApiTags('CSV Import')
@Controller('import')
export class CsvImportController {
  constructor(
    private readonly csvImportService: CsvImportService,
    private readonly incomeCsvImportService: IncomeCsvImportService,
  ) {}

  /**
   * Import expenses from a CSV file.
   */
  @Post('expenses')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import expenses from CSV',
    description: `
Upload a CSV file to import expenses in bulk.

**Supported Formats:**
- Custom format with configurable column mapping
- CommBank export format
- Amex export format

**Column Requirements:**
- Date: Transaction date (YYYY-MM-DD or DD/MM/YYYY)
- Item: Vendor/Provider name for matching
- Total: Amount including GST ($1,234.56 format)
- GST (optional): GST component
- Biz% (optional): Business use percentage (default 100)
- Category (optional): Category name for matching

**Provider Matching:**
Vendors are fuzzy-matched against existing providers in the database.
Set a custom threshold (0-1) to adjust matching sensitivity.

**Duplicate Detection:**
Expenses with same date, amount, and provider are considered duplicates.
`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to import',
        },
        source: {
          type: 'string',
          enum: ['custom', 'commbank', 'amex', 'nab', 'westpac', 'anz'],
          description: 'Predefined source format',
        },
        matchThreshold: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.6,
          description: 'Provider matching threshold',
        },
        skipDuplicates: {
          type: 'boolean',
          default: true,
          description: 'Skip duplicate expenses',
        },
        dryRun: {
          type: 'boolean',
          default: false,
          description: 'Preview mode - do not create expenses',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import completed successfully',
    type: CsvImportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid CSV format or missing required columns',
  })
  async importFromFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: 'text/csv' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CsvImportRequestDto,
  ): Promise<CsvImportResponseDto> {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const options = this.buildOptions(dto);
    const result = await this.csvImportService.importFromBuffer(file.buffer, options);

    return this.mapToResponse(result);
  }

  /**
   * Import expenses from CSV content (JSON body).
   * Useful for programmatic imports.
   */
  @Post('expenses/content')
  @ApiOperation({
    summary: 'Import expenses from CSV content',
    description: 'Import expenses by providing CSV content as a string in the request body.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: {
          type: 'string',
          description: 'CSV content as string',
          example: 'Date,Item,Total,GST\n2025-07-15,Internet,$88.00,$8.00',
        },
        source: {
          type: 'string',
          enum: ['custom', 'commbank', 'amex'],
        },
        matchThreshold: {
          type: 'number',
        },
        skipDuplicates: {
          type: 'boolean',
        },
        dryRun: {
          type: 'boolean',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import completed successfully',
    type: CsvImportResponseDto,
  })
  async importFromContent(
    @Body() body: CsvImportRequestDto & { content: string },
  ): Promise<CsvImportResponseDto> {
    if (!body.content) {
      throw new BadRequestException('CSV content is required');
    }

    const options = this.buildOptions(body);
    const result = await this.csvImportService.importFromString(body.content, options);

    return this.mapToResponse(result);
  }

  /**
   * Preview import without creating expenses.
   */
  @Post('expenses/preview')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Preview CSV import',
    description: 'Validate and preview CSV import without creating expenses.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Preview results',
    type: CsvImportResponseDto,
  })
  async previewImport(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'text/csv' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CsvImportRequestDto,
  ): Promise<CsvImportResponseDto> {
    const options = this.buildOptions({ ...dto, dryRun: true });
    const result = await this.csvImportService.importFromBuffer(file.buffer, options);

    return this.mapToResponse(result);
  }

  /**
   * Build import options from DTO.
   */
  private buildOptions(dto: CsvImportRequestDto): CsvImportOptions {
    return {
      source: dto.source,
      mapping: dto.mapping,
      matchThreshold: dto.matchThreshold ?? 0.6,
      skipDuplicates: dto.skipDuplicates ?? true,
      dryRun: dto.dryRun ?? false,
    };
  }

  /**
   * Map internal result to response DTO.
   */
  private mapToResponse(result: CsvImportResult): CsvImportResponseDto {
    return {
      importJobId: result.importJobId,
      totalRows: result.totalRows,
      successCount: result.successCount,
      failedCount: result.failedCount,
      duplicateCount: result.duplicateCount,
      totalAmountCents: result.totalAmountCents,
      totalGstCents: result.totalGstCents,
      processingTimeMs: result.processingTimeMs,
      rows: result.rows.map((r) => ({
        rowNumber: r.rowNumber,
        success: r.success,
        isDuplicate: r.isDuplicate,
        error: r.error,
        providerName: r.providerMatch?.providerName,
        matchScore: r.providerMatch?.score,
        categoryName: r.categoryName,
        amountCents: r.expenseData?.amountCents,
        gstCents: r.expenseData?.gstCents,
      })),
    };
  }

  // ===========================================================================
  // INCOME CSV IMPORT ENDPOINTS
  // ===========================================================================

  /**
   * Import incomes from a CSV file.
   */
  @Post('incomes')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import incomes from CSV',
    description: `
Upload a CSV file to import incomes in bulk.

**Expected Format:**
- Client: Client name for matching (must exist in database)
- Invoice #: Invoice number (optional, used for duplicate detection)
- Subtotal: Amount before GST
- GST: GST collected
- Total: Total amount (validated against Subtotal + GST)

**Client Matching:**
Clients are fuzzy-matched against existing clients in the database.
Since client names are encrypted, matching happens in-memory after decryption.
If a client is not found, the row will fail.

**Total Validation:**
If Total ≠ Subtotal + GST, a warning is returned and the calculated value is used.

**Duplicate Detection:**
Incomes with same invoice number OR same date+amount+client are considered duplicates.
`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to import',
        },
        source: {
          type: 'string',
          enum: ['custom'],
          description: 'Predefined source format',
        },
        matchThreshold: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.6,
          description: 'Client matching threshold',
        },
        skipDuplicates: {
          type: 'boolean',
          default: true,
          description: 'Skip duplicate incomes',
        },
        dryRun: {
          type: 'boolean',
          default: false,
          description: 'Preview mode - do not create incomes',
        },
        markAsPaid: {
          type: 'boolean',
          default: false,
          description: 'Mark all imported incomes as paid',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import completed successfully',
    type: IncomeCsvImportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid CSV format or missing required columns',
  })
  async importIncomesFromFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: 'text/csv' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: IncomeCsvImportRequestDto,
  ): Promise<IncomeCsvImportResponseDto> {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const options = this.buildIncomeOptions(dto);
    const result = await this.incomeCsvImportService.importFromBuffer(file.buffer, options);

    return this.mapIncomeToResponse(result);
  }

  /**
   * Import incomes from CSV content (JSON body).
   */
  @Post('incomes/content')
  @ApiOperation({
    summary: 'Import incomes from CSV content',
    description: 'Import incomes by providing CSV content as a string in the request body.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: {
          type: 'string',
          description: 'CSV content as string',
          example: 'Client,Invoice #,Subtotal,GST,Total\nAcme Corp,INV-001,$1000,$100,$1100',
        },
        source: { type: 'string', enum: ['custom'] },
        matchThreshold: { type: 'number' },
        skipDuplicates: { type: 'boolean' },
        dryRun: { type: 'boolean' },
        markAsPaid: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import completed successfully',
    type: IncomeCsvImportResponseDto,
  })
  async importIncomesFromContent(
    @Body() body: IncomeCsvImportRequestDto & { content: string },
  ): Promise<IncomeCsvImportResponseDto> {
    if (!body.content) {
      throw new BadRequestException('CSV content is required');
    }

    const options = this.buildIncomeOptions(body);
    const result = await this.incomeCsvImportService.importFromString(body.content, options);

    return this.mapIncomeToResponse(result);
  }

  /**
   * Preview income import without creating records.
   */
  @Post('incomes/preview')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Preview income CSV import',
    description: 'Validate and preview CSV import without creating incomes.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Preview results',
    type: IncomeCsvImportResponseDto,
  })
  async previewIncomeImport(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'text/csv' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: IncomeCsvImportRequestDto,
  ): Promise<IncomeCsvImportResponseDto> {
    const options = this.buildIncomeOptions({ ...dto, dryRun: true });
    const result = await this.incomeCsvImportService.importFromBuffer(file.buffer, options);

    return this.mapIncomeToResponse(result);
  }

  /**
   * Build income import options from DTO.
   */
  private buildIncomeOptions(dto: IncomeCsvImportRequestDto): IncomeCsvImportOptions {
    return {
      source: dto.source,
      mapping: dto.mapping,
      matchThreshold: dto.matchThreshold ?? 0.6,
      skipDuplicates: dto.skipDuplicates ?? true,
      dryRun: dto.dryRun ?? false,
      markAsPaid: dto.markAsPaid ?? false,
    };
  }

  /**
   * Map internal income result to response DTO.
   */
  private mapIncomeToResponse(result: IncomeCsvImportResult): IncomeCsvImportResponseDto {
    return {
      importJobId: result.importJobId,
      totalRows: result.totalRows,
      successCount: result.successCount,
      failedCount: result.failedCount,
      duplicateCount: result.duplicateCount,
      warningCount: result.warningCount,
      totalSubtotalCents: result.totalSubtotalCents,
      totalGstCents: result.totalGstCents,
      totalAmountCents: result.totalAmountCents,
      processingTimeMs: result.processingTimeMs,
      rows: result.rows.map((r) => ({
        rowNumber: r.rowNumber,
        success: r.success,
        isDuplicate: r.isDuplicate,
        error: r.error,
        warning: r.warning,
        clientName: r.clientMatch?.clientName,
        matchScore: r.clientMatch?.score,
        invoiceNum: r.incomeData?.invoiceNum ?? undefined,
        subtotalCents: r.incomeData?.subtotalCents,
        gstCents: r.incomeData?.gstCents,
        totalCents: r.incomeData?.totalCents,
      })),
    };
  }
}
