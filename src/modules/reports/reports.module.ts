import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PdfService } from './pdf.service';
import { Income } from '../incomes/entities/income.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Category } from '../categories/entities/category.entity';
import { CommonModule } from '../../common/common.module';
import { BasModule } from '../bas/bas.module';

/**
 * Module for financial reporting.
 *
 * Provides FY summaries, PDF exports, and other reports for tax return preparation.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Income, Expense, Category]), CommonModule, BasModule],
  controllers: [ReportsController],
  providers: [ReportsService, PdfService],
  exports: [ReportsService, PdfService],
})
export class ReportsModule {}
