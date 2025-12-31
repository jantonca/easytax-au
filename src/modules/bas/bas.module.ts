import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BasController } from './bas.controller';
import { BasService } from './bas.service';
import { Income } from '../incomes/entities/income.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { CommonModule } from '../../common/common.module';

/**
 * BAS (Business Activity Statement) Module.
 *
 * Provides quarterly GST reporting functionality following
 * Australian Tax Office requirements.
 *
 * **Key Calculations:**
 * - G1: Total sales (SUM of income.total_cents)
 * - 1A: GST collected (SUM of income.gst_cents)
 * - 1B: GST paid (SUM of expense.gst_cents * biz_percent / 100, domestic only)
 *
 * **Dependencies:**
 * This module imports Income and Expense entities directly via TypeOrmModule.forFeature()
 * rather than importing IncomesModule/ExpensesModule to avoid circular dependencies.
 *
 * @see AGENTS.md for circular dependency prevention guidelines
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Income, Expense]),
    CommonModule, // For MoneyService
  ],
  controllers: [BasController],
  providers: [BasService],
  exports: [BasService],
})
export class BasModule {}
