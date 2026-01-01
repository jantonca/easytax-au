import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringExpensesController } from './recurring-expenses.controller';
import { RecurringExpensesService } from './recurring-expenses.service';
import { RecurringExpense } from './entities/recurring-expense.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Provider } from '../providers/entities/provider.entity';
import { Category } from '../categories/entities/category.entity';
import { CommonModule } from '../../common/common.module';

/**
 * Module for managing recurring expense templates.
 *
 * Provides functionality to:
 * - Create recurring expense templates (monthly, quarterly, yearly)
 * - Generate actual expenses from templates
 * - Track generation history and next due dates
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([RecurringExpense, Expense, Provider, Category]),
    CommonModule,
  ],
  controllers: [RecurringExpensesController],
  providers: [RecurringExpensesService],
  exports: [RecurringExpensesService],
})
export class RecurringExpensesModule {}
