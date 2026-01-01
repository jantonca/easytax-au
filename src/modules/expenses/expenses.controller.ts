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
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';

/**
 * REST controller for Expense entity operations.
 *
 * Expenses are business purchases with automatic GST handling:
 * - International providers: GST always 0
 * - Domestic providers: GST auto-calculated if not provided
 *
 * All responses include computed FY/Quarter information based on expense date.
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
@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  /**
   * Creates a new expense with automatic GST calculation.
   *
   * @route POST /expenses
   * @param createExpenseDto - The expense data
   * @returns The created expense with provider, category, and FY/Quarter info
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new expense',
    description:
      'Creates an expense with automatic GST handling. International providers get GST=0, domestic auto-calculate GST if not provided. Response includes computed FY/Quarter fields.',
  })
  @ApiCreatedResponse({ description: 'Expense created successfully', type: ExpenseResponseDto })
  async create(@Body() createExpenseDto: CreateExpenseDto): Promise<ExpenseResponseDto> {
    const expense = await this.expensesService.create(createExpenseDto);
    return this.expensesService.toResponseDto(expense);
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
   * @returns Array of expenses with FY/Quarter info
   */
  @Get()
  @ApiOperation({ summary: 'Get all expenses with optional filtering' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category UUID' })
  @ApiQuery({ name: 'providerId', required: false, description: 'Filter by provider UUID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiOkResponse({
    description: 'List of expenses with FY/Quarter info',
    type: [ExpenseResponseDto],
  })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('providerId') providerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ExpenseResponseDto[]> {
    let expenses;

    // Filter by category
    if (categoryId) {
      expenses = await this.expensesService.findByCategory(categoryId);
    }
    // Filter by provider
    else if (providerId) {
      expenses = await this.expensesService.findByProvider(providerId);
    }
    // Filter by date range
    else if (startDate && endDate) {
      expenses = await this.expensesService.findByDateRange(new Date(startDate), new Date(endDate));
    }
    // Return all
    else {
      expenses = await this.expensesService.findAll();
    }

    return this.expensesService.toResponseDtoArray(expenses);
  }

  /**
   * Retrieves a single expense by ID.
   *
   * @route GET /expenses/:id
   * @param id - The expense UUID
   * @returns The expense with provider, category, and FY/Quarter info
   * @throws NotFoundException if expense doesn't exist
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an expense by ID' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiOkResponse({ description: 'The expense with FY/Quarter info', type: ExpenseResponseDto })
  @ApiNotFoundResponse({ description: 'Expense not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ExpenseResponseDto> {
    const expense = await this.expensesService.findOne(id);
    return this.expensesService.toResponseDto(expense);
  }

  /**
   * Updates an existing expense.
   *
   * @route PATCH /expenses/:id
   * @param id - The expense UUID
   * @param updateExpenseDto - The fields to update
   * @returns The updated expense with FY/Quarter info
   * @throws NotFoundException if expense doesn't exist
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiOkResponse({ description: 'Expense updated successfully', type: ExpenseResponseDto })
  @ApiNotFoundResponse({ description: 'Expense not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expensesService.update(id, updateExpenseDto);
    return this.expensesService.toResponseDto(expense);
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
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiNoContentResponse({ description: 'Expense deleted successfully' })
  @ApiNotFoundResponse({ description: 'Expense not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.expensesService.remove(id);
  }
}
