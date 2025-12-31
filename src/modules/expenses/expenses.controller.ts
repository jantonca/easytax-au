import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';

/**
 * REST controller for Expense entity operations.
 *
 * Expenses are business purchases with automatic GST handling:
 * - International providers: GST always 0
 * - Domestic providers: GST auto-calculated if not provided
 *
 * @route /expenses
 *
 * @example
 * ```
 * POST   /expenses                    - Create a new expense
 * GET    /expenses                    - List all expenses
 * GET    /expenses?categoryId=uuid    - Filter by category
 * GET    /expenses?providerId=uuid    - Filter by provider
 * GET    /expenses?startDate=&endDate= - Filter by date range
 * GET    /expenses/:id                - Get a specific expense
 * PATCH  /expenses/:id                - Update an expense
 * DELETE /expenses/:id                - Delete an expense
 * ```
 */
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  /**
   * Creates a new expense with automatic GST calculation.
   *
   * @route POST /expenses
   * @param createExpenseDto - The expense data
   * @returns The created expense with provider and category
   */
  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto): Promise<Expense> {
    return this.expensesService.create(createExpenseDto);
  }

  /**
   * Retrieves all expenses with optional filtering.
   *
   * @route GET /expenses
   * @route GET /expenses?categoryId=uuid
   * @route GET /expenses?providerId=uuid
   * @route GET /expenses?startDate=2024-01-01&endDate=2024-03-31
   * @param categoryId - Optional filter by category UUID
   * @param providerId - Optional filter by provider UUID
   * @param startDate - Optional start date for range filter (ISO 8601)
   * @param endDate - Optional end date for range filter (ISO 8601)
   * @returns Array of expenses
   */
  @Get()
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('providerId') providerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Expense[]> {
    // Filter by category
    if (categoryId) {
      return this.expensesService.findByCategory(categoryId);
    }

    // Filter by provider
    if (providerId) {
      return this.expensesService.findByProvider(providerId);
    }

    // Filter by date range
    if (startDate && endDate) {
      return this.expensesService.findByDateRange(new Date(startDate), new Date(endDate));
    }

    // Return all
    return this.expensesService.findAll();
  }

  /**
   * Retrieves a single expense by ID.
   *
   * @route GET /expenses/:id
   * @param id - The expense UUID
   * @returns The expense with provider and category
   * @throws NotFoundException if expense doesn't exist
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Expense> {
    return this.expensesService.findOne(id);
  }

  /**
   * Updates an existing expense.
   *
   * @route PATCH /expenses/:id
   * @param id - The expense UUID
   * @param updateExpenseDto - The fields to update
   * @returns The updated expense
   * @throws NotFoundException if expense doesn't exist
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    return this.expensesService.update(id, updateExpenseDto);
  }

  /**
   * Removes an expense.
   *
   * @route DELETE /expenses/:id
   * @param id - The expense UUID
   * @throws NotFoundException if expense doesn't exist
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.expensesService.remove(id);
  }
}
