import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { RecurringExpense, RecurringSchedule } from './entities/recurring-expense.entity';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import {
  RecurringExpenseResponseDto,
  GenerateExpensesResultDto,
} from './dto/recurring-expense-response.dto';
import { Expense } from '../expenses/entities/expense.entity';
import { Provider } from '../providers/entities/provider.entity';
import { Category } from '../categories/entities/category.entity';
import { MoneyService } from '../../common/services/money.service';

/**
 * Service for managing recurring expense templates and generating expenses.
 *
 * Handles CRUD operations for recurring expense templates and the logic
 * for generating actual expenses based on schedules.
 *
 * GST Calculation:
 * - Domestic providers: GST auto-calculated as amount / 11 if not provided
 * - International providers: GST always set to 0
 */
@Injectable()
export class RecurringExpensesService {
  constructor(
    @InjectRepository(RecurringExpense)
    private readonly recurringExpenseRepository: Repository<RecurringExpense>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly moneyService: MoneyService,
  ) {}

  /**
   * Creates a new recurring expense template.
   *
   * @param dto - The recurring expense data
   * @returns The created recurring expense
   * @throws NotFoundException if provider or category not found
   * @throws BadRequestException if validation fails
   */
  async create(dto: CreateRecurringExpenseDto): Promise<RecurringExpense> {
    // Validate provider exists
    const provider = await this.providerRepository.findOne({
      where: { id: dto.providerId },
    });
    if (!provider) {
      throw new NotFoundException(`Provider with ID "${dto.providerId}" not found`);
    }

    // Validate category exists
    const categoryExists = await this.categoryRepository.count({
      where: { id: dto.categoryId },
    });
    if (categoryExists === 0) {
      throw new NotFoundException(`Category with ID "${dto.categoryId}" not found`);
    }

    // Calculate GST based on provider type
    let gstCents: number;
    if (provider.isInternational) {
      gstCents = 0;
    } else if (dto.gstCents !== undefined) {
      gstCents = dto.gstCents;
    } else {
      gstCents = this.moneyService.calcGstFromTotal(dto.amountCents);
    }

    // Validate GST doesn't exceed amount
    if (gstCents > dto.amountCents) {
      throw new BadRequestException('GST cannot exceed the total amount');
    }

    // Validate end date is after start date
    if (dto.endDate && new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    // Calculate initial next due date
    const nextDueDate = this.calculateNextDueDate(
      new Date(dto.startDate),
      dto.schedule,
      dto.dayOfMonth ?? 1,
      null,
    );

    const recurringExpense = this.recurringExpenseRepository.create({
      name: dto.name,
      description: dto.description,
      amountCents: dto.amountCents,
      gstCents,
      bizPercent: dto.bizPercent ?? 100,
      currency: dto.currency ?? 'AUD',
      schedule: dto.schedule,
      dayOfMonth: dto.dayOfMonth ?? 1,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      isActive: dto.isActive ?? true,
      nextDueDate,
      providerId: dto.providerId,
      categoryId: dto.categoryId,
    });

    return this.recurringExpenseRepository.save(recurringExpense);
  }

  /**
   * Finds all recurring expense templates.
   *
   * @param activeOnly - If true, only return active templates
   * @returns Array of recurring expenses with relations
   */
  async findAll(activeOnly = false): Promise<RecurringExpense[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.recurringExpenseRepository.find({
      where,
      relations: ['provider', 'category'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Finds a single recurring expense by ID.
   *
   * @param id - The recurring expense UUID
   * @returns The recurring expense with relations
   * @throws NotFoundException if not found
   */
  async findOne(id: string): Promise<RecurringExpense> {
    const recurringExpense = await this.recurringExpenseRepository.findOne({
      where: { id },
      relations: ['provider', 'category'],
    });
    if (!recurringExpense) {
      throw new NotFoundException(`Recurring expense with ID "${id}" not found`);
    }
    return recurringExpense;
  }

  /**
   * Updates an existing recurring expense template.
   *
   * @param id - The recurring expense UUID
   * @param dto - The update data
   * @returns The updated recurring expense
   * @throws NotFoundException if not found
   * @throws BadRequestException if validation fails
   */
  async update(id: string, dto: UpdateRecurringExpenseDto): Promise<RecurringExpense> {
    const existing = await this.findOne(id);

    // If changing provider, recalculate GST
    if (dto.providerId && dto.providerId !== existing.providerId) {
      const provider = await this.providerRepository.findOne({
        where: { id: dto.providerId },
      });
      if (!provider) {
        throw new NotFoundException(`Provider with ID "${dto.providerId}" not found`);
      }

      const amountCents = dto.amountCents ?? existing.amountCents;
      if (provider.isInternational) {
        dto.gstCents = 0;
      } else if (dto.gstCents === undefined) {
        dto.gstCents = this.moneyService.calcGstFromTotal(amountCents);
      }
    }

    // If changing category, validate it exists
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const categoryExists = await this.categoryRepository.count({
        where: { id: dto.categoryId },
      });
      if (categoryExists === 0) {
        throw new NotFoundException(`Category with ID "${dto.categoryId}" not found`);
      }
    }

    // Validate GST doesn't exceed amount
    const finalGst = dto.gstCents ?? existing.gstCents;
    const finalAmount = dto.amountCents ?? existing.amountCents;
    if (finalGst > finalAmount) {
      throw new BadRequestException('GST cannot exceed the total amount');
    }

    // Handle date validations
    const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    if (endDate && endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Recalculate next due date if schedule-related fields changed
    if (dto.schedule || dto.dayOfMonth || dto.startDate) {
      const schedule = dto.schedule ?? existing.schedule;
      const dayOfMonth = dto.dayOfMonth ?? existing.dayOfMonth;
      const lastGenerated = existing.lastGeneratedDate;

      existing.nextDueDate = this.calculateNextDueDate(
        startDate,
        schedule,
        dayOfMonth,
        lastGenerated,
      );
    }

    // Merge and save
    Object.assign(existing, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : existing.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : existing.endDate,
    });

    return this.recurringExpenseRepository.save(existing);
  }

  /**
   * Deletes a recurring expense template.
   *
   * @param id - The recurring expense UUID
   * @throws NotFoundException if not found
   */
  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    await this.recurringExpenseRepository.remove(existing);
  }

  /**
   * Generates expenses for all due recurring expense templates.
   *
   * Only generates expenses where:
   * - Template is active
   * - nextDueDate <= asOfDate
   * - endDate is null or >= nextDueDate
   *
   * @param asOfDate - Generate expenses up to this date (defaults to today)
   * @returns Result with generated expense details
   */
  async generateExpenses(asOfDate?: Date): Promise<GenerateExpensesResultDto> {
    const targetDate = asOfDate ?? new Date();

    // Find all due recurring expenses
    const dueRecurring = await this.recurringExpenseRepository.find({
      where: {
        isActive: true,
        nextDueDate: LessThanOrEqual(targetDate),
      },
      relations: ['provider', 'category'],
    });

    const result: GenerateExpensesResultDto = {
      generated: 0,
      skipped: 0,
      expenseIds: [],
      details: [],
    };

    for (const recurring of dueRecurring) {
      // Skip if past end date
      if (recurring.endDate && recurring.nextDueDate > recurring.endDate) {
        result.skipped++;
        continue;
      }

      // Generate expense for next due date
      const expenseDate = recurring.nextDueDate;

      const expense = this.expenseRepository.create({
        date: expenseDate,
        description: recurring.description ?? `${recurring.name} - Auto-generated`,
        amountCents: recurring.amountCents,
        gstCents: recurring.gstCents,
        bizPercent: recurring.bizPercent,
        currency: recurring.currency,
        providerId: recurring.providerId,
        categoryId: recurring.categoryId,
      });

      const savedExpense = await this.expenseRepository.save(expense);

      // Update recurring expense tracking
      recurring.lastGeneratedDate = expenseDate;
      recurring.nextDueDate = this.calculateNextDueDate(
        recurring.startDate,
        recurring.schedule,
        recurring.dayOfMonth,
        expenseDate,
      );
      await this.recurringExpenseRepository.save(recurring);

      result.generated++;
      result.expenseIds.push(savedExpense.id);
      result.details.push({
        recurringExpenseId: recurring.id,
        recurringExpenseName: recurring.name,
        expenseId: savedExpense.id,
        date: this.formatDate(expenseDate),
        amountCents: savedExpense.amountCents,
      });
    }

    return result;
  }

  /**
   * Finds all recurring expenses that are due for generation.
   *
   * @param asOfDate - Check due dates up to this date
   * @returns Array of due recurring expenses
   */
  async findDue(asOfDate?: Date): Promise<RecurringExpense[]> {
    const targetDate = asOfDate ?? new Date();
    return this.recurringExpenseRepository.find({
      where: {
        isActive: true,
        nextDueDate: LessThanOrEqual(targetDate),
      },
      relations: ['provider', 'category'],
      order: { nextDueDate: 'ASC' },
    });
  }

  /**
   * Calculates the next due date based on schedule.
   *
   * @param startDate - When the recurring expense starts
   * @param schedule - monthly, quarterly, or yearly
   * @param dayOfMonth - Day of month (1-28)
   * @param lastGenerated - Date of last generated expense (null if none)
   * @returns The next due date
   */
  calculateNextDueDate(
    startDate: Date,
    schedule: RecurringSchedule,
    dayOfMonth: number,
    lastGenerated: Date | null,
  ): Date {
    // If never generated, start from the start date
    if (!lastGenerated) {
      const nextDate = new Date(startDate);
      nextDate.setDate(dayOfMonth);

      // If the dayOfMonth already passed in start month, move to next period
      if (nextDate < startDate) {
        return this.addSchedulePeriod(nextDate, schedule);
      }
      return nextDate;
    }

    // Otherwise, add the schedule period to last generated
    const baseDate = new Date(lastGenerated);
    baseDate.setDate(dayOfMonth);
    return this.addSchedulePeriod(baseDate, schedule);
  }

  /**
   * Adds one schedule period to a date.
   *
   * @param date - The base date
   * @param schedule - The schedule type
   * @returns New date with added period
   */
  private addSchedulePeriod(date: Date, schedule: RecurringSchedule): Date {
    const result = new Date(date);
    switch (schedule) {
      case RecurringSchedule.MONTHLY:
        result.setMonth(result.getMonth() + 1);
        break;
      case RecurringSchedule.QUARTERLY:
        result.setMonth(result.getMonth() + 3);
        break;
      case RecurringSchedule.YEARLY:
        result.setFullYear(result.getFullYear() + 1);
        break;
    }
    return result;
  }

  /**
   * Converts a RecurringExpense entity to a response DTO.
   *
   * @param entity - The recurring expense entity
   * @returns Formatted response DTO
   */
  toResponseDto(entity: RecurringExpense): RecurringExpenseResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      amountCents: entity.amountCents,
      gstCents: entity.gstCents,
      bizPercent: entity.bizPercent,
      currency: entity.currency,
      schedule: entity.schedule,
      dayOfMonth: entity.dayOfMonth,
      startDate: this.formatDate(entity.startDate),
      endDate: entity.endDate ? this.formatDate(entity.endDate) : null,
      isActive: entity.isActive,
      lastGeneratedDate: entity.lastGeneratedDate
        ? this.formatDate(entity.lastGeneratedDate)
        : null,
      nextDueDate: this.formatDate(entity.nextDueDate),
      providerId: entity.providerId,
      providerName: entity.provider?.name,
      categoryId: entity.categoryId,
      categoryName: entity.category?.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Formats a Date to YYYY-MM-DD string.
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
