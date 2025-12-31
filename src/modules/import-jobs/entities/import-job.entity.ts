import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Expense } from '../../expenses/entities/expense.entity';

/**
 * Bank source for CSV imports.
 * Used to determine column mapping and parsing rules.
 */
export enum ImportSource {
  /** Commonwealth Bank of Australia */
  COMMBANK = 'commbank',
  /** National Australia Bank */
  NAB = 'nab',
  /** Westpac Banking Corporation */
  WESTPAC = 'westpac',
  /** Australia and New Zealand Banking Group */
  ANZ = 'anz',
  /** Manually entered import (custom CSV) */
  MANUAL = 'manual',
  /** Other bank or source */
  OTHER = 'other',
}

/**
 * Import job status tracking.
 */
export enum ImportStatus {
  /** Import is being processed */
  PENDING = 'pending',
  /** Import completed successfully */
  COMPLETED = 'completed',
  /** Import was rolled back (all expenses deleted) */
  ROLLED_BACK = 'rolled_back',
  /** Import failed with errors */
  FAILED = 'failed',
}

/**
 * ImportJob entity for tracking CSV import batches.
 *
 * Allows:
 * - Tracking which expenses came from which import
 * - Rolling back entire imports (hard delete)
 * - Viewing import history and statistics
 *
 * @example
 * ```typescript
 * const importJob = new ImportJob();
 * importJob.filename = 'commbank-2025-q1.csv';
 * importJob.source = ImportSource.COMMBANK;
 * importJob.status = ImportStatus.PENDING;
 * ```
 */
@Entity('import_jobs')
@Index('idx_import_jobs_status', ['status'])
@Index('idx_import_jobs_created', ['createdAt'])
export class ImportJob extends BaseEntity {
  /**
   * Original filename of the imported CSV.
   * @example "commbank-transactions-2025-01.csv"
   */
  @Column({ type: 'varchar', length: 255 })
  filename!: string;

  /**
   * Bank or source of the CSV file.
   * Determines column mapping and parsing rules.
   */
  @Column({
    type: 'enum',
    enum: ImportSource,
    default: ImportSource.MANUAL,
  })
  source!: ImportSource;

  /**
   * Current status of the import job.
   */
  @Column({
    type: 'enum',
    enum: ImportStatus,
    default: ImportStatus.PENDING,
  })
  status!: ImportStatus;

  /**
   * Total number of rows in the CSV file.
   */
  @Column({ name: 'total_rows', type: 'integer', default: 0 })
  totalRows!: number;

  /**
   * Number of expenses successfully imported.
   */
  @Column({ name: 'imported_count', type: 'integer', default: 0 })
  importedCount!: number;

  /**
   * Number of rows skipped (duplicates or filtered out).
   */
  @Column({ name: 'skipped_count', type: 'integer', default: 0 })
  skippedCount!: number;

  /**
   * Number of rows that failed to import.
   */
  @Column({ name: 'error_count', type: 'integer', default: 0 })
  errorCount!: number;

  /**
   * Timestamp when the import completed or failed.
   * Null while status is PENDING.
   */
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  /**
   * Error message if import failed.
   */
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  /**
   * Expenses created by this import job.
   * Used for rollback functionality.
   */
  @OneToMany(() => Expense, (expense: Expense) => expense.importJob)
  expenses?: Expense[];
}
