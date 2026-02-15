import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CsvParserService } from './csv-parser.service';
import { ProviderMatcherService } from './provider-matcher.service';
import {
  CsvColumnMapping,
  ParsedCsvRow,
  CsvRowResult,
  CsvImportResult,
  CsvImportOptions,
} from './csv-import.types';
import { Provider } from '../providers/entities/provider.entity';
import { Category } from '../categories/entities/category.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { ImportJob } from '../import-jobs/entities/import-job.entity';
import { ImportStatus, ImportSource } from '../import-jobs/entities/import-job.entity';
import { MoneyService } from '../../common/services/money.service';

/**
 * Service for importing expenses from CSV files.
 * Handles parsing, provider matching, duplicate detection, and bulk creation.
 */
@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(
    private readonly csvParser: CsvParserService,
    private readonly providerMatcher: ProviderMatcherService,
    private readonly moneyService: MoneyService,
    private readonly dataSource: DataSource,
    @InjectRepository(Provider)
    private readonly providerRepo: Repository<Provider>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ImportJob)
    private readonly importJobRepo: Repository<ImportJob>,
  ) {}

  /**
   * Import expenses from a CSV buffer.
   *
   * @param buffer - CSV file content
   * @param options - Import options
   * @returns Import result with success/failure details
   */
  async importFromBuffer(buffer: Buffer, options: CsvImportOptions): Promise<CsvImportResult> {
    const mapping = this.resolveMapping(options);
    const rows = this.csvParser.parseBuffer(buffer, mapping);
    return this.processRows(rows, options);
  }

  /**
   * Import expenses from a CSV string.
   *
   * @param content - CSV content as string
   * @param options - Import options
   * @returns Import result with success/failure details
   */
  async importFromString(content: string, options: CsvImportOptions): Promise<CsvImportResult> {
    const mapping = this.resolveMapping(options);
    const rows = this.csvParser.parseString(content, mapping);
    return this.processRows(rows, options);
  }

  /**
   * Resolve column mapping from options.
   */
  private resolveMapping(options: CsvImportOptions): CsvColumnMapping {
    if (options.mapping) {
      return options.mapping;
    }

    if (options.source) {
      const predefined = this.csvParser.getMapping(options.source);
      if (predefined) {
        return predefined;
      }
    }

    throw new BadRequestException('No column mapping provided and source is not a known format');
  }

  /**
   * Process parsed CSV rows.
   */
  private async processRows(
    rows: ParsedCsvRow[],
    options: CsvImportOptions,
  ): Promise<CsvImportResult> {
    const startTime = Date.now();

    // Load providers and categories
    const providers = await this.providerRepo.find();
    const categories = await this.categoryRepo.find();
    const providerNames = providers.map((p) => p.name);

    // Create import job
    const importJob = await this.createImportJob(options.source || 'custom', rows.length);

    const results: CsvRowResult[] = [];
    const expensesToCreate: Partial<Expense>[] = [];

    for (const row of rows) {
      const result = await this.processRow(
        row,
        providers,
        providerNames,
        categories,
        options,
        importJob.id,
      );
      results.push(result);

      if (result.success && result.expenseData) {
        expensesToCreate.push(result.expenseData);
      }
    }

    // Bulk create expenses in a transaction
    if (expensesToCreate.length > 0 && !options.dryRun) {
      try {
        await this.bulkCreateExpenses(expensesToCreate);
      } catch (error) {
        // Update import job with error
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
    const totalAmountCents = results
      .filter((r) => r.success && r.expenseData)
      .reduce((sum, r) => sum + (r.expenseData?.amountCents || 0), 0);
    const totalGstCents = results
      .filter((r) => r.success && r.expenseData)
      .reduce((sum, r) => sum + (r.expenseData?.gstCents || 0), 0);

    // Update import job
    const finalStatus =
      failedCount === 0
        ? ImportStatus.COMPLETED
        : successCount === 0
          ? ImportStatus.FAILED
          : ImportStatus.COMPLETED;

    await this.updateImportJob(importJob.id, {
      status: finalStatus,
      importedCount: successCount,
      errorCount: failedCount,
      completedAt: new Date(),
    });

    const processingTimeMs = Date.now() - startTime;
    this.logger.log(
      `Import job ${importJob.id}: ${successCount} success, ${failedCount} failed in ${processingTimeMs}ms`,
    );

    return {
      importJobId: importJob.id,
      totalRows: rows.length,
      successCount,
      failedCount,
      duplicateCount: results.filter((r) => r.isDuplicate).length,
      totalAmountCents,
      totalGstCents,
      processingTimeMs,
      rows: results,
    };
  }

  /**
   * Process a single CSV row.
   */
  private async processRow(
    row: ParsedCsvRow,
    providers: Provider[],
    providerNames: string[],
    categories: Category[],
    options: CsvImportOptions,
    importJobId: string,
  ): Promise<CsvRowResult> {
    // Match provider
    const providerMatch = this.providerMatcher.findBestMatch(
      row.itemName,
      providerNames,
      options.matchThreshold || 0.6,
    );

    if (!providerMatch) {
      return {
        rowNumber: row.rowNumber,
        success: false,
        error: `No matching provider found for "${row.itemName}"`,
        providerMatch: null,
      };
    }

    const provider = providers.find((p) => p.name === providerMatch.providerName);
    if (!provider) {
      return {
        rowNumber: row.rowNumber,
        success: false,
        error: `Provider "${providerMatch.providerName}" not found in database`,
        providerMatch,
      };
    }

    // Match category
    let category: Category | undefined;
    if (row.categoryName) {
      category = categories.find((c) => c.name.toLowerCase() === row.categoryName!.toLowerCase());
    }

    // Fall back to provider's default category or first category
    if (!category && provider.defaultCategoryId) {
      category = categories.find((c) => c.id === provider.defaultCategoryId);
    }

    if (!category) {
      // Try to match by keywords
      const keywords = this.providerMatcher.extractKeywords(row.itemName);
      category = categories.find((c) => keywords.some((k) => c.name.toLowerCase().includes(k)));
    }

    if (!category) {
      // Use first category as fallback (should have "Other" or similar)
      category = categories.find((c) => c.name.toLowerCase() === 'other');
      if (!category && categories.length > 0) {
        category = categories[0];
      }
    }

    if (!category) {
      return {
        rowNumber: row.rowNumber,
        success: false,
        error: 'No category found and no default category available',
        providerMatch,
      };
    }

    // Check for duplicates
    if (options.skipDuplicates !== false) {
      const isDuplicate = await this.isDuplicate(row.date, row.totalCents, provider.id);

      if (isDuplicate) {
        return {
          rowNumber: row.rowNumber,
          success: false,
          isDuplicate: true,
          error: 'Duplicate expense detected (same date, amount, provider)',
          providerMatch,
        };
      }
    }

    // Calculate GST if not provided or if international
    let gstCents = row.gstCents;
    if (provider.isInternational) {
      gstCents = 0; // International providers are GST-free
    } else if (gstCents === 0 && row.totalCents > 0) {
      // Auto-calculate GST for domestic providers
      gstCents = this.moneyService.calcGstFromTotal(row.totalCents);
    }

    // Store FULL amounts with bizPercent (applied at query time in BAS/Reports)
    // This matches the manual expense creation pattern and prevents double-application
    const bizPercent = row.bizPercent;

    const expenseData: Partial<Expense> = {
      date: row.date,
      amountCents: row.totalCents,
      gstCents: gstCents,
      bizPercent: bizPercent,
      providerId: provider.id,
      categoryId: category.id,
      description: row.description || row.itemName,
      importJobId,
    };

    return {
      rowNumber: row.rowNumber,
      success: true,
      providerMatch,
      categoryName: category.name,
      expenseData,
    };
  }

  /**
   * Check if an expense is a duplicate.
   */
  private async isDuplicate(date: Date, amountCents: number, providerId: string): Promise<boolean> {
    const existing = await this.expenseRepo.findOne({
      where: {
        date,
        amountCents,
        providerId,
      },
    });

    return !!existing;
  }

  /**
   * Bulk create expenses in a transaction.
   */
  private async bulkCreateExpenses(expenses: Partial<Expense>[]): Promise<Expense[]> {
    return this.dataSource.transaction(async (manager) => {
      const expenseEntities = expenses.map((e) => manager.create(Expense, e));
      return manager.save(expenseEntities);
    });
  }

  /**
   * Create a new import job.
   */
  private async createImportJob(source: string, totalRows: number): Promise<ImportJob> {
    const importSource = this.mapSourceToEnum(source);

    const job = this.importJobRepo.create({
      source: importSource,
      filename: `import-${Date.now()}.csv`,
      status: ImportStatus.PENDING,
      totalRows: totalRows,
      importedCount: 0,
      errorCount: 0,
    });

    return this.importJobRepo.save(job);
  }

  /**
   * Map source string to ImportSource enum.
   */
  private mapSourceToEnum(source: string): ImportSource {
    const sourceMap: Record<string, ImportSource> = {
      custom: ImportSource.MANUAL,
      commbank: ImportSource.COMMBANK,
      amex: ImportSource.OTHER,
      nab: ImportSource.NAB,
      westpac: ImportSource.WESTPAC,
      anz: ImportSource.ANZ,
      manual: ImportSource.MANUAL,
    };

    return sourceMap[source.toLowerCase()] || ImportSource.OTHER;
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
   * Preview import without creating expenses.
   * Useful for validating CSV before actual import.
   */
  async previewImport(
    content: string,
    options: Omit<CsvImportOptions, 'dryRun'>,
  ): Promise<CsvImportResult> {
    return this.importFromString(content, { ...options, dryRun: true });
  }
}
