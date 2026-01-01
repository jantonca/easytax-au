import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { ClientMatcherService, CachedClient } from './client-matcher.service';
import {
  IncomeCsvColumnMapping,
  ParsedIncomeCsvRow,
  IncomeCsvRowResult,
  IncomeCsvImportResult,
  IncomeCsvImportOptions,
  INCOME_CSV_COLUMN_MAPPINGS,
} from './csv-import.types';
import { Client } from '../clients/entities/client.entity';
import { Income } from '../incomes/entities/income.entity';
import { ImportJob } from '../import-jobs/entities/import-job.entity';
import { ImportStatus, ImportSource } from '../import-jobs/entities/import-job.entity';
import { MoneyService } from '../../common/services/money.service';

/**
 * Service for importing incomes from CSV files.
 *
 * Key differences from expense import:
 * - Matches clients (encrypted) instead of providers
 * - Validates Total = Subtotal + GST
 * - No biz_percent logic (incomes are 100% business)
 * - Tracks GST collected (for BAS 1A)
 */
@Injectable()
export class IncomeCsvImportService {
  private readonly logger = new Logger(IncomeCsvImportService.name);

  constructor(
    private readonly clientMatcher: ClientMatcherService,
    private readonly moneyService: MoneyService,
    private readonly dataSource: DataSource,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Income)
    private readonly incomeRepo: Repository<Income>,
    @InjectRepository(ImportJob)
    private readonly importJobRepo: Repository<ImportJob>,
  ) {}

  /**
   * Import incomes from a CSV buffer.
   *
   * @param buffer - CSV file content
   * @param options - Import options
   * @returns Import result with success/failure details
   */
  async importFromBuffer(
    buffer: Buffer,
    options: IncomeCsvImportOptions,
  ): Promise<IncomeCsvImportResult> {
    const content = buffer.toString('utf-8');
    return this.importFromString(content, options);
  }

  /**
   * Import incomes from a CSV string.
   *
   * @param content - CSV content as string
   * @param options - Import options
   * @returns Import result with success/failure details
   */
  async importFromString(
    content: string,
    options: IncomeCsvImportOptions,
  ): Promise<IncomeCsvImportResult> {
    const mapping = this.resolveMapping(options);
    const rows = this.parseIncomeCsv(content, mapping, options.defaultDate);
    return this.processRows(rows, options);
  }

  /**
   * Resolve column mapping from options.
   */
  private resolveMapping(options: IncomeCsvImportOptions): IncomeCsvColumnMapping {
    if (options.mapping) {
      return options.mapping;
    }

    if (options.source) {
      const predefined = INCOME_CSV_COLUMN_MAPPINGS[options.source.toLowerCase()];
      if (predefined) {
        return predefined;
      }
    }

    // Default to custom mapping
    return INCOME_CSV_COLUMN_MAPPINGS.custom;
  }

  /**
   * Parse income CSV content into rows.
   */
  private parseIncomeCsv(
    content: string,
    mapping: IncomeCsvColumnMapping,
    defaultDate?: Date,
  ): ParsedIncomeCsvRow[] {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    const rows: ParsedIncomeCsvRow[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // 1-indexed, +1 for header

      try {
        const row = this.parseRow(record, mapping, rowNumber, defaultDate);
        if (row) {
          rows.push(row);
        }
      } catch (error) {
        // Skip rows that fail parsing
        this.logger.warn(
          `Row ${rowNumber}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return rows;
  }

  /**
   * Parse a single CSV row.
   */
  private parseRow(
    record: Record<string, string>,
    mapping: IncomeCsvColumnMapping,
    rowNumber: number,
    defaultDate?: Date,
  ): ParsedIncomeCsvRow | null {
    // Get client name (required)
    const clientName = record[mapping.client]?.trim();
    if (!clientName) {
      return null; // Skip empty rows
    }

    // Parse amounts
    const subtotalCents = this.parseCurrency(record[mapping.subtotal]);
    const gstCents = this.parseCurrency(record[mapping.gst]);
    const totalCentsFromCsv = this.parseCurrency(record[mapping.total]);

    // Calculate expected total
    const calculatedTotalCents = this.moneyService.addAmounts(subtotalCents, gstCents);
    const totalMatches = totalCentsFromCsv === calculatedTotalCents;

    // Parse optional fields
    const invoiceNum = mapping.invoiceNum ? record[mapping.invoiceNum]?.trim() : undefined;
    const description = mapping.description ? record[mapping.description]?.trim() : undefined;

    // Parse date (optional, defaults to today or provided default)
    let date: Date | undefined;
    if (mapping.date && record[mapping.date]) {
      date = this.parseDate(record[mapping.date]);
    }
    if (!date) {
      date = defaultDate || new Date();
    }

    return {
      rowNumber,
      clientName,
      invoiceNum: invoiceNum || undefined,
      subtotalCents,
      gstCents,
      totalCentsFromCsv,
      calculatedTotalCents,
      totalMatches,
      date,
      description,
    };
  }

  /**
   * Parse currency string to cents.
   */
  private parseCurrency(value: string | undefined): number {
    if (!value) return 0;

    // Remove currency symbols, commas, and whitespace
    const cleaned = value.replace(/[$,\s]/g, '').trim();
    if (!cleaned) return 0;

    const amount = parseFloat(cleaned);
    if (isNaN(amount)) return 0;

    // Convert to cents
    return Math.round(amount * 100);
  }

  /**
   * Parse date string.
   */
  private parseDate(value: string): Date | undefined {
    if (!value) return undefined;

    // Try DD/MM/YYYY (Australian format)
    const auMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (auMatch) {
      const [, day, month, year] = auMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Try YYYY-MM-DD (ISO format)
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Fallback to Date.parse
    const parsed = Date.parse(value);
    return isNaN(parsed) ? undefined : new Date(parsed);
  }

  /**
   * Process parsed CSV rows.
   */
  private async processRows(
    rows: ParsedIncomeCsvRow[],
    options: IncomeCsvImportOptions,
  ): Promise<IncomeCsvImportResult> {
    const startTime = Date.now();

    if (rows.length === 0) {
      throw new BadRequestException('CSV file contains no valid data rows');
    }

    // Load clients and prepare for matching
    const clients = await this.clientRepo.find();
    const cachedClients = this.clientMatcher.prepareClientsForMatching(
      clients.map((c) => ({ id: c.id, name: c.name })),
    );

    // Create import job
    const importJob = await this.createImportJob(options.source || 'custom', rows.length);

    const results: IncomeCsvRowResult[] = [];
    const incomesToCreate: Partial<Income>[] = [];

    for (const row of rows) {
      const result = await this.processRow(row, cachedClients, options, importJob.id);
      results.push(result);

      if (result.success && result.incomeData) {
        incomesToCreate.push(result.incomeData);
      }
    }

    // Bulk create incomes in a transaction
    if (incomesToCreate.length > 0 && !options.dryRun) {
      try {
        await this.bulkCreateIncomes(incomesToCreate);
      } catch (error) {
        await this.updateImportJobStatus(
          importJob.id,
          ImportStatus.FAILED,
          error instanceof Error ? error.message : 'Bulk insert failed',
        );
        throw error;
      }
    }

    // Calculate totals
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;
    const warningCount = results.filter((r) => r.warning).length;
    const duplicateCount = results.filter((r) => r.isDuplicate).length;

    const totalSubtotalCents = results
      .filter((r) => r.success && r.incomeData)
      .reduce((sum, r) => sum + (r.incomeData?.subtotalCents || 0), 0);

    const totalGstCents = results
      .filter((r) => r.success && r.incomeData)
      .reduce((sum, r) => sum + (r.incomeData?.gstCents || 0), 0);

    const totalAmountCents = results
      .filter((r) => r.success && r.incomeData)
      .reduce((sum, r) => sum + (r.incomeData?.totalCents || 0), 0);

    // Update import job
    const finalStatus =
      failedCount === 0
        ? ImportStatus.COMPLETED
        : successCount === 0
          ? ImportStatus.FAILED
          : ImportStatus.COMPLETED;

    await this.updateImportJob(importJob.id, {
      status: finalStatus,
      recordsImported: successCount,
      recordsFailed: failedCount,
      totalAmountCents,
      totalGstCents,
    });

    const processingTimeMs = Date.now() - startTime;
    this.logger.log(
      `Income import job ${importJob.id}: ${successCount} success, ${failedCount} failed in ${processingTimeMs}ms`,
    );

    return {
      importJobId: importJob.id,
      totalRows: rows.length,
      successCount,
      failedCount,
      duplicateCount,
      warningCount,
      totalSubtotalCents,
      totalGstCents,
      totalAmountCents,
      processingTimeMs,
      rows: results,
    };
  }

  /**
   * Process a single CSV row.
   */
  private async processRow(
    row: ParsedIncomeCsvRow,
    cachedClients: CachedClient[],
    options: IncomeCsvImportOptions,
    _importJobId: string,
  ): Promise<IncomeCsvRowResult> {
    // Match client
    const clientMatch = this.clientMatcher.findBestMatch(
      row.clientName,
      cachedClients,
      options.matchThreshold || 0.6,
    );

    if (!clientMatch) {
      return {
        rowNumber: row.rowNumber,
        success: false,
        error: `No matching client found for "${row.clientName}". Create the client first or check the name.`,
        clientMatch: null,
      };
    }

    // Check for duplicates
    if (options.skipDuplicates !== false) {
      const isDuplicate = await this.isDuplicate(
        row.date!,
        row.calculatedTotalCents,
        clientMatch.clientId,
        row.invoiceNum,
      );

      if (isDuplicate) {
        return {
          rowNumber: row.rowNumber,
          success: false,
          isDuplicate: true,
          error: 'Duplicate income detected (same date, amount, client, invoice)',
          clientMatch,
        };
      }
    }

    // Build warning if total doesn't match
    let warning: string | undefined;
    if (!row.totalMatches) {
      warning = `Total mismatch: CSV shows $${(row.totalCentsFromCsv / 100).toFixed(2)} but Subtotal + GST = $${(row.calculatedTotalCents / 100).toFixed(2)}. Using calculated value.`;
    }

    const incomeData: Partial<Income> = {
      date: row.date,
      clientId: clientMatch.clientId,
      invoiceNum: row.invoiceNum || null,
      description: row.description || null,
      subtotalCents: row.subtotalCents,
      gstCents: row.gstCents,
      totalCents: row.calculatedTotalCents, // Use calculated, not CSV value
      isPaid: options.markAsPaid ?? false,
      // Note: importJobId would require adding the field to Income entity
      // For now, we track via ImportJob.recordsImported
    };

    return {
      rowNumber: row.rowNumber,
      success: true,
      warning,
      clientMatch,
      incomeData,
    };
  }

  /**
   * Check if an income is a duplicate.
   */
  private async isDuplicate(
    date: Date,
    totalCents: number,
    clientId: string,
    invoiceNum?: string,
  ): Promise<boolean> {
    // If invoice number is provided, check by invoice
    if (invoiceNum) {
      const byInvoice = await this.incomeRepo.findOne({
        where: {
          clientId,
          invoiceNum,
        },
      });
      if (byInvoice) return true;
    }

    // Also check by date + amount + client
    const byDetails = await this.incomeRepo.findOne({
      where: {
        date,
        totalCents,
        clientId,
      },
    });

    return !!byDetails;
  }

  /**
   * Bulk create incomes in a transaction.
   */
  private async bulkCreateIncomes(incomes: Partial<Income>[]): Promise<Income[]> {
    return this.dataSource.transaction(async (manager) => {
      const incomeEntities = incomes.map((i) => manager.create(Income, i));
      return manager.save(incomeEntities);
    });
  }

  /**
   * Create a new import job.
   */
  private async createImportJob(source: string, totalRows: number): Promise<ImportJob> {
    const job = this.importJobRepo.create({
      source: ImportSource.MANUAL, // Income imports are typically manual spreadsheets
      filename: `income-import-${Date.now()}.csv`,
      status: ImportStatus.PENDING,
      recordsTotal: totalRows,
      recordsImported: 0,
      recordsFailed: 0,
    });

    return this.importJobRepo.save(job);
  }

  /**
   * Update import job status.
   */
  private async updateImportJobStatus(
    id: string,
    status: ImportStatus,
    errorMessage?: string,
  ): Promise<void> {
    await this.importJobRepo.update(id, {
      status,
      errorMessage,
    });
  }

  /**
   * Update import job with final statistics.
   */
  private async updateImportJob(id: string, data: Partial<ImportJob>): Promise<void> {
    await this.importJobRepo.update(id, data);
  }

  /**
   * Preview import without creating incomes.
   */
  async previewImport(
    content: string,
    options: Omit<IncomeCsvImportOptions, 'dryRun'>,
  ): Promise<IncomeCsvImportResult> {
    return this.importFromString(content, { ...options, dryRun: true });
  }
}
