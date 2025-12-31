import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Provider } from '../providers/entities/provider.entity';
import { Category } from '../categories/entities/category.entity';
import { MoneyService } from '../../common/services/money.service';

/**
 * Service for managing Expense entities.
 *
 * Handles CRUD operations with automatic GST calculation:
 * - Domestic providers: GST auto-calculated as amount / 11 if not provided
 * - International providers: GST always set to 0
 *
 * All monetary calculations use decimal.js via MoneyService to avoid floating-point errors.
 */
@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly moneyService: MoneyService,
  ) {}

  /**
   * Creates a new expense with automatic GST calculation.
   *
   * GST Logic:
   * - If provider is international: gstCents = 0 (overrides any provided value)
   * - If provider is domestic and gstCents not provided: auto-calculate as amount / 11
   * - If provider is domestic and gstCents provided: use provided value
   *
   * @param createExpenseDto - The expense data
   * @returns The created expense with provider and category relations
   * @throws NotFoundException if provider or category not found
   * @throws BadRequestException if gstCents > amountCents
   */
  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    // Validate provider exists
    const provider = await this.providerRepository.findOne({
      where: { id: createExpenseDto.providerId },
    });
    if (!provider) {
      throw new NotFoundException(`Provider with ID "${createExpenseDto.providerId}" not found`);
    }

    // Validate category exists
    const categoryExists = await this.categoryRepository.count({
      where: { id: createExpenseDto.categoryId },
    });
    if (categoryExists === 0) {
      throw new NotFoundException(`Category with ID "${createExpenseDto.categoryId}" not found`);
    }

    // Calculate GST based on provider type
    let gstCents: number;
    if (provider.isInternational) {
      // International providers are GST-free
      gstCents = 0;
    } else if (createExpenseDto.gstCents !== undefined) {
      // Use provided GST for domestic providers
      gstCents = createExpenseDto.gstCents;
    } else {
      // Auto-calculate GST for domestic providers (1/11 of total)
      gstCents = this.moneyService.calcGstFromTotal(createExpenseDto.amountCents);
    }

    // Validate GST doesn't exceed amount
    if (gstCents > createExpenseDto.amountCents) {
      throw new BadRequestException('GST cannot exceed the total amount');
    }

    const expense = this.expenseRepository.create({
      date: new Date(createExpenseDto.date),
      amountCents: createExpenseDto.amountCents,
      gstCents,
      bizPercent: createExpenseDto.bizPercent ?? 100,
      providerId: createExpenseDto.providerId,
      categoryId: createExpenseDto.categoryId,
      description: createExpenseDto.description ?? null,
      fileRef: createExpenseDto.fileRef ?? null,
      currency: 'AUD',
    });

    const saved = await this.expenseRepository.save(expense);

    // Return with relations loaded
    return this.findOne(saved.id);
  }

  /**
   * Retrieves all expenses with relations.
   *
   * @returns Array of all expenses, ordered by date descending
   */
  async findAll(): Promise<Expense[]> {
    return this.expenseRepository.find({
      relations: ['provider', 'category'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves a single expense by ID.
   *
   * @param id - The expense UUID
   * @returns The expense with provider and category relations
   * @throws NotFoundException if expense doesn't exist
   */
  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['provider', 'category'],
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }

    return expense;
  }

  /**
   * Finds expenses within a date range.
   *
   * @param startDate - Start of date range (inclusive)
   * @param endDate - End of date range (inclusive)
   * @returns Array of expenses within the range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return this.expenseRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      relations: ['provider', 'category'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Finds expenses by category.
   *
   * @param categoryId - The category UUID
   * @returns Array of expenses in the category
   */
  async findByCategory(categoryId: string): Promise<Expense[]> {
    return this.expenseRepository.find({
      where: { categoryId },
      relations: ['provider', 'category'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Finds expenses by provider.
   *
   * @param providerId - The provider UUID
   * @returns Array of expenses from the provider
   */
  async findByProvider(providerId: string): Promise<Expense[]> {
    return this.expenseRepository.find({
      where: { providerId },
      relations: ['provider', 'category'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Updates an existing expense.
   *
   * If providerId changes to an international provider, gstCents is reset to 0.
   *
   * @param id - The expense UUID
   * @param updateExpenseDto - The fields to update
   * @returns The updated expense
   * @throws NotFoundException if expense, provider, or category not found
   * @throws BadRequestException if gstCents > amountCents
   */
  async update(id: string, updateExpenseDto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id);

    // If provider is being changed, validate and recalculate GST
    if (updateExpenseDto.providerId && updateExpenseDto.providerId !== expense.providerId) {
      const newProvider = await this.providerRepository.findOne({
        where: { id: updateExpenseDto.providerId },
      });
      if (!newProvider) {
        throw new NotFoundException(`Provider with ID "${updateExpenseDto.providerId}" not found`);
      }

      // Reset GST to 0 for international providers
      if (newProvider.isInternational) {
        updateExpenseDto.gstCents = 0;
      }
    }

    // If category is being changed, validate it exists
    if (updateExpenseDto.categoryId && updateExpenseDto.categoryId !== expense.categoryId) {
      const categoryExists = await this.categoryRepository.count({
        where: { id: updateExpenseDto.categoryId },
      });
      if (categoryExists === 0) {
        throw new NotFoundException(`Category with ID "${updateExpenseDto.categoryId}" not found`);
      }
    }

    // Validate GST doesn't exceed amount
    const finalAmount = updateExpenseDto.amountCents ?? expense.amountCents;
    const finalGst = updateExpenseDto.gstCents ?? expense.gstCents;
    if (finalGst > finalAmount) {
      throw new BadRequestException('GST cannot exceed the total amount');
    }

    // Convert date string to Date object if provided
    if (updateExpenseDto.date) {
      Object.assign(expense, { date: new Date(updateExpenseDto.date) });
      delete updateExpenseDto.date;
    }

    Object.assign(expense, updateExpenseDto);

    await this.expenseRepository.save(expense);

    return this.findOne(id);
  }

  /**
   * Removes an expense.
   *
   * @param id - The expense UUID
   * @throws NotFoundException if expense doesn't exist
   */
  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);
    await this.expenseRepository.remove(expense);
  }

  /**
   * Checks if an expense exists by ID.
   *
   * @param id - The expense UUID
   * @returns true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.expenseRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Calculates the claimable GST for an expense.
   * Claimable GST = gstCents * (bizPercent / 100)
   *
   * @param expense - The expense entity
   * @returns Claimable GST in cents
   */
  calculateClaimableGst(expense: Expense): number {
    return this.moneyService.applyBizPercent(expense.gstCents, expense.bizPercent);
  }
}
