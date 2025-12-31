import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { Provider } from '../providers/entities/provider.entity';
import { Category } from '../categories/entities/category.entity';
import { CommonModule } from '../../common/common.module';

/**
 * Module for managing Expense entities.
 *
 * Expenses are business purchases with:
 * - Automatic GST calculation based on provider type
 * - Encrypted description field
 * - Business use percentage tracking
 *
 * @provides ExpensesService
 * @exports ExpensesService, TypeOrmModule (for Expense entity)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Expense, Provider, Category]), CommonModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService, TypeOrmModule],
})
export class ExpensesModule {}
