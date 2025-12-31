import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportJobsService } from './import-jobs.service';
import { ImportJobsController } from './import-jobs.controller';
import { ImportJob } from './entities/import-job.entity';
import { Expense } from '../expenses/entities/expense.entity';

/**
 * Module for managing CSV import jobs.
 *
 * Features:
 * - Track import batches with statistics
 * - Rollback imports (delete all expenses from a batch)
 * - View import history
 */
@Module({
  imports: [TypeOrmModule.forFeature([ImportJob, Expense])],
  controllers: [ImportJobsController],
  providers: [ImportJobsService],
  exports: [ImportJobsService],
})
export class ImportJobsModule {}
