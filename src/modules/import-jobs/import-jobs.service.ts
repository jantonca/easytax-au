import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportJob, ImportStatus } from './entities/import-job.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { CreateImportJobDto } from './dto/create-import-job.dto';
import { UpdateImportJobDto } from './dto/update-import-job.dto';

/**
 * Service for managing import jobs.
 * Handles CRUD operations and rollback functionality.
 */
@Injectable()
export class ImportJobsService {
  constructor(
    @InjectRepository(ImportJob)
    private readonly importJobRepository: Repository<ImportJob>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  /**
   * Create a new import job.
   * @param createDto - Import job creation data
   * @returns The created import job
   */
  async create(createDto: CreateImportJobDto): Promise<ImportJob> {
    const importJob = this.importJobRepository.create(createDto);
    return this.importJobRepository.save(importJob);
  }

  /**
   * Find all import jobs with pagination.
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Paginated list of import jobs
   */
  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: ImportJob[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.importJobRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /**
   * Find a single import job by ID.
   * @param id - Import job UUID
   * @returns The import job
   * @throws NotFoundException if not found
   */
  async findOne(id: string): Promise<ImportJob> {
    const importJob = await this.importJobRepository.findOne({
      where: { id },
    });

    if (!importJob) {
      throw new NotFoundException(`Import job with ID "${id}" not found`);
    }

    return importJob;
  }

  /**
   * Find a single import job by ID with its expenses.
   * @param id - Import job UUID
   * @returns The import job with expenses loaded
   * @throws NotFoundException if not found
   */
  async findOneWithExpenses(id: string): Promise<ImportJob> {
    const importJob = await this.importJobRepository.findOne({
      where: { id },
      relations: ['expenses'],
    });

    if (!importJob) {
      throw new NotFoundException(`Import job with ID "${id}" not found`);
    }

    return importJob;
  }

  /**
   * Update an import job.
   * @param id - Import job UUID
   * @param updateDto - Update data
   * @returns The updated import job
   * @throws NotFoundException if not found
   */
  async update(id: string, updateDto: UpdateImportJobDto): Promise<ImportJob> {
    const importJob = await this.findOne(id);

    Object.assign(importJob, updateDto);

    return this.importJobRepository.save(importJob);
  }

  /**
   * Mark an import job as completed.
   * @param id - Import job UUID
   * @param counts - Final import counts
   * @returns The updated import job
   */
  async markCompleted(
    id: string,
    counts: { importedCount: number; skippedCount: number; errorCount: number },
  ): Promise<ImportJob> {
    const importJob = await this.findOne(id);

    importJob.status = ImportStatus.COMPLETED;
    importJob.importedCount = counts.importedCount;
    importJob.skippedCount = counts.skippedCount;
    importJob.errorCount = counts.errorCount;
    importJob.completedAt = new Date();

    return this.importJobRepository.save(importJob);
  }

  /**
   * Mark an import job as failed.
   * @param id - Import job UUID
   * @param errorMessage - Error description
   * @returns The updated import job
   */
  async markFailed(id: string, errorMessage: string): Promise<ImportJob> {
    const importJob = await this.findOne(id);

    importJob.status = ImportStatus.FAILED;
    importJob.errorMessage = errorMessage;
    importJob.completedAt = new Date();

    return this.importJobRepository.save(importJob);
  }

  /**
   * Rollback an import job by deleting all its expenses.
   * This is a hard delete - expenses are permanently removed.
   *
   * @param id - Import job UUID
   * @returns Number of expenses deleted
   * @throws NotFoundException if import job not found
   * @throws BadRequestException if import job was already rolled back
   */
  async rollback(id: string): Promise<{ deletedCount: number }> {
    const importJob = await this.findOne(id);

    if (importJob.status === ImportStatus.ROLLED_BACK) {
      throw new BadRequestException(`Import job "${id}" has already been rolled back`);
    }

    // Delete all expenses associated with this import job
    const result = await this.expenseRepository.delete({
      importJobId: id,
    });

    // Update import job status
    importJob.status = ImportStatus.ROLLED_BACK;
    importJob.completedAt = new Date();
    await this.importJobRepository.save(importJob);

    return { deletedCount: result.affected ?? 0 };
  }

  /**
   * Delete an import job.
   * Only allowed if the import job has no associated expenses.
   *
   * @param id - Import job UUID
   * @throws NotFoundException if not found
   * @throws BadRequestException if import job has expenses
   */
  async remove(id: string): Promise<void> {
    const importJob = await this.findOne(id);

    // Check if there are any expenses associated with this import job
    const expenseCount = await this.expenseRepository.count({
      where: { importJobId: id },
    });

    if (expenseCount > 0) {
      throw new BadRequestException(
        `Cannot delete import job with ${expenseCount} associated expenses. Rollback first.`,
      );
    }

    await this.importJobRepository.remove(importJob);
  }

  /**
   * Get statistics for an import job.
   * @param id - Import job UUID
   * @returns Import statistics
   */
  async getStatistics(id: string): Promise<{
    totalExpenses: number;
    totalAmountCents: number;
    totalGstCents: number;
  }> {
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('COUNT(*)', 'totalExpenses')
      .addSelect('COALESCE(SUM(expense.amount_cents), 0)', 'totalAmountCents')
      .addSelect('COALESCE(SUM(expense.gst_cents), 0)', 'totalGstCents')
      .where('expense.import_job_id = :id', { id })
      .getRawOne<{
        totalExpenses: string;
        totalAmountCents: string;
        totalGstCents: string;
      }>();

    return {
      totalExpenses: parseInt(result?.totalExpenses ?? '0', 10),
      totalAmountCents: parseInt(result?.totalAmountCents ?? '0', 10),
      totalGstCents: parseInt(result?.totalGstCents ?? '0', 10),
    };
  }
}
